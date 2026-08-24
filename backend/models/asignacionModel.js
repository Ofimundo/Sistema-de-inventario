// backend/models/asignacionModel.js - VERSIÓN CORREGIDA SIN CANTIDAD
const { getConnection, sql } = require('../config/database');

class AsignacionModel {
    /**
     * Crear una nueva asignación
     */
    async crearAsignacion(data) {
        try {
            const pool = await getConnection();
            
            console.log('📝 MODELO - Creando asignación');
            console.log('📝 producto_id:', data.producto_id);
            console.log('📝 usuario_id:', data.usuario_asignado_id);
            console.log('📝 nombre_usuario:', data.nombre_usuario);

            // Verificar que el producto existe y está disponible
            const productoCheck = await pool.request()
                .input('producto_id', sql.Int, data.producto_id)
                .query(`
                    SELECT id, nombre, numero_serie, estado 
                    FROM [INV].[productos] 
                    WHERE id = @producto_id
                `);

            if (productoCheck.recordset.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const producto = productoCheck.recordset[0];
            
            if (producto.estado !== 'DISPONIBLE') {
                throw new Error(`Producto no disponible. Estado actual: ${producto.estado}`);
            }

            // Insertar en [INV].[asignaciones] - SIN cantidad
            const result = await pool.request()
                .input('producto_id', sql.Int, data.producto_id)
                .input('usuario_id', sql.Int, data.usuario_asignado_id || null)
                .input('nombre_usuario', sql.NVarChar, data.nombre_usuario)
                .input('email', sql.NVarChar, data.email || '')
                .input('rut_usuario', sql.NVarChar, data.rut_usuario || '')
                .input('cargo', sql.NVarChar, data.cargo || '')
                .input('departamento', sql.NVarChar, data.departamento || '')
                .input('fecha_asignacion', sql.DateTime, data.fecha_asignacion || new Date())
                .input('motivo', sql.NVarChar, data.motivo || 'Asignación de equipo')
                .input('observaciones', sql.NVarChar, data.comentario || '')
                .input('estado', sql.NVarChar, 'ASIGNADO')
                .input('firma_trabajador', sql.NVarChar, data.firma_trabajador || '')
                .input('firma_gerente', sql.NVarChar, data.firma_gerente || '')
                .input('usuario_responsable', sql.NVarChar, data.usuario_responsable || 'Sistema')
                .query(`
                    INSERT INTO [INV].[asignaciones] (
                        producto_id,
                        usuario_id,
                        nombre_usuario,
                        email,
                        rut_usuario,
                        cargo,
                        departamento,
                        fecha_asignacion,
                        motivo,
                        observaciones,
                        estado,
                        firma_trabajador,
                        firma_gerente,
                        usuario_responsable
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @producto_id,
                        @usuario_id,
                        @nombre_usuario,
                        @email,
                        @rut_usuario,
                        @cargo,
                        @departamento,
                        @fecha_asignacion,
                        @motivo,
                        @observaciones,
                        @estado,
                        @firma_trabajador,
                        @firma_gerente,
                        @usuario_responsable
                    )
                `);

            const asignacion = result.recordset[0];
            console.log('✅ Asignación insertada en [INV].[asignaciones], ID:', asignacion.id);

            // ACTUALIZAR EL ESTADO DEL PRODUCTO A 'ASIGNADO' (id_estado_equipo = 2)
            await pool.request()
                .input('producto_id', sql.Int, data.producto_id)
                .input('estado', sql.NVarChar, 'ASIGNADO')
                .input('id_estado_equipo', sql.Int, 2)
                .query(`
                    UPDATE [INV].[productos] 
                    SET estado = @estado, id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            console.log('✅ Producto actualizado: estado = ASIGNADO');

            return asignacion;

        } catch (error) {
            console.error('❌ MODELO - Error en crearAsignacion:', error);
            throw error;
        }
    }

    /**
     * Obtener todas las asignaciones
     */
    async getAllAsignaciones() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.marca as producto_marca,
                           p.modelo as producto_modelo,
                           p.numero_serie,
                           p.estado as producto_estado
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getAllAsignaciones:', error);
            throw error;
        }
    }

    /**
     * Obtener asignaciones activas
     */
    async getAsignacionesActivas() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.marca as producto_marca,
                           p.modelo as producto_modelo,
                           p.numero_serie,
                           p.estado as producto_estado
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.estado = 'ASIGNADO' AND a.fecha_devolucion IS NULL
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getAsignacionesActivas:', error);
            throw error;
        }
    }

    /**
     * Obtener asignaciones activas de un producto específico
     */
    async getAsignacionesActivasByProducto(productoId) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.numero_serie
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.producto_id = @producto_id 
                      AND a.estado = 'ASIGNADO' 
                      AND a.fecha_devolucion IS NULL
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getAsignacionesActivasByProducto:', error);
            throw error;
        }
    }

    /**
     * Obtener productos asignados a un colaborador
     */
    async getProductosByColaborador(colaboradorId) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('colaborador_id', sql.Int, colaboradorId)
                .query(`
                    SELECT p.*, 
                           a.fecha_asignacion,
                           a.motivo as motivo_asignacion,
                           a.observaciones,
                           a.id as asignacion_id
                    FROM [INV].[productos] p
                    INNER JOIN [INV].[asignaciones] a ON p.id = a.producto_id
                    WHERE a.usuario_id = @colaborador_id 
                      AND a.estado = 'ASIGNADO' 
                      AND a.fecha_devolucion IS NULL
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getProductosByColaborador:', error);
            throw error;
        }
    }

    /**
     * Obtener una asignación por ID
     */
    async getAsignacionById(id) {
        try {
            const pool = await getConnection();
            
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                console.error('❌ ID de asignación inválido:', id);
                return null;
            }
            
            console.log(`🔍 Buscando asignación por ID: ${idNum}`);
            
            const result = await pool.request()
                .input('id', sql.Int, idNum)
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.marca as producto_marca,
                           p.modelo as producto_modelo,
                           p.numero_serie,
                           p.condicion as producto_condicion
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.id = @id
                `);

            if (result.recordset.length === 0) {
                console.log(`⚠️ No se encontró asignación con ID: ${idNum}`);
                return null;
            }

            console.log(`✅ Asignación encontrada: ID ${idNum}`);
            return result.recordset[0];

        } catch (error) {
            console.error('❌ Error en getAsignacionById:', error);
            throw error;
        }
    }

    /**
     * Obtener asignaciones por producto
     */
    async getAsignacionesByProducto(productoId) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('productoId', sql.Int, productoId)
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.numero_serie
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.producto_id = @productoId
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getAsignacionesByProducto:', error);
            throw error;
        }
    }

    /**
     * Obtener asignaciones por usuario
     */
    async getAsignacionesByUsuario(usuarioId) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .query(`
                    SELECT a.*, 
                           p.nombre as producto_nombre,
                           p.numero_serie
                    FROM [INV].[asignaciones] a
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.usuario_id = @usuarioId
                    ORDER BY a.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getAsignacionesByUsuario:', error);
            throw error;
        }
    }

    /**
     * Registrar devolución
     */
    async registrarDevolucion(id, data) {
        try {
            const pool = await getConnection();
            
            const asignacion = await this.getAsignacionById(id);
            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }

            const transaction = pool.transaction();
            await transaction.begin();

            try {
                const result = await transaction.request()
                    .input('id', sql.Int, id)
                    .input('fecha_devolucion', sql.DateTime, new Date())
                    .input('observaciones_devolucion', sql.NVarChar, data.comentario || '')
                    .input('condicion_entrega', sql.NVarChar, data.condicion_entrega || 'BUENO')
                    .query(`
                        UPDATE [INV].[asignaciones]
                        SET fecha_devolucion = @fecha_devolucion,
                            observaciones_devolucion = @observaciones_devolucion,
                            condicion_entrega = @condicion_entrega,
                            estado = 'DEVUELTO'
                        OUTPUT INSERTED.*
                        WHERE id = @id
                    `);

                // Actualizar estado del producto a DISPONIBLE
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('estado', sql.NVarChar, 'DISPONIBLE')
                    .input('id_estado_equipo', sql.Int, 1)
                    .query(`
                        UPDATE [INV].[productos] 
                        SET estado = @estado, id_estado_equipo = @id_estado_equipo
                        WHERE id = @producto_id
                    `);

                await transaction.commit();

                return result.recordset[0];
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('❌ Error en registrarDevolucion:', error);
            throw error;
        }
    }

    /**
     * Finalizar asignación (devolución)
     */
    async finalizarAsignacion(asignacionId, data) {
        try {
            const pool = await getConnection();
            
            const asignacion = await this.getAsignacionById(asignacionId);
            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }

            const transaction = pool.transaction();
            await transaction.begin();

            try {
                const result = await transaction.request()
                    .input('id', sql.Int, asignacionId)
                    .input('fecha_devolucion', sql.DateTime, data.fecha_devolucion || new Date())
                    .input('observaciones', sql.NVarChar, data.observaciones || '')
                    .input('condicion_entrega', sql.NVarChar, data.condicion_entrega || 'BUENO')
                    .query(`
                        UPDATE [INV].[asignaciones]
                        SET fecha_devolucion = @fecha_devolucion,
                            observaciones_devolucion = @observaciones,
                            condicion_entrega = @condicion_entrega,
                            estado = 'COMPLETADA'
                        OUTPUT INSERTED.*
                        WHERE id = @id
                    `);

                // Verificar si hay otras asignaciones activas para este producto
                const otrasAsignaciones = await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('asignacion_id', sql.Int, asignacionId)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM [INV].[asignaciones] 
                        WHERE producto_id = @producto_id 
                          AND id != @asignacion_id 
                          AND estado = 'ASIGNADO' 
                          AND fecha_devolucion IS NULL
                    `);

                // Si no hay otras asignaciones activas, cambiar estado del producto a DISPONIBLE
                if (otrasAsignaciones.recordset[0].count === 0) {
                    await transaction.request()
                        .input('producto_id', sql.Int, asignacion.producto_id)
                        .input('estado', sql.NVarChar, 'DISPONIBLE')
                        .query(`
                            UPDATE [INV].[productos] 
                            SET estado = @estado 
                            WHERE id = @producto_id
                        `);
                }

                await transaction.commit();

                return result.recordset[0];
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('❌ Error en finalizarAsignacion:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas
     */
    async getEstadisticas() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        (SELECT COUNT(*) FROM [INV].[asignaciones]) as total_asignaciones,
                        (SELECT COUNT(*) FROM [INV].[asignaciones] WHERE estado = 'ASIGNADO' AND fecha_devolucion IS NULL) as activas,
                        (SELECT COUNT(*) FROM [INV].[asignaciones] WHERE estado = 'DEVUELTO' OR estado = 'COMPLETADA') as devueltas,
                        (SELECT COUNT(*) FROM [INV].[asignaciones] WHERE YEAR(fecha_asignacion) = YEAR(GETDATE())) as asignaciones_anio,
                        (SELECT COUNT(*) FROM [INV].[productos] WHERE estado IN ('ASIGNADO', 'DONADO', 'BAJA')) as productos_asignados,
                        (SELECT COUNT(*) FROM [INV].[productos] WHERE estado = 'DISPONIBLE') as productos_disponibles
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Obtener historial con filtros
     */
    async getHistorial(filtros = {}) {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            let query = `
                SELECT a.*, 
                       p.nombre as producto_nombre,
                       p.marca as producto_marca,
                       p.modelo as producto_modelo,
                       p.numero_serie
                FROM [INV].[asignaciones] a
                LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                WHERE 1=1
            `;

            if (filtros.productoId) {
                query += ' AND a.producto_id = @productoId';
                request.input('productoId', sql.Int, filtros.productoId);
            }

            if (filtros.usuarioId) {
                query += ' AND a.usuario_id = @usuarioId';
                request.input('usuarioId', sql.Int, filtros.usuarioId);
            }

            if (filtros.fechaInicio) {
                query += ' AND a.fecha_asignacion >= @fechaInicio';
                request.input('fechaInicio', sql.DateTime, filtros.fechaInicio);
            }

            if (filtros.fechaFin) {
                query += ' AND a.fecha_asignacion <= @fechaFin';
                request.input('fechaFin', sql.DateTime, filtros.fechaFin);
            }

            if (filtros.tipo) {
                if (filtros.tipo === 'ASIGNACION') {
                    query += ' AND a.estado = \'ASIGNADO\' AND a.fecha_devolucion IS NULL';
                } else if (filtros.tipo === 'RECEPCION') {
                    query += ' AND (a.estado = \'DEVUELTO\' OR a.estado = \'COMPLETADA\' OR a.fecha_devolucion IS NOT NULL)';
                }
            }

            query += ' ORDER BY a.fecha_asignacion DESC';

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getHistorial:', error);
            throw error;
        }
    }

    /**
     * Verificar si hay una asignación activa para un producto
     */
    async verificarAsignacionActiva(productoId, nombreUsuario) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .input('nombre_usuario', sql.NVarChar, nombreUsuario)
                .query(`
                    SELECT id 
                    FROM [INV].[asignaciones] 
                    WHERE producto_id = @producto_id 
                      AND nombre_usuario = @nombre_usuario
                      AND estado = 'ASIGNADO'
                      AND fecha_devolucion IS NULL
                    ORDER BY id DESC
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en verificarAsignacionActiva:', error);
            throw error;
        }
    }

    /**
     * Obtener productos dados de baja
     */
    async getProductosBaja() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        p.*,
                        'BAJA' as tipo_disposicion
                    FROM [INV].[productos] p
                    WHERE p.estado IN ('DONADO', 'BAJA')
                    ORDER BY p.fecha_creacion DESC
                `);

            console.log(`✅ Productos de baja encontrados: ${result.recordset.length}`);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error en getProductosBaja:', error);
            return [];
        }
    }

    /**
     * Actualizar estado de un producto
     */
    async actualizarEstadoProducto(productoId, estado) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .input('estado', sql.NVarChar, estado)
                .query(`
                    UPDATE [INV].[productos] 
                    SET estado = @estado
                    OUTPUT INSERTED.*
                    WHERE id = @producto_id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en actualizarEstadoProducto:', error);
            throw error;
        }
    }
}

module.exports = new AsignacionModel();