/**
 * Genera datos para exportar a Excel
 * @param {Array} productos - Lista de productos
 * @param {Array} historial - Lista de historial
 * @returns {Object} - Datos formateados para Excel
 */
const generateExcelData = (productos, historial) => {
    // Formatear productos para Excel
    const productosFormatted = productos.map(p => ({
        ID: p.id,
        Nombre: p.nombre,
        'N° Serie': p.numero_serie,
        Marca: p.marca,
        Modelo: p.modelo,
        Precio: p.precio,
        Moneda: p.moneda,
        'N° OC': p.oc_numero,
        'N° Factura': p.factura_numero,
        Estado: p.estado,
        Descripción: p.descripcion,
        'Fecha Creación': p.fecha_creacion
    }));

    // Formatear historial para Excel
    const historialFormatted = historial.map(h => ({
        ID: h.id,
        Producto: h.producto_nombre,
        Acción: h.accion,
        Fecha: h.fecha,
        Usuario: h.usuario_nombre,
        'N° OC': h.oc_numero,
        'N° Factura': h.factura_numero,
        Detalles: h.detalles
    }));

    return {
        productos: productosFormatted,
        historial: historialFormatted
    };
};

/**
 * Genera estadísticas para reportes
 * @param {Array} productos - Lista de productos
 * @returns {Object} - Estadísticas calculadas
 */
const generateStats = (productos) => {
    const totalProductos = productos.length;
    const totalUnidades = productos.reduce((sum, p) => sum + (p.cantidad || 0), 0);
    const bajoStock = productos.filter(p => p.cantidad < 5).length;
    const nuevos = productos.filter(p => p.estado === 'nuevo').length;
    const usados = productos.filter(p => p.estado === 'usado').length;
    const asignados = productos.filter(p => p.estado === 'asignado').length;
    const enMantencion = productos.filter(p => p.estado === 'mantencion').length;
    
    // Calcular valor total del inventario
    const valorTotal = productos.reduce((sum, p) => {
        const precio = p.precio || 0;
        const cantidad = p.cantidad || 0;
        return sum + (precio * cantidad);
    }, 0);

    // Productos por marca
    const porMarca = {};
    productos.forEach(p => {
        if (p.marca) {
            porMarca[p.marca] = (porMarca[p.marca] || 0) + 1;
        }
    });

    return {
        totalProductos,
        totalUnidades,
        bajoStock,
        nuevos,
        usados,
        asignados,
        enMantencion,
        valorTotal,
        porMarca,
        fechaGeneracion: new Date().toISOString()
    };
};

/**
 * Genera resumen para dashboard
 * @param {Array} productos - Lista de productos
 * @param {Array} movimientos - Últimos movimientos
 * @returns {Object} - Datos para dashboard
 */
const generateDashboardData = (productos, movimientos) => {
    const stats = generateStats(productos);
    
    // Últimos 5 movimientos
    const ultimosMovimientos = movimientos
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);

    // Productos con bajo stock
    const productosCriticos = productos
        .filter(p => p.cantidad < 5)
        .sort((a, b) => a.cantidad - b.cantidad)
        .slice(0, 10);

    return {
        stats,
        ultimosMovimientos,
        productosCriticos,
        totalProductos: stats.totalProductos,
        totalUnidades: stats.totalUnidades
    };
};

module.exports = {
    generateExcelData,
    generateStats,
    generateDashboardData
};