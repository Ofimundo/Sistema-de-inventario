// src/services/asignacionService.js - VERSIÓN COMPLETAMENTE CORREGIDA
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
    // Fallback para desarrollo local
    console.log('📍 API Base URL (fallback local):', 'http://localhost:98');
    return 'http://localhost:98';
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
     * Obtener todas las asignaciones
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
     * Crear una nueva asignación
     */
    crearAsignacion: async (data) => {
        try {
            console.log('📤 Creando asignación...');
            const response = await api.post('/asignaciones', {
                producto_id: data.producto_id,
                colaborador_id: data.colaborador_id,
                motivo: data.motivo,
                observaciones: data.observaciones || '',
                fecha_asignacion: data.fecha_asignacion || new Date().toISOString().split('T')[0],
                usuario_responsable: data.usuario_responsable || localStorage.getItem('user') || 'Sistema',
                firma_trabajador: data.firma_trabajador || null,
                firma_gerente: data.firma_gerente || null
            });
            console.log('✅ Asignación creada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en crearAsignacion:', error);
            throw error;
        }
    },

    /**
     * Generar acta de asignación PDF
     */
    generarActaAsignacion: async (data) => {
        try {
            console.log('📤 Generando acta de asignación...');
            const response = await api.post('/asignaciones/generar-acta-asignacion', {
                id_asignacion: data.id_asignacion,
                colaborador: data.colaborador,
                productos: data.productos,
                fecha_asignacion: data.fecha_asignacion,
                motivo: data.motivo,
                observaciones: data.observaciones,
                firma_trabajador: data.firma_trabajador,
                firma_gerente: data.firma_gerente,
                usuario_responsable: data.usuario_responsable
            });
            console.log('✅ Acta generada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en generarActaAsignacion:', error);
            throw error;
        }
    },

    /**
     * Generar acta de recepción PDF
     */
    generarActaRecepcion: async (data) => {
        try {
            console.log('📤 Generando acta de recepción...');
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
                usuario_responsable: data.usuario_responsable
            });
            console.log('✅ Acta generada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en generarActaRecepcion:', error);
            throw error;
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
     * ✅ FUNCIÓN CORREGIDA - Descargar documento usando URL absoluta
     */
    descargarDocumento: async (filename) => {
        try {
            console.log(`📤 Descargando: ${filename}`);
            console.log(`🔧 API_BASE_URL: ${API_BASE_URL}`);
            
            // Construir URL absoluta
            const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${filename}`;
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
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Documento descargado:', filename);
            return { success: true };
        } catch (error) {
            console.error('❌ Error en descargarDocumento:', error);
            throw error;
        }
    },

    /**
     * ✅ FUNCIÓN CORREGIDA - Descargar documento por ID usando URL absoluta
     */
    descargarDocumentoById: async (documentoId) => {
        try {
            console.log(`📤 Descargando documento ${documentoId}...`);
            console.log(`🔧 API_BASE_URL: ${API_BASE_URL}`);
            
            // Construir URL absoluta
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
     * Obtener historial de asignaciones
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
     * Finalizar asignación (devolución)
     */
    finalizarAsignacion: async (asignacionId, data) => {
        try {
            console.log(`📤 Finalizando asignación ${asignacionId}...`);
            const response = await api.put(`/asignaciones/${asignacionId}/finalizar`, {
                fecha_devolucion: data.fecha_devolucion || new Date().toISOString().split('T')[0],
                observaciones: data.observaciones || '',
                condicion_entrega: data.condicion_entrega || 'BUENO',
                firma_trabajador: data.firma_trabajador || null,
                firma_gerente: data.firma_gerente || null,
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
     * Obtener estadísticas de asignaciones
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
                totalProductosRecibidos: 0
            };
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            return {
                totalAsignaciones: 0,
                activas: 0,
                completadas: 0,
                totalProductosAsignados: 0,
                totalProductosRecibidos: 0
            };
        }
    },

    /**
     * Generar y visualizar documento de asignación
     */
    generarYVisualizarDocumento: async (data) => {
        try {
            console.log('📤 Generando documento de asignación...');
            
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
                usuario_responsable: data.usuario_responsable
            };
            
            return documentoData;
        } catch (error) {
            console.error('❌ Error en generarYVisualizarDocumento:', error);
            throw error;
        }
    }
};

export default asignacionService;