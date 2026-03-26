// backend/routes/usuarios.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// GET - Obtener todos los usuarios
// ============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/usuarios');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    id, usuario, nombre, email, rol, activo, 
                    cargo, departamento, telefono, rut,
                    fecha_creacion, ultimo_acceso
                FROM INV.usuarios
                WHERE id != 1
                ORDER BY nombre ASC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Error en GET /usuarios:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: []
        });
    }
});

// ============================================
// GET - Obtener usuario por ID
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/usuarios/${id}`);
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    id, usuario, nombre, email, rol, activo, 
                    cargo, departamento, telefono, rut,
                    fecha_creacion, ultimo_acceso
                FROM INV.usuarios
                WHERE id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('❌ Error en GET /usuarios/:id:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// POST - Crear nuevo usuario
// ============================================
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 POST /api/usuarios');
        console.log('Body:', req.body);
        
        const { usuario, password, nombre, email, rol, cargo, departamento, telefono, rut } = req.body;
        
        if (!usuario || !password || !nombre || !email) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: usuario, password, nombre, email'
            });
        }
        
        const pool = await getConnection();
        
        // Verificar si el usuario ya existe
        const checkUser = await pool.request()
            .input('usuario', sql.NVarChar, usuario)
            .query(`SELECT id FROM INV.usuarios WHERE usuario = @usuario`);
        
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya existe'
            });
        }
        
        // Verificar si el email ya existe
        const checkEmail = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`SELECT id FROM INV.usuarios WHERE email = @email`);
        
        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insertar usuario
        const result = await pool.request()
            .input('usuario', sql.NVarChar, usuario)
            .input('contraseña', sql.NVarChar, hashedPassword)
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('rol', sql.NVarChar, rol || 'usuario')
            .input('activo', sql.Bit, true)
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('rut', sql.NVarChar, rut || '')
            .input('fecha_creacion', sql.DateTime, new Date())
            .query(`
                INSERT INTO INV.usuarios (
                    usuario, contraseña, nombre, email, rol, activo, 
                    cargo, departamento, telefono, rut, fecha_creacion
                ) VALUES (
                    @usuario, @contraseña, @nombre, @email, @rol, @activo,
                    @cargo, @departamento, @telefono, @rut, @fecha_creacion
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        const userId = result.recordset[0].id;
        
        res.json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id: userId,
                usuario,
                nombre,
                email,
                rol
            }
        });
        
    } catch (error) {
        console.error('❌ Error en POST /usuarios:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// PUT - Actualizar usuario
// ============================================
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 PUT /api/usuarios/${id}`);
        console.log('Body:', req.body);
        
        const { nombre, email, rol, activo, cargo, departamento, telefono, rut } = req.body;
        
        const pool = await getConnection();
        
        // Verificar si el usuario existe
        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT id FROM INV.usuarios WHERE id = @id`);
        
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Actualizar usuario
        await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('rol', sql.NVarChar, rol)
            .input('activo', sql.Bit, activo)
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('rut', sql.NVarChar, rut || '')
            .input('fecha_actualizacion', sql.DateTime, new Date())
            .query(`
                UPDATE INV.usuarios 
                SET nombre = @nombre,
                    email = @email,
                    rol = @rol,
                    activo = @activo,
                    cargo = @cargo,
                    departamento = @departamento,
                    telefono = @telefono,
                    rut = @rut,
                    fecha_actualizacion = @fecha_actualizacion
                WHERE id = @id
            `);
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error en PUT /usuarios/:id:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// PUT - Cambiar contraseña
// ============================================
router.put('/:id/cambiar-password', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        console.log(`📥 PUT /api/usuarios/${id}/cambiar-password`);
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña es requerida'
            });
        }
        
        const pool = await getConnection();
        
        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('contraseña', sql.NVarChar, hashedPassword)
            .query(`
                UPDATE INV.usuarios 
                SET contraseña = @contraseña
                WHERE id = @id
            `);
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error en PUT /usuarios/:id/cambiar-password:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// DELETE - Eliminar usuario (desactivar)
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 DELETE /api/usuarios/${id}`);
        
        const pool = await getConnection();
        
        // Verificar si el usuario existe
        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT id FROM INV.usuarios WHERE id = @id`);
        
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Desactivar usuario (no eliminar físicamente)
        await pool.request()
            .input('id', sql.Int, id)
            .input('activo', sql.Bit, false)
            .query(`
                UPDATE INV.usuarios 
                SET activo = @activo
                WHERE id = @id
            `);
        
        res.json({
            success: true,
            message: 'Usuario desactivado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error en DELETE /usuarios/:id:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// GET - Obtener perfil del usuario actual
// ============================================
router.get('/perfil/actual', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/usuarios/perfil/actual');
        
        const userId = req.user.id;
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query(`
                SELECT 
                    id, usuario, nombre, email, rol, activo, 
                    cargo, departamento, telefono, rut,
                    fecha_creacion, ultimo_acceso
                FROM INV.usuarios
                WHERE id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('❌ Error en GET /usuarios/perfil/actual:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// GET - Obtener estadísticas de usuarios
// ============================================
router.get('/estadisticas/resumen', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/usuarios/estadisticas/resumen');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as usuarios_activos,
                    SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as administradores,
                    SUM(CASE WHEN rol = 'usuario' THEN 1 ELSE 0 END) as usuarios_estandar
                FROM INV.usuarios
                WHERE id != 1
            `);
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
        
    } catch (error) {
        console.error('❌ Error en GET /usuarios/estadisticas/resumen:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {
                total_usuarios: 0,
                usuarios_activos: 0,
                administradores: 0,
                usuarios_estandar: 0
            }
        });
    }
});

module.exports = router;