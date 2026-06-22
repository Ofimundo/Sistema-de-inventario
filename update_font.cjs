const fs = require('fs');
const file = 'backend/routes/anexosRoutes.js';
let content = fs.readFileSync(file, 'utf8');

const registerFonts = `            const logoPath = path.join(ASSETS_DIR, 'logo-ofimundo.png');
            
            // Registrar fuentes Calibri
            const fontRegular = path.join(ASSETS_DIR, 'calibri.ttf');
            const fontBold = path.join(ASSETS_DIR, 'calibrib.ttf');
            if (fs.existsSync(fontRegular)) { doc.registerFont('Calibri', fontRegular); }
            if (fs.existsSync(fontBold)) { doc.registerFont('Calibri-Bold', fontBold); }
`;
content = content.replace(/\s*const logoPath = path\.join\(ASSETS_DIR, 'logo-ofimundo\.png'\);/, registerFonts);

// Aumentar la separacion (lineGap) y usar Calibri
content = content.replace(/doc\.font\('Helvetica'\)\.fontSize\(CONFIG\.fontSize\);/g, 
  "doc.font('Calibri').fontSize(CONFIG.fontSize).lineGap(4);");

content = content.replace(/font\('Helvetica'\)/g, "font('Calibri')");
content = content.replace(/font\('Helvetica-Bold'\)/g, "font('Calibri-Bold')");

fs.writeFileSync(file, content);
