const fs = require('fs');
const file = 'backend/routes/anexosRoutes.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Reemplazar drawHeader para incluir las hojas en esquina superior derecha
const oldDrawHeader = `// Función para dibujar encabezado
function drawHeader(doc, logoPath) {
    const LOGO_WIDTH = 120;
    
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, CONFIG.marginLeft, 50, { width: LOGO_WIDTH });
    } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor(COLOR_GRADIENT.start);
        doc.text('Ofimundo', CONFIG.marginLeft, 40);
    }
}`;

const newDrawHeader = `// Función para dibujar encabezado
function drawHeader(doc, logoPath) {
    const LOGO_WIDTH = 120;
    
    // Dibujar hojas decorativas en esquina superior derecha
    const hojasPath = path.join(ASSETS_DIR, 'hojas.png');
    if (fs.existsSync(hojasPath)) {
        const hojasWidth = 110;
        doc.image(hojasPath, doc.page.width - hojasWidth, 0, { width: hojasWidth });
    }
    
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, CONFIG.marginLeft, 50, { width: LOGO_WIDTH });
    } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor(COLOR_GRADIENT.start);
        doc.text('Ofimundo', CONFIG.marginLeft, 40);
    }
}`;

content = content.replace(oldDrawHeader, newDrawHeader);

// 2. Reemplazar drawFooter para tener 3 columnas bien formateadas
const oldDrawFooter = `// Función para dibujar pie de página
function drawFooter(doc) {
    const footerY = doc.page.height - CONFIG.footerOffset;
    const startX = CONFIG.marginLeft;
    const endX = 545;
    const totalWidth = endX - startX;
    
    drawGradientLine(doc, startX, footerY - 3, totalWidth, CONFIG.footerLineWidth, 
                     COLOR_GRADIENT.start, COLOR_GRADIENT.middle, COLOR_GRADIENT.end);
    
    doc.fontSize(CONFIG.footerSize).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Ofimundo', CONFIG.marginLeft, footerY + 5);
    doc.text('Teléfono +56 2 2810 4700', CONFIG.marginLeft, footerY + 15);
    doc.text('Lota 2305, Providencia, Santiago-Chile', CONFIG.marginLeft, footerY + 25);
    
    doc.text('Visita nuestro sitio web:', 350, footerY + 5, { align: 'right' });
    doc.text('www.ofimundo.cl', 350, footerY + 15, { align: 'right' });
    doc.text('Más información en: hola@ofimundo.cl', 350, footerY + 25, { align: 'right' });
}`;

const newDrawFooter = `// Función para dibujar pie de página - 3 columnas
function drawFooter(doc) {
    const footerY = doc.page.height - CONFIG.footerOffset;
    const startX = 0;
    const totalWidth = doc.page.width;
    const lineY = footerY - 3;
    
    // Línea degradada de borde a borde
    const sections = 100;
    const sectionWidth = totalWidth / sections;
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
    
    // 3 columnas
    const marginX = 40;
    const usableWidth = doc.page.width - (marginX * 2);
    const colWidth = usableWidth / 3;
    const leftX = marginX;
    const centerX = marginX + colWidth;
    const rightX = marginX + (colWidth * 2);
    const lineSpacing = 10;
    const startY = footerY + 5;
    
    // Columna izquierda
    doc.font('Helvetica-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#333333');
    doc.text('Ofimundo', leftX, startY, { align: 'left', width: colWidth });
    doc.font('Helvetica').fontSize(CONFIG.footerSize).fillColor('#444444');
    doc.text('Teléfono +56 2 2810 4700', leftX, startY + lineSpacing, { align: 'left', width: colWidth });
    doc.text('Lota 2305, Providencia', leftX, startY + (lineSpacing * 2), { align: 'left', width: colWidth });
    
    // Columna centro
    doc.font('Helvetica').fontSize(CONFIG.footerSize).fillColor('#555555');
    doc.text('Visita nuestro sitio web:', centerX, startY, { align: 'center', width: colWidth });
    doc.font('Helvetica-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#0A66C2');
    doc.text('www.ofimundo.cl', centerX, startY + lineSpacing, { align: 'center', width: colWidth });
    
    // Columna derecha
    doc.font('Helvetica').fontSize(CONFIG.footerSize).fillColor('#555555');
    doc.text('Más información en:', rightX, startY, { align: 'right', width: colWidth });
    doc.font('Helvetica-Bold').fontSize(CONFIG.footerSize + 1).fillColor('#0A66C2');
    doc.text('hola@ofimundo.cl', rightX, startY + lineSpacing, { align: 'right', width: colWidth });
}`;

content = content.replace(oldDrawFooter, newDrawFooter);

fs.writeFileSync(file, content);
console.log('✅ drawHeader (hojas) y drawFooter (3 columnas) actualizados correctamente.');
