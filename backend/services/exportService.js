const ExcelJS = require('exceljs');
const { getConnection } = require('../config/database');

class ExportService {
    async exportarProductosCompleto() {
        try {
            const pool = await getConnection();
            
            // 1. Obtener todos los productos con sus detalles
            const productos = await pool.request().query(`
                SELECT 
                    p.id,
                    p.nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    p.precio,
                    p.moneda,
                    p.estado,
                    p.oc_numero,
                    p.factura_numero,
                    p.descripcion,
                    p.fecha_creacion,
                    p.imagen_path
                FROM INV.productos p
                ORDER BY p.fecha_creacion DESC
            `);

            // 2. Obtener historial completo con detalles de usuario
            const historial = await pool.request().query(`
                SELECT 
                    h.id,
                    h.producto_id,
                    p.nombre as producto_nombre,
                    h.accion,
                    h.fecha_hora,
                    u.usuario as usuario_nombre,
                    d.nombre as usuario_real_nombre,
                    d.email,
                    d.cargo,
                    h.detalles,
                    h.oc_numero,
                    h.factura_numero
                FROM INV.historial h
                LEFT JOIN INV.productos p ON h.producto_id = p.id
                LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
                LEFT JOIN INV.detalles_usuario d ON u.id = d.usuario_id
                ORDER BY h.fecha_hora DESC
            `);

            // 3. Obtener asignaciones actuales
            const asignaciones = await pool.request().query(`
                SELECT 
                    pu.id,
                    pu.producto_id,
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    pu.nombre_usuario,
                    pu.email,
                    pu.departamento,
                    pu.fecha_asignacion,
                    pu.estado as estado_asignacion,
                    u.usuario as asignado_por
                FROM INV.producto_uso pu
                INNER JOIN INV.productos p ON pu.producto_id = p.id
                LEFT JOIN INV.usuarios u ON pu.usuario_asignado_id = u.id
                WHERE pu.estado = 'asignado' AND pu.fecha_devolucion IS NULL
                ORDER BY pu.fecha_asignacion DESC
            `);

            // 4. Obtener donaciones
            const donaciones = await pool.request().query(`
                SELECT 
                    d.id,
                    d.producto_id,
                    p.nombre as producto_nombre,
                    d.beneficiario,
                    d.rut_beneficiario,
                    d.direccion,
                    d.comuna,
                    d.ciudad,
                    d.fecha_entrega,
                    d.observaciones,
                    u.usuario as registrado_por
                FROM INV.disposicion_donacion d
                INNER JOIN INV.productos p ON d.producto_id = p.id
                LEFT JOIN INV.usuarios u ON d.usuario_id = u.id
                ORDER BY d.fecha_entrega DESC
            `);

            // 5. Obtener bajas
            const bajas = await pool.request().query(`
                SELECT 
                    b.id,
                    b.producto_id,
                    p.nombre as producto_nombre,
                    b.motivo_baja,
                    b.fecha_baja,
                    b.autorizado_por,
                    b.observaciones,
                    u.usuario as registrado_por
                FROM INV.disposicion_baja b
                INNER JOIN INV.productos p ON b.producto_id = p.id
                LEFT JOIN INV.usuarios u ON b.usuario_id = u.id
                ORDER BY b.fecha_baja DESC
            `);

            return {
                productos: productos.recordset,
                historial: historial.recordset,
                asignaciones: asignaciones.recordset,
                donaciones: donaciones.recordset,
                bajas: bajas.recordset
            };
        } catch (error) {
            console.error('Error en exportService:', error);
            throw error;
        }
    }

    async generarExcelCompleto() {
        try {
            const data = await this.exportarProductosCompleto();
            
            // Crear libro de Excel
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Inventario';
            workbook.lastModifiedBy = 'Sistema';
            workbook.created = new Date();
            workbook.modified = new Date();

            // ============ HOJA 1: PRODUCTOS ============
            const sheetProductos = workbook.addWorksheet('Productos', {
                properties: { tabColor: { argb: 'FF667EEA' } },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            // Título
            sheetProductos.mergeCells('A1:L1');
            const tituloProductos = sheetProductos.getCell('A1');
            tituloProductos.value = 'LISTADO COMPLETO DE PRODUCTOS';
            tituloProductos.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            tituloProductos.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF667EEA' }
            };
            tituloProductos.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetProductos.getRow(1).height = 30;

            // Encabezados
            const headersProductos = [
                'ID', 'Nombre', 'N° Serie', 'Marca', 'Modelo', 'Cantidad',
                'Precio', 'Moneda', 'Estado', 'OC N°', 'Factura N°', 'Fecha Creación'
            ];
            
            const headerRow = sheetProductos.addRow(headersProductos);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4A5568' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Datos
            data.productos.forEach(producto => {
                const row = sheetProductos.addRow([
                    producto.id,
                    producto.nombre,
                    producto.numero_serie,
                    producto.marca,
                    producto.modelo,
                    producto.precio,
                    producto.moneda,
                    producto.estado,
                    producto.oc_numero || '',
                    producto.factura_numero || '',
                    producto.fecha_creacion ? new Date(producto.fecha_creacion).toLocaleDateString('es-CL') : ''
                ]);

                // Color por estado
                if (producto.estado === 'nuevo') {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFC6F6D5' }
                        };
                    });
                } else if (producto.estado === 'usado') {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFEEBC8' }
                        };
                    });
                } else if (producto.estado === 'mantencion') {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFBEE3F8' }
                        };
                    });
                } else if (producto.estado === 'asignado') {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE9D8FD' }
                        };
                    });
                } else if (producto.estado === 'eliminado') {
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFED7D7' }
                        };
                    });
                }
            });

            // Ajustar columnas
            sheetProductos.columns.forEach(column => {
                column.width = 18;
            });

            // ============ HOJA 2: HISTORIAL ============
            const sheetHistorial = workbook.addWorksheet('Historial', {
                properties: { tabColor: { argb: 'FF48BB78' } },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            // Título
            sheetHistorial.mergeCells('A1:I1');
            const tituloHistorial = sheetHistorial.getCell('A1');
            tituloHistorial.value = 'HISTORIAL DE ACCIONES';
            tituloHistorial.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            tituloHistorial.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF48BB78' }
            };
            tituloHistorial.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetHistorial.getRow(1).height = 30;

            // Encabezados historial
            const headersHistorial = [
                'ID', 'Producto', 'Acción', 'Usuario', 'Email', 'Cargo',
                'Fecha/Hora', 'Detalles', 'OC/Factura'
            ];
            
            const headerHistorialRow = sheetHistorial.addRow(headersHistorial);
            headerHistorialRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2F855A' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Datos historial
            data.historial.forEach(item => {
                const fecha = item.fecha_hora ? new Date(item.fecha_hora).toLocaleString('es-CL') : '';
                const ocFactura = [item.oc_numero, item.factura_numero].filter(Boolean).join(' / ');
                
                sheetHistorial.addRow([
                    item.id,
                    item.producto_nombre || 'N/A',
                    item.accion,
                    item.usuario_nombre || item.usuario_real_nombre || 'Sistema',
                    item.email || '',
                    item.cargo || '',
                    fecha,
                    item.detalles || '',
                    ocFactura || 'N/A'
                ]);
            });

            // Ajustar columnas
            sheetHistorial.columns.forEach(column => {
                column.width = 18;
            });

            // ============ HOJA 3: ASIGNACIONES ACTIVAS ============
            const sheetAsignaciones = workbook.addWorksheet('Asignaciones Activas', {
                properties: { tabColor: { argb: 'FF9F7AEA' } },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            // Título
            sheetAsignaciones.mergeCells('A1:H1');
            const tituloAsignaciones = sheetAsignaciones.getCell('A1');
            tituloAsignaciones.value = 'ASIGNACIONES ACTIVAS';
            tituloAsignaciones.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            tituloAsignaciones.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF9F7AEA' }
            };
            tituloAsignaciones.alignment = { horizontal: 'center', vertical: 'middle' };
            sheetAsignaciones.getRow(1).height = 30;

            // Encabezados asignaciones
            const headersAsignaciones = [
                'ID', 'Producto', 'N° Serie', 'Usuario', 'Email',
                'Departamento', 'Fecha Asignación', 'Asignado Por'
            ];
            
            const headerAsignacionesRow = sheetAsignaciones.addRow(headersAsignaciones);
            headerAsignacionesRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF6B46A0' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Datos asignaciones
            data.asignaciones.forEach(item => {
                sheetAsignaciones.addRow([
                    item.id,
                    item.producto_nombre,
                    item.numero_serie,
                    item.nombre_usuario,
                    item.email || '',
                    item.departamento || '',
                    item.fecha_asignacion ? new Date(item.fecha_asignacion).toLocaleString('es-CL') : '',
                    item.asignado_por || 'Sistema'
                ]);
            });

            // Ajustar columnas
            sheetAsignaciones.columns.forEach(column => {
                column.width = 18;
            });

            // ============ HOJA 4: DONACIONES ============
            const sheetDonaciones = workbook.addWorksheet('Donaciones', {
                properties: { tabColor: { argb: 'FF48BB78' } },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            // Título
            sheetDonaciones.mergeCells('A1:J1');
            const tituloDonaciones = sheetDonaciones.getCell('A1');
            tituloDonaciones.value = 'REGISTRO DE DONACIONES';
            tituloDonaciones.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            tituloDonaciones.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF48BB78' }
            };
            tituloDonaciones.alignment = { horizontal: 'center', vertical: 'middle' };

            // Encabezados donaciones
            const headersDonaciones = [
                'ID', 'Producto', 'Beneficiario', 'RUT', 'Dirección',
                'Comuna', 'Ciudad', 'Fecha Entrega', 'Registrado Por', 'Observaciones'
            ];
            
            const headerDonacionesRow = sheetDonaciones.addRow(headersDonaciones);
            headerDonacionesRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2F855A' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Datos donaciones
            data.donaciones.forEach(item => {
                sheetDonaciones.addRow([
                    item.id,
                    item.producto_nombre,
                    item.beneficiario,
                    item.rut_beneficiario || '',
                    item.direccion || '',
                    item.comuna || '',
                    item.ciudad || '',
                    item.fecha_entrega ? new Date(item.fecha_entrega).toLocaleString('es-CL') : '',
                    item.registrado_por || 'Sistema',
                    item.observaciones || ''
                ]);
            });

            // Ajustar columnas
            sheetDonaciones.columns.forEach(column => {
                column.width = 18;
            });

            // ============ HOJA 5: BAJAS ============
            const sheetBajas = workbook.addWorksheet('Bajas', {
                properties: { tabColor: { argb: 'FFF56565' } },
                views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
            });

            // Título
            sheetBajas.mergeCells('A1:G1');
            const tituloBajas = sheetBajas.getCell('A1');
            tituloBajas.value = 'REGISTRO DE BAJAS';
            tituloBajas.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            tituloBajas.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF56565' }
            };
            tituloBajas.alignment = { horizontal: 'center', vertical: 'middle' };

            // Encabezados bajas
            const headersBajas = [
                'ID', 'Producto', 'Motivo de Baja', 'Fecha Baja',
                'Autorizado Por', 'Registrado Por', 'Observaciones'
            ];
            
            const headerBajasRow = sheetBajas.addRow(headersBajas);
            headerBajasRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFC53030' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Datos bajas
            data.bajas.forEach(item => {
                sheetBajas.addRow([
                    item.id,
                    item.producto_nombre,
                    item.motivo_baja,
                    item.fecha_baja ? new Date(item.fecha_baja).toLocaleString('es-CL') : '',
                    item.autorizado_por || '',
                    item.registrado_por || 'Sistema',
                    item.observaciones || ''
                ]);
            });

            // Ajustar columnas
            sheetBajas.columns.forEach(column => {
                column.width = 18;
            });

            return workbook;
        } catch (error) {
            console.error('Error generando Excel:', error);
            throw error;
        }
    }
}

module.exports = new ExportService();