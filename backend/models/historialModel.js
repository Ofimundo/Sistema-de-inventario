const { getConnection, sql } = require('../config/database');

class HistorialModel {
    /**
     * Obtiene todo el historial con filtros
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Array>} - Lista de historial
     */
    async findAll(filters = {}) {
        try {
            const pool = await getConnection();
            let query = `
                SELECT h.*, 
                       p.nombre as producto_nombre,
                       p.numero_serie as producto_serie,
                       u.usuario as usuario_nombre,
                       d.nombre as usuario_real_nombre
                FROM INV.historial h
                LEFT JOIN INV.productos p ON h.producto_id = p.id
                LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
                LEFT JOIN INV.detalles_usuario d ON u.id = d.usuario_id
                WHERE 1=1
            `;
            const request = pool.request();

            if (filters.producto_id) {
                query += ' AND h.producto_id = @producto_id';
                request.input('producto_id', sql.Int, filters.producto_id);
            }
            if (filters.accion) {
                query += ' AND h.accion = @accion';
                request.input('accion', sql.NVarChar, filters.accion);
            }
            if (filters.usuario_id) {
                query += ' AND h.usuario_id = @usuario_id';
                request.input('usuario_id', sql.Int, filters.usuario_id);
            }
            if (filters.desde) {
                query += ' AND h.fecha_hora >= @desde';
                request.input('desde', sql.DateTime, filters.desde);
            }
            if (filters.hasta) {
                query += ' AND h.fecha_hora <= @hasta';
                request.input('hasta', sql.DateTime, filters.hasta);
            }

            query += ' ORDER BY h.fecha_hora DESC';
            
            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crea un registro en el historial
     * @param {Object} historialData - Datos del historial
     * @returns {Promise<Object>} - Historial creado
     */
    async create(historialData) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, historialData.producto_id)
                .input('accion', sql.NVarChar, historialData.accion)
                .input('usuario_id', sql.Int, historialData.usuario_id)
                .input('detalles', sql.NVarChar, historialData.detalles || '')
                .input('fecha_hora', sql.DateTime, new Date())
                .query(`
                    INSERT INTO INV.historial (producto_id, accion, usuario_id, detalles, fecha_hora)
                    OUTPUT INSERTED.id
                    VALUES (@producto_id, @accion, @usuario_id, @detalles, @fecha_hora)
                `);
            
            return { id: result.recordset[0].id, ...historialData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene el historial de un producto específico
     * @param {number} productoId - ID del producto
     * @returns {Promise<Array>} - Historial del producto
     */
    async getByProducto(productoId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .query(`
                    SELECT h.*, 
                           u.usuario as usuario_nombre
                    FROM INV.historial h
                    LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
                    WHERE h.producto_id = @producto_id
                    ORDER BY h.fecha_hora DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene el historial de un usuario específico
     * @param {number} usuarioId - ID del usuario
     * @returns {Promise<Array>} - Historial del usuario
     */
    async getByUsuario(usuarioId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('usuario_id', sql.Int, usuarioId)
                .query(`
                    SELECT h.*, p.nombre as producto_nombre
                    FROM INV.historial h
                    LEFT JOIN INV.productos p ON h.producto_id = p.id
                    WHERE h.usuario_id = @usuario_id
                    ORDER BY h.fecha_hora DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene las acciones más recientes
     * @param {number} limit - Límite de resultados
     * @returns {Promise<Array>} - Acciones recientes
     */
    async getRecent(limit = 10) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .query(`
                    SELECT TOP (@limit) h.*, 
                           p.nombre as producto_nombre,
                           u.usuario as usuario_nombre
                    FROM INV.historial h
                    LEFT JOIN INV.productos p ON h.producto_id = p.id
                    LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
                    ORDER BY h.fecha_hora DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new HistorialModel();