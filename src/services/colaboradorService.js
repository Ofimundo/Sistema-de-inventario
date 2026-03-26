// src/services/colaboradorService.js
import api from './api';

export const colaboradorService = {
    
    /**
     * Obtener todos los colaboradores con filtros
     */
    getColaboradores: async (filters = {}) => {
        try {
            const params = {};
            
            if (filters.estado) params.estado = filters.estado;
            if (filters.departamento) params.departamento = filters.departamento;
            if (filters.search) params.search = filters.search;
            
            console.log('📤 Buscando colaboradores con filtros:', params);
            
            const response = await api.get('/colaboradores', { params });
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error en getColaboradores:', error);
            return [];
        }
    },
    
    /**
     * Obtener colaborador por ID
     */
    getColaboradorById: async (id) => {
        try {
            console.log(`📤 Buscando colaborador con ID: ${id}`);
            
            const response = await api.get(`/colaboradores/${id}`);
            
            if (response.data && response.data.success) {
                return {
                    success: true,
                    data: response.data.data
                };
            }
            
            if (response.data && (response.data.id || response.data.nombre)) {
                return {
                    success: true,
                    data: response.data
                };
            }
            
            return {
                success: false,
                data: null,
                message: 'Colaborador no encontrado'
            };
            
        } catch (error) {
            console.error('❌ Error en getColaboradorById:', error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    data: null,
                    message: 'Colaborador no encontrado'
                };
            }
            
            return {
                success: false,
                data: null,
                message: error.response?.data?.message || 'Error al obtener colaborador'
            };
        }
    },

    /**
     * Crear nuevo colaborador
     */
    createColaborador: async (colaboradorData) => {
        try {
            console.log('📤 Creando colaborador:', colaboradorData);
            
            const response = await api.post('/colaboradores', colaboradorData);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error en createColaborador:', error);
            throw error;
        }
    },

    /**
     * Actualizar colaborador
     */
    updateColaborador: async (id, colaboradorData) => {
        try {
            console.log(`📤 Actualizando colaborador ${id}:`, colaboradorData);
            
            const response = await api.put(`/colaboradores/${id}`, colaboradorData);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error en updateColaborador:', error);
            throw error;
        }
    },

    /**
     * Eliminar colaborador
     */
    deleteColaborador: async (id) => {
        try {
            console.log(`📤 Eliminando colaborador ${id}`);
            
            const response = await api.delete(`/colaboradores/${id}`);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error en deleteColaborador:', error);
            throw error;
        }
    },

    /**
     * Obtener productos asignados a un colaborador (CORREGIDO)
     */
    getProductosAsignados: async (colaboradorId) => {
        try {
            console.log(`📤 Buscando productos asignados al colaborador ${colaboradorId}`);
            
            const response = await api.get(`/colaboradores/${colaboradorId}/productos`);
            
            console.log('📥 Respuesta getProductosAsignados:', response.data);
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            
            if (Array.isArray(response.data)) {
                return response.data;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error en getProductosAsignados:', error);
            return [];
        }
    },

    /**
     * Obtener estadísticas de colaboradores
     */
    getStats: async () => {
        try {
            console.log('📤 Obteniendo estadísticas de colaboradores');
            
            const response = await api.get('/colaboradores/stats');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            
            return {
                total_colaboradores: 0,
                activos: 0,
                inactivos: 0,
                total_departamentos: 0,
                total_equipos_asignados: 0
            };
        } catch (error) {
            console.error('❌ Error en getStats:', error);
            return {
                total_colaboradores: 0,
                activos: 0,
                inactivos: 0,
                total_departamentos: 0,
                total_equipos_asignados: 0
            };
        }
    },

    /**
     * Obtener departamentos únicos
     */
    getDepartamentos: async () => {
        try {
            console.log('📤 Obteniendo departamentos');
            
            const response = await api.get('/colaboradores/departamentos');
            
            if (response.data && response.data.success) {
                return response.data.data;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error en getDepartamentos:', error);
            return [];
        }
    },
    
    /**
     * Formatear RUT
     */
    formatRut: (rut) => {
        if (!rut) return '';
        let rutLimpio = rut.replace(/[^0-9kK]/g, '');
        if (rutLimpio.length === 0) return '';
        
        let cuerpo = rutLimpio.slice(0, -1);
        let dv = rutLimpio.slice(-1);
        
        if (cuerpo.length > 3) {
            let formatted = '';
            while (cuerpo.length > 3) {
                formatted = '.' + cuerpo.slice(-3) + formatted;
                cuerpo = cuerpo.slice(0, -3);
            }
            cuerpo = cuerpo + formatted;
        }
        
        return cuerpo + '-' + dv.toUpperCase();
    },
    
    /**
     * Validar RUT
     */
    validateRut: (rut) => {
        if (!rut) return false;
        let rutLimpio = rut.replace(/[^0-9kK]/g, '');
        if (rutLimpio.length < 2) return false;
        
        let cuerpo = rutLimpio.slice(0, -1);
        let dv = rutLimpio.slice(-1).toUpperCase();
        
        let suma = 0;
        let multiplo = 2;
        
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i)) * multiplo;
            multiplo = multiplo === 7 ? 2 : multiplo + 1;
        }
        
        let dvEsperado = 11 - (suma % 11);
        dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
        
        return dv === dvEsperado;
    }
};

export default colaboradorService;