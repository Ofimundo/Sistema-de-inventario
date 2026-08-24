// backend/routes/historialRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const ExcelJS = require('exceljs');

console.log('🔧 Inicializando historialRoutes.js...');

// ============================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN A EXCEL
// ============================================
const exportarExcel = async (req, res) => {
    let pool;
    try {
        console.log('📥 Exportando historial completo a Excel...');
        console.log('📥 Filtros recibidos:', req.query);
        
        const { busqueda, origen, fechaInicio, fechaFin } = req.query;
        
        pool = await db.getConnection();
        
        // ============================================
        // 1. OBTENER HISTORIAL GENERAL (desde tabla historial)
        // ============================================
        console.log('📊 Consultando historial...');
        const historialResult = await pool.request().query(`
            SELECT 
                h.id,
                h.producto_id,
                h.accion,
                h.usuario_id,
                h.oc_numero,
                h.factura_numero,
                h.detalles,
                h.fecha_hora,
                p.nombre as producto_nombre,
                p.numero_serie,
                p.marca as producto_marca,
                p.modelo as producto_modelo,
                u.nombre as usuario_nombre,
                u.usuario as usuario_username
            FROM INV.historial h
            LEFT JOIN INV.productos p ON h.producto_id = p.id
            LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
            ORDER BY h.fecha_hora DESC
        `);
        
        const historial = historialResult.recordset || [];
        console.log(`✅ ${historial.length} registros en historial encontrados`);
        
        // ============================================
        // 2. OBTENER BAJAS
        // ============================================
        console.log('📊 Consultando bajas...');
        const bajasResult = await pool.request().query(`
            SELECT 
                b.id,
                b.producto_id,
                b.motivo_baja,
                b.fecha_baja,
                b.autorizado_por,
                b.observaciones,
                p.nombre as producto_nombre,
                p.numero_serie,
                p.marca as producto_marca,
                p.modelo as producto_modelo
            FROM INV.disposicion_baja b
            LEFT JOIN INV.productos p ON b.producto_id = p.id
            ORDER BY b.fecha_baja DESC
        `);
        
        const bajas = bajasResult.recordset || [];
        console.log(`✅ ${bajas.length} bajas encontradas`);
        
        // ============================================
        // 3. OBTENER DONACIONES
        // ============================================
        console.log('📊 Consultando donaciones...');
        const donacionesResult = await pool.request().query(`
            SELECT 
                d.id,
                d.producto_id,
                d.beneficiario,
                d.rut_beneficiario,
                d.direccion,
                d.comuna,
                d.ciudad,
                d.fecha_entrega,
                d.observaciones,
                p.nombre as producto_nombre,
                p.numero_serie,
                p.marca as producto_marca,
                p.modelo as producto_modelo
            FROM INV.disposicion_donacion d
            LEFT JOIN INV.productos p ON d.producto_id = p.id
            ORDER BY d.fecha_entrega DESC
        `);
        
        const donaciones = donacionesResult.recordset || [];
        console.log(`✅ ${donaciones.length} donaciones encontradas`);
        
        // ============================================
        // 4. APLICAR FILTROS AL HISTORIAL
        // ============================================
        let filteredHistorial = [...historial];
        
        if (busqueda && busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            filteredHistorial = filteredHistorial.filter(item => {
                const producto = (item.producto_nombre || '').toLowerCase();
                const detalles = (item.detalles || '').toLowerCase();
                const usuario = (item.usuario_nombre || '').toLowerCase();
                return producto.includes(busquedaLower) || 
                       detalles.includes(busquedaLower) || 
                       usuario.includes(busquedaLower);
            });
        }
        
        if (origen && origen !== 'todos') {
            filteredHistorial = filteredHistorial.filter(item => {
                if (origen === 'asignacion') return item.accion === 'ASIGNACION' || item.accion === 'ASIGNACIÓN';
                if (origen === 'devolucion') return item.accion === 'DEVOLUCION' || item.accion === 'DEVOLUCIÓN';
                if (origen === 'baja') return item.accion === 'BAJA';
                if (origen === 'donacion') return item.accion === 'DONACION';
                return true;
            });
        }
        
        if (fechaInicio) {
            const fechaInicioDate = new Date(fechaInicio);
            filteredHistorial = filteredHistorial.filter(item => {
                if (!item.fecha_hora) return false;
                return new Date(item.fecha_hora) >= fechaInicioDate;
            });
        }
        
        if (fechaFin) {
            const fechaFinDate = new Date(fechaFin);
            fechaFinDate.setHours(23, 59, 59);
            filteredHistorial = filteredHistorial.filter(item => {
                if (!item.fecha_hora) return false;
                return new Date(item.fecha_hora) <= fechaFinDate;
            });
        }
        
        // ============================================
        // CREAR ARCHIVO EXCEL
        // ============================================
        
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Inventario';
        workbook.lastModifiedBy = 'Sistema';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        // Definir estilos
        const titleStyle = {
            font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A66C2' } },
            alignment: { horizontal: 'center', vertical: 'middle' }
        };
        
        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            }
        };
        
        const cellStyle = {
            alignment: { vertical: 'middle', wrapText: true },
            border: {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            }
        };
        
        // ============================================
        // HOJA 1: HISTORIAL GENERAL
        // ============================================
        const wsHistorial = workbook.addWorksheet('Historial General', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });
        
        wsHistorial.addRow(['HISTORIAL GENERAL DE MOVIMIENTOS']);
        wsHistorial.mergeCells('A1:I1');
        wsHistorial.getCell('A1').style = titleStyle;
        wsHistorial.addRow(['']);
        
        const headersHistorial = [
            'ID', 'Acción', 'Fecha', 'Producto', 'N° Serie', 
            'OC N°', 'Factura N°', 'Usuario', 'Detalles'
        ];
        wsHistorial.addRow(headersHistorial);
        
        headersHistorial.forEach((_, colIndex) => {
            const cell = wsHistorial.getCell(2, colIndex + 1);
            Object.assign(cell, headerStyle);
        });
        
        filteredHistorial.forEach(item => {
            wsHistorial.addRow([
                item.id,
                item.accion || 'N/A',
                item.fecha_hora ? new Date(item.fecha_hora).toLocaleString('es-CL') : 'N/A',
                item.producto_nombre || 'N/A',
                item.numero_serie || 'N/A',
                item.oc_numero || 'N/A',
                item.factura_numero || 'N/A',
                item.usuario_nombre || item.usuario_username || 'Sistema',
                (item.detalles || 'N/A').substring(0, 100)
            ]);
        });
        
        wsHistorial.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell(cell => {
                    Object.assign(cell, cellStyle);
                });
            }
        });
        
        wsHistorial.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 25);
        });
        
        // ============================================
        // HOJA 2: BAJAS
        // ============================================
        const wsBajas = workbook.addWorksheet('Bajas', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });
        
        wsBajas.addRow(['REGISTRO DE BAJAS']);
        wsBajas.mergeCells('A1:I1');
        wsBajas.getCell('A1').style = titleStyle;
        wsBajas.addRow(['']);
        
        const headersBajas = [
            'ID', 'Fecha', 'Producto', 'N° Serie', 'Marca', 'Modelo',
            'Motivo', 'Autorizado Por', 'Observaciones'
        ];
        wsBajas.addRow(headersBajas);
        
        headersBajas.forEach((_, colIndex) => {
            const cell = wsBajas.getCell(2, colIndex + 1);
            Object.assign(cell, headerStyle);
        });
        
        bajas.forEach(baja => {
            wsBajas.addRow([
                baja.id,
                baja.fecha_baja ? new Date(baja.fecha_baja).toLocaleString('es-CL') : 'N/A',
                baja.producto_nombre || 'N/A',
                baja.numero_serie || 'N/A',
                baja.producto_marca || 'N/A',
                baja.producto_modelo || 'N/A',
                baja.motivo_baja || 'N/A',
                baja.autorizado_por || 'Sistema',
                (baja.observaciones || 'N/A').substring(0, 100)
            ]);
        });
        
        wsBajas.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell(cell => {
                    Object.assign(cell, cellStyle);
                });
            }
        });
        
        wsBajas.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 25);
        });
        
        // ============================================
        // HOJA 3: DONACIONES
        // ============================================
        const wsDonaciones = workbook.addWorksheet('Donaciones', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });
        
        wsDonaciones.addRow(['REGISTRO DE DONACIONES']);
        wsDonaciones.mergeCells('A1:L1');
        wsDonaciones.getCell('A1').style = titleStyle;
        wsDonaciones.addRow(['']);
        
        const headersDonaciones = [
            'ID', 'Fecha', 'Producto', 'N° Serie', 'Marca', 'Modelo',
            'Beneficiario', 'RUT Beneficiario', 'Dirección', 'Comuna', 
            'Ciudad', 'Observaciones'
        ];
        wsDonaciones.addRow(headersDonaciones);
        
        headersDonaciones.forEach((_, colIndex) => {
            const cell = wsDonaciones.getCell(2, colIndex + 1);
            Object.assign(cell, headerStyle);
        });
        
        donaciones.forEach(donacion => {
            wsDonaciones.addRow([
                donacion.id,
                donacion.fecha_entrega ? new Date(donacion.fecha_entrega).toLocaleString('es-CL') : 'N/A',
                donacion.producto_nombre || 'N/A',
                donacion.numero_serie || 'N/A',
                donacion.producto_marca || 'N/A',
                donacion.producto_modelo || 'N/A',
                donacion.beneficiario || 'N/A',
                donacion.rut_beneficiario || 'N/A',
                donacion.direccion || 'N/A',
                donacion.comuna || 'N/A',
                donacion.ciudad || 'N/A',
                (donacion.observaciones || 'N/A').substring(0, 100)
            ]);
        });
        
        wsDonaciones.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell(cell => {
                    Object.assign(cell, cellStyle);
                });
            }
        });
        
        wsDonaciones.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 25);
        });
        
        // ============================================
        // HOJA 4: RESUMEN ESTADÍSTICO
        // ============================================
        const wsResumen = workbook.addWorksheet('Resumen Estadístico');
        
        wsResumen.addRow(['RESUMEN DEL SISTEMA']);
        wsResumen.mergeCells('A1:B1');
        wsResumen.getCell('A1').style = { font: { bold: true, size: 14 }, alignment: { horizontal: 'center' } };
        
        wsResumen.addRow(['']);
        wsResumen.addRow(['Fecha de generación:', new Date().toLocaleString('es-CL')]);
        wsResumen.addRow(['']);
        
        wsResumen.addRow(['📈 MOVIMIENTOS']);
        wsResumen.getCell('A4').font = { bold: true, size: 12 };
        wsResumen.addRow(['Total registros en historial:', historial.length]);
        wsResumen.addRow(['Total bajas:', bajas.length]);
        wsResumen.addRow(['Total donaciones:', donaciones.length]);
        wsResumen.addRow(['Total movimientos:', historial.length + bajas.length + donaciones.length]);
        wsResumen.addRow(['']);
        
        // Resumen por acción
        wsResumen.addRow(['📌 TIPOS DE MOVIMIENTOS']);
        wsResumen.getCell('A8').font = { bold: true, size: 12 };
        
        const accionesCount = {};
        historial.forEach(h => {
            const accion = h.accion || 'SIN ACCIÓN';
            accionesCount[accion] = (accionesCount[accion] || 0) + 1;
        });
        
        Object.entries(accionesCount).forEach(([accion, count]) => {
            wsResumen.addRow([`${accion}:`, count]);
        });
        
        wsResumen.getColumn('A').width = 35;
        wsResumen.getColumn('B').width = 20;
        
        // ============================================
        // ENVIAR ARCHIVO
        // ============================================
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        const fechaActual = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const nombreArchivo = `historial_completo_${fechaActual}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Excel generado exitosamente: ${nombreArchivo}`);
        console.log(`   - ${historial.length} registros en historial`);
        console.log(`   - ${bajas.length} bajas`);
        console.log(`   - ${donaciones.length} donaciones`);
        
    } catch (error) {
        console.error('❌ Error exportando a Excel:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error al generar el archivo Excel',
                error: error.message
            });
        }
    }
};

// ============================================
// OBTENER HISTORIAL COMPLETO (para el frontend)
// ============================================
const getHistorialCompleto = async (req, res) => {
    let pool;
    try {
        console.log('📥 GET /api/historial/completo');
        
        pool = await db.getConnection();
        
        // Obtener historial desde tabla historial
        const historialResult = await pool.request().query(`
            SELECT 
                h.id,
                'historial' as origen,
                h.fecha_hora as fecha,
                p.nombre as producto_nombre,
                p.numero_serie,
                h.accion,
                h.detalles as descripcion,
                u.nombre as usuario_responsable,
                h.oc_numero,
                h.factura_numero
            FROM INV.historial h
            LEFT JOIN INV.productos p ON h.producto_id = p.id
            LEFT JOIN INV.usuarios u ON h.usuario_id = u.id
            ORDER BY h.fecha_hora DESC
        `);
        
        const historial = historialResult.recordset || [];
        
        // Obtener bajas
        const bajasResult = await pool.request().query(`
            SELECT 
                b.id,
                'baja' as origen,
                b.fecha_baja as fecha,
                p.nombre as producto_nombre,
                p.numero_serie,
                'BAJA' as accion,
                b.motivo_baja as descripcion,
                b.autorizado_por as usuario_responsable,
                b.observaciones
            FROM INV.disposicion_baja b
            LEFT JOIN INV.productos p ON b.producto_id = p.id
            ORDER BY b.fecha_baja DESC
        `);
        
        const bajas = bajasResult.recordset || [];
        
        // Obtener donaciones
        const donacionesResult = await pool.request().query(`
            SELECT 
                d.id,
                'donacion' as origen,
                d.fecha_entrega as fecha,
                p.nombre as producto_nombre,
                p.numero_serie,
                'DONACION' as accion,
                d.beneficiario as descripcion,
                u.nombre as usuario_responsable,
                d.direccion,
                d.observaciones
            FROM INV.disposicion_donacion d
            LEFT JOIN INV.productos p ON d.producto_id = p.id
            LEFT JOIN INV.usuarios u ON d.usuario_id = u.id
            ORDER BY d.fecha_entrega DESC
        `);
        
        const donaciones = donacionesResult.recordset || [];
        
        // Combinar todos
        const completo = [...historial, ...bajas, ...donaciones];
        completo.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        console.log(`✅ ${completo.length} registros de historial encontrados`);
        
        res.json({
            success: true,
            data: {
                completo: completo,
                asignaciones: historial.filter(h => h.accion === 'ASIGNACION' || h.accion === 'ASIGNACIÓN'),
                bajas: bajas,
                donaciones: donaciones,
                productos: []
            }
        });
        
    } catch (error) {
        console.error('❌ Error en getHistorialCompleto:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {
                completo: [],
                asignaciones: [],
                bajas: [],
                donaciones: [],
                productos: []
            }
        });
    }
};

// ============================================
// ENDPOINTS
// ============================================

router.get('/', authenticateToken, getHistorialCompleto);
router.get('/export', authenticateToken, exportarExcel);
router.get('/exportar/excel', authenticateToken, exportarExcel);
router.get('/completo', authenticateToken, getHistorialCompleto);

console.log('✅ historialRoutes.js configurado correctamente');

module.exports = router;