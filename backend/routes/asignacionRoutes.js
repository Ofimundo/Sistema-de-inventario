// backend/routes/asignacionRoutes.js - VERSIÓN COMPLETA CORREGIDA
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');

// ============================================
// CONFIGURACIÓN DE DIRECTORIOS
// ============================================
const DOCS_DIR = path.join(__dirname, '../uploads/documentos');
const DOCUMENTOS_FISICOS_DIR = path.join(__dirname, '../uploads/documentos_fisicos');

// Asegurar que los directorios existen
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${DOCS_DIR}`);
}
if (!fs.existsSync(DOCUMENTOS_FISICOS_DIR)) {
    fs.mkdirSync(DOCUMENTOS_FISICOS_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${DOCUMENTOS_FISICOS_DIR}`);
}

console.log(`📁 Directorio de documentos: ${DOCS_DIR}`);
console.log(`📁 El directorio existe: ${fs.existsSync(DOCS_DIR)}`);

// Configurar multer para subida de documentos físicos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, DOCUMENTOS_FISICOS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `doc_${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG, PNG'));
        }
    }
});

// Mapa de estados
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5,
    BAJA: 6
};

// Datos de la empresa
const EMPRESA = {
    nombre: 'LATAM LITE SpA',
    rut: '76.301.299-9',
    representante_legal: 'María Eugenia Navalon',
    cargo_representante: 'Gerente de Tecnología e Innovación',
    domicilio: 'Lota Nº2305, comuna de Providencia',
    email: 'rrpp@latam-lite.cl',
    telefono: '+56 9 1234 5678'
};

// Función para formatear fecha
function formatearFecha(fecha) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaObj = new Date(fecha);
    const dia = fechaObj.getDate();
    const mes = meses[fechaObj.getMonth()];
    const año = fechaObj.getFullYear();
    const horas = fechaObj.getHours().toString().padStart(2, '0');
    const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
    const ampm = fechaObj.getHours() >= 12 ? 'p. m.' : 'a. m.';
    const horas12 = (fechaObj.getHours() % 12) || 12;
    return `${dia} de ${mes} del año ${año} ${horas12}:${minutos} ${ampm}`;
}

// Función para validar ID
function validarId(id, nombre = 'ID') {
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
        throw new Error(`${nombre} inválido. Debe ser un número positivo.`);
    }
    return idNum;
}

// Función para convertir estado a texto
function getEstadoTexto(idEstado) {
    const map = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE',
        6: 'BAJA'
    };
    return map[idEstado] || 'DESCONOCIDO';
}

// ============================================
// FUNCIÓN PARA TRUNCAR TEXTO LARGO
// ============================================
function truncarTexto(texto, maxLength = 500) {
    if (!texto) return '';
    if (typeof texto !== 'string') texto = JSON.stringify(texto);
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength);
}

// ============================================
// FUNCIÓN PARA DIBUJAR FIRMA
// ============================================
function dibujarFirma(doc, firma, x, y, nombrePorDefecto) {
    if (firma && typeof firma === 'string' && firma.startsWith('data:image')) {
        try {
            const base64Data = firma.split(',')[1];
            if (base64Data && base64Data.length > 0) {
                const imgBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imgBuffer, x, y - 40, { width: 150, height: 40, align: 'center' });
                return true;
            }
        } catch (err) {
            console.log('⚠️ Error al dibujar imagen de firma:', err.message);
        }
    } else if (firma && typeof firma === 'string' && firma.trim() && !firma.startsWith('data:')) {
        doc.font('Helvetica').fontSize(9).text(firma, x, y + 5);
        return true;
    }
    doc.font('Helvetica').fontSize(9).text(nombrePorDefecto || '_________________________', x, y + 5);
    return false;
}

// ============================================
// FUNCIÓN PARA GENERAR ACTA DE ASIGNACIÓN
// ============================================
async function generarActaAsignacion(datos) {
    console.log('🔧 generarActaAsignacion llamado con ID:', datos.id_asignacion);
    
    return new Promise((resolve, reject) => {
        try {
            const {
                id_asignacion,
                colaborador,
                productos,
                fecha_asignacion,
                motivo,
                observaciones,
                firma_trabajador,
                es_prestamo
            } = datos;

            if (es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento');
                return resolve(Buffer.from(''));
            }

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`✅ PDF generado: ${pdfBuffer.length} bytes`);
                resolve(pdfBuffer);
            });
            
            doc.on('error', (err) => {
                console.error('❌ Error en PDF:', err);
                reject(err);
            });

            doc.font('Helvetica-Bold').fontSize(18).text(EMPRESA.nombre, { align: 'center' }).moveDown(0.3);
            doc.font('Helvetica').fontSize(10)
               .text(`RUT: ${EMPRESA.rut} | ${EMPRESA.domicilio}`, { align: 'center' })
               .text(`Email: ${EMPRESA.email} - Fono: ${EMPRESA.telefono}`, { align: 'center' })
               .moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').fontSize(16).text('ACTA DE ENTREGA DE EQUIPOS', { align: 'center' }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Fecha: ${formatearFecha(fecha_asignacion)}`, { align: 'left' })
               .text(`ID Asignación: ${id_asignacion}`, { align: 'left' })
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('1. DATOS DE LA EMPRESA', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Razón Social: ${EMPRESA.nombre}`)
               .text(`RUT: ${EMPRESA.rut}`)
               .text(`Representante Legal: ${EMPRESA.representante_legal}`)
               .text(`Cargo: ${EMPRESA.cargo_representante}`)
               .text(`Domicilio: ${EMPRESA.domicilio}`)
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('2. DATOS DEL TRABAJADOR', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Nombre: ${colaborador.nombre || ''}`)
               .text(`RUT: ${colaborador.rut || ''}`)
               .text(`Nacionalidad: ${colaborador.nacionalidad || 'chilena'}`)
               .text(`Fecha Nacimiento: ${colaborador.fecha_nacimiento || ''}`)
               .text(`Profesión/Oficio: ${colaborador.cargo || ''}`)
               .text(`Domicilio: ${colaborador.direccion || EMPRESA.domicilio}`)
               .text(`Email: ${colaborador.email || ''}`)
               .text(`Departamento: ${colaborador.departamento || 'Tecnología e Innovación'}`)
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('3. DATOS DEL EQUIPO ENTREGADO', { underline: true }).moveDown(0.5);

            const colPositions = { num: 40, tipo: 80, marca: 150, modelo: 220, serie: 300, estado: 380, cantidad: 460 };
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(9)
               .text('#', colPositions.num, tableTop)
               .text('TIPO', colPositions.tipo, tableTop)
               .text('MARCA', colPositions.marca, tableTop)
               .text('MODELO', colPositions.modelo, tableTop)
               .text('N° SERIE', colPositions.serie, tableTop)
               .text('ESTADO', colPositions.estado, tableTop)
               .text('CANT.', colPositions.cantidad, tableTop);
            doc.moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            const productosArray = Array.isArray(productos) ? productos : [productos];
            productosArray.forEach((producto, index) => {
                doc.font('Helvetica').fontSize(9)
                   .text((index + 1).toString(), colPositions.num, currentY)
                   .text(producto.tipo || producto.nombre || 'Equipo', colPositions.tipo, currentY)
                   .text(producto.marca || 'N/A', colPositions.marca, currentY)
                   .text(producto.modelo || 'N/A', colPositions.modelo, currentY)
                   .text(producto.numero_serie || 'N/A', colPositions.serie, currentY)
                   .text(producto.condicion || 'NUEVO', colPositions.estado, currentY)
                   .text((producto.cantidad || 1).toString(), colPositions.cantidad, currentY);
                currentY += 20;
                if (currentY > 700 && index < productosArray.length - 1) { doc.addPage(); currentY = 50; }
            });
            doc.moveDown(2);

            doc.font('Helvetica-Bold').fontSize(12)
               .text('4. MOTIVO DE LA ASIGNACIÓN', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(motivo || 'Asignación de equipo para uso laboral', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            doc.font('Helvetica-Bold').fontSize(12)
               .text('5. OBSERVACIONES', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(observaciones || 'Sin observaciones', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            doc.addPage();
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);

            // SOLO FIRMA DEL TRABAJADOR
            doc.font('Helvetica-Bold').fontSize(11).text('RECIBÍ CONFORME', { align: 'left' });
            doc.moveDown(1);
            
            const lineaTrabajadorY = doc.y;
            doc.moveTo(100, lineaTrabajadorY).lineTo(250, lineaTrabajadorY).stroke();
            dibujarFirma(doc, firma_trabajador, 100, lineaTrabajadorY - 28, colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA TRABAJADOR', { align: 'left' });
            doc.moveDown(3);

            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la entrega de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });

            doc.end();

        } catch (error) {
            console.error('❌ Error en generarActaAsignacion:', error);
            reject(error);
        }
    });
}

// ============================================
// FUNCIÓN PARA GENERAR ACTA DE RECEPCIÓN
// ============================================
function generarActaRecepcion(datos) {
    console.log('🔧 generarActaRecepcion llamado con ID:', datos.id_asignacion);
    
    return new Promise((resolve, reject) => {
        try {
            const {
                id_asignacion,
                colaborador,
                productos,
                fecha_recepcion,
                motivo,
                observaciones,
                condicion_entrega,
                firma_trabajador,
                es_prestamo
            } = datos;

            if (es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento de recepción');
                return resolve(Buffer.from(''));
            }

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                console.log(`✅ PDF de recepción generado: ${pdfBuffer.length} bytes`);
                resolve(pdfBuffer);
            });
            
            doc.on('error', (err) => {
                console.error('❌ Error en PDF de recepción:', err);
                reject(err);
            });

            doc.font('Helvetica-Bold').fontSize(18).text(EMPRESA.nombre, { align: 'center' }).moveDown(0.3);
            doc.font('Helvetica').fontSize(10)
               .text(`RUT: ${EMPRESA.rut} | ${EMPRESA.domicilio}`, { align: 'center' })
               .text(`Email: ${EMPRESA.email} - Fono: ${EMPRESA.telefono}`, { align: 'center' })
               .moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').fontSize(16).text('ACTA DE RECEPCIÓN DE EQUIPOS', { align: 'center' }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Fecha de Recepción: ${formatearFecha(fecha_recepcion)}`, { align: 'left' })
               .text(`ID Asignación: ${id_asignacion}`, { align: 'left' })
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('1. DATOS DE LA EMPRESA', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Razón Social: ${EMPRESA.nombre}`)
               .text(`RUT: ${EMPRESA.rut}`)
               .text(`Representante Legal: ${EMPRESA.representante_legal}`)
               .text(`Cargo: ${EMPRESA.cargo_representante}`)
               .text(`Domicilio: ${EMPRESA.domicilio}`)
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('2. DATOS DEL TRABAJADOR', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Nombre: ${colaborador.nombre || ''}`)
               .text(`RUT: ${colaborador.rut || ''}`)
               .text(`Nacionalidad: ${colaborador.nacionalidad || 'chilena'}`)
               .text(`Fecha Nacimiento: ${colaborador.fecha_nacimiento || ''}`)
               .text(`Profesión/Oficio: ${colaborador.cargo || ''}`)
               .text(`Domicilio: ${colaborador.direccion || EMPRESA.domicilio}`)
               .text(`Email: ${colaborador.email || ''}`)
               .text(`Departamento: ${colaborador.departamento || 'Tecnología e Innovación'}`)
               .moveDown(1);

            doc.font('Helvetica-Bold').fontSize(12).text('3. DATOS DEL EQUIPO RECIBIDO', { underline: true }).moveDown(0.5);

            const colPositions = { num: 40, tipo: 80, marca: 150, modelo: 220, serie: 300, estado: 380, cantidad: 460 };
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(9)
               .text('#', colPositions.num, tableTop)
               .text('TIPO', colPositions.tipo, tableTop)
               .text('MARCA', colPositions.marca, tableTop)
               .text('MODELO', colPositions.modelo, tableTop)
               .text('N° SERIE', colPositions.serie, tableTop)
               .text('ESTADO', colPositions.estado, tableTop)
               .text('CANT.', colPositions.cantidad, tableTop);
            doc.moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke();

            let currentY = tableTop + 25;
            const productosArray = Array.isArray(productos) ? productos : [productos];
            productosArray.forEach((producto, index) => {
                doc.font('Helvetica').fontSize(9)
                   .text((index + 1).toString(), colPositions.num, currentY)
                   .text(producto.tipo || producto.nombre || 'Equipo', colPositions.tipo, currentY)
                   .text(producto.marca || 'N/A', colPositions.marca, currentY)
                   .text(producto.modelo || 'N/A', colPositions.modelo, currentY)
                   .text(producto.numero_serie || 'N/A', colPositions.serie, currentY)
                   .text(condicion_entrega || 'BUENO', colPositions.estado, currentY)
                   .text((producto.cantidad || 1).toString(), colPositions.cantidad, currentY);
                currentY += 20;
                if (currentY > 700 && index < productosArray.length - 1) { doc.addPage(); currentY = 50; }
            });
            doc.moveDown(2);

            doc.font('Helvetica-Bold').fontSize(12)
               .text('4. MOTIVO DE LA DEVOLUCIÓN', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(motivo || 'No especificado', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            doc.font('Helvetica-Bold').fontSize(12)
               .text('5. OBSERVACIONES', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(observaciones || 'Sin observaciones', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            doc.addPage();
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);

            // SOLO FIRMA DEL TRABAJADOR
            doc.font('Helvetica-Bold').fontSize(11).text('ENTREGÓ CONFORME', { align: 'left' });
            doc.moveDown(1);
            
            const lineaTrabajadorY = doc.y;
            doc.moveTo(100, lineaTrabajadorY).lineTo(250, lineaTrabajadorY).stroke();
            dibujarFirma(doc, firma_trabajador, 100, lineaTrabajadorY - 28, colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA TRABAJADOR', { align: 'left' });
            doc.moveDown(3);

            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la recepción de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });

            doc.end();

        } catch (error) {
            console.error('❌ Error en generarActaRecepcion:', error);
            reject(error);
        }
    });
}

// ============================================
// ENDPOINTS - GET
// ============================================

router.get('/producto/:productoId/historial', async (req, res) => {
    try {
        const { productoId } = req.params;
        const idNum = validarId(productoId, 'ID de producto');
        console.log(`📥 GET /api/asignaciones/producto/${idNum}/historial`);
        const pool = await getConnection();
        const result = await pool.request()
            .input('productoId', sql.Int, idNum)
            .query(`
                SELECT 
                    a.id, 
                    a.producto_id, 
                    a.colaborador_id, 
                    a.motivo, 
                    a.observaciones,
                    a.fecha_asignacion, 
                    a.fecha_devolucion, 
                    a.es_prestamo,
                    a.condicion_entrega,
                    p.nombre as producto_nombre, 
                    p.numero_serie, 
                    p.marca, 
                    p.modelo,
                    c.nombre as colaborador_nombre, 
                    c.rut as colaborador_rut,
                    c.email as colaborador_email, 
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.producto_id = @productoId
                ORDER BY a.fecha_asignacion DESC
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error en GET /asignaciones/producto/:productoId/historial:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.get('/activas', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/activas');
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                a.id,
                a.producto_id,
                a.colaborador_id,
                a.motivo,
                a.observaciones,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.es_prestamo,
                p.nombre as producto_nombre,
                p.numero_serie,
                p.marca,
                p.modelo,
                c.nombre as colaborador_nombre,
                c.rut as colaborador_rut,
                c.email as colaborador_email,
                c.cargo as colaborador_cargo,
                c.departamento as colaborador_departamento
            FROM INV.asignaciones a
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE (a.fecha_devolucion IS NULL OR a.fecha_devolucion = '' OR a.fecha_devolucion = '1900-01-01')
            ORDER BY a.fecha_asignacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.get('/prestamos/activos', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/prestamos/activos');
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                a.id,
                a.producto_id,
                a.colaborador_id,
                a.motivo,
                a.observaciones,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.es_prestamo,
                p.nombre as producto_nombre,
                p.numero_serie,
                p.marca,
                p.modelo,
                c.nombre as colaborador_nombre,
                c.rut as colaborador_rut,
                c.email as colaborador_email,
                c.cargo as colaborador_cargo,
                c.departamento as colaborador_departamento
            FROM INV.asignaciones a
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE a.fecha_devolucion IS NULL AND a.es_prestamo = 1
            ORDER BY a.fecha_asignacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.get('/prestamos/estadisticas', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/prestamos/estadisticas');
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_prestamos,
                SUM(CASE WHEN fecha_devolucion IS NULL THEN 1 ELSE 0 END) as prestamos_activos,
                SUM(CASE WHEN fecha_devolucion IS NOT NULL THEN 1 ELSE 0 END) as prestamos_devueltos,
                COUNT(DISTINCT colaborador_id) as colaboradores_con_prestamos
            FROM INV.asignaciones
            WHERE es_prestamo = 1
        `);
        
        res.json({
            success: true,
            data: {
                totalPrestamos: result.recordset[0].total_prestamos || 0,
                activos: result.recordset[0].prestamos_activos || 0,
                devueltos: result.recordset[0].prestamos_devueltos || 0,
                colaboradoresConPrestamos: result.recordset[0].colaboradores_con_prestamos || 0
            }
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/prestamos/historial', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/prestamos/historial');
        
        const { fecha_inicio, fecha_fin, colaborador_id } = req.query;
        const pool = await getConnection();
        
        let query = `
            SELECT 
                a.id,
                a.producto_id,
                a.colaborador_id,
                a.motivo,
                a.observaciones,
                a.fecha_asignacion,
                a.fecha_devolucion,
                a.es_prestamo,
                p.nombre as producto_nombre,
                p.marca,
                p.modelo,
                p.numero_serie,
                c.nombre as colaborador_nombre,
                c.rut as colaborador_rut,
                c.email as colaborador_email,
                c.cargo as colaborador_cargo
            FROM INV.asignaciones a
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE a.es_prestamo = 1
        `;
        
        const request = pool.request();
        let condiciones = [];
        
        if (fecha_inicio) {
            request.input('fecha_inicio', sql.DateTime, fecha_inicio);
            condiciones.push('a.fecha_asignacion >= @fecha_inicio');
        }
        if (fecha_fin) {
            request.input('fecha_fin', sql.DateTime, fecha_fin);
            condiciones.push('a.fecha_asignacion <= @fecha_fin');
        }
        if (colaborador_id) {
            request.input('colaborador_id', sql.Int, colaborador_id);
            condiciones.push('a.colaborador_id = @colaborador_id');
        }
        
        if (condiciones.length > 0) {
            query += ' AND ' + condiciones.join(' AND ');
        }
        query += ' ORDER BY a.fecha_asignacion DESC';
        
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// ENDPOINTS PARA DOCUMENTOS
// ============================================

router.get('/buscar-documento/:asignacionId/:tipo', async (req, res) => {
    try {
        const { asignacionId, tipo } = req.params;
        console.log(`📥 GET /api/asignaciones/buscar-documento/${asignacionId}/${tipo}`);
        
        if (!fs.existsSync(DOCS_DIR)) {
            fs.mkdirSync(DOCS_DIR, { recursive: true });
        }
        
        const files = fs.readdirSync(DOCS_DIR);
        const patterns = tipo === 'asignacion' 
            ? [`acta_asignacion_${asignacionId}`, `asignacion_${asignacionId}`] 
            : [`acta_recepcion_${asignacionId}`, `recepcion_${asignacionId}`];
        
        let foundFile = files.find(file => patterns.some(p => file.includes(p)) && file.endsWith('.pdf'));
        
        // Si no existe el archivo físico en disco para asignación, generarlo dinámicamente
        if (!foundFile && tipo === 'asignacion') {
            console.log(`⚡ Intentando generar Acta de Asignación dinámicamente para ID: ${asignacionId}...`);
            try {
                const pool = await getConnection();
                const asigRes = await pool.request()
                    .input('id', sql.Int, asignacionId)
                    .query(`
                        SELECT a.id, a.producto_id, a.colaborador_id, a.fecha_asignacion, a.motivo, a.observaciones, a.es_prestamo,
                               p.nombre as producto_nombre, p.marca as producto_marca, p.modelo as producto_modelo, p.numero_serie, p.condicion as producto_condicion,
                               c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                               c.cargo as colaborador_cargo, c.departamento as colaborador_departamento, c.direccion as colaborador_direccion
                        FROM INV.asignaciones a
                        LEFT JOIN INV.productos p ON a.producto_id = p.id
                        LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                        WHERE a.id = @id
                    `);

                if (asigRes.recordset.length > 0) {
                    const row = asigRes.recordset[0];
                    const documentoData = {
                        id_asignacion: row.id,
                        colaborador: {
                            nombre: row.colaborador_nombre || 'Colaborador',
                            rut: row.colaborador_rut || '-',
                            email: row.colaborador_email || '',
                            cargo: row.colaborador_cargo || '-',
                            departamento: row.colaborador_departamento || '-',
                            direccion: row.colaborador_direccion || '-'
                        },
                        productos: [{
                            tipo: 'Equipo',
                            nombre: row.producto_nombre || 'Producto',
                            marca: row.producto_marca || 'N/A',
                            modelo: row.producto_modelo || 'N/A',
                            numero_serie: row.numero_serie || 'N/A',
                            condicion: row.producto_condicion || 'NUEVO',
                            cantidad: 1
                        }],
                        fecha_asignacion: row.fecha_asignacion || new Date(),
                        motivo: row.motivo || 'Asignación de equipo',
                        observaciones: row.observaciones || 'Generado por el sistema',
                        firma_trabajador: row.colaborador_nombre || 'Firma registrada',
                        es_prestamo: row.es_prestamo === true || row.es_prestamo === 1
                    };

                    const pdfBuffer = await generarActaAsignacion(documentoData);
                    if (pdfBuffer && pdfBuffer.length > 0) {
                        const newFilename = `acta_asignacion_${row.id}_${Date.now()}.pdf`;
                        const newFilepath = path.join(DOCS_DIR, newFilename);
                        fs.writeFileSync(newFilepath, pdfBuffer);
                        foundFile = newFilename;
                        console.log(`✅ Acta de asignación generada dinámicamente: ${newFilename}`);
                    }
                }
            } catch (genError) {
                console.error('⚠️ Error generando PDF a demanda:', genError);
            }
        }

        // Si no existe el archivo físico para recepción y está finalizado, generarlo dinámicamente
        if (!foundFile && tipo === 'recepcion') {
            console.log(`⚡ Intentando generar Acta de Recepción dinámicamente para ID: ${asignacionId}...`);
            try {
                const pool = await getConnection();
                const asigRes = await pool.request()
                    .input('id', sql.Int, asignacionId)
                    .query(`
                        SELECT a.id, a.producto_id, a.colaborador_id, a.fecha_asignacion, a.fecha_devolucion, a.motivo, a.observaciones, a.condicion_entrega, a.es_prestamo,
                               p.nombre as producto_nombre, p.marca as producto_marca, p.modelo as producto_modelo, p.numero_serie, p.condicion as producto_condicion,
                               c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                               c.cargo as colaborador_cargo, c.departamento as colaborador_departamento
                        FROM INV.asignaciones a
                        LEFT JOIN INV.productos p ON a.producto_id = p.id
                        LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                        WHERE a.id = @id AND a.fecha_devolucion IS NOT NULL
                    `);

                if (asigRes.recordset.length > 0) {
                    const row = asigRes.recordset[0];
                    const recepcionData = {
                        id_asignacion: row.id,
                        colaborador: {
                            nombre: row.colaborador_nombre || 'Colaborador',
                            rut: row.colaborador_rut || '-',
                            email: row.colaborador_email || '',
                            cargo: row.colaborador_cargo || '-',
                            departamento: row.colaborador_departamento || '-'
                        },
                        productos: [{
                            tipo: 'Equipo',
                            nombre: row.producto_nombre || 'Producto',
                            marca: row.producto_marca || 'N/A',
                            modelo: row.producto_modelo || 'N/A',
                            numero_serie: row.numero_serie || 'N/A',
                            condicion: row.producto_condicion || 'NUEVO',
                            cantidad: 1
                        }],
                        fecha_recepcion: row.fecha_devolucion || new Date(),
                        motivo: row.motivo || 'Devolución de equipo',
                        observaciones: row.observaciones || 'Generado por el sistema',
                        condicion_entrega: row.condicion_entrega || 'BUENO',
                        firma_trabajador: row.colaborador_nombre || 'Firma registrada',
                        es_prestamo: row.es_prestamo === true || row.es_prestamo === 1
                    };

                    const pdfBuffer = await generarActaRecepcion(recepcionData);
                    if (pdfBuffer && pdfBuffer.length > 0) {
                        const newFilename = `acta_recepcion_${row.id}_${Date.now()}.pdf`;
                        const newFilepath = path.join(DOCS_DIR, newFilename);
                        fs.writeFileSync(newFilepath, pdfBuffer);
                        foundFile = newFilename;
                        console.log(`✅ Acta de recepción generada dinámicamente: ${newFilename}`);
                    }
                }
            } catch (genError) {
                console.error('⚠️ Error generando PDF de recepción a demanda:', genError);
            }
        }

        if (foundFile) {
            res.json({ success: true, data: { filename: foundFile }, filename: foundFile });
        } else {
            res.json({ success: false, message: 'Documento no encontrado', filename: null });
        }
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, filename: null });
    }
});

router.get('/descargar/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        console.log(`📥 GET /api/asignaciones/descargar/${filename}`);
        
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
        }
        
        const safeFilename = path.basename(filename);
        const filepath = path.join(DOCS_DIR, safeFilename);
        
        if (!fs.existsSync(filepath)) {
            const files = fs.readdirSync(DOCS_DIR);
            const idMatch = safeFilename.match(/\d+/);
            if (idMatch) {
                const foundFile = files.find(f => (f.includes(`acta_asignacion_${idMatch[0]}`) || f.includes(`asignacion_${idMatch[0]}`) || f.includes(`acta_recepcion_${idMatch[0]}`) || f.includes(`recepcion_${idMatch[0]}`)) && f.endsWith('.pdf'));
                if (foundFile) {
                    const foundPath = path.join(DOCS_DIR, foundFile);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${foundFile}"`);
                    const fileStream = fs.createReadStream(foundPath);
                    fileStream.pipe(res);
                    return;
                }
            }
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        console.log(`✅ Documento descargado: ${safeFilename}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/generar-acta-asignacion', async (req, res) => {
    try {
        console.log('📥 POST /api/asignaciones/generar-acta-asignacion');
        
        const {
            id_asignacion,
            colaborador,
            productos,
            fecha_asignacion,
            motivo,
            observaciones,
            firma_trabajador,
            es_prestamo
        } = req.body;
        
        if (es_prestamo) {
            return res.json({ success: true, message: 'Préstamo sin documento', es_prestamo: true });
        }
        
        if (!colaborador || (!productos && !req.body.producto)) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }
        
        const productosArray = productos || (req.body.producto ? [req.body.producto] : null);
        
        const pdfBuffer = await generarActaAsignacion({
            id_asignacion: id_asignacion || Date.now(),
            colaborador,
            productos: productosArray,
            fecha_asignacion: fecha_asignacion || new Date(),
            motivo: motivo || 'Asignación de equipo',
            observaciones: truncarTexto(observaciones, 500),
            firma_trabajador: firma_trabajador || colaborador.nombre,
            es_prestamo: false
        });
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('No se pudo generar el PDF');
        }
        
        if (!fs.existsSync(DOCS_DIR)) {
            fs.mkdirSync(DOCS_DIR, { recursive: true });
        }
        
        const filename = `acta_asignacion_${id_asignacion}_${Date.now()}.pdf`;
        const filepath = path.join(DOCS_DIR, filename);
        fs.writeFileSync(filepath, pdfBuffer);
        console.log(`✅ Acta guardada: ${filename} (${pdfBuffer.length} bytes)`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/generar-acta-recepcion', async (req, res) => {
    try {
        console.log('📥 POST /api/asignaciones/generar-acta-recepcion');
        
        const {
            id_asignacion,
            colaborador,
            productos,
            fecha_recepcion,
            motivo,
            observaciones,
            condicion_entrega,
            firma_trabajador,
            es_prestamo
        } = req.body;
        
        if (es_prestamo) {
            return res.json({ success: true, message: 'Préstamo sin documento', es_prestamo: true });
        }
        
        if (!colaborador || (!productos && !req.body.producto)) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }
        
        const productosArray = productos || (req.body.producto ? [req.body.producto] : null);
        
        const pdfBuffer = await generarActaRecepcion({
            id_asignacion: id_asignacion || Date.now(),
            colaborador,
            productos: productosArray,
            fecha_recepcion: fecha_recepcion || new Date(),
            motivo: motivo || 'Devolución de equipo',
            observaciones: truncarTexto(observaciones, 500),
            condicion_entrega: condicion_entrega || 'BUENO',
            firma_trabajador: firma_trabajador || colaborador.nombre,
            es_prestamo: false
        });
        
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('No se pudo generar el PDF');
        }
        
        if (!fs.existsSync(DOCS_DIR)) {
            fs.mkdirSync(DOCS_DIR, { recursive: true });
        }
        
        const filename = `acta_recepcion_${id_asignacion || Date.now()}_${Date.now()}.pdf`;
        const filepath = path.join(DOCS_DIR, filename);
        fs.writeFileSync(filepath, pdfBuffer);
        
        console.log(`✅ Acta guardada: ${filename} (${pdfBuffer.length} bytes)`);
        
        res.json({ success: true, message: 'Acta generada exitosamente', filename: filename });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/descargar-acta/:asignacionId', async (req, res) => {
    try {
        const { asignacionId } = req.params;
        console.log(`📥 GET /api/asignaciones/descargar-acta/${asignacionId}`);
        
        if (!fs.existsSync(DOCS_DIR)) {
            return res.status(404).json({ success: false, message: 'Directorio no encontrado' });
        }
        
        const files = fs.readdirSync(DOCS_DIR);
        const pattern = `acta_asignacion_${asignacionId}`;
        const foundFile = files.find(file => file.includes(pattern) && file.endsWith('.pdf'));
        
        if (!foundFile) {
            return res.status(404).json({ success: false, message: `Acta no encontrada para ID: ${asignacionId}` });
        }
        
        const filepath = path.join(DOCS_DIR, foundFile);
        console.log(`✅ Sirviendo archivo: ${foundFile}`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${foundFile}"`);
        
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/descargar-acta-recepcion/:asignacionId', async (req, res) => {
    try {
        const { asignacionId } = req.params;
        console.log(`📥 GET /api/asignaciones/descargar-acta-recepcion/${asignacionId}`);
        
        if (!fs.existsSync(DOCS_DIR)) {
            return res.status(404).json({ success: false, message: 'Directorio no encontrado' });
        }
        
        const files = fs.readdirSync(DOCS_DIR);
        const pattern = `acta_recepcion_${asignacionId}`;
        const foundFile = files.find(file => file.includes(pattern) && file.endsWith('.pdf'));
        
        if (!foundFile) {
            return res.status(404).json({ success: false, message: 'Acta no encontrada' });
        }
        
        const filepath = path.join(DOCS_DIR, foundFile);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${foundFile}"`);
        
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/estadisticas', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/estadisticas');
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as total_asignaciones,
                SUM(CASE WHEN fecha_devolucion IS NULL THEN 1 ELSE 0 END) as asignaciones_activas,
                SUM(CASE WHEN fecha_devolucion IS NOT NULL THEN 1 ELSE 0 END) as asignaciones_completadas,
                SUM(CASE WHEN es_prestamo = 1 THEN 1 ELSE 0 END) as total_prestamos,
                SUM(CASE WHEN es_prestamo = 1 AND fecha_devolucion IS NULL THEN 1 ELSE 0 END) as prestamos_activos
            FROM INV.asignaciones
        `);
        
        res.json({
            success: true,
            data: {
                totalAsignaciones: result.recordset[0].total_asignaciones || 0,
                activas: result.recordset[0].asignaciones_activas || 0,
                completadas: result.recordset[0].asignaciones_completadas || 0,
                totalPrestamos: result.recordset[0].total_prestamos || 0,
                prestamosActivos: result.recordset[0].prestamos_activos || 0
            }
        });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// POST - CREAR ASIGNACIÓN (CORREGIDO)
// ============================================
router.post('/', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        console.log('📥 POST /api/asignaciones');
        
        const { 
            producto_id, 
            colaborador_id, 
            motivo, 
            observaciones, 
            fecha_asignacion,
            firma_trabajador,
            es_prestamo
        } = req.body;
        
        if (!producto_id || !colaborador_id) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
        }
        
        const productoIdNum = validarId(producto_id, 'producto_id');
        const colaboradorIdNum = validarId(colaborador_id, 'colaborador_id');
        
        pool = await getConnection();
        
        // Obtener datos del producto
        const productoCheck = await pool.request()
            .input('id', sql.Int, productoIdNum)
            .query(`SELECT id, id_estado_equipo, nombre, numero_serie, marca, modelo, condicion FROM INV.productos WHERE id = @id`);
        
        if (productoCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const producto = productoCheck.recordset[0];
        
        if (producto.id_estado_equipo !== ESTADOS.DISPONIBLE) {
            // Verificar si el producto tiene asignaciones activas reales en INV.asignaciones
            const asignacionesActivasCount = await pool.request()
                .input('producto_id', sql.Int, productoIdNum)
                .query(`SELECT COUNT(*) as count FROM INV.asignaciones WHERE producto_id = @producto_id AND fecha_devolucion IS NULL`);
            
            if (asignacionesActivasCount.recordset[0].count > 0) {
                return res.status(400).json({ success: false, message: `Producto no disponible. Estado: ${getEstadoTexto(producto.id_estado_equipo)}` });
            }
        }
        
        // Obtener datos del colaborador
        const colaboradorCheck = await pool.request()
            .input('id', sql.Int, colaboradorIdNum)
            .query(`SELECT id, nombre, email, rut, cargo, departamento, direccion, fecha_nacimiento FROM INV.colaboradores WHERE id = @id AND estado = 'ACTIVO'`);
        
        if (colaboradorCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
        }
        
        const colaborador = colaboradorCheck.recordset[0];
        const fechaAsignacionValue = fecha_asignacion ? new Date(fecha_asignacion) : new Date();
        const esPrestamoValue = es_prestamo === true || es_prestamo === 1;
        
        // TRUNCAR OBSERVACIONES
        let observacionesCortas = '';
        if (observaciones) {
            observacionesCortas = observaciones.length > 400 ? observaciones.substring(0, 400) : observaciones;
        }
        
        // INICIAR TRANSACCIÓN
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        // Cerrar cualquier asignación abierta anterior para este producto
        await transaction.request()
            .input('producto_id', sql.Int, productoIdNum)
            .input('fecha_cierre', sql.DateTime, fechaAsignacionValue)
            .query(`
                UPDATE INV.asignaciones 
                SET fecha_devolucion = @fecha_cierre,
                    observaciones_devolucion = 'Cierre automático por nueva asignación'
                WHERE producto_id = @producto_id AND fecha_devolucion IS NULL
            `);
        
        const insertAsignacion = await transaction.request()
            .input('producto_id', sql.Int, productoIdNum)
            .input('colaborador_id', sql.Int, colaboradorIdNum)
            .input('id_estado_equipo', sql.Int, ESTADOS.ASIGNADO)
            .input('motivo', sql.NVarChar(500), motivo || (esPrestamoValue ? 'PRÉSTAMO TEMPORAL' : 'Asignación de equipo'))
            .input('fecha_asignacion', sql.DateTime, fechaAsignacionValue)
            .input('observaciones', sql.NVarChar(500), observacionesCortas)
            .input('condicion_entrega', sql.NVarChar(50), 'BUENO')
            .input('es_prestamo', sql.Bit, esPrestamoValue)
            .query(`
                INSERT INTO INV.asignaciones (
                    producto_id, colaborador_id, id_estado_equipo, motivo, fecha_asignacion,
                    observaciones, condicion_entrega, es_prestamo
                ) VALUES (
                    @producto_id, @colaborador_id, @id_estado_equipo, @motivo, @fecha_asignacion,
                    @observaciones, @condicion_entrega, @es_prestamo
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        const asignacionId = insertAsignacion.recordset[0].id;
        console.log('✅ Asignación creada ID:', asignacionId);
        
        await transaction.request()
            .input('id', sql.Int, productoIdNum)
            .input('id_estado_equipo', sql.Int, ESTADOS.ASIGNADO)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);
        
        await transaction.commit();
        console.log('✅ Transacción completada exitosamente');
        
        // Guardar observaciones completas en un archivo si es necesario
        if (observaciones && observaciones.length > 400) {
            try {
                const observacionesFile = path.join(DOCS_DIR, `observaciones_${asignacionId}.json`);
                fs.writeFileSync(observacionesFile, observaciones);
                console.log(`✅ Observaciones completas guardadas en: observaciones_${asignacionId}.json`);
            } catch (fileError) {
                console.error('⚠️ Error guardando observaciones completas:', fileError.message);
            }
        }
        
        // Generar PDF del acta de asignación
        let documentoGenerado = null;
        let pdfBuffer = null;
        
        if (!esPrestamoValue) {
            try {
                console.log('📄 Generando acta de asignación...');
                
                if (!fs.existsSync(DOCS_DIR)) {
                    fs.mkdirSync(DOCS_DIR, { recursive: true });
                }
                
                const documentoData = {
                    id_asignacion: asignacionId,
                    colaborador: {
                        nombre: colaborador.nombre,
                        rut: colaborador.rut,
                        email: colaborador.email,
                        cargo: colaborador.cargo,
                        departamento: colaborador.departamento,
                        direccion: colaborador.direccion || EMPRESA.domicilio,
                        fecha_nacimiento: colaborador.fecha_nacimiento || '1990-01-01'
                    },
                    productos: [{
                        tipo: 'Equipo',
                        nombre: producto.nombre,
                        marca: producto.marca || 'N/A',
                        modelo: producto.modelo || 'N/A',
                        numero_serie: producto.numero_serie || 'N/A',
                        condicion: producto.condicion || 'NUEVO',
                        cantidad: 1
                    }],
                    fecha_asignacion: fechaAsignacionValue,
                    motivo: motivo || 'Asignación de equipo',
                    observaciones: 'Documento generado automáticamente por el sistema',
                    firma_trabajador: firma_trabajador || colaborador.nombre,
                    es_prestamo: false
                };
                
                pdfBuffer = await generarActaAsignacion(documentoData);
                if (pdfBuffer && pdfBuffer.length > 0) {
                    const filename = `acta_asignacion_${asignacionId}_${Date.now()}.pdf`;
                    const filepath = path.join(DOCS_DIR, filename);
                    fs.writeFileSync(filepath, pdfBuffer);
                    documentoGenerado = { filename: filename };
                    console.log(`✅ Acta de asignación generada: ${filename} (${pdfBuffer.length} bytes)`);
                }
            } catch (pdfError) {
                console.error('⚠️ Error generando acta de asignación:', pdfError.message);
            }
        }
        
        // Devolver la respuesta con el PDF si se generó
        if (pdfBuffer && pdfBuffer.length > 0 && !esPrestamoValue) {
            console.log('📄 Enviando PDF de asignación al cliente...');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="acta_asignacion_${asignacionId}.pdf"`);
            res.setHeader('X-Documento-Generado', 'true');
            res.setHeader('X-Asignacion-Id', asignacionId);
            return res.send(pdfBuffer);
        }
        
        res.json({
            success: true,
            message: esPrestamoValue ? 'Préstamo registrado correctamente' : 'Producto asignado correctamente',
            data: {
                id: asignacionId,
                es_prestamo: esPrestamoValue,
                documento: documentoGenerado
            }
        });
        
    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('❌ Error al hacer rollback:', rollbackError);
            }
        }
        console.error('❌ Error detallado:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// PUT - Finalizar asignación
// ============================================
router.put('/:asignacionId/finalizar', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        const { asignacionId } = req.params;
        const { fecha_devolucion, motivo_devolucion, observaciones_devolucion, condicion_entrega, firma_trabajador_devolucion } = req.body;
        
        console.log(`📥 PUT /api/asignaciones/${asignacionId}/finalizar`);
        
        const asignacionIdNum = validarId(asignacionId, 'ID de asignación');
        
        pool = await getConnection();
        
        // Obtener datos de la asignación
        let asignacionResult = await pool.request()
            .input('id', sql.Int, asignacionIdNum)
            .query(`
                SELECT TOP 1 a.id, a.producto_id, a.colaborador_id, a.es_prestamo,
                       p.nombre as producto_nombre, p.numero_serie, p.marca, p.modelo,
                       c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                       c.cargo as colaborador_cargo, c.departamento as colaborador_departamento,
                       c.direccion as colaborador_direccion
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE (a.id = @id OR a.producto_id = @id) AND (a.fecha_devolucion IS NULL OR a.fecha_devolucion = '' OR a.fecha_devolucion = '1900-01-01')
                ORDER BY a.id DESC
            `);
        
        if (asignacionResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Asignación no encontrada o ya finalizada' });
        }
        
        const asignacion = asignacionResult.recordset[0];
        const fechaRecepcionValue = fecha_devolucion ? new Date(fecha_devolucion) : new Date();
        const esPrestamoValue = asignacion.es_prestamo === true || asignacion.es_prestamo === 1;
        
        // TRUNCAR OBSERVACIONES
        let observacionesCortas = '';
        if (observaciones_devolucion) {
            observacionesCortas = observaciones_devolucion.length > 400 ? observaciones_devolucion.substring(0, 400) : observaciones_devolucion;
        }
        
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        await transaction.request()
            .input('id', sql.Int, asignacionIdNum)
            .input('fecha_devolucion', sql.DateTime, fechaRecepcionValue)
            .input('condicion_entrega', sql.NVarChar(50), condicion_entrega || 'BUENO')
            .input('observaciones', sql.NVarChar(500), observacionesCortas)
            .input('firma_trabajador_devolucion', sql.NVarChar, firma_trabajador_devolucion || null)
            .query(`
                UPDATE INV.asignaciones 
                SET fecha_devolucion = @fecha_devolucion, 
                    condicion_entrega = @condicion_entrega,
                    observaciones = @observaciones,
                    firma_trabajador_devolucion = @firma_trabajador_devolucion
                WHERE id = @id
            `);

        // Asegurar que cualquier otra asignación abierta para este producto también sea cerrada
        await transaction.request()
            .input('producto_id', sql.Int, asignacion.producto_id)
            .input('fecha_devolucion', sql.DateTime, fechaRecepcionValue)
            .query(`
                UPDATE INV.asignaciones 
                SET fecha_devolucion = @fecha_devolucion,
                    observaciones_devolucion = 'Cierre automático por devolución de equipo'
                WHERE producto_id = @producto_id AND fecha_devolucion IS NULL
            `);
        
        await transaction.request()
            .input('id', sql.Int, asignacion.producto_id)
            .input('id_estado_equipo', sql.Int, ESTADOS.DISPONIBLE)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);
        
        await transaction.commit();
        
        // Generar PDF del acta de recepción
        let documentoGenerado = null;
        let pdfBuffer = null;
        
        if (!esPrestamoValue) {
            try {
                console.log('📄 Generando acta de recepción...');
                
                if (!fs.existsSync(DOCS_DIR)) {
                    fs.mkdirSync(DOCS_DIR, { recursive: true });
                }
                
                const recepcionData = {
                    id_asignacion: asignacionIdNum,
                    colaborador: {
                        nombre: asignacion.colaborador_nombre,
                        rut: asignacion.colaborador_rut,
                        email: asignacion.colaborador_email,
                        cargo: asignacion.colaborador_cargo,
                        departamento: asignacion.colaborador_departamento,
                        direccion: asignacion.colaborador_direccion || EMPRESA.domicilio
                    },
                    productos: [{
                        tipo: 'Equipo',
                        nombre: asignacion.producto_nombre,
                        marca: asignacion.marca || 'N/A',
                        modelo: asignacion.modelo || 'N/A',
                        numero_serie: asignacion.numero_serie || 'N/A',
                        cantidad: 1
                    }],
                    fecha_recepcion: fechaRecepcionValue,
                    motivo: motivo_devolucion || 'Devolución de equipo',
                    observaciones: observaciones_devolucion || 'Sin observaciones',
                    condicion_entrega: condicion_entrega || 'BUENO',
                    firma_trabajador: firma_trabajador_devolucion || asignacion.colaborador_nombre,
                    es_prestamo: false
                };
                
                pdfBuffer = await generarActaRecepcion(recepcionData);
                if (pdfBuffer && pdfBuffer.length > 0) {
                    const filename = `acta_recepcion_${asignacionIdNum}_${Date.now()}.pdf`;
                    const filepath = path.join(DOCS_DIR, filename);
                    fs.writeFileSync(filepath, pdfBuffer);
                    documentoGenerado = { filename: filename };
                    console.log(`✅ Acta de recepción generada: ${filename} (${pdfBuffer.length} bytes)`);
                }
            } catch (pdfError) {
                console.error('⚠️ Error generando acta de recepción:', pdfError.message);
            }
        }
        
        // Devolver la respuesta con el PDF si se generó
        if (pdfBuffer && pdfBuffer.length > 0 && !esPrestamoValue) {
            console.log('📄 Enviando PDF de recepción al cliente...');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="acta_recepcion_${asignacionIdNum}.pdf"`);
            res.setHeader('X-Documento-Generado', 'true');
            res.setHeader('X-Asignacion-Id', asignacionIdNum);
            return res.send(pdfBuffer);
        }
        
        res.json({
            success: true,
            message: esPrestamoValue ? 'Devolución de préstamo registrada' : 'Devolución registrada correctamente',
            data: { es_prestamo: esPrestamoValue, documento: documentoGenerado }
        });
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/historial', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/historial');
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT a.id, a.producto_id, a.colaborador_id, a.motivo, a.observaciones,
                   a.fecha_asignacion, a.fecha_devolucion, a.es_prestamo,
                   p.nombre as producto_nombre, p.numero_serie, p.marca, p.modelo,
                   c.nombre as colaborador_nombre, c.email as colaborador_email, c.cargo as colaborador_cargo
            FROM INV.asignaciones a
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            ORDER BY a.fecha_asignacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = validarId(id, 'ID de asignación');
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT a.id, a.producto_id, a.colaborador_id, a.motivo, a.observaciones,
                       a.fecha_asignacion, a.fecha_devolucion, a.es_prestamo,
                       p.nombre as producto_nombre, p.numero_serie, p.marca, p.modelo,
                       c.nombre as colaborador_nombre, c.email as colaborador_email, c.rut as colaborador_rut,
                       c.cargo as colaborador_cargo, c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;