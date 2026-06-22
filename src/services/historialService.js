// src/services/historialService.js
import api from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const historialService = {
    // Obtener historial completo (movimientos, bajas, donaciones)
    getHistorialCompleto: async () => {
        try {
            const response = await api.get('/historial/completo');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo historial completo:', error);
            return { success: false, data: { completo: [], bajas: [], donaciones: [] } };
        }
    },

    // Obtener todos los documentos (actas, checklist, anexos)
    getDocumentos: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/documentos/todos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo documentos:', error);
            return { success: false, data: [] };
        }
    },

    // Obtener actas de asignación
    getActasAsignacion: async () => {
        try {
            const response = await api.get('/documentos/actas-asignacion');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo actas de asignación:', error);
            return { success: false, data: [] };
        }
    },

    // Obtener actas de recepción
    getActasRecepcion: async () => {
        try {
            const response = await api.get('/documentos/actas-recepcion');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo actas de recepción:', error);
            return { success: false, data: [] };
        }
    },

    // Obtener checklist
    getChecklist: async () => {
        try {
            const response = await api.get('/documentos/checklist');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo checklist:', error);
            return { success: false, data: [] };
        }
    },

    // Obtener anexos
    getAnexos: async () => {
        try {
            const response = await api.get('/anexos');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo anexos:', error);
            return { success: false, data: [] };
        }
    },

    // Exportar a Excel
    exportarExcel: async (filtros = {}) => {
        try {
            const response = await api.post('/export/historial', filtros, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exportando historial:', error);
            throw error;
        }
    },

    // Obtener historial por tipo
    getPorTipo: async (tipo) => {
        try {
            const response = await api.get(`/historial/tipo/${tipo}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo historial tipo ${tipo}:`, error);
            return { success: false, data: [] };
        }
    },

    // Obtener estadísticas del historial
    getEstadisticas: async () => {
        try {
            const response = await api.get('/historial/estadisticas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return { success: false, data: {} };
        }
    }
};

export default historialService;