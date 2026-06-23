// src/services/anexosService.js - VERSIÓN CORREGIDA
import api from './api';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';

export const anexosService = {
    getProductosDisponibles: async () => {
        try {
            const response = await api.get('/anexos/productos-disponibles');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo productos disponibles:', error);
            throw error;
        }
    },

    getColaboradores: async () => {
        try {
            const response = await api.get('/anexos/colaboradores');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo colaboradores:', error);
            throw error;
        }
    },

    crearColaboradorTemporal: async (data) => {
        try {
            const response = await api.post('/anexos/colaborador-temporal', data);
            return response.data;
        } catch (error) {
            console.error('Error creando colaborador temporal:', error);
            throw error;
        }
    },

    generarAnexo: async (data) => {
        try {
            const response = await api.post('/anexos/generar', data, {
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            console.error('Error generando anexo:', error);
            throw error;
        }
    },

    getAnexos: async () => {
        try {
            // 🔥 AGREGAR TIMESTAMP PARA EVITAR CACHÉ
            const response = await api.get('/anexos?_t=' + Date.now());
            return response.data;
        } catch (error) {
            console.error('Error obteniendo anexos:', error);
            throw error;
        }
    },

    getAnexoById: async (id) => {
        try {
            const response = await api.get(`/anexos/${id}?_t=` + Date.now());
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo anexo ${id}:`, error);
            throw error;
        }
    },

    descargarAnexo: async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/anexos/descargar/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.blob();
        } catch (error) {
            console.error(`Error descargando anexo ${id}:`, error);
            throw error;
        }
    },

    eliminarAnexo: async (id) => {
        try {
            const response = await api.delete(`/anexos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando anexo ${id}:`, error);
            throw error;
        }
    }
};

export default anexosService;