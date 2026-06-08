// backend/models/usuarioModel.js - VERSIÓN CORREGIDA PARA TU TABLA
const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioModel {
    /**
     * Crear nuevo usuario
     */
    async create(userData) {
        try {
            console.log('📝 UsuarioModel.create - Datos recibidos:', {
                ...userData,
                password: userData.password ? '***' : 'UNDEFINED'
            });

            if (!userData.password) {
                throw new Error('La contraseña es requerida para crear el usuario');
            }

            const pool = await getConnection();
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            console.log('✅ Contraseña hasheada correctamente');

            const result = await pool.request()
                .input('usuario', sql.NVarChar, userData.usuario)
                .input('contraseña', sql.NVarChar, hashedPassword)
                .input('nombre', sql.NVarChar, userData.nombre || '')
                .input('email', sql.NVarChar, userData.email || '')
                .input('cargo', sql.NVarChar, userData.cargo || '')
                .input('departamento', sql.NVarChar, userData.departamento || '')
                .input('rol', sql.NVarChar, userData.rol || 'usuario')
                .input('rut', sql.NVarChar, userData.rut || '')
                .input('activo', sql.Bit, userData.activo !== false)
                .query(`
                    INSERT INTO INV.usuarios (
                        usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo, fecha_creacion
                    )
                    VALUES (
                        @usuario, @contraseña, @nombre, @email, @cargo, @departamento, @rol, @rut, @activo, GETDATE()
                    );
                    SELECT SCOPE_IDENTITY() as id;
                `);

            const nuevoId = result.recordset[0].id;
            
            return {
                id: nuevoId,
                usuario: userData.usuario,
                nombre: userData.nombre,
                email: userData.email,
                cargo: userData.cargo,
                departamento: userData.departamento,
                rol: userData.rol || 'usuario',
                rut: userData.rut || ''
            };

        } catch (error) {
            console.error('❌ Error en UsuarioModel.create:', error);
            throw error;
        }
    }

    /**
     * Buscar usuario por username
     */
    async findByUsername(usuario) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('usuario', sql.NVarChar, usuario)
                .query(`
                    SELECT 
                        id, usuario, contraseña, nombre, email, cargo, 
                        departamento, rol, rut, activo, telefono, 
                        fecha_nacimiento, nacionalidad, estado_civil,
                        fecha_ingreso, domicilio, comuna, ciudad,
                        ultimo_acceso, fecha_creacion, fecha_actualizacion
                    FROM INV.usuarios
                    WHERE usuario = @usuario AND activo = 1
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const user = result.recordset[0];
            return {
                id: user.id,
                usuario: user.usuario,
                contraseña: user.contraseña,
                nombre: user.nombre,
                email: user.email,
                cargo: user.cargo,
                departamento: user.departamento,
                rol: user.rol,
                rut: user.rut || '',
                activo: user.activo
            };
        } catch (error) {
            console.error('❌ Error en findByUsername:', error);
            throw error;
        }
    }

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        id, usuario, contraseña, nombre, email, cargo, 
                        departamento, rol, rut, activo, telefono, 
                        fecha_nacimiento, nacionalidad, estado_civil,
                        fecha_ingreso, domicilio, comuna, ciudad,
                        ultimo_acceso, fecha_creacion, fecha_actualizacion
                    FROM INV.usuarios
                    WHERE id = @id
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const user = result.recordset[0];
            return {
                id: user.id,
                usuario: user.usuario,
                contraseña: user.contraseña,
                nombre: user.nombre,
                email: user.email,
                cargo: user.cargo,
                departamento: user.departamento,
                rol: user.rol,
                rut: user.rut || '',
                activo: user.activo
            };
        } catch (error) {
            console.error('❌ Error en findById:', error);
            throw error;
        }
    }

    /**
     * Buscar usuario por email
     */
    async findByEmail(email) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT id, usuario, nombre, email, cargo, departamento, rol, rut, activo
                    FROM INV.usuarios
                    WHERE email = @email AND activo = 1
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en findByEmail:', error);
            throw error;
        }
    }

    /**
     * Comparar contraseña
     */
    async comparePassword(plainPassword, hashedPassword) {
        try {
            if (!plainPassword || !hashedPassword) {
                console.log('⚠️ Datos faltantes para comparar contraseña');
                return false;
            }
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            console.log('🔐 Comparación de contraseña:', result ? '✅ Válida' : '❌ Inválida');
            return result;
        } catch (error) {
            console.error('❌ Error en comparePassword:', error);
            return false;
        }
    }

    /**
     * Actualizar contraseña - VERSIÓN CORREGIDA
     */
    async updatePassword(userId, hashedPassword) {
        try {
            console.log('=================================');
            console.log('🔐 updatePassword - INICIANDO');
            console.log(`📝 Usuario ID: ${userId}`);
            console.log(`📝 Hash nuevo: ${hashedPassword.substring(0, 30)}...`);
            
            if (!userId || !hashedPassword) {
                throw new Error('ID de usuario y contraseña son requeridos');
            }
            
            const pool = await getConnection();
            
            // PRIMERO: Verificar que el usuario existe
            const userCheck = await pool.request()
                .input('id', sql.Int, userId)
                .query(`
                    SELECT id, usuario, LEN(contraseña) as longitud_actual
                    FROM INV.usuarios 
                    WHERE id = @id
                `);
            
            if (userCheck.recordset.length === 0) {
                console.error('❌ Usuario no encontrado');
                throw new Error('Usuario no encontrado');
            }
            
            console.log(`✅ Usuario encontrado: ${userCheck.recordset[0].usuario}`);
            console.log(`📏 Longitud del hash actual: ${userCheck.recordset[0].longitud_actual}`);
            
            // SEGUNDO: Actualizar la contraseña
            const result = await pool.request()
                .input('id', sql.Int, userId)
                .input('contraseña', sql.NVarChar(255), hashedPassword)
                .query(`
                    UPDATE INV.usuarios 
                    SET contraseña = @contraseña,
                        fecha_actualizacion = GETDATE()
                    WHERE id = @id
                `);
            
            console.log(`📊 Filas afectadas: ${result.rowsAffected[0]}`);
            
            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                // TERCERO: Verificar que se actualizó correctamente
                const verifyResult = await pool.request()
                    .input('id', sql.Int, userId)
                    .query(`
                        SELECT LEN(contraseña) as nueva_longitud,
                               SUBSTRING(contraseña, 1, 20) as hash_inicio,
                               fecha_actualizacion
                        FROM INV.usuarios 
                        WHERE id = @id
                    `);
                
                console.log(`✅ NUEVA longitud del hash: ${verifyResult.recordset[0]?.nueva_longitud}`);
                console.log(`📝 Hash nuevo (inicio): ${verifyResult.recordset[0]?.hash_inicio}...`);
                console.log(`📅 Fecha actualización: ${verifyResult.recordset[0]?.fecha_actualizacion}`);
                console.log('✅ Contraseña actualizada correctamente');
                console.log('=================================');
                return true;
            } else {
                console.error('❌ No se actualizó ninguna fila');
                throw new Error('No se pudo actualizar la contraseña');
            }
        } catch (error) {
            console.error('❌ Error en updatePassword:', error);
            console.error('❌ Stack:', error.stack);
            console.log('=================================');
            throw error;
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    async update(userId, userData) {
        try {
            const pool = await getConnection();
            
            const currentUser = await this.findById(userId);
            if (!currentUser) {
                throw new Error('Usuario no encontrado');
            }
            
            await pool.request()
                .input('id', sql.Int, userId)
                .input('nombre', sql.NVarChar, userData.nombre || currentUser.nombre)
                .input('email', sql.NVarChar, userData.email || currentUser.email)
                .input('cargo', sql.NVarChar, userData.cargo !== undefined ? userData.cargo : currentUser.cargo)
                .input('departamento', sql.NVarChar, userData.departamento !== undefined ? userData.departamento : currentUser.departamento)
                .input('rut', sql.NVarChar, userData.rut !== undefined ? userData.rut : currentUser.rut)
                .input('fecha_actualizacion', sql.DateTime, new Date())
                .query(`
                    UPDATE INV.usuarios 
                    SET nombre = @nombre,
                        email = @email,
                        cargo = @cargo,
                        departamento = @departamento,
                        rut = @rut,
                        fecha_actualizacion = @fecha_actualizacion
                    WHERE id = @id
                `);
            
            return {
                ...currentUser,
                nombre: userData.nombre || currentUser.nombre,
                email: userData.email || currentUser.email,
                cargo: userData.cargo !== undefined ? userData.cargo : currentUser.cargo,
                departamento: userData.departamento !== undefined ? userData.departamento : currentUser.departamento,
                rut: userData.rut !== undefined ? userData.rut : currentUser.rut
            };
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw error;
        }
    }

    /**
     * Desactivar usuario
     */
    async deactivate(userId) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, userId)
                .input('fecha_actualizacion', sql.DateTime, new Date())
                .query(`
                    UPDATE INV.usuarios 
                    SET activo = 0,
                        fecha_actualizacion = @fecha_actualizacion
                    WHERE id = @id
                `);
            return true;
        } catch (error) {
            console.error('❌ Error en deactivate:', error);
            throw error;
        }
    }

    /**
     * Actualizar último acceso
     */
    async updateLastAccess(userId) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, userId)
                .input('ultimo_acceso', sql.DateTime, new Date())
                .query(`
                    UPDATE INV.usuarios 
                    SET ultimo_acceso = @ultimo_acceso
                    WHERE id = @id
                `);
            return true;
        } catch (error) {
            console.error('❌ Error en updateLastAccess:', error);
            throw error;
        }
    }
}

module.exports = new UsuarioModel();