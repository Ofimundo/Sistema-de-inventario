const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
    const inputFile = path.join(__dirname, '../public/stockmaster_favicon_transparent.png');
    const outputDir = path.join(__dirname, '../public');
    
    const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
    
    for (const size of sizes) {
        await sharp(inputFile)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(outputDir, `icon-${size}.png`));
        console.log(`✅ Generado icon-${size}.png`);
    }
    console.log('🎉 Todos los iconos generados!');
}

generateFavicons().catch(console.error);