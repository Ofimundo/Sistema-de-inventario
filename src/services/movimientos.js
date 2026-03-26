import api from './api';

export const movimientosService = {
    // Obtener últimos movimientos (GET /api//movimientos?limit=20)
    getUltimosMovimientos: async (limit = 20) => {
        try {
            const response = await api.get(`/movimientos?limit=${limit}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error) {
            console.error('Error fetching movimientos:', error);
            throw error.response?.data || { error: 'Error al cargar movimientos' };
        }
    },

    // Obtener movimientos por producto (GET /api//movimientos/producto/{productoId})
    getMovimientosByProducto: async (productoId) => {
        try {
            const response = await api.get(`/movimientos/producto/${productoId}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error) {
            console.error('Error fetching movimientos by producto:', error);
            throw error.response?.data || { error: 'Error al cargar movimientos del producto' };
        }
    },

    // Obtener movimiento por ID (GET /api//movimientos/{id})
    getMovimientoById: async (id) => {
        try {
            const response = await api.get(`/movimientos/${id}`);
            return response.data.success ? response.data.data : response.data;
        } catch (error) {
            console.error('Error fetching movimiento:', error);
            throw error.response?.data || { error: 'Error al cargar movimiento' };
        }
    },

    // Crear nuevo movimiento (POST /api//movimientos)
    createMovimiento: async (movimientoData) => {
        try {
            const response = await api.post('/movimientos', movimientoData);
            return response.data;
        } catch (error) {
            console.error('Error creating movimiento:', error);
            throw error.response?.data || { error: 'Error al crear movimiento' };
        }
    },

    // Actualizar movimiento (PUT /api//movimientos/{id})
    updateMovimiento: async (id, movimientoData) => {
        try {
            const response = await api.put(`/movimientos/${id}`, movimientoData);
            return response.data;
        } catch (error) {
            console.error('Error updating movimiento:', error);
            throw error.response?.data || { error: 'Error al actualizar movimiento' };
        }
    },

    // Eliminar movimiento (DELETE /api//movimientos/{id})
    deleteMovimiento: async (id) => {
        try {
            const response = await api.delete(`/movimientos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting movimiento:', error);
            throw error.response?.data || { error: 'Error al eliminar movimiento' };
        }
    },

    // Obtener tipos de movimiento (GET /api//movimientos/tipos)
    getTiposMovimiento: async () => {
        try {
            const response = await api.get('/movimientos/tipos');
            return response.data.success ? response.data.data : response.data;
        } catch (error) {
            console.error('Error fetching tipos movimiento:', error);
            throw error.response?.data || { error: 'Error al cargar tipos de movimiento' };
        }
    },

    // Obtener resumen de movimientos por período (GET /api//movimientos/resumen)
    getResumenByPeriodo: async (fechaInicio, fechaFin) => {
        try {
            const response = await api.get('/movimientos/resumen', {
                params: { fechaInicio, fechaFin }
            });
            return response.data.success ? response.data.data : response.data;
        } catch (error) {
            console.error('Error fetching resumen movimientos:', error);
            throw error.response?.data || { error: 'Error al cargar resumen de movimientos' };
        }
    },

    // Exportar movimientos a Excel (GET /api//movimientos/export/excel)
    exportExcel: async (fechaInicio, fechaFin) => {
        try {
            const response = await api.get('/movimientos/export/excel', {
                params: { fechaInicio, fechaFin },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting movimientos Excel:', error);
            throw error.response?.data || { error: 'Error al exportar movimientos' };
        }
    }
};