// backend/controllers/colaboradorController.js
const { getConnection, sql } = require('../config/database');

const colaboradorController = {
    /**
     * Obtener todos los colaboradores
     */
    getColaboradores: async (req, res) => {
        try {
            console.log('📥 GET /api/colaboradores - Solicitando colaboradores');
            
            const { estado, departamento, search } = req.query;
            
            const pool = await getConnection();
            let query = `
                SELECT 
                    c.*,
                    (SELECT COUNT(*) FROM [INV].[producto_uso] pu 
                     WHERE pu.colaborador_id = c.id AND pu.fecha_devolucion IS NULL) as asignaciones_activas,
                    (SELECT COUNT(*) FROM [INV].[producto_uso] pu 
                     WHERE pu.colaborador_id = c.id) as total_asignaciones
                FROM [INV].[colaboradores] c
                WHERE 1=1
            `;
            
            const request = pool.request();

            if (estado) {
                query += ' AND c.estado = @estado';
                request.input('estado', sql.NVarChar, estado);
            }

            if (departamento) {
                query += ' AND c.departamento = @departamento';
                request.input('departamento', sql.NVarChar, departamento);
            }

            if (search) {
                query += ` AND (
                    c.nombre LIKE @search OR 
                    c.rut LIKE @search OR 
                    c.email LIKE @search OR 
                    c.cargo LIKE @search
                )`;
                request.input('search', sql.NVarChar, `%${search}%`);
            }

            query += ' ORDER BY c.nombre ASC';
            
            const result = await request.query(query);
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Error en getColaboradores:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtener colaborador por ID
     */
    getColaboradorById: async (req, res) => {
        try {
            const { id } = req.params;

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.*,
                        (SELECT COUNT(*) FROM [INV].[producto_uso] pu 
                         WHERE pu.colaborador_id = c.id AND pu.fecha_devolucion IS NULL) as asignaciones_activas,
                        (SELECT COUNT(*) FROM [INV].[producto_uso] pu 
                         WHERE pu.colaborador_id = c.id) as total_asignaciones
                    FROM [INV].[colaboradores] c
                    WHERE c.id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Colaborador no encontrado'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error en getColaboradorById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Crear nuevo colaborador
     */
    createColaborador: async (req, res) => {
        try {
            console.log('📥 POST /api/colaboradores - Creando colaborador');
            console.log('📥 Body:', req.body);

            const { rut, nombre, email, telefono, cargo, departamento, fecha_ingreso, estado, direccion, fecha_nacimiento } = req.body;

            if (!rut || !nombre || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'RUT, nombre y email son requeridos'
                });
            }

            const pool = await getConnection();

            const rutExistente = await pool.request()
                .input('rut', sql.NVarChar, rut)
                .query('SELECT id FROM [INV].[colaboradores] WHERE rut = @rut');

            if (rutExistente.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El RUT ya está registrado'
                });
            }

            const emailExistente = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT id FROM [INV].[colaboradores] WHERE email = @email');

            if (emailExistente.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            const result = await pool.request()
                .input('rut', sql.NVarChar, rut)
                .input('nombre', sql.NVarChar, nombre)
                .input('email', sql.NVarChar, email)
                .input('telefono', sql.NVarChar, telefono || null)
                .input('cargo', sql.NVarChar, cargo || null)
                .input('departamento', sql.NVarChar, departamento || null)
                .input('fecha_ingreso', sql.Date, fecha_ingreso || null)
                .input('estado', sql.NVarChar, estado || 'ACTIVO')
                .input('direccion', sql.NVarChar, direccion || null)
                .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
                .input('creado_por', sql.Int, req.user?.id || null)
                .query(`
                    INSERT INTO [INV].[colaboradores] (
                        rut, nombre, email, telefono, cargo, departamento,
                        fecha_ingreso, estado, direccion, fecha_nacimiento,
                        creado_por, fecha_creacion
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @rut, @nombre, @email, @telefono, @cargo, @departamento,
                        @fecha_ingreso, @estado, @direccion, @fecha_nacimiento,
                        @creado_por, GETDATE()
                    )
                `);

            res.status(201).json({
                success: true,
                message: 'Colaborador creado exitosamente',
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error en createColaborador:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Actualizar colaborador
     */
    updateColaborador: async (req, res) => {
        try {
            const { id } = req.params;
            const { rut, nombre, email, telefono, cargo, departamento, fecha_ingreso, estado, direccion, fecha_nacimiento } = req.body;

            const pool = await getConnection();

            const existe = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT id FROM [INV].[colaboradores] WHERE id = @id');

            if (existe.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Colaborador no encontrado'
                });
            }

            if (rut) {
                const rutExistente = await pool.request()
                    .input('rut', sql.NVarChar, rut)
                    .input('id', sql.Int, id)
                    .query('SELECT id FROM [INV].[colaboradores] WHERE rut = @rut AND id != @id');

                if (rutExistente.recordset.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'El RUT ya está registrado por otro colaborador'
                    });
                }
            }

            if (email) {
                const emailExistente = await pool.request()
                    .input('email', sql.NVarChar, email)
                    .input('id', sql.Int, id)
                    .query('SELECT id FROM [INV].[colaboradores] WHERE email = @email AND id != @id');

                if (emailExistente.recordset.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'El email ya está registrado por otro colaborador'
                    });
                }
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('rut', sql.NVarChar, rut)
                .input('nombre', sql.NVarChar, nombre)
                .input('email', sql.NVarChar, email)
                .input('telefono', sql.NVarChar, telefono || null)
                .input('cargo', sql.NVarChar, cargo || null)
                .input('departamento', sql.NVarChar, departamento || null)
                .input('fecha_ingreso', sql.Date, fecha_ingreso || null)
                .input('estado', sql.NVarChar, estado || 'ACTIVO')
                .input('direccion', sql.NVarChar, direccion || null)
                .input('fecha_nacimiento', sql.Date, fecha_nacimiento || null)
                .input('actualizado_por', sql.Int, req.user?.id || null)
                .query(`
                    UPDATE [INV].[colaboradores]
                    SET 
                        rut = @rut,
                        nombre = @nombre,
                        email = @email,
                        telefono = @telefono,
                        cargo = @cargo,
                        departamento = @departamento,
                        fecha_ingreso = @fecha_ingreso,
                        estado = @estado,
                        direccion = @direccion,
                        fecha_nacimiento = @fecha_nacimiento,
                        actualizado_por = @actualizado_por,
                        fecha_actualizacion = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            res.json({
                success: true,
                message: 'Colaborador actualizado exitosamente',
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error en updateColaborador:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Eliminar colaborador
     */
    deleteColaborador: async (req, res) => {
        try {
            const { id } = req.params;

            const pool = await getConnection();

            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM [INV].[producto_uso] 
                    WHERE colaborador_id = @id
                `);

            if (checkResult.recordset[0].total > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar un colaborador con asignaciones'
                });
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM [INV].[colaboradores] OUTPUT DELETED.* WHERE id = @id');

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Colaborador no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Colaborador eliminado exitosamente',
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error en deleteColaborador:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtener productos asignados a un colaborador
     */
    getProductosAsignados: async (req, res) => {
        try {
            const { id } = req.params;

            const pool = await getConnection();
            const result = await pool.request()
                .input('colaborador_id', sql.Int, id)
                .query(`
                    SELECT 
                        pu.id as asignacion_id,
                        pu.fecha_asignacion,
                        pu.fecha_devolucion,
                        pu.motivo,
                        pu.comentario,
                        pu.estado as estado_asignacion,
                        p.*,
                        b.id as bodega_id,
                        b.nombre as bodega_nombre
                    FROM [INV].[producto_uso] pu
                    INNER JOIN [INV].[productos] p ON pu.producto_id = p.id
                    LEFT JOIN [INV].[producto_bodega] pb ON p.id = pb.producto_id
                    LEFT JOIN [INV].[bodegas] b ON pb.bodega_id = b.id
                    WHERE pu.colaborador_id = @colaborador_id
                    ORDER BY pu.fecha_asignacion DESC
                `);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Error en getProductosAsignados:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtener estadísticas de colaboradores
     */
    getStats: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        COUNT(*) as total_colaboradores,
                        SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
                        SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
                        COUNT(DISTINCT departamento) as total_departamentos,
                        (
                            SELECT COUNT(*) 
                            FROM [INV].[producto_uso] 
                            WHERE fecha_devolucion IS NULL
                        ) as total_equipos_asignados
                    FROM [INV].[colaboradores]
                `);

            res.json({
                success: true,
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error en getStats colaboradores:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtener departamentos únicos
     */
    getDepartamentos: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT departamento 
                    FROM [INV].[colaboradores] 
                    WHERE departamento IS NOT NULL 
                    ORDER BY departamento
                `);

            res.json({
                success: true,
                data: result.recordset.map(r => r.departamento)
            });
        } catch (error) {
            console.error('❌ Error en getDepartamentos:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = colaboradorController;