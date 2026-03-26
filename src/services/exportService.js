// src/services/exportService.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportService = {
    /**
     * Exporta datos a Excel con múltiples hojas
     * @param {Object} data - Datos a exportar
     * @param {string} filename - Nombre del archivo
     */
    exportToExcel: (data, filename = 'reporte_inventario.xlsx') => {
        try {
            console.log('📤 Preparando exportación a Excel...');
            
            // Crear libro de trabajo
            const wb = XLSX.utils.book_new();
            
            // ============================================
            // HOJA 1: PRODUCTOS CON MOVIMIENTOS
            // ============================================
            if (data.productos && data.productos.length > 0) {
                const productosData = data.productos.map(p => ({
                    'ID': p.id,
                    'Producto': p.nombre,
                    'Marca': p.marca || '-',
                    'Modelo': p.modelo || '-',
                    'Serie': p.numero_serie || '-',
                    'Código QR': p.codigo_qr || '-',
                    'Stock': p.cantidad || p.stock || 0,
                    'Precio': p.precio ? `$${p.precio.toLocaleString('es-CL')}` : '$0',
                    'Condición': p.condicion || 'NUEVO',
                    'Estado': p.estado || 'DISPONIBLE',
                    'Bodega': p.bodega_nombre || 'Sin bodega',
                    'OC N°': p.oc_numero || '-',
                    'Factura N°': p.factura_numero || '-',
                    'Fecha Creación': p.fecha_creacion ? new Date(p.fecha_creacion).toLocaleString('es-CL') : '-',
                    'Último Movimiento': p.ultimo_movimiento || '-',
                    'Total Asignaciones': p.total_asignaciones || 0,
                    'Asignaciones Activas': p.total_asignaciones_activas || 0
                }));
                
                const wsProductos = XLSX.utils.json_to_sheet(productosData);
                
                // Ajustar ancho de columnas
                const colWidths = [
                    { wch: 8 },   // ID
                    { wch: 30 },  // Producto
                    { wch: 15 },  // Marca
                    { wch: 15 },  // Modelo
                    { wch: 15 },  // Serie
                    { wch: 15 },  // Código QR
                    { wch: 8 },   // Stock
                    { wch: 12 },  // Precio
                    { wch: 10 },  // Condición
                    { wch: 12 },  // Estado
                    { wch: 15 },  // Bodega
                    { wch: 12 },  // OC N°
                    { wch: 12 },  // Factura N°
                    { wch: 20 },  // Fecha Creación
                    { wch: 20 },  // Último Movimiento
                    { wch: 10 },  // Total Asignaciones
                    { wch: 10 }   // Asignaciones Activas
                ];
                wsProductos['!cols'] = colWidths;
                
                XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
                console.log('✅ Hoja 1: Productos agregada');
            } else {
                // Hoja vacía con encabezados
                const wsProductos = XLSX.utils.aoa_to_sheet([[
                    'ID', 'Producto', 'Marca', 'Modelo', 'Serie', 'Código QR', 
                    'Stock', 'Precio', 'Condición', 'Estado', 'Bodega', 'OC N°', 
                    'Factura N°', 'Fecha Creación', 'Último Movimiento', 
                    'Total Asignaciones', 'Asignaciones Activas'
                ]]);
                XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');
            }
            
            // ============================================
            // HOJA 2: HISTORIAL DE ASIGNACIONES
            // ============================================
            if (data.historialAsignaciones && data.historialAsignaciones.length > 0) {
                const historialData = data.historialAsignaciones.map(h => ({
                    'ID': h.id,
                    'Producto': h.producto_nombre || h.producto,
                    'Producto ID': h.producto_id,
                    'Usuario': h.nombre_usuario || h.usuario,
                    'Email': h.email || '-',
                    'RUT': h.rut_usuario || '-',
                    'Cargo': h.cargo || '-',
                    'Departamento': h.departamento || '-',
                    'Fecha Asignación': h.fecha_asignacion ? new Date(h.fecha_asignacion).toLocaleString('es-CL') : '-',
                    'Fecha Devolución': h.fecha_devolucion ? new Date(h.fecha_devolucion).toLocaleString('es-CL') : 'Pendiente',
                    'Condición Entrega': h.condicion_entrega || '-',
                    'Observaciones': h.observaciones || '-',
                    'Motivo': h.motivo || '-',
                    'Estado': h.estado || 'ASIGNADO',
                    'Cantidad': h.cantidad || 1,
                    'Registrado por': h.registrado_por || 'Sistema'
                }));
                
                const wsHistorial = XLSX.utils.json_to_sheet(historialData);
                
                const colWidthsHistorial = [
                    { wch: 8 },   // ID
                    { wch: 30 },  // Producto
                    { wch: 8 },   // Producto ID
                    { wch: 25 },  // Usuario
                    { wch: 20 },  // Email
                    { wch: 12 },  // RUT
                    { wch: 15 },  // Cargo
                    { wch: 15 },  // Departamento
                    { wch: 20 },  // Fecha Asignación
                    { wch: 20 },  // Fecha Devolución
                    { wch: 20 },  // Condición Entrega
                    { wch: 30 },  // Observaciones
                    { wch: 20 },  // Motivo
                    { wch: 10 },  // Estado
                    { wch: 8 },   // Cantidad
                    { wch: 15 }   // Registrado por
                ];
                wsHistorial['!cols'] = colWidthsHistorial;
                
                XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial Asignaciones');
                console.log('✅ Hoja 2: Historial de asignaciones agregada');
            } else {
                const wsHistorial = XLSX.utils.aoa_to_sheet([[
                    'ID', 'Producto', 'Producto ID', 'Usuario', 'Email', 'RUT', 
                    'Cargo', 'Departamento', 'Fecha Asignación', 'Fecha Devolución',
                    'Condición Entrega', 'Observaciones', 'Motivo', 'Estado', 
                    'Cantidad', 'Registrado por'
                ]]);
                XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial Asignaciones');
            }
            
            // ============================================
            // HOJA 3: BAJAS Y DONACIONES
            // ============================================
            const disposicionesCombinadas = [];
            
            // Agregar donaciones
            if (data.donaciones && data.donaciones.length > 0) {
                data.donaciones.forEach(d => {
                    disposicionesCombinadas.push({
                        'ID': d.id,
                        'Tipo': 'DONACIÓN',
                        'Producto': d.producto_nombre || d.producto,
                        'Producto ID': d.producto_id,
                        'Fecha': d.fecha_entrega ? new Date(d.fecha_entrega).toLocaleString('es-CL') : '-',
                        'Institución/Beneficiario': d.beneficiario || '-',
                        'RUT Beneficiario': d.rut_beneficiario || '-',
                        'Dirección': d.direccion || '-',
                        'Comuna': d.comuna || '-',
                        'Ciudad': d.ciudad || '-',
                        'Documento': d.documento_firmado || '-',
                        'Observaciones': d.observaciones || '-',
                        'Registrado por': d.registrado_por || 'Sistema',
                        'Email registro': d.email_registro || '-'
                    });
                });
            }
            
            // Agregar bajas
            if (data.bajas && data.bajas.length > 0) {
                data.bajas.forEach(b => {
                    disposicionesCombinadas.push({
                        'ID': b.id,
                        'Tipo': 'BAJA',
                        'Producto': b.producto_nombre || b.producto,
                        'Producto ID': b.producto_id,
                        'Fecha': b.fecha_baja ? new Date(b.fecha_baja).toLocaleString('es-CL') : '-',
                        'Motivo': b.motivo_baja || '-',
                        'Autorizado por': b.autorizado_por || '-',
                        'Documento': b.documento_autorizacion || '-',
                        'Observaciones': b.observaciones || '-',
                        'Registrado por': b.registrado_por || 'Sistema',
                        'Email registro': b.email_registro || '-'
                    });
                });
            }
            
            if (disposicionesCombinadas.length > 0) {
                const wsDisposiciones = XLSX.utils.json_to_sheet(disposicionesCombinadas);
                
                const colWidthsDisposiciones = [
                    { wch: 8 },   // ID
                    { wch: 10 },  // Tipo
                    { wch: 30 },  // Producto
                    { wch: 8 },   // Producto ID
                    { wch: 20 },  // Fecha
                    { wch: 25 },  // Institución/Motivo
                    { wch: 12 },  // RUT Beneficiario
                    { wch: 25 },  // Dirección
                    { wch: 15 },  // Comuna
                    { wch: 15 },  // Ciudad
                    { wch: 20 },  // Documento
                    { wch: 30 },  // Observaciones
                    { wch: 20 },  // Registrado por
                    { wch: 20 }   // Email registro
                ];
                wsDisposiciones['!cols'] = colWidthsDisposiciones;
                
                XLSX.utils.book_append_sheet(wb, wsDisposiciones, 'Bajas y Donaciones');
                console.log('✅ Hoja 3: Bajas y donaciones agregada');
            } else {
                const wsDisposiciones = XLSX.utils.aoa_to_sheet([[
                    'ID', 'Tipo', 'Producto', 'Producto ID', 'Fecha', 
                    'Institución/Motivo', 'RUT Beneficiario', 'Dirección', 
                    'Comuna', 'Ciudad', 'Documento', 'Observaciones', 
                    'Registrado por', 'Email registro'
                ]]);
                XLSX.utils.book_append_sheet(wb, wsDisposiciones, 'Bajas y Donaciones');
            }
            
            // ============================================
            // HOJA 4: BODEGAS DISPONIBLES
            // ============================================
            if (data.bodegas && data.bodegas.length > 0) {
                const bodegasData = data.bodegas.map(b => ({
                    'ID': b.id,
                    'Bodega': b.nombre,
                    'Ubicación': b.ubicacion || '-',
                    'Responsable': b.responsable_nombre || b.responsable || 'Sin responsable',
                    'Responsable ID': b.responsable_id || '-',
                    'Total Productos': b.total_productos || 0,
                    'Stock Total': b.total_stock || 0,
                    'Productos Disponibles': b.productos_disponibles || 0,
                    'Productos Asignados': b.productos_asignados || 0,
                    'Productos en Mantención': b.productos_en_mantencion || 0,
                    'Descripción': b.descripcion || '-',
                    'Fecha Creación': b.fecha_creacion ? new Date(b.fecha_creacion).toLocaleString('es-CL') : '-'
                }));
                
                const wsBodegas = XLSX.utils.json_to_sheet(bodegasData);
                
                const colWidthsBodegas = [
                    { wch: 8 },   // ID
                    { wch: 25 },  // Bodega
                    { wch: 20 },  // Ubicación
                    { wch: 20 },  // Responsable
                    { wch: 8 },   // Responsable ID
                    { wch: 8 },   // Total Productos
                    { wch: 8 },   // Stock Total
                    { wch: 8 },   // Productos Disponibles
                    { wch: 8 },   // Productos Asignados
                    { wch: 8 },   // Productos en Mantención
                    { wch: 30 },  // Descripción
                    { wch: 20 }   // Fecha Creación
                ];
                wsBodegas['!cols'] = colWidthsBodegas;
                
                XLSX.utils.book_append_sheet(wb, wsBodegas, 'Bodegas');
                console.log('✅ Hoja 4: Bodegas agregada');
            } else {
                const wsBodegas = XLSX.utils.aoa_to_sheet([[
                    'ID', 'Bodega', 'Ubicación', 'Responsable', 'Responsable ID',
                    'Total Productos', 'Stock Total', 'Productos Disponibles',
                    'Productos Asignados', 'Productos en Mantención', 'Descripción',
                    'Fecha Creación'
                ]]);
                XLSX.utils.book_append_sheet(wb, wsBodegas, 'Bodegas');
            }
            
            // Guardar archivo
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(dataBlob, filename);
            
            console.log('✅ Exportación completada con 4 hojas');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error exportando a Excel:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Prepara datos para exportación desde el estado actual
     * @param {Array} productos - Lista de productos
     * @param {Array} historialAsignaciones - Historial de asignaciones
     * @param {Object} disposiciones - Objeto con donaciones y bajas
     * @param {Array} bodegas - Lista de bodegas
     * @returns {Object} - Datos preparados para exportación
     */
    prepareExportData: (productos = [], historialAsignaciones = [], disposiciones = { donaciones: [], bajas: [] }, bodegas = []) => {
        console.log('📊 Preparando datos para exportación:', {
            productos: productos.length,
            historial: historialAsignaciones.length,
            donaciones: disposiciones.donaciones?.length || 0,
            bajas: disposiciones.bajas?.length || 0,
            bodegas: bodegas.length
        });
        
        return {
            productos,
            historialAsignaciones,
            donaciones: disposiciones.donaciones || [],
            bajas: disposiciones.bajas || [],
            bodegas
        };
    }
};