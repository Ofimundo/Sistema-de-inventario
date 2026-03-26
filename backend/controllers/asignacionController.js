// backend/controllers/asignacionController.js
const { getConnection, sql } = require('../config/database');

const asignacionController = {
    /**
     * Crear una nueva asignación
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
                firma_gerente
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
                
                // 2. Crear la asignación - INCLUIR id_estado_equipo
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
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('accion', sql.NVarChar, 'ASIGNACION')
                    .input('detalles', sql.NVarChar, `Producto asignado a colaborador ID: ${colaborador_id}. Motivo: ${motivo}`)
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
                
                console.log('✅ Asignación creada exitosamente');
                
                res.json({
                    success: true,
                    message: 'Asignación creada exitosamente',
                    data: {
                        id: nuevaAsignacion.id,
                        producto_id: nuevaAsignacion.producto_id,
                        colaborador_id: nuevaAsignacion.colaborador_id,
                        fecha_asignacion: nuevaAsignacion.fecha_asignacion,
                        motivo: nuevaAsignacion.motivo,
                        firma_trabajador: nuevaAsignacion.firma_trabajador,
                        firma_gerente: nuevaAsignacion.firma_gerente
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
     * Obtener asignaciones activas
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
     * Finalizar asignación (devolución)
     */
    finalizarAsignacion: async (req, res) => {
        let pool;
        let transaction;
        
        try {
            const { id } = req.params;
            const { fecha_devolucion, observaciones, condicion_entrega, firma_trabajador, firma_gerente } = req.body;
            
            console.log(`📥 PUT /api/asignaciones/${id}/finalizar`);
            
            if (!id) {
                return res.status(400).json({ success: false, message: 'ID de asignación requerido' });
            }
            
            pool = await getConnection();
            transaction = pool.transaction();
            await transaction.begin();
            
            try {
                // 1. Obtener la asignación
                const asignacionResult = await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        SELECT producto_id, colaborador_id 
                        FROM INV.asignaciones 
                        WHERE id = @id AND fecha_devolucion IS NULL
                    `);
                
                if (asignacionResult.recordset.length === 0) {
                    throw new Error('Asignación no encontrada o ya finalizada');
                }
                
                const asignacion = asignacionResult.recordset[0];
                
                // 2. Actualizar la asignación con la devolución
                await transaction.request()
                    .input('id', sql.Int, id)
                    .input('fecha_devolucion', sql.DateTime, fecha_devolucion || new Date())
                    .input('observaciones_devolucion', sql.NVarChar, observaciones || '')
                    .input('condicion_entrega', sql.NVarChar, condicion_entrega || 'BUENO')
                    .input('firma_trabajador_devolucion', sql.NVarChar, firma_trabajador || null)
                    .input('firma_gerente_devolucion', sql.NVarChar, firma_gerente || null)
                    .query(`
                        UPDATE INV.asignaciones 
                        SET 
                            fecha_devolucion = @fecha_devolucion,
                            observaciones_devolucion = @observaciones_devolucion,
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
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('accion', sql.NVarChar, 'DEVOLUCION')
                    .input('detalles', sql.NVarChar, `Producto devuelto. Condición: ${condicion_entrega}. Observaciones: ${observaciones || 'Ninguna'}`)
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
                
                console.log('✅ Asignación finalizada exitosamente');
                
                res.json({
                    success: true,
                    message: 'Devolución registrada exitosamente'
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
     * Obtener todas las asignaciones
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
    }
};

module.exports = asignacionController;