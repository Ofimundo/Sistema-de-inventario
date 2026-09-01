// backend/routes/colaboradorRoutes.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando colaboradorRoutes.js...');

// Función para migrar/corregir restricciones de UNIQUE en email para permitir múltiples nulos/vacíos
async function fixColaboradoresEmailConstraint() {
    try {
        const pool = await getConnection();
        
        // 1. Buscar y eliminar restricciones de UNIQUE o DEFAULT en la columna email
        const constraints = await pool.request().query(`
            SELECT tc.CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
                ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE tc.TABLE_SCHEMA = 'INV' 
              AND tc.TABLE_NAME = 'colaboradores' 
              AND kcu.COLUMN_NAME = 'email'
        `);

        for (const row of constraints.recordset) {
            console.log(`🔧 Eliminando restricción de email: ${row.CONSTRAINT_NAME}`);
            try {
                await pool.request().query(`ALTER TABLE INV.colaboradores DROP CONSTRAINT [${row.CONSTRAINT_NAME}]`);
            } catch (e) {
                console.log(`⚠️ No se pudo eliminar restricción ${row.CONSTRAINT_NAME}:`, e.message);
            }
        }

        // 2. Buscar y eliminar todos los índices que dependan de la columna email
        const indexes = await pool.request().query(`
            SELECT i.name AS IndexName
            FROM sys.indexes i
            JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            JOIN sys.tables t ON i.object_id = t.object_id
            JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE s.name = 'INV' AND t.name = 'colaboradores' 
              AND c.name = 'email' AND i.is_primary_key = 0
        `);

        for (const row of indexes.recordset) {
            console.log(`🔧 Eliminando índice dependiente de email: ${row.IndexName}`);
            try {
                await pool.request().query(`DROP INDEX [${row.IndexName}] ON INV.colaboradores`);
            } catch (e) {
                console.log(`⚠️ No se pudo eliminar índice ${row.IndexName}:`, e.message);
            }
        }

        // 3. AHORA SÍ: Modificar la columna email para permitir valores NULL
        await pool.request().query(`
            ALTER TABLE INV.colaboradores ALTER COLUMN email NVARCHAR(255) NULL
        `);
        console.log('✅ Columna email en INV.colaboradores modificada a NULLABLE');

        // 4. Crear índice único filtrado (solo para emails no vacíos y no nulos)
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.indexes 
                WHERE name = 'UQ_colaboradores_email_filtered' 
                  AND object_id = OBJECT_ID('INV.colaboradores')
            )
            BEGIN
                CREATE UNIQUE NONCLUSTERED INDEX UQ_colaboradores_email_filtered
                ON INV.colaboradores(email)
                WHERE email IS NOT NULL AND email != '';
            END
        `);
        console.log('✅ Estructura e índice filtrado de email configurados exitosamente.');
    } catch (err) {
        console.error('❌ Error al migrar columna email en BD:', err.message);
    }
}

// Ejecutar migración al iniciar el módulo
fixColaboradoresEmailConstraint();

// ============================================
// NUEVA RUTA - Obtener empresas únicas (DEBE IR ANTES DE /:id)
// ============================================
router.get('/empresas', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores/empresas');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT DISTINCT empresa as nombre
                FROM INV.colaboradores
                WHERE empresa IS NOT NULL AND empresa != ''
                ORDER BY empresa
            `);
        
        const empresas = result.recordset.map(r => r.nombre);
        if (empresas.length === 0) {
            return res.json({ 
                success: true, 
                data: ['GLOBAL', 'HIWAY', 'LATAM_LITE', 'OFIMUNDO'] 
            });
        }
        
        res.json({ success: true, data: empresas });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/empresas:', error);
        res.json({ 
            success: true, 
            data: ['GLOBAL', 'HIWAY', 'LATAM_LITE', 'OFIMUNDO'] 
        });
    }
});

// GET - Obtener estadísticas de colaboradores
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores/stats');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as total_colaboradores,
                    SUM(CASE WHEN c.estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN c.estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
                    COUNT(DISTINCT c.departamento) as total_departamentos,
                    (SELECT COUNT(*) FROM INV.asignaciones WHERE fecha_devolucion IS NULL) as total_equipos_asignados
                FROM INV.colaboradores c
            `);
        
        res.json({ success: true, data: result.recordset[0] });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener departamentos únicos
router.get('/departamentos', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores/departamentos');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT DISTINCT departamento as nombre
                FROM INV.colaboradores
                WHERE departamento IS NOT NULL AND departamento != ''
                ORDER BY departamento
            `);
        
        res.json({ success: true, data: result.recordset.map(r => r.nombre) });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/departamentos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener todos los colaboradores (CON EMPRESA)
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores');
        
        const { estado, departamento, empresa, search } = req.query;
        const pool = await getConnection();
        
// Función para asegurar la columna observaciones en INV.colaboradores
async function ensureObservacionesColumn() {
    try {
        const pool = await getConnection();
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('INV.colaboradores') AND name = 'observaciones'
            )
            BEGIN
                ALTER TABLE INV.colaboradores ADD observaciones NVARCHAR(MAX) NULL;
            END
        `);
        console.log('✅ Columna observaciones verificada/configurada en INV.colaboradores');
    } catch (err) {
        console.error('❌ Error al verificar columna observaciones:', err.message);
    }
}
ensureObservacionesColumn();

        let query = `
            SELECT 
                c.id, 
                c.nombre, 
                c.email, 
                c.rut, 
                c.cargo, 
                c.departamento, 
                c.empresa,
                c.telefono, 
                c.direccion, 
                c.estado,
                c.fecha_ingreso,
                c.fecha_nacimiento,
                c.observaciones,
                ISNULL((
                    SELECT COUNT(*) 
                    FROM INV.asignaciones a 
                    WHERE a.colaborador_id = c.id 
                      AND a.fecha_devolucion IS NULL
                ), 0) as asignaciones_activas,
                ISNULL((
                    SELECT COUNT(*) 
                    FROM INV.asignaciones a 
                    WHERE a.colaborador_id = c.id
                ), 0) as total_asignaciones
            FROM INV.colaboradores c
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (estado) {
            query += ` AND c.estado = @estado`;
            request.input('estado', sql.NVarChar, estado);
        }
        
        if (departamento) {
            query += ` AND c.departamento = @departamento`;
            request.input('departamento', sql.NVarChar, departamento);
        }
        
        if (empresa) {
            query += ` AND c.empresa = @empresa`;
            request.input('empresa', sql.NVarChar, empresa);
        }
        
        if (search) {
            query += ` AND (c.nombre LIKE @search OR c.email LIKE @search OR c.rut LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search}%`);
        }
        
        query += ` ORDER BY c.nombre`;
        
        const result = await request.query(query);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener colaborador por ID (CON EMPRESA)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT 
                    c.id, c.nombre, c.email, c.rut, c.cargo, c.departamento, c.empresa,
                    c.telefono, c.direccion, c.estado, c.fecha_ingreso, c.fecha_nacimiento,
                    ISNULL((
                        SELECT COUNT(*) 
                        FROM INV.asignaciones a 
                        WHERE a.colaborador_id = c.id AND a.fecha_devolucion IS NULL
                    ), 0) as asignaciones_activas,
                    ISNULL((
                        SELECT COUNT(*) 
                        FROM INV.asignaciones a 
                        WHERE a.colaborador_id = c.id
                    ), 0) as total_asignaciones
                FROM INV.colaboradores c
                WHERE c.id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
        }
        
        res.json({ success: true, data: result.recordset[0] });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener productos asignados a un colaborador
router.get('/:id/productos-asignados', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/colaboradores/${id}/productos-asignados`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('colaborador_id', sql.Int, idNum)
            .query(`
                SELECT 
                    a.id as asignacion_id,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.motivo,
                    a.observaciones,
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    p.precio,
                    CASE 
                        WHEN a.fecha_devolucion IS NULL THEN 'ACTIVA'
                        ELSE 'FINALIZADA'
                    END as estado_asignacion
                FROM INV.asignaciones a
                INNER JOIN INV.productos p ON a.producto_id = p.id
                WHERE a.colaborador_id = @colaborador_id
                ORDER BY a.fecha_asignacion DESC
            `);
        
        console.log(`✅ Productos encontrados: ${result.recordset.length}`);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/:id/productos-asignados:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mantener la ruta antigua por compatibilidad
router.get('/:id/productos', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('colaborador_id', sql.Int, idNum)
            .query(`
                SELECT 
                    a.id as asignacion_id,
                    a.fecha_asignacion,
                    a.fecha_devolucion,
                    a.motivo,
                    p.id as producto_id,
                    p.nombre as producto_nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    CASE 
                        WHEN a.fecha_devolucion IS NULL THEN 'ACTIVA'
                        ELSE 'FINALIZADA'
                    END as estado_asignacion
                FROM INV.asignaciones a
                INNER JOIN INV.productos p ON a.producto_id = p.id
                WHERE a.colaborador_id = @colaborador_id
                ORDER BY a.fecha_asignacion DESC
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Crear colaborador (CON EMPRESA)
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 POST /api/colaboradores');
        console.log('Body:', req.body);
        
        const { nombre, email, rut, cargo, departamento, telefono, direccion, fecha_nacimiento, empresa } = req.body;
        
        const isHiway = empresa && String(empresa).trim().toUpperCase() === 'HIWAY';

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }
        if (!email && !isHiway) {
            return res.status(400).json({ success: false, message: 'El email es requerido' });
        }
        
        const pool = await getConnection();

        const cleanRut = (r) => r ? String(r).replace(/[^0-9kK]/g, '').toUpperCase() : '';
        const rutLimpio = cleanRut(rut);

        // 1. Verificar si RUT ya existe
        if (rutLimpio) {
            const rutCheck = await pool.request()
                .input('rut', sql.NVarChar, rut)
                .input('rutLimpio', sql.NVarChar, rutLimpio)
                .query(`
                    SELECT id, nombre FROM INV.colaboradores 
                    WHERE rut = @rut 
                       OR REPLACE(REPLACE(REPLACE(rut, '.', ''), '-', ''), ' ', '') = @rutLimpio
                `);
            if (rutCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El colaborador con RUT ${rut} ya se encuentra registrado (${rutCheck.recordset[0].nombre}).`
                });
            }
        }

        // 2. Verificar si Email ya existe
        if (email && email.trim()) {
            const emailCheck = await pool.request()
                .input('email', sql.NVarChar, email.trim())
                .query("SELECT id, nombre FROM INV.colaboradores WHERE LOWER(email) = LOWER(@email) AND email != ''");
            if (emailCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El correo electrónico ${email} ya se encuentra registrado por el colaborador ${emailCheck.recordset[0].nombre}.`
                });
            }
        }
        
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, (email && email.trim()) ? email.trim() : null)
            .input('rut', sql.NVarChar, rut || '')
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
            .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
            .input('observaciones', sql.NVarChar, observaciones || null)
            .input('estado', sql.NVarChar, 'ACTIVO')
            .input('fecha_ingreso', sql.Date, new Date())
            .query(`
                INSERT INTO INV.colaboradores (
                    nombre, email, rut, cargo, departamento, telefono, 
                    direccion, fecha_nacimiento, empresa, observaciones, estado, fecha_ingreso
                ) VALUES (
                    @nombre, @email, @rut, @cargo, @departamento, @telefono,
                    @direccion, @fecha_nacimiento, @empresa, @observaciones, @estado, @fecha_ingreso
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        res.json({ success: true, message: 'Colaborador creado', data: { id: result.recordset[0].id } });
        
    } catch (error) {
        console.error('❌ Error en POST /colaboradores:', error);
        let userMsg = error.message || 'Error al guardar el colaborador';
        if (error.number === 2627 || error.number === 2601 || (error.message && (
            error.message.includes('UNIQUE KEY constraint') || 
            error.message.includes('duplicate key') || 
            error.message.includes('UQ__colabora')
        ))) {
            userMsg = 'El colaborador ya se encuentra registrado en el sistema (RUT o correo duplicado).';
        }
        res.status(400).json({ success: false, message: userMsg });
    }
});

// PUT - Actualizar observaciones de un colaborador directamente
router.put('/:id/observaciones', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        console.log(`📥 PUT /api/colaboradores/${id}/observaciones`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, idNum)
            .input('observaciones', sql.NVarChar, observaciones !== undefined ? observaciones : null)
            .query('UPDATE INV.colaboradores SET observaciones = @observaciones WHERE id = @id');
            
        res.json({ success: true, message: 'Observación actualizada exitosamente' });
    } catch (error) {
        console.error('❌ Error en PUT /colaboradores/:id/observaciones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Actualizar colaborador (CON EMPRESA)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 PUT /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const { nombre, email, rut, cargo, departamento, telefono, direccion, fecha_nacimiento, estado, empresa, observaciones } = req.body;
        
        const isHiway = empresa && String(empresa).trim().toUpperCase() === 'HIWAY';

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }
        if (!email && !isHiway) {
            return res.status(400).json({ success: false, message: 'El email es requerido' });
        }

        const pool = await getConnection();

        const cleanRut = (r) => r ? String(r).replace(/[^0-9kK]/g, '').toUpperCase() : '';
        const rutLimpio = cleanRut(rut);

        // 1. Verificar si RUT ya pertenece a otro colaborador
        if (rutLimpio) {
            const rutCheck = await pool.request()
                .input('id', sql.Int, idNum)
                .input('rut', sql.NVarChar, rut)
                .input('rutLimpio', sql.NVarChar, rutLimpio)
                .query(`
                    SELECT id, nombre FROM INV.colaboradores 
                    WHERE (rut = @rut OR REPLACE(REPLACE(REPLACE(rut, '.', ''), '-', ''), ' ', '') = @rutLimpio)
                      AND id != @id
                `);
            if (rutCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El RUT ${rut} ya pertenece a otro colaborador registrado (${rutCheck.recordset[0].nombre}).`
                });
            }
        }

        // 2. Verificar si Email pertenece a otro colaborador
        if (email && email.trim()) {
            const emailCheck = await pool.request()
                .input('id', sql.Int, idNum)
                .input('email', sql.NVarChar, email.trim())
                .query("SELECT id, nombre FROM INV.colaboradores WHERE LOWER(email) = LOWER(@email) AND id != @id AND email != ''");
            if (emailCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El correo electrónico ${email} ya pertenece a otro colaborador.`
                });
            }
        }
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, (email && email.trim()) ? email.trim() : null)
            .input('rut', sql.NVarChar, rut || '')
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
            .input('estado', sql.NVarChar, estado || 'ACTIVO')
            .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
            .input('observaciones', sql.NVarChar, observaciones !== undefined ? observaciones : null)
            .query(`
                UPDATE INV.colaboradores SET
                    nombre = @nombre, 
                    email = @email, 
                    rut = @rut, 
                    cargo = @cargo,
                    departamento = @departamento, 
                    telefono = @telefono, 
                    direccion = @direccion,
                    fecha_nacimiento = @fecha_nacimiento, 
                    estado = @estado, 
                    empresa = @empresa,
                    observaciones = @observaciones
                WHERE id = @id
            `);
        
        res.json({ success: true, message: 'Colaborador actualizado' });
        
    } catch (error) {
        console.error('❌ Error en PUT /colaboradores/:id:', error);
        let userMsg = error.message || 'Error al actualizar el colaborador';
        if (error.number === 2627 || error.number === 2601 || (error.message && (
            error.message.includes('UNIQUE KEY constraint') || 
            error.message.includes('duplicate key') || 
            error.message.includes('UQ__colabora')
        ))) {
            userMsg = 'El RUT o correo ya pertenece a otro colaborador registrado.';
        }
        res.status(400).json({ success: false, message: userMsg });
    }
});

// DELETE - Eliminar colaborador (ELIMINA PRIMERO TODAS LAS ASIGNACIONES)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 DELETE /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de colaborador inválido' 
            });
        }
        
        const pool = await getConnection();
        
        // Primero, verificar si el colaborador existe
        const colaboradorExistente = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT id, nombre, email 
                FROM INV.colaboradores 
                WHERE id = @id
            `);
        
        if (colaboradorExistente.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Colaborador no encontrado' 
            });
        }
        
        const colaborador = colaboradorExistente.recordset[0];
        
        // Obtener todas las asignaciones del colaborador
        const asignaciones = await pool.request()
            .input('colaborador_id', sql.Int, idNum)
            .query(`
                SELECT id, producto_id 
                FROM INV.asignaciones 
                WHERE colaborador_id = @colaborador_id
            `);
        
        console.log(`📊 Encontradas ${asignaciones.recordset.length} asignaciones para eliminar`);
        
        // Actualizar los productos a estado DISPONIBLE (1)
        for (const asignacion of asignaciones.recordset) {
            if (asignacion.producto_id) {
                await pool.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('id_estado_equipo', sql.Int, 1)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @id_estado_equipo
                        WHERE id = @producto_id
                    `);
                console.log(`✅ Producto ${asignacion.producto_id} actualizado a DISPONIBLE`);
            }
        }
        
        // Eliminar todas las asignaciones del colaborador
        if (asignaciones.recordset.length > 0) {
            await pool.request()
                .input('colaborador_id', sql.Int, idNum)
                .query(`
                    DELETE FROM INV.asignaciones 
                    WHERE colaborador_id = @colaborador_id
                `);
            console.log(`✅ Eliminadas ${asignaciones.recordset.length} asignaciones`);
        }
        
        // Finalmente, eliminar el colaborador
        await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                DELETE FROM INV.colaboradores 
                WHERE id = @id
            `);
        
        console.log(`✅ Colaborador ${colaborador.nombre} (ID: ${idNum}) eliminado exitosamente`);
        
        res.json({ 
            success: true, 
            message: `Colaborador "${colaborador.nombre}" eliminado exitosamente. Se liberaron ${asignaciones.recordset.length} productos.`,
            data: {
                colaborador: colaborador,
                asignacionesEliminadas: asignaciones.recordset.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error en DELETE /colaboradores/:id:', error);
        
        // Manejar específicamente el error de foreign key
        if (error.message && (error.message.includes('FK_') || error.message.includes('REFERENCE'))) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se puede eliminar el colaborador porque tiene asignaciones relacionadas. Intente nuevamente.',
                errorType: 'FOREIGN_KEY_CONSTRAINT'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

console.log('✅ colaboradorRoutes.js configurado correctamente');

module.exports = router;