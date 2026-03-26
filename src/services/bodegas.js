// src/services/bodegaService.js
import api from './api';

export const bodegaService = {
    // Obtener todas las bodegas
    getBodegas: async () => {
        try {
            const response = await api.get('/bodegas');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo bodegas:', error);
            return [];
        }
    },

    // Obtener bodega por ID con sus productos
    getBodegaById: async (id) => {
        try {
            const response = await api.get(`/bodegas/${id}`);
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo bodega:', error);
            throw error;
        }
    },

    // Crear bodega
    createBodega: async (bodegaData) => {
        try {
            const response = await api.post('/bodegas', bodegaData);
            return response.data;
        } catch (error) {
            console.error('Error creando bodega:', error);
            throw error;
        }
    },

    // Actualizar bodega
    updateBodega: async (id, bodegaData) => {
        try {
            const response = await api.put(`/bodegas/${id}`, bodegaData);
            return response.data;
        } catch (error) {
            console.error('Error actualizando bodega:', error);
            throw error;
        }
    },

    // Eliminar bodega
    deleteBodega: async (id) => {
        try {
            const response = await api.delete(`/bodegas/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando bodega:', error);
            throw error;
        }
    }
};

export default bodegaService;