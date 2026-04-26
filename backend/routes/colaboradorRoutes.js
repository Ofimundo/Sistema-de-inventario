// backend/routes/colaboradorRoutes.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando colaboradorRoutes.js...');

// GET - Obtener todos los colaboradores
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores');
        
        const { estado, departamento, search } = req.query;
        const pool = await getConnection();
        
        // CORREGIDO: Usar la tabla correcta 'asignaciones' en lugar de 'producto_uso'
        let query = `
            SELECT 
                c.id, 
                c.nombre, 
                c.email, 
                c.rut, 
                c.cargo, 
                c.departamento, 
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
        
        const params = [];
        
        if (estado) {
            query += ` AND c.estado = @estado`;
            params.push({ name: 'estado', value: estado });
        }
        
        if (departamento) {
            query += ` AND c.departamento = @departamento`;
            params.push({ name: 'departamento', value: departamento });
        }
        
        if (search) {
            query += ` AND (c.nombre LIKE @search OR c.email LIKE @search OR c.rut LIKE @search)`;
            params.push({ name: 'search', value: `%${search}%` });
        }
        
        query += ` ORDER BY c.nombre`;
        
        let request = pool.request();
        params.forEach(p => request = request.input(p.name, p.value));
        
        const result = await request.query(query);
        
        // Verificar Adan Moris
        const adan = result.recordset.find(c => c.nombre === 'Adan Moris');
        if (adan) {
            console.log(`🔴 ADAN MORIS: Total=${adan.total_asignaciones}, Activas=${adan.asignaciones_activas}`);
        }
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /colaboradores:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener estadísticas de colaboradores
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📥 GET /api/colaboradores/stats');
        
        const pool = await getConnection();
        
        // CORREGIDO: Usar la tabla correcta 'asignaciones'
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

// GET - Obtener colaborador por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        // CORREGIDO: Usar la tabla correcta 'asignaciones'
        const result = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT 
                    c.id, c.nombre, c.email, c.rut, c.cargo, c.departamento,
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

// GET - Obtener productos asignados a un colaborador (CORREGIDO)
router.get('/:id/productos-asignados', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 GET /api/colaboradores/${id}/productos-asignados`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        // CORREGIDO: Usar la tabla correcta 'asignaciones' y 'productos'
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

// Mantener la ruta antigua por compatibilidad (redirige a la nueva)
router.get('/:id/productos', authenticateToken, async (req, res) => {
    req.params.id = req.params.id;
    // Redirigir a la ruta correcta
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

// POST - Crear colaborador
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('📥 POST /api/colaboradores');
        console.log('Body:', req.body);
        
        const { nombre, email, rut, cargo, departamento, telefono, direccion, fecha_nacimiento } = req.body;
        
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
            .input('estado', sql.NVarChar, 'ACTIVO')
            .input('fecha_ingreso', sql.Date, new Date())
            .query(`
                INSERT INTO INV.colaboradores (
                    nombre, email, rut, cargo, departamento, telefono, 
                    direccion, fecha_nacimiento, estado, fecha_ingreso
                ) VALUES (
                    @nombre, @email, @rut, @cargo, @departamento, @telefono,
                    @direccion, @fecha_nacimiento, @estado, @fecha_ingreso
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        res.json({ success: true, message: 'Colaborador creado', data: { id: result.recordset[0].id } });
        
    } catch (error) {
        console.error('❌ Error en POST /colaboradores:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Actualizar colaborador
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 PUT /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const { nombre, email, rut, cargo, departamento, telefono, direccion, fecha_nacimiento, estado } = req.body;
        
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
            .query(`
                UPDATE INV.colaboradores SET
                    nombre = @nombre, email = @email, rut = @rut, cargo = @cargo,
                    departamento = @departamento, telefono = @telefono, direccion = @direccion,
                    fecha_nacimiento = @fecha_nacimiento, estado = @estado
                WHERE id = @id
            `);
        
        res.json({ success: true, message: 'Colaborador actualizado' });
        
    } catch (error) {
        console.error('❌ Error en PUT /colaboradores/:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Eliminar colaborador
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 DELETE /api/colaboradores/${id}`);
        
        const idNum = parseInt(id);
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        // Verificar si tiene productos asignados activos usando la tabla correcta
        const productosAsignados = await pool.request()
            .input('colaborador_id', sql.Int, idNum)
            .query(`
                SELECT COUNT(*) as total 
                FROM INV.asignaciones 
                WHERE colaborador_id = @colaborador_id AND fecha_devolucion IS NULL
            `);
        
        if (productosAsignados.recordset[0].total > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `No se puede eliminar el colaborador porque tiene ${productosAsignados.recordset[0].total} productos asignados activos` 
            });
        }
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .query(`DELETE FROM INV.colaboradores WHERE id = @id`);
        
        res.json({ success: true, message: 'Colaborador eliminado' });
        
    } catch (error) {
        console.error('❌ Error en DELETE /colaboradores/:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ colaboradorRoutes.js configurado correctamente');

module.exports = router;