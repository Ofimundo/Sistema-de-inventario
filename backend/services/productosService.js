import api from './api';

const API_URL = 'http://localhost:98';

export const productosService = {
    // Listar productos con búsqueda opcional
    getProductos: async (search = '') => {
        try {
            const params = search ? { search } : {};
            const response = await api.get('/productos', { params });
            
            console.log('📥 Productos recibidos:', response.data);
            
            if (response.data) {
                // Formato 1: { success: true, data: [...] }
                if (response.data.success && Array.isArray(response.data.data)) {
                    return response.data.data.map(producto => ({
                        ...producto,
                        condicion: producto.condicion || 'NUEVO',
                        fecha_adquisicion: producto.fecha_adquisicion || '',
                        historial_uso: producto.historial_uso || [],
                        imagen_path: producto.imagen_path || null
                    }));
                }
                
                // Formato 2: Array directo
                if (Array.isArray(response.data)) {
                    return response.data.map(producto => ({
                        ...producto,
                        condicion: producto.condicion || 'NUEVO',
                        fecha_adquisicion: producto.fecha_adquisicion || '',
                        historial_uso: producto.historial_uso || [],
                        imagen_path: producto.imagen_path || null
                    }));
                }
                
                // Formato 3: { data: [...] }
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data.map(producto => ({
                        ...producto,
                        condicion: producto.condicion || 'NUEVO',
                        fecha_adquisicion: producto.fecha_adquisicion || '',
                        historial_uso: producto.historial_uso || [],
                        imagen_path: producto.imagen_path || null
                    }));
                }
            }
            
            return [];
        } catch (error) {
            console.error('Error en getProductos:', error);
            return [];
        }
    },

    // Obtener producto por ID
    getProductoById: async (id) => {
        try {
            const response = await api.get(`/productos/${id}`);
            
            if (response.data && response.data.success) {
                return {
                    ...response.data.data,
                    condicion: response.data.data.condicion || 'NUEVO',
                    fecha_adquisicion: response.data.data.fecha_adquisicion || '',
                    historial_uso: response.data.data.historial_uso || [],
                    imagen_path: response.data.data.imagen_path || null
                };
            }
            return null;
        } catch (error) {
            console.error('Error en getProductoById:', error);
            throw error;
        }
    },

    // Crear nuevo producto
    createProducto: async (formData) => {
        try {
            if (!(formData instanceof FormData)) {
                throw new Error('createProducto espera un FormData');
            }

            console.log('📤 Creando producto...');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ':', pair[1]);
            }

            const response = await api.post('/productos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('✅ Respuesta create:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en createProducto:', error);
            throw error;
        }
    },

    // Actualizar producto
    updateProducto: async (id, formData) => {
        try {
            if (!(formData instanceof FormData)) {
                throw new Error('updateProducto espera un FormData');
            }

            console.log(`📤 Actualizando producto ${id}...`);
            for (let pair of formData.entries()) {
                console.log(pair[0] + ':', pair[1]);
            }

            const response = await api.put(`/productos/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('✅ Respuesta update:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en updateProducto:', error);
            throw error;
        }
    },

    // Eliminar producto (soft delete)
    deleteProducto: async (id) => {
        try {
            const response = await api.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error en deleteProducto:', error);
            throw error;
        }
    },

    // Obtener estadísticas
    getStats: async () => {
        try {
            const response = await api.get('/productos/stats');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return {
                totalProductos: 0,
                totalUnidades: 0,
                disponibles: 0,
                asignados: 0,
                enMantencion: 0,
                enReparacion: 0,
                noDisponibles: 0,
                bajoStock: 0,
                agotados: 0,
                valorTotal: 0,
                precioPromedio: 0
            };
        } catch (error) {
            console.error('Error en getStats:', error);
            return {};
        }
    },

    // Función auxiliar para construir URL de imagen
    getImageUrl: (imagenPath) => {
        if (!imagenPath) return null;
        
        if (imagenPath.startsWith('http')) {
            return `${imagenPath}?t=${Date.now()}`;
        }
        
        if (imagenPath.startsWith('/uploads/')) {
            return `${API_URL}${imagenPath}?t=${Date.now()}`;
        }
        
        return `${API_URL}/uploads/${imagenPath}?t=${Date.now()}`;
    }
};