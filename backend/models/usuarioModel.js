// backend/models/usuarioModel.js
const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioModel {
    /**
     * Crear nuevo usuario (VERSIÓN CORREGIDA)
     */
    async create(userData) {
        try {
            console.log('📝 UsuarioModel.create - Datos recibidos:', {
                ...userData,
                password: userData.password ? '***' : 'UNDEFINED'
            });

            // VALIDACIÓN ESTRICTA
            if (!userData.password) {
                throw new Error('La contraseña es requerida para crear el usuario');
            }

            const pool = await getConnection();
            
            // Hashear la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            console.log('✅ Contraseña hasheada correctamente');

            // Insertar en la base de datos
            const result = await pool.request()
                .input('usuario', sql.NVarChar, userData.usuario)
                .input('contraseña', sql.NVarChar, hashedPassword)  // ⚠️ Nota: usa 'contraseña' con ñ
                .input('nombre', sql.NVarChar, userData.nombre || '')
                .input('email', sql.NVarChar, userData.email || '')
                .input('cargo', sql.NVarChar, userData.cargo || '')
                .input('departamento', sql.NVarChar, userData.departamento || '')
                .input('rol', sql.NVarChar, userData.rol || 'usuario')
                .input('rut', sql.NVarChar, userData.rut || '')
                .input('activo', sql.Bit, userData.activo !== false)
                .query(`
                    INSERT INTO INV.usuarios (usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo, fecha_creacion)
                    VALUES (@usuario, @contraseña, @nombre, @email, @cargo, @departamento, @rol, @rut, @activo, GETDATE());
                    SELECT SCOPE_IDENTITY() as id;
                `);

            const nuevoId = result.recordset[0].id;
            
            // Retornar el usuario sin la contraseña
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
                    SELECT id, usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo
                    FROM INV.usuarios
                    WHERE usuario = @usuario AND (activo = 1 OR activo IS NULL)
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const user = result.recordset[0];
            return {
                id: user.id,
                usuario: user.usuario,
                contraseña: user.contraseña,  // ⚠️ Nota: campo con ñ
                nombre: user.nombre,
                email: user.email,
                cargo: user.cargo,
                departamento: user.departamento,
                rol: user.rol,
                rut: user.rut,
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
                    SELECT id, usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo
                    FROM INV.usuarios
                    WHERE id = @id AND (activo = 1 OR activo IS NULL)
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
                rut: user.rut,
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
                    WHERE email = @email AND (activo = 1 OR activo IS NULL)
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
            return await bcrypt.compare(plainPassword, hashedPassword);
        } catch (error) {
            console.error('❌ Error en comparePassword:', error);
            return false;
        }
    }

    /**
     * Actualizar contraseña
     */
    async updatePassword(userId, hashedPassword) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, userId)
                .input('contraseña', sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE INV.usuarios 
                    SET contraseña = @contraseña, updated_at = GETDATE()
                    WHERE id = @id
                `);
            return true;
        } catch (error) {
            console.error('❌ Error en updatePassword:', error);
            throw error;
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    async update(userId, userData) {
        try {
            const pool = await getConnection();
            
            // Primero obtener el usuario actual
            const currentUser = await this.findById(userId);
            if (!currentUser) {
                throw new Error('Usuario no encontrado');
            }
            
            await pool.request()
                .input('id', sql.Int, userId)
                .input('nombre', sql.NVarChar, userData.nombre || currentUser.nombre)
                .input('email', sql.NVarChar, userData.email || currentUser.email)
                .input('cargo', sql.NVarChar, userData.cargo || null)
                .input('departamento', sql.NVarChar, userData.departamento || null)
                .query(`
                    UPDATE INV.usuarios 
                    SET nombre = @nombre,
                        email = @email,
                        cargo = @cargo,
                        departamento = @departamento,
                        updated_at = GETDATE()
                    WHERE id = @id
                `);
            
            // Retornar usuario actualizado
            return {
                ...currentUser,
                nombre: userData.nombre || currentUser.nombre,
                email: userData.email || currentUser.email,
                cargo: userData.cargo || currentUser.cargo,
                departamento: userData.departamento || currentUser.departamento
            };
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw error;
        }
    }

    /**
     * Desactivar usuario (soft delete)
     */
    async deactivate(userId) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, userId)
                .query(`
                    UPDATE INV.usuarios 
                    SET activo = 0, updated_at = GETDATE()
                    WHERE id = @id
                `);
            return true;
        } catch (error) {
            console.error('❌ Error en deactivate:', error);
            throw error;
        }
    }
}

module.exports = new UsuarioModel();