const { getConnection, sql } = require('../config/database');

class EstadosEquipoModel {
    /**
     * Obtiene todos los estados de equipos
     * @returns {Promise<Array>} - Lista de estados
     */
    async findAll() {
        try {
            const pool = await getConnection();
            
            // 👇 USAR EL NOMBRE CORRECTO: estados_equipos (CON 'S' AL FINAL)
            const result = await pool.request()
                .query(`
                    SELECT 
                        id,
                        nombre,
                        descripcion,
                        color,
                        permite_asignacion,
                        activo,
                        created_at
                    FROM INV.estados_equipos
                    ORDER BY id
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error en findAll estados:', error);
            throw error;
        }
    }

    /**
     * Busca un estado por ID
     * @param {number} id - ID del estado
     * @returns {Promise<Object>} - Estado encontrado
     */
    async findById(id) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        id,
                        nombre,
                        descripcion,
                        color,
                        permite_asignacion,
                        activo,
                        created_at
                    FROM INV.estados_equipos
                    WHERE id = @id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('Error en findById estado:', error);
            throw error;
        }
    }

    /**
     * Busca un estado por nombre
     * @param {string} nombre - Nombre del estado
     * @returns {Promise<Object>} - Estado encontrado
     */
    async findByNombre(nombre) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .query(`
                    SELECT 
                        id,
                        nombre,
                        descripcion,
                        color,
                        permite_asignacion,
                        activo,
                        created_at
                    FROM INV.estados_equipos
                    WHERE nombre = @nombre
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('Error en findByNombre estado:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo estados activos
     * @returns {Promise<Array>} - Lista de estados activos
     */
    async findActivos() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        id,
                        nombre,
                        descripcion,
                        color,
                        permite_asignacion,
                        activo,
                        created_at
                    FROM INV.estados_equipos
                    WHERE activo = 1
                    ORDER BY id
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error en findActivos estados:', error);
            throw error;
        }
    }

    /**
     * Obtiene estados que permiten asignación
     * @returns {Promise<Array>} - Lista de estados que permiten asignación
     */
    async findPermitenAsignacion() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        id,
                        nombre,
                        descripcion,
                        color,
                        permite_asignacion,
                        activo,
                        created_at
                    FROM INV.estados_equipos
                    WHERE permite_asignacion = 1 AND activo = 1
                    ORDER BY id
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error en findPermitenAsignacion estados:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo estado
     * @param {Object} estadoData - Datos del estado
     * @returns {Promise<Object>} - Estado creado
     */
    async create(estadoData) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('nombre', sql.NVarChar, estadoData.nombre)
                .input('descripcion', sql.NVarChar, estadoData.descripcion || '')
                .input('color', sql.NVarChar, estadoData.color || '#718096')
                .input('permite_asignacion', sql.Bit, estadoData.permite_asignacion || 0)
                .input('activo', sql.Bit, estadoData.activo !== undefined ? estadoData.activo : 1)
                .input('created_at', sql.DateTime, new Date())
                .query(`
                    INSERT INTO INV.estados_equipos (
                        nombre, descripcion, color, permite_asignacion, activo, created_at
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @nombre, @descripcion, @color, @permite_asignacion, @activo, @created_at
                    )
                `);

            const id = result.recordset[0].id;
            return await this.findById(id);
        } catch (error) {
            console.error('Error en create estado:', error);
            throw error;
        }
    }

    /**
     * Actualiza un estado existente
     * @param {number} id - ID del estado
     * @param {Object} estadoData - Datos a actualizar
     * @returns {Promise<Object>} - Estado actualizado
     */
    async update(id, estadoData) {
        try {
            const pool = await getConnection();
            
            let query = 'UPDATE INV.estados_equipos SET ';
            const updates = [];
            const request = pool.request();

            if (estadoData.nombre !== undefined) {
                updates.push('nombre = @nombre');
                request.input('nombre', sql.NVarChar, estadoData.nombre);
            }
            if (estadoData.descripcion !== undefined) {
                updates.push('descripcion = @descripcion');
                request.input('descripcion', sql.NVarChar, estadoData.descripcion);
            }
            if (estadoData.color !== undefined) {
                updates.push('color = @color');
                request.input('color', sql.NVarChar, estadoData.color);
            }
            if (estadoData.permite_asignacion !== undefined) {
                updates.push('permite_asignacion = @permite_asignacion');
                request.input('permite_asignacion', sql.Bit, estadoData.permite_asignacion);
            }
            if (estadoData.activo !== undefined) {
                updates.push('activo = @activo');
                request.input('activo', sql.Bit, estadoData.activo);
            }

            if (updates.length === 0) {
                return await this.findById(id);
            }

            query += updates.join(', ') + ' WHERE id = @id';
            request.input('id', sql.Int, id);

            await request.query(query);
            return await this.findById(id);
        } catch (error) {
            console.error('Error en update estado:', error);
            throw error;
        }
    }

    /**
     * Elimina (desactiva) un estado
     * @param {number} id - ID del estado
     * @returns {Promise<boolean>} - true si se desactivó
     */
    async delete(id) {
        try {
            const pool = await getConnection();
            
            await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    UPDATE INV.estados_equipos 
                    SET activo = 0 
                    WHERE id = @id
                `);

            return true;
        } catch (error) {
            console.error('Error en delete estado:', error);
            throw error;
        }
    }
}

module.exports = new EstadosEquipoModel();