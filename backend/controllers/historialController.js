// backend/controllers/historialController.js
const { getConnection, sql } = require('../config/database');
const ExcelJS = require('exceljs');

const historialController = {
    /**
     * Obtener historial general (INV.historial)
     */
    getHistorialGeneral: async (req, res) => {
        try {
            console.log('📥 Obteniendo historial general...');
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        h.id,
                        h.producto_id,
                        h.accion,
                        h.usuario_id,
                        u.usuario as usuario_nombre,
                        h.oc_numero,
                        h.factura_numero,
                        h.detalles,
                        h.fecha_hora
                    FROM [INV].[historial] h WITH (NOLOCK)
                    LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                    ORDER BY h.fecha_hora DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('❌ Error en getHistorialGeneral:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    /**
     * Obtener historial de documentos (INV.historial_documentos)
     */
    getHistorialDocumentos: async (req, res) => {
        try {
            console.log('📥 Obteniendo historial de documentos...');
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        hd.id,
                        hd.documento_id,
                        hd.accion,
                        hd.usuario_id,
                        hd.usuario_nombre,
                        hd.ip_usuario,
                        hd.detalles,
                        hd.fecha_accion as fecha
                    FROM [INV].[historial_documentos] hd WITH (NOLOCK)
                    ORDER BY hd.fecha_accion DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('❌ Error en getHistorialDocumentos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    /**
     * Obtener historial de estados (INV.historial_estado)
     */
    getHistorialEstados: async (req, res) => {
        try {
            console.log('📥 Obteniendo historial de estados...');
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        he.id,
                        he.producto_id,
                        p.nombre as producto_nombre,
                        he.accion,
                        he.estado_anterior,
                        he.estado_nuevo,
                        he.estado,
                        he.usuario_id,
                        he.usuario_nombre,
                        he.ip_usuario,
                        he.detalles,
                        he.fecha_accion as fecha
                    FROM [INV].[historial_estado] he WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON he.producto_id = p.id
                    ORDER BY he.fecha_accion DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('❌ Error en getHistorialEstados:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    /**
     * Obtener movimientos (filtrados de historial general)
     */
    getMovimientos: async (req, res) => {
        try {
            console.log('📥 Obteniendo movimientos...');
            
            const { acciones } = req.query;
            let accionesArray = [];
            
            if (acciones) {
                if (Array.isArray(acciones)) {
                    accionesArray = acciones;
                } else {
                    accionesArray = [acciones];
                }
            } else {
                // Por defecto, acciones de movimiento
                accionesArray = ['ASIGNACION', 'DEVOLUCION', 'CREACION', 'ACTUALIZACION'];
            }

            const pool = await getConnection();
            const request = pool.request();

            let query = `
                SELECT 
                    h.id,
                    h.producto_id,
                    p.nombre as producto_nombre,
                    h.accion as tipo_movimiento,
                    h.usuario_id,
                    u.usuario as usuario_responsable,
                    h.detalles as observaciones,
                    h.fecha_hora as fecha
                FROM [INV].[historial] h WITH (NOLOCK)
                LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON h.producto_id = p.id
                LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                WHERE h.accion IN (${accionesArray.map((_, i) => `@accion${i}`).join(',')})
                ORDER BY h.fecha_hora DESC
            `;

            accionesArray.forEach((accion, index) => {
                request.input(`accion${index}`, sql.NVarChar, accion);
            });

            const result = await request.query(query);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('❌ Error en getMovimientos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    /**
     * Obtener historial completo (todas las tablas combinadas)
     */
    getHistorialCompleto: async (req, res) => {
        try {
            console.log('📥 Obteniendo historial completo...');
            
            const pool = await getConnection();

            // Obtener historial general
            const generalResult = await pool.request()
                .query(`
                    SELECT TOP 500
                        h.id,
                        h.producto_id,
                        p.nombre as producto_nombre,
                        h.accion,
                        h.usuario_id,
                        u.usuario as usuario_nombre,
                        h.oc_numero,
                        h.factura_numero,
                        h.detalles,
                        h.fecha_hora as fecha
                    FROM [INV].[historial] h WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON h.producto_id = p.id
                    LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                    ORDER BY h.fecha_hora DESC
                `);

            // Obtener historial de documentos
            const documentosResult = await pool.request()
                .query(`
                    SELECT TOP 500
                        hd.id,
                        hd.documento_id,
                        da.nombre_documento,
                        hd.accion,
                        hd.usuario_id,
                        hd.usuario_nombre,
                        hd.ip_usuario,
                        hd.detalles,
                        hd.fecha_accion as fecha
                    FROM [INV].[historial_documentos] hd WITH (NOLOCK)
                    LEFT JOIN [INV].[documentos_asignacion] da WITH (NOLOCK) ON hd.documento_id = da.id
                    ORDER BY hd.fecha_accion DESC
                `);

            // Obtener historial de estados
            const estadosResult = await pool.request()
                .query(`
                    SELECT TOP 500
                        he.id,
                        he.producto_id,
                        p.nombre as producto_nombre,
                        he.accion,
                        he.estado_anterior,
                        he.estado_nuevo,
                        he.estado,
                        he.usuario_id,
                        he.usuario_nombre,
                        he.ip_usuario,
                        he.detalles,
                        he.fecha_accion as fecha
                    FROM [INV].[historial_estado] he WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON he.producto_id = p.id
                    ORDER BY he.fecha_accion DESC
                `);

            // Obtener movimientos (como ejemplo, de historial general con acciones específicas)
            const movimientosResult = await pool.request()
                .query(`
                    SELECT TOP 500
                        h.id,
                        h.producto_id,
                        p.nombre as producto_nombre,
                        h.accion as tipo_movimiento,
                        h.usuario_id,
                        u.usuario as usuario_responsable,
                        h.detalles as observaciones,
                        h.fecha_hora as fecha
                    FROM [INV].[historial] h WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON h.producto_id = p.id
                    LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                    WHERE h.accion IN ('ASIGNACION', 'DEVOLUCION', 'CREACION', 'ACTUALIZACION')
                    ORDER BY h.fecha_hora DESC
                `);

            res.json({
                success: true,
                data: {
                    general: generalResult.recordset,
                    documentos: documentosResult.recordset,
                    estados: estadosResult.recordset,
                    movimientos: movimientosResult.recordset
                }
            });

        } catch (error) {
            console.error('❌ Error en getHistorialCompleto:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: {
                    general: [],
                    documentos: [],
                    estados: [],
                    movimientos: []
                }
            });
        }
    },

    /**
     * Exportar historial a Excel
     */
    exportarHistorial: async (req, res) => {
        try {
            console.log('📥 Exportando historial a Excel...');
            
            const { busqueda, tipo, fechaInicio, fechaFin } = req.query;
            
            const pool = await getConnection();
            const workbook = new ExcelJS.Workbook();

            // Hoja de Historial General
            const generalSheet = workbook.addWorksheet('Historial General');
            
            const generalResult = await pool.request()
                .query(`
                    SELECT TOP 1000
                        h.id,
                        h.producto_id,
                        p.nombre as producto,
                        h.accion,
                        u.usuario as usuario,
                        h.oc_numero,
                        h.factura_numero,
                        h.detalles,
                        h.fecha_hora as fecha
                    FROM [INV].[historial] h WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON h.producto_id = p.id
                    LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                    ORDER BY h.fecha_hora DESC
                `);

            generalSheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Producto ID', key: 'producto_id', width: 12 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Acción', key: 'accion', width: 20 },
                { header: 'Usuario', key: 'usuario', width: 20 },
                { header: 'OC N°', key: 'oc_numero', width: 15 },
                { header: 'Factura N°', key: 'factura_numero', width: 15 },
                { header: 'Detalles', key: 'detalles', width: 40 },
                { header: 'Fecha', key: 'fecha', width: 25 }
            ];

            generalSheet.addRows(generalResult.recordset);
            generalSheet.getRow(1).font = { bold: true };

            // Hoja de Documentos
            const docsSheet = workbook.addWorksheet('Documentos');
            
            const docsResult = await pool.request()
                .query(`
                    SELECT TOP 1000
                        hd.id,
                        hd.documento_id,
                        da.nombre_documento,
                        hd.accion,
                        hd.usuario_nombre as usuario,
                        hd.ip_usuario,
                        hd.detalles,
                        hd.fecha_accion as fecha
                    FROM [INV].[historial_documentos] hd WITH (NOLOCK)
                    LEFT JOIN [INV].[documentos_asignacion] da WITH (NOLOCK) ON hd.documento_id = da.id
                    ORDER BY hd.fecha_accion DESC
                `);

            docsSheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Documento ID', key: 'documento_id', width: 12 },
                { header: 'Nombre Documento', key: 'nombre_documento', width: 30 },
                { header: 'Acción', key: 'accion', width: 20 },
                { header: 'Usuario', key: 'usuario', width: 20 },
                { header: 'IP Usuario', key: 'ip_usuario', width: 15 },
                { header: 'Detalles', key: 'detalles', width: 40 },
                { header: 'Fecha', key: 'fecha', width: 25 }
            ];

            docsSheet.addRows(docsResult.recordset);
            docsSheet.getRow(1).font = { bold: true };

            // Hoja de Estados
            const estadosSheet = workbook.addWorksheet('Cambios de Estado');
            
            const estadosResult = await pool.request()
                .query(`
                    SELECT TOP 1000
                        he.id,
                        he.producto_id,
                        p.nombre as producto,
                        he.estado_anterior,
                        he.estado_nuevo,
                        he.accion,
                        he.usuario_nombre as usuario,
                        he.ip_usuario,
                        he.detalles,
                        he.fecha_accion as fecha
                    FROM [INV].[historial_estado] he WITH (NOLOCK)
                    LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON he.producto_id = p.id
                    ORDER BY he.fecha_accion DESC
                `);

            estadosSheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Producto ID', key: 'producto_id', width: 12 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Estado Anterior', key: 'estado_anterior', width: 15 },
                { header: 'Estado Nuevo', key: 'estado_nuevo', width: 15 },
                { header: 'Acción', key: 'accion', width: 20 },
                { header: 'Usuario', key: 'usuario', width: 20 },
                { header: 'IP', key: 'ip_usuario', width: 15 },
                { header: 'Detalles', key: 'detalles', width: 40 },
                { header: 'Fecha', key: 'fecha', width: 25 }
            ];

            estadosSheet.addRows(estadosResult.recordset);
            estadosSheet.getRow(1).font = { bold: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=historial_completo_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('❌ Error exportando historial:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Métodos para registrar en historial
    registrarHistorial: async (req, res) => {
        try {
            const { producto_id, accion, usuario_id, oc_numero, factura_numero, detalles } = req.body;
            
            const pool = await getConnection();
            
            await pool.request()
                .input('producto_id', sql.Int, producto_id || null)
                .input('accion', sql.NVarChar, accion)
                .input('usuario_id', sql.Int, usuario_id || null)
                .input('oc_numero', sql.NVarChar, oc_numero || null)
                .input('factura_numero', sql.NVarChar, factura_numero || null)
                .input('detalles', sql.NVarChar, detalles || null)
                .input('fecha_hora', sql.DateTime, new Date())
                .query(`
                    INSERT INTO [INV].[historial] 
                    (producto_id, accion, usuario_id, oc_numero, factura_numero, detalles, fecha_hora)
                    VALUES 
                    (@producto_id, @accion, @usuario_id, @oc_numero, @factura_numero, @detalles, @fecha_hora)
                `);

            res.json({ success: true, message: 'Historial registrado' });

        } catch (error) {
            console.error('Error registrando historial:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    registrarHistorialDocumento: async (req, res) => {
        try {
            const { documento_id, accion, usuario_id, usuario_nombre, ip_usuario, detalles } = req.body;
            
            const pool = await getConnection();
            
            await pool.request()
                .input('documento_id', sql.Int, documento_id || null)
                .input('accion', sql.NVarChar, accion)
                .input('usuario_id', sql.Int, usuario_id || null)
                .input('usuario_nombre', sql.NVarChar, usuario_nombre || null)
                .input('ip_usuario', sql.NVarChar, ip_usuario || null)
                .input('detalles', sql.NVarChar, detalles || null)
                .input('fecha_accion', sql.DateTime, new Date())
                .query(`
                    INSERT INTO [INV].[historial_documentos] 
                    (documento_id, accion, usuario_id, usuario_nombre, ip_usuario, detalles, fecha_accion)
                    VALUES 
                    (@documento_id, @accion, @usuario_id, @usuario_nombre, @ip_usuario, @detalles, @fecha_accion)
                `);

            res.json({ success: true, message: 'Historial de documento registrado' });

        } catch (error) {
            console.error('Error registrando historial de documento:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    registrarHistorialEstado: async (req, res) => {
        try {
            const { producto_id, accion, estado_anterior, estado_nuevo, estado, usuario_id, usuario_nombre, ip_usuario, detalles } = req.body;
            
            const pool = await getConnection();
            
            await pool.request()
                .input('producto_id', sql.Int, producto_id || null)
                .input('accion', sql.NVarChar, accion || 'CAMBIO_ESTADO')
                .input('estado_anterior', sql.NVarChar, estado_anterior || null)
                .input('estado_nuevo', sql.NVarChar, estado_nuevo || estado || null)
                .input('usuario_id', sql.Int, usuario_id || null)
                .input('usuario_nombre', sql.NVarChar, usuario_nombre || null)
                .input('ip_usuario', sql.NVarChar, ip_usuario || null)
                .input('detalles', sql.NVarChar, detalles || null)
                .input('fecha_accion', sql.DateTime, new Date())
                .query(`
                    INSERT INTO [INV].[historial_estado] 
                    (producto_id, accion, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, ip_usuario, detalles, fecha_accion)
                    VALUES 
                    (@producto_id, @accion, @estado_anterior, @estado_nuevo, @usuario_id, @usuario_nombre, @ip_usuario, @detalles, @fecha_accion)
                `);

            res.json({ success: true, message: 'Historial de estado registrado' });

        } catch (error) {
            console.error('Error registrando historial de estado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = historialController;