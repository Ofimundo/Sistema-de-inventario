// Script de diagnóstico para inspeccionar el XML dentro del template DOCX
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/STUEDEMANN S.A.docx');

console.log('Leyendo plantilla:', templatePath);

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Extraer y mostrar el XML del documento
const docXml = zip.files['word/document.xml'].asText();

// Buscar el contexto alrededor de los marcadores problemáticos
// Los offsets reportados son posiciones en el texto plano, no en el XML
// Busquemos las llaves {} en el XML crudo
const matches = [];
const regex = /\{[^<>]{0,30}\}/g;
let match;
while ((match = regex.exec(docXml)) !== null) {
    matches.push({
        index: match.index,
        text: match[0],
        // Mostrar 100 chars de contexto alrededor
        context: docXml.substring(Math.max(0, match.index - 50), match.index + 100)
    });
}

console.log(`\n=== TOTAL COINCIDENCIAS DE LLAVES: ${matches.length} ===`);
matches.slice(0, 20).forEach((m, i) => {
    console.log(`\n--- Match ${i+1} (pos ${m.index}) ---`);
    console.log('Texto:', m.text);
    console.log('Contexto XML:\n', m.context);
    console.log('---');
});

// También buscar específicamente "fecha", "nombre", "rut", "equipos"
const keywords = ['fecha', 'nombre', 'rut', 'equipos'];
console.log('\n=== BÚSQUEDA POR KEYWORDS ===');
keywords.forEach(kw => {
    const idx = docXml.indexOf(kw);
    if (idx !== -1) {
        const ctx = docXml.substring(Math.max(0, idx - 100), idx + 100);
        console.log(`\n[${kw}] encontrado en pos ${idx}:`);
        console.log(ctx);
    } else {
        console.log(`\n[${kw}] NO encontrado en el XML`);
    }
});

// Guardar el XML completo para inspección
const outputPath = path.join(__dirname, '../../document_debug.xml');
fs.writeFileSync(outputPath, docXml, 'utf8');
console.log(`\n✅ XML guardado en: ${outputPath}`);
