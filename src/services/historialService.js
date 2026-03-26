// src/services/historialService.js
import api from './api';

const historialService = {
    // Obtener historial completo (solo historial, bajas y donaciones)
    getHistorialCompleto: async () => {
        try {
            const response = await api.get('/historial/completo');
            return response.data;
        } catch (error) {
            console.error('Error en getHistorialCompleto:', error);
            return {
                success: false,
                data: {
                    completo: [],
                    bajas: [],
                    donaciones: []
                }
            };
        }
    },

    // Exportar a Excel
    exportarExcel: async (filtros = {}) => {
        try {
            const response = await api.get('/historial/exportar/excel', {
                params: filtros,
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error en exportarExcel:', error);
            throw error;
        }
    },

    // Obtener bajas
    getBajas: async () => {
        try {
            const response = await api.get('/historial/bajas');
            return response.data;
        } catch (error) {
            console.error('Error en getBajas:', error);
            return { success: false, data: [] };
        }
    },

    // Obtener donaciones
    getDonaciones: async () => {
        try {
            const response = await api.get('/historial/donaciones');
            return response.data;
        } catch (error) {
            console.error('Error en getDonaciones:', error);
            return { success: false, data: [] };
        }
    }
};

export default historialService;