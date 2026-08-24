// src/services/productos.js - VERSIÓN COMPLETA CON BÚSQUEDA POR COLABORADOR

import api from './api';

const API_URL = 'http://localhost:98';

export const productosService = {
    // ============================================
    // MÉTODOS PRINCIPALES DE PRODUCTOS
    // ============================================
    
    /**
     * Listar todos los productos con filtros (incluye búsqueda por colaborador)
     */
    getProductos: async (search = '', filters = {}) => {
        try {
            console.log('📤 getProductos - search:', search, 'filters:', filters);
            
            const params = new URLSearchParams();
            
            // Búsqueda por texto (puede incluir nombre de colaborador)
            if (search && search.trim()) {
                params.append('search', search.trim());
            }
            
            // Filtros
            if (filters.marca && filters.marca !== '') {
                params.append('marca', filters.marca);
            }
            if (filters.estado && filters.estado !== '') {
                params.append('estado', filters.estado);
            }
            if (filters.condicion && filters.condicion !== '') {
                params.append('condicion', filters.condicion);
            }
            if (filters.bodega_id && filters.bodega_id !== '') {
                params.append('bodega_id', filters.bodega_id);
            }
            
            const queryString = params.toString();
            const url = queryString ? `/productos?${queryString}` : '/productos';
            
            console.log('📤 URL productos:', url);
            
            const response = await api.get(url);
            
            console.log('✅ Respuesta productos:', response.data);
            
            if (response.data && response.data.success) {
                const productos = response.data.data.map(producto => ({
                    id: producto.id,
                    nombre: producto.nombre || '',
                    marca: producto.marca || '',
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    precio: producto.precio || 0,
                    condicion: producto.condicion || 'NUEVO',
                    id_estado_equipo: producto.id_estado_equipo || 1,
                    estado: producto.estado || this.getEstadoFromId(producto.id_estado_equipo),
                    bodega_id: producto.bodega_id,
                    bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                    oc_numero: producto.oc_numero || '',
                    factura_numero: producto.factura_numero || '',
                    descripcion: producto.descripcion || '',
                    fecha_adquisicion: producto.fecha_adquisicion || null,
                    fecha_creacion: producto.fecha_creacion || null,
                    imagen_path: producto.imagen_path || null,
                    cantidad: producto.cantidad || 1,
                    stock: producto.cantidad || 1,
                    es_granel: producto.es_granel === 1 || producto.es_granel === true ? true : false,
                    colaborador_asignado: producto.colaborador_asignado || null,
                    historial_uso: producto.historial_uso || [],
                    historial_mantenciones: producto.historial_mantenciones || [],
                    fecha_baja: producto.fecha_baja || null,
                    fecha_donacion: producto.fecha_donacion || null
                }));
                
                // Aplicar filtro por colaborador en el frontend (búsqueda local)
                let filteredProductos = productos;
                
                if (search && search.trim()) {
                    const searchTerm = search.toLowerCase().trim();
                    filteredProductos = productos.filter(producto => {
                        // Búsqueda en campos del producto
                        const nombre = (producto.nombre || '').toLowerCase();
                        const marca = (producto.marca || '').toLowerCase();
                        const modelo = (producto.modelo || '').toLowerCase();
                        const serie = (producto.numero_serie || '').toLowerCase();
                        
                        // Búsqueda en colaborador asignado
                        const colaboradorNombre = (producto.colaborador_asignado?.nombre || '').toLowerCase();
                        const colaboradorRut = (producto.colaborador_asignado?.rut || '').toLowerCase();
                        const colaboradorEmail = (producto.colaborador_asignado?.email || '').toLowerCase();
                        const colaboradorCargo = (producto.colaborador_asignado?.cargo || '').toLowerCase();
                        
                        return nombre.includes(searchTerm) ||
                               marca.includes(searchTerm) ||
                               modelo.includes(searchTerm) ||
                               serie.includes(searchTerm) ||
                               colaboradorNombre.includes(searchTerm) ||
                               colaboradorRut.includes(searchTerm) ||
                               colaboradorEmail.includes(searchTerm) ||
                               colaboradorCargo.includes(searchTerm);
                    });
                }
                
                console.log(`✅ ${filteredProductos.length} productos procesados (${productos.length} totales, filtrados por: "${search}")`);
                console.log(`📊 Disponibles: ${filteredProductos.filter(p => p.id_estado_equipo === 1).length}`);
                console.log(`📊 Asignados: ${filteredProductos.filter(p => p.id_estado_equipo === 2).length}`);
                console.log(`📊 En Mantención: ${filteredProductos.filter(p => p.id_estado_equipo === 3).length}`);
                console.log(`📊 En Reparación: ${filteredProductos.filter(p => p.id_estado_equipo === 4).length}`);
                console.log(`📊 No Disponibles: ${filteredProductos.filter(p => p.id_estado_equipo === 5).length}`);
                console.log(`📊 Dados de Baja: ${filteredProductos.filter(p => p.id_estado_equipo === 6).length}`);
                
                return filteredProductos;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error en getProductos:', error);
            return [];
        }
    },

    /**
     * Obtener estado a partir del ID
     */
    getEstadoFromId: (idEstadoEquipo) => {
        const estados = {
            1: 'DISPONIBLE',
            2: 'ASIGNADO',
            3: 'EN MANTENCIÓN',
            4: 'EN REPARACIÓN',
            5: 'NO DISPONIBLE',
            6: 'BAJA'
        };
        return estados[idEstadoEquipo] || 'DISPONIBLE';
    },

    /**
     * Obtener producto por ID
     */
    getProductoById: async (id) => {
        try {
            console.log(`📤 Buscando producto con ID: ${id}`);
            
            const response = await api.get(`/productos/${id}`);
            
            console.log('✅ Respuesta getProductoById:', response.data);
            
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
                    estado: producto.estado || this.getEstadoFromId(producto.id_estado_equipo),
                    id_estado_equipo: producto.id_estado_equipo || 1,
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    condicion: producto.condicion || 'NUEVO',
                    fecha_creacion: producto.fecha_creacion || null,
                    bodega_id: producto.bodega_id,
                    bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                    imagen_path: producto.imagen_path || null,
                    cantidad: producto.cantidad || 1,
                    stock: producto.cantidad || 1,
                    es_granel: producto.es_granel === 1 || producto.es_granel === true ? true : false,
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
                bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null,
                cantidad: parseInt(productoData.cantidad) || 1,
                es_granel: productoData.es_granel ? true : false
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
                bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null,
                cantidad: parseInt(productoData.cantidad) || 1,
                es_granel: productoData.es_granel ? true : false
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

    /**
     * Descontar stock de producto a granel (entrega sin acta)
     */
    descontarStock: async (id, cantidad, observacion) => {
        try {
            console.log(`📤 Descontando ${cantidad} unidades del producto ${id}...`);
            const response = await api.post(`/productos/${id}/descontar-stock`, {
                cantidad: parseInt(cantidad),
                observacion: observacion || ''
            });
            console.log('✅ Respuesta descontarStock:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en descontarStock:', error);
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
            
            const response = await api.post('/asignaciones', asignacionData, {
                responseType: 'arraybuffer'
            });
            
            console.log('✅ Respuesta asignación recibida con status:', response.status);
            
            if (response.status === 200 || response.status === 201 || (response.data && response.data.success)) {
                const productoActualizado = await productosService.getProductoById(productoId).catch(() => null);
                return {
                    success: true,
                    message: 'Producto asignado correctamente',
                    producto: productoActualizado,
                    colaborador: { id: colaboradorId }
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
     * Obtener todas las mantenciones registradas en el sistema
     */
    getAllMantenciones: async () => {
        try {
            console.log('📤 Obteniendo todas las mantenciones...');
            const response = await api.get('/productos/mantenciones/todas');
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return (response.data && Array.isArray(response.data.data)) ? response.data.data : [];
        } catch (error) {
            console.error('❌ Error en getAllMantenciones:', error);
            return [];
        }
    },

    /**
     * Iniciar / Registrar mantención de producto
     */
    iniciarMantencion: async (mantencionData) => {
        try {
            console.log('📤 Iniciando mantención:', mantencionData);
            
            const response = await api.post('/productos/mantencion/iniciar', mantencionData);
            
            console.log('✅ Respuesta iniciarMantencion:', response.data);
            
            if (response.data && response.data.success) {
                return response.data;
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
            
            return response.data;
        } catch (error) {
            console.error('❌ Error en finalizarMantencion:', error);
            throw error;
        }
    },

    /**
     * Actualizar registro de mantención
     */
    updateMantencion: async (mantencionData) => {
        try {
            console.log('📤 Actualizando mantención:', mantencionData);
            const id = mantencionData.id;
            const response = await api.put(`/productos/mantencion/${id}`, mantencionData);
            console.log('✅ Respuesta updateMantencion:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en updateMantencion:', error);
            throw error;
        }
    },

    /**
     * Eliminar registro de mantención
     */
    deleteMantencion: async (id) => {
        try {
            console.log(`📤 Eliminando mantención ${id}...`);
            const response = await api.delete(`/productos/mantencion/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error en deleteMantencion:', error);
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
    // MÉTODOS DE DISPOSICIÓN (BAJA/DONACIÓN/LABORATORIO)
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
     * Registrar envío a laboratorio
     */
    registrarLaboratorio: async (formData) => {
        try {
            console.log('📤 Registrando envío a laboratorio');
            
            const response = await api.post('/productos/disposicion/laboratorio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('✅ Respuesta registrarLaboratorio:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en registrarLaboratorio:', error);
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
            // Fallback si el endpoint no existe
            return [
                { id: 1, nombre: 'DISPONIBLE' },
                { id: 2, nombre: 'ASIGNADO' },
                { id: 3, nombre: 'EN MANTENCIÓN' },
                { id: 4, nombre: 'EN REPARACIÓN' },
                { id: 5, nombre: 'NO DISPONIBLE' },
                { id: 6, nombre: 'BAJA' }
            ];
        } catch (error) {
            console.error('❌ Error en getEstados:', error);
            return [
                { id: 1, nombre: 'DISPONIBLE' },
                { id: 2, nombre: 'ASIGNADO' },
                { id: 3, nombre: 'EN MANTENCIÓN' },
                { id: 4, nombre: 'EN REPARACIÓN' },
                { id: 5, nombre: 'NO DISPONIBLE' },
                { id: 6, nombre: 'BAJA' }
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