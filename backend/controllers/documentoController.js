// backend/controllers/documentoController.js
const documentoModel = require('../models/documentoModel');
const path = require('path');
const fs = require('fs').promises;
const { getConnection, sql } = require('../config/database');

class DocumentoController {
    /**
     * Obtener todos los documentos
     */
    async getDocumentos(req, res) {
        try {
            console.log('📥 getDocumentos - Procesando solicitud');
            
            // Intentar obtener con relaciones, si falla usa la versión simple
            let documentos;
            try {
                documentos = await documentoModel.getAllDocumentosWithRelations();
            } catch (error) {
                console.log('⚠️ Error en JOIN, usando versión simple:', error.message);
                documentos = await documentoModel.getAllDocumentos();
            }
            
            // Mapear al formato esperado por el frontend con las columnas correctas
            const documentosFormateados = documentos.map(doc => ({
                id: doc.id,
                nombre: doc.nombre_documento,
                filename: doc.nombre_documento,
                fecha: doc.fecha_generacion || doc.created_at,
                tamaño: doc.tamaño || 0,
                tipo: doc.nombre_documento?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx',
                ruta: doc.ruta_documento,
                asignacion_id: doc.uso_producto_id,
                producto_id: doc.producto_id,
                usuario_asignado_id: doc.usuario_asignado_id,
                estado: doc.estado,
                producto_nombre: doc.producto_nombre || 'Producto no disponible',
                nombre_usuario: doc.nombre_usuario || 'Usuario no disponible',
                rut_usuario: doc.rut_usuario,
                cargo: doc.cargo,
                departamento: doc.departamento,
                numero_serie: doc.numero_serie,
                marca: doc.producto_marca,
                modelo: doc.producto_modelo,
                fecha_asignacion: doc.fecha_asignacion,
                motivo: doc.motivo,
                comentario: doc.comentario,
                estado_asignacion: doc.estado_asignacion
            }));

            console.log(`✅ ${documentosFormateados.length} documentos formateados`);
            
            res.json({
                success: true,
                data: documentosFormateados
            });
        } catch (error) {
            console.error('❌ Error en getDocumentos:', error);
            res.json({
                success: true,
                data: []
            });
        }
    }

    /**
     * Obtener documentos por asignación
     */
    async getDocumentosByAsignacion(req, res) {
        try {
            const { asignacionId } = req.params;
            
            if (!asignacionId || isNaN(parseInt(asignacionId))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de asignación inválido'
                });
            }

            console.log(`📥 Buscando documentos para asignación: ${asignacionId}`);
            const documentos = await documentoModel.getDocumentosByUsoId(parseInt(asignacionId));
            
            res.json({
                success: true,
                data: documentos
            });
        } catch (error) {
            console.error('❌ Error en getDocumentosByAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener documentos por asignación',
                error: error.message
            });
        }
    }

    /**
     * Descargar documento por nombre de archivo
     */
    async downloadDocumento(req, res) {
        try {
            const { filename } = req.params;
            
            if (!filename) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de archivo no proporcionado'
                });
            }

            console.log(`📥 Solicitando descarga de: ${filename}`);
            
            // Buscar el documento en la base de datos
            const documentos = await documentoModel.getAllDocumentos();
            const documento = documentos.find(d => d.nombre_documento === filename);
            
            if (!documento) {
                console.log(`❌ Documento no encontrado en BD: ${filename}`);
                
                // Intentar buscar el archivo directamente en la carpeta uploads
                const directPath = path.join(__dirname, '..', 'uploads', 'documentos', filename);
                try {
                    await fs.access(directPath);
                    console.log('✅ Archivo encontrado en sistema aunque no en BD');
                    return res.download(directPath, filename);
                } catch (err) {
                    return res.status(404).json({
                        success: false,
                        message: 'Documento no encontrado en la base de datos'
                    });
                }
            }

            // Determinar la ruta del archivo
            let filePath;
            
            if (documento.ruta_documento) {
                if (path.isAbsolute(documento.ruta_documento)) {
                    filePath = documento.ruta_documento;
                } else if (documento.ruta_documento.startsWith('/')) {
                    filePath = path.join(__dirname, '..', documento.ruta_documento);
                } else {
                    filePath = path.join(__dirname, '..', documento.ruta_documento);
                }
            } else {
                filePath = path.join(__dirname, '..', 'uploads', 'documentos', filename);
            }
            
            console.log(`🔍 Buscando archivo en: ${filePath}`);
            
            // Verificar si el archivo existe
            let fileExists = false;
            try {
                await fs.access(filePath);
                fileExists = true;
                console.log('✅ Archivo encontrado en ruta principal');
            } catch (error) {
                console.log('⚠️ Archivo no encontrado en ruta principal');
            }
            
            // Buscar en ubicaciones alternativas
            if (!fileExists) {
                const altPaths = [
                    path.join(__dirname, '..', 'uploads', 'documentos', filename),
                    path.join(__dirname, '..', '..', 'uploads', 'documentos', filename),
                    path.join(process.cwd(), 'uploads', 'documentos', filename)
                ];
                
                for (const altPath of altPaths) {
                    try {
                        await fs.access(altPath);
                        filePath = altPath;
                        fileExists = true;
                        console.log(`✅ Archivo encontrado en ruta alternativa: ${altPath}`);
                        break;
                    } catch (e) {
                        // Continuar buscando
                    }
                }
            }
            
            if (!fileExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo físico no encontrado en el servidor'
                });
            }

            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error('❌ Error al descargar:', err);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Error al descargar el archivo'
                        });
                    }
                } else {
                    console.log('✅ Archivo enviado correctamente');
                }
            });
        } catch (error) {
            console.error('❌ Error en downloadDocumento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al descargar documento',
                error: error.message
            });
        }
    }

    /**
     * Descargar documento por ID
     */
    async downloadDocumentoById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de documento inválido'
                });
            }

            console.log(`📥 Solicitando descarga por ID: ${id}`);
            
            const documento = await documentoModel.getDocumentoById(parseInt(id));
            
            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            let filePath;
            if (documento.ruta_documento) {
                filePath = documento.ruta_documento.startsWith('/') 
                    ? path.join(__dirname, '..', documento.ruta_documento)
                    : documento.ruta_documento;
            } else {
                filePath = path.join(__dirname, '..', 'uploads', 'documentos', documento.nombre_documento);
            }
            
            try {
                await fs.access(filePath);
                console.log('✅ Archivo encontrado');
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo físico no encontrado'
                });
            }

            res.download(filePath, documento.nombre_documento, (err) => {
                if (err) {
                    console.error('❌ Error al descargar:', err);
                } else {
                    console.log('✅ Descarga completada');
                }
            });
        } catch (error) {
            console.error('❌ Error en downloadDocumentoById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al descargar documento',
                error: error.message
            });
        }
    }

    /**
     * Verificar si un documento existe
     */
    async verificarDocumento(req, res) {
        try {
            const { filename } = req.params;
            
            const documentos = await documentoModel.getAllDocumentos();
            const documento = documentos.find(d => d.nombre_documento === filename);
            
            if (!documento) {
                return res.status(404).end();
            }

            let filePath;
            if (documento.ruta_documento) {
                filePath = documento.ruta_documento.startsWith('/') 
                    ? path.join(__dirname, '..', documento.ruta_documento)
                    : documento.ruta_documento;
            } else {
                filePath = path.join(__dirname, '..', 'uploads', 'documentos', filename);
            }
            
            try {
                await fs.access(filePath);
                res.status(200).end();
            } catch (error) {
                res.status(404).end();
            }
        } catch (error) {
            console.error('❌ Error en verificarDocumento:', error);
            res.status(500).end();
        }
    }

    /**
     * Eliminar documento (soft delete)
     */
    async eliminarDocumento(req, res) {
        try {
            const { filename } = req.params;
            
            const documentos = await documentoModel.getAllDocumentos();
            const documento = documentos.find(d => d.nombre_documento === filename);
            
            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }
            
            const resultado = await documentoModel.eliminarDocumento(documento.id);
            
            res.json({
                success: true,
                message: 'Documento eliminado correctamente',
                data: resultado
            });
        } catch (error) {
            console.error('❌ Error en eliminarDocumento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar documento',
                error: error.message
            });
        }
    }

    /**
     * Obtener estadísticas de documentos
     */
    async getEstadisticas(req, res) {
        try {
            const estadisticas = await documentoModel.getEstadisticas();
            
            res.json({
                success: true,
                data: estadisticas
            });
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            
            // Fallback: calcular manualmente
            try {
                const documentos = await documentoModel.getAllDocumentos();
                const estadisticas = {
                    total: documentos.length,
                    pdf: documentos.filter(d => d.nombre_documento?.toLowerCase().endsWith('.pdf')).length,
                    docx: documentos.filter(d => d.nombre_documento?.toLowerCase().endsWith('.docx')).length,
                    generados: documentos.filter(d => d.estado === 'generado').length,
                    firmados: documentos.filter(d => d.estado === 'firmado').length,
                    pendientes: documentos.filter(d => d.estado === 'pendiente').length,
                    tamañoTotal: documentos.reduce((acc, doc) => acc + (doc.tamaño || 0), 0),
                    ultimoDocumento: documentos.length > 0 ? {
                        id: documentos[0].id,
                        nombre: documentos[0].nombre_documento,
                        fecha: documentos[0].fecha_generacion
                    } : null
                };

                res.json({
                    success: true,
                    data: estadisticas
                });
            } catch (fallbackError) {
                res.json({
                    success: true,
                    data: {
                        total: 0,
                        pdf: 0,
                        docx: 0,
                        generados: 0,
                        firmados: 0,
                        pendientes: 0,
                        tamañoTotal: 0,
                        ultimoDocumento: null
                    }
                });
            }
        }
    }

    /**
     * Buscar documentos
     */
    async buscarDocumentos(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.trim() === '') {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const resultados = await documentoModel.buscarDocumentos(q.trim());
            
            if (resultados.length === 0) {
                const documentos = await documentoModel.getAllDocumentos();
                const termino = q.toLowerCase().trim();
                const filtrados = documentos.filter(doc => 
                    doc.nombre_documento?.toLowerCase().includes(termino)
                );
                
                return res.json({
                    success: true,
                    data: filtrados
                });
            }

            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('❌ Error en buscarDocumentos:', error);
            res.json({
                success: true,
                data: []
            });
        }
    }

    /**
     * Registrar un nuevo documento - VERSIÓN MEJORADA
     */
    async registrarDocumento(req, res) {
        try {
            console.log('📥 POST /api/documentos/registrar - Recibido:');
            console.log('📦 Body:', req.body);

            const { 
                uso_producto_id, 
                nombre_documento, 
                ruta_documento, 
                fecha_generacion,
                estado,
                tamaño 
            } = req.body;

            // Validaciones detalladas
            const errores = [];
            
            if (!uso_producto_id) {
                errores.push('El ID de uso de producto es requerido');
            } else if (isNaN(parseInt(uso_producto_id))) {
                errores.push('El ID de uso de producto debe ser un número válido');
            }
            
            if (!nombre_documento) {
                errores.push('El nombre del documento es requerido');
            }
            
            if (!ruta_documento) {
                errores.push('La ruta del documento es requerida');
            }
            
            if (errores.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errores
                });
            }

            // Verificar que el uso_producto_id existe
            const pool = await getConnection();
            const checkResult = await pool.request()
                .input('uso_producto_id', sql.Int, parseInt(uso_producto_id))
                .query(`
                    SELECT id FROM [INV].[producto_uso] 
                    WHERE id = @uso_producto_id
                `);

            if (checkResult.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `El uso_producto_id ${uso_producto_id} no existe en la base de datos`
                });
            }

            // Preparar datos para inserción
            const documentoData = {
                uso_producto_id: parseInt(uso_producto_id),
                nombre_documento,
                ruta_documento,
                fecha_generacion: fecha_generacion ? new Date(fecha_generacion) : new Date(),
                estado: estado || 'generado',
                tamaño: tamaño ? parseInt(tamaño) : 0
            };

            console.log('📝 Registrando documento en BD:', documentoData);

            const resultado = await documentoModel.crearRegistroDocumento(documentoData);

            console.log('✅ Documento registrado exitosamente:', resultado);

            res.json({
                success: true,
                message: 'Documento registrado exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('❌ Error en registrarDocumento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar documento',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    /**
     * Obtener documentos por usuario asignado
     */
    async getDocumentosByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            
            if (!usuarioId || isNaN(parseInt(usuarioId))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }

            console.log(`📥 Buscando documentos para usuario: ${usuarioId}`);
            
            const documentos = await documentoModel.getDocumentosByUsuario(parseInt(usuarioId));
            
            res.json({
                success: true,
                data: documentos
            });
        } catch (error) {
            console.error('❌ Error en getDocumentosByUsuario:', error);
            res.json({
                success: true,
                data: []
            });
        }
    }

    /**
     * Obtener documentos por producto
     */
    async getDocumentosByProducto(req, res) {
        try {
            const { productoId } = req.params;
            
            if (!productoId || isNaN(parseInt(productoId))) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de producto inválido'
                });
            }

            console.log(`📥 Buscando documentos para producto: ${productoId}`);
            
            const documentos = await documentoModel.getDocumentosByProducto(parseInt(productoId));
            
            res.json({
                success: true,
                data: documentos
            });
        } catch (error) {
            console.error('❌ Error en getDocumentosByProducto:', error);
            res.json({
                success: true,
                data: []
            });
        }
    }

    /**
     * Endpoint de prueba para verificar que el controlador funciona
     */
    async test(req, res) {
        res.json({
            success: true,
            message: 'DocumentoController funcionando correctamente',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = new DocumentoController();