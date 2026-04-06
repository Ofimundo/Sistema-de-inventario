// backend/controllers/exportController.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { getConnection, sql } = require('../config/database');

const exportController = {
    /**
     * Exportar productos a Excel - VERSIÓN OPTIMIZADA
     */
    exportProductos: async (req, res) => {
        try {
            console.log('📥 Exportando productos a Excel...');
            
            const pool = await getConnection();
            
            // Consulta optimizada con WITH (NOLOCK) para evitar bloqueos
            const result = await pool.request().query(`
SELECT 
    p.id,
    p.nombre,
    p.marca,
    p.modelo,
    p.numero_serie,
    p.codigo_qr,
    p.precio,
    p.moneda,
    p.id_estado_equipo as estado,
    p.condicion,
    p.fecha_creacion,
    ISNULL(b.nombre, 'Sin bodega') as bodega
FROM [INV].[productos] p WITH (NOLOCK)
LEFT JOIN [INV].[producto_bodega] pb WITH (NOLOCK) ON p.id = pb.producto_id
LEFT JOIN [INV].[bodegas] b WITH (NOLOCK) ON pb.bodega_id = b.id
ORDER BY p.nombre
`);

            const productos = result.recordset;
            console.log(`✅ ${productos.length} productos obtenidos`);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Productos');

            // Definir columnas
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Marca', key: 'marca', width: 20 },
                { header: 'Modelo', key: 'modelo', width: 20 },
                { header: 'N° Serie', key: 'numero_serie', width: 20 },
                { header: 'Código QR', key: 'codigo_qr', width: 25 },
                { header: 'Precio', key: 'precio', width: 15 },
                { header: 'Moneda', key: 'moneda', width: 10 },
                { header: 'Stock', key: 'stock', width: 10 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Condición', key: 'condicion', width: 15 },
                { header: 'Bodega', key: 'bodega', width: 20 },
                { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 }
            ];

            // Agregar datos
            productos.forEach(producto => {
                worksheet.addRow({
                    id: producto.id,
                    nombre: producto.nombre,
                    marca: producto.marca || '',
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    codigo_qr: producto.codigo_qr || '',
                    precio: producto.precio || 0,
                    moneda: producto.moneda || 'CLP',
                    stock: producto.stock || 0,
                    estado: producto.estado || '',
                    condicion: producto.condicion || '',
                    bodega: producto.bodega || 'Sin bodega',
                    fecha_creacion: producto.fecha_creacion ? 
                        new Date(producto.fecha_creacion).toLocaleDateString('es-CL') : ''
                });
            });

            // Estilo para el encabezado
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2563EB' }
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Auto-filtro
            worksheet.autoFilter = 'A1:M1';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=productos_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

            console.log('✅ Excel de productos generado exitosamente');

        } catch (error) {
            console.error('❌ Error exportando productos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Exportar asignaciones a Excel
     */
    exportAsignaciones: async (req, res) => {
        try {
            console.log('📥 Exportando asignaciones a Excel...');
            
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    p.nombre as producto,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    a.nombre_usuario as trabajador,
                    a.rut_usuario as rut,
                    a.email,
                    a.departamento,
                    a.cargo,
                    a.fecha_asignacion,
                    a.estado,
                    a.motivo,
                    a.observaciones
                FROM [INV].[asignaciones] a WITH (NOLOCK)
                LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON a.producto_id = p.id
                ORDER BY a.fecha_asignacion DESC
            `);

            const asignaciones = result.recordset;
            console.log(`✅ ${asignaciones.length} asignaciones obtenidas`);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Asignaciones');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Marca', key: 'marca', width: 15 },
                { header: 'Modelo', key: 'modelo', width: 15 },
                { header: 'N° Serie', key: 'numero_serie', width: 20 },
                { header: 'Trabajador', key: 'trabajador', width: 25 },
                { header: 'RUT', key: 'rut', width: 15 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Departamento', key: 'departamento', width: 20 },
                { header: 'Cargo', key: 'cargo', width: 20 },
                { header: 'Cantidad', key: 'cantidad', width: 10 },
                { header: 'Fecha Asignación', key: 'fecha_asignacion', width: 20 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Motivo', key: 'motivo', width: 30 },
                { header: 'Observaciones', key: 'observaciones', width: 30 }
            ];

            asignaciones.forEach(asig => {
                worksheet.addRow({
                    id: asig.id,
                    producto: asig.producto || '',
                    marca: asig.marca || '',
                    modelo: asig.modelo || '',
                    numero_serie: asig.numero_serie || '',
                    trabajador: asig.trabajador || '',
                    rut: asig.rut || '',
                    email: asig.email || '',
                    departamento: asig.departamento || '',
                    cargo: asig.cargo || '',
                    cantidad: asig.cantidad || 1,
                    fecha_asignacion: asig.fecha_asignacion ? 
                        new Date(asig.fecha_asignacion).toLocaleString('es-CL') : '',
                    estado: asig.estado || '',
                    motivo: asig.motivo || '',
                    observaciones: asig.observaciones || ''
                });
            });

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF9333EA' }
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.autoFilter = 'A1:O1';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=asignaciones_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('❌ Error exportando asignaciones:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Exportar inventario completo (varias hojas)
     */
    exportInventario: async (req, res) => {
        try {
            console.log('📥 Exportando inventario completo a Excel...');
            
            const pool = await getConnection();
            const workbook = new ExcelJS.Workbook();

            // ============ HOJA 1: RESUMEN ============
            const resumenSheet = workbook.addWorksheet('Resumen');
            
            // Obtener estadísticas
            const statsResult = await pool.request().query(`
                SELECT 
                    COUNT(DISTINCT id) as totalProductos,
                    ISNULL(SUM(cantidad), 0) as totalUnidades,
                    ISNULL(SUM(precio * cantidad), 0) as valorTotal,
                    SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
                    SUM(CASE WHEN estado LIKE '%MANTEN%' THEN 1 ELSE 0 END) as enMantencion,
                    SUM(CASE WHEN estado = 'DONADO' THEN 1 ELSE 0 END) as donados,
                    SUM(CASE WHEN estado = 'BAJA' THEN 1 ELSE 0 END) as baja
                FROM [INV].[productos] WITH (NOLOCK)
            `);

            const stats = statsResult.recordset[0];

            resumenSheet.addRow(['REPORTE DE INVENTARIO COMPLETO']);
            resumenSheet.addRow([`Fecha: ${new Date().toLocaleDateString('es-CL')}`]);
            resumenSheet.addRow([`Hora: ${new Date().toLocaleTimeString('es-CL')}`]);
            resumenSheet.addRow([]);
            resumenSheet.addRow(['ESTADÍSTICAS GENERALES']);
            resumenSheet.addRow(['Total Productos', stats.totalProductos]);
            resumenSheet.addRow(['Total Unidades', stats.totalUnidades]);
            resumenSheet.addRow(['Valor Total', `$${stats.valorTotal?.toLocaleString('es-CL') || 0}`]);
            resumenSheet.addRow(['Disponibles', stats.disponibles]);
            resumenSheet.addRow(['Asignados', stats.asignados]);
            resumenSheet.addRow(['En Mantención', stats.enMantencion]);
            resumenSheet.addRow(['Donados', stats.donados]);
            resumenSheet.addRow(['Dados de Baja', stats.baja]);

            // ============ HOJA 2: PRODUCTOS ============
            const productosSheet = workbook.addWorksheet('Productos');
            
            const productosResult = await pool.request().query(`
                SELECT 
                    id,
                    nombre,
                    marca,
                    modelo,
                    numero_serie,
                    codigo_qr,
                    precio,
                    moneda,
                    cantidad as stock,
                    estado,
                    condicion,
                    fecha_creacion
                FROM [INV].[productos] WITH (NOLOCK)
                ORDER BY nombre
            `);

            productosSheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Marca', key: 'marca', width: 20 },
                { header: 'Modelo', key: 'modelo', width: 20 },
                { header: 'N° Serie', key: 'numero_serie', width: 20 },
                { header: 'Código QR', key: 'codigo_qr', width: 25 },
                { header: 'Precio', key: 'precio', width: 15 },
                { header: 'Moneda', key: 'moneda', width: 10 },
                { header: 'Stock', key: 'stock', width: 10 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Condición', key: 'condicion', width: 15 },
                { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 }
            ];

            productosSheet.addRows(productosResult.recordset);
            productosSheet.getRow(1).font = { bold: true };

            // ============ HOJA 3: ASIGNACIONES ============
            const asignacionesSheet = workbook.addWorksheet('Asignaciones Activas');
            
            const asignacionesResult = await pool.request().query(`
                SELECT TOP 100
                    a.id,
                    p.nombre as producto,
                    a.nombre_usuario as trabajador,
                    a.departamento,
                    a.fecha_asignacion,
                    a.estado
                FROM [INV].[asignaciones] a WITH (NOLOCK)
                LEFT JOIN [INV].[productos] p WITH (NOLOCK) ON a.producto_id = p.id
                WHERE a.estado = 'ASIGNADO'
                ORDER BY a.fecha_asignacion DESC
            `);

            asignacionesSheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Trabajador', key: 'trabajador', width: 25 },
                { header: 'Departamento', key: 'departamento', width: 20 },
                { header: 'Fecha Asignación', key: 'fecha_asignacion', width: 20 },
                { header: 'Estado', key: 'estado', width: 15 }
            ];

            asignacionesSheet.addRows(asignacionesResult.recordset);
            asignacionesSheet.getRow(1).font = { bold: true };

            // Configurar respuesta
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=inventario_completo_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

            console.log('✅ Inventario completo exportado');

        } catch (error) {
            console.error('❌ Error exportando inventario:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Exportar a PDF
     */
    exportPDF: async (req, res) => {
        try {
            console.log('📥 Exportando a PDF...');
            
            const { titulo, datos } = req.body;
            const doc = new PDFDocument();
            const filename = `reporte_${Date.now()}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            doc.pipe(res);

            // Título
            doc.fontSize(20).text(titulo || 'Reporte de Inventario', { align: 'center' });
            doc.moveDown();

            // Fecha
            doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-CL')}`, { align: 'right' });
            doc.moveDown(2);

            // Datos
            if (datos && Array.isArray(datos)) {
                datos.forEach((item, index) => {
                    doc.fontSize(12).text(`${index + 1}. ${JSON.stringify(item)}`);
                    doc.moveDown(0.5);
                });
            } else {
                doc.fontSize(12).text('No hay datos para mostrar');
            }

            doc.end();

        } catch (error) {
            console.error('❌ Error exportando PDF:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Mantener métodos legacy para compatibilidad
    exportUsuarios: async (req, res) => {
        try {
            console.log('📥 Exportando usuarios a Excel...');
            
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    id,
                    usuario,
                    nombre,
                    email,
                    rol,
                    activo,
                    fecha_creacion
                FROM [INV].[usuarios] WITH (NOLOCK)
                ORDER BY nombre
            `);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Usuarios');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Usuario', key: 'usuario', width: 20 },
                { header: 'Nombre', key: 'nombre', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Rol', key: 'rol', width: 15 },
                { header: 'Activo', key: 'activo', width: 10 },
                { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 }
            ];

            worksheet.addRows(result.recordset);
            worksheet.getRow(1).font = { bold: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('❌ Error exportando usuarios:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    exportHistorial: async (req, res) => {
        try {
            console.log('📥 Exportando historial a Excel...');
            
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT TOP 500
                    h.id,
                    h.accion as tipo,
                    h.detalles as descripcion,
                    h.fecha_hora as fecha,
                    u.usuario
                FROM [INV].[historial] h WITH (NOLOCK)
                LEFT JOIN [INV].[usuarios] u WITH (NOLOCK) ON h.usuario_id = u.id
                ORDER BY h.fecha_hora DESC
            `);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Historial');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Descripción', key: 'descripcion', width: 50 },
                { header: 'Fecha', key: 'fecha', width: 25 },
                { header: 'Usuario', key: 'usuario', width: 20 }
            ];

            worksheet.addRows(result.recordset);
            worksheet.getRow(1).font = { bold: true };

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=historial_${new Date().toISOString().split('T')[0]}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('❌ Error exportando historial:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = exportController;