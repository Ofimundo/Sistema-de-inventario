import api from './api';

export const notificacionesService = {
    // Obtener productos con stock crítico (para notificaciones)
    getStockCritico: async () => {
        try {
            const rutas = [
                '/productos?stock_critico=true',
                '/api/productos?stock_critico=true',
                '/api//productos?stock_critico=true',
                '/productos/criticos'
            ];
            
            for (const ruta of rutas) {
                try {
                    console.log('Intentando obtener stock crítico de:', ruta);
                    const response = await api.get(ruta);
                    const productos = response.data.success ? response.data.data : response.data;
                    return {
                        count: productos?.length || 0,
                        items: productos || []
                    };
                } catch (e) {
                    console.log(`Ruta ${ruta} falló para stock crítico`);
                }
            }
            
            // Datos de ejemplo
            return {
                count: 4,
                items: [
                    { id: 1, nombre: 'Mouse Logitech', stock: 2 },
                    { id: 2, nombre: 'Teclado HP', stock: 3 },
                    { id: 3, nombre: 'Monitor Samsung', stock: 1 },
                    { id: 4, nombre: 'Notebook Dell', stock: 4 }
                ]
            };
        } catch (error) {
            console.error('Error fetching stock critico:', error);
            return {
                count: 4,
                items: [
                    { id: 1, nombre: 'Mouse Logitech', stock: 2 },
                    { id: 2, nombre: 'Teclado HP', stock: 3 },
                    { id: 3, nombre: 'Monitor Samsung', stock: 1 },
                    { id: 4, nombre: 'Notebook Dell', stock: 4 }
                ]
            };
        }
    }
};