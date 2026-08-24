// backend/routes/anexosRoutes.js - GENERACIÓN DE ANEXOS DESDE PLANTILLAS DOCX Y BASE DE DATOS
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// Directorios
const ANEXOS_DIR = path.join(__dirname, '../uploads/anexos');
const TEMPLATES_DIR = path.join(__dirname, '../../public/Documentos_Anexo');

if (!fs.existsSync(ANEXOS_DIR)) {
    fs.mkdirSync(ANEXOS_DIR, { recursive: true });
}

/**
 * Obtener la ruta de la plantilla correspondiente a la empresa
 */
function getTemplatePath(empresa) {
    const empLower = (empresa || '').toLowerCase();
    if (empLower.includes('global')) {
        return path.join(TEMPLATES_DIR, 'EstructuraGlobal.docx');
    }
    if (empLower.includes('latam')) {
        return path.join(TEMPLATES_DIR, 'EstructuraLatam.docx');
    }
    return path.join(TEMPLATES_DIR, 'Estructura.docx');
}

/**
 * Formatear fecha a texto en español (ej: "24 de Agosto del año 2026")
 */
function formatearFechaEspanol(fechaInput) {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    if (!fechaInput) fechaInput = new Date();
    let d = new Date(fechaInput);
    if (isNaN(d.getTime())) {
        if (typeof fechaInput === 'string') {
            const parts = fechaInput.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) { // YYYY-MM-DD
                    d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else { // DD/MM/YYYY
                    d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
            }
        }
    }
    if (isNaN(d.getTime())) d = new Date();
    
    const dia = d.getDate();
    const mes = meses[d.getMonth()];
    const anio = d.getFullYear();
    return `${dia} de ${mes} del año ${anio}`;
}

/**
 * Generar buffer DOCX ejecutando el script python-docx con la tabla formateada
 */
function generarDocxAnexo(datos, outputPath) {
    const { empresa, colaborador, fecha, equipos } = datos;
    const templatePath = getTemplatePath(empresa);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`No se encontró la plantilla Word en: ${templatePath}`);
    }

    const fechaFormateada = formatearFechaEspanol(fecha);
    const scriptPath = path.join(__dirname, '../scripts/generar_anexo.py');

    const jsonInput = JSON.stringify({
        template_path: templatePath,
        output_path: outputPath,
        fecha: fechaFormateada,
        nombre: colaborador.nombre || '',
        rut: colaborador.rut || '',
        equipos_list: equipos || []
    });

    const result = execFileSync('python', [scriptPath, jsonInput], { encoding: 'utf-8' });
    const parsed = JSON.parse(result.trim());

    if (!parsed.success) {
        throw new Error(`Error en generador Python: ${parsed.error}`);
    }

    return fs.readFileSync(outputPath);
}

/**
 * Consulta en BD para obtener los equipos activos asignados a un colaborador
 */
async function obtenerEquiposAsignadosColaborador(pool, colaboradorId, colaboradorRut, colaboradorNombre) {
    try {
        const result = await pool.request()
            .input('colaborador_id', sql.Int, colaboradorId || 0)
            .input('rut', sql.NVarChar, colaboradorRut || '')
            .input('nombre', sql.NVarChar, `%${colaboradorNombre || ''}%`)
            .query(`
                SELECT DISTINCT
                    p.id,
                    p.nombre as tipo,
                    p.nombre,
                    ISNULL(p.condicion, 'BUENO') as estado,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.precio,
                    COALESCE(a.observaciones, pu.comentario, p.descripcion, 'Sin observaciones') as observaciones
                FROM INV.productos p
                LEFT JOIN INV.asignaciones a 
                    ON p.id = a.producto_id 
                   AND a.fecha_devolucion IS NULL 
                LEFT JOIN INV.producto_uso pu 
                    ON p.id = pu.producto_id 
                   AND pu.fecha_devolucion IS NULL 
                WHERE 
                    (a.colaborador_id = @colaborador_id AND @colaborador_id > 0)
                    OR (pu.colaborador_id = @colaborador_id AND @colaborador_id > 0)
                    OR (pu.rut_usuario = @rut AND @rut != '')
                    OR (pu.nombre_usuario LIKE @nombre AND @nombre != '%%')
            `);
        return result.recordset || [];
    } catch (error) {
        console.error('❌ Error en obtenerEquiposAsignadosColaborador:', error);
        return [];
    }
}

// ============================================
// ENDPOINTS
// ============================================

router.get('/empresas', async (req, res) => {
    res.json({ success: true, data: ['STUEDEMANN S.A', 'Global Horizon Spa', 'Latam Lite Spa'] });
});

router.get('/colaboradores', async (req, res) => {
    try {
        const { empresa } = req.query;
        const pool = await getConnection();
        
        let query = `
            SELECT id, nombre, rut, email, cargo, departamento, direccion, empresa
            FROM INV.colaboradores
            WHERE 1=1
        `;
        const request = pool.request();
        
        if (empresa && empresa !== 'TODAS') {
            const empLower = empresa.toLowerCase();
            if (empLower.includes('stuedemann') || empLower.includes('ofimundo')) {
                query += ` AND (LOWER(empresa) LIKE '%ofimundo%' OR LOWER(empresa) LIKE '%stuedemann%')`;
            } else if (empLower.includes('global')) {
                query += ` AND LOWER(empresa) LIKE '%global%'`;
            } else if (empLower.includes('latam')) {
                query += ` AND LOWER(empresa) LIKE '%latam%'`;
            } else {
                query += ` AND LOWER(empresa) LIKE @empresaSearch`;
                request.input('empresaSearch', sql.NVarChar, `%${empLower}%`);
            }
        }
        
        query += ` ORDER BY nombre`;
        
        let colabResult = await request.query(query);
        let colaboradores = colabResult.recordset;
        
        // Si el filtro especifico no trajo resultados, recuperar todos como fallback
        if (empresa && empresa !== 'TODAS' && colaboradores.length === 0) {
            const fallbackResult = await pool.request().query(`
                SELECT id, nombre, rut, email, cargo, departamento, direccion, empresa
                FROM INV.colaboradores ORDER BY nombre
            `);
            colaboradores = fallbackResult.recordset;
        }
        
        for (const colab of colaboradores) {
            colab.equipos = await obtenerEquiposAsignadosColaborador(pool, colab.id, colab.rut, colab.nombre);
        }
        
        res.json({ success: true, data: colaboradores });
    } catch (error) {
        console.error('❌ Error en GET /colaboradores:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

router.get('/colaborador/:id/equipos', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const colabResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT id, nombre, rut FROM INV.colaboradores WHERE id = @id`);
        
        if (colabResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
        }
        
        const colab = colabResult.recordset[0];
        const equipos = await obtenerEquiposAsignadosColaborador(pool, colab.id, colab.rut, colab.nombre);
        res.json({ success: true, data: equipos });
    } catch (error) {
        console.error('❌ Error en GET /colaborador/:id/equipos:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// GENERAR ANEXO (Word .docx con Tabla)
// ============================================
router.post('/generar', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        console.log('📥 POST /api/anexos/generar (Tabla)');
        
        const { colaborador, empresa, fecha, equipos, producto, observaciones } = req.body;
        
        if (!colaborador?.nombre || !empresa) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (colaborador o empresa)' });
        }
        
        pool = await getConnection();
        
        // Determinar lista de equipos
        let listaEquipos = [];
        if (equipos && Array.isArray(equipos) && equipos.length > 0) {
            listaEquipos = equipos;
        } else if (producto && producto.id) {
            listaEquipos = [producto];
        } else if (colaborador.id || colaborador.rut) {
            listaEquipos = await obtenerEquiposAsignadosColaborador(pool, colaborador.id, colaborador.rut, colaborador.nombre);
        }

        const nombreColabLimpio = (colaborador.nombre || 'colaborador').replace(/[^a-zA-Z0-9]/g, '_');
        const empresaLimpia = (empresa || 'empresa').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `anexo_${empresaLimpia}_${nombreColabLimpio}_${Date.now()}.docx`;
        const filepath = path.join(ANEXOS_DIR, filename);

        // Generar archivo Word con Tabla de equipos
        const docxBuffer = generarDocxAnexo({
            empresa,
            colaborador,
            fecha: fecha || new Date(),
            equipos: listaEquipos
        }, filepath);

        transaction = pool.transaction();
        await transaction.begin();

        let colaboradorId = colaborador.id;
        if (colaboradorId) {
            const checkColab = await transaction.request()
                .input('id', sql.Int, colaboradorId)
                .query(`SELECT id FROM INV.colaboradores WHERE id = @id`);
            if (checkColab.recordset.length === 0) colaboradorId = null;
        }

        const primerProductoId = (listaEquipos.length > 0 && listaEquipos[0].id) ? listaEquipos[0].id : null;

        // Insertar registro en INV.anexos
        const result = await transaction.request()
            .input('colaborador_id', sql.Int, colaboradorId)
            .input('producto_id', sql.Int, primerProductoId)
            .input('asignacion_id', sql.Int, null)
            .input('empresa', sql.NVarChar, empresa)
            .input('fecha_anexo', sql.DateTime, fecha ? new Date(fecha) : new Date())
            .input('documento_generado', sql.NVarChar, filename)
            .input('observaciones', sql.NVarChar(500), (observaciones || '').substring(0, 500))
            .input('usuario_creacion', sql.NVarChar, req.user?.usuario || 'Sistema')
            .query(`
                INSERT INTO INV.anexos (
                    colaborador_id, 
                    producto_id, 
                    asignacion_id, 
                    empresa, 
                    fecha_anexo, 
                    documento_generado,
                    observaciones, 
                    usuario_creacion, 
                    fecha_creacion
                )
                OUTPUT INSERTED.id
                VALUES (
                    @colaborador_id, 
                    @producto_id, 
                    @asignacion_id, 
                    @empresa, 
                    @fecha_anexo, 
                    @documento_generado,
                    @observaciones, 
                    @usuario_creacion, 
                    GETDATE()
                )
            `);
        
        const anexoId = result.recordset[0].id;
        await transaction.commit();
        
        console.log(`✅ Anexo generado con Tabla (ID ${anexoId}): ${filename}`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(docxBuffer);

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Error generando anexo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// OBTENER LISTA DE ANEXOS
// ============================================
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                a.id, 
                a.colaborador_id, 
                a.producto_id, 
                a.empresa, 
                a.observaciones, 
                a.documento_generado, 
                a.fecha_creacion, 
                a.fecha_anexo,
                c.nombre as colaborador_nombre, 
                c.rut as colaborador_rut,
                p.nombre as producto_nombre, 
                p.numero_serie, 
                p.marca, 
                p.modelo
            FROM INV.anexos a
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            LEFT JOIN INV.productos p ON a.producto_id = p.id
            ORDER BY a.fecha_creacion DESC
        `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error en GET /anexos:', error);
        res.status(500).json({ success: false, message: error.message, data: [] });
    }
});

// ============================================
// DESCARGAR ANEXO
// ============================================
router.get('/descargar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT documento_generado FROM INV.anexos WHERE id = @id`);
        
        if (result.recordset.length === 0 || !result.recordset[0].documento_generado) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        }
        
        const filename = result.recordset[0].documento_generado;
        const filepath = path.join(ANEXOS_DIR, filename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Archivo no encontrado en el servidor' });
        }
        
        const isDocx = filename.endsWith('.docx');
        if (isDocx) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } else {
            res.setHeader('Content-Type', 'application/pdf');
        }
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ELIMINAR ANEXO
// ============================================
router.delete('/:id', async (req, res) => {
    let pool;
    let transaction;
    
    try {
        const { id } = req.params;
        
        pool = await getConnection();
        transaction = pool.transaction();
        await transaction.begin();
        
        const fileResult = await transaction.request()
            .input('id', sql.Int, id)
            .query(`SELECT documento_generado FROM INV.anexos WHERE id = @id`);
        
        await transaction.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM INV.anexos WHERE id = @id`);
        
        if (fileResult.recordset[0]?.documento_generado) {
            const filepath = path.join(ANEXOS_DIR, fileResult.recordset[0].documento_generado);
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
        
        await transaction.commit();
        res.json({ success: true, message: 'Anexo eliminado correctamente' });
        
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;