// backend/routes/productoRoutes.js - VERSIÓN COMPLETA CON ENDPOINT CON-ASIGNACION
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const productoController = require('../controllers/productoController');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Mapa de estados (id_estado_equipo)
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5,
    BAJA: 6
};

// Mapa inverso para convertir texto a ID
const ESTADO_TEXTO_A_ID = {
    'DISPONIBLE': 1,
    'ASIGNADO': 2,
    'EN MANTENCIÓN': 3,
    'EN REPARACIÓN': 4,
    'NO DISPONIBLE': 5,
    'BAJA': 6
};

// Función para convertir id_estado_equipo a texto
function getEstadoTexto(idEstado) {
    const map = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE',
        6: 'BAJA'
    };
    return map[idEstado] || 'DISPONIBLE';
}

// ============================================
// RUTAS ESPECÍFICAS (DEBEN IR PRIMERO)
// ============================================

// RUTAS DE MANTENCIONES
router.get('/mantenciones/todas', productoController.getAllMantenciones);
router.post('/mantencion/iniciar', productoController.iniciarMantencion);
router.post('/mantencion/finalizar', productoController.finalizarMantencion);
router.post('/mantencion/finalizar/:id', productoController.finalizarMantencion);
router.put('/mantencion/finalizar/:id', productoController.finalizarMantencion);
router.put('/mantencion/:id', productoController.updateMantencion);
router.delete('/mantencion/:id', productoController.deleteMantencion);
router.get('/:id/mantenciones', productoController.getHistorialMantenciones);

// GET - Generar PDF Ficha Técnica QR Protegido con Contraseña Ofilab2026*
const handleGenerateQRPdf = async (req, res) => {
    try {
        const { id, serie } = req.query;
        if (!id && !serie) {
            return res.status(400).send('ID o Número de serie requerido');
        }

        const pool = await getConnection();
        let query = `
            SELECT TOP 1
                p.id, p.nombre, p.numero_serie, p.marca, p.modelo, p.precio,
                p.descripcion, p.id_estado_equipo, p.condicion,
                c.id as colaborador_id, c.nombre as colab_nombre, c.email as colab_email,
                c.rut as colab_rut, c.cargo as colab_cargo, c.empresa as colab_empresa, c.departamento as colab_depto
            FROM INV.productos p
            LEFT JOIN INV.asignaciones a ON a.producto_id = p.id AND a.fecha_devolucion IS NULL
            LEFT JOIN INV.colaboradores c ON c.id = a.colaborador_id
            WHERE 1=1
        `;

        const request = pool.request();
        if (id) {
            query += ` AND p.id = @id`;
            request.input('id', sql.Int, parseInt(id));
        } else if (serie) {
            query += ` AND (p.numero_serie = @serie OR LOWER(p.numero_serie) = LOWER(@serie))`;
            request.input('serie', sql.NVarChar, serie);
        }

        const result = await request.query(query);
        if (result.recordset.length === 0) {
            return res.status(404).send('Equipo no encontrado');
        }

        const producto = result.recordset[0];
        const estadoTexto = getEstadoTexto(producto.id_estado_equipo);

        // Crear PDF en PDFKit con clave de seguridad protegida
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            userPassword: 'Ofilab2026*',
            ownerPassword: 'Ofilab2026*',
            permissions: {
                printing: 'highResolution',
                modifying: false,
                copying: false
            }
        });

        const filename = `Ficha_Tecnica_${(producto.numero_serie || 'EQUIPO').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // 1. Logo Ofilab
        let logoPath = path.join(__dirname, '../../public/Logo_transparente.png');
        if (!fs.existsSync(logoPath)) {
            logoPath = path.join(__dirname, '../public/Logo_transparente.png');
        }
        if (!fs.existsSync(logoPath)) {
            logoPath = path.join(process.cwd(), 'public/Logo_transparente.png');
        }

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 32, { width: 140 });
        }

        // 2. Encabezado Derecho
        doc.fillColor('#1E293B')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('FICHA TÉCNICA DE EQUIPO', 200, 32, { align: 'right' });
        
        doc.fillColor('#64748B')
           .fontSize(9)
           .font('Helvetica')
           .text('Sistema de Inventario TI - Ofilab', 200, 54, { align: 'right' });

        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 200, 68, { align: 'right' });

        // Línea divisora superior
        doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#CBD5E1').lineWidth(1.5).stroke();

        // 3. Banner Principal del Equipo
        doc.rect(40, 105, 515, 60).fill('#F8FAFC').stroke('#E2E8F0');

        doc.fillColor('#0F172A')
           .fontSize(15)
           .font('Helvetica-Bold')
           .text(producto.nombre || 'Equipo Informático', 55, 116);

        doc.fillColor('#475569')
           .fontSize(10)
           .font('Helvetica')
           .text(`${producto.marca || ''} ${producto.modelo ? '- ' + producto.modelo : ''}`, 55, 138);

        // Badge Estado
        const badgeColor = estadoTexto === 'DISPONIBLE' ? '#10B981' : (estadoTexto === 'ASIGNADO' ? '#2563EB' : '#F59E0B');
        doc.rect(420, 120, 120, 26).fill(badgeColor);
        doc.fillColor('#FFFFFF')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(estadoTexto, 420, 128, { width: 120, align: 'center' });

        // 4. Sección 1: Datos del Hardware
        doc.fillColor('#1E3A8A')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('1. INFORMACIÓN GENERAL DEL EQUIPO', 40, 185);
        
        doc.moveTo(40, 200).lineTo(555, 200).strokeColor('#1E3A8A').lineWidth(1).stroke();

        const hardwareData = [
            ['Número de Serie:', producto.numero_serie || 'N/A'],
            ['Marca:', producto.marca || 'N/A'],
            ['Modelo:', producto.modelo || 'N/A'],
            ['Condición / Estado:', producto.condicion || 'Bueno'],
            ['ID Registro:', `#${producto.id}`]
        ];

        let yPos = 210;
        hardwareData.forEach(([label, val], idx) => {
            const bg = idx % 2 === 0 ? '#F1F5F9' : '#FFFFFF';
            doc.rect(40, yPos, 515, 22).fill(bg);

            doc.fillColor('#334155').fontSize(9.5).font('Helvetica-Bold').text(label, 50, yPos + 6);
            doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica').text(String(val), 200, yPos + 6);
            yPos += 22;
        });

        // 5. Sección 2: Asignación y Colaborador Responsable
        yPos += 15;
        doc.fillColor('#1E3A8A')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('2. RESPONSABLE Y ASIGNACIÓN ACTUAL', 40, yPos);
        
        yPos += 15;
        doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#1E3A8A').lineWidth(1).stroke();

        yPos += 10;
        const colabNombre = producto.colab_nombre || 'Sin Asignar (En Bodega)';
        const colabRut = producto.colab_rut || 'N/A';
        const colabEmpresa = producto.colab_empresa || 'Ofimundo';
        const colabCargo = producto.colab_cargo || 'N/A';
        const colabDepto = producto.colab_depto || 'N/A';

        const colabData = [
            ['Asignado a:', colabNombre],
            ['RUT Colaborador:', colabRut],
            ['Empresa:', colabEmpresa],
            ['Cargo / Función:', colabCargo],
            ['Departamento:', colabDepto]
        ];

        colabData.forEach(([label, val], idx) => {
            const bg = idx % 2 === 0 ? '#F1F5F9' : '#FFFFFF';
            doc.rect(40, yPos, 515, 22).fill(bg);

            doc.fillColor('#334155').fontSize(9.5).font('Helvetica-Bold').text(label, 50, yPos + 6);
            doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica').text(String(val), 200, yPos + 6);
            yPos += 22;
        });

        // 6. Sección 3: Autenticidad & Código QR
        yPos += 15;
        doc.fillColor('#1E3A8A')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('3. VERIFICACIÓN Y CONTROL DE SEGURIDAD', 40, yPos);
        
        yPos += 15;
        doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#1E3A8A').lineWidth(1).stroke();

        yPos += 10;
        const hostHeader = req.get('host') || 'localhost:5173';
        const qrUrl = `${req.protocol}://${hostHeader}/qr-info?serie=${encodeURIComponent(producto.numero_serie || '')}`;
        const qrImageData = await QRCode.toDataURL(qrUrl, { margin: 1, width: 120 });
        doc.image(qrImageData, 45, yPos, { width: 85 });

        doc.fillColor('#334155').fontSize(9).font('Helvetica')
           .text('Este documento en PDF corresponde a la Ficha Técnica oficial del activo TI registrado en el sistema Ofilab.', 145, yPos + 10, { width: 390 })
           .text('Documento cifrado con protección PDF de clave institucional.', 145, yPos + 35, { width: 390 });

        // 7. Pie de Página Institucional
        doc.rect(40, 770, 515, 30).fill('#0F172A');
        doc.fillColor('#FFFFFF')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Ofilab SpA - Control de Activos & Gestión de Inventario TI', 40, 780, { width: 515, align: 'center' });

        doc.end();

    } catch (error) {
        console.error('❌ Error generando PDF QR:', error);
        res.status(500).send('Error interno al generar el archivo PDF');
    }
};

router.get('/qr-pdf', handleGenerateQRPdf);
router.get('/public/qr-pdf', handleGenerateQRPdf);

// GET - Obtener marcas
router.get('/marcas', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`SELECT DISTINCT marca FROM INV.productos WHERE marca IS NOT NULL AND marca != '' AND (id_estado_equipo IS NULL OR id_estado_equipo != 6) ORDER BY marca`);
        res.json({ success: true, data: result.recordset.map(r => r.marca) });
    } catch (error) {
        console.error('❌ Error en /marcas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener estadísticas
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 GET /api/productos/stats');

        const pool = await getConnection();

        const statsResult = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as totalProductos,
                    ISNULL(SUM(precio), 0) as valorTotal,
                    ISNULL(AVG(precio), 0) as precioPromedio,
                    COUNT(CASE WHEN id_estado_equipo = 1 THEN 1 END) as disponibles,
                    COUNT(CASE WHEN id_estado_equipo = 2 THEN 1 END) as asignados,
                    COUNT(CASE WHEN id_estado_equipo = 3 THEN 1 END) as enMantencion,
                    COUNT(CASE WHEN id_estado_equipo = 4 THEN 1 END) as enReparacion,
                    COUNT(CASE WHEN id_estado_equipo = 5 THEN 1 END) as noDisponibles
                FROM INV.productos
                WHERE id_estado_equipo IS NULL OR id_estado_equipo != 6
            `);

        const bajasCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.disposicion_baja`);

        const donacionesCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.disposicion_donacion`);

        const laboratorioCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.disposicion_laboratorio`);

        const prestamosCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.asignaciones WHERE es_prestamo = 1 AND fecha_devolucion IS NULL`);

        const stats = statsResult.recordset[0] || {};
        stats.totalProductos = stats.totalProductos || 0;
        stats.valorTotal = stats.valorTotal || 0;
        stats.precioPromedio = stats.precioPromedio || 0;
        stats.disponibles = stats.disponibles || 0;
        stats.asignados = stats.asignados || 0;
        stats.enMantencion = stats.enMantencion || 0;
        stats.enReparacion = stats.enReparacion || 0;
        stats.noDisponibles = stats.noDisponibles || 0;
        stats.dadosDeBaja = bajasCount.recordset[0]?.total || 0;
        stats.donados = donacionesCount.recordset[0]?.total || 0;
        stats.enviadosLaboratorio = laboratorioCount.recordset[0]?.total || 0;
        stats.prestamosActivos = prestamosCount.recordset[0]?.total || 0;

        res.json({ success: true, data: stats });

    } catch (error) {
        console.error('❌ Error en stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener historial de disposiciones
router.get('/disposiciones', async (req, res) => {
    try {
        console.log('📊 GET /api/productos/disposiciones');

        const pool = await getConnection();

        const bajasResult = await pool.request()
            .query(`
                SELECT 
                    db.id, db.producto_id, 
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    db.motivo_baja,
                    db.fecha_baja,
                    db.autorizado_por,
                    db.observaciones,
                    'BAJA' as tipo
                FROM INV.disposicion_baja db
                INNER JOIN INV.productos p ON db.producto_id = p.id
                ORDER BY db.fecha_baja DESC
            `);

        const donacionesResult = await pool.request()
            .query(`
                SELECT 
                    dd.id, dd.producto_id,
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    dd.beneficiario,
                    dd.direccion,
                    dd.fecha_entrega as fecha_donacion,
                    dd.observaciones,
                    'DONACION' as tipo
                FROM INV.disposicion_donacion dd
                INNER JOIN INV.productos p ON dd.producto_id = p.id
                ORDER BY dd.fecha_entrega DESC
            `);

        const laboratorioResult = await pool.request()
            .query(`
                SELECT 
                    dl.id, dl.producto_id,
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    dl.laboratorio_nombre,
                    dl.contacto,
                    dl.autorizado_por,
                    dl.motivo,
                    dl.fecha_envio,
                    dl.descripcion,
                    dl.observaciones,
                    'LABORATORIO' as tipo
                FROM INV.disposicion_laboratorio dl
                INNER JOIN INV.productos p ON dl.producto_id = p.id
                ORDER BY dl.fecha_envio DESC
            `);

        res.json({
            success: true,
            data: {
                bajas: bajasResult.recordset,
                donaciones: donacionesResult.recordset,
                laboratorio: laboratorioResult.recordset
            }
        });

    } catch (error) {
        console.error('❌ Error en disposiciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener productos con asignación activa (NUEVO ENDPOINT)
router.get('/con-asignacion', async (req, res) => {
    try {
        console.log('📥 GET /api/productos/con-asignacion');
        
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                p.id,
                p.nombre,
                p.marca,
                p.modelo,
                p.numero_serie,
                p.condicion,
                p.id_estado_equipo,
                a.id as asignacion_id,
                a.colaborador_id,
                a.fecha_asignacion,
                a.es_prestamo,
                c.nombre as colaborador_nombre,
                c.rut as colaborador_rut,
                c.email as colaborador_email,
                c.cargo as colaborador_cargo,
                c.departamento as colaborador_departamento,
                c.direccion as colaborador_direccion
            FROM INV.productos p
            LEFT JOIN INV.asignaciones a ON p.id = a.producto_id AND a.fecha_devolucion IS NULL
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE p.id_estado_equipo IS NULL OR p.id_estado_equipo != 6
            ORDER BY p.nombre
        `);
        
        console.log(`✅ ${result.recordset.length} productos con asignación activa cargados`);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en /con-asignacion:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// GET - Obtener productos por bodega
router.get('/bodega/:bodegaId', async (req, res) => {
    try {
        const { bodegaId } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('bodega_id', sql.Int, bodegaId)
            .query(`
                SELECT 
                    p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                    p.precio, p.id_estado_equipo, p.condicion,
                    p.bodega_id,
                    b.nombre as bodega_nombre
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                WHERE p.bodega_id = @bodega_id AND (p.id_estado_equipo IS NULL OR p.id_estado_equipo != 6)
                ORDER BY p.nombre
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - REGISTRAR BAJA
router.post('/baja', async (req, res) => {
    try {
        console.log('📥 POST /api/productos/baja');
        console.log('Body:', req.body);

        const { producto_id, motivo_baja, autorizado_por, observaciones } = req.body;

        if (!producto_id || !motivo_baja) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: producto_id y motivo_baja'
            });
        }

        const pool = await getConnection();

        const productoInfo = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`
                SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo, bodega_id
                FROM INV.productos WHERE id = @id
            `);

        if (productoInfo.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const producto = productoInfo.recordset[0];

        if (producto.id_estado_equipo === ESTADOS.BAJA) {
            return res.status(400).json({ success: false, message: 'El producto ya está dado de baja' });
        }

        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('motivo_baja', sql.NVarChar, motivo_baja)
            .input('fecha_baja', sql.DateTime, new Date())
            .input('autorizado_por', sql.NVarChar, autorizado_por || 'Sistema')
            .input('observaciones', sql.NVarChar, observaciones || '')
            .query(`
                INSERT INTO INV.disposicion_baja (
                    producto_id, motivo_baja, fecha_baja, autorizado_por, observaciones
                ) VALUES (
                    @producto_id, @motivo_baja, @fecha_baja, @autorizado_por, @observaciones
                )
            `);

        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, ESTADOS.BAJA)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);

        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('accion', sql.NVarChar, 'BAJA')
            .input('detalles', sql.NVarChar, `Producto dado de baja. Motivo: ${motivo_baja}`)
            .input('fecha_hora', sql.DateTime, new Date())
            .query(`
                INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                VALUES (@producto_id, @accion, @detalles, @fecha_hora)
            `);

        console.log(`✅ Producto ${producto_id} dado de baja exitosamente`);

        res.json({
            success: true,
            message: 'Producto dado de baja exitosamente',
            data: producto
        });

    } catch (error) {
        console.error('❌ Error en /baja:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - REGISTRAR DONACIÓN
router.post('/donar', async (req, res) => {
    try {
        console.log('📥 POST /api/productos/donar');
        console.log('Body:', req.body);

        const { producto_id, beneficiario, direccion, observaciones } = req.body;

        if (!producto_id || !beneficiario) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: producto_id y beneficiario'
            });
        }

        const pool = await getConnection();

        const productoInfo = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`
                SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo, bodega_id
                FROM INV.productos WHERE id = @id
            `);

        if (productoInfo.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const producto = productoInfo.recordset[0];

        if (producto.id_estado_equipo === ESTADOS.BAJA) {
            return res.status(400).json({ success: false, message: 'El producto ya está dado de baja' });
        }

        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('beneficiario', sql.NVarChar, beneficiario)
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_entrega', sql.DateTime, new Date())
            .input('observaciones', sql.NVarChar, observaciones || '')
            .query(`
                INSERT INTO INV.disposicion_donacion (
                    producto_id, beneficiario, direccion, fecha_entrega, observaciones
                ) VALUES (
                    @producto_id, @beneficiario, @direccion, @fecha_entrega, @observaciones
                )
            `);

        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, ESTADOS.BAJA)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);

        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('accion', sql.NVarChar, 'DONACION')
            .input('detalles', sql.NVarChar, `Producto donado a: ${beneficiario}`)
            .input('fecha_hora', sql.DateTime, new Date())
            .query(`
                INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                VALUES (@producto_id, @accion, @detalles, @fecha_hora)
            `);

        console.log(`✅ Producto ${producto_id} donado exitosamente`);

        res.json({
            success: true,
            message: 'Producto donado exitosamente',
            data: producto
        });

    } catch (error) {
        console.error('❌ Error en /donar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - REGISTRAR ENVÍO A LABORATORIO
router.post('/disposicion/laboratorio', productoController.registrarLaboratorio);

// ============================================
// MÉTODOS DE MANTENCIÓN
// ============================================

// POST - Iniciar mantención
router.post('/mantencion/iniciar', async (req, res) => {
    try {
        const { producto_id, tipo, fecha_inicio, responsable, descripcion, costo } = req.body;

        console.log('📥 POST /api/productos/mantencion/iniciar');

        if (!producto_id || !responsable || !descripcion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        const pool = await getConnection();

        const productoCheck = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`SELECT id, nombre, id_estado_equipo FROM INV.productos WHERE id = @id`);

        if (productoCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const mantencionActiva = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`
                SELECT id FROM INV.mantenciones 
                WHERE producto_id = @producto_id AND fecha_fin IS NULL
            `);

        if (mantencionActiva.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'El producto ya tiene una mantención activa' });
        }

        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('tipo', sql.NVarChar, tipo || 'RUTINA')
            .input('fecha_inicio', sql.DateTime, fecha_inicio || new Date())
            .input('responsable', sql.NVarChar, responsable)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('costo', sql.Decimal(18, 2), costo || 0)
            .query(`
                INSERT INTO INV.mantenciones (producto_id, tipo, fecha_inicio, responsable, descripcion, costo)
                VALUES (@producto_id, @tipo, @fecha_inicio, @responsable, @descripcion, @costo)
            `);

        const nuevoEstado = tipo === 'REPARACION' ? 4 : 3;
        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, nuevoEstado)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);

        res.json({ success: true, message: 'Mantención iniciada correctamente' });

    } catch (error) {
        console.error('Error en /mantencion/iniciar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Finalizar mantención
router.post('/mantencion/finalizar', async (req, res) => {
    try {
        const { producto_id, fecha_fin, observaciones } = req.body;

        console.log('📥 POST /api/productos/mantencion/finalizar');

        if (!producto_id || !fecha_fin) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        const pool = await getConnection();

        const mantencionActiva = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`
                SELECT TOP 1 id, descripcion as descripcion_actual
                FROM INV.mantenciones 
                WHERE producto_id = @producto_id AND fecha_fin IS NULL
                ORDER BY fecha_inicio DESC
            `);

        if (mantencionActiva.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay una mantención activa para este producto' });
        }

        const mantencionId = mantencionActiva.recordset[0].id;
        const descripcionActual = mantencionActiva.recordset[0].descripcion_actual || '';

        let nuevaDescripcion = descripcionActual;
        if (observaciones && observaciones.trim() !== '') {
            nuevaDescripcion = descripcionActual + ' [FINALIZACIÓN: ' + observaciones.trim() + ']';
        }

        await pool.request()
            .input('id', sql.Int, mantencionId)
            .input('fecha_fin', sql.DateTime, fecha_fin)
            .input('descripcion', sql.NVarChar, nuevaDescripcion)
            .query(`
                UPDATE INV.mantenciones 
                SET fecha_fin = @fecha_fin, descripcion = @descripcion
                WHERE id = @id
            `);

        await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`UPDATE INV.productos SET id_estado_equipo = 1 WHERE id = @id`);

        res.json({ success: true, message: 'Mantención finalizada correctamente' });

    } catch (error) {
        console.error('Error en /mantencion/finalizar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener historial de mantenciones de un producto
router.get('/:productoId/mantenciones', async (req, res) => {
    try {
        const { productoId } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('producto_id', sql.Int, productoId)
            .query(`
                SELECT id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo
                FROM INV.mantenciones
                WHERE producto_id = @producto_id
                ORDER BY fecha_inicio DESC
            `);

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Generar PDF Ficha Técnica de Equipo con Logo OFILAB
router.get('/:id/ficha-pdf', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    p.id, p.nombre, p.marca, p.modelo, p.numero_serie, p.condicion,
                    b.nombre as bodega_nombre,
                    ee.nombre_estado as estado,
                    c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.cargo as colaborador_cargo, c.email as colaborador_email
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                LEFT JOIN INV.estados_equipo ee ON p.id_estado_equipo = ee.id
                LEFT JOIN (
                    SELECT a.producto_id, c.nombre, c.rut, c.cargo, c.email
                    FROM INV.asignaciones a
                    INNER JOIN INV.colaboradores c ON a.colaborador_id = c.id
                    WHERE a.fecha_devolucion IS NULL
                ) c ON p.id = c.producto_id
                WHERE p.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const prod = result.recordset[0];
        const colaborador = prod.colaborador_nombre 
            ? `${prod.colaborador_nombre} ${prod.colaborador_rut ? `(RUT: ${prod.colaborador_rut})` : ''}`
            : 'Sin Asignar (En Bodega)';

        // Generar Buffer del QR Code
        const qrText = `FICHA DE EQUIPO - OFILAB\n-------------------------\n• Equipo: ${prod.nombre || 'N/A'}\n• N° Serie: ${prod.numero_serie || 'N/A'}\n• Asignado a: ${colaborador}\n• Marca: ${prod.marca || 'N/A'}\n• Modelo: ${prod.modelo || 'N/A'}\n• Estado: ${prod.estado || 'DISPONIBLE'}`;
        
        const qrPngBuffer = await QRCode.toBuffer(qrText, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 200
        });

        const doc = new PDFDocument({ margin: 40, size: 'LETTER' });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Ficha_OFILAB_${prod.numero_serie || prod.id}.pdf"`);
            res.send(pdfBuffer);
        });

        // 1. LOGO DE OFILAB EN ENCABEZADO
        const logoPath = path.join(__dirname, '../assets/logo-ofilab.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 35, { width: 150 });
        } else {
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#2A3284').text('OFILAB', 40, 35);
        }

        // Título a la derecha del logo
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#70317A').text('FICHA TÉCNICA DE EQUIPO', 250, 45, { align: 'right' });
        doc.fontSize(9).font('Helvetica').fillColor('#666666').text('CONTROL DE INVENTARIO Y ASIGNACIÓN DE TI', 250, 62, { align: 'right' });

        // Línea degradada/separadora
        const headerLineY = 95;
        doc.rect(40, headerLineY, doc.page.width - 80, 3).fill('#70317A');

        // 2. SECCIÓN PRINCIPAL: QR A LA IZQUIERDA, DATOS A LA DERECHA
        const contentStartY = headerLineY + 25;

        // Cuadro del Código QR
        doc.rect(40, contentStartY, 170, 190).fillAndStroke('#F9FAFB', '#E5E7EB');
        doc.image(qrPngBuffer, 50, contentStartY + 10, { width: 150 });
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#6B7280').text('ESCANEAR CON CELULAR', 40, contentStartY + 168, { width: 170, align: 'center' });

        // Información a la derecha
        const textX = 230;
        let currentY = contentStartY;

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#111827').text(prod.nombre || 'Equipo', textX, currentY, { width: 330 });
        currentY += 28;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('N° DE SERIE:', textX, currentY);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E40AF').text(prod.numero_serie || 'N/A', textX + 80, currentY);
        currentY += 20;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('MARCA:', textX, currentY);
        doc.fontSize(10).font('Helvetica').fillColor('#111827').text(prod.marca || 'N/A', textX + 80, currentY);
        currentY += 18;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('MODELO:', textX, currentY);
        doc.fontSize(10).font('Helvetica').fillColor('#111827').text(prod.modelo || 'N/A', textX + 80, currentY);
        currentY += 18;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('CONDICIÓN:', textX, currentY);
        doc.fontSize(10).font('Helvetica').fillColor('#111827').text(prod.condicion || 'NUEVO', textX + 80, currentY);
        currentY += 18;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('BODEGA:', textX, currentY);
        doc.fontSize(10).font('Helvetica').fillColor('#111827').text(prod.bodega_nombre || 'Sin bodega', textX + 80, currentY);
        currentY += 18;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6B7280').text('ESTADO:', textX, currentY);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(prod.estado === 'DISPONIBLE' ? '#059669' : '#1D4ED8').text(prod.estado || 'DISPONIBLE', textX + 80, currentY);

        // 3. TARJETA DE ASIGNACIÓN
        const asigY = contentStartY + 210;
        doc.rect(40, asigY, doc.page.width - 80, 90).fillAndStroke('#F3F4F6', '#D1D5DB');

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#2A3284').text('INFORMACIÓN DE ASIGNACIÓN Y RESPONSABLE', 55, asigY + 12);
        doc.rect(55, asigY + 28, doc.page.width - 110, 1).fill('#CBD5E1');

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('Asignado a:', 55, asigY + 38);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text(prod.colaborador_nombre || 'Sin Asignar (Disponible en Bodega)', 135, asigY + 38);

        if (prod.colaborador_rut) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('RUT:', 55, asigY + 56);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(prod.colaborador_rut, 135, asigY + 56);
        }

        if (prod.colaborador_cargo) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('Cargo:', 280, asigY + 56);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(prod.colaborador_cargo, 335, asigY + 56);
        }

        if (prod.colaborador_email) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('Email:', 55, asigY + 72);
            doc.fontSize(10).font('Helvetica').fillColor('#334155').text(prod.colaborador_email, 135, asigY + 72);
        }

        // 4. PIE DE PÁGINA
        const footerY = doc.page.height - 60;
        doc.rect(40, footerY - 10, doc.page.width - 80, 1).fill('#E2E8F0');
        doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('OFILAB - Control de Equipos TI | Documento generado automáticamente', 40, footerY, { align: 'center' });
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94A3B8').text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')} - ${new Date().toLocaleTimeString('es-CL')}`, 40, footerY + 12, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generando PDF de ficha:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// RUTA DE ASIGNACIÓN Y ENTREGA A GRANEL
// ============================================

// POST - Asignar producto a colaborador
router.post('/:id/asignar', productoController.asignarProducto);

// POST - Descontar stock a granel (entrega sin acta)
router.post('/:id/descontar-stock', productoController.descontarStock);

// ============================================
// RUTA DE PRUEBA - DIAGNÓSTICO
// ============================================

router.get('/test-db', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const testResult = await pool.request().query('SELECT GETDATE() as fecha_hora, DB_NAME() as base_datos');
        const countResult = await pool.request().query('SELECT COUNT(*) as total FROM INV.productos');
        const productosResult = await pool.request().query('SELECT TOP 5 id, nombre, numero_serie, id_estado_equipo FROM INV.productos ORDER BY id DESC');
        
        res.json({
            success: true,
            message: 'Diagnóstico completado',
            data: {
                conexion: {
                    fecha_hora: testResult.recordset[0]?.fecha_hora,
                    base_datos: testResult.recordset[0]?.base_datos
                },
                total_productos: countResult.recordset[0]?.total || 0,
                productos: productosResult.recordset
            }
        });
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        res.status(500).json({ success: false, message: error.message, error: error.toString() });
    }
});

// ============================================
// RUTA PRINCIPAL - GET PRODUCTOS
// ============================================

// GET - Listar todos los productos
router.get('/', async (req, res) => {
    try {
        console.log('📥 GET /api/productos');
        console.log('📥 Query params:', req.query);

        const { search, marca, estado, condicion, bodega_id } = req.query;

        const pool = await getConnection();

        // Sincronizar automáticamente productos con asignación activa a estado ASIGNADO (2)
        try {
            await pool.request().query(`
                UPDATE INV.productos
                SET id_estado_equipo = 2
                WHERE id IN (
                    SELECT producto_id 
                    FROM INV.asignaciones 
                    WHERE (fecha_devolucion IS NULL OR fecha_devolucion = '')
                ) AND (id_estado_equipo = 1 OR id_estado_equipo IS NULL);
            `);
        } catch (syncErr) {
            console.warn('⚠️ Advertencia al sincronizar estados asignados:', syncErr.message);
        }

        let query = `
            SELECT 
                p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                p.precio, p.oc_numero, p.factura_numero, p.descripcion,
                p.id_estado_equipo, p.imagen_path, p.fecha_creacion,
                ISNULL(p.condicion, 'NUEVO') as condicion,
                p.bodega_id,
                ISNULL(p.cantidad, 1) as cantidad,
                ISNULL(p.es_granel, 0) as es_granel,
                (
                    SELECT ISNULL(SUM(
                        CASE 
                            WHEN h.detalles LIKE 'Entrega a granel: %' AND CHARINDEX('unidad', h.detalles) > 18 
                            THEN ISNULL(TRY_CAST(SUBSTRING(h.detalles, 19, CHARINDEX('unidad', h.detalles) - 19) AS INT), 1)
                            WHEN h.accion IN ('ENTREGA_GRANEL', 'DESCUENTO_STOCK', 'DESCUENTO', 'ASIGNACION', 'PRÉSTAMO', 'ENTREGA')
                            THEN 1
                            ELSE 0 
                        END
                    ), 0)
                    FROM INV.historial h
                    WHERE h.producto_id = p.id
                ) as total_utilizado,
                b.nombre as bodega_nombre,
                a.id as asignacion_id,
                a.es_prestamo,
                a.motivo as asignacion_motivo,
                c.id as colaborador_id,
                c.nombre as colaborador_nombre,
                c.email as colaborador_email,
                c.rut as colaborador_rut,
                c.cargo as colaborador_cargo,
                c.departamento as colaborador_departamento,
                c.empresa as colaborador_empresa
            FROM INV.productos p
            LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
            LEFT JOIN INV.asignaciones a ON p.id = a.producto_id AND (a.fecha_devolucion IS NULL OR a.fecha_devolucion = '')
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE 1=1
                AND (p.id_estado_equipo IS NULL OR p.id_estado_equipo NOT IN (6))
        `;

        const request = pool.request();

        if (search && search.trim() !== '') {
            query += ` AND (p.nombre LIKE @search OR p.marca LIKE @search OR p.modelo LIKE @search OR p.numero_serie LIKE @search OR c.nombre LIKE @search OR c.empresa LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search.trim()}%`);
        }

        if (marca && marca !== 'todos' && marca !== '') {
            query += ` AND p.marca = @marca`;
            request.input('marca', sql.NVarChar, marca);
        }

        if (estado && estado !== 'todos' && estado !== '') {
            const estadoId = ESTADO_TEXTO_A_ID[estado];
            if (estadoId) {
                if (estadoId === 2) {
                    query += ` AND (p.id_estado_equipo = 2 OR c.id IS NOT NULL)`;
                } else if (estadoId === 1) {
                    query += ` AND (p.id_estado_equipo = 1 OR p.id_estado_equipo IS NULL) AND c.id IS NULL`;
                } else {
                    query += ` AND p.id_estado_equipo = @estadoId`;
                    request.input('estadoId', sql.Int, estadoId);
                }
            }
        }

        if (condicion && condicion !== 'todos' && condicion !== '') {
            query += ` AND p.condicion = @condicion`;
            request.input('condicion', sql.NVarChar, condicion);
        }

        if (bodega_id && bodega_id !== 'todos' && bodega_id !== '' && !isNaN(parseInt(bodega_id))) {
            query += ` AND p.bodega_id = @bodegaId`;
            request.input('bodegaId', sql.Int, parseInt(bodega_id));
        }

        query += ` ORDER BY p.id DESC`;

        console.log('📝 Ejecutando consulta SQL...');
        const result = await request.query(query);
        console.log(`✅ ${result.recordset.length} productos encontrados`);

        const productos = result.recordset.map(producto => {
            let colaboradorAsignado = null;
            if (producto.colaborador_id) {
                colaboradorAsignado = {
                    id: producto.colaborador_id,
                    nombre: producto.colaborador_nombre,
                    email: producto.colaborador_email,
                    rut: producto.colaborador_rut,
                    cargo: producto.colaborador_cargo,
                    departamento: producto.colaborador_departamento,
                    empresa: producto.colaborador_empresa,
                    es_prestamo: producto.es_prestamo === 1 || producto.es_prestamo === true ? 1 : 0
                };
            }

            let asignacionActiva = null;
            if (producto.asignacion_id) {
                asignacionActiva = {
                    id: producto.asignacion_id,
                    es_prestamo: producto.es_prestamo === 1 || producto.es_prestamo === true ? 1 : 0,
                    fecha_asignacion: producto.fecha_asignacion,
                    fecha_devolucion_esperada: producto.fecha_devolucion_esperada,
                    motivo: producto.asignacion_motivo,
                    colaborador: colaboradorAsignado
                };
            }

            const esPrestamo = 
                (producto.es_prestamo === 1 || producto.es_prestamo === true) ||
                (asignacionActiva?.es_prestamo === 1) ||
                (colaboradorAsignado?.es_prestamo === 1);

            let estadoIdFinal = producto.id_estado_equipo || 1;
            if (colaboradorAsignado && (estadoIdFinal === 1 || !estadoIdFinal)) {
                estadoIdFinal = 2; // ASIGNADO
            }

            return {
                id: producto.id,
                nombre: producto.nombre || 'Sin nombre',
                numero_serie: producto.numero_serie || (producto.es_granel ? 'SIN SERIE (A GRANEL)' : 'N/A'),
                marca: producto.marca || '-',
                modelo: producto.modelo || '-',
                precio: producto.precio || 0,
                oc_numero: producto.oc_numero || '',
                factura_numero: producto.factura_numero || '',
                descripcion: producto.descripcion || '',
                id_estado_equipo: estadoIdFinal,
                imagen_path: producto.imagen_path,
                fecha_creacion: producto.fecha_creacion,
                condicion: producto.condicion || 'NUEVO',
                bodega_id: producto.bodega_id,
                bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                cantidad: producto.cantidad || 1,
                stock: producto.cantidad || 1,
                es_granel: producto.es_granel === 1 || producto.es_granel === true ? 1 : 0,
                total_utilizado: producto.total_utilizado || 0,
                estado: getEstadoTexto(estadoIdFinal),
                colaborador_asignado: colaboradorAsignado,
                asignacion_activa: asignacionActiva,
                es_prestamo: esPrestamo ? 1 : 0
            };
        });

        const prestamos = productos.filter(p => p.es_prestamo === 1);
        console.log(`📊 Préstamos activos detectados: ${prestamos.length}`);

        res.json({ success: true, data: productos });

    } catch (error) {
        console.error('❌ Error en GET /productos:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString(),
            data: []
        });
    }
});

// GET - Obtener producto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);

        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT 
                    p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                    p.precio, p.oc_numero, p.factura_numero,
                    p.descripcion, p.id_estado_equipo, p.imagen_path, 
                    p.fecha_creacion, p.condicion,
                    p.bodega_id,
                    ISNULL(p.cantidad, 1) as cantidad,
                    ISNULL(p.es_granel, 0) as es_granel,
                    b.nombre as bodega_nombre,
                    a.id as asignacion_id,
                    a.es_prestamo,
                    a.fecha_asignacion,
                    a.motivo as asignacion_motivo,
                    c.id as colaborador_id,
                    c.nombre as colaborador_nombre,
                    c.email as colaborador_email,
                    c.rut as colaborador_rut,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                LEFT JOIN INV.asignaciones a ON p.id = a.producto_id AND a.fecha_devolucion IS NULL
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE p.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        const producto = result.recordset[0];

        let colaboradorAsignado = null;
        if (producto.colaborador_id) {
            colaboradorAsignado = {
                id: producto.colaborador_id,
                nombre: producto.colaborador_nombre,
                email: producto.colaborador_email,
                rut: producto.colaborador_rut,
                cargo: producto.colaborador_cargo,
                departamento: producto.colaborador_departamento
            };
        }

        let asignacionActiva = null;
        if (producto.asignacion_id) {
            asignacionActiva = {
                id: producto.asignacion_id,
                es_prestamo: producto.es_prestamo === 1 ? 1 : 0,
                fecha_asignacion: producto.fecha_asignacion,
                motivo: producto.asignacion_motivo,
                colaborador: colaboradorAsignado
            };
        }

        const responseData = {
            id: producto.id,
            nombre: producto.nombre,
            numero_serie: producto.numero_serie,
            marca: producto.marca,
            modelo: producto.modelo,
            precio: producto.precio,
            oc_numero: producto.oc_numero,
            factura_numero: producto.factura_numero,
            descripcion: producto.descripcion,
            id_estado_equipo: producto.id_estado_equipo,
            imagen_path: producto.imagen_path,
            fecha_creacion: producto.fecha_creacion,
            condicion: producto.condicion,
            bodega_id: producto.bodega_id,
            bodega_nombre: producto.bodega_nombre,
            cantidad: producto.cantidad || 1,
            stock: producto.cantidad || 1,
            es_granel: producto.es_granel === 1 || producto.es_granel === true ? 1 : 0,
            estado: getEstadoTexto(producto.id_estado_equipo),
            colaborador_asignado: colaboradorAsignado,
            asignacion_activa: asignacionActiva,
            es_prestamo: producto.es_prestamo === 1 ? 1 : 0
        };

        res.json({ success: true, data: responseData });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Crear producto
router.post('/', async (req, res) => {
    try {
        console.log('📥 POST /api/productos');
        console.log('📥 Body:', req.body);

        const { nombre, precio, oc_numero, factura_numero, descripcion,
            marca, estado, modelo, numero_serie, condicion, bodega_id, cantidad, es_granel } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre requerido' });
        }

        const esGranelVal = (es_granel === true || es_granel === 1 || es_granel === '1') ? 1 : 0;
        let numSerieFinal = (numero_serie || '').trim();

        if (!esGranelVal && !numSerieFinal) {
            return res.status(400).json({ success: false, message: 'Número de serie requerido para productos individuales' });
        }

        if (esGranelVal && !numSerieFinal) {
            numSerieFinal = `GRANEL-${Date.now()}`;
        }

        const pool = await getConnection();

        if (numSerieFinal && !esGranelVal) {
            const existeSerie = await pool.request()
                .input('numero_serie', sql.NVarChar, numSerieFinal)
                .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie');

            if (existeSerie.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'El número de serie ya existe' });
            }
        }

        const estadoId = ESTADO_TEXTO_A_ID[estado] || 1;
        const cantVal = parseInt(cantidad) || (esGranelVal ? 10 : 1);

        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('precio', sql.Decimal(18, 2), parseFloat(precio) || 0)
            .input('oc_numero', sql.NVarChar, oc_numero || '')
            .input('factura_numero', sql.NVarChar, factura_numero || '')
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('marca', sql.NVarChar, marca || '')
            .input('id_estado_equipo', sql.Int, estadoId)
            .input('modelo', sql.NVarChar, modelo || '')
            .input('numero_serie', sql.NVarChar, numSerieFinal)
            .input('condicion', sql.NVarChar, condicion || 'NUEVO')
            .input('bodega_id', sql.Int, bodega_id ? parseInt(bodega_id) : null)
            .input('cantidad', sql.Int, cantVal)
            .input('es_granel', sql.Bit, esGranelVal)
            .query(`
                INSERT INTO INV.productos (
                    nombre, precio, oc_numero, factura_numero, 
                    descripcion, marca, id_estado_equipo, modelo, 
                    numero_serie, condicion, bodega_id, cantidad, es_granel, fecha_creacion
                )
                VALUES (
                    @nombre, @precio, @oc_numero, @factura_numero,
                    @descripcion, @marca, @id_estado_equipo, @modelo, 
                    @numero_serie, @condicion, @bodega_id, @cantidad, @es_granel, GETDATE()
                );
                SELECT SCOPE_IDENTITY() as id;
            `);

        const nuevoId = result.recordset[0].id;

        const productoResult = await pool.request()
            .input('id', sql.Int, nuevoId)
            .query(`
                SELECT p.id, p.nombre, p.precio, p.oc_numero, p.factura_numero,
                       p.descripcion, p.marca, p.id_estado_equipo, p.modelo, 
                       p.numero_serie, p.condicion, p.bodega_id,
                       b.nombre as bodega_nombre
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                WHERE p.id = @id
            `);

        const nuevoProducto = productoResult.recordset[0];
        nuevoProducto.estado = getEstadoTexto(nuevoProducto.id_estado_equipo);
        nuevoProducto.colaborador_asignado = null;
        nuevoProducto.asignacion_activa = null;
        nuevoProducto.es_prestamo = 0;

        res.json({ success: true, message: 'Producto creado', data: nuevoProducto });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Actualizar producto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);

        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const { nombre, precio, oc_numero, factura_numero, descripcion,
            marca, estado, modelo, numero_serie, condicion, bodega_id, cantidad, es_granel } = req.body;

        const estadoId = ESTADO_TEXTO_A_ID[estado] || 1;

        const pool = await getConnection();

        if (numero_serie) {
            const existeSerie = await pool.request()
                .input('numero_serie', sql.NVarChar, numero_serie)
                .input('id', sql.Int, idNum)
                .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie AND id != @id');

            if (existeSerie.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'El número de serie ya existe' });
            }
        }

        const esGranelVal = (es_granel === true || es_granel === 1 || es_granel === '1') ? 1 : 0;
        const cantVal = parseInt(cantidad) !== undefined && !isNaN(parseInt(cantidad)) ? parseInt(cantidad) : 1;

        await pool.request()
            .input('id', sql.Int, idNum)
            .input('nombre', sql.NVarChar, nombre)
            .input('precio', sql.Decimal(18, 2), parseFloat(precio) || 0)
            .input('oc_numero', sql.NVarChar, oc_numero || '')
            .input('factura_numero', sql.NVarChar, factura_numero || '')
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('marca', sql.NVarChar, marca || '')
            .input('id_estado_equipo', sql.Int, estadoId)
            .input('modelo', sql.NVarChar, modelo || '')
            .input('numero_serie', sql.NVarChar, numero_serie || '')
            .input('condicion', sql.NVarChar, condicion || 'NUEVO')
            .input('bodega_id', sql.Int, bodega_id ? parseInt(bodega_id) : null)
            .input('cantidad', sql.Int, cantVal)
            .input('es_granel', sql.Bit, esGranelVal)
            .query(`
                UPDATE INV.productos SET
                    nombre = @nombre,
                    precio = @precio,
                    oc_numero = @oc_numero,
                    factura_numero = @factura_numero,
                    descripcion = @descripcion,
                    marca = @marca,
                    id_estado_equipo = @id_estado_equipo,
                    modelo = @modelo,
                    numero_serie = @numero_serie,
                    condicion = @condicion,
                    bodega_id = @bodega_id,
                    cantidad = @cantidad,
                    es_granel = @es_granel
                WHERE id = @id
            `);

        const productoResult = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT p.id, p.nombre, p.precio, p.oc_numero, p.factura_numero,
                       p.descripcion, p.marca, p.id_estado_equipo, p.modelo, 
                       p.numero_serie, p.condicion, p.bodega_id,
                       b.nombre as bodega_nombre
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                WHERE p.id = @id
            `);

        const productoActualizado = productoResult.recordset[0];
        productoActualizado.estado = getEstadoTexto(productoActualizado.id_estado_equipo);

        res.json({ success: true, message: 'Producto actualizado', data: productoActualizado });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);

        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        const pool = await getConnection();

        const asignaciones = await pool.request()
            .input('producto_id', sql.Int, idNum)
            .query(`SELECT COUNT(*) as total FROM INV.asignaciones WHERE producto_id = @producto_id`);

        if (asignaciones.recordset[0].total > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el producto porque tiene asignaciones registradas'
            });
        }

        await pool.request()
            .input('id', sql.Int, idNum)
            .query(`DELETE FROM INV.productos WHERE id = @id`);

        res.json({ success: true, message: 'Producto eliminado' });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;