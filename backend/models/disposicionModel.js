const { getConnection, sql } = require('../config/database');

class DisposicionModel {
    /**
     * Registra una donación
     * @param {Object} donacionData - Datos de la donación
     * @returns {Promise<Object>} - Donación registrada
     */
    async registrarDonacion(donacionData) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, donacionData.producto_id)
                .input('beneficiario', sql.NVarChar, donacionData.beneficiario)
                .input('rut_beneficiario', sql.NVarChar, donacionData.rut_beneficiario)
                .input('direccion', sql.NVarChar, donacionData.direccion)
                .input('comuna', sql.NVarChar, donacionData.comuna)
                .input('ciudad', sql.NVarChar, donacionData.ciudad)
                .input('fecha_entrega', sql.DateTime, donacionData.fecha_entrega || new Date())
                .input('documento_firmado', sql.NVarChar, donacionData.documento_firmado)
                .input('observaciones', sql.NVarChar, donacionData.observaciones || '')
                .input('usuario_id', sql.Int, donacionData.usuario_id)
                .query(`
                    INSERT INTO INV.disposicion_donacion (
                        producto_id, beneficiario, rut_beneficiario, direccion,
                        comuna, ciudad, fecha_entrega, documento_firmado, observaciones, usuario_id
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @producto_id, @beneficiario, @rut_beneficiario, @direccion,
                        @comuna, @ciudad, @fecha_entrega, @documento_firmado, @observaciones, @usuario_id
                    )
                `);
            
            return { id: result.recordset[0].id, ...donacionData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Registra una baja
     * @param {Object} bajaData - Datos de la baja
     * @returns {Promise<Object>} - Baja registrada
     */
    async registrarBaja(bajaData) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, bajaData.producto_id)
                .input('motivo_baja', sql.NVarChar, bajaData.motivo_baja)
                .input('fecha_baja', sql.DateTime, bajaData.fecha_baja || new Date())
                .input('autorizado_por', sql.NVarChar, bajaData.autorizado_por)
                .input('documento_autorizacion', sql.NVarChar, bajaData.documento_autorizacion)
                .input('observaciones', sql.NVarChar, bajaData.observaciones || '')
                .input('usuario_id', sql.Int, bajaData.usuario_id)
                .query(`
                    INSERT INTO INV.disposicion_baja (
                        producto_id, motivo_baja, fecha_baja,
                        autorizado_por, documento_autorizacion, observaciones, usuario_id
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @producto_id, @motivo_baja, @fecha_baja,
                        @autorizado_por, @documento_autorizacion, @observaciones, @usuario_id
                    )
                `);
            
            return { id: result.recordset[0].id, ...bajaData };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene las donaciones de un producto
     * @param {number} productoId - ID del producto
     * @returns {Promise<Array>} - Donaciones del producto
     */
    async getDonacionesByProducto(productoId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .query(`
                    SELECT d.*, u.usuario as registrado_por
                    FROM INV.disposicion_donacion d
                    LEFT JOIN INV.usuarios u ON d.usuario_id = u.id
                    WHERE d.producto_id = @producto_id
                    ORDER BY d.fecha_entrega DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene las bajas de un producto
     * @param {number} productoId - ID del producto
     * @returns {Promise<Array>} - Bajas del producto
     */
    async getBajasByProducto(productoId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .query(`
                    SELECT b.*, u.usuario as registrado_por
                    FROM INV.disposicion_baja b
                    LEFT JOIN INV.usuarios u ON b.usuario_id = u.id
                    WHERE b.producto_id = @producto_id
                    ORDER BY b.fecha_baja DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene todas las disposiciones (donaciones y bajas)
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Array>} - Lista de disposiciones
     */
    async getAll(filters = {}) {
        try {
            const pool = await getConnection();
            
            // Obtener donaciones
            let donacionesQuery = `
                SELECT 
                    'donacion' as tipo,
                    d.id,
                    d.producto_id,
                    p.nombre as producto_nombre,
                    d.beneficiario,
                    d.rut_beneficiario,
                    d.fecha_entrega as fecha,
                    d.documento_firmado as documento,
                    d.observaciones,
                    u.usuario as registrado_por
                FROM INV.disposicion_donacion d
                LEFT JOIN INV.productos p ON d.producto_id = p.id
                LEFT JOIN INV.usuarios u ON d.usuario_id = u.id
                WHERE 1=1
            `;
            
            // Obtener bajas
            let bajasQuery = `
                SELECT 
                    'baja' as tipo,
                    b.id,
                    b.producto_id,
                    p.nombre as producto_nombre,
                    b.motivo_baja as motivo,
                    b.fecha_baja as fecha,
                    b.autorizado_por,
                    b.documento_autorizacion as documento,
                    b.observaciones,
                    u.usuario as registrado_por
                FROM INV.disposicion_baja b
                LEFT JOIN INV.productos p ON b.producto_id = p.id
                LEFT JOIN INV.usuarios u ON b.usuario_id = u.id
                WHERE 1=1
            `;

            const request = pool.request();
            
            if (filters.desde) {
                donacionesQuery += ' AND d.fecha_entrega >= @desde';
                bajasQuery += ' AND b.fecha_baja >= @desde';
                request.input('desde', sql.DateTime, filters.desde);
            }
            if (filters.hasta) {
                donacionesQuery += ' AND d.fecha_entrega <= @hasta';
                bajasQuery += ' AND b.fecha_baja <= @hasta';
                request.input('hasta', sql.DateTime, filters.hasta);
            }

            donacionesQuery += ' ORDER BY fecha DESC';
            bajasQuery += ' ORDER BY fecha DESC';

            const donaciones = await request.query(donacionesQuery);
            const bajas = await request.query(bajasQuery);

            // Combinar y ordenar
            let resultados = [...donaciones.recordset, ...bajas.recordset];
            resultados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            return resultados;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de disposiciones
     * @param {Object} filters - Filtros a aplicar
     * @returns {Promise<Object>} - Estadísticas
     */
    async getStats(filters = {}) {
        try {
            const pool = await getConnection();
            
            let query = `
                SELECT 
                    (SELECT COUNT(*) FROM INV.disposicion_donacion) as total_donaciones,
                    (SELECT COUNT(*) FROM INV.disposicion_baja) as total_bajas,
                    (SELECT COUNT(*) FROM INV.disposicion_donacion WHERE YEAR(fecha_entrega) = YEAR(GETDATE())) as donaciones_anio_actual,
                    (SELECT COUNT(*) FROM INV.disposicion_baja WHERE YEAR(fecha_baja) = YEAR(GETDATE())) as bajas_anio_actual
            `;

            const result = await pool.request().query(query);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DisposicionModel();