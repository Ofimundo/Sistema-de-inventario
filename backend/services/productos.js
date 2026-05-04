import api from './api';  // ← Esto ya tiene la URL base configurada

export const productosService = {
    // Listar productos con búsqueda opcional
    getProductos: async (search = '') => {
        try {
            const params = search ? { search } : {};
            console.log('📥 Solicitando productos...', params);
            
            // ✅ CORRECTO: Usa api.get, no fetch
            const response = await api.get('/productos', { params });
            console.log('📦 Respuesta de productos:', response.data);
            
            // La respuesta puede venir en diferentes formatos
            if (response.data) {
                // Si la API devuelve { data: [...] }
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data.map(producto => ({
                        ...producto,
                        condicion: producto.condicion || 'NUEVO',
                        imagen_path: producto.imagen_path || null,
                        historial_uso: producto.historial_uso || []
                    }));
                }
                
                // Si la API devuelve array directamente
                if (Array.isArray(response.data)) {
                    return response.data.map(producto => ({
                        ...producto,
                        condicion: producto.condicion || 'NUEVO',
                        imagen_path: producto.imagen_path || null,
                        historial_uso: producto.historial_uso || []
                    }));
                }
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error fetching productos:', error);
            throw error;
        }
    },

    // Obtener producto por ID
    getProductoById: async (id) => {
        try {
            // ✅ CORRECTO: Usa api.get
            const response = await api.get(`/productos/${id}`);
            
            if (response.data) {
                return {
                    ...response.data,
                    condicion: response.data.condicion || 'NUEVO',
                    imagen_path: response.data.imagen_path || null,
                    historial_uso: response.data.historial_uso || []
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching producto:', error);
            throw error;
        }
    },

    // Obtener producto por código QR
    getProductoByQR: async (codigoQR) => {
        try {
            // ✅ CORRECTO: Usa api.get
            const response = await api.get(`/productos/qr/${codigoQR}`);
            
            if (response.data) {
                return {
                    ...response.data,
                    condicion: response.data.condicion || 'NUEVO',
                    imagen_path: response.data.imagen_path || null,
                    historial_uso: response.data.historial_uso || []
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching producto by QR:', error);
            return null;  // No lanzar error, solo retornar null
        }
    },

    // Crear nuevo producto
    createProducto: async (productoData) => {
        try {
            const isFormData = productoData instanceof FormData;
            
            console.log('📤 Creando producto...');
            
            if (isFormData) {
                for (let pair of productoData.entries()) {
                    console.log('FormData entry:', pair[0], pair[1]);
                }
            }

            const config = {
                headers: isFormData 
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' }
            };

            // ✅ CORRECTO: Usa api.post
            const response = await api.post('/productos', productoData, config);
            
            console.log('✅ Respuesta create:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error creating producto:', error);
            throw error;
        }
    },

    // Actualizar producto
    updateProducto: async (id, productoData) => {
        try {
            const isFormData = productoData instanceof FormData;
            
            console.log(`📤 Actualizando producto ${id}...`);
            
            if (isFormData) {
                for (let pair of productoData.entries()) {
                    console.log('FormData entry:', pair[0], pair[1]);
                }
            }

            const config = {
                headers: isFormData 
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' }
            };

            // ✅ CORRECTO: Usa api.put
            const response = await api.put(`/productos/${id}`, productoData, config);
            
            console.log('✅ Respuesta update:', response.data);
            
            if (response.data) {
                return {
                    success: true,
                    data: response.data.data || response.data
                };
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error updating producto:', error);
            throw error;
        }
    },

    // Eliminar producto
    deleteProducto: async (id) => {
        try {
            // ✅ CORRECTO: Usa api.delete
            const response = await api.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting producto:', error);
            throw error;
        }
    },

    // Asignar producto a usuario
    asignarProducto: async (id, asignacionData) => {
        try {
            // ✅ CORRECTO: Usa api.post
            const response = await api.post(`/productos/${id}/asignar`, asignacionData);
            return response.data;
        } catch (error) {
            console.error('Error asignando producto:', error);
            throw error;
        }
    },

    // Cambiar estado del producto
    cambiarEstado: async (id, estadoData) => {
        try {
            // ✅ CORRECTO: Usa api.put
            const response = await api.put(`/productos/${id}/estado`, estadoData);
            return response.data;
        } catch (error) {
            console.error('Error cambiando estado:', error);
            throw error;
        }
    },

    // Obtener estadísticas
    getStats: async () => {
        try {
            console.log('📥 Solicitando estadísticas...');
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/stats');
            
            if (response.data) {
                return response.data.data || response.data;
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
            console.error('Error fetching stats:', error);
            throw error;
        }
    },

    // Obtener productos con stock crítico
    getProductosCriticos: async () => {
        try {
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/criticos');
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching productos criticos:', error);
            return [];
        }
    },

    // Obtener últimos productos
    getUltimosProductos: async (limit = 5) => {
        try {
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/ultimos', { params: { limit } });
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching ultimos productos:', error);
            return [];
        }
    },

    // Exportar a Excel
    exportExcel: async () => {
        try {
            // ✅ CORRECTO: Usa api.get con responseType blob
            const response = await api.get('/export/excel', {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting Excel:', error);
            throw error;
        }
    },

    // Subir imagen de producto
    subirImagen: async (id, imagenFile) => {
        try {
            const formData = new FormData();
            formData.append('imagen', imagenFile);
            
            // ✅ CORRECTO: Usa api.put
            const response = await api.put(`/productos/${id}/imagen`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            throw error;
        }
    },

    // Eliminar imagen de producto
    eliminarImagen: async (id) => {
        try {
            // ✅ CORRECTO: Usa api.delete
            const response = await api.delete(`/productos/${id}/imagen`);
            return response.data;
        } catch (error) {
            console.error('Error eliminando imagen:', error);
            throw error;
        }
    },

    // ============ MÉTODOS PARA DISPOSICIÓN ============

    registrarDisposicion: async (disposicionData) => {
        try {
            console.log('📤 Registrando disposición...');
            
            const formData = new FormData();
            formData.append('tipo', disposicionData.tipo);
            formData.append('producto_id', disposicionData.producto_id);
            formData.append('motivo', disposicionData.motivo);
            
            if (disposicionData.descripcion) {
                formData.append('descripcion', disposicionData.descripcion);
            }
            
            if (disposicionData.observaciones) {
                formData.append('observaciones', disposicionData.observaciones);
            }
            
            if (disposicionData.tipo === 'DONACION') {
                if (disposicionData.institucion) {
                    formData.append('institucion', disposicionData.institucion);
                }
                if (disposicionData.direccion) {
                    formData.append('direccion', disposicionData.direccion);
                }
                if (disposicionData.nombre_recibe) {
                    formData.append('nombre_recibe', disposicionData.nombre_recibe);
                }
            }
            
            if (disposicionData.documento) {
                formData.append('documento', disposicionData.documento);
            }

            // ✅ CORRECTO: Usa api.post
            const response = await api.post('/productos/disposicion', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Disposición registrada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error registrando disposición:', error);
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    },

    registrarDonacion: async (data) => {
        try {
            console.log('📤 Registrando donación...');
            
            let formData;
            if (data instanceof FormData) {
                formData = data;
            } else {
                formData = new FormData();
                formData.append('producto_id', data.producto_id);
                formData.append('motivo', data.motivo);
                if (data.descripcion) formData.append('descripcion', data.descripcion);
                if (data.observaciones) formData.append('observaciones', data.observaciones);
                
                if (data.institucion) formData.append('institucion', data.institucion);
                if (data.direccion) formData.append('direccion', data.direccion);
                if (data.nombre_recibe) formData.append('nombre_recibe', data.nombre_recibe);
                
                if (data.documento) formData.append('documento', data.documento);
            }

            // ✅ CORRECTO: Usa api.post
            const response = await api.post('/productos/donar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Donación registrada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error registrando donación:', error);
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    },

    registrarBaja: async (data) => {
        try {
            console.log('📤 Registrando baja...');
            
            let formData;
            if (data instanceof FormData) {
                formData = data;
            } else {
                formData = new FormData();
                formData.append('producto_id', data.producto_id);
                formData.append('motivo', data.motivo);
                if (data.descripcion) formData.append('descripcion', data.descripcion);
                if (data.observaciones) formData.append('observaciones', data.observaciones);
                if (data.documento) formData.append('documento', data.documento);
            }

            // ✅ CORRECTO: Usa api.post
            const response = await api.post('/productos/baja', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Baja registrada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error registrando baja:', error);
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    },

    getHistorialDisposiciones: async () => {
        try {
            console.log('📥 Solicitando historial de disposiciones...');
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/disposiciones/historial');
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return { donaciones: [], bajas: [] };
        } catch (error) {
            console.error('Error obteniendo historial de disposiciones:', error);
            return { donaciones: [], bajas: [] };
        }
    },

    getProductosDisponibles: async () => {
        try {
            console.log('📥 Solicitando productos disponibles...');
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/disponibles');
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo productos disponibles:', error);
            return [];
        }
    },

    getProductosAsignados: async () => {
        try {
            console.log('📥 Solicitando productos asignados...');
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/asignados');
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo productos asignados:', error);
            return [];
        }
    },

    getProductosPorBodega: async (bodegaId) => {
        try {
            console.log(`📥 Solicitando productos de bodega ${bodegaId}...`);
            // ✅ CORRECTO: Usa api.get
            const response = await api.get(`/productos/bodega/${bodegaId}`);
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo productos por bodega:', error);
            return [];
        }
    },

    buscarProductos: async (filtros) => {
        try {
            console.log('📥 Buscando productos con filtros:', filtros);
            // ✅ CORRECTO: Usa api.get
            const response = await api.get('/productos/buscar', { params: filtros });
            
            if (response.data) {
                return response.data.data || response.data;
            }
            return [];
        } catch (error) {
            console.error('Error buscando productos:', error);
            return [];
        }
    },

    // Función auxiliar para construir URL de imagen (usa la URL base de api)
    getImageUrl: (imagenPath) => {
        if (!imagenPath) return null;
        
        // Si ya es una URL completa, la devolvemos
        if (imagenPath.startsWith('http')) {
            return `${imagenPath}?t=${Date.now()}`;
        }
        
        // Construir URL usando la base de api
        const baseURL = api.defaults.baseURL || 'http://localhost:98';
        const baseApiUrl = baseURL.replace('/api/', '');
        
        if (imagenPath.startsWith('/uploads/')) {
            return `${baseApiUrl}${imagenPath}?t=${Date.now()}`;
        }
        
        return `${baseApiUrl}/uploads/${imagenPath}?t=${Date.now()}`;
    }
};