// backend/routes/documentoRoutes.js - VERSIÓN COMPLETA ACTUALIZADA CON ANEXOS
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const documentoController = require('../controllers/documentoController');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando documentoRoutes.js...');

// Directorios de documentos
const DOCS_DIR = path.join(__dirname, '../uploads/documentos');
const ANEXOS_DIR = path.join(__dirname, '../uploads/anexos');
const CHECKLIST_DIR = path.join(__dirname, '../uploads/checklist');

// Asegurar que los directorios existen
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${DOCS_DIR}`);
}
if (!fs.existsSync(ANEXOS_DIR)) {
    fs.mkdirSync(ANEXOS_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${ANEXOS_DIR}`);
}
if (!fs.existsSync(CHECKLIST_DIR)) {
    fs.mkdirSync(CHECKLIST_DIR, { recursive: true });
    console.log(`📁 Directorio creado: ${CHECKLIST_DIR}`);
}

// ============================================
// ENDPOINT PARA OBTENER TODOS LOS DOCUMENTOS (INCLUYENDO ANEXOS)
// ============================================
router.get('/todos', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/documentos/todos');
    try {
        const documentos = [];
        
        // 1. Buscar en DOCS_DIR (actas de asignación y recepción)
        if (fs.existsSync(DOCS_DIR)) {
            const files = fs.readdirSync(DOCS_DIR);
            console.log(`📁 DOCS_DIR (${DOCS_DIR}): ${files.length} archivos`);
            
            for (const file of files) {
                const stats = fs.statSync(path.join(DOCS_DIR, file));
                let tipo = 'documento';
                let nombre = file;
                
                if (file.includes('acta_asignacion')) {
                    tipo = 'asignacion';
                    nombre = 'Acta de Asignación';
                } else if (file.includes('acta_recepcion')) {
                    tipo = 'recepcion';
                    nombre = 'Acta de Recepción';
                } else if (file.includes('checklist')) {
                    tipo = 'checklist';
                    nombre = 'Checklist de Entrega';
                }
                
                documentos.push({
                    id: `doc_${Date.now()}_${documentos.length}`,
                    filename: file,
                    nombre: nombre,
                    tipo: tipo,
                    fecha_creacion: stats.birthtime || stats.ctime,
                    tamaño: stats.size,
                    ruta: 'documentos'
                });
            }
        }
        
        // 2. Buscar en ANEXOS_DIR (anexos de contrato)
        if (fs.existsSync(ANEXOS_DIR)) {
            const files = fs.readdirSync(ANEXOS_DIR);
            console.log(`📁 ANEXOS_DIR (${ANEXOS_DIR}): ${files.length} archivos`);
            
            for (const file of files) {
                // Solo archivos PDF
                if (file.endsWith('.pdf')) {
                    const stats = fs.statSync(path.join(ANEXOS_DIR, file));
                    documentos.push({
                        id: `anexo_${Date.now()}_${documentos.length}`,
                        filename: file,
                        nombre: 'Anexo de Contrato',
                        tipo: 'anexo',
                        fecha_creacion: stats.birthtime || stats.ctime,
                        tamaño: stats.size,
                        ruta: 'anexos'
                    });
                }
            }
        }
        
        // 3. Buscar en CHECKLIST_DIR
        if (fs.existsSync(CHECKLIST_DIR)) {
            const files = fs.readdirSync(CHECKLIST_DIR);
            console.log(`📁 CHECKLIST_DIR (${CHECKLIST_DIR}): ${files.length} archivos`);
            
            for (const file of files) {
                if (!documentos.some(d => d.filename === file)) {
                    const stats = fs.statSync(path.join(CHECKLIST_DIR, file));
                    documentos.push({
                        id: `checklist_${Date.now()}_${documentos.length}`,
                        filename: file,
                        nombre: 'Checklist de Entrega',
                        tipo: 'checklist',
                        fecha_creacion: stats.birthtime || stats.ctime,
                        tamaño: stats.size,
                        ruta: 'checklist'
                    });
                }
            }
        }
        
        // Ordenar por fecha descendente
        documentos.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        
        console.log(`✅ Total documentos encontrados: ${documentos.length}`);
        console.log(`   - Actas: ${documentos.filter(d => d.tipo === 'asignacion' || d.tipo === 'recepcion').length}`);
        console.log(`   - Anexos: ${documentos.filter(d => d.tipo === 'anexo').length}`);
        console.log(`   - Checklist: ${documentos.filter(d => d.tipo === 'checklist').length}`);
        
        res.json({ success: true, data: documentos });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// ENDPOINT PARA DESCARGAR DOCUMENTO
// ============================================
router.get('/descargar/:filename', authenticateToken, (req, res) => {
    console.log(`📥 GET /api/documentos/descargar/${req.params.filename}`);
    try {
        const { filename } = req.params;
        
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
        }
        
        const safeFilename = path.basename(filename);
        
        // Buscar en los diferentes directorios
        let filepath = path.join(DOCS_DIR, safeFilename);
        let found = fs.existsSync(filepath);
        
        if (!found) {
            filepath = path.join(ANEXOS_DIR, safeFilename);
            found = fs.existsSync(filepath);
        }
        
        if (!found) {
            filepath = path.join(CHECKLIST_DIR, safeFilename);
            found = fs.existsSync(filepath);
        }
        
        if (!found) {
            console.log(`❌ Documento no encontrado: ${safeFilename}`);
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        console.log(`✅ Documento descargado: ${safeFilename}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ENDPOINT PARA OBTENER SOLO ANEXOS
// ============================================
router.get('/anexos', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/documentos/anexos');
    try {
        const anexos = [];
        
        if (fs.existsSync(ANEXOS_DIR)) {
            const files = fs.readdirSync(ANEXOS_DIR);
            for (const file of files) {
                if (file.endsWith('.pdf')) {
                    const stats = fs.statSync(path.join(ANEXOS_DIR, file));
                    anexos.push({
                        id: `anexo_${Date.now()}_${anexos.length}`,
                        filename: file,
                        nombre: 'Anexo de Contrato',
                        tipo: 'anexo',
                        fecha_creacion: stats.birthtime || stats.ctime,
                        tamaño: stats.size,
                        ruta: 'anexos'
                    });
                }
            }
        }
        
        anexos.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
        res.json({ success: true, data: anexos });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// ENDPOINTS EXISTENTES
// ============================================
router.get('/', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/documentos');
    try {
        await documentoController.getAll(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 GET /api/documentos/${req.params.id}`);
    try {
        await documentoController.getById(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/documentos');
    try {
        await documentoController.create(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/upload', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/documentos/upload');
    try {
        await documentoController.upload(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 PUT /api/documentos/${req.params.id}`);
    try {
        await documentoController.update(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 DELETE /api/documentos/${req.params.id}`);
    try {
        await documentoController.delete(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ documentoRoutes.js configurado correctamente');

module.exports = router;