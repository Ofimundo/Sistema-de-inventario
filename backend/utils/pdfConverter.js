const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Convierte un archivo DOCX a PDF usando Microsoft Word a través de un script de PowerShell.
 * @param {string} docxPath Ruta absoluta al archivo DOCX de origen.
 * @param {string} pdfPath Ruta absoluta al archivo PDF de destino.
 * @returns {Promise<void>}
 */
async function convertDocxToPdf(docxPath, pdfPath) {
    return new Promise((resolve, reject) => {
        const psScript = path.join(__dirname, 'convertDocxToPdf.ps1');
        
        // Comando powershell con bypass de políticas y ejecución de script pasándole argumentos
        const command = `powershell -ExecutionPolicy Bypass -File "${psScript}" -docxPath "${docxPath}" -pdfPath "${pdfPath}"`;
        
        console.log(`[PDF Converter] Iniciando conversión de DOCX a PDF...`);
        
        exec(command, (error, stdout, stderr) => {
            console.log(`[PDF Converter] Stdout:\n${stdout}`);
            if (stderr) {
                console.error(`[PDF Converter] Stderr:\n${stderr}`);
            }
            
            if (error) {
                console.error(`[PDF Converter] Error de ejecución:`, error);
                return reject(new Error(`Error al convertir a PDF: ${error.message}`));
            }
            
            if (stdout.includes("SUCCESS")) {
                console.log(`[PDF Converter] Conversión completada con éxito.`);
                resolve();
            } else if (stdout.includes("ERROR:")) {
                reject(new Error(`Error en el script de PowerShell: ${stdout}`));
            } else {
                // Si SUCCESS no está en stdout pero no dio error del proceso, verificar si existe el archivo
                fs.access(pdfPath)
                    .then(() => {
                        console.log(`[PDF Converter] Archivo PDF encontrado en destino.`);
                        resolve();
                    })
                    .catch((err) => {
                        reject(new Error(`El archivo PDF no se creó y no se recibió de manera explícita el mensaje de SUCCESS.`));
                    });
            }
        });
    });
}

module.exports = { convertDocxToPdf };
