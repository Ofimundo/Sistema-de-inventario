// backend/models/documentoModel.js
const { getConnection, sql } = require('../config/database');

class DocumentoModel {
    /**
     * Verificar si la columna tamaño existe
     */
    async verificarColumnaTamaño() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT COUNT(*) as existe
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'INV' 
                    AND TABLE_NAME = 'documentos_asignacion' 
                    AND COLUMN_NAME = 'tamaño'
                `);
            return result.recordset[0].existe > 0;
        } catch (error) {
            console.error('❌ Error verificando columna tamaño:', error);
            return false;
        }
    }

    /**
     * Crear registro de documento
     */
    async crearRegistroDocumento(data) {
        try {
            const pool = await getConnection();
            
            console.log('📝 Creando registro de documento:', {
                uso_producto_id: data.uso_producto_id || data.producto_uso_id,
                nombre_documento: data.nombre_documento
            });

            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    INSERT INTO [INV].[documentos_asignacion] (
                        uso_producto_id,
                        nombre_documento,
                        ruta_documento,
                        fecha_generacion,
                        fecha_firmado,
                        estado,
                        tamaño,
                        created_at
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @uso_producto_id,
                        @nombre_documento,
                        @ruta_documento,
                        @fecha_generacion,
                        @fecha_firmado,
                        @estado,
                        @tamaño,
                        GETDATE()
                    )
                `;
            } else {
                query = `
                    INSERT INTO [INV].[documentos_asignacion] (
                        uso_producto_id,
                        nombre_documento,
                        ruta_documento,
                        fecha_generacion,
                        fecha_firmado,
                        estado,
                        created_at
                    ) 
                    OUTPUT INSERTED.*
                    VALUES (
                        @uso_producto_id,
                        @nombre_documento,
                        @ruta_documento,
                        @fecha_generacion,
                        @fecha_firmado,
                        @estado,
                        GETDATE()
                    )
                `;
            }

            const request = pool.request()
                .input('uso_producto_id', sql.Int, data.uso_producto_id || data.producto_uso_id)
                .input('nombre_documento', sql.NVarChar, data.nombre_documento)
                .input('ruta_documento', sql.NVarChar, data.ruta_documento)
                .input('fecha_generacion', sql.DateTime, data.fecha_generacion || new Date())
                .input('fecha_firmado', sql.DateTime, data.fecha_firmado || null)
                .input('estado', sql.NVarChar, data.estado || 'pendiente');
            
            if (tieneColumnaTamaño) {
                request.input('tamaño', sql.Int, data.tamaño || 0);
            }

            const result = await request.query(query);

            console.log('✅ Documento creado con ID:', result.recordset[0]?.id);
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error creando registro documento:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los documentos - VERSIÓN SIMPLIFICADA
     */
    async getAllDocumentos() {
        try {
            const pool = await getConnection();
            
            console.log('📥 Obteniendo todos los documentos...');
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT 
                        id,
                        uso_producto_id,
                        nombre_documento,
                        ruta_documento,
                        fecha_generacion,
                        fecha_firmado,
                        estado,
                        tamaño,
                        created_at,
                        updated_at
                    FROM [INV].[documentos_asignacion]
                    ORDER BY created_at DESC
                `;
            } else {
                query = `
                    SELECT 
                        id,
                        uso_producto_id,
                        nombre_documento,
                        ruta_documento,
                        fecha_generacion,
                        fecha_firmado,
                        estado,
                        0 as tamaño,
                        created_at,
                        updated_at
                    FROM [INV].[documentos_asignacion]
                    ORDER BY created_at DESC
                `;
            }

            const result = await pool.request().query(query);
            console.log(`✅ ${result.recordset.length} documentos encontrados`);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo todos los documentos:', error);
            return [];
        }
    }

    /**
     * Obtener documentos con información relacionada - CON LAS COLUMNAS CORRECTAS
     */
    async getAllDocumentosWithRelations() {
        try {
            const pool = await getConnection();
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT 
                        da.id,
                        da.uso_producto_id,
                        da.nombre_documento,
                        da.ruta_documento,
                        da.fecha_generacion,
                        da.fecha_firmado,
                        da.estado,
                        da.tamaño,
                        da.created_at,
                        da.updated_at,
                        pu.producto_id,
                        pu.usuario_asignado_id,
                        pu.nombre_usuario,
                        pu.email,
                        pu.rut_usuario,
                        pu.cargo,
                        pu.departamento,
                        pu.fecha_asignacion,
                        pu.fecha_devolucion,
                        pu.motivo,
                        pu.comentario,
                        pu.comentario_devolucion,

                        pu.estado as estado_asignacion,
                        pu.documento_entrega,
                        p.nombre as producto_nombre,
                        p.marca as producto_marca,
                        p.modelo as producto_modelo,
                        p.numero_serie
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    ORDER BY da.created_at DESC
                `;
            } else {
                query = `
                    SELECT 
                        da.id,
                        da.uso_producto_id,
                        da.nombre_documento,
                        da.ruta_documento,
                        da.fecha_generacion,
                        da.fecha_firmado,
                        da.estado,
                        0 as tamaño,
                        da.created_at,
                        da.updated_at,
                        pu.producto_id,
                        pu.usuario_asignado_id,
                        pu.nombre_usuario,
                        pu.email,
                        pu.rut_usuario,
                        pu.cargo,
                        pu.departamento,
                        pu.fecha_asignacion,
                        pu.fecha_devolucion,
                        pu.motivo,
                        pu.comentario,
                        pu.comentario_devolucion,
                        pu.estado as estado_asignacion,
                        pu.documento_entrega,
                        p.nombre as producto_nombre,
                        p.marca as producto_marca,
                        p.modelo as producto_modelo,
                        p.numero_serie
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    ORDER BY da.created_at DESC
                `;
            }

            const result = await pool.request().query(query);
            console.log(`✅ ${result.recordset.length} documentos encontrados con relaciones`);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo documentos con relaciones:', error);
            return this.getAllDocumentos();
        }
    }

    /**
     * Obtener documentos por ID de uso de producto
     */
    async getDocumentosByUsoId(uso_producto_id) {
        try {
            const pool = await getConnection();
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT da.*, 
                           pu.producto_id,
                           pu.usuario_asignado_id,
                           pu.nombre_usuario,
                           p.nombre as producto_nombre
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    WHERE da.uso_producto_id = @uso_producto_id
                    ORDER BY da.created_at DESC
                `;
            } else {
                query = `
                    SELECT 
                        da.id,
                        da.uso_producto_id,
                        da.nombre_documento,
                        da.ruta_documento,
                        da.fecha_generacion,
                        da.fecha_firmado,
                        da.estado,
                        0 as tamaño,
                        da.created_at,
                        da.updated_at,
                        pu.producto_id,
                        pu.usuario_asignado_id,
                        pu.nombre_usuario,
                        p.nombre as producto_nombre
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    WHERE da.uso_producto_id = @uso_producto_id
                    ORDER BY da.created_at DESC
                `;
            }

            const result = await pool.request()
                .input('uso_producto_id', sql.Int, uso_producto_id)
                .query(query);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo documentos por uso:', error);
            return [];
        }
    }

    /**
     * Obtener documento por ID
     */
    async getDocumentoById(id) {
        try {
            const pool = await getConnection();
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT da.*, 
                           pu.producto_id,
                           pu.usuario_asignado_id,
                           pu.nombre_usuario,
                           p.nombre as producto_nombre
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    WHERE da.id = @id
                `;
            } else {
                query = `
                    SELECT 
                        da.id,
                        da.uso_producto_id,
                        da.nombre_documento,
                        da.ruta_documento,
                        da.fecha_generacion,
                        da.fecha_firmado,
                        da.estado,
                        0 as tamaño,
                        da.created_at,
                        da.updated_at,
                        pu.producto_id,
                        pu.usuario_asignado_id,
                        pu.nombre_usuario,
                        p.nombre as producto_nombre
                    FROM [INV].[documentos_asignacion] da
                    LEFT JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    WHERE da.id = @id
                `;
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error obteniendo documento por ID:', error);
            return null;
        }
    }

    /**
     * Actualizar estado del documento
     */
    async actualizarEstadoDocumento(id, estado, fecha_firmado = null) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, estado)
                .input('fecha_firmado', sql.DateTime, fecha_firmado)
                .query(`
                    UPDATE [INV].[documentos_asignacion]
                    SET estado = @estado,
                        fecha_firmado = COALESCE(@fecha_firmado, fecha_firmado),
                        updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error actualizando estado documento:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de documentos
     */
    async getEstadisticas() {
        try {
            const pool = await getConnection();
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN estado = 'generado' THEN 1 ELSE 0 END) as generados,
                        SUM(CASE WHEN estado = 'firmado' THEN 1 ELSE 0 END) as firmados,
                        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                        SUM(CASE WHEN estado = 'eliminado' THEN 1 ELSE 0 END) as eliminados,
                        SUM(CASE WHEN nombre_documento LIKE '%.pdf' THEN 1 ELSE 0 END) as pdf,
                        SUM(CASE WHEN nombre_documento LIKE '%.docx' THEN 1 ELSE 0 END) as docx,
                        SUM(ISNULL(tamaño, 0)) as tamaño_total,
                        MAX(created_at) as ultimo_documento_fecha
                    FROM [INV].[documentos_asignacion]
                `;
            } else {
                query = `
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN estado = 'generado' THEN 1 ELSE 0 END) as generados,
                        SUM(CASE WHEN estado = 'firmado' THEN 1 ELSE 0 END) as firmados,
                        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                        SUM(CASE WHEN estado = 'eliminado' THEN 1 ELSE 0 END) as eliminados,
                        SUM(CASE WHEN nombre_documento LIKE '%.pdf' THEN 1 ELSE 0 END) as pdf,
                        SUM(CASE WHEN nombre_documento LIKE '%.docx' THEN 1 ELSE 0 END) as docx,
                        0 as tamaño_total,
                        MAX(created_at) as ultimo_documento_fecha
                    FROM [INV].[documentos_asignacion]
                `;
            }

            const result = await pool.request().query(query);
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                total: 0,
                generados: 0,
                firmados: 0,
                pendientes: 0,
                eliminados: 0,
                pdf: 0,
                docx: 0,
                tamaño_total: 0,
                ultimo_documento_fecha: null
            };
        }
    }

    /**
     * Buscar documentos por término
     */
    async buscarDocumentos(termino) {
        try {
            const pool = await getConnection();
            
            const tieneColumnaTamaño = await this.verificarColumnaTamaño();
            
            let query;
            if (tieneColumnaTamaño) {
                query = `
                    SELECT * FROM [INV].[documentos_asignacion]
                    WHERE nombre_documento LIKE @termino
                    ORDER BY created_at DESC
                `;
            } else {
                query = `
                    SELECT 
                        id,
                        uso_producto_id,
                        nombre_documento,
                        ruta_documento,
                        fecha_generacion,
                        fecha_firmado,
                        estado,
                        0 as tamaño,
                        created_at,
                        updated_at
                    FROM [INV].[documentos_asignacion]
                    WHERE nombre_documento LIKE @termino
                    ORDER BY created_at DESC
                `;
            }

            const result = await pool.request()
                .input('termino', sql.NVarChar, `%${termino}%`)
                .query(query);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error buscando documentos:', error);
            return [];
        }
    }

    /**
     * Eliminar documento (soft delete)
     */
    async eliminarDocumento(id) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, 'eliminado')
                .query(`
                    UPDATE [INV].[documentos_asignacion]
                    SET estado = @estado,
                        updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error eliminando documento:', error);
            throw error;
        }
    }

    /**
     * Eliminar documento físicamente
     */
    async eliminarDocumentoFisico(id) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM [INV].[documentos_asignacion]
                    OUTPUT DELETED.*
                    WHERE id = @id
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error eliminando documento físicamente:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos por usuario asignado
     */
    async getDocumentosByUsuario(usuario_asignado_id) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('usuario_asignado_id', sql.Int, usuario_asignado_id)
                .query(`
                    SELECT da.*, 
                           pu.producto_id,
                           p.nombre as producto_nombre
                    FROM [INV].[documentos_asignacion] da
                    INNER JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    LEFT JOIN [INV].[productos] p ON pu.producto_id = p.id
                    WHERE pu.usuario_asignado_id = @usuario_asignado_id
                    ORDER BY da.created_at DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo documentos por usuario:', error);
            return [];
        }
    }

    /**
     * Obtener documentos por producto
     */
    async getDocumentosByProducto(producto_id) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .query(`
                    SELECT da.*, 
                           pu.usuario_asignado_id,
                           pu.nombre_usuario
                    FROM [INV].[documentos_asignacion] da
                    INNER JOIN [INV].[producto_uso] pu ON da.uso_producto_id = pu.id
                    WHERE pu.producto_id = @producto_id
                    ORDER BY da.created_at DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error obteniendo documentos por producto:', error);
            return [];
        }
    }
}

module.exports = new DocumentoModel();