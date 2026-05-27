// src/services/asignacionService.js - VERSIÓN ACTUALIZADA CON FUNCIONES DE DESCARGA Y BÚSQUEDA
import api from './api';

// ============================================
// 🔥 URL BASE DINÁMICA PARA DESCARGAS
// ============================================
const getApiBaseUrl = () => {
    // Para Vite
    if (import.meta.env && import.meta.env.VITE_API_URL) {
        let url = import.meta.env.VITE_API_URL;
        // Eliminar /api del final si existe para no duplicar
        if (url.endsWith('/api')) {
            url = url.slice(0, -4);
        }
        console.log('📍 API Base URL (desde VITE):', url);
        return url;
    }
    // Para Create React App
    if (process.env && process.env.REACT_APP_API_URL) {
        let url = process.env.REACT_APP_API_URL;
        if (url.endsWith('/api')) {
            url = url.slice(0, -4);
        }
        console.log('📍 API Base URL (desde CRA):', url);
        return url;
    }
    // URL por defecto (producción)
    return 'https://sistema-inventario-backend-p3xg.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔧 API_BASE_URL en asignacionService:', API_BASE_URL);

export const asignacionService = {
    
    /**
     * Obtener todas las asignaciones activas
     */
    getAsignacionesActivas: async () => {
        try {
            console.log('📤 Solicitando asignaciones activas...');
            const response = await api.get('/asignaciones/activas');
            console.log('📥 Respuesta:', response.data);
            
            if (response.data) {
                if (response.data.success && response.data.data) {
                    return response.data.data;
                }
                if (response.data.data) {
                    return response.data.data;
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getAsignacionesActivas:', error);
            return [];
        }
    },

    /**
     * Obtener todas las asignaciones (incluye préstamos)
     */
    getAsignaciones: async () => {
        try {
            const response = await api.get('/asignaciones');
            if (response.data) {
                if (response.data.success && response.data.data) return response.data.data;
                if (response.data.data) return response.data.data;
                if (Array.isArray(response.data)) return response.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getAsignaciones:', error);
            return [];
        }
    },

    /**
     * Obtener solo préstamos activos
     */
    getPrestamosActivos: async () => {
        try {
            console.log('📤 Solicitando préstamos activos...');
            const response = await api.get('/asignaciones/prestamos/activos');
            console.log('📥 Respuesta:', response.data);
            
            if (response.data) {
                if (response.data.success && response.data.data) {
                    return response.data.data;
                }
                if (response.data.data) {
                    return response.data.data;
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getPrestamosActivos:', error);
            return [];
        }
    },

    /**
     * Obtener asignación por ID
     */
    getAsignacionById: async (id) => {
        try {
            const response = await api.get(`/asignaciones/${id}`);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Error en getAsignacionById:', error);
            return null;
        }
    },

    /**
     * Crear una nueva asignación (puede ser préstamo o asignación normal)
     */
    crearAsignacion: async (data) => {
        try {
            console.log('📤 Creando asignación...', data);
            const payload = {
                producto_id: data.producto_id,
                colaborador_id: data.colaborador_id,
                motivo: data.motivo || (data.es_prestamo ? 'PRÉSTAMO TEMPORAL' : 'ASIGNACIÓN DE EQUIPO'),
                observaciones: data.observaciones || '',
                fecha_asignacion: data.fecha_asignacion || new Date().toISOString().split('T')[0],
                usuario_responsable: data.usuario_responsable || localStorage.getItem('user') || 'Sistema',
                firma_trabajador: data.firma_trabajador || null,
                firma_gerente: data.firma_gerente || null,
                es_prestamo: data.es_prestamo || false
            };
            
            const response = await api.post('/asignaciones', payload);
            console.log('✅ Asignación creada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en crearAsignacion:', error);
            throw error;
        }
    },

    /**
     * Crear un préstamo (sin generar documento)
     */
    crearPrestamo: async (data) => {
        try {
            console.log('📤 Creando préstamo (sin documento)...');
            const payload = {
                producto_id: data.producto_id,
                colaborador_id: data.colaborador_id,
                motivo: 'PRÉSTAMO TEMPORAL',
                observaciones: data.observaciones || `Préstamo registrado el ${new Date().toLocaleDateString()}`,
                fecha_asignacion: data.fecha_asignacion || new Date().toISOString().split('T')[0],
                usuario_responsable: data.usuario_responsable || localStorage.getItem('user') || 'Sistema',
                firma_trabajador: null,
                firma_gerente: null,
                es_prestamo: true
            };
            
            const response = await api.post('/asignaciones', payload);
            console.log('✅ Préstamo creado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en crearPrestamo:', error);
            throw error;
        }
    },

    /**
     * Generar acta de asignación PDF (solo para asignaciones normales, no préstamos)
     */
    generarActaAsignacion: async (data) => {
        try {
            console.log('📤 Generando acta de asignación...');
            
            // Verificar si es préstamo
            if (data.es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento');
                return { success: true, message: 'Préstamo registrado sin documento', es_prestamo: true };
            }
            
            const response = await api.post('/asignaciones/generar-acta-asignacion', {
                id_asignacion: data.id_asignacion,
                colaborador: data.colaborador,
                productos: data.productos,
                fecha_asignacion: data.fecha_asignacion,
                motivo: data.motivo,
                observaciones: data.observaciones,
                firma_trabajador: data.firma_trabajador,
                firma_gerente: data.firma_gerente,
                usuario_responsable: data.usuario_responsable,
                es_prestamo: false
            });
            console.log('✅ Acta generada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en generarActaAsignacion:', error);
            throw error;
        }
    },

    /**
     * Generar acta de recepción PDF (solo para asignaciones normales, no préstamos)
     */
    generarActaRecepcion: async (data) => {
        try {
            console.log('📤 Generando acta de recepción...');
            
            // Verificar si es préstamo
            if (data.es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento de recepción');
                return { success: true, message: 'Devolución de préstamo registrada sin documento', es_prestamo: true };
            }
            
            const response = await api.post('/asignaciones/generar-acta-recepcion', {
                id_asignacion: data.id_asignacion,
                colaborador: data.colaborador,
                productos: data.productos,
                fecha_asignacion: data.fecha_asignacion,
                fecha_recepcion: data.fecha_recepcion,
                motivo: data.motivo,
                observaciones: data.observaciones,
                condicion_entrega: data.condicion_entrega,
                firma_trabajador: data.firma_trabajador,
                firma_gerente: data.firma_gerente,
                usuario_responsable: data.usuario_responsable,
                es_prestamo: false
            });
            console.log('✅ Acta generada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en generarActaRecepcion:', error);
            throw error;
        }
    },

    /**
     * Buscar documento por asignación ID y tipo
     */
    buscarDocumentoPorAsignacion: async (asignacionId, tipo) => {
        try {
            console.log(`📤 Buscando documento ${tipo} para asignación ${asignacionId}...`);
            const response = await api.get(`/asignaciones/buscar-documento/${asignacionId}/${tipo}`);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Error en buscarDocumentoPorAsignacion:', error);
            return null;
        }
    },

    /**
     * Subir documento físico de asignación
     */
    subirDocumentoFisico: async (asignacionId, file, tipoDocumento, observaciones) => {
        try {
            console.log('📤 Subiendo documento físico...');
            const formData = new FormData();
            formData.append('documento', file);
            formData.append('asignacion_id', asignacionId);
            formData.append('tipo_documento', tipoDocumento);
            formData.append('observaciones', observaciones || '');

            const response = await api.post('/asignaciones/subir-documento', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('✅ Documento subido:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en subirDocumentoFisico:', error);
            throw error;
        }
    },

    /**
     * Obtener documentos de una asignación
     */
    getDocumentosAsignacion: async (asignacionId) => {
        try {
            console.log(`📤 Obteniendo documentos de asignación ${asignacionId}...`);
            const response = await api.get(`/asignaciones/documentos/${asignacionId}`);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getDocumentosAsignacion:', error);
            return [];
        }
    },

    /**
     * Descargar documento usando URL absoluta
     */
    descargarDocumento: async (filename) => {
        try {
            if (!filename) {
                throw new Error('Nombre de archivo no proporcionado');
            }
            
            console.log(`📤 Descargando: ${filename}`);
            
            const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${encodeURIComponent(filename)}`;
            console.log('📥 URL de descarga:', downloadUrl);
            
            const token = localStorage.getItem('token');
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorText = await response.text();
                console.error(`❌ Error HTTP: ${response.status}`, errorText);
                throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Documento descargado:', filename);
            return { success: true, filename };
        } catch (error) {
            console.error('❌ Error en descargarDocumento:', error);
            throw error;
        }
    },

    /**
     * Descargar documento por ID
     */
    descargarDocumentoById: async (documentoId) => {
        try {
            console.log(`📤 Descargando documento ${documentoId}...`);
            console.log(`🔧 API_BASE_URL: ${API_BASE_URL}`);
            
            const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar-documento/${documentoId}`;
            console.log('📥 URL de descarga:', downloadUrl);
            
            const token = localStorage.getItem('token');
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `documento_${documentoId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            console.log(`✅ Documento ${documentoId} descargado`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error en descargarDocumentoById:', error);
            throw error;
        }
    },

    /**
     * Descargar acta de asignación por ID de asignación
     */
    descargarActaAsignacion: async (asignacionId) => {
        try {
            console.log(`📤 Descargando acta de asignación para ${asignacionId}...`);
            
            // Primero buscar el documento
            const documento = await asignacionService.buscarDocumentoPorAsignacion(asignacionId, 'asignacion');
            
            if (documento && documento.filename) {
                return await asignacionService.descargarDocumento(documento.filename);
            } else {
                // Si no existe, intentar generar uno nuevo
                const asignacion = await asignacionService.getAsignacionById(asignacionId);
                if (asignacion && !asignacion.es_prestamo) {
                    // Generar acta
                    const actaData = {
                        id_asignacion: asignacionId,
                        colaborador: {
                            nombre: asignacion.colaborador_nombre,
                            rut: asignacion.colaborador_rut,
                            email: asignacion.colaborador_email,
                            cargo: asignacion.colaborador_cargo,
                            departamento: asignacion.colaborador_departamento
                        },
                        productos: [{
                            nombre: asignacion.producto_nombre,
                            marca: asignacion.marca,
                            modelo: asignacion.modelo,
                            numero_serie: asignacion.numero_serie
                        }],
                        fecha_asignacion: asignacion.fecha_asignacion,
                        motivo: asignacion.motivo,
                        observaciones: asignacion.observaciones,
                        es_prestamo: false
                    };
                    
                    const response = await asignacionService.generarActaAsignacion(actaData);
                    if (response.success && response.filename) {
                        return await asignacionService.descargarDocumento(response.filename);
                    }
                }
                throw new Error('No se pudo encontrar o generar el acta de asignación');
            }
        } catch (error) {
            console.error('❌ Error en descargarActaAsignacion:', error);
            throw error;
        }
    },

    /**
     * Descargar acta de recepción por ID de asignación
     */
    descargarActaRecepcion: async (asignacionId) => {
        try {
            console.log(`📤 Descargando acta de recepción para ${asignacionId}...`);
            
            // Primero buscar el documento
            const documento = await asignacionService.buscarDocumentoPorAsignacion(asignacionId, 'recepcion');
            
            if (documento && documento.filename) {
                return await asignacionService.descargarDocumento(documento.filename);
            } else {
                throw new Error('No se encontró el acta de recepción');
            }
        } catch (error) {
            console.error('❌ Error en descargarActaRecepcion:', error);
            throw error;
        }
    },

    /**
     * Obtener historial de asignaciones (incluye préstamos)
     */
    getHistorial: async (filtros = {}) => {
        try {
            const response = await api.get('/asignaciones/historial', { params: filtros });
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getHistorial:', error);
            return [];
        }
    },

    /**
     * Obtener historial de préstamos
     */
    getHistorialPrestamos: async (filtros = {}) => {
        try {
            const response = await api.get('/asignaciones/prestamos/historial', { params: filtros });
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getHistorialPrestamos:', error);
            return [];
        }
    },

    /**
     * Finalizar asignación (devolución)
     */
    finalizarAsignacion: async (asignacionId, data) => {
        try {
            console.log(`📤 Finalizando asignación ${asignacionId}...`);
            const response = await api.put(`/asignaciones/${asignacionId}/finalizar`, {
                fecha_devolucion: data.fecha_devolucion || new Date().toISOString().split('T')[0],
                motivo_devolucion: data.motivo_devolucion || data.motivo || '',
                observaciones_devolucion: data.observaciones_devolucion || data.observaciones || '',
                condicion_entrega: data.condicion_entrega || 'BUENO',
                firma_trabajador_devolucion: data.firma_trabajador_devolucion || data.firma_trabajador || null,
                firma_gerente_devolucion: data.firma_gerente_devolucion || data.firma_gerente || null,
                usuario_responsable: data.usuario_responsable || localStorage.getItem('user') || 'Sistema'
            });
            console.log('✅ Asignación finalizada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en finalizarAsignacion:', error);
            throw error;
        }
    },

    /**
     * Obtener estadísticas de asignaciones (incluye préstamos)
     */
    getEstadisticas: async () => {
        try {
            const response = await api.get('/asignaciones/estadisticas');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return {
                totalAsignaciones: 0,
                activas: 0,
                completadas: 0,
                totalProductosAsignados: 0,
                totalProductosRecibidos: 0,
                totalPrestamos: 0,
                prestamosActivos: 0
            };
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            return {
                totalAsignaciones: 0,
                activas: 0,
                completadas: 0,
                totalProductosAsignados: 0,
                totalProductosRecibidos: 0,
                totalPrestamos: 0,
                prestamosActivos: 0
            };
        }
    },

    /**
     * Obtener estadísticas de préstamos
     */
    getEstadisticasPrestamos: async () => {
        try {
            const response = await api.get('/asignaciones/prestamos/estadisticas');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return {
                totalPrestamos: 0,
                activos: 0,
                devueltos: 0
            };
        } catch (error) {
            console.error('❌ Error en getEstadisticasPrestamos:', error);
            return {
                totalPrestamos: 0,
                activos: 0,
                devueltos: 0
            };
        }
    },

    /**
     * Generar y visualizar documento de asignación (solo para asignaciones normales)
     */
    generarYVisualizarDocumento: async (data) => {
        try {
            console.log('📤 Generando documento de asignación...');
            
            // Verificar si es préstamo
            if (data.es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento');
                return { success: true, message: 'Préstamo - No requiere documento', es_prestamo: true };
            }
            
            // Crear el documento de asignación
            const documentoData = {
                id_asignacion: data.id_asignacion || Date.now(),
                fecha: new Date().toLocaleString('es-CL'),
                colaborador: data.colaborador,
                productos: data.productos,
                fecha_asignacion: data.fecha_asignacion,
                motivo: data.motivo,
                observaciones: data.observaciones || 'Sin observaciones',
                firma_trabajador: data.firma_trabajador,
                firma_gerente: data.firma_gerente,
                usuario_responsable: data.usuario_responsable,
                es_prestamo: false
            };
            
            return documentoData;
        } catch (error) {
            console.error('❌ Error en generarYVisualizarDocumento:', error);
            throw error;
        }
    }
};

export default asignacionService;