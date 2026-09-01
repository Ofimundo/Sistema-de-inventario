// backend/controllers/colaboradorController.js
const { getConnection, sql } = require('../config/database');

const colaboradorController = {
    getColaboradores: async (req, res) => {
        try {
            console.log('📥 GET /api/colaboradores');
            
            const { estado, departamento, empresa, search } = req.query;
            const pool = await getConnection();
            
            // Migración automática de registros 'DREAMTEC' a 'LATAM_LITE'
            try {
                await pool.request().query(`
                    UPDATE [INV].[colaboradores] 
                    SET empresa = 'LATAM_LITE' 
                    WHERE UPPER(LTRIM(RTRIM(empresa))) = 'DREAMTEC'
                `);
            } catch (migErr) {
                console.error('⚠️ Error en migración de empresa:', migErr.message);
            }

            let query = `
                SELECT 
                    c.id,
                    c.nombre,
                    c.rut,
                    c.email,
                    c.telefono,
                    c.cargo,
                    c.departamento,
                    c.empresa,
                    c.estado,
                    c.fecha_ingreso,
                    c.direccion,
                    c.fecha_nacimiento,
                    COUNT(a.id) as total_asignaciones,
                    SUM(CASE WHEN a.fecha_devolucion IS NULL AND p.id_estado_equipo = 2 THEN 1 ELSE 0 END) as asignaciones_activas
                FROM [INV].[colaboradores] c
                LEFT JOIN [INV].[asignaciones] a ON c.id = a.colaborador_id
                LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
            `;
            
            const conditions = [];
            const request = pool.request();
            
            if (estado) {
                conditions.push('c.estado = @estado');
                request.input('estado', sql.NVarChar, estado);
            }
            
            if (departamento) {
                conditions.push('c.departamento = @departamento');
                request.input('departamento', sql.NVarChar, departamento);
            }
            
            if (empresa) {
                const empUpper = String(empresa).trim().toUpperCase();
                if (empUpper === 'LATAM_LITE' || empUpper === 'LATAM LITE') {
                    conditions.push("(UPPER(LTRIM(RTRIM(c.empresa))) IN ('LATAM_LITE', 'LATAM LITE', 'DREAMTEC'))");
                } else {
                    conditions.push('c.empresa = @empresa');
                    request.input('empresa', sql.NVarChar, empresa);
                }
            }
            
            if (search) {
                conditions.push('(c.nombre LIKE @search OR c.rut LIKE @search OR c.email LIKE @search)');
                request.input('search', sql.NVarChar, `%${search}%`);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' GROUP BY c.id, c.nombre, c.rut, c.email, c.telefono, c.cargo, c.departamento, c.empresa, c.estado, c.fecha_ingreso, c.direccion, c.fecha_nacimiento';
            query += ' ORDER BY c.nombre';
            
            console.log('📝 Ejecutando consulta SQL...');
            const result = await request.query(query);
            
            console.log(`✅ ${result.recordset.length} colaboradores encontrados`);
            
            const adan = result.recordset.find(c => c.nombre === 'Adan Moris');
            if (adan) {
                console.log(`🔴 ADAN MORIS: Empresa=${adan.empresa}, Total=${adan.total_asignaciones}, Activas=${adan.asignaciones_activas}`);
            } else {
                console.log('🔴 No se encontró a Adan Moris en los resultados');
            }
            
            const conAsignaciones = result.recordset.filter(c => c.total_asignaciones > 0);
            console.log(`📊 ${conAsignaciones.length} colaboradores tienen asignaciones`);
            conAsignaciones.slice(0, 10).forEach(col => {
                console.log(`   ${col.nombre} (${col.empresa || 'Sin empresa'}): Total=${col.total_asignaciones}, Activas=${col.asignaciones_activas}`);
            });
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Error en getColaboradores:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                error: error.toString()
            });
        }
    },

    getColaboradorById: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 GET /api/colaboradores/${id}`);

            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.id,
                        c.nombre,
                        c.rut,
                        c.email,
                        c.telefono,
                        c.cargo,
                        c.departamento,
                        c.empresa,
                        c.estado,
                        c.fecha_ingreso,
                        c.direccion,
                        c.fecha_nacimiento,
                        COUNT(a.id) as total_asignaciones,
                        SUM(CASE WHEN a.fecha_devolucion IS NULL AND p.id_estado_equipo = 2 THEN 1 ELSE 0 END) as asignaciones_activas
                    FROM [INV].[colaboradores] c
                    LEFT JOIN [INV].[asignaciones] a ON c.id = a.colaborador_id
                    LEFT JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE c.id = @id
                    GROUP BY c.id, c.nombre, c.rut, c.email, c.telefono, c.cargo, c.departamento, c.empresa, c.estado, c.fecha_ingreso, c.direccion, c.fecha_nacimiento
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Colaborador no encontrado'
                });
            }

            const colaborador = result.recordset[0];
            
            const productos = await pool.request()
                .input('colaborador_id', sql.Int, id)
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
                            WHEN a.fecha_devolucion IS NULL AND p.id_estado_equipo = 2 THEN 'ACTIVA'
                            ELSE 'FINALIZADA'
                        END as estado_asignacion
                    FROM [INV].[asignaciones] a
                    INNER JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.colaborador_id = @colaborador_id
                    ORDER BY a.fecha_asignacion DESC
                `);
            
            colaborador.productos_asignados = productos.recordset;

            console.log(`✅ Colaborador: ${colaborador.nombre} (${colaborador.empresa || 'Sin empresa'})`);
            console.log(`   Total asignaciones: ${colaborador.total_asignaciones}, Activas: ${colaborador.asignaciones_activas}`);

            res.json({
                success: true,
                data: colaborador
            });
        } catch (error) {
            console.error('❌ Error en getColaboradorById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getProductosAsignados: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 GET /api/colaboradores/${id}/productos-asignados`);

            const pool = await getConnection();
            
            const result = await pool.request()
                .input('colaborador_id', sql.Int, id)
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
                    FROM [INV].[asignaciones] a
                    INNER JOIN [INV].[productos] p ON a.producto_id = p.id
                    WHERE a.colaborador_id = @colaborador_id
                    ORDER BY a.fecha_asignacion DESC
                `);

            console.log(`✅ ${result.recordset.length} asignaciones encontradas`);

            const fs = require('fs');
            const path = require('path');
            const CHECKLIST_DIR = path.join(__dirname, '../uploads/checklist');

            const dataConChecklist = result.recordset.map(row => {
                let checklistData = null;
                let items_pendientes = [];

                const posiblesArchivos = [
                    path.join(CHECKLIST_DIR, `checklist_asignacion_${row.asignacion_id}.json`),
                    path.join(CHECKLIST_DIR, `checklist_producto_${row.producto_id}.json`)
                ];

                for (const p of posiblesArchivos) {
                    if (fs.existsSync(p)) {
                        try {
                            checklistData = JSON.parse(fs.readFileSync(p, 'utf8'));
                            break;
                        } catch (e) {
                            console.error('Error leyendo checklist json:', e);
                        }
                    }
                }

                if (checklistData && Array.isArray(checklistData.items)) {
                    items_pendientes = checklistData.items.filter(item => !item.ok || (item.observacion && item.observacion.trim().length > 0));
                }

                return {
                    ...row,
                    checklistData,
                    items_pendientes
                };
            });

            res.json({
                success: true,
                data: dataConChecklist
            });
        } catch (error) {
            console.error('❌ Error en getProductosAsignados:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    createColaborador: async (req, res) => {
        try {
            console.log('📥 POST /api/colaboradores');
            const { 
                rut, nombre, email, telefono, cargo, departamento, 
                fecha_ingreso, estado, direccion, fecha_nacimiento, 
                empresa
            } = req.body;

            if (!rut || !nombre || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'RUT, nombre y email son requeridos'
                });
            }

            const pool = await getConnection();

            const cleanRut = (r) => r ? String(r).replace(/[^0-9kK]/g, '').toUpperCase() : '';
            const rutLimpio = cleanRut(rut);

            if (rutLimpio) {
                const rutExistente = await pool.request()
                    .input('rut', sql.NVarChar, rut)
                    .input('rutLimpio', sql.NVarChar, rutLimpio)
                    .query(`
                        SELECT id, nombre FROM [INV].[colaboradores] 
                        WHERE rut = @rut 
                           OR REPLACE(REPLACE(REPLACE(rut, '.', ''), '-', ''), ' ', '') = @rutLimpio
                    `);

                if (rutExistente.recordset.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `El colaborador con RUT ${rut} ya se encuentra registrado (${rutExistente.recordset[0].nombre}).`
                    });
                }
            }

            const emailExistente = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT id, nombre FROM [INV].[colaboradores] WHERE LOWER(email) = LOWER(@email)');

            if (emailExistente.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `El correo electrónico ${email} ya se encuentra registrado por el colaborador ${emailExistente.recordset[0].nombre}.`
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
                .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
                .input('creado_por', sql.Int, req.user?.id || 1)
                .query(`
                    INSERT INTO [INV].[colaboradores] (
                        rut, nombre, email, telefono, cargo, departamento,
                        fecha_ingreso, estado, direccion, fecha_nacimiento, empresa,
                        creado_por, fecha_creacion
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @rut, @nombre, @email, @telefono, @cargo, @departamento,
                        @fecha_ingreso, @estado, @direccion, @fecha_nacimiento, @empresa,
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
            let userMsg = error.message || 'Error al guardar el colaborador';
            if (error.number === 2627 || error.number === 2601 || (error.message && (
                error.message.includes('UNIQUE KEY constraint') || 
                error.message.includes('duplicate key') || 
                error.message.includes('UQ__colabora')
            ))) {
                userMsg = 'El colaborador ya se encuentra registrado en el sistema (RUT o correo duplicado).';
            }
            res.status(400).json({
                success: false,
                message: userMsg
            });
        }
    },

    updateColaborador: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                rut, nombre, email, telefono, cargo, departamento, 
                fecha_ingreso, estado, direccion, fecha_nacimiento,
                empresa
            } = req.body;

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
                .input('empresa', sql.NVarChar, empresa || 'OFIMUNDO')
                .input('actualizado_por', sql.Int, req.user?.id || 1)
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
                        empresa = @empresa,
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

    deleteColaborador: async (req, res) => {
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

            // Verificar asignaciones activas (sin fecha_devolucion)
            const asignacionesActivas = await pool.request()
                .input('colaborador_id', sql.Int, idNum)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM [INV].[asignaciones] 
                    WHERE colaborador_id = @colaborador_id 
                      AND fecha_devolucion IS NULL
                `);

            const activasCount = asignacionesActivas.recordset[0].total;
            
            if (activasCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `❌ No se puede eliminar el colaborador porque tiene ${activasCount} producto(s) asignado(s) activos. Primero debe liberar las asignaciones.`,
                    tieneAsignacionesActivas: true,
                    totalActivas: activasCount
                });
            }

            // Verificar asignaciones históricas (con fecha_devolucion)
            const asignacionesHistoricas = await pool.request()
                .input('colaborador_id', sql.Int, idNum)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM [INV].[asignaciones] 
                    WHERE colaborador_id = @colaborador_id 
                      AND fecha_devolucion IS NOT NULL
                `);

            const historicasCount = asignacionesHistoricas.recordset[0].total;

            if (historicasCount > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `⚠️ No se puede eliminar el colaborador porque tiene ${historicasCount} asignaciones históricas. El colaborador tiene un registro de productos que ha usado en el pasado.`,
                    tieneAsignacionesHistoricas: true,
                    totalHistoricas: historicasCount
                });
            }

            // Si no tiene asignaciones, proceder con la eliminación
            const result = await pool.request()
                .input('id', sql.Int, idNum)
                .query(`
                    DELETE FROM [INV].[colaboradores] 
                    OUTPUT DELETED.* 
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Colaborador no encontrado' 
                });
            }

            console.log(`✅ Colaborador ${result.recordset[0].nombre} eliminado exitosamente`);

            res.json({ 
                success: true, 
                message: 'Colaborador eliminado exitosamente',
                data: result.recordset[0]
            });

        } catch (error) {
            console.error('❌ Error en deleteColaborador:', error);
            
            // Manejar específicamente el error de foreign key
            if (error.message && (error.message.includes('FK_asignaciones_colaboradores') || error.message.includes('REFERENCE'))) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No se puede eliminar el colaborador porque tiene asignaciones registradas en el sistema. Primero debe eliminar o finalizar sus asignaciones.',
                    errorType: 'FOREIGN_KEY_CONSTRAINT'
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    },

    getStats: async (req, res) => {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        COUNT(DISTINCT c.id) as total_colaboradores,
                        SUM(CASE WHEN c.estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
                        SUM(CASE WHEN c.estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
                        COUNT(DISTINCT c.departamento) as total_departamentos,
                        COUNT(a.id) as total_equipos_asignados,
                        SUM(CASE WHEN a.fecha_devolucion IS NULL THEN 1 ELSE 0 END) as equipos_activos
                    FROM [INV].[colaboradores] c
                    LEFT JOIN [INV].[asignaciones] a ON c.id = a.colaborador_id
                `);
            
            res.json({
                success: true,
                data: {
                    total_colaboradores: result.recordset[0].total_colaboradores || 0,
                    activos: result.recordset[0].activos || 0,
                    inactivos: result.recordset[0].inactivos || 0,
                    total_departamentos: result.recordset[0].total_departamentos || 0,
                    total_equipos_asignados: result.recordset[0].total_equipos_asignados || 0,
                    equipos_activos: result.recordset[0].equipos_activos || 0
                }
            });
        } catch (error) {
            console.error('❌ Error en getStats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getDepartamentos: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT departamento 
                    FROM [INV].[colaboradores] 
                    WHERE departamento IS NOT NULL AND departamento != ''
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
    },

    getEmpresas: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT empresa 
                    FROM [INV].[colaboradores] 
                    WHERE empresa IS NOT NULL AND empresa != ''
                    ORDER BY empresa
                `);

            const empresas = result.recordset.map(r => r.empresa);
            if (empresas.length === 0) {
                return res.json({
                    success: true,
                    data: ['GLOBAL', 'HIWAY', 'LATAM_LITE', 'OFIMUNDO']
                });
            }

            res.json({
                success: true,
                data: empresas
            });
        } catch (error) {
            console.error('❌ Error en getEmpresas:', error);
            res.json({
                success: true,
                data: ['GLOBAL', 'HIWAY', 'LATAM_LITE', 'OFIMUNDO']
            });
        }
    }
};

module.exports = colaboradorController;