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

const htmlPdfNode = require('html-pdf-node');

const DEFAULT_CHECKLIST_ITEMS = [
    { id: 'equipo_revisado', label: 'Equipo revisado físicamente', ok: true },
    { id: 'cargador', label: 'Cargador entregado', ok: true },
    { id: 'mouse', label: 'Mouse entregado', ok: true },
    { id: 'audifonos', label: 'Audífonos entregados', ok: true },
    { id: 'telefono', label: 'Teléfono entregado / Celular', ok: true },
    { id: 'esim', label: 'E-Sim / Chip de datos', ok: true },
    { id: 'windows_actualizado', label: 'Windows actualizado', ok: true },
    { id: 'drivers', label: 'Drivers instalados', ok: true },
    { id: 'dominio', label: 'Equipo agregado dominio', ok: true },
    { id: 'usuario_configurado', label: 'Usuario configurado', ok: true },
    { id: 'outlook', label: 'Outlook configurado', ok: true },
    { id: 'mfa', label: 'MFA habilitado', ok: true },
    { id: 'teams', label: 'Teams instalado', ok: true },
    { id: 'onedrive', label: 'OneDrive funcionando', ok: true },
    { id: 'softland', label: 'Softland instalado', ok: true },
    { id: 'unidad_softland', label: 'Unidad red Softland', ok: true },
    { id: 'vpn_instalada', label: 'VPN instalada', ok: true },
    { id: 'vpn_validada', label: 'VPN validada', ok: true },
    { id: 'internet', label: 'Internet validado', ok: true },
    { id: 'acceso_recursos', label: 'Acceso recursos internos', ok: true },
    { id: 'antivirus', label: 'Antivirus operativo', ok: true },
    { id: 'firewall', label: 'Firewall activo', ok: true }
];

function formatearFechaCorta(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const año = d.getFullYear();
    return `${dia}-${mes}-${año}`;
}

function construirHtmlChecklist(data) {
    const colaborador = data.colaborador || {};
    const producto = data.productos?.[0] || data.producto || {};
    const ticketInfo = data.ticketInfo || {};
    const specs = data.especificacionesTecnicas || data.especificaciones || {};
    const rawItems = data.checklistData?.items || data.items;
    
    // Si no hay items personalizados, utilizar la lista completa por defecto
    const itemsChecklist = (rawItems && rawItems.length > 0) ? rawItems : DEFAULT_CHECKLIST_ITEMS;
    const fechaText = formatearFechaCorta(data.fecha_asignacion || new Date());
    
    const usuarioRed = data.usuarioRed || data.checklistData?.usuarioRed || (colaborador.email ? colaborador.email.split('@')[0] : '');
    const claveRed = data.claveRed || data.checklistData?.claveRed || '********';

    // 1. Información Grid de 2 columnas pareadas exactas (Imagen 2)
    const rutVal = colaborador.rut && colaborador.rut !== '-' && colaborador.rut !== 'Sin RUT' ? colaborador.rut : '';
    const cargoDeptoVal = [colaborador.cargo, colaborador.departamento].filter(Boolean).join(' - ');
    const equipoModeloVal = `${producto.nombre || 'Equipo'} ${producto.marca || producto.modelo ? `(${[producto.marca, producto.modelo].filter(Boolean).join(' ')})` : ''}`.trim();
    const nroSerieVal = producto.numero_serie && producto.numero_serie !== 'N/A' && producto.numero_serie !== '-' ? producto.numero_serie : '';
    const ticketVal = ticketInfo.ticket ? `Ticket: ${ticketInfo.ticket} | Fecha: ${fechaText}` : `Ticket: - | Fecha: ${fechaText}`;
    const tecnicoVal = ticketInfo.tecnico || data.usuario_responsable || colaborador.nombre || 'Técnico TI';

    const infoGridHtml = `
        <div class="info-row"><div class="info-label">Colaborador:</div><div class="info-value">${colaborador.nombre || ''}</div></div>
        <div class="info-row"><div class="info-label">RUT:</div><div class="info-value">${rutVal}</div></div>
        <div class="info-row"><div class="info-label">Cargo / Depto:</div><div class="info-value">${cargoDeptoVal}</div></div>
        <div class="info-row"><div class="info-label">Usuario Red / Clave:</div><div class="info-value">${usuarioRed ? `${usuarioRed} / ${claveRed}` : ''}</div></div>
        <div class="info-row"><div class="info-label">Equipo / Modelo:</div><div class="info-value">${equipoModeloVal}</div></div>
        <div class="info-row"><div class="info-label">N° de Serie:</div><div class="info-value">${nroSerieVal}</div></div>
        <div class="info-row"><div class="info-label">N° Ticket / Fecha:</div><div class="info-value">${ticketVal}</div></div>
        <div class="info-row"><div class="info-label">Técnico TI:</div><div class="info-value">${tecnicoVal}</div></div>
    `;

    // 2. Checklist Items Table
    const itemsRowsHtml = itemsChecklist.map(item => {
        const isOk = item.ok !== false;
        const estadoCell = isOk 
            ? `<span style="color: #10B981; font-weight: bold;">✔ OK</span>` 
            : `<span style="color: #EF4444; font-weight: bold;">❌ PENDIENTE</span>`;
        const obsCell = item.observacion || (!isOk ? 'No entregado' : '-');
        return `<tr>
            <td>${item.label || item.id || ''}</td>
            <td style="text-align: center;">${estadoCell}</td>
            <td>${obsCell}</td>
        </tr>`;
    }).join('');

    // 3. Specifications Table
    const cpu = specs.cpu || '';
    const ram = specs.ram || '';
    const disco = specs.disco || '';
    const gpu = specs.gpu || '';
    const tipo = specs.tipo || producto.condicion || '';

    // 4. Firmas
    let firmaTrabajadorHtml = '';
    const firmaVal = data.firma_trabajador || colaborador.nombre || '';
    if (firmaVal && typeof firmaVal === 'string' && firmaVal.startsWith('data:image')) {
        firmaTrabajadorHtml = `<img src="${firmaVal}" style="max-height: 40px; max-width: 160px; object-fit: contain;" />`;
    } else {
        firmaTrabajadorHtml = `<svg viewBox="0 0 100 30" style="height: 30px; width: 100px;"><path d="M 10 25 Q 30 5, 50 20 T 90 10" fill="none" stroke="#222" stroke-width="1.5"/></svg>`;
    }

    const firmaGerenteHtml = `<svg viewBox="0 0 100 30" style="height: 30px; width: 100px;"><path d="M 10 20 Q 30 28, 50 10 T 90 18" fill="none" stroke="#222" stroke-width="1.5"/></svg>`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Checklist_Entrega_${(colaborador.nombre || 'Colaborador').replace(/\s+/g, '_')}</title>
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: white; padding: 8px 12px; color: #111; font-size: 8px; }
        .checklist-container { max-width: 100%; margin: 0 auto; background: white; border: 1.5px solid #333; padding: 10px 14px; }
        .header { text-align: center; margin-bottom: 6px; border-bottom: 1.5px solid #333; padding-bottom: 4px; }
        .header h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; }
        .header p { font-size: 8.5px; color: #444; font-weight: bold; }
        
        .section-title { font-size: 8.5px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 2px 6px; border: 1px solid #333; margin-top: 6px; margin-bottom: 3px; }
        
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px 8px; margin-bottom: 6px; }
        .info-row { display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 1px; }
        .info-label { font-weight: bold; width: 115px; font-size: 8px; color: #222; }
        .info-value { flex: 1; font-size: 8px; color: #111; }
        
        .checklist-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .checklist-table th { background-color: #f0f0f0; border: 1px solid #333; padding: 3px 6px; text-align: left; font-size: 7.5px; font-weight: bold; text-transform: uppercase; }
        .checklist-table td { border: 1px solid #333; padding: 1.8px 6px; font-size: 7.5px; line-height: 1.1; }
        
        .specs-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .specs-table td { border: 1px solid #333; padding: 3px 6px; font-size: 7.5px; }
        
        .signature-section { display: flex; justify-content: space-around; margin-top: 10px; padding-top: 2px; page-break-inside: avoid; }
        .signature-box { width: 42%; text-align: center; }
        .signature-img-container { height: 25px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px; }
        .signature-line { border-top: 1px solid #000; padding-top: 2px; font-weight: bold; font-size: 8.5px; }
        .signature-subtitle { font-size: 7.5px; color: #444; }
        .footer { margin-top: 6px; text-align: center; font-size: 7px; color: #666; border-top: 1px solid #ddd; padding-top: 3px; }
    </style>
</head>
<body>
    <div class="checklist-container">
        <div class="header">
            <h1>CHECKLIST DE ENTREGA Y PREPARACIÓN DE EQUIPO</h1>
            <p>DEPARTAMENTO DE TECNOLOGÍA E INNOVACIÓN</p>
        </div>

        <div class="section-title">1. INFORMACIÓN DEL COLABORADOR Y EQUIPO</div>
        <div class="info-grid">
            ${infoGridHtml}
        </div>

        <div class="section-title">2. VERIFICACIÓN Y CONFIGURACIÓN DE EQUIPO</div>
        <table class="checklist-table">
            <thead>
                <tr>
                    <th style="width: 55%">ITEM DE VERIFICACIÓN</th>
                    <th style="width: 15%; text-align: center">ESTADO</th>
                    <th style="width: 30%">OBSERVACIONES</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRowsHtml}
            </tbody>
        </table>

        <div class="section-title">3. ESPECIFICACIONES TÉCNICAS DEL EQUIPO</div>
        <table class="specs-table">
            <tbody>
                <tr>
                    <td style="width: 20%; font-weight: bold; background: #fafafa">CPU:</td>
                    <td style="width: 30%">${cpu}</td>
                    <td style="width: 20%; font-weight: bold; background: #fafafa">RAM:</td>
                    <td style="width: 30%">${ram}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; background: #fafafa">Disco:</td>
                    <td>${disco}</td>
                    <td style="font-weight: bold; background: #fafafa">GPU:</td>
                    <td>${gpu}</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; background: #fafafa">Tipo de Equipo:</td>
                    <td colspan="3">${tipo}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">4. CONFORMIDAD Y FIRMAS</div>
        <p style="font-size: 7.5px; margin-bottom: 6px; line-height: 1.2; color: #333;">
            El colaborador declara haber recibido el equipo especificado en el presente documento en óptimas condiciones de funcionamiento, habiéndose verificado todos los puntos del checklist anterior.
        </p>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-img-container">
                    ${firmaTrabajadorHtml}
                </div>
                <div class="signature-line">Firma del Colaborador</div>
                <div style="font-size: 8.5px; font-weight: bold; margin-top: 1px;">${colaborador.nombre || 'Colaborador'}</div>
                ${colaborador.rut ? `<div class="signature-subtitle">RUT: ${colaborador.rut}</div>` : ''}
            </div>

            <div class="signature-box">
                <div class="signature-img-container">
                    ${firmaGerenteHtml}
                </div>
                <div class="signature-line">V°B° Gerente de Tecnología</div>
                <div style="font-size: 8.5px; font-weight: bold; margin-top: 1px;">María Eugenia Nabalón</div>
                <div class="signature-subtitle">Gerente de Tecnología e Innovación</div>
            </div>
        </div>

        <div class="footer"><p>Documento oficial generado por Sistema de Inventario y Gestión TI</p></div>
    </div>
</body>
</html>`;
}

// Función de respaldo nativa (PDFKit) para la VM
function generarChecklistConPDFKit(data) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📌 Generando Checklist de Entrega con PDFKit (Fallback VM)...');
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const colaborador = data.colaborador || {};
            const producto = data.productos?.[0] || data.producto || {};
            const ticketInfo = data.ticketInfo || {};
            const specs = data.especificacionesTecnicas || data.especificaciones || {};
            const rawItems = data.checklistData?.items || data.items;
            const itemsChecklist = (rawItems && rawItems.length > 0) ? rawItems : DEFAULT_CHECKLIST_ITEMS;
            const fechaText = formatearFechaCorta(data.fecha_asignacion || new Date());
            const usuarioRed = data.usuarioRed || data.checklistData?.usuarioRed || (colaborador.email ? colaborador.email.split('@')[0] : '');
            const claveRed = data.claveRed || data.checklistData?.claveRed || '********';

            // Encabezado
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text('CHECKLIST DE ENTREGA Y PREPARACIÓN DE EQUIPO', { align: 'center' });
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#444444').text('DEPARTAMENTO DE TECNOLOGÍA E INNOVACIÓN', { align: 'center' }).moveDown(0.5);
            doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#333333').stroke();
            doc.moveDown(0.5);

            // Sección 1: Información
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('1. INFORMACIÓN DEL COLABORADOR Y EQUIPO').moveDown(0.3);
            doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
            
            const startY = doc.y;
            // Columna 1
            doc.text(`Colaborador: ${colaborador.nombre || ''}`, 30, startY);
            doc.text(`RUT: ${colaborador.rut || ''}`, 30, startY + 12);
            doc.text(`Cargo / Depto: ${[colaborador.cargo, colaborador.departamento].filter(Boolean).join(' - ')}`, 30, startY + 24);
            doc.text(`Usuario Red / Clave: ${usuarioRed ? `${usuarioRed} / ${claveRed}` : ''}`, 30, startY + 36);

            // Columna 2
            const equipoModelo = `${producto.nombre || 'Equipo'} ${[producto.marca, producto.modelo].filter(Boolean).join(' ')}`.trim();
            doc.text(`Equipo / Modelo: ${equipoModelo}`, 300, startY);
            doc.text(`N° de Serie: ${producto.numero_serie || 'N/A'}`, 300, startY + 12);
            doc.text(`Ticket / Fecha: Ticket: ${ticketInfo.ticket || '-'} | Fecha: ${fechaText}`, 300, startY + 24);
            doc.text(`Técnico TI: ${ticketInfo.tecnico || data.usuario_responsable || 'Técnico TI'}`, 300, startY + 36);

            doc.y = startY + 52;
            doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#CCCCCC').stroke();
            doc.moveDown(0.5);

            // Sección 2: Checklist Items
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('2. VERIFICACIÓN Y CONFIGURACIÓN DE EQUIPO').moveDown(0.3);

            let currentY = doc.y;
            // Header Tabla
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000');
            doc.text('ITEM DE VERIFICACIÓN', 35, currentY);
            doc.text('ESTADO', 320, currentY);
            doc.text('OBSERVACIONES', 400, currentY);
            currentY += 14;
            doc.moveTo(30, currentY).lineTo(565, currentY).strokeColor('#333333').stroke();
            currentY += 4;

            doc.font('Helvetica').fontSize(8);
            itemsChecklist.forEach((item) => {
                if (currentY > 740) {
                    doc.addPage();
                    currentY = 40;
                }
                const isOk = item.ok !== false;
                const estadoText = isOk ? '✔ OK' : '❌ PENDIENTE';
                const obsText = item.observacion || (!isOk ? 'No entregado' : '-');

                doc.fillColor('#000000').text(item.label || item.id || '', 35, currentY, { width: 270 });
                if (isOk) {
                    doc.fillColor('#10B981').text(estadoText, 320, currentY);
                } else {
                    doc.fillColor('#EF4444').text(estadoText, 320, currentY);
                }
                doc.fillColor('#333333').text(obsText, 400, currentY, { width: 160 });
                currentY += 12;
            });

            doc.y = currentY + 5;
            if (doc.y > 680) {
                doc.addPage();
            }

            // Sección 3: Especificaciones
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('3. ESPECIFICACIONES TÉCNICAS DEL EQUIPO').moveDown(0.3);
            doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
            const specY = doc.y;
            doc.text(`CPU: ${specs.cpu || 'N/A'}`, 35, specY);
            doc.text(`RAM: ${specs.ram || 'N/A'}`, 180, specY);
            doc.text(`Disco: ${specs.disco || 'N/A'}`, 320, specY);
            doc.text(`GPU: ${specs.gpu || 'N/A'}`, 440, specY);
            doc.text(`Tipo de Equipo: ${specs.tipo || producto.condicion || 'Standard'}`, 35, specY + 14);

            doc.y = specY + 34;

            // Sección 4: Conformidad y Firmas
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('4. CONFORMIDAD Y FIRMAS').moveDown(0.3);
            doc.font('Helvetica').fontSize(7.5).fillColor('#444444')
               .text('El colaborador declara haber recibido el equipo especificado en el presente documento en óptimas condiciones de funcionamiento, habiéndose verificado todos los puntos del checklist anterior.')
               .moveDown(1);

            const firmaY = doc.y + 20;
            // Firma Colaborador
            dibujarFirma(doc, data.firma_trabajador || colaborador.nombre, 60, firmaY, colaborador.nombre || 'Firma Colaborador');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('Firma del Colaborador', 60, firmaY + 15);
            doc.font('Helvetica').fontSize(8).text(colaborador.nombre || '', 60, firmaY + 27);
            if (colaborador.rut) doc.fontSize(7.5).text(`RUT: ${colaborador.rut}`, 60, firmaY + 37);

            // Firma Gerente
            dibujarFirma(doc, data.firma_gerente, 350, firmaY, 'María Eugenia Nabalón');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('V°B° Gerente de Tecnología', 350, firmaY + 15);
            doc.font('Helvetica').fontSize(8).text('María Eugenia Nabalón', 350, firmaY + 27);
            doc.fontSize(7.5).text('Gerente de Tecnología e Innovación', 350, firmaY + 37);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// Función para generar Checklist de Entrega PDF oficial
async function generarActaAsignacionPDF(data) {
    try {
        const htmlContent = construirHtmlChecklist(data);
        const options = {
            format: 'A4',
            printBackground: true,
            margin: { top: '4mm', right: '4mm', bottom: '4mm', left: '4mm' },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
                '--disable-software-rasterizer'
            ]
        };
        if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN) {
            options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
        }
        const file = { content: htmlContent };

        for (let intento = 1; intento <= 2; intento++) {
            try {
                const pdfBuffer = await htmlPdfNode.generatePdf(file, options);
                if (pdfBuffer && pdfBuffer.length > 0) {
                    return pdfBuffer;
                }
            } catch (err) {
                console.warn(`⚠️ Intento ${intento} con Puppeteer falló: ${err.message}`);
                if (intento < 2) await new Promise(res => setTimeout(res, 200));
            }
        }
        console.warn('⚠️ Puppeteer no está disponible o falló en esta máquina virtual. Generando PDF con PDFKit (Respaldo)...');
        return await generarChecklistConPDFKit(data);
    } catch (err) {
        console.error('⚠️ Fallback general activado para PDF de asignación:', err.message);
        return await generarChecklistConPDFKit(data);
    }
}

function construirHtmlChecklistRecepcion(data) {
    const colaborador = data.colaborador || {};
    const producto = data.productos?.[0] || data.producto || {};
    const fechaText = formatearFechaCorta(data.fecha_recepcion || data.fecha_asignacion || new Date());

    const accesoriosItems = [
        'Cargador / fuente de poder',
        'Cable de alimentación',
        'Docking station',
        'Mouse',
        'Teclado',
        'Mochila / bolso',
        'Adaptadores',
        'Otros accesorios asignados'
    ];

    const estadoFisicoItems = [
        'Equipo en buen estado general',
        'Pantalla sin daños visibles',
        'Carcasa sin golpes, fisuras o quebraduras',
        'Teclado completo y funcionando',
        'Touchpad funcionando',
        'Puertos USB / HDMI / red sin daños',
        'Cargador y conector de carga en buen estado',
        'Registrar rayas, golpes o daños encontrados',
        'Tomar fotografías del estado del equipo'
    ];

    const revisionTecnicaItems = [
        'Equipo enciende correctamente',
        'Windows inicia correctamente',
        'BIOS sin contraseña desconocida',
        'Disco detectado correctamente',
        'Memoria RAM detectada correctamente',
        'Wi-Fi funcionando',
        'Ethernet funcionando, si corresponde',
        'Cámara funcionando',
        'Micrófono funcionando',
        'Parlantes funcionando',
        'Batería revisada',
        'Windows activado'
    ];

    const seguridadItems = [
        'Verificar último usuario asignado',
        'Cerrar o eliminar sesiones corporativas',
        'Revisar acceso a Microsoft 365',
        'Retirar información o credenciales del usuario',
        'Respaldar información si fue solicitado',
        'Eliminar datos personales/corporativos antes de reasignar',
        'Revisar agente antivirus / EDR',
        'Revisar agente de monitoreo o administración remota',
        'Actualizar inventario indicando que el equipo fue devuelto'
    ];

    const destinoItems = [
        'Disponible para reasignación',
        'Requiere formateo',
        'Requiere reparación',
        'Requiere cambio de componentes',
        'Enviar a garantía',
        'Dar de baja',
        'Dejar en stock'
    ];

    const customChecklist = data.checklistRecepcion || data.checklistData || {};

    const renderTableRows = (itemsList, categoryKey) => {
        return itemsList.map((label, idx) => {
            const num = (idx + 1).toString().padStart(2, '0');
            const itemKey = `${categoryKey}_${idx}`;
            const itemState = customChecklist[itemKey] || { ok: true, na: false };
            
            const estadoHtml = itemState.ok !== false && !itemState.na
                ? `<span style="color: #10B981; font-weight: bold;">✔ OK</span>`
                : (itemState.na ? `<span style="color: #6B7280; font-weight: bold;">N/A</span>` : `<span style="color: #EF4444; font-weight: bold;">❌ PENDIENTE</span>`);

            return `<tr>
                <td style="width: 75%"><strong style="color: #6B21A8; font-size: 8px;">${num}</strong> ${label}</td>
                <td style="width: 25%; text-align: center;">${estadoHtml}</td>
            </tr>`;
        }).join('');
    };

    let firmaTrabajadorHtml = '';
    const firmaVal = data.firma_trabajador || colaborador.nombre || '';
    if (firmaVal && typeof firmaVal === 'string' && firmaVal.startsWith('data:image')) {
        firmaTrabajadorHtml = `<img src="${firmaVal}" style="max-height: 35px; max-width: 150px; object-fit: contain;" />`;
    } else {
        firmaTrabajadorHtml = `<svg viewBox="0 0 100 30" style="height: 25px; width: 90px;"><path d="M 10 25 Q 30 5, 50 20 T 90 10" fill="none" stroke="#222" stroke-width="1.5"/></svg>`;
    }

    const firmaGerenteHtml = `<svg viewBox="0 0 100 30" style="height: 25px; width: 90px;"><path d="M 10 20 Q 30 28, 50 10 T 90 18" fill="none" stroke="#222" stroke-width="1.5"/></svg>`;

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Checklist_Recepcion_${(colaborador.nombre || 'Colaborador').replace(/\s+/g, '_')}</title>
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: white; padding: 8px 12px; color: #111; font-size: 8px; }
        .checklist-container { max-width: 100%; margin: 0 auto; background: white; border: 1.5px solid #6B21A8; padding: 10px 14px; }
        
        .top-subline { text-align: right; font-size: 7.5px; color: #555; text-transform: uppercase; font-weight: bold; border-bottom: 2px solid #7E22CE; padding-bottom: 3px; margin-bottom: 6px; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; border-bottom: 1.5px solid #6B21A8; padding-bottom: 4px; }
        .header-title h1 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #4C1D95; letter-spacing: 0.5px; }
        .header-subtitle { text-align: right; font-size: 8px; color: #6B21A8; font-weight: bold; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .data-table td { border: 1px solid #C084FC; padding: 3px 6px; font-size: 7.5px; }
        .data-label { font-weight: bold; background: #FAF5FF; color: #581C87; width: 22%; }
        .data-value { width: 28%; color: #111; }
        
        .section-title { font-size: 8px; font-weight: bold; text-transform: uppercase; background: #F3E8FF; padding: 2px 6px; border: 1px solid #7E22CE; margin-top: 5px; margin-bottom: 3px; color: #581C87; display: flex; justify-content: space-between; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        .items-table td { border: 1px solid #E9D5FF; padding: 1.6px 6px; font-size: 7.5px; line-height: 1.1; }
        
        .obs-box { border: 1px solid #C084FC; min-height: 25px; padding: 4px 6px; font-size: 7.5px; margin-bottom: 6px; background: #FAF5FF; color: #333; }
        .resultado-box { display: flex; justify-content: space-around; border: 1px solid #7E22CE; background: #F3E8FF; padding: 3px; font-weight: bold; font-size: 8px; color: #581C87; margin-bottom: 6px; }
        
        .signature-section { display: flex; justify-content: space-around; margin-top: 8px; padding-top: 2px; page-break-inside: avoid; }
        .signature-box { width: 42%; text-align: center; }
        .signature-img-container { height: 25px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px; }
        .signature-line { border-top: 1px solid #000; padding-top: 2px; font-weight: bold; font-size: 8px; }
        .signature-subtitle { font-size: 7.5px; color: #444; }
        .footer { margin-top: 6px; text-align: center; font-size: 7px; color: #666; border-top: 1px solid #ddd; padding-top: 3px; }
    </style>
</head>
<body>
    <div class="checklist-container">
        <div class="top-subline">CONTROL DE ACTIVOS TECNOLÓGICOS</div>
        
        <div class="header">
            <div class="header-title">
                <h1>CHECKLIST DE RECEPCIÓN DE EQUIPO DEVUELTO</h1>
            </div>
            <div class="header-subtitle">
                <div>TI / INFRAESTRUCTURA</div>
                <div style="font-weight: normal; color: #555;">Control interno de activos tecnológicos</div>
            </div>
        </div>

        <table class="data-table">
            <tbody>
                <tr>
                    <td class="data-label">USUARIO QUE ENTREGA</td>
                    <td class="data-value">${colaborador.nombre || ''}</td>
                    <td class="data-label">FECHA</td>
                    <td class="data-value">${fechaText}</td>
                </tr>
                <tr>
                    <td class="data-label">TIPO DE EQUIPO</td>
                    <td class="data-value">${producto.tipo || producto.nombre || 'Equipo'}</td>
                    <td class="data-label">MARCA / MODELO</td>
                    <td class="data-value">${[producto.marca, producto.modelo].filter(Boolean).join(' / ') || '-'}</td>
                </tr>
                <tr>
                    <td class="data-label">N° DE SERIE</td>
                    <td class="data-value">${producto.numero_serie || '-'}</td>
                    <td class="data-label">HOSTNAME</td>
                    <td class="data-value">${data.hostname || producto.hostname || '-'}</td>
                </tr>
                <tr>
                    <td class="data-label">N° ACTIVO / INVENTARIO</td>
                    <td class="data-value">${data.activo || producto.codigo_inventario || '-'}</td>
                    <td class="data-label">RECIBIDO POR</td>
                    <td class="data-value">${data.recibido_por || data.usuario_responsable || 'Margarita Arraño'}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title"><span>ACCESORIOS RECIBIDOS</span> <span>ESTADO</span></div>
        <table class="items-table"><tbody>${renderTableRows(accesoriosItems, 'accesorios')}</tbody></table>

        <div class="section-title"><span>ESTADO FÍSICO</span> <span>ESTADO</span></div>
        <table class="items-table"><tbody>${renderTableRows(estadoFisicoItems, 'fisico')}</tbody></table>

        <div class="section-title"><span>REVISIÓN TÉCNICA</span> <span>ESTADO</span></div>
        <table class="items-table"><tbody>${renderTableRows(revisionTecnicaItems, 'tecnica')}</tbody></table>

        <div class="section-title"><span>SEGURIDAD Y ADMINISTRACIÓN</span> <span>ESTADO</span></div>
        <table class="items-table"><tbody>${renderTableRows(seguridadItems, 'seguridad')}</tbody></table>

        <div class="section-title"><span>DESTINO DEL EQUIPO</span> <span>ESTADO</span></div>
        <table class="items-table"><tbody>${renderTableRows(destinoItems, 'destino')}</tbody></table>

        <div class="section-title">OBSERVACIONES / DAÑOS DETECTADOS</div>
        <div class="obs-box">${data.observaciones || 'Sin observaciones registradas.'}</div>

        <div class="resultado-box">
            <span>RESULTADO DE RECEPCIÓN:</span>
            <span>CONFORME [ ${!data.observaciones ? '✔' : ' '} ]</span>
            <span>CON OBSERVACIONES [ ${data.observaciones ? '✔' : ' '} ]</span>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-img-container">
                    ${firmaTrabajadorHtml}
                </div>
                <div class="signature-line">FIRMA USUARIO QUE ENTREGA</div>
                <div style="font-size: 8px; font-weight: bold; margin-top: 1px;">${colaborador.nombre || 'Colaborador'}</div>
                ${colaborador.rut ? `<div class="signature-subtitle">RUT: ${colaborador.rut}</div>` : ''}
            </div>

            <div class="signature-box">
                <div class="signature-img-container">
                    ${firmaGerenteHtml}
                </div>
                <div class="signature-line">V°B° GERENTE DE TECNOLOGÍA</div>
                <div style="font-size: 8px; font-weight: bold; margin-top: 1px;">María Eugenia Nabalón</div>
                <div class="signature-subtitle">Gerente de Tecnología e Innovación</div>
            </div>
        </div>

        <div class="footer"><p>Documento oficial generado por Sistema de Inventario y Gestión TI</p></div>
    </div>
</body>
</html>`;
}

// Función de respaldo nativa (PDFKit) para Recepción en la VM
function generarRecepcionConPDFKit(data) {
    return new Promise((resolve, reject) => {
        try {
            console.log('📌 Generando Checklist de Recepción con PDFKit (Fallback VM)...');
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const colaborador = data.colaborador || {};
            const producto = data.productos?.[0] || data.producto || {};
            const fechaText = formatearFechaCorta(data.fecha_recepcion || data.fecha_asignacion || new Date());

            doc.font('Helvetica-Bold').fontSize(14).fillColor('#4C1D95').text('CHECKLIST DE RECEPCIÓN DE EQUIPO DEVUELTO', { align: 'center' });
            doc.font('Helvetica').fontSize(9).fillColor('#6B21A8').text('CONTROL INTERNO DE ACTIVOS TECNOLÓGICOS - DEPARTAMENTO DE TI', { align: 'center' }).moveDown(0.5);
            doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#7E22CE').stroke();
            doc.moveDown(0.5);

            doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
            const startY = doc.y;
            doc.text(`Usuario que entrega: ${colaborador.nombre || ''}`, 30, startY);
            doc.text(`Fecha: ${fechaText}`, 300, startY);
            doc.text(`Tipo de equipo: ${producto.tipo || producto.nombre || 'Equipo'}`, 30, startY + 12);
            doc.text(`Marca / Modelo: ${[producto.marca, producto.modelo].filter(Boolean).join(' / ') || '-'}`, 300, startY + 12);
            doc.text(`N° de Serie: ${producto.numero_serie || '-'}`, 30, startY + 24);
            doc.text(`Recibido por: ${data.recibido_por || data.usuario_responsable || 'Técnico TI'}`, 300, startY + 24);

            doc.y = startY + 40;
            doc.moveTo(30, doc.y).lineTo(565, doc.y).strokeColor('#CCCCCC').stroke();
            doc.moveDown(0.5);

            if (data.observaciones) {
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text('OBSERVACIONES / DAÑOS DETECTADOS:').moveDown(0.2);
                doc.font('Helvetica').fontSize(8.5).fillColor('#111111').text(data.observaciones).moveDown(0.5);
            }

            const firmaY = doc.y + 30;
            dibujarFirma(doc, data.firma_trabajador || colaborador.nombre, 60, firmaY, colaborador.nombre || 'Firma Usuario');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('FIRMA USUARIO QUE ENTREGA', 60, firmaY + 15);
            doc.font('Helvetica').fontSize(8).text(colaborador.nombre || '', 60, firmaY + 27);

            dibujarFirma(doc, data.firma_gerente, 350, firmaY, 'María Eugenia Nabalón');
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('V°B° GERENTE DE TECNOLOGÍA', 350, firmaY + 15);
            doc.font('Helvetica').fontSize(8).text('María Eugenia Nabalón', 350, firmaY + 27);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// Función para generar acta de recepción PDF (Plantilla HTML oficial Checklist de Recepción)
async function generarActaRecepcionPDF(data) {
    try {
        const htmlContent = construirHtmlChecklistRecepcion(data);
        const options = {
            format: 'A4',
            printBackground: true,
            margin: { top: '4mm', right: '4mm', bottom: '4mm', left: '4mm' },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
                '--disable-software-rasterizer'
            ]
        };
        if (process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN) {
            options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN;
        }
        const file = { content: htmlContent };

        for (let intento = 1; intento <= 2; intento++) {
            try {
                const pdfBuffer = await htmlPdfNode.generatePdf(file, options);
                if (pdfBuffer && pdfBuffer.length > 0) {
                    return pdfBuffer;
                }
            } catch (err) {
                console.warn(`⚠️ Intento ${intento} con Puppeteer Recepción falló: ${err.message}`);
                if (intento < 2) await new Promise(res => setTimeout(res, 200));
            }
        }
        console.warn('⚠️ Puppeteer Recepción no disponible. Generando PDF con PDFKit (Respaldo)...');
        return await generarRecepcionConPDFKit(data);
    } catch (err) {
        console.error('⚠️ Fallback general activado para PDF de recepción:', err.message);
        return await generarRecepcionConPDFKit(data);
    }
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
            
            const filename = `checklist_entrega_${data.id_asignacion}_${Date.now()}.pdf`;
            const filepath = path.join(DOCS_DIR, filename);
            
            fs.writeFileSync(filepath, pdfBuffer);
            
            console.log('✅ Checklist de entrega generado:', filename);
            
            res.json({ 
                success: true, 
                filename, 
                message: 'Checklist de entrega generado correctamente' 
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

module.exports = {
    ...asignacionController,
    generarActaAsignacionPDF,
    generarActaRecepcionPDF
};