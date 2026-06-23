// backend/routes/anexosRoutes.js - VERSIÓN COMPLETAMENTE LIMPIA (SIN ESTADO, SIN FIRMAS)
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Directorios
const ANEXOS_DIR = path.join(__dirname, '../uploads/anexos');
const ASSETS_DIR = path.join(__dirname, '../assets');

// Asegurar que los directorios existen
if (!fs.existsSync(ANEXOS_DIR)) {
    fs.mkdirSync(ANEXOS_DIR, { recursive: true });
}
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Colores del degradado de Ofimundo
const COLOR_GRADIENT = {
    start: '#2A3284',
    middle: '#70317A',
    end: '#D2446A'
};

// ============================================
// PARÁMETROS AJUSTABLES
// ============================================
const CONFIG = {
    marginTop: 0,
    marginLeft: 79,
    marginRight: 79,
    marginBottom: 64,
    
    titleSize: 13,
    sectionTitleSize: 11,
    textSize: 11,
    tableTextSize: 10,
    footerSize: 7,
    
    paragraphSpacing: 1.25,
    itemSpacing: 0.7,
    sectionSpacing: 0.8,
    
    footerOffset: 80,
    footerLineWidth: 4,
};

// Función para interpolar colores
function interpolateColor(color1, color2, ratio) {
    const hex = (c) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    const c1 = hex(color1);
    const c2 = hex(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Función para dibujar degradado
function drawGradientLine(doc, startX, y, width, height, colorStart, colorMiddle, colorEnd) {
    const sections = 100;
    const sectionWidth = width / sections;
    
    for (let i = 0; i <= sections / 2; i++) {
        const ratio = i / (sections / 2);
        const color = interpolateColor(colorStart, colorMiddle, ratio);
        doc.fillColor(color);
        doc.rect(startX + (i * sectionWidth), y, sectionWidth + 0.5, height).fill();
    }
    
    for (let i = 0; i <= sections / 2; i++) {
        const ratio = i / (sections / 2);
        const color = interpolateColor(colorMiddle, colorEnd, ratio);
        doc.fillColor(color);
        doc.rect(startX + ((sections / 2 + i) * sectionWidth), y, sectionWidth + 0.5, height).fill();
    }
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaObj = new Date(fecha);
    const dia = fechaObj.getDate();
    const mes = meses[fechaObj.getMonth()];
    const año = fechaObj.getFullYear();
    return `${dia} de ${mes} de ${año}`;
}

// Función para dibujar encabezado
function drawHeader(doc, logoPath) {
    const LOGO_WIDTH = 120;
    
    const hojasPath = path.join(ASSETS_DIR, 'hojas.png');
    if (fs.existsSync(hojasPath)) {
        doc.image(hojasPath, doc.page.width - 110, 0, { width: 110 });
    }
    
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, CONFIG.marginLeft, 50, { width: LOGO_WIDTH });
    } else {
        doc.fontSize(18).font('Calibri-Bold').fillColor(COLOR_GRADIENT.start);
        doc.text('Ofimundo', CONFIG.marginLeft, 40);
    }
}

// Función para dibujar pie de página - 3 columnas
function drawFooter(doc) {
    const footerY = doc.page.height - CONFIG.footerOffset;
    const lineY = footerY - 3;
    
    const sections = 100;
    const sectionWidth = doc.page.width / sections;
    for (let i = 0; i <= sections / 2; i++) {
        const ratio = i / (sections / 2);
        const color = interpolateColor(COLOR_GRADIENT.start, COLOR_GRADIENT.middle, ratio);
        doc.fillColor(color);
        doc.rect(i * sectionWidth, lineY, sectionWidth + 0.5, CONFIG.footerLineWidth).fill();
    }
    for (let i = 0; i <= sections / 2; i++) {
        const ratio = i / (sections / 2);
        const color = interpolateColor(COLOR_GRADIENT.middle, COLOR_GRADIENT.end, ratio);
        doc.fillColor(color);
        doc.rect((sections / 2 + i) * sectionWidth, lineY, sectionWidth + 0.5, CONFIG.footerLineWidth).fill();
    }
    
    const leftX = CONFIG.marginLeft;
    const rightX_end = doc.page.width - CONFIG.marginRight;
    const totalColWidth = rightX_end - leftX;
    const colWidth = totalColWidth / 3;
    const centerX = leftX + colWidth;
    const rightX = leftX + colWidth * 2;
    const lineSpacing = 10;
    const startY = footerY + 5;
    
    doc.font('Calibri-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#333333');
    doc.text('Ofimundo', leftX, startY, { align: 'left', width: colWidth });
    doc.font('Calibri').fontSize(CONFIG.footerSize).fillColor('#444444');
    doc.text('Teléfono +56 2 2810 4700', leftX, startY + lineSpacing, { align: 'left', width: colWidth });
    doc.text('Lota 2305, Providencia', leftX, startY + lineSpacing * 2, { align: 'left', width: colWidth });
    
    doc.font('Calibri').fontSize(CONFIG.footerSize).fillColor('#555555');
    doc.text('Visita nuestro sitio web:', centerX, startY, { align: 'center', width: colWidth });
    doc.font('Calibri-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#0A66C2');
    doc.text('www.ofimundo.cl', centerX, startY + lineSpacing, { align: 'center', width: colWidth });
    
    doc.font('Calibri').fontSize(CONFIG.footerSize).fillColor('#555555');
    doc.text('Más información en:', rightX, startY, { align: 'right', width: colWidth });
    doc.font('Calibri-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#0A66C2');
    doc.text('hola@ofimundo.cl', rightX, startY + lineSpacing, { align: 'right', width: colWidth });
}

// Función para generar PDF del anexo (SIN FIRMAS Y SIN ESTADO EN LA TABLA)
async function generarAnexoPDF(datos) {
    return new Promise((resolve, reject) => {
        try {
            const { colaborador, producto, empresa, fecha } = datos;
            const fechaFormateada = formatearFecha(fecha);
            
            const doc = new PDFDocument({ 
                margins: {
                    top: CONFIG.marginTop,
                    bottom: 35,
                    left: CONFIG.marginLeft,
                    right: CONFIG.marginRight
                },
                size: 'LETTER'
            });
            
            doc.registerFont('Calibri', path.join(ASSETS_DIR, 'calibri.ttf'));
            doc.registerFont('Calibri-Bold', path.join(ASSETS_DIR, 'calibrib.ttf'));
            
            const chunks = [];
            const logoPath = path.join(ASSETS_DIR, 'logo-ofimundo.png');
            
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            let empresaTexto = '';
            let rutEmpresa = '';
            let representante = '';
            let cedula = '';
            
            if (empresa === 'Global Horizon Spa') {
                empresaTexto = 'Global Horizon Spa.';
                rutEmpresa = '78.102.919-K';
                representante = 'Luciano Ossola';
                cedula = '24.183.963-K';
            } else if (empresa === 'Latam Lite Spa') {
                empresaTexto = 'Latam Lite Spa.';
                rutEmpresa = '76.301.299-9';
                representante = 'Marcelo Cáceres Rojas';
                cedula = '13.067.009-1';
            } else {
                empresaTexto = 'STUEDEMANN S.A.';
                rutEmpresa = '96.502.540-5';
                representante = 'Marcelo Cáceres Rojas';
                cedula = '13.067.009-1';
            }
            
            drawHeader(doc, logoPath);
            doc.y = 115;

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            doc.fontSize(CONFIG.titleSize).font('Calibri-Bold').fillColor('#000000');
            doc.text('ANEXO ENTREGA DE HERRAMIENTAS DE TRABAJO', { align: 'center' });
            doc.moveDown(0.8);

            doc.fontSize(CONFIG.textSize).font('Calibri');

            doc.text(`En Santiago, a ${fechaFormateada} entre, por una parte, ${empresaTexto}`, { continued: true });
            doc.font('Calibri-Bold').text(` Rut ${rutEmpresa},`, { continued: true });
            doc.font('Calibri').text(` representada por su Gerente General, don ${representante}, cédula de identidad N° ${cedula} ambos domiciliados para estos efectos en Lota 2305, comuna Providencia (en adelante, la "Compañía" o el "Empleador");`);
            doc.moveDown(CONFIG.paragraphSpacing);

            doc.text(`y por la otra, don ${colaborador.nombre}, cédula de identidad N° ${colaborador.rut} (en adelante, el "Trabajador", y juntamente con el Empleador, las "Partes"), se conviene el siguiente anexo al contrato de trabajo:`, { width: pageWidth, align: 'justify' });
            doc.moveDown(0.8);

            doc.font('Calibri-Bold').fontSize(CONFIG.sectionTitleSize);
            doc.text('PRIMERO: Entrega material de Herramienta de Trabajo.', { underline: true });
            doc.moveDown(CONFIG.paragraphSpacing);

            doc.font('Calibri').fontSize(CONFIG.textSize);
            doc.text('Las Partes, de común acuerdo, dejan constancia que con esta fecha la Compañía hace entrega al Trabajador las siguientes herramientas de trabajo:', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);

            const tableLeft = CONFIG.marginLeft;
            // 🔥 ELIMINADA LA COLUMNA "Estado" - ahora son 4 columnas
            const colWidths = [100, 100, 110, 130];
            const titleY = doc.y;

            doc.font('Calibri-Bold').fontSize(CONFIG.tableTextSize);
            doc.text('Tipo', tableLeft, titleY);
            doc.text('Marca', tableLeft + colWidths[0], titleY);
            doc.text('Modelo', tableLeft + colWidths[0] + colWidths[1], titleY);
            doc.text('N° Serie', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], titleY);

            let lineY = titleY + 12;
            doc.moveTo(tableLeft, lineY).lineTo(tableLeft + pageWidth, lineY).stroke();

            doc.font('Calibri').fontSize(CONFIG.tableTextSize);
            let rowY = lineY + 6;
            doc.text(producto.tipo || 'Equipo', tableLeft, rowY);
            doc.text(producto.marca || 'N/A', tableLeft + colWidths[0], rowY);
            doc.text(producto.modelo || 'N/A', tableLeft + colWidths[0] + colWidths[1], rowY);
            doc.text(producto.numero_serie || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowY);

            rowY += 14;
            doc.moveTo(tableLeft, rowY).lineTo(tableLeft + pageWidth, rowY).stroke();
            doc.y = rowY + 10;
            doc.moveDown(CONFIG.paragraphSpacing);

            const leftMargin = CONFIG.marginLeft;

            doc.text(
                'La(s) herramienta(s) de trabajo indicadas precedentemente (en adelante, las "Herramientas") es(son) entregada(s) al Trabajador con la finalidad de que éste pueda efectuar adecuadamente la prestación de los servicios convenidos en el contrato de trabajo suscrito entre las Partes.',
                leftMargin,
                doc.y,
                {
                    align: 'justify',
                    width: pageWidth
                }
            );
            doc.moveDown(CONFIG.paragraphSpacing);

            doc.text(
                'Las Partes declaran y dejan constancia que las Herramientas se encuentran en óptimas condiciones, obligándose el Trabajador a emplear el mayor cuidado en su conservación y a mantenerlas en perfecto estado.',
                leftMargin,
                doc.y,
                {
                    align: 'justify',
                    width: pageWidth
                }
            );

            drawFooter(doc);
            
            doc.addPage();
            drawHeader(doc, logoPath);
            doc.y = 115;
            
            doc.font('Calibri-Bold').fontSize(CONFIG.sectionTitleSize);
            doc.text('SEGUNDO: Obligaciones.', { underline: true });
            doc.moveDown(CONFIG.paragraphSpacing);
            
            doc.font('Calibri').fontSize(CONFIG.textSize);
            doc.text('Las Partes acuerdan que durante el tiempo que el Trabajador tenga en su poder las Herramientas, deberá observar las siguientes obligaciones:', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);
            
            const obligaciones = [
                '1) Deberá utilizarlas exclusivamente para prestar los servicios laborales contratados y debiendo velar siempre por su correcto y adecuado uso, cuidado y conservación.',
                '2) En el evento en que detectare cualquier falla, anomalía, deterioro o problema técnico deberá comunicarlo inmediatamente a la Compañía, especificando el problema y su incidencia. Este deberá hacerse verbalmente en primer término y posteriormente, dentro de las 24 horas siguientes, en forma escrita a su superior directo.',
                '3) Deberá devolver la Herramientas en cualquier oportunidad cuando le sea requerido por escrito por la Compañía, o bien, el último día de vigencia de la relación laboral.',
                '4) En el evento en que la relación laboral terminare entre las Partes, por cualquier causa o motivo, el Trabajador deberá devolver las Herramientas inmediatamente de producida la separación del Trabajador.',
                '5) En caso de su pérdida, robo, hurto o destrucción deberá observar el procedimiento y los plazos establecidos en la cláusula tercera siguiente.',
                '6) Las Herramientas singularizadas en la cláusula primera de este anexo y las demás a las que el Trabajador tuviere acceso en virtud de la relación laboral, son medios de propiedad del Empleador que están destinados a la actividad empresarial y deben ser utilizadas exclusivamente para el desarrollo de dicha actividad. Dichos elementos y recursos deben ser utilizados de forma adecuada, con responsabilidad, proporcionalidad y eficiencia.'
            ];
            
            for (let i = 0; i < obligaciones.length; i++) {
                doc.font('Calibri').fontSize(CONFIG.textSize - 1);
                doc.text(obligaciones[i], { indent: 20, width: pageWidth, align: 'justify' });
                if (i < obligaciones.length - 1) doc.moveDown(CONFIG.itemSpacing);
            }
            doc.moveDown(CONFIG.sectionSpacing);
            
            doc.font('Calibri-Bold').fontSize(CONFIG.sectionTitleSize);
            doc.text('TERCERO: Procedimiento en caso de su pérdida, robo, hurto o destrucción.', { underline: true });
            doc.moveDown(CONFIG.paragraphSpacing);
            
            doc.font('Calibri').fontSize(CONFIG.textSize - 1);
            doc.text('Como consecuencia de la responsabilidad de cuidado impuestas al Trabajador respecto de las Herramientas, en el evento de su pérdida, robo, hurto o destrucción por parte de terceros, aún sin que haya mediado responsabilidad del Trabajador, ésta se obliga a comunicarlo verbalmente y por escrito a ÁREA TI la Compañía, tan pronto tome conocimiento de la ocurrencia de tales hechos, señalando todos los antecedentes y circunstancias del caso de que disponga, a efectos que la Compañía haga uso de los derechos que la ley le confiere.', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);
            doc.text('De igual forma, las Partes acuerdan que en un plazo no superior a 24 horas de comunicado a la Compañía el hecho de su pérdida, robo, hurto o destrucción, el Trabajador deberá interponer una denuncia y/o constancia ante Carabineros de Chile y acreditar ante el Empleador haber efectuado esta denuncia y/o constancia por un medio fehaciente dentro del mismo plazo antes indicado, con la finalidad de que ésta persiga la eventual responsabilidad del o los involucrado(s) en los hechos correspondientes, ejerciendo los derechos que la ley le provee.', { width: pageWidth, align: 'justify' });
            
            drawFooter(doc);
            
            doc.addPage();
            drawHeader(doc, logoPath);
            doc.y = 115;
            
            doc.font('Calibri').fontSize(CONFIG.textSize - 1);
            doc.text('De la misma forma, las Partes acuerdan que en caso de ser necesario o de requerírselo la Compañía, el Trabajador deberá comparecer ante las autoridades encargadas de la investigación o ante los Tribunales de Justicia y prestar toda su colaboración en tales instancias.', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);
            doc.text('Los costos que impliquen la reparación o reposición de las Herramientas serán asumidos por el Trabajador cuando su daño, pérdida o destrucción tenga su origen en la falta del cuidado debido que debe emplear en el uso y conservación de las herramientas de trabajo, en la medida que así se acredite.', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);
            doc.text('Para estos efectos, en este mismo acto, el Trabajador autoriza expresamente al Empleador para que descuente directamente los montos involucrados de su remuneración mensual de conformidad a lo dispuesto en el artículo 58 inciso 3° del Código del Trabajo, y/o de los pagos a que pudiere tener derecho por concepto de feriado legal y/o proporcional, así como también de las eventuales indemnizaciones sustitutiva del aviso previo y por años de servicio a las que pudiere tener derecho de acuerdo a la ley al momento del término de su contrato de trabajo, de lo cual deberá dejarse constancia en el respectivo finiquito.', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.sectionSpacing);
            
            doc.font('Calibri-Bold').fontSize(CONFIG.sectionTitleSize);
            doc.text('CUARTO: Parte integrante del Contrato.', { underline: true });
            doc.moveDown(CONFIG.paragraphSpacing);
            
            doc.font('Calibri').fontSize(CONFIG.textSize);
            doc.text('Para todos los efectos legales y contractuales procedentes, el presente Anexo forma parte íntegra del contrato de trabajo, manteniéndose vigentes todas las otras cláusulas pactadas y no modificadas por el presente instrumento.', { width: pageWidth, align: 'justify' });
            doc.moveDown(CONFIG.paragraphSpacing);
            doc.text('La copia del presente Anexo al Contrato de Trabajo se envía de manera automática al correo electrónico personal informado por el Trabajador, y ha quedado disponible para ambas partes en el portal (BUK), al cual tiene acceso el Trabajador.', { width: pageWidth, align: 'justify' });
            
            drawFooter(doc);
            
            doc.end();
            
        } catch (error) {
            console.error('Error:', error);
            reject(error);
        }
    });
}

// ============================================
// ENDPOINTS
// ============================================

router.get('/empresas', async (req, res) => {
    res.json({ success: true, data: ['STUEDEMANN S.A', 'Global Horizon Spa', 'Latam Lite Spa'] });
});

router.get('/productos-disponibles', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT id, nombre, marca, modelo, numero_serie, condicion, id_estado_equipo
            FROM INV.productos WHERE id_estado_equipo != 6 ORDER BY nombre
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.get('/colaboradores', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT id, nombre, rut, email, cargo, departamento, direccion
            FROM INV.colaboradores ORDER BY nombre
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.post('/colaborador-temporal', async (req, res) => {
    try {
        const { nombre, rut, email, cargo, departamento, direccion } = req.body;
        if (!nombre || !rut) {
            return res.status(400).json({ success: false, message: 'Nombre y RUT son requeridos' });
        }
        const pool = await getConnection();
        const checkResult = await pool.request()
            .input('rut', sql.NVarChar, rut)
            .query(`SELECT id FROM INV.colaboradores WHERE rut = @rut`);
        
        if (checkResult.recordset.length > 0) {
            return res.json({ success: true, data: checkResult.recordset[0], existente: true });
        }
        
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('rut', sql.NVarChar, rut)
            .input('email', sql.NVarChar, email || null)
            .input('cargo', sql.NVarChar, cargo || null)
            .input('departamento', sql.NVarChar, departamento || null)
            .input('direccion', sql.NVarChar, direccion || null)
            .query(`
                INSERT INTO INV.colaboradores (nombre, rut, email, cargo, departamento, direccion)
                OUTPUT INSERTED.id
                VALUES (@nombre, @rut, @email, @cargo, @departamento, @direccion)
            `);
        res.json({ success: true, data: { id: result.recordset[0].id }, existente: false });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// GENERAR ANEXO
// ============================================
router.post('/generar', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        console.log('📥 POST /api/anexos/generar');
        
        const { colaborador, producto, empresa, observaciones, asignacion_id } = req.body;
        
        if (!colaborador?.id || !producto?.id || !empresa) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }
        
        pool = await getConnection();
        transaction = pool.transaction();
        await transaction.begin();
        
        let colaboradorId = colaborador.id;
        const checkColab = await transaction.request()
            .input('id', sql.Int, colaboradorId)
            .query(`SELECT id FROM INV.colaboradores WHERE id = @id`);
        
        if (checkColab.recordset.length === 0) {
            const newColab = await transaction.request()
                .input('nombre', sql.NVarChar, colaborador.nombre)
                .input('rut', sql.NVarChar, colaborador.rut)
                .input('email', sql.NVarChar, colaborador.email || null)
                .input('cargo', sql.NVarChar, colaborador.cargo || null)
                .input('departamento', sql.NVarChar, colaborador.departamento || null)
                .input('direccion', sql.NVarChar, colaborador.direccion || null)
                .query(`
                    INSERT INTO INV.colaboradores (nombre, rut, email, cargo, departamento, direccion)
                    OUTPUT INSERTED.id
                    VALUES (@nombre, @rut, @email, @cargo, @departamento, @direccion)
                `);
            colaboradorId = newColab.recordset[0].id;
        }
        
        // Insertar anexo sin estado ni firmas
        const result = await transaction.request()
            .input('colaborador_id', sql.Int, colaboradorId)
            .input('producto_id', sql.Int, producto.id)
            .input('asignacion_id', sql.Int, asignacion_id || null)
            .input('empresa', sql.NVarChar, empresa)
            .input('observaciones', sql.NVarChar(500), (observaciones || '').substring(0, 500))
            .input('usuario_creacion', sql.NVarChar, req.user?.usuario || 'Sistema')
            .query(`
                INSERT INTO INV.anexos (colaborador_id, producto_id, asignacion_id, empresa, observaciones, usuario_creacion, fecha_creacion, fecha_anexo)
                OUTPUT INSERTED.id
                VALUES (@colaborador_id, @producto_id, @asignacion_id, @empresa, @observaciones, @usuario_creacion, GETDATE(), GETDATE())
            `);
        
        const anexoId = result.recordset[0].id;
        console.log(`✅ Anexo ID: ${anexoId}`);
        
        const pdfBuffer = await generarAnexoPDF({
            colaborador: { ...colaborador, id: colaboradorId },
            producto: producto,
            empresa: empresa,
            fecha: new Date()
        });
        
        const filename = `anexo_${empresa.replace(/\s/g, '_')}_${colaborador.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`;
        const filepath = path.join(ANEXOS_DIR, filename);
        fs.writeFileSync(filepath, pdfBuffer);
        
        await transaction.request()
            .input('id', sql.Int, anexoId)
            .input('documento_generado', sql.NVarChar, filename)
            .query(`UPDATE INV.anexos SET documento_generado = @documento_generado WHERE id = @id`);
        
        await transaction.commit();
        
        console.log(`✅ Anexo generado: ${filename}`);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// OBTENER ANEXOS - SIN ESTADO
// ============================================
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                a.id, 
                a.colaborador_id, 
                a.producto_id, 
                a.asignacion_id, 
                a.empresa, 
                a.observaciones, 
                a.documento_generado, 
                a.fecha_creacion, 
                a.fecha_anexo,
                c.nombre as colaborador_nombre, 
                c.rut as colaborador_rut,
                p.nombre as producto_nombre, 
                p.numero_serie, 
                p.marca, 
                p.modelo
            FROM INV.anexos a
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            ORDER BY a.fecha_creacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error en GET /anexos:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// OBTENER ANEXO POR ID - SIN ESTADO
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    a.id, 
                    a.colaborador_id, 
                    a.producto_id, 
                    a.asignacion_id, 
                    a.empresa, 
                    a.observaciones, 
                    a.documento_generado, 
                    a.fecha_creacion, 
                    a.fecha_anexo,
                    c.nombre as colaborador_nombre, 
                    c.rut as colaborador_rut,
                    p.nombre as producto_nombre, 
                    p.numero_serie, 
                    p.marca, 
                    p.modelo
                FROM INV.anexos a
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                LEFT JOIN INV.productos p ON a.producto_id = p.id
                WHERE a.id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Anexo no encontrado' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DESCARGAR ANEXO
// ============================================
router.get('/descargar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT documento_generado FROM INV.anexos WHERE id = @id`);
        
        if (result.recordset.length === 0 || !result.recordset[0].documento_generado) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }
        
        const filename = result.recordset[0].documento_generado;
        const filepath = path.join(ANEXOS_DIR, filename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ELIMINAR ANEXO
// ============================================
router.delete('/:id', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        const { id } = req.params;
        
        pool = await getConnection();
        transaction = pool.transaction();
        await transaction.begin();
        
        const fileResult = await transaction.request()
            .input('id', sql.Int, id)
            .query(`SELECT documento_generado FROM INV.anexos WHERE id = @id`);
        
        await transaction.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM INV.anexos WHERE id = @id`);
        
        if (fileResult.recordset[0]?.documento_generado) {
            const filepath = path.join(ANEXOS_DIR, fileResult.recordset[0].documento_generado);
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
        
        await transaction.commit();
        res.json({ success: true, message: 'Anexo eliminado correctamente' });
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;