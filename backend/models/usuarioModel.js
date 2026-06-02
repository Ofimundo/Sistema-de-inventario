// backend/models/usuarioModel.js
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
                    INSERT INTO INV.usuarios (usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo, fecha_creacion)
                    VALUES (@usuario, @contraseña, @nombre, @email, @cargo, @departamento, @rol, @rut, @activo, GETDATE());
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
                    SELECT id, usuario, contraseña, nombre, email, cargo, departamento, rol, rut, activo
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
            const result = await bcrypt.compare(plainPassword, hashedPassword);
            console.log('🔐 Comparación de contraseña:', result ? '✅ Válida' : '❌ Inválida');
            return result;
        } catch (error) {
            console.error('❌ Error en comparePassword:', error);
            return false;
        }
    }

    /**
     * Actualizar contraseña - CORREGIDO CON MÁS LOGS
     */
    async updatePassword(userId, hashedPassword) {
        try {
            console.log('📝 updatePassword - Usuario ID:', userId);
            console.log('📝 Nueva contraseña hasheada:', hashedPassword.substring(0, 20) + '...');
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, userId)
                .input('contraseña', sql.NVarChar, hashedPassword)
                .query(`
                    UPDATE INV.usuarios 
                    SET contraseña = @contraseña
                    WHERE id = @id
                `);
            
            console.log('📊 Filas afectadas:', result.rowsAffected);
            
            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                console.log('✅ Contraseña actualizada correctamente');
                return true;
            } else {
                console.error('❌ No se actualizó ninguna fila');
                throw new Error('No se pudo actualizar la contraseña');
            }
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
                .query(`
                    UPDATE INV.usuarios 
                    SET nombre = @nombre,
                        email = @email,
                        cargo = @cargo,
                        departamento = @departamento,
                        rut = @rut
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
                .query(`
                    UPDATE INV.usuarios 
                    SET activo = 0
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