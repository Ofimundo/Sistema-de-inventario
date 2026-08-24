// backend/controllers/asignacionController.js - VERSIÓN COMPLETA Y CORREGIDA
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Datos de la empresa para los PDFs
const EMPRESA = {
    nombre: 'LATAM LITE SpA',
    rut: '76.301.299-9',
    representante_legal: 'María Eugenia Navalon',
    cargo_representante: 'Gerente de Tecnología e Innovación',
    domicilio: 'Lota Nº2305, comuna de Providencia',
    email: 'rrpp@latam-lite.cl',
    telefono: '+56 9 1234 5678'
};

// Directorio donde se guardan los documentos generados
const DOCS_DIR = path.join(__dirname, '../uploads/documentos');

// Asegurar que el directorio existe
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

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

// Función para dibujar firma (imagen o texto)
function dibujarFirma(doc, firma, x, y, nombrePorDefecto) {
    if (firma && typeof firma === 'string' && firma.startsWith('data:image')) {
        try {
            const base64Data = firma.split(',')[1];
            if (base64Data && base64Data.length > 0) {
                const imgBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imgBuffer, x, y - 40, { width: 150, height: 40 });
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

// Función para generar acta de asignación PDF (VERSIÓN CORREGIDA)
async function generarActaAsignacionPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            
            // Header
            doc.font('Helvetica-Bold').fontSize(18).text(EMPRESA.nombre, { align: 'center' }).moveDown(0.3);
            doc.font('Helvetica').fontSize(10)
               .text(`RUT: ${EMPRESA.rut} | ${EMPRESA.domicilio}`, { align: 'center' })
               .text(`Email: ${EMPRESA.email} - Fono: ${EMPRESA.telefono}`, { align: 'center' })
               .moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            
            // Título
            doc.font('Helvetica-Bold').fontSize(16).text('ACTA DE ASIGNACIÓN DE EQUIPO', { align: 'center' }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Fecha de Asignación: ${formatearFecha(data.fecha_asignacion)}`, { align: 'left' })
               .text(`ID Asignación: ${data.id_asignacion}`, { align: 'left' })
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
               .text(`Nombre: ${data.colaborador.nombre || ''}`)
               .text(`RUT: ${data.colaborador.rut || ''}`)
               .text(`Nacionalidad: ${data.colaborador.nacionalidad || 'chilena'}`)
               .text(`Profesión/Oficio: ${data.colaborador.cargo || ''}`)
               .text(`Email: ${data.colaborador.email || ''}`)
               .text(`Departamento: ${data.colaborador.departamento || 'Tecnología e Innovación'}`)
               .moveDown(1);
            
            // 3. DATOS DEL EQUIPO ENTREGADO
            doc.font('Helvetica-Bold').fontSize(12).text('3. DATOS DEL EQUIPO ENTREGADO', { underline: true }).moveDown(0.5);
            
            // Asegurar que productos sea un array
            const productosArray = Array.isArray(data.productos) ? data.productos : [data.producto || data.productos];
            
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
                if (currentY > 700 && index < productosArray.length - 1) { 
                    doc.addPage(); 
                    currentY = 50; 
                }
            });
            doc.moveDown(2);
            
            // 4. MOTIVO DE LA ASIGNACIÓN
            doc.font('Helvetica-Bold').fontSize(12).text('4. MOTIVO DE LA ASIGNACIÓN', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(data.motivo || 'Asignación de equipo para uso laboral', { width: 520 });
            doc.moveDown(2);
            
            // 5. OBSERVACIONES
            doc.font('Helvetica-Bold').fontSize(12).text('5. OBSERVACIONES', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(data.observaciones || 'Sin observaciones', { width: 520 });
            doc.moveDown(2);
            
            // 6. INFORMACIÓN DEL TICKET
            if (data.ticketInfo && data.ticketInfo.ticket) {
                doc.font('Helvetica-Bold').fontSize(12).text('6. INFORMACIÓN DEL TICKET', { underline: true }).moveDown(0.5);
                doc.font('Helvetica').fontSize(10)
                   .text(`N° Ticket: ${data.ticketInfo.ticket}`)
                   .text(`Técnico Responsable: ${data.ticketInfo.tecnico || 'No especificado'}`);
                doc.moveDown(2);
            }
            
            // 7. ESPECIFICACIONES TÉCNICAS
            if (data.especificaciones) {
                doc.font('Helvetica-Bold').fontSize(12).text('7. ESPECIFICACIONES TÉCNICAS', { underline: true }).moveDown(0.5);
                doc.font('Helvetica').fontSize(10)
                   .text(`CPU: ${data.especificaciones.cpu || 'N/A'}`)
                   .text(`RAM: ${data.especificaciones.ram || 'N/A'}`)
                   .text(`Disco: ${data.especificaciones.disco || 'N/A'}`)
                   .text(`GPU: ${data.especificaciones.gpu || 'N/A'}`)
                   .text(`Tipo: ${data.especificaciones.tipo || 'N/A'}`);
                doc.moveDown(2);
            }
            
            // FIRMAS (nueva página)
            doc.addPage();
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);
            
            // Firma del Trabajador
            doc.font('Helvetica-Bold').fontSize(11).text('RECIBÍ CONFORME', { align: 'right' });
            doc.moveDown(1);
            const lineaTrabajadorY = doc.y;
            doc.moveTo(120, lineaTrabajadorY).lineTo(480, lineaTrabajadorY).stroke();
            dibujarFirma(doc, data.firma_trabajador, 120, lineaTrabajadorY - 28, data.colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA DEL TRABAJADOR', { align: 'center' });
            doc.moveDown(4);
            
            // Firma del Gerente
            doc.font('Helvetica-Bold').fontSize(11).text('ENTREGÓ CONFORME', { align: 'right' });
            doc.moveDown(1);
            const lineaGerenteY = doc.y;
            doc.moveTo(120, lineaGerenteY).lineTo(480, lineaGerenteY).stroke();
            dibujarFirma(doc, data.firma_gerente, 120, lineaGerenteY - 28, EMPRESA.representante_legal);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text(EMPRESA.cargo_representante, { align: 'center' });
            doc.moveDown(3);
            
            // Footer
            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la entrega de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Función para generar acta de recepción PDF
async function generarActaRecepcionPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            
            // Header
            doc.font('Helvetica-Bold').fontSize(18).text(EMPRESA.nombre, { align: 'center' }).moveDown(0.3);
            doc.font('Helvetica').fontSize(10)
               .text(`RUT: ${EMPRESA.rut} | ${EMPRESA.domicilio}`, { align: 'center' })
               .text(`Email: ${EMPRESA.email} - Fono: ${EMPRESA.telefono}`, { align: 'center' })
               .moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            
            // Título
            doc.font('Helvetica-Bold').fontSize(16).text('ACTA DE RECEPCIÓN DE EQUIPO', { align: 'center' }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(`Fecha de Recepción: ${formatearFecha(data.fecha_recepcion)}`, { align: 'left' })
               .text(`ID Asignación: ${data.id_asignacion}`, { align: 'left' })
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
               .text(`Nombre: ${data.colaborador.nombre || ''}`)
               .text(`RUT: ${data.colaborador.rut || ''}`)
               .text(`Profesión/Oficio: ${data.colaborador.cargo || ''}`)
               .text(`Email: ${data.colaborador.email || ''}`)
               .text(`Departamento: ${data.colaborador.departamento || 'Tecnología e Innovación'}`)
               .moveDown(1);
            
            // 3. DATOS DEL EQUIPO RECIBIDO
            doc.font('Helvetica-Bold').fontSize(12).text('3. DATOS DEL EQUIPO RECIBIDO', { underline: true }).moveDown(0.5);
            
            const productosArray = Array.isArray(data.productos) ? data.productos : [data.producto || data.productos];
            
            const colPositions = { num: 40, tipo: 80, marca: 150, modelo: 220, serie: 300, estado: 380, cantidad: 460 };
            const tableTop = doc.y;
            doc.font('Helvetica-Bold').fontSize(9)
               .text('#', colPositions.num, tableTop)
               .text('TIPO', colPositions.tipo, tableTop)
               .text('MARCA', colPositions.marca, tableTop)
               .text('MODELO', colPositions.modelo, tableTop)
               .text('N° SERIE', colPositions.serie, tableTop)
               .text('ESTADO RECEPCIÓN', colPositions.estado, tableTop)
               .text('CANT.', colPositions.cantidad, tableTop);
            doc.moveTo(40, tableTop + 15).lineTo(560, tableTop + 15).stroke();
            
            let currentY = tableTop + 25;
            productosArray.forEach((producto, index) => {
                doc.font('Helvetica').fontSize(9)
                   .text((index + 1).toString(), colPositions.num, currentY)
                   .text(producto.tipo || producto.nombre || 'Equipo', colPositions.tipo, currentY)
                   .text(producto.marca || 'N/A', colPositions.marca, currentY)
                   .text(producto.modelo || 'N/A', colPositions.modelo, currentY)
                   .text(producto.numero_serie || 'N/A', colPositions.serie, currentY)
                   .text(data.condicion_entrega || 'BUENO', colPositions.estado, currentY)
                   .text((producto.cantidad || 1).toString(), colPositions.cantidad, currentY);
                currentY += 20;
                if (currentY > 700 && index < productosArray.length - 1) { 
                    doc.addPage(); 
                    currentY = 50; 
                }
            });
            doc.moveDown(2);
            
            // 4. MOTIVO DE LA DEVOLUCIÓN
            doc.font('Helvetica-Bold').fontSize(12).text('4. MOTIVO DE LA DEVOLUCIÓN', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(data.motivo || 'Devolución de equipo', { width: 520 });
            doc.moveDown(2);
            
            // 5. OBSERVACIONES
            doc.font('Helvetica-Bold').fontSize(12).text('5. OBSERVACIONES', { underline: true }).moveDown(0.5);
            doc.font('Helvetica').fontSize(10)
               .text(data.observaciones || 'Sin observaciones', { width: 520 });
            doc.moveDown(2);
            
            // FIRMAS
            doc.addPage();
            doc.moveDown(2);
            
            doc.font('Helvetica-Bold').fontSize(14).text('FIRMAS', { align: 'center', underline: true });
            doc.moveDown(3);
            
            // Firma del Trabajador (entrega)
            doc.font('Helvetica-Bold').fontSize(11).text('ENTREGÓ CONFORME', { align: 'right' });
            doc.moveDown(1);
            const lineaTrabajadorY = doc.y;
            doc.moveTo(120, lineaTrabajadorY).lineTo(480, lineaTrabajadorY).stroke();
            dibujarFirma(doc, data.firma_trabajador, 120, lineaTrabajadorY - 28, data.colaborador.nombre);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text('FIRMA DEL TRABAJADOR', { align: 'center' });
            doc.moveDown(4);
            
            // Firma del Gerente (recibe)
            doc.font('Helvetica-Bold').fontSize(11).text('RECIBÍ CONFORME', { align: 'right' });
            doc.moveDown(1);
            const lineaGerenteY = doc.y;
            doc.moveTo(120, lineaGerenteY).lineTo(480, lineaGerenteY).stroke();
            dibujarFirma(doc, data.firma_gerente, 120, lineaGerenteY - 28, EMPRESA.representante_legal);
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(9).text(EMPRESA.cargo_representante, { align: 'center' });
            doc.moveDown(3);
            
            // Footer
            doc.font('Helvetica-Oblique').fontSize(8)
               .text('Este documento es una representación digital de la recepción de equipos.', { align: 'center' })
               .text('Los datos contenidos en este documento son de carácter informativo.', { align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

const asignacionController = {
    /**
     * Crear una nueva asignación (CON PRÉSTAMO)
     */
    crearAsignacion: async (req, res) => {
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
                usuario_responsable,
                firma_trabajador,
                firma_gerente,
                es_prestamo
            } = req.body;
            
            if (!producto_id || !colaborador_id || !motivo) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos requeridos: producto_id, colaborador_id, motivo' 
                });
            }
            
            pool = await getConnection();
            transaction = pool.transaction();
            await transaction.begin();
            
            try {
                const productoResult = await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .query(`
                        SELECT id, id_estado_equipo, nombre, cantidad, es_granel 
                        FROM INV.productos 
                        WHERE id = @producto_id
                    `);
                
                if (productoResult.recordset.length === 0) {
                    throw new Error('Producto no encontrado');
                }
                
                const producto = productoResult.recordset[0];
                
                if (producto.id_estado_equipo !== 1) {
                    throw new Error(`El producto no está disponible para asignación. Estado actual: ${producto.id_estado_equipo === 2 ? 'ASIGNADO' : 'NO DISPONIBLE'}`);
                }
                
                const asignacionResult = await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('colaborador_id', sql.Int, colaborador_id)
                    .input('id_estado_equipo', sql.Int, 2)
                    .input('motivo', sql.NVarChar, motivo)
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .input('fecha_asignacion', sql.DateTime, fecha_asignacion || new Date())
                    .input('firma_trabajador', sql.NVarChar, firma_trabajador || null)
                    .input('firma_gerente', sql.NVarChar, firma_gerente || null)
                    .input('usuario_responsable', sql.NVarChar, usuario_responsable || 'Sistema')
                    .input('es_prestamo', sql.Bit, es_prestamo || false)
                    .query(`
                        INSERT INTO INV.asignaciones (
                            producto_id,
                            colaborador_id,
                            id_estado_equipo,
                            motivo,
                            observaciones,
                            fecha_asignacion,
                            firma_trabajador,
                            firma_gerente,
                            usuario_responsable,
                            es_prestamo,
                            fecha_creacion
                        )
                        OUTPUT INSERTED.*
                        VALUES (
                            @producto_id,
                            @colaborador_id,
                            @id_estado_equipo,
                            @motivo,
                            @observaciones,
                            @fecha_asignacion,
                            @firma_trabajador,
                            @firma_gerente,
                            @usuario_responsable,
                            @es_prestamo,
                            GETDATE()
                        )
                    `);
                
                const nuevaAsignacion = asignacionResult.recordset[0];
                
                const isGranel = producto.es_granel === 1 || producto.es_granel === true;
                const cantActual = producto.cantidad !== undefined && producto.cantidad !== null ? parseInt(producto.cantidad) : 1;
                
                if (isGranel) {
                    const nuevaCant = Math.max(0, cantActual - 1);
                    const nuevoEstado = nuevaCant <= 0 ? 5 : 1;
                    await transaction.request()
                        .input('producto_id', sql.Int, producto_id)
                        .input('nueva_cant', sql.Int, nuevaCant)
                        .input('nuevo_estado', sql.Int, nuevoEstado)
                        .query(`
                            UPDATE INV.productos 
                            SET cantidad = @nueva_cant,
                                id_estado_equipo = @nuevo_estado
                            WHERE id = @producto_id
                        `);
                } else {
                    await transaction.request()
                        .input('producto_id', sql.Int, producto_id)
                        .input('nuevo_estado', sql.Int, 2)
                        .query(`
                            UPDATE INV.productos 
                            SET id_estado_equipo = @nuevo_estado
                            WHERE id = @producto_id
                        `);
                }
                
                const tipoAsignacion = es_prestamo ? 'PRÉSTAMO' : 'ASIGNACION';
                const detallesHistorial = isGranel 
                    ? `Entrega a granel: 1 unidad(es). Asignado a colaborador ID: ${colaborador_id}. Motivo: ${motivo}`
                    : `${tipoAsignacion} de producto a colaborador ID: ${colaborador_id}. Motivo: ${motivo}`;

                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('accion', sql.NVarChar, isGranel ? 'ENTREGA_GRANEL' : tipoAsignacion)
                    .input('detalles', sql.NVarChar, detallesHistorial)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (
                            producto_id,
                            accion,
                            detalles,
                            fecha_hora
                        )
                        VALUES (
                            @producto_id,
                            @accion,
                            @detalles,
                            @fecha_hora
                        )
                    `);
                
                await transaction.commit();
                
                res.json({
                    success: true,
                    message: `${tipoAsignacion} creada exitosamente`,
                    data: {
                        id: nuevaAsignacion.id,
                        producto_id: nuevaAsignacion.producto_id,
                        colaborador_id: nuevaAsignacion.colaborador_id,
                        fecha_asignacion: nuevaAsignacion.fecha_asignacion,
                        motivo: nuevaAsignacion.motivo,
                        firma_trabajador: nuevaAsignacion.firma_trabajador,
                        firma_gerente: nuevaAsignacion.firma_gerente,
                        es_prestamo: nuevaAsignacion.es_prestamo
                    }
                });
                
            } catch (error) {
                if (transaction) await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en crearAsignacion:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al crear la asignación'
            });
        }
    },
    
    /**
     * Generar acta de asignación PDF (CORREGIDO)
     */
    generarActaAsignacion: async (req, res) => {
        try {
            const data = req.body;
            
            console.log('📤 Generando acta de asignación para ID:', data.id_asignacion);
            console.log('Datos recibidos:', JSON.stringify(data, null, 2));
            
            // Si es préstamo, no generar documento
            if (data.es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento');
                return res.json({ 
                    success: true, 
                    message: 'Préstamo registrado sin documento',
                    es_prestamo: true 
                });
            }
            
            // Validar datos requeridos
            if (!data.id_asignacion || !data.colaborador) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos: id_asignacion, colaborador'
                });
            }
            
            // Asegurar que los productos existan
            if (!data.productos && !data.producto) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos del producto'
                });
            }
            
            // Preparar datos para el PDF
            const pdfData = {
                id_asignacion: data.id_asignacion,
                colaborador: data.colaborador,
                productos: data.productos || [data.producto],
                fecha_asignacion: data.fecha_asignacion || new Date(),
                motivo: data.motivo || 'Asignación de equipo',
                observaciones: data.observaciones || 'Sin observaciones',
                firma_trabajador: data.firma_trabajador || data.colaborador.nombre,
                firma_gerente: data.firma_gerente || EMPRESA.representante_legal,
                ticketInfo: data.ticketInfo,
                especificaciones: data.especificaciones || (data.producto ? data.producto.especificaciones : null)
            };
            
            console.log('Generando PDF con datos:', {
                id: pdfData.id_asignacion,
                colaborador: pdfData.colaborador.nombre,
                productosCount: pdfData.productos.length
            });
            
            const pdfBuffer = await generarActaAsignacionPDF(pdfData);
            
            const filename = `acta_asignacion_${data.id_asignacion}_${Date.now()}.pdf`;
            const filepath = path.join(DOCS_DIR, filename);
            
            fs.writeFileSync(filepath, pdfBuffer);
            
            console.log('✅ Acta generada:', filename);
            
            res.json({ 
                success: true, 
                filename, 
                message: 'Acta de asignación generada correctamente' 
            });
            
        } catch (error) {
            console.error('❌ Error generando acta de asignación:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    },
    
    /**
     * Generar acta de recepción PDF
     */
    generarActaRecepcion: async (req, res) => {
        try {
            const data = req.body;
            
            console.log('📤 Generando acta de recepción para ID:', data.id_asignacion);
            
            // Si es préstamo, no generar documento
            if (data.es_prestamo) {
                console.log('⚠️ Es un préstamo, no se genera documento de recepción');
                return res.json({ 
                    success: true, 
                    message: 'Devolución de préstamo registrada sin documento',
                    es_prestamo: true 
                });
            }
            
            if (!data.id_asignacion || !data.colaborador) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos'
                });
            }
            
            const pdfBuffer = await generarActaRecepcionPDF({
                id_asignacion: data.id_asignacion,
                colaborador: data.colaborador,
                productos: data.productos || [data.producto],
                fecha_asignacion: data.fecha_asignacion,
                fecha_recepcion: data.fecha_recepcion || new Date(),
                motivo: data.motivo || 'Devolución de equipo',
                observaciones: data.observaciones || 'Sin observaciones',
                condicion_entrega: data.condicion_entrega || 'BUENO',
                firma_trabajador: data.firma_trabajador || data.colaborador.nombre,
                firma_gerente: data.firma_gerente || EMPRESA.representante_legal
            });
            
            const filename = `acta_recepcion_${data.id_asignacion}_${Date.now()}.pdf`;
            const filepath = path.join(DOCS_DIR, filename);
            
            fs.writeFileSync(filepath, pdfBuffer);
            
            res.json({ 
                success: true, 
                filename, 
                message: 'Acta de recepción generada correctamente' 
            });
            
        } catch (error) {
            console.error('❌ Error generando acta de recepción:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    },
    
    /**
     * Descargar documento por filename
     */
    descargarDocumento: async (req, res) => {
        try {
            const { filename } = req.params;
            console.log(`📥 Descargando documento: ${filename}`);
            
            // Validar filename para prevenir path traversal
            const safeFilename = path.basename(filename);
            const filepath = path.join(DOCS_DIR, safeFilename);
            
            if (!fs.existsSync(filepath)) {
                console.log('❌ Documento no encontrado:', filepath);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Documento no encontrado' 
                });
            }
            
            const stat = fs.statSync(filepath);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
            
            const fileStream = fs.createReadStream(filepath);
            fileStream.pipe(res);
            
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    },
    
    /**
     * Buscar documento por asignación ID y tipo
     */
    buscarDocumentoPorAsignacion: async (req, res) => {
        try {
            const { asignacionId, tipo } = req.params;
            console.log(`🔍 Buscando documento: asignacionId=${asignacionId}, tipo=${tipo}`);
            
            if (!fs.existsSync(DOCS_DIR)) {
                return res.json({ success: false, message: 'No se encontró el documento', filename: null });
            }
            
            const files = fs.readdirSync(DOCS_DIR);
            const pattern = tipo === 'asignacion' 
                ? `acta_asignacion_${asignacionId}` 
                : `acta_recepcion_${asignacionId}`;
            
            // Buscar el archivo más reciente que coincida con el patrón
            const foundFiles = files.filter(file => file.includes(pattern) && file.endsWith('.pdf'));
            
            if (foundFiles.length > 0) {
                // Ordenar por fecha de modificación (más reciente primero)
                const sortedFiles = foundFiles.sort((a, b) => {
                    const statA = fs.statSync(path.join(DOCS_DIR, a));
                    const statB = fs.statSync(path.join(DOCS_DIR, b));
                    return statB.mtimeMs - statA.mtimeMs;
                });
                
                res.json({
                    success: true,
                    data: { filename: sortedFiles[0] }
                });
            } else {
                res.json({ success: false, message: 'Documento no encontrado', filename: null });
            }
        } catch (error) {
            console.error('❌ Error en buscarDocumentoPorAsignacion:', error);
            res.status(500).json({ success: false, message: error.message, filename: null });
        }
    },
    
    /**
     * Obtener asignaciones activas
     */
    getAsignacionesActivas: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/activas');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.fecha_devolucion IS NULL AND p.id_estado_equipo = 2
                ORDER BY a.fecha_asignacion DESC
            `);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignacionesActivas:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Obtener todas las asignaciones
     */
    getAsignaciones: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.observaciones_devolucion,
                    a.condicion_entrega,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.email as colaborador_email,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM INV.asignaciones a
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                ORDER BY a.fecha_asignacion DESC
            `);
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignaciones:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },
    
    /**
     * Obtener asignación por ID
     */
    getAsignacionById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 GET /api/asignaciones/${id}`);
            
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        a.id,
                        a.producto_id,
                        a.colaborador_id,
                        a.id_estado_equipo,
                        a.motivo,
                        a.observaciones,
                        a.fecha_asignacion,
                        a.fecha_devolucion,
                        a.firma_trabajador,
                        a.firma_gerente,
                        a.usuario_responsable,
                        a.observaciones_devolucion,
                        a.condicion_entrega,
                        a.es_prestamo,
                        p.nombre as producto_nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.id_estado_equipo as producto_estado,
                        c.nombre as colaborador_nombre,
                        c.rut as colaborador_rut,
                        c.email as colaborador_email,
                        c.cargo as colaborador_cargo,
                        c.departamento as colaborador_departamento
                    FROM INV.asignaciones a
                    LEFT JOIN INV.productos p ON a.producto_id = p.id
                    LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                    WHERE a.id = @id
                `);
            
            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: result.recordset[0]
            });
            
        } catch (error) {
            console.error('❌ Error en getAsignacionById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    /**
     * Finalizar asignación (devolución)
     */
    finalizarAsignacion: async (req, res) => {
        let pool;
        let transaction;
        
        try {
            const { id } = req.params;
            const { 
                fecha_devolucion, 
                motivo_devolucion,
                observaciones_devolucion, 
                condicion_entrega, 
                firma_trabajador_devolucion, 
                firma_gerente_devolucion 
            } = req.body;
            
            console.log(`📥 PUT /api/asignaciones/${id}/finalizar`);
            
            if (!id) {
                return res.status(400).json({ success: false, message: 'ID de asignación requerido' });
            }
            
            pool = await getConnection();
            transaction = pool.transaction();
            await transaction.begin();
            
            try {
                const asignacionResult = await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        SELECT producto_id, colaborador_id, es_prestamo, motivo, observaciones
                        FROM INV.asignaciones 
                        WHERE id = @id AND fecha_devolucion IS NULL
                    `);
                
                if (asignacionResult.recordset.length === 0) {
                    throw new Error('Asignación no encontrada o ya finalizada');
                }
                
                const asignacion = asignacionResult.recordset[0];
                const esPrestamo = asignacion.es_prestamo === true || asignacion.es_prestamo === 1;
                
                const observacionesCombinadas = `[MOTIVO DEVOLUCIÓN]: ${motivo_devolucion || (esPrestamo ? 'Devolución de préstamo' : 'No especificado')}
[OBSERVACIONES]: ${observaciones_devolucion || 'Sin observaciones'}
[CONDICIÓN]: ${condicion_entrega || 'BUENO'}
[FECHA RECEPCIÓN]: ${new Date().toLocaleString()}`;
                
                await transaction.request()
                    .input('id', sql.Int, id)
                    .input('fecha_devolucion', sql.DateTime, fecha_devolucion || new Date())
                    .input('observaciones', sql.NVarChar, observacionesCombinadas)
                    .input('condicion_entrega', sql.NVarChar, condicion_entrega || 'BUENO')
                    .input('firma_trabajador_devolucion', sql.NVarChar, firma_trabajador_devolucion || null)
                    .input('firma_gerente_devolucion', sql.NVarChar, firma_gerente_devolucion || null)
                    .query(`
                        UPDATE INV.asignaciones 
                        SET 
                            fecha_devolucion = @fecha_devolucion,
                            observaciones = @observaciones,
                            condicion_entrega = @condicion_entrega,
                            firma_trabajador_devolucion = @firma_trabajador_devolucion,
                            firma_gerente_devolucion = @firma_gerente_devolucion
                        WHERE id = @id
                    `);
                
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('nuevo_estado', sql.Int, 1)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @nuevo_estado
                        WHERE id = @producto_id
                    `);
                
                const tipoOperacion = esPrestamo ? 'DEVOLUCION_PRESTAMO' : 'DEVOLUCION';
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('accion', sql.NVarChar, tipoOperacion)
                    .input('detalles', sql.NVarChar, `${esPrestamo ? 'Devolución de préstamo' : 'Devolución de producto'}. Motivo: ${motivo_devolucion || 'No especificado'}. Condición: ${condicion_entrega || 'BUENO'}`)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (
                            producto_id,
                            accion,
                            detalles,
                            fecha_hora
                        )
                        VALUES (
                            @producto_id,
                            @accion,
                            @detalles,
                            @fecha_hora
                        )
                    `);
                
                await transaction.commit();
                
                res.json({
                    success: true,
                    message: esPrestamo ? 'Devolución de préstamo registrada exitosamente' : 'Devolución registrada exitosamente',
                    data: {
                        es_prestamo: esPrestamo,
                        documento: !esPrestamo ? { filename: `acta_recepcion_${id}.pdf` } : null
                    }
                });
                
            } catch (error) {
                if (transaction) await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en finalizarAsignacion:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al finalizar la asignación'
            });
        }
    },
    
    /**
     * Obtener estadísticas generales
     */
    getEstadisticas: async (req, res) => {
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
            console.error('❌ Error en getEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: {
                    totalAsignaciones: 0,
                    activas: 0,
                    completadas: 0,
                    totalPrestamos: 0,
                    prestamosActivos: 0
                }
            });
        }
    },
    
    /**
     * Obtener solo préstamos activos
     */
    getPrestamosActivos: async (req, res) => {
        try {
            console.log('📥 GET /api/asignaciones/prestamos/activos');
            
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    a.id,
                    a.producto_id,
                    a.colaborador_id,
                    a.id_estado_equipo,
                    a.motivo,
                    a.observaciones,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.firma_trabajador,
                    a.firma_gerente,
                    a.usuario_responsable,
                    a.es_prestamo,
                    p.nombre as producto_nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.id_estado_equipo as producto_estado,
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
            
            res.json({
                success: true,
                data: result.recordset
            });
            
        } catch (error) {
            console.error('❌ Error en getPrestamosActivos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    }
};

module.exports = asignacionController;