// backend/models/usuarioModel.js
const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioModel {
    /**
     * Buscar usuario por nombre de usuario
     */
    async findByUsername(usuario) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('usuario', sql.NVarChar, usuario)
                .query(`
                    SELECT 
                        id, 
                        usuario, 
                        nombre, 
                        email, 
                        contraseña, 
                        rol, 
                        cargo, 
                        departamento,
                        activo
                    FROM [INV].[usuarios] 
                    WHERE usuario = @usuario AND activo = 1
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.findByUsername:', error);
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
                    SELECT 
                        id, 
                        usuario, 
                        nombre, 
                        email, 
                        rol
                    FROM [INV].[usuarios] 
                    WHERE email = @email AND activo = 1
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.findByEmail:', error);
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
                        id, 
                        usuario, 
                        nombre, 
                        email, 
                        contraseña, 
                        rol, 
                        cargo, 
                        departamento,
                        activo
                    FROM [INV].[usuarios] 
                    WHERE id = @id AND activo = 1
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.findById:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo usuario
     */
    async create(userData) {
        try {
            const { usuario, contraseña, nombre, email, cargo, departamento, rol } = userData;
            
            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contraseña, salt);

            const pool = await getConnection();
            const result = await pool.request()
                .input('usuario', sql.NVarChar, usuario)
                .input('contraseña', sql.NVarChar, hashedPassword)
                .input('nombre', sql.NVarChar, nombre)
                .input('email', sql.NVarChar, email)
                .input('cargo', sql.NVarChar, cargo || null)
                .input('departamento', sql.NVarChar, departamento || null)
                .input('rol', sql.NVarChar, rol || 'usuario')
                .input('activo', sql.Int, 1)
                .input('fecha_creacion', sql.DateTime, new Date())
                .query(`
                    INSERT INTO [INV].[usuarios] (
                        usuario, contraseña, nombre, email, cargo, departamento, rol, activo, fecha_creacion
                    )
                    OUTPUT INSERTED.id, INSERTED.usuario, INSERTED.nombre, INSERTED.email, 
                           INSERTED.cargo, INSERTED.departamento, INSERTED.rol
                    VALUES (
                        @usuario, @contraseña, @nombre, @email, @cargo, @departamento, @rol, @activo, @fecha_creacion
                    )
                `);
            
            console.log(`✅ Usuario creado: ${usuario} (ID: ${result.recordset[0].id})`);
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en UsuarioModel.create:', error);
            throw error;
        }
    }

    /**
     * Comparar contraseña
     */
    async comparePassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('❌ Error comparando contraseñas:', error);
            return false;
        }
    }

    /**
     * Actualizar contraseña
     */
    async updatePassword(id, hashedPassword) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('id', sql.Int, id)
                .input('contraseña', sql.NVarChar, hashedPassword)
                .input('fecha_actualizacion', sql.DateTime, new Date())
                .query(`
                    UPDATE [INV].[usuarios] 
                    SET contraseña = @contraseña,
                        fecha_actualizacion = @fecha_actualizacion
                    WHERE id = @id
                `);
            
            console.log(`✅ Contraseña actualizada para usuario ID: ${id}`);
            return true;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.updatePassword:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los usuarios (opcional)
     */
    async getAll() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        id, 
                        usuario, 
                        nombre, 
                        email, 
                        rol, 
                        cargo, 
                        departamento,
                        activo,
                        fecha_creacion
                    FROM [INV].[usuarios] 
                    ORDER BY id DESC
                `);
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.getAll:', error);
            throw error;
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    async updateProfile(id, data) {
        try {
            const { nombre, email, cargo, departamento } = data;
            
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, nombre)
                .input('email', sql.NVarChar, email)
                .input('cargo', sql.NVarChar, cargo)
                .input('departamento', sql.NVarChar, departamento)
                .input('fecha_actualizacion', sql.DateTime, new Date())
                .query(`
                    UPDATE [INV].[usuarios] 
                    SET nombre = @nombre,
                        email = @email,
                        cargo = @cargo,
                        departamento = @departamento,
                        fecha_actualizacion = @fecha_actualizacion
                    WHERE id = @id
                `);
            
            return true;
        } catch (error) {
            console.error('❌ Error en UsuarioModel.updateProfile:', error);
            throw error;
        }
    }
}

module.exports = new UsuarioModel();