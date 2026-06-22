const fs = require('fs');
const file = 'backend/routes/anexosRoutes.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Revertir la línea combinada de chunks + logoPath + registro de fuentes
// La línea problemática actual:
content = content.replace(
    /const chunks = \[\];\s+const logoPath = path\.join\(ASSETS_DIR, 'logo-ofimundo\.png'\);\s*\n\s*\/\/ Registrar fuentes Calibri\s*\n\s*const fontRegular = path\.join\(ASSETS_DIR, 'calibri\.ttf'\);\s*\n\s*const fontBold = path\.join\(ASSETS_DIR, 'calibrib\.ttf'\);\s*\n\s*if \(fs\.existsSync\(fontRegular\)\) \{ doc\.registerFont\('Calibri', fontRegular\); \}\s*\n\s*if \(fs\.existsSync\(fontBold\)\) \{ doc\.registerFont\('Calibri-Bold', fontBold\); \}/,
    "const chunks = [];\n            const logoPath = path.join(ASSETS_DIR, 'logo-ofimundo.png');"
);

// 2. Revertir fuentes Calibri → Helvetica
content = content.replace(/font\('Calibri-Bold'\)/g, "font('Helvetica-Bold')");
content = content.replace(/font\('Calibri'\)/g, "font('Helvetica')");

// 3. Eliminar lineGap innecesario dejando solo fontSize
content = content.replace(/\.fontSize\(CONFIG\.fontSize\)\.lineGap\(\d+\)/g, '.fontSize(CONFIG.fontSize)');

fs.writeFileSync(file, content);
console.log('Revertido correctamente. Total líneas:', content.split('\n').length);
