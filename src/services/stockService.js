// src/services/stockService.js - NUEVO ARCHIVO
import api from './api';

export const stockService = {
    /**
     * Obtener resumen de stock agrupado por marca y modelo
     */
    getResumenStock: async () => {
        try {
            console.log('📤 Solicitando resumen de stock...');
            const response = await api.get('/stock/resumen');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getResumenStock:', error);
            return [];
        }
    },

    /**
     * Obtener detalle de productos por marca y modelo
     */
    getDetalleProductos: async (marca, modelo, nombre) => {
        try {
            console.log(`📤 Solicitando detalle de productos: ${marca} - ${modelo} - ${nombre}`);
            const response = await api.get('/stock/detalle', {
                params: { marca, modelo, nombre }
            });
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getDetalleProductos:', error);
            return [];
        }
    },

    /**
     * Obtener marcas únicas
     */
    getMarcas: async () => {
        try {
            console.log('📤 Solicitando marcas...');
            const response = await api.get('/stock/marcas');
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
     * Obtener estadísticas generales de stock
     */
    getEstadisticas: async () => {
        try {
            console.log('📤 Solicitando estadísticas de stock...');
            const response = await api.get('/stock/estadisticas');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return {
                total_productos: 0,
                total_marcas: 0,
                total_modelos: 0,
                total_disponibles: 0,
                total_asignados: 0,
                total_mantencion: 0,
                total_reparacion: 0,
                total_no_disponibles: 0,
                precio_promedio: 0,
                valor_total_inventario: 0
            };
        } catch (error) {
            console.error('❌ Error en getEstadisticas:', error);
            return {
                total_productos: 0,
                total_marcas: 0,
                total_modelos: 0,
                total_disponibles: 0,
                total_asignados: 0,
                total_mantencion: 0,
                total_reparacion: 0,
                total_no_disponibles: 0,
                precio_promedio: 0,
                valor_total_inventario: 0
            };
        }
    },

    /**
     * Obtener top marcas
     */
    getTopMarcas: async () => {
        try {
            console.log('📤 Solicitando top marcas...');
            const response = await api.get('/stock/top-marcas');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('❌ Error en getTopMarcas:', error);
            return [];
        }
    }
};

export default stockService;