// backend/routes/asignacionRoutes.js - VERSIÓN ACTUALIZADA CON PRÉSTAMOS
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const multer = require('multer');

// Configurar directorio para documentos generados
const DOCS_DIR = path.join(__dirname, '../uploads/documentos');
const DOCUMENTOS_FISICOS_DIR = path.join(__dirname, '../uploads/documentos_fisicos');

if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}
if (!fs.existsSync(DOCUMENTOS_FISICOS_DIR)) {
    fs.mkdirSync(DOCUMENTOS_FISICOS_DIR, { recursive: true });
}

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
// FUNCIÓN PARA DIBUJAR FIRMA (IMAGEN O TEXTO)
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
// FUNCIÓN CORREGIDA PARA GENERAR ACTA DE ASIGNACIÓN
// ============================================
async function generarActaAsignacion(datos) {
    return new Promise(async (resolve, reject) => {
        try {
            const {
                id_asignacion,
                colaborador,
                productos,
                fecha_asignacion,
                motivo,
                observaciones,
                firma_trabajador,
                firma_gerente
            } = datos;

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // ========== ENCABEZADO ==========
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

            // 1. DATOS DE LA EMPRESA
            doc.font('Helvetica-Bold').fontSize(12).text('1. DATOS DE LA EMPRESA', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Razón Social: ${EMPRESA.nombre}`)
               .text(`RUT: ${EMPRESA.rut}`)
               .text(`Representante Legal: ${EMPRESA.representante_legal}`)
               .text(`Cargo: ${EMPRESA.cargo_representante}`)
               .text(`Domicilio: ${EMPRESA.domicilio}`)
               .moveDown(1);

            // 2. DATOS DEL TRABAJADOR
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

            // 3. DATOS DEL EQUIPO ENTREGADO
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
            productos.forEach((producto, index) => {
                doc.font('Helvetica').fontSize(9)
                   .text((index + 1).toString(), colPositions.num, currentY)
                   .text(producto.tipo || 'Equipo', colPositions.tipo, currentY)
                   .text(producto.marca || 'N/A', colPositions.marca, currentY)
                   .text(producto.modelo || 'N/A', colPositions.modelo, currentY)
                   .text(producto.numero_serie || 'N/A', colPositions.serie, currentY)
                   .text(producto.condicion || 'NUEVO', colPositions.estado, currentY)
                   .text((producto.cantidad || 1).toString(), colPositions.cantidad, currentY);
                currentY += 20;
                if (currentY > 700 && index < productos.length - 1) { doc.addPage(); currentY = 50; }
            });
            doc.moveDown(2);

            // Asegurar separación antes del punto 4
            
doc.moveDown(2); // deja espacio vertical
// 4. MOTIVO DE LA ASIGNACIÓN
doc.font('Helvetica-Bold').fontSize(12)
   .text('4. MOTIVO DE LA ASIGNACIÓN', colPositions.num, doc.y, { underline: true })
   .moveDown(0.5);

// Texto del motivo alineado al mismo margen que la tabla
doc.font('Helvetica').fontSize(9)
   .text(motivo || 'Asignación de equipo para uso laboral', colPositions.num, doc.y, { width: 520 });
doc.moveDown(2);

// 5. OBSERVACIONES
doc.font('Helvetica-Bold').fontSize(12)
   .text('5. OBSERVACIONES', colPositions.num, doc.y, { underline: true })
   .moveDown(0.5);

// Texto de observaciones alineado al mismo margen que la tabla
doc.font('Helvetica').fontSize(9)
   .text(observaciones || 'Sin observaciones', colPositions.num, doc.y, { width: 520 });
doc.moveDown(2);


                      // ========== SEGUNDA HOJA - FIRMAS ==========
            doc.addPage();
            
            // Espacio para separar del contenido anterior
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);

            // Firma Trabajador - RECIBE
            doc.font('Helvetica-Bold').fontSize(11).text('RECIBÍ CONFORME', { align: 'rigth' });
            doc.moveDown(1);
            
            const lineaTrabajadorY = doc.y;
            doc.moveTo(120, lineaTrabajadorY).lineTo(480, lineaTrabajadorY).stroke();
            dibujarFirma(doc, firma_trabajador, 120, lineaTrabajadorY - 28, colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA TRABAJADOR', { align: 'center' });
            doc.moveDown(3);

            // Firma Gerente - ENTREGA
            doc.font('Helvetica-Bold').fontSize(11).text('ENTREGÓ CONFORME', { align: 'right' });
            doc.moveDown(2);  // Espacio antes de la línea

            const lineaGerenteY = doc.y;
            doc.moveTo(120, lineaGerenteY).lineTo(480, lineaGerenteY).stroke();
            dibujarFirma(doc, firma_gerente, 120, lineaGerenteY - 28, EMPRESA.representante_legal);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text(EMPRESA.cargo_representante, { align: 'center' });
            doc.moveDown(3);
            

            // Nota al pie
            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la entrega de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

// ============================================
// FUNCIÓN PARA GENERAR ACTA DE RECEPCIÓN (IGUAL AL ACTA DE ASIGNACIÓN)
// ============================================
function generarActaRecepcion(datos) {
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
                firma_gerente
            } = datos;

            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // ========== ENCABEZADO IGUAL AL ACTA DE ASIGNACIÓN ==========
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

            // 1. DATOS DE LA EMPRESA
            doc.font('Helvetica-Bold').fontSize(12).text('1. DATOS DE LA EMPRESA', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Razón Social: ${EMPRESA.nombre}`)
               .text(`RUT: ${EMPRESA.rut}`)
               .text(`Representante Legal: ${EMPRESA.representante_legal}`)
               .text(`Cargo: ${EMPRESA.cargo_representante}`)
               .text(`Domicilio: ${EMPRESA.domicilio}`)
               .moveDown(1);

            // 2. DATOS DEL TRABAJADOR
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

            // 3. DATOS DEL EQUIPO RECIBIDO
            doc.font('Helvetica-Bold').fontSize(12).text('3. DATOS DEL EQUIPO RECIBIDO', { underline: true }).moveDown(0.5);

            // MISMA TABLA QUE EL ACTA DE ASIGNACIÓN
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
            productos.forEach((producto, index) => {
                doc.font('Helvetica').fontSize(9)
                   .text((index + 1).toString(), colPositions.num, currentY)
                   .text(producto.tipo || 'Equipo', colPositions.tipo, currentY)
                   .text(producto.marca || 'N/A', colPositions.marca, currentY)
                   .text(producto.modelo || 'N/A', colPositions.modelo, currentY)
                   .text(producto.numero_serie || 'N/A', colPositions.serie, currentY)
                   .text(condicion_entrega || 'BUENO', colPositions.estado, currentY)
                   .text((producto.cantidad || 1).toString(), colPositions.cantidad, currentY);
                currentY += 20;
                if (currentY > 700 && index < productos.length - 1) { doc.addPage(); currentY = 50; }
            });
            doc.moveDown(2);

            // 4. MOTIVO DE LA DEVOLUCIÓN (igual que en asignación)
            doc.font('Helvetica-Bold').fontSize(12)
               .text('4. MOTIVO DE LA DEVOLUCIÓN', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(motivo || 'No especificado', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            // 5. OBSERVACIONES (igual que en asignación)
            doc.font('Helvetica-Bold').fontSize(12)
               .text('5. OBSERVACIONES', colPositions.num, doc.y, { underline: true })
               .moveDown(0.5);
            doc.font('Helvetica').fontSize(9)
               .text(observaciones || 'Sin observaciones', colPositions.num, doc.y, { width: 520 });
            doc.moveDown(2);

            // ========== SEGUNDA HOJA - FIRMAS ALINEADAS A LA DERECHA ==========
            doc.addPage();
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);

            // Firma Trabajador - ENTREGÓ CONFORME (alineado a la derecha)
            doc.font('Helvetica-Bold').fontSize(11).text('ENTREGÓ CONFORME', { align: 'right' });
            doc.moveDown(1);
            
            const lineaTrabajadorY = doc.y;
            doc.moveTo(300, lineaTrabajadorY).lineTo(550, lineaTrabajadorY).stroke();
            dibujarFirma(doc, firma_trabajador, 350, lineaTrabajadorY - 28, colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA TRABAJADOR', { align: 'right' });
            doc.moveDown(4);

            // Firma Gerente - RECIBÍ CONFORME (alineado a la derecha)
            doc.font('Helvetica-Bold').fontSize(11).text('RECIBÍ CONFORME', { align: 'right' });
            doc.moveDown(1);

            const lineaGerenteY = doc.y;
            doc.moveTo(300, lineaGerenteY).lineTo(550, lineaGerenteY).stroke();
            dibujarFirma(doc, firma_gerente, 350, lineaGerenteY - 28, EMPRESA.representante_legal);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text(EMPRESA.cargo_representante, { align: 'right' });
            doc.moveDown(3);

            // Nota al pie
            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la recepción de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}


// ============================================
// ENDPOINTS - EL ORDEN IMPORTA
// ============================================

// GET - Obtener asignaciones activas (CON PRÉSTAMO)
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
            WHERE a.fecha_devolucion IS NULL
            ORDER BY a.fecha_asignacion DESC
        `);
        
        console.log(`✅ ${result.recordset.length} asignaciones activas encontradas`);
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /activas:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// GET - Descargar acta por filename (PÚBLICO)
router.get('/descargar/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        
        if (!filename || !filename.endsWith('.pdf')) {
            return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
        }
        
        const safeFilename = path.basename(filename);
        const filepath = path.join(DOCS_DIR, safeFilename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        console.log(`✅ Documento descargado: ${safeFilename}`);
        
    } catch (error) {
        console.error('Error descargando documento:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Generar acta de asignación
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
            firma_gerente,
            usuario_responsable
        } = req.body;
        
        if (!colaborador || !productos || productos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Datos incompletos: colaborador y productos son requeridos' 
            });
        }
        
        const pdfBuffer = await generarActaAsignacion({
            id_asignacion: id_asignacion || Date.now(),
            colaborador,
            productos,
            fecha_asignacion: fecha_asignacion || new Date(),
            motivo: motivo || 'Asignación de equipo',
            observaciones: observaciones || 'Sin observaciones',
            firma_trabajador: firma_trabajador || colaborador.nombre,
            firma_gerente: firma_gerente || EMPRESA.representante_legal
        });
        
        const filename = `acta_asignacion_${id_asignacion || Date.now()}.pdf`;
        const filepath = path.join(DOCS_DIR, filename);
        fs.writeFileSync(filepath, pdfBuffer);
        
        console.log(`✅ Acta de asignación generada: ${filename}`);
        
        res.json({
            success: true,
            message: 'Acta de asignación generada exitosamente',
            filename: filename,
            filepath: `/uploads/documentos/${filename}`
        });
        
    } catch (error) {
        console.error('❌ Error generando acta:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Generar acta de recepción
router.post('/generar-acta-recepcion', async (req, res) => {
    try {
        console.log('📥 POST /api/asignaciones/generar-acta-recepcion');
        
        const {
            id_asignacion,
            colaborador,
            productos,
            fecha_asignacion,
            fecha_recepcion,
            motivo,
            observaciones,
            condicion_entrega,
            firma_trabajador,
            firma_gerente,
            usuario_responsable
        } = req.body;
        
        if (!colaborador || !productos || productos.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Datos incompletos: colaborador y productos son requeridos' 
            });
        }
        
        const pdfBuffer = await generarActaRecepcion({
            id_asignacion: id_asignacion || Date.now(),
            colaborador,
            productos,
            fecha_asignacion: fecha_asignacion || new Date(),
            fecha_recepcion: fecha_recepcion || new Date(),
            motivo: motivo || 'Devolución de equipo',
            observaciones: observaciones || 'Sin observaciones',
            condicion_entrega: condicion_entrega || 'BUENO',
            firma_trabajador: firma_trabajador || colaborador.nombre,
            firma_gerente: firma_gerente || EMPRESA.representante_legal
        });
        
        const filename = `acta_recepcion_${id_asignacion || Date.now()}.pdf`;
        const filepath = path.join(DOCS_DIR, filename);
        fs.writeFileSync(filepath, pdfBuffer);
        
        console.log(`✅ Acta de recepción generada: ${filename}`);
        
        res.json({
            success: true,
            message: 'Acta de recepción generada exitosamente',
            filename: filename,
            filepath: `/uploads/documentos/${filename}`
        });
        
    } catch (error) {
        console.error('❌ Error generando acta:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Crear asignación y generar acta (CON PRÉSTAMO)
router.post('/', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        console.log('📥 POST /api/asignaciones');
        console.log('Body recibido:', req.body);
        
        const { 
            producto_id, 
            colaborador_id, 
            motivo, 
            observaciones, 
            fecha_asignacion,
            documento_path, 
            condicion_entrega, 
            firma_trabajador, 
            firma_gerente,
            es_prestamo  // NUEVO: campo para préstamo
        } = req.body;
        
        if (!producto_id || !colaborador_id) {
            return res.status(400).json({ success: false, message: 'producto_id y colaborador_id son requeridos' });
        }
        
        let productoIdNum, colaboradorIdNum;
        try {
            productoIdNum = validarId(producto_id, 'producto_id');
            colaboradorIdNum = validarId(colaborador_id, 'colaborador_id');
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        pool = await getConnection();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Verificar producto
            const productoCheck = await transaction.request()
                .input('id', sql.Int, productoIdNum)
                .query(`
                    SELECT p.id, p.id_estado_equipo, p.nombre, p.numero_serie, p.marca, p.modelo, p.condicion
                    FROM INV.productos p WHERE p.id = @id
                `);
            
            if (productoCheck.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            
            const producto = productoCheck.recordset[0];
            console.log(`📊 Producto: ${producto.nombre}, Estado: ${producto.id_estado_equipo === 1 ? 'DISPONIBLE' : getEstadoTexto(producto.id_estado_equipo)}`);
            
            if (producto.id_estado_equipo !== ESTADOS.DISPONIBLE) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: `Producto no disponible. Estado: ${getEstadoTexto(producto.id_estado_equipo)}` });
            }
            
            // Verificar colaborador
            const colaboradorCheck = await transaction.request()
                .input('id', sql.Int, colaboradorIdNum)
                .query(`
                    SELECT c.id, c.nombre, c.email, c.rut, c.cargo, c.departamento, c.direccion, c.fecha_nacimiento
                    FROM INV.colaboradores c WHERE c.id = @id AND c.estado = 'ACTIVO'
                `);
            
            if (colaboradorCheck.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
            }
            
            const colaborador = colaboradorCheck.recordset[0];
            const fechaAsignacionValue = fecha_asignacion ? new Date(fecha_asignacion) : new Date();
            
            // Insertar asignación (CON es_prestamo)
            const insertAsignacion = await transaction.request()
                .input('producto_id', sql.Int, productoIdNum)
                .input('colaborador_id', sql.Int, colaboradorIdNum)
                .input('id_estado_equipo', sql.Int, ESTADOS.ASIGNADO)
                .input('motivo', sql.NVarChar(500), motivo || 'Asignación de equipo')
                .input('fecha_asignacion', sql.DateTime, fechaAsignacionValue)
                .input('documento_path', sql.NVarChar(500), documento_path || '')
                .input('observaciones', sql.NVarChar(1000), observaciones || '')
                .input('condicion_entrega', sql.NVarChar(50), condicion_entrega || 'BUENO')
                .input('es_prestamo', sql.Bit, es_prestamo || false)  // NUEVO
                .query(`
                    INSERT INTO INV.asignaciones (
                        producto_id, colaborador_id, id_estado_equipo, motivo, fecha_asignacion, 
                        documento_path, observaciones, condicion_entrega, es_prestamo
                    ) VALUES (
                        @producto_id, @colaborador_id, @id_estado_equipo, @motivo, @fecha_asignacion,
                        @documento_path, @observaciones, @condicion_entrega, @es_prestamo
                    );
                    SELECT SCOPE_IDENTITY() as id;
                `);
            
            const asignacionId = insertAsignacion.recordset[0].id;
            console.log(`✅ Asignación insertada con ID: ${asignacionId}`);
            
            // Actualizar estado del producto a ASIGNADO
            await transaction.request()
                .input('id', sql.Int, productoIdNum)
                .input('id_estado_equipo', sql.Int, ESTADOS.ASIGNADO)
                .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);
            
            // Generar acta de asignación
            const tipoAsignacion = es_prestamo ? 'Préstamo' : 'Asignación';
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
                motivo: motivo || `${tipoAsignacion} de equipo`,
                observaciones: observaciones || 'Sin observaciones',
                firma_trabajador: firma_trabajador || colaborador.nombre,
                firma_gerente: firma_gerente || EMPRESA.representante_legal
            };
            
            const pdfBuffer = await generarActaAsignacion(documentoData);
            const filename = `acta_${es_prestamo ? 'prestamo' : 'asignacion'}_${asignacionId}_${Date.now()}.pdf`;
            const filepath = path.join(DOCS_DIR, filename);
            fs.writeFileSync(filepath, pdfBuffer);
            console.log(`✅ Acta de ${tipoAsignacion} guardada: ${filename}`);
            
            await transaction.commit();
            console.log('✅ Transacción CONFIRMADA');
            
            res.json({
                success: true,
                message: `${tipoAsignacion} creada correctamente a ${colaborador.nombre}`,
                data: {
                    id: asignacionId,
                    producto: { id: producto.id, nombre: producto.nombre, numero_serie: producto.numero_serie },
                    colaborador: { id: colaborador.id, nombre: colaborador.nombre, rut: colaborador.rut, email: colaborador.email, cargo: colaborador.cargo },
                    documento: { filename: filename, ruta: `/uploads/documentos/${filename}`, tipo: es_prestamo ? 'PRESTAMO' : 'ASIGNACION' },
                    es_prestamo: es_prestamo || false
                }
            });
            
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error('❌ Error en transacción:', error);
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error en POST /asignaciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Finalizar asignación y generar acta de recepción (CON PRÉSTAMO)
router.put('/:asignacionId/finalizar', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        const { asignacionId } = req.params;
        const { 
            fecha_devolucion, 
            motivo_devolucion,
            observaciones_devolucion, 
            condicion_entrega, 
            firma_trabajador_devolucion, 
            firma_gerente_devolucion 
        } = req.body;
        
        console.log(`📥 PUT /api/asignaciones/${asignacionId}/finalizar`);
        console.log('📥 Motivo:', motivo_devolucion);
        console.log('📥 Observaciones:', observaciones_devolucion);
        
        let asignacionIdNum;
        try {
            asignacionIdNum = validarId(asignacionId, 'ID de asignación');
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        pool = await getConnection();
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            const asignacionResult = await transaction.request()
                .input('id', sql.Int, asignacionIdNum)
                .query(`
                    SELECT a.id, a.producto_id, a.colaborador_id, a.fecha_asignacion, a.motivo, a.observaciones, a.es_prestamo,
                           p.nombre as producto_nombre, p.numero_serie, p.marca, p.modelo, p.condicion as producto_condicion,
                           c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                           c.cargo as colaborador_cargo, c.departamento as colaborador_departamento,
                           c.direccion as colaborador_direccion, c.fecha_nacimiento as colaborador_fecha_nacimiento
                    FROM INV.asignaciones a
                    LEFT JOIN INV.productos p ON a.producto_id = p.id
                    LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                    WHERE a.id = @id AND a.fecha_devolucion IS NULL
                `);
            
            if (asignacionResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Asignación no encontrada o ya finalizada' });
            }
            
            const asignacion = asignacionResult.recordset[0];
            const esPrestamo = asignacion.es_prestamo === true;
            const fechaRecepcionValue = fecha_devolucion ? new Date(fecha_devolucion) : new Date();
            
            // Combinar motivo y observaciones en el campo observaciones existente
            const observacionesCombinadas = `[MOTIVO DEVOLUCIÓN]: ${motivo_devolucion || 'No especificado'}
[OBSERVACIONES]: ${observaciones_devolucion || 'Sin observaciones'}
[CONDICIÓN]: ${condicion_entrega || 'BUENO'}
[FECHA RECEPCIÓN]: ${new Date().toLocaleString()}`;
            
            // Actualizar asignación - SOLO COLUMNAS EXISTENTES
            await transaction.request()
                .input('id', sql.Int, asignacionIdNum)
                .input('fecha_devolucion', sql.DateTime, fechaRecepcionValue)
                .input('condicion_entrega', sql.NVarChar(50), condicion_entrega || 'BUENO')
                .input('observaciones', sql.NVarChar(2000), observacionesCombinadas)
                .input('firma_trabajador_devolucion', sql.NVarChar, firma_trabajador_devolucion || null)
                .input('firma_gerente_devolucion', sql.NVarChar, firma_gerente_devolucion || null)
                .query(`
                    UPDATE INV.asignaciones 
                    SET fecha_devolucion = @fecha_devolucion, 
                        condicion_entrega = @condicion_entrega,
                        observaciones = @observaciones,
                        firma_trabajador_devolucion = @firma_trabajador_devolucion,
                        firma_gerente_devolucion = @firma_gerente_devolucion
                    WHERE id = @id
                `);
            
            // Actualizar producto a DISPONIBLE
            await transaction.request()
                .input('id', sql.Int, asignacion.producto_id)
                .input('id_estado_equipo', sql.Int, ESTADOS.DISPONIBLE)
                .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);
            
            // Generar acta de recepción
            const recepcionData = {
                id_asignacion: asignacionIdNum,
                colaborador: {
                    nombre: asignacion.colaborador_nombre,
                    rut: asignacion.colaborador_rut,
                    email: asignacion.colaborador_email,
                    cargo: asignacion.colaborador_cargo,
                    departamento: asignacion.colaborador_departamento,
                    direccion: asignacion.colaborador_direccion || EMPRESA.domicilio,
                    fecha_nacimiento: asignacion.colaborador_fecha_nacimiento || '1990-01-01'
                },
                productos: [{
                    tipo: 'Equipo',
                    nombre: asignacion.producto_nombre,
                    marca: asignacion.marca || 'N/A',
                    modelo: asignacion.modelo || 'N/A',
                    numero_serie: asignacion.numero_serie || 'N/A',
                    condicion_asignacion: asignacion.producto_condicion || 'NUEVO',
                    condicion_entrega: condicion_entrega || 'BUENO',
                    cantidad: 1
                }],
                fecha_recepcion: fechaRecepcionValue,
                motivo: motivo_devolucion || asignacion.motivo || 'Devolución de equipo',
                observaciones: observaciones_devolucion || 'Sin observaciones',
                condicion_entrega: condicion_entrega || 'BUENO',
                firma_trabajador: firma_trabajador_devolucion || asignacion.colaborador_nombre,
                firma_gerente: firma_gerente_devolucion || EMPRESA.representante_legal
            };
            
            const pdfBuffer = await generarActaRecepcion(recepcionData);
            const filename = `acta_recepcion_${asignacionIdNum}_${Date.now()}.pdf`;
            const filepath = path.join(DOCS_DIR, filename);
            fs.writeFileSync(filepath, pdfBuffer);
            console.log(`✅ Acta de recepción guardada: ${filename}`);
            
            await transaction.commit();
            console.log('✅ Devolución confirmada y acta generada');
            
            res.json({
                success: true,
                message: esPrestamo ? 'Préstamo finalizado correctamente' : 'Asignación finalizada correctamente',
                data: { 
                    documento: { 
                        filename: filename, 
                        ruta: `/uploads/documentos/${filename}`, 
                        tipo: 'RECEPCION' 
                    } 
                }
            });
            
        } catch (error) {
            if (transaction) await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// GET - Obtener historial de asignaciones (CON PRÉSTAMO)
router.get('/historial', async (req, res) => {
    try {
        console.log('📥 GET /api/asignaciones/historial');
        
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
                c.email as colaborador_email,
                c.cargo as colaborador_cargo
            FROM INV.asignaciones a
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            ORDER BY a.fecha_asignacion DESC
        `);
        
        console.log(`✅ ${result.recordset.length} registros encontrados`);
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener asignación por ID (CON PRÉSTAMO)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let idNum;
        try {
            idNum = validarId(id, 'ID de asignación');
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
        
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