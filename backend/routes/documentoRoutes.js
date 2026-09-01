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

// Renombrar cualquier archivo físico antiguo acta_asignacion_* a checklist_entrega_*
function renombrarActasAChecklist() {
    try {
        if (fs.existsSync(DOCS_DIR)) {
            const files = fs.readdirSync(DOCS_DIR);
            for (const f of files) {
                if (f.startsWith('acta_asignacion_')) {
                    const newName = f.replace('acta_asignacion_', 'checklist_entrega_');
                    const oldPath = path.join(DOCS_DIR, f);
                    const newPath = path.join(DOCS_DIR, newName);
                    if (!fs.existsSync(newPath)) {
                        fs.renameSync(oldPath, newPath);
                        console.log(`🔄 Archivo renombrado de ${f} a ${newName}`);
                    } else {
                        try { fs.unlinkSync(oldPath); } catch(e) {}
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error al renombrar actas a checklist:', e.message);
    }
}
renombrarActasAChecklist();

// ============================================
// ENDPOINT PARA OBTENER TODOS LOS DOCUMENTOS (INCLUYENDO ANEXOS)
// ============================================
router.get('/todos', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/documentos/todos');
    try {
        renombrarActasAChecklist();
        const documentos = [];
        
        // 1. Buscar en DOCS_DIR (checklists de entrega y recepciones)
        if (fs.existsSync(DOCS_DIR)) {
            const files = fs.readdirSync(DOCS_DIR);
            console.log(`📁 DOCS_DIR (${DOCS_DIR}): ${files.length} archivos`);
            
            for (const file of files) {
                // SOLO ARCHIVOS PDF (ignorar .json)
                if (!file.endsWith('.pdf')) continue;

                const stats = fs.statSync(path.join(DOCS_DIR, file));
                let tipo = 'documento';
                let nombre = file;
                
                if (file.includes('checklist') || file.includes('acta_asignacion')) {
                    tipo = 'asignacion';
                    nombre = 'Checklist de Entrega';
                } else if (file.includes('acta_recepcion')) {
                    tipo = 'recepcion';
                    nombre = 'Acta de Recepción';
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
// ENDPOINT PARA GUARDAR CHECKLIST (PERSISTENTE EN SERVIDOR)
// ============================================
router.post('/checklist', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/documentos/checklist');
    try {
        const { asignacion_id, producto_id, checklistData } = req.body;
        
        if (!checklistData) {
            return res.status(400).json({ success: false, message: 'Datos del checklist requeridos' });
        }

        const filenames = [];
        if (asignacion_id) filenames.push(`checklist_asignacion_${asignacion_id}.json`);
        if (producto_id) filenames.push(`checklist_producto_${producto_id}.json`);
        
        if (filenames.length === 0) {
            filenames.push(`checklist_${Date.now()}.json`);
        }

        for (const filename of filenames) {
            const filepath = path.join(CHECKLIST_DIR, filename);
            fs.writeFileSync(filepath, JSON.stringify(checklistData, null, 2));
            console.log(`✅ Checklist guardado en servidor: ${filepath}`);
        }

        res.json({ success: true, message: 'Checklist guardado correctamente en el servidor' });
    } catch (error) {
        console.error('❌ Error guardando checklist:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ENDPOINT PARA OBTENER CHECKLIST DE UNA ASIGNACIÓN/PRODUCTO
// ============================================
router.get('/checklist/:id', authenticateToken, async (req, res) => {
    console.log(`📥 GET /api/documentos/checklist/${req.params.id}`);
    try {
        const id = req.params.id;
        const posiblesArchivos = [
            `checklist_asignacion_${id}.json`,
            `checklist_producto_${id}.json`,
            `checklist_${id}.json`
        ];

        let foundPath = null;
        for (const file of posiblesArchivos) {
            const p = path.join(CHECKLIST_DIR, file);
            if (fs.existsSync(p)) {
                foundPath = p;
                break;
            }
        }

        if (!foundPath) {
            return res.status(404).json({ success: false, message: 'No hay checklist disponible para esta asignación' });
        }

        const data = fs.readFileSync(foundPath, 'utf8');
        res.json({ success: true, data: JSON.parse(data) });
    } catch (error) {
        console.error('❌ Error obteniendo checklist:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


const { generarActaAsignacionPDF } = require('../controllers/asignacionController');

// Renombrar y migrar cualquier archivo físico al formato nuevo Checklist de Entrega
async function migrarTodosLosPDFsAChecklist() {
    try {
        if (fs.existsSync(DOCS_DIR)) {
            const files = fs.readdirSync(DOCS_DIR);
            let pool = null;
            try { pool = await getConnection(); } catch(e) {}

            for (const f of files) {
                if ((f.includes('acta_asignacion') || f.includes('checklist_entrega') || f.startsWith('asignacion_')) && !f.includes('recepcion') && f.endsWith('.pdf')) {
                    const idMatch = f.match(/\d+/);
                    if (idMatch) {
                        const id = parseInt(idMatch[0]);
                        try {
                            let row = null;
                            if (pool) {
                                const asigRes = await pool.request()
                                    .input('id', sql.Int, id)
                                    .query(`
                                        SELECT a.id, a.producto_id, a.colaborador_id, a.fecha_asignacion, a.motivo, a.observaciones, a.es_prestamo, a.usuario_responsable,
                                               p.nombre as producto_nombre, p.marca as producto_marca, p.modelo as producto_modelo, p.numero_serie, p.condicion as producto_condicion,
                                               c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                                               c.cargo as colaborador_cargo, c.departamento as colaborador_departamento, c.direccion as colaborador_direccion, c.empresa as colaborador_empresa
                                        FROM INV.asignaciones a
                                        LEFT JOIN INV.productos p ON a.producto_id = p.id
                                        LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                                        WHERE a.id = @id OR a.producto_id = @id
                                    `);
                                if (asigRes.recordset.length > 0) {
                                    row = asigRes.recordset[0];
                                }
                            }

                            let checklistData = null;
                            const posibles = [
                                path.join(CHECKLIST_DIR, `checklist_asignacion_${id}.json`),
                                path.join(CHECKLIST_DIR, `checklist_producto_${id}.json`),
                                row ? path.join(CHECKLIST_DIR, `checklist_producto_${row.producto_id}.json`) : null
                            ].filter(Boolean);

                            for (const p of posibles) {
                                if (fs.existsSync(p)) {
                                    try { checklistData = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch(e) {}
                                }
                            }

                            const payload = {
                                id_asignacion: id,
                                colaborador: {
                                    nombre: row?.colaborador_nombre || checklistData?.colaborador?.nombre || '',
                                    rut: row?.colaborador_rut || checklistData?.colaborador?.rut || '',
                                    email: row?.colaborador_email || '',
                                    cargo: row?.colaborador_cargo || '',
                                    departamento: row?.colaborador_departamento || '',
                                    empresa: row?.colaborador_empresa || ''
                                },
                                productos: [{
                                    nombre: row?.producto_nombre || '',
                                    marca: row?.producto_marca || '',
                                    modelo: row?.producto_modelo || '',
                                    numero_serie: row?.numero_serie || '',
                                    condicion: row?.producto_condicion || ''
                                }],
                                fecha_asignacion: row?.fecha_asignacion || new Date(),
                                ticketInfo: checklistData?.ticketInfo || { ticket: '', tecnico: row?.usuario_responsable || '' },
                                especificacionesTecnicas: checklistData?.especificacionesTecnicas || { cpu: '', ram: '', disco: '', gpu: '', tipo: row?.producto_condicion || '' },
                                checklistData: checklistData,
                                items: checklistData?.items,
                                firma_trabajador: checklistData?.firmaTrabajador || row?.colaborador_nombre || '',
                                firma_gerente: checklistData?.firmaGerente || 'María Eugenia Nabalón'
                            };

                            const pdfBuffer = await generarActaAsignacionPDF(payload);
                            if (pdfBuffer && pdfBuffer.length > 0) {
                                fs.writeFileSync(path.join(DOCS_DIR, f), pdfBuffer);
                                console.log(`✨ PDF migrado al nuevo formato Checklist: ${f}`);
                            }
                            await new Promise(res => setTimeout(res, 250));
                        } catch (errOne) {
                            console.error(`⚠️ Error migrando PDF ${f}:`, errOne.message);
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error en migración masiva de PDFs a Checklist:', e.message);
    }
}

// ============================================
// ENDPOINT PARA DESCARGAR DOCUMENTO
// ============================================
router.get('/descargar/:filename', authenticateToken, async (req, res) => {
    console.log(`📥 GET /api/documentos/descargar/${req.params.filename}`);
    try {
        const { filename } = req.params;
        
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Nombre de archivo inválido' });
        }
        
        const safeFilename = path.basename(filename);
        let filepath = path.join(DOCS_DIR, safeFilename);

        // Si es un documento de asignacion/checklist (no recepcion):
        if ((safeFilename.includes('acta_asignacion') || safeFilename.includes('checklist_entrega') || safeFilename.includes('asignacion')) && !safeFilename.includes('recepcion')) {
            const idMatch = safeFilename.match(/\d+/);
            if (idMatch) {
                const asignacionId = parseInt(idMatch[0]);
                try {
                    let row = null;
                    try {
                        const pool = await getConnection();
                        const asigRes = await pool.request()
                            .input('id', sql.Int, asignacionId)
                            .query(`
                                SELECT a.id, a.producto_id, a.colaborador_id, a.fecha_asignacion, a.motivo, a.observaciones, a.es_prestamo, a.usuario_responsable,
                                       p.nombre as producto_nombre, p.marca as producto_marca, p.modelo as producto_modelo, p.numero_serie, p.condicion as producto_condicion,
                                       c.nombre as colaborador_nombre, c.rut as colaborador_rut, c.email as colaborador_email,
                                       c.cargo as colaborador_cargo, c.departamento as colaborador_departamento, c.direccion as colaborador_direccion, c.empresa as colaborador_empresa
                                FROM INV.asignaciones a
                                LEFT JOIN INV.productos p ON a.producto_id = p.id
                                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                                WHERE a.id = @id OR a.producto_id = @id
                            `);
                        if (asigRes.recordset.length > 0) {
                            row = asigRes.recordset[0];
                        }
                    } catch(eSql) {}

                    let checklistData = null;
                    const posibles = [
                        path.join(CHECKLIST_DIR, `checklist_asignacion_${asignacionId}.json`),
                        path.join(CHECKLIST_DIR, `checklist_producto_${asignacionId}.json`),
                        row ? path.join(CHECKLIST_DIR, `checklist_producto_${row.producto_id}.json`) : null
                    ].filter(Boolean);

                    for (const p of posibles) {
                        if (fs.existsSync(p)) {
                            try { checklistData = JSON.parse(fs.readFileSync(p, 'utf8')); break; } catch(e) {}
                        }
                    }

                    const payload = {
                        id_asignacion: asignacionId,
                        colaborador: {
                            nombre: row?.colaborador_nombre || checklistData?.colaborador?.nombre || '',
                            rut: row?.colaborador_rut || checklistData?.colaborador?.rut || '',
                            email: row?.colaborador_email || '',
                            cargo: row?.colaborador_cargo || '',
                            departamento: row?.colaborador_departamento || '',
                            empresa: row?.colaborador_empresa || ''
                        },
                        productos: [{
                            nombre: row?.producto_nombre || '',
                            marca: row?.producto_marca || '',
                            modelo: row?.producto_modelo || '',
                            numero_serie: row?.numero_serie || '',
                            condicion: row?.producto_condicion || ''
                        }],
                        fecha_asignacion: row?.fecha_asignacion || new Date(),
                        ticketInfo: checklistData?.ticketInfo || { ticket: '', tecnico: row?.usuario_responsable || '' },
                        especificacionesTecnicas: checklistData?.especificacionesTecnicas || { cpu: '', ram: '', disco: '', gpu: '', tipo: row?.producto_condicion || '' },
                        checklistData: checklistData,
                        items: checklistData?.items,
                        firma_trabajador: checklistData?.firmaTrabajador || row?.colaborador_nombre || '',
                        firma_gerente: checklistData?.firmaGerente || 'María Eugenia Nabalón'
                    };

                    const pdfBuffer = await generarActaAsignacionPDF(payload);
                    if (pdfBuffer && pdfBuffer.length > 0) {
                        try { fs.writeFileSync(filepath, pdfBuffer); } catch(e) {}

                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
                        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
                        return res.send(pdfBuffer);
                    }
                } catch (errGen) {
                    console.error('Error regenerando PDF a nuevo formato:', errGen);
                }
            }
        }

        // Buscar en los diferentes directorios si no fue capturado
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