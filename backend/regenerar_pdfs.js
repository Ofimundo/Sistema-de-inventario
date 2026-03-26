// backend/regenerar_pdfs.js
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const { getConnection, sql } = require('./config/database');

async function regenerarPDFs() {
    console.log('🔧 REGENERANDO TODOS LOS PDFs CON FORMATO VÁLIDO...');
    console.log('==================================================');
    
    try {
        const pool = await getConnection();
        
        // Obtener todos los documentos de la BD
        const result = await pool.request()
            .query(`
                SELECT id, uso_producto_id, nombre_documento, created_at
                FROM [INV].[documentos_asignacion] 
                ORDER BY id DESC
            `);

        const documentos = result.recordset;
        console.log(`📊 Total documentos en BD: ${documentos.length}`);

        const uploadDir = path.join(__dirname, 'uploads', 'documentos');
        
        // Crear directorio si no existe
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        let regenerados = 0;
        let errores = 0;

        for (const doc of documentos) {
            try {
                const filename = doc.nombre_documento;
                const filePath = path.join(uploadDir, filename);
                
                console.log(`\n📄 Procesando: ${filename}`);

                // Crear un nuevo documento PDF
                const docPdf = new PDFDocument({
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    size: 'A4'
                });

                // Pipe el PDF a un archivo
                const writeStream = require('fs').createWriteStream(filePath);
                docPdf.pipe(writeStream);

                // Agregar contenido al PDF
                docPdf
                    .fontSize(20)
                    .text('ACTA DE ASIGNACIÓN DE EQUIPO', { align: 'center' })
                    .moveDown(2);

                docPdf
                    .fontSize(12)
                    .text(`ID de Asignación: ${doc.uso_producto_id}`, { continued: false })
                    .text(`ID del Documento: ${doc.id}`)
                    .text(`Fecha de generación: ${new Date().toLocaleString('es-CL')}`)
                    .text(`Fecha original en BD: ${new Date(doc.created_at).toLocaleString('es-CL')}`)
                    .moveDown(2);

                docPdf
                    .fontSize(14)
                    .text('INFORMACIÓN DE LA ASIGNACIÓN', { underline: true })
                    .moveDown(0.5);

                docPdf
                    .fontSize(12)
                    .text('Este documento certifica que el equipo ha sido asignado correctamente.')
                    .text('Para más información, consulte el sistema de gestión de inventario.')
                    .moveDown(2);

                docPdf
                    .fontSize(10)
                    .text('Documento generado automáticamente por el sistema de gestión de inventario.', { align: 'center', opacity: 0.5 });

                // Finalizar el PDF
                docPdf.end();

                // Esperar a que termine de escribir
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                console.log(`✅ PDF regenerado correctamente: ${filename}`);
                regenerados++;

            } catch (error) {
                console.error(`❌ Error con ${doc.nombre_documento}:`, error.message);
                errores++;
            }
        }

        console.log('\n==================================================');
        console.log('📊 RESUMEN FINAL:');
        console.log(`   📁 Total documentos: ${documentos.length}`);
        console.log(`   ✅ PDFs regenerados: ${regenerados}`);
        console.log(`   ❌ Errores: ${errores}`);
        console.log(`   📂 Ubicación: ${uploadDir}`);
        console.log('==================================================');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

regenerarPDFs()
    .then(() => console.log('\n✅ Proceso completado'))
    .catch(err => console.error('❌ Error fatal:', err));