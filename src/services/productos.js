// src/services/productos.js - VERSIÓN COMPLETA CON FILTROS

import api from './api';

const API_URL = 'http://localhost:98';

export const productosService = {
    // ============================================
    // MÉTODOS PRINCIPALES DE PRODUCTOS
    // ============================================
    
    /**
     * Listar todos los productos con filtros
     */

getProductos: async (search = '', filters = {}) => {
    try {
        const params = new URLSearchParams();
        
        if (search && search.trim()) {
            params.append('search', search.trim());
        }
        // ... resto de filtros
        
        const queryString = params.toString();
        const url = queryString ? `/productos?${queryString}` : '/productos';
        
        const response = await api.get(url);
        
        if (response.data && response.data.success) {
            const productos = response.data.data.map(producto => ({
                id: producto.id,
                nombre: producto.nombre || '',
                marca: producto.marca || '',
                modelo: producto.modelo || '',
                numero_serie: producto.numero_serie || '',
                precio: producto.precio || 0,
                condicion: producto.condicion || 'NUEVO',
                // IMPORTANTE: Capturar el id_estado_equipo correctamente
                id_estado_equipo: producto.id_estado_equipo || 1,
                estado: producto.estado || 'DISPONIBLE',
                bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                // ... resto de campos
            }));
            
            console.log(`✅ ${productos.length} productos procesados`);
            console.log(`📊 Disponibles: ${productos.filter(p => p.id_estado_equipo === 1).length}`);
            console.log(`📊 Asignados: ${productos.filter(p => p.id_estado_equipo === 2).length}`);
            
            return productos;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Error en getProductos:', error);
        return [];
    }
},
    /**
     * Obtener producto por ID
     */
    getProductoById: async (id) => {
        try {
            console.log(`📤 Buscando producto con ID: ${id}`);
            
            const response = await api.get(`/productos/${id}`);
            
            if (response.data && response.data.success) {
                const producto = response.data.data;
                return {
                    id: producto.id,
                    nombre: producto.nombre || '',
                    precio: producto.precio || 0,
                    oc_numero: producto.oc_numero || '',
                    factura_numero: producto.factura_numero || '',
                    descripcion: producto.descripcion || '',
                    marca: producto.marca || '',
                    estado: producto.estado || 'DISPONIBLE',
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    condicion: producto.condicion || 'NUEVO',
                    fecha_creacion: producto.fecha_creacion || null,
                    bodega_id: producto.bodega_id,
                    bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                    imagen_path: producto.imagen_path || null,
                    colaborador_asignado: producto.colaborador_asignado || null,
                    historial_uso: producto.historial_uso || [],
                    historial_mantenciones: producto.historial_mantenciones || []
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Error en getProductoById:', error);
            throw error;
        }
    },

    /**
     * Crear nuevo producto (único, sin cantidad/stock)
     */
    createProducto: async (productoData) => {
        try {
            console.log('📤 Creando producto:', productoData);
            
            const dataToSend = {
                nombre: productoData.nombre,
                precio: parseFloat(productoData.precio) || 0,
                oc_numero: productoData.oc_numero || '',
                factura_numero: productoData.factura_numero || '',
                descripcion: productoData.descripcion || '',
                marca: productoData.marca || '',
                estado: productoData.estado || 'DISPONIBLE',
                modelo: productoData.modelo || '',
                numero_serie: productoData.numero_serie || '',
                condicion: productoData.condicion || 'NUEVO',
                bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null
            };

            console.log('📤 Datos a enviar al backend:', JSON.stringify(dataToSend, null, 2));
            
            const response = await api.post('/productos', dataToSend);
            
            console.log('✅ Respuesta createProducto:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en createProducto:', error);
            throw error;
        }
    },

    /**
     * Actualizar producto
     */
    updateProducto: async (id, productoData) => {
        try {
            console.log(`📤 Actualizando producto ${id}:`, productoData);
            
            const dataToSend = {
                nombre: productoData.nombre,
                precio: parseFloat(productoData.precio) || 0,
                oc_numero: productoData.oc_numero || '',
                factura_numero: productoData.factura_numero || '',
                descripcion: productoData.descripcion || '',
                marca: productoData.marca || '',
                estado: productoData.estado || 'DISPONIBLE',
                modelo: productoData.modelo || '',
                numero_serie: productoData.numero_serie || '',
                condicion: productoData.condicion || 'NUEVO',
                bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null
            };

            console.log('📤 Datos a enviar al backend:', JSON.stringify(dataToSend, null, 2));
            
            const response = await api.put(`/productos/${id}`, dataToSend);
            
            console.log('✅ Respuesta updateProducto:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en updateProducto:', error);
            throw error;
        }
    },

    /**
     * Eliminar producto
     */
    deleteProducto: async (id) => {
        try {
            console.log(`📤 Eliminando producto ${id}`);
            
            const response = await api.delete(`/productos/${id}`);
            
            console.log('✅ Respuesta deleteProducto:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en deleteProducto:', error);
            throw error;
        }
    },

    // ============================================
    // MÉTODOS DE ESTADÍSTICAS
    // ============================================
    
    /**
     * Obtener estadísticas de productos
     */
    getStats: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de productos...');
            
            const response = await api.get('/productos/stats');
            
            console.log('📊 Respuesta stats:', response.data);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            
            return {
                totalProductos: 0,
                valorTotal: 0,
                disponibles: 0,
                asignados: 0,
                enMantencion: 0,
                enReparacion: 0,
                noDisponibles: 0
            };
        } catch (error) {
            console.error('❌ Error en getStats:', error);
            return {
                totalProductos: 0,
                valorTotal: 0,
                disponibles: 0,
                asignados: 0,
                enMantencion: 0,
                enReparacion: 0,
                noDisponibles: 0
            };
        }
    },

    // ============================================
    // MÉTODOS DE ASIGNACIÓN A COLABORADORES
    // ============================================
    
    /**
     * Asignar producto a colaborador
     */
    asignarProducto: async (productoId, colaboradorId, data) => {
        try {
            console.log(`📤 Asignando producto ${productoId} a colaborador ${colaboradorId}`);
            
            // Validar IDs
            if (!productoId || isNaN(Number(productoId))) {
                throw new Error('ID de producto inválido');
            }
            if (!colaboradorId || isNaN(Number(colaboradorId))) {
                throw new Error('ID de colaborador inválido');
            }
            
            const asignacionData = {
                producto_id: parseInt(productoId),
                colaborador_id: parseInt(colaboradorId),
                motivo: data.motivo || 'Asignación de equipo',
                observaciones: data.observaciones || '',
                fecha_asignacion: data.fecha_asignacion || new Date().toISOString().split('T')[0]
            };
            
            console.log('📤 Enviando a /asignaciones:', asignacionData);
            
            const response = await api.post('/asignaciones', asignacionData);
            
            console.log('✅ Respuesta asignación:', response.data);
            
            if (response.data && response.data.success) {
                const productoActualizado = await productosService.getProductoById(productoId);
                return {
                    success: true,
                    message: response.data.message,
                    producto: productoActualizado,
                    colaborador: response.data.colaborador
                };
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Error en asignarProducto:', error);
            if (error.response) {
                throw new Error(error.response.data?.message || 'Error en el servidor');
            } else if (error.request) {
                throw new Error('No se recibió respuesta del servidor');
            } else {
                throw new Error(error.message || 'Error al asignar producto');
            }
        }
    },

    // ============================================
    // MÉTODOS DE MANTENCIONES
    // ============================================
    
    /**
     * Iniciar mantención de producto
     */
    iniciarMantencion: async (mantencionData) => {
        try {
            console.log('📤 Iniciando mantención:', mantencionData);
            
            const response = await api.post('/productos/mantencion/iniciar', mantencionData);
            
            console.log('✅ Respuesta iniciarMantencion:', response.data);
            
            if (response.data && response.data.success) {
                const productoActualizado = await productosService.getProductoById(mantencionData.producto_id);
                return {
                    success: true,
                    message: response.data.message,
                    producto: productoActualizado
                };
            }
            return response.data;
        } catch (error) {
            console.error('❌ Error en iniciarMantencion:', error);
            throw error;
        }
    },

    /**
     * Finalizar mantención de producto
     */
    finalizarMantencion: async (mantencionData) => {
        try {
            console.log('📤 Finalizando mantención:', mantencionData);
            
            const response = await api.post('/productos/mantencion/finalizar', mantencionData);
            
            console.log('✅ Respuesta finalizarMantencion:', response.data);
            
            if (response.data && response.data.success) {
                const productoActualizado = await productosService.getProductoById(mantencionData.producto_id);
                return {
                    success: true,
                    message: response.data.message,
                    producto: productoActualizado
                };
            }
            return response.data;
        } catch (error) {
            console.error('❌ Error en finalizarMantencion:', error);
            throw error;
        }
    },

    /**
     * Obtener historial de mantenciones de un producto
     */
    getHistorialMantenciones: async (productoId) => {
        try {
            console.log(`📤 Obteniendo historial de mantenciones para producto ${productoId}`);
            
            const response = await api.get(`/productos/${productoId}/mantenciones`);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getHistorialMantenciones:', error);
            return [];
        }
    },

    // ============================================
    // MÉTODOS DE HISTORIAL DE USO
    // ============================================
    
    /**
     * Obtener historial de uso/asignaciones de un producto
     */
    getHistorialUso: async (productoId) => {
        try {
            console.log(`📤 Obteniendo historial de uso para producto ${productoId}`);
            
            // Validar ID
            if (!productoId || isNaN(Number(productoId))) {
                console.warn('ID de producto inválido para obtener historial');
                return [];
            }
            
            const response = await api.get(`/asignaciones/producto/${productoId}/historial`);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getHistorialUso:', error);
            return [];
        }
    },

    /**
     * Guardar historial de uso
     */
    guardarHistorialUso: async (productoId, historial) => {
        try {
            console.log(`📤 Guardando historial de uso para producto ${productoId}:`, historial);
            const response = await api.post(`/productos/${productoId}/historial-uso`, { historial });
            return response.data;
        } catch (error) {
            console.error('Error guardando historial de uso:', error);
            throw error;
        }
    },

    // ============================================
    // MÉTODOS DE DISPOSICIÓN (BAJA/DONACIÓN)
    // ============================================
    
    /**
     * Registrar baja de producto
     */
    registrarBaja: async (formData) => {
        try {
            console.log('📤 Registrando baja de producto');
            
            const response = await api.post('/productos/baja', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Respuesta registrarBaja:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en registrarBaja:', error);
            throw error;
        }
    },

    /**
     * Registrar donación de producto
     */
    registrarDonacion: async (formData) => {
        try {
            console.log('📤 Registrando donación de producto');
            
            const response = await api.post('/productos/donar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Respuesta registrarDonacion:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en registrarDonacion:', error);
            throw error;
        }
    },

    /**
     * Obtener historial de disposiciones (bajas y donaciones)
     */
    getHistorialDisposiciones: async () => {
        try {
            console.log('📤 Obteniendo historial de disposiciones');
            
            const response = await api.get('/productos/disposiciones');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return { donaciones: [], bajas: [] };
        } catch (error) {
            console.error('❌ Error en getHistorialDisposiciones:', error);
            return { donaciones: [], bajas: [] };
        }
    },

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================
    
    /**
     * Obtener todas las bodegas
     */
    getBodegas: async () => {
        try {
            console.log('📤 Obteniendo bodegas');
            
            const response = await api.get('/bodegas');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getBodegas:', error);
            return [];
        }
    },

    /**
     * Obtener todas las marcas
     */
    getMarcas: async () => {
        try {
            console.log('📤 Obteniendo marcas');
            
            const response = await api.get('/productos/marcas');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getMarcas:', error);
            return [];
        }
    },

    /**
     * Obtener estados disponibles
     */
    getEstados: async () => {
        try {
            console.log('📤 Obteniendo estados');
            
            const response = await api.get('/estados');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [
                { id: 1, nombre: 'DISPONIBLE' },
                { id: 2, nombre: 'ASIGNADO' },
                { id: 3, nombre: 'EN MANTENCIÓN' },
                { id: 4, nombre: 'EN REPARACIÓN' },
                { id: 5, nombre: 'NO DISPONIBLE' }
            ];
        } catch (error) {
            console.error('❌ Error en getEstados:', error);
            return [
                { id: 1, nombre: 'DISPONIBLE' },
                { id: 2, nombre: 'ASIGNADO' },
                { id: 3, nombre: 'EN MANTENCIÓN' },
                { id: 4, nombre: 'EN REPARACIÓN' },
                { id: 5, nombre: 'NO DISPONIBLE' }
            ];
        }
    },

    /**
     * Obtener historial de asignaciones
     */
    getHistorialAsignaciones: async () => {
        try {
            console.log('📤 Obteniendo historial de asignaciones');
            
            const response = await api.get('/asignaciones/historial');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getHistorialAsignaciones:', error);
            return [];
        }
    },

    /**
     * Obtener URL de imagen
     */
    getImageUrl: (imagenPath) => {
        if (!imagenPath) return null;
        if (imagenPath.startsWith('http')) return imagenPath;
        if (imagenPath.startsWith('/uploads/')) return `${API_URL}${imagenPath}`;
        return `${API_URL}/uploads/${imagenPath}`;
    }
};

export default productosService;