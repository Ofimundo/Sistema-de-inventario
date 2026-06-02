// backend/routes/colaboradorRoutes.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando colaboradorRoutes.js...');

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
                data: ['GLOBAL', 'DREAMTEC', 'OFIMUNDO'] 
            });
        }
        
        res.json({ success: true, data: empresas });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores/empresas:', error);
        res.json({ 
            success: true, 
            data: ['GLOBAL', 'DREAMTEC', 'OFIMUNDO'] 
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
        
        if (!nombre || !email) {
            return res.status(400).json({ success: false, message: 'Nombre y email son requeridos' });
        }
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('rut', sql.NVarChar, rut || '')
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
            .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
            .input('estado', sql.NVarChar, 'ACTIVO')
            .input('fecha_ingreso', sql.Date, new Date())
            .query(`
                INSERT INTO INV.colaboradores (
                    nombre, email, rut, cargo, departamento, telefono, 
                    direccion, fecha_nacimiento, empresa, estado, fecha_ingreso
                ) VALUES (
                    @nombre, @email, @rut, @cargo, @departamento, @telefono,
                    @direccion, @fecha_nacimiento, @empresa, @estado, @fecha_ingreso
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        res.json({ success: true, message: 'Colaborador creado', data: { id: result.recordset[0].id } });
        
    } catch (error) {
        console.error('❌ Error en POST /colaboradores:', error);
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
        
        const { nombre, email, rut, cargo, departamento, telefono, direccion, fecha_nacimiento, estado, empresa } = req.body;
        
        const pool = await getConnection();
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .input('nombre', sql.NVarChar, nombre)
            .input('email', sql.NVarChar, email)
            .input('rut', sql.NVarChar, rut || '')
            .input('cargo', sql.NVarChar, cargo || '')
            .input('departamento', sql.NVarChar, departamento || '')
            .input('telefono', sql.NVarChar, telefono || '')
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
            .input('estado', sql.NVarChar, estado || 'ACTIVO')
            .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
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
                    empresa = @empresa
                WHERE id = @id
            `);
        
        res.json({ success: true, message: 'Colaborador actualizado' });
        
    } catch (error) {
        console.error('❌ Error en PUT /colaboradores/:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Eliminar colaborador (ELIMINA PRIMERO LAS ASIGNACIONES)
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
        const transaction = pool.transaction();
        await transaction.begin();
        
        try {
            // Verificar si el colaborador existe
            const colaboradorExistente = await transaction.request()
                .input('id', sql.Int, idNum)
                .query(`
                    SELECT id, nombre, email 
                    FROM INV.colaboradores 
                    WHERE id = @id
                `);
            
            if (colaboradorExistente.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: 'Colaborador no encontrado' 
                });
            }
            
            const colaborador = colaboradorExistente.recordset[0];
            
            // 1. Primero, obtener todas las asignaciones del colaborador
            const asignaciones = await transaction.request()
                .input('colaborador_id', sql.Int, idNum)
                .query(`
                    SELECT id, producto_id 
                    FROM INV.asignaciones 
                    WHERE colaborador_id = @colaborador_id
                `);
            
            console.log(`📊 Encontradas ${asignaciones.recordset.length} asignaciones para eliminar`);
            
            // 2. Para cada asignación, actualizar el estado del producto a DISPONIBLE (1)
            for (const asignacion of asignaciones.recordset) {
                await transaction.request()
                    .input('producto_id', sql.Int, asignacion.producto_id)
                    .input('id_estado_equipo', sql.Int, 1)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @id_estado_equipo
                        WHERE id = @producto_id
                    `);
                console.log(`✅ Producto ${asignacion.producto_id} actualizado a DISPONIBLE`);
            }
            
            // 3. Eliminar todas las asignaciones del colaborador
            await transaction.request()
                .input('colaborador_id', sql.Int, idNum)
                .query(`
                    DELETE FROM INV.asignaciones 
                    WHERE colaborador_id = @colaborador_id
                `);
            
            console.log(`✅ Eliminadas ${asignaciones.recordset.length} asignaciones`);
            
            // 4. Finalmente, eliminar el colaborador
            await transaction.request()
                .input('id', sql.Int, idNum)
                .query(`
                    DELETE FROM INV.colaboradores 
                    WHERE id = @id
                `);
            
            await transaction.commit();
            
            console.log(`✅ Colaborador ${colaborador.nombre} (ID: ${idNum}) eliminado exitosamente junto con ${asignaciones.recordset.length} asignaciones`);
            
            res.json({ 
                success: true, 
                message: `Colaborador "${colaborador.nombre}" eliminado exitosamente. Se liberaron ${asignaciones.recordset.length} productos.`,
                data: {
                    colaborador: colaborador,
                    asignacionesEliminadas: asignaciones.recordset.length
                }
            });
            
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error en transacción:', error);
            throw error;
        }
        
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