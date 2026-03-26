import api from './api';

export const estadosService = {
    // Obtener todos los estados
    getEstados: async () => {
        try {
            console.log('📥 Solicitando estados...');
            const response = await api.get('/estados');
            console.log('📦 Respuesta de estados:', response.data);
            
            // Verificar diferentes formatos de respuesta
            if (response.data) {
                // Formato 1: { success: true, data: [...] }
                if (response.data.success && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                
                // Formato 2: Array directo
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                
                // Formato 3: { data: [...] }
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
            }
            
            console.warn('⚠️ Formato de respuesta inesperado, usando datos de ejemplo');
            return [
                { id: 1, nombre: 'DISPONIBLE', color: '#28a745', permite_asignacion: true, activo: true },
                { id: 2, nombre: 'ASIGNADO', color: '#007bff', permite_asignacion: false, activo: true },
                { id: 3, nombre: 'EN_MANTENCION', color: '#ffc107', permite_asignacion: false, activo: true },
                { id: 4, nombre: 'EN_REPARACION', color: '#fd7e14', permite_asignacion: false, activo: true },
                { id: 5, nombre: 'NO_DISPONIBLE', color: '#dc3545', permite_asignacion: false, activo: true }
            ];
            
        } catch (error) {
            console.error('❌ Error fetching estados:', error);
            
            // Datos de ejemplo en caso de error
            return [
                { id: 1, nombre: 'DISPONIBLE', color: '#28a745', permite_asignacion: true, activo: true },
                { id: 2, nombre: 'ASIGNADO', color: '#007bff', permite_asignacion: false, activo: true },
                { id: 3, nombre: 'EN_MANTENCION', color: '#ffc107', permite_asignacion: false, activo: true },
                { id: 4, nombre: 'EN_REPARACION', color: '#fd7e14', permite_asignacion: false, activo: true },
                { id: 5, nombre: 'NO_DISPONIBLE', color: '#dc3545', permite_asignacion: false, activo: true }
            ];
        }
    },

    // Obtener estados activos
    getEstadosActivos: async () => {
        try {
            const response = await api.get('/estados/activos');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching estados activos:', error);
            throw error;
        }
    },

    // Obtener estados que permiten asignación
    getEstadosPermitenAsignacion: async () => {
        try {
            const response = await api.get('/estados/permite-asignacion');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching estados permiten asignacion:', error);
            throw error;
        }
    },

    // Obtener estado por nombre
    getEstadoByNombre: async (nombre) => {
        try {
            const response = await api.get(`/estados/nombre/${encodeURIComponent(nombre)}`);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching estado by nombre:', error);
            throw error;
        }
    },

    // Obtener estado por ID
    getEstadoById: async (id) => {
        try {
            const response = await api.get(`/estados/${id}`);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching estado:', error);
            throw error;
        }
    },

    // Crear nuevo estado
    createEstado: async (estadoData) => {
        try {
            const response = await api.post('/estados', estadoData);
            return response.data;
        } catch (error) {
            console.error('Error creating estado:', error);
            throw error;
        }
    },

    // Actualizar estado
    updateEstado: async (id, estadoData) => {
        try {
            const response = await api.put(`/estados/${id}`, estadoData);
            return response.data;
        } catch (error) {
            console.error('Error updating estado:', error);
            throw error;
        }
    },

    // Eliminar estado
    deleteEstado: async (id) => {
        try {
            const response = await api.delete(`/estados/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting estado:', error);
            throw error;
        }
    }
};