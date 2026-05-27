// backend/controllers/asignacionController.js - VERSIÓN ACTUALIZADA CON SOPORTE COMPLETO PARA PRÉSTAMOS Y DOCUMENTOS
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Directorio donde se guardan los documentos generados
const DOCS_DIR = path.join(__dirname, '../uploads/documentos');

const asignacionController = {
    /**
     * Crear una nueva asignación (CON PRÉSTAMO)
     */
    crearAsignacion: async (req, res) => {
        let pool;
        let transaction;
        
        try {
            console.log('📥 POST /api/asignaciones');
            console.log('Body recibido:', req.body);
            
            const { 
                producto_id, 
                colaborador_id, 
                motivo, 
                observaciones, 
                fecha_asignacion,
                usuario_responsable,
                firma_trabajador,
                firma_gerente,
                es_prestamo
            } = req.body;
            
            // Validaciones
            if (!producto_id || !colaborador_id || !motivo) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos requeridos: producto_id, colaborador_id, motivo' 
                });
            }
            
            pool = await getConnection();
            transaction = pool.transaction();
            await transaction.begin();
            
            try {
                // 1. Obtener el producto para verificar su estado actual
                const productoResult = await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .query(`
                        SELECT id, id_estado_equipo, nombre 
                        FROM INV.productos 
                        WHERE id = @producto_id
                    `);
                
                if (productoResult.recordset.length === 0) {
                    throw new Error('Producto no encontrado');
                }
                
                const producto = productoResult.recordset[0];
                console.log(`📊 Producto: ${producto.nombre}, Estado actual: ${producto.id_estado_equipo === 1 ? 'DISPONIBLE' : producto.id_estado_equipo === 2 ? 'ASIGNADO' : 'OTRO'}`);
                
                // Verificar que el producto esté disponible (id_estado_equipo = 1)
                if (producto.id_estado_equipo !== 1) {
                    throw new Error(`El producto no está disponible para asignación. Estado actual: ${producto.id_estado_equipo === 2 ? 'ASIGNADO' : 'NO DISPONIBLE'}`);
                }
                
                // 2. Crear la asignación - INCLUIR id_estado_equipo y es_prestamo
                const asignacionResult = await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('colaborador_id', sql.Int, colaborador_id)
                    .input('id_estado_equipo', sql.Int, 2) // Estado ASIGNADO
                    .input('motivo', sql.NVarChar, motivo)
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .input('fecha_asignacion', sql.DateTime, fecha_asignacion || new Date())
                    .input('firma_trabajador', sql.NVarChar, firma_trabajador || null)
                    .input('firma_gerente', sql.NVarChar, firma_gerente || null)
                    .input('usuario_responsable', sql.NVarChar, usuario_responsable || 'Sistema')
                    .input('es_prestamo', sql.Bit, es_prestamo || false)
                    .query(`
                        INSERT INTO INV.asignaciones (
                            producto_id,
                            colaborador_id,
                            id_estado_equipo,
                            motivo,
                            observaciones,
                            fecha_asignacion,
                            firma_trabajador,
                            firma_gerente,
                            usuario_responsable,
                            es_prestamo,
                            fecha_creacion
                        )
                        OUTPUT INSERTED.*
                        VALUES (
                            @producto_id,
                            @colaborador_id,
                            @id_estado_equipo,
                            @motivo,
                            @observaciones,
                            @fecha_asignacion,
                            @firma_trabajador,
                            @firma_gerente,
                            @usuario_responsable,
                            @es_prestamo,
                            GETDATE()
                        )
                    `);
                
                const nuevaAsignacion = asignacionResult.recordset[0];
                
                // 3. ACTUALIZAR EL ESTADO DEL PRODUCTO A ASIGNADO (id_estado_equipo = 2)
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('nuevo_estado', sql.Int, 2)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @nuevo_estado
                        WHERE id = @producto_id
                    `);
                
                console.log(`✅ Producto ${producto_id} actualizado a ASIGNADO (2)`);
                
                // 4. Registrar en el historial
                const tipoAsignacion = es_prestamo ? 'PRÉSTAMO' : 'ASIGNACION';
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('accion', sql.NVarChar, tipoAsignacion)
                    .input('detalles', sql.NVarChar, `${tipoAsignacion} de producto a colaborador ID: ${colaborador_id}. Motivo: ${motivo}`)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (
                            producto_id,
                            accion,
                            detalles,
                            fecha_hora
                        )
                        VALUES (
                            @producto_id,
                            @accion,
                            @detalles,
                            @fecha_hora
                        )
                    `);
                
                await transaction.commit();
                
                console.log(`✅ ${tipoAsignacion} creada exitosamente con ID: ${nuevaAsignacion.id}`);
                
                res.json({
                    success: true,
                    message: `${tipoAsignacion} creada exitosamente`,
                    data: {
                        id: nuevaAsignacion.id,
                        producto_id: nuevaAsignacion.producto_id,
                        colaborador_id: nuevaAsignacion.colaborador_id,
                        fecha_asignacion: nuevaAsignacion.fecha_asignacion,
                        motivo: nuevaAsignacion.motivo,
                        firma_trabajador: nuevaAsignacion.firma_trabajador,
                        firma_gerente: nuevaAsignacion.firma_gerente,
                        es_prestamo: nuevaAsignacion.es_prestamo
                    }
                });
                
            } catch (error) {
                if (transaction) await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en crearAsignacion:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear la asignación'
            });
        }
    },
    
    /**
     * Obtener asignaciones activas (CON PRÉSTAMO)
     */
    getAsignacionesActivas: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/activas');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.fecha_devolucion IS NULL
                ORDER BY a.fecha_asignacion DESC
            `);
            
            console.log(`✅ ${result.recordset.length} asignaciones activas encontradas`);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignacionesActivas:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Obtener solo préstamos activos
     */
    getPrestamosActivos: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/prestamos/activos');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.fecha_devolucion IS NULL AND a.es_prestamo = 1
                ORDER BY a.fecha_asignacion DESC
            `);
            
            console.log(`✅ ${result.recordset.length} préstamos activos encontrados`);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getPrestamosActivos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Buscar documento por asignación ID y tipo
     */
    buscarDocumentoPorAsignacion: async (req, res) => {
        try {
            const { asignacionId, tipo } = req.params;
            console.log(`📥 GET /api/asignaciones/buscar-documento/${asignacionId}/${tipo}`);
            
            // Buscar en el directorio de documentos
            if (!fs.existsSync(DOCS_DIR)) {
                return res.json({ success: false, message: 'No se encontró el documento', filename: null });
            }
            
            const files = fs.readdirSync(DOCS_DIR);
            const pattern = tipo === 'asignacion' 
                ? `acta_asignacion_${asignacionId}` 
                : `acta_recepcion_${asignacionId}`;
            
            const foundFile = files.find(file => file.includes(pattern) && file.endsWith('.pdf'));
            
            if (foundFile) {
                res.json({
                    success: true,
                    data: { filename: foundFile }
                });
            } else {
                res.json({ success: false, message: 'Documento no encontrado', filename: null });
            }
        } catch (error) {
            console.error('❌ Error en buscarDocumentoPorAsignacion:', error);
            res.status(500).json({ success: false, message: error.message, filename: null });
        }
    },
    
    /**
     * Obtener historial de préstamos
     */
    getHistorialPrestamos: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/prestamos/historial');
            
            const { fecha_inicio, fecha_fin, colaborador_id } = req.query;
            
            const pool = await getConnection();
            let query = `
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.observaciones_devolucion,
                    a.condicion_entrega,
                    a.usuario_responsable,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.es_prestamo = 1
            `;
            
            const request = pool.request();
            let condiciones = [];
            
            if (fecha_inicio) {
                request.input('fecha_inicio', sql.DateTime, fecha_inicio);
                condiciones.push('a.fecha_asignacion >= @fecha_inicio');
            }
            
            if (fecha_fin) {
                request.input('fecha_fin', sql.DateTime, fecha_fin);
                condiciones.push('a.fecha_asignacion <= @fecha_fin');
            }
            
            if (colaborador_id) {
                request.input('colaborador_id', sql.Int, colaborador_id);
                condiciones.push('a.colaborador_id = @colaborador_id');
            }
            
            if (condiciones.length > 0) {
                query += ' AND ' + condiciones.join(' AND ');
            }
            
            query += ' ORDER BY a.fecha_asignacion DESC';
            
            const result = await request.query(query);
            
            console.log(`✅ ${result.recordset.length} préstamos encontrados en historial`);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getHistorialPrestamos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Obtener estadísticas de préstamos
     */
    getEstadisticasPrestamos: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/prestamos/estadisticas');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as total_prestamos,
                    SUM(CASE WHEN fecha_devolucion IS NULL THEN 1 ELSE 0 END) as prestamos_activos,
                    SUM(CASE WHEN fecha_devolucion IS NOT NULL THEN 1 ELSE 0 END) as prestamos_devueltos,
                    COUNT(DISTINCT colaborador_id) as colaboradores_con_prestamos
                FROM INV.asignaciones
                WHERE es_prestamo = 1
            `);
            
            console.log(`✅ Estadísticas de préstamos:`, result.recordset[0]);
            
            res.json({
                success: true,
                data: {
                    totalPrestamos: result.recordset[0].total_prestamos || 0,
                    activos: result.recordset[0].prestamos_activos || 0,
                    devueltos: result.recordset[0].prestamos_devueltos || 0,
                    colaboradoresConPrestamos: result.recordset[0].colaboradores_con_prestamos || 0
                }
            });
            
        } catch (error) {
            console.error('❌ Error en getEstadisticasPrestamos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: {
                    totalPrestamos: 0,
                    activos: 0,
                    devueltos: 0,
                    colaboradoresConPrestamos: 0
                }
            });
        }
    },
    
    /**
     * Finalizar asignación (devolución) - CON PRÉSTAMO
     */
    finalizarAsignacion: async (req, res) => {
        let pool;
        let transaction;
        
        try {
            const { id } = req.params;
            const { 
                fecha_devolucion, 
                motivo_devolucion,
                observaciones_devolucion, 
                condicion_entrega, 
                firma_trabajador_devolucion, 
                firma_gerente_devolucion 
            } = req.body;
            
            console.log(`📥 PUT /api/asignaciones/${id}/finalizar`);
            console.log('Body recibido:', req.body);
            
            if (!id) {
                return res.status(400).json({ success: false, message: 'ID de asignación requerido' });
            }
            
            pool = await getConnection();
            transaction = pool.transaction();
            await transaction.begin();
            
            try {
                // 1. Obtener la asignación (incluir es_prestamo)
                const asignacionResult = await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        SELECT producto_id, colaborador_id, es_prestamo, motivo, observaciones
                        FROM INV.asignaciones 
                        WHERE id = @id AND fecha_devolucion IS NULL
                    `);
                
                if (asignacionResult.recordset.length === 0) {
                    throw new Error('Asignación no encontrada o ya finalizada');
                }
                
                const asignacion = asignacionResult.recordset[0];
                const esPrestamo = asignacion.es_prestamo === true || asignacion.es_prestamo === 1;
                
                // Combinar observaciones
                const observacionesCombinadas = `[MOTIVO DEVOLUCIÓN]: ${motivo_devolucion || (esPrestamo ? 'Devolución de préstamo' : 'No especificado')}
[OBSERVACIONES]: ${observaciones_devolucion || 'Sin observaciones'}
[CONDICIÓN]: ${condicion_entrega || 'BUENO'}
[FECHA RECEPCIÓN]: ${new Date().toLocaleString()}`;
                
                // 2. Actualizar la asignación con la devolución
                await transaction.request()
                    .input('id', sql.Int, id)
                    .input('fecha_devolucion', sql.DateTime, fecha_devolucion || new Date())
                    .input('observaciones', sql.NVarChar, observacionesCombinadas)
                    .input('condicion_entrega', sql.NVarChar, condicion_entrega || 'BUENO')
                    .input('firma_trabajador_devolucion', sql.NVarChar, firma_trabajador_devolucion || null)
                    .input('firma_gerente_devolucion', sql.NVarChar, firma_gerente_devolucion || null)
                    .query(`
                        UPDATE INV.asignaciones 
                        SET 
                            fecha_devolucion = @fecha_devolucion,
                            observaciones = @observaciones,
                            condicion_entrega = @condicion_entrega,
                            firma_trabajador_devolucion = @firma_trabajador_devolucion,
                            firma_gerente_devolucion = @firma_gerente_devolucion
                        WHERE id = @id
                    `);
                
                // 3. ACTUALIZAR EL ESTADO DEL PRODUCTO A DISPONIBLE (id_estado_equipo = 1)
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('nuevo_estado', sql.Int, 1)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @nuevo_estado
                        WHERE id = @producto_id
                    `);
                
                console.log(`✅ Producto ${asignacion.producto_id} actualizado a DISPONIBLE (1)`);
                
                // 4. Registrar en el historial
                const tipoOperacion = esPrestamo ? 'DEVOLUCION_PRESTAMO' : 'DEVOLUCION';
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('accion', sql.NVarChar, tipoOperacion)
                    .input('detalles', sql.NVarChar, `${esPrestamo ? 'Devolución de préstamo' : 'Devolución de producto'}. Motivo: ${motivo_devolucion || 'No especificado'}. Condición: ${condicion_entrega || 'BUENO'}. Observaciones: ${observaciones_devolucion || 'Ninguna'}`)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (
                            producto_id,
                            accion,
                            detalles,
                            fecha_hora
                        )
                        VALUES (
                            @producto_id,
                            @accion,
                            @detalles,
                            @fecha_hora
                        )
                    `);
                
                await transaction.commit();
                
                console.log(`✅ ${esPrestamo ? 'Préstamo' : 'Asignación'} finalizada exitosamente`);
                
                res.json({
                    success: true,
                    message: esPrestamo ? 'Devolución de préstamo registrada exitosamente' : 'Devolución registrada exitosamente',
                    data: {
                        es_prestamo: esPrestamo,
                        documento: !esPrestamo ? { filename: `acta_recepcion_${id}.pdf` } : null
                    }
                });
                
            } catch (error) {
                if (transaction) await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en finalizarAsignacion:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al finalizar la asignación'
            });
        }
    },
    
    /**
     * Obtener todas las asignaciones (CON PRÉSTAMO)
     */
    getAsignaciones: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.observaciones_devolucion,
                    a.condicion_entrega,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                ORDER BY a.fecha_asignacion DESC
            `);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignaciones:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Obtener asignación por ID
     */
    getAsignacionById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 GET /api/asignaciones/${id}`);
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        a.id,
                        a.producto_id,
                        a.colaborador_id,
                        a.id_estado_equipo,
                        a.motivo,
                        a.observaciones,
                        a.fecha_asignacion,
                        a.fecha_devolucion,
                        a.firma_trabajador,
                        a.firma_gerente,
                        a.usuario_responsable,
                        a.observaciones_devolucion,
                        a.condicion_entrega,
                        a.es_prestamo,
                        p.nombre as producto_nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.id_estado_equipo as producto_estado,
                        c.nombre as colaborador_nombre,
                        c.rut as colaborador_rut,
                        c.email as colaborador_email,
                        c.cargo as colaborador_cargo,
                        c.departamento as colaborador_departamento
                    FROM INV.asignaciones a
                    LEFT JOIN INV.productos p ON a.producto_id = p.id
                    LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                    WHERE a.id = @id
                `);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: result.recordset[0]
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignacionById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Obtener estadísticas generales (incluye préstamos)
     */
    getEstadisticas: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/estadisticas');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as total_asignaciones,
                    SUM(CASE WHEN fecha_devolucion IS NULL THEN 1 ELSE 0 END) as asignaciones_activas,
                    SUM(CASE WHEN fecha_devolucion IS NOT NULL THEN 1 ELSE 0 END) as asignaciones_completadas,
                    SUM(CASE WHEN es_prestamo = 1 THEN 1 ELSE 0 END) as total_prestamos,
                    SUM(CASE WHEN es_prestamo = 1 AND fecha_devolucion IS NULL THEN 1 ELSE 0 END) as prestamos_activos
                FROM INV.asignaciones
            `);
            
            console.log(`✅ Estadísticas generales:`, result.recordset[0]);
            
            res.json({
                success: true,
                data: {
                    totalAsignaciones: result.recordset[0].total_asignaciones || 0,
                    activas: result.recordset[0].asignaciones_activas || 0,
                    completadas: result.recordset[0].asignaciones_completadas || 0,
                    totalPrestamos: result.recordset[0].total_prestamos || 0,
                    prestamosActivos: result.recordset[0].prestamos_activos || 0
                }
            });
            
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: {
                    totalAsignaciones: 0,
                    activas: 0,
                    completadas: 0,
                    totalPrestamos: 0,
                    prestamosActivos: 0
                }
            });
        }
    }
};

module.exports = asignacionController;