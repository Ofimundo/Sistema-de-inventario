// backend/controllers/productoController.js - VERSIÓN COMPLETA CON ASIGNACIÓN, BODEGAS Y ESTADOS
const { getConnection, sql } = require('../config/database');

// Función auxiliar para obtener texto de estado
function getEstadoTexto(idEstado) {
    const map = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE',
        6: 'BAJA'
    };
    return map[idEstado] || 'DESCONOCIDO';
}

const productoController = {
    // ============================================
    // MÉTODOS PRINCIPALES
    // ============================================
    
    getProductos: async (req, res) => {
        try {
            console.log('📥 GET /api/productos - Solicitando productos');
            console.log('📥 Query params recibidos:', req.query);
            
            const { search, marca, estado, condicion, bodega_id } = req.query;
            
            const pool = await getConnection();
            
            const estadoMap = {
                'DISPONIBLE': 1,
                'ASIGNADO': 2,
                'EN MANTENCIÓN': 3,
                'EN REPARACIÓN': 4,
                'NO DISPONIBLE': 5,
                'BAJA': 6
            };
            
            let query = `
                SELECT 
                    p.id,
                    p.nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.codigo_qr,
                    p.precio,
                    p.moneda,
                    p.descripcion,
                    p.oc_numero,
                    p.factura_numero,
                    p.id_estado_equipo,
                    p.condicion,
                    p.imagen_path,
                    p.fecha_creacion,
                    p.bodega_id,
                    b.nombre as bodega_nombre,
                    -- Campos para filtrar productos dados de baja o donados
                    db.fecha_baja,
                    dd.fecha_entrega as fecha_donacion,
                    -- Datos de asignación activa
                    a.id as asignacion_id,
                    a.fecha_asignacion,
                    a.es_prestamo,
                    a.fecha_devolucion_esperada,
                    -- Datos del colaborador
                    c.id as colaborador_id,
                    c.nombre as colaborador_nombre,
                    c.email as colaborador_email,
                    c.rut as colaborador_rut,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento
                FROM [INV].[productos] p
                LEFT JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                LEFT JOIN [INV].[asignaciones] a ON p.id = a.producto_id AND (a.fecha_devolucion IS NULL OR a.fecha_devolucion = '')
                LEFT JOIN [INV].[colaboradores] c ON a.colaborador_id = c.id
                LEFT JOIN [INV].[disposicion_baja] db ON p.id = db.producto_id
                LEFT JOIN [INV].[disposicion_donacion] dd ON p.id = dd.producto_id
                WHERE 1=1
                    AND p.id_estado_equipo != 6
            `;
            
            const request = pool.request();
            
            if (search && search.trim()) {
                query += ` AND (p.nombre LIKE @search OR p.marca LIKE @search OR p.modelo LIKE @search OR p.numero_serie LIKE @search OR c.nombre LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search.trim()}%`);
            }
            
            if (marca && marca.trim()) {
                query += ` AND p.marca = @marca`;
                request.input('marca', sql.NVarChar, marca);
            }
            
            if (estado && estado.trim()) {
                const estadoId = estadoMap[estado];
                if (estadoId) {
                    query += ` AND p.id_estado_equipo = @estadoId`;
                    request.input('estadoId', sql.Int, estadoId);
                }
            }
            
            if (condicion && condicion.trim()) {
                query += ` AND p.condicion = @condicion`;
                request.input('condicion', sql.NVarChar, condicion);
            }
            
            if (bodega_id && !isNaN(parseInt(bodega_id))) {
                query += ` AND p.bodega_id = @bodegaId`;
                request.input('bodegaId', sql.Int, parseInt(bodega_id));
            }
            
            query += ` ORDER BY p.id DESC`;
            
            const result = await request.query(query);
            
            const productos = result.recordset.map(producto => {
                // Crear objeto asignacion_activa
                let asignacionActiva = null;
                if (producto.asignacion_id) {
                    asignacionActiva = {
                        id: producto.asignacion_id,
                        fecha_asignacion: producto.fecha_asignacion,
                        es_prestamo: producto.es_prestamo === 1 ? 1 : 0,
                        fecha_devolucion_esperada: producto.fecha_devolucion_esperada
                    };
                }
                
                // Crear objeto colaborador_asignado
                let colaboradorAsignado = null;
                if (producto.colaborador_id) {
                    colaboradorAsignado = {
                        id: producto.colaborador_id,
                        nombre: producto.colaborador_nombre,
                        email: producto.colaborador_email,
                        rut: producto.colaborador_rut,
                        cargo: producto.colaborador_cargo,
                        departamento: producto.colaborador_departamento,
                        asignacion_id: producto.asignacion_id,
                        fecha_asignacion: producto.fecha_asignacion,
                        es_prestamo: producto.es_prestamo === 1 ? 1 : 0
                    };
                }
                
                const idEstadoEfectivo = (producto.asignacion_id && (producto.id_estado_equipo === 1 || !producto.id_estado_equipo)) ? 2 : producto.id_estado_equipo;
                
                return {
                    ...producto,
                    id_estado_equipo: idEstadoEfectivo,
                    estado: getEstadoTexto(idEstadoEfectivo),
                    asignacion_activa: asignacionActiva,
                    colaborador_asignado: colaboradorAsignado,
                    fecha_baja: producto.fecha_baja,
                    fecha_donacion: producto.fecha_donacion,
                    es_prestamo: producto.es_prestamo === 1 ? 1 : 0
                };
            });
            
            res.json({
                success: true,
                data: productos
            });
            
        } catch (error) {
            console.error('❌ Error en getProductos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    getProductoById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            
            const productoResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.codigo_qr,
                        p.precio,
                        p.moneda,
                        p.descripcion,
                        p.oc_numero,
                        p.factura_numero,
                        p.id_estado_equipo,
                        p.condicion,
                        p.imagen_path,
                        p.fecha_creacion,
                        p.bodega_id,
                        b.nombre as bodega_nombre,
                        b.ubicacion as bodega_ubicacion,
                        -- Campos para filtrar productos dados de baja o donados
                        db.fecha_baja,
                        dd.fecha_entrega as fecha_donacion,
                        -- Datos de asignación activa
                        a.id as asignacion_id,
                        a.fecha_asignacion,
                        a.es_prestamo,
                        a.fecha_devolucion_esperada,
                        -- Datos del colaborador
                        c.id as colaborador_id,
                        c.nombre as colaborador_nombre,
                        c.email as colaborador_email,
                        c.rut as colaborador_rut,
                        c.cargo as colaborador_cargo,
                        c.departamento as colaborador_departamento
                    FROM [INV].[productos] p
                    LEFT JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                    LEFT JOIN [INV].[asignaciones] a ON p.id = a.producto_id AND (a.fecha_devolucion IS NULL OR a.fecha_devolucion = '')
                    LEFT JOIN [INV].[colaboradores] c ON a.colaborador_id = c.id
                    LEFT JOIN [INV].[disposicion_baja] db ON p.id = db.producto_id
                    LEFT JOIN [INV].[disposicion_donacion] dd ON p.id = dd.producto_id
                    WHERE p.id = @id
                `);

            if (productoResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const row = productoResult.recordset[0];
            
            // Crear objeto asignacion_activa
            let asignacionActiva = null;
            if (row.asignacion_id) {
                asignacionActiva = {
                    id: row.asignacion_id,
                    fecha_asignacion: row.fecha_asignacion,
                    es_prestamo: row.es_prestamo === 1 ? 1 : 0,
                    fecha_devolucion_esperada: row.fecha_devolucion_esperada
                };
            }
            
            // Crear objeto colaborador_asignado
            let colaboradorAsignado = null;
            if (row.colaborador_id) {
                colaboradorAsignado = {
                    id: row.colaborador_id,
                    nombre: row.colaborador_nombre,
                    email: row.colaborador_email,
                    rut: row.colaborador_rut,
                    cargo: row.colaborador_cargo,
                    departamento: row.colaborador_departamento,
                    asignacion_id: row.asignacion_id,
                    fecha_asignacion: row.fecha_asignacion,
                    es_prestamo: row.es_prestamo === 1 ? 1 : 0
                };
            }
            
            const producto = {
                ...row,
                estado: getEstadoTexto(row.id_estado_equipo),
                asignacion_activa: asignacionActiva,
                colaborador_asignado: colaboradorAsignado,
                fecha_baja: row.fecha_baja,
                fecha_donacion: row.fecha_donacion,
                es_prestamo: row.es_prestamo === 1 ? 1 : 0
            };

            const mantencionesResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT id, producto_id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo
                    FROM [INV].[mantenciones]
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);

            const historialResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT id, producto_id, nombre_usuario, fecha_asignacion, fecha_devolucion,
                           comentario, motivo, estado, email, rut_usuario, cargo, departamento
                    FROM [INV].[producto_uso]
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_asignacion DESC
                `);

            res.json({
                success: true,
                data: {
                    ...producto,
                    historial_mantenciones: mantencionesResult.recordset,
                    historial_uso: historialResult.recordset,
                    tiene_mantencion_activa: mantencionesResult.recordset.some(m => !m.fecha_fin)
                }
            });

        } catch (error) {
            console.error('❌ Error en getProductoById:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createProducto: async (req, res) => {
        try {
            console.log('📥 POST /api/productos - Creando producto');
            
            const { 
                nombre, precio, oc_numero, factura_numero,
                descripcion, marca, codigo_qr, modelo, numero_serie, 
                condicion, bodega_id, id_estado_equipo
            } = req.body;

            if (!nombre || !nombre.toString().trim()) {
                return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio.' });
            }

            if (!bodega_id) {
                return res.status(400).json({ success: false, message: 'Debe seleccionar una bodega. La bodega es un campo obligatorio.' });
            }

            const pool = await getConnection();

            const productoResult = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(18,2), precio || 0)
                .input('oc_numero', sql.NVarChar, oc_numero || null)
                .input('factura_numero', sql.NVarChar, factura_numero || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .input('marca', sql.NVarChar, marca || null)
                .input('codigo_qr', sql.NVarChar, codigo_qr || null)
                .input('modelo', sql.NVarChar, modelo || null)
                .input('numero_serie', sql.NVarChar, numero_serie || null)
                .input('condicion', sql.NVarChar, condicion || 'NUEVO')
                .input('id_estado_equipo', sql.Int, id_estado_equipo || 1)
                .input('bodega_id', sql.Int, bodega_id)
                .query(`
                    INSERT INTO [INV].[productos] (
                        nombre, precio, oc_numero, factura_numero, descripcion, 
                        marca, codigo_qr, modelo, numero_serie, condicion, 
                        id_estado_equipo, bodega_id, fecha_creacion
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @nombre, @precio, @oc_numero, @factura_numero, @descripcion,
                        @marca, @codigo_qr, @modelo, @numero_serie, @condicion,
                        @id_estado_equipo, @bodega_id, GETDATE()
                    )
                `);

            const nuevoProducto = productoResult.recordset[0];
            nuevoProducto.estado = getEstadoTexto(nuevoProducto.id_estado_equipo);

            res.json({ success: true, message: 'Producto creado exitosamente', data: nuevoProducto });

        } catch (error) {
            console.error('❌ Error en createProducto:', error);
            if (error.number === 515 || error.message?.includes('Cannot insert the value NULL')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Debe completar todos los campos obligatorios (incluyendo la bodega) antes de guardar.' 
                });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateProducto: async (req, res) => {
        try {
            const { id } = req.params;
            
            const { 
                nombre, precio, oc_numero, factura_numero,
                descripcion, marca, codigo_qr, modelo, numero_serie, 
                condicion, bodega_id, id_estado_equipo
            } = req.body;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            if (!nombre || !nombre.toString().trim()) {
                return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio.' });
            }

            if (!bodega_id) {
                return res.status(400).json({ success: false, message: 'Debe seleccionar una bodega. La bodega es un campo obligatorio.' });
            }

            const pool = await getConnection();

            const existeProducto = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT id FROM [INV].[productos] WHERE id = @id');
            
            if (existeProducto.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(18,2), precio || 0)
                .input('oc_numero', sql.NVarChar, oc_numero || null)
                .input('factura_numero', sql.NVarChar, factura_numero || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .input('marca', sql.NVarChar, marca || null)
                .input('codigo_qr', sql.NVarChar, codigo_qr || null)
                .input('modelo', sql.NVarChar, modelo || null)
                .input('numero_serie', sql.NVarChar, numero_serie || null)
                .input('condicion', sql.NVarChar, condicion || 'NUEVO')
                .input('id_estado_equipo', sql.Int, id_estado_equipo || 1)
                .input('bodega_id', sql.Int, bodega_id)
                .query(`
                    UPDATE [INV].[productos] SET
                        nombre = @nombre,
                        precio = @precio,
                        oc_numero = @oc_numero,
                        factura_numero = @factura_numero,
                        descripcion = @descripcion,
                        marca = @marca,
                        codigo_qr = @codigo_qr,
                        modelo = @modelo,
                        numero_serie = @numero_serie,
                        condicion = @condicion,
                        id_estado_equipo = @id_estado_equipo,
                        bodega_id = @bodega_id
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            const productoActualizado = result.recordset[0];
            productoActualizado.estado = getEstadoTexto(productoActualizado.id_estado_equipo);

            res.json({ success: true, message: 'Producto actualizado exitosamente', data: productoActualizado });

        } catch (error) {
            console.error('❌ Error en updateProducto:', error);
            if (error.number === 515 || error.message?.includes('Cannot insert the value NULL')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Debe completar todos los campos obligatorios (incluyendo la bodega) antes de guardar.' 
                });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    deleteProducto: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .query('DELETE FROM [INV].[producto_uso] WHERE producto_id = @producto_id');

                await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .query('DELETE FROM [INV].[mantenciones] WHERE producto_id = @producto_id');

                await transaction.request()
                    .input('id', sql.Int, id)
                    .query('DELETE FROM [INV].[productos] WHERE id = @id');

                await transaction.commit();

                res.json({ success: true, message: 'Producto eliminado exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en deleteProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS PARA ESTADÍSTICAS
    // ============================================
    
    getStats: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as totalProductos,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 1 THEN 1 ELSE 0 END), 0) as disponibles,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 2 THEN 1 ELSE 0 END), 0) as asignados,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 3 THEN 1 ELSE 0 END), 0) as enMantencion,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 4 THEN 1 ELSE 0 END), 0) as enReparacion,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 5 THEN 1 ELSE 0 END), 0) as noDisponibles,
                    ISNULL(SUM(precio), 0) as valorTotal,
                    ISNULL(AVG(precio), 0) as precioPromedio
                FROM [INV].[productos]
                WHERE id_estado_equipo != 6
            `);

            const bajasCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_baja');
            
            const donacionesCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_donacion');
            
            const laboratoriosCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_laboratorio');

            const stats = result.recordset[0] || {};
            
            res.json({
                success: true,
                data: {
                    totalProductos: stats.totalProductos || 0,
                    valorTotal: stats.valorTotal || 0,
                    precioPromedio: stats.precioPromedio || 0,
                    disponibles: stats.disponibles || 0,
                    asignados: stats.asignados || 0,
                    enMantencion: stats.enMantencion || 0,
                    enReparacion: stats.enReparacion || 0,
                    noDisponibles: stats.noDisponibles || 0,
                    dadosDeBaja: bajasCount.recordset[0]?.total || 0,
                    donados: donacionesCount.recordset[0]?.total || 0,
                    enviadosLaboratorio: laboratoriosCount.recordset[0]?.total || 0
                }
            });

        } catch (error) {
            console.error('❌ Error en getStats:', error);
            res.status(500).json({ success: false, message: error.message, data: {} });
        }
    },

    getProductoEstado: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, nombre, marca, modelo, numero_serie, id_estado_equipo, 
                           condicion, precio, codigo_qr, bodega_id
                    FROM [INV].[productos]
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];
            producto.estado = getEstadoTexto(producto.id_estado_equipo);

            res.json({ success: true, data: producto });

        } catch (error) {
            console.error('❌ Error en getProductoEstado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS PARA MANTENCIONES
    // ============================================
    
    getAllMantenciones: async (req, res) => {
        try {
            console.log('📋 GET /api/productos/mantenciones/todas');
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    m.id,
                    m.producto_id,
                    m.tipo,
                    m.fecha_inicio,
                    m.fecha_fin,
                    m.responsable,
                    m.descripcion,
                    m.costo,
                    m.created_at,
                    m.updated_at,
                    p.nombre as producto_nombre,
                    p.marca as producto_marca,
                    p.modelo as producto_modelo,
                    p.numero_serie as producto_numero_serie,
                    c.id as colaborador_id,
                    c.nombre as colaborador_nombre,
                    c.rut as colaborador_rut,
                    c.cargo as colaborador_cargo,
                    c.departamento as colaborador_departamento,
                    c.empresa as colaborador_empresa
                FROM [INV].[mantenciones] m
                INNER JOIN [INV].[productos] p ON m.producto_id = p.id
                LEFT JOIN [INV].[asignaciones] a ON p.id = a.producto_id AND a.fecha_devolucion IS NULL
                LEFT JOIN [INV].[colaboradores] c ON a.colaborador_id = c.id
                ORDER BY m.id DESC
            `);

            res.json({ success: true, data: result.recordset });
        } catch (error) {
            console.error('❌ Error en getAllMantenciones:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    iniciarMantencion: async (req, res) => {
        try {
            const { producto_id, tipo, fecha_inicio, fecha_fin, hora, responsable, descripcion, costo } = req.body;

            if (!producto_id || !tipo || !responsable) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos (producto_id, tipo, responsable)' });
            }

            const pool = await getConnection();
            
            // Format description to include time if provided
            let descFinal = descripcion || 'Sin descripción';
            if (hora && !descFinal.includes('[Hora:')) {
                descFinal = `[Hora: ${hora}] ${descFinal}`;
            }

            const fechaInicioDate = fecha_inicio ? String(fecha_inicio).split('T')[0] : new Date().toISOString().split('T')[0];
            const fechaFinDate = fecha_fin ? String(fecha_fin).split('T')[0] : null;
            
            // Sanitizar tipo para cumplir la restricción CHECK CK_mantenciones_tipo de SQL Server: ([tipo]='REPARACION' OR [tipo]='RUTINA')
            let tipoSanitizado = (tipo || 'RUTINA').toUpperCase().trim();
            if (tipoSanitizado !== 'REPARACION') {
                tipoSanitizado = 'RUTINA';
            }

            // Set state: 4 for REPARACION, 3 for EN MANTENCION (or 1 DISPONIBLE if already finished)
            const hoyStr = new Date().toISOString().split('T')[0];
            const nuevoEstado = (fechaFinDate && fechaFinDate <= hoyStr) ? 1 : (tipoSanitizado === 'REPARACION' ? 4 : 3);

            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('id_estado_equipo', sql.Int, nuevoEstado)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            const result = await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('tipo', sql.NVarChar, tipoSanitizado)
                .input('fecha_inicio', sql.Date, fechaInicioDate)
                .input('fecha_fin', sql.Date, fechaFinDate)
                .input('responsable', sql.NVarChar, responsable)
                .input('descripcion', sql.NVarChar, descFinal)
                .input('costo', sql.Decimal(10,2), costo ? parseFloat(costo) : 0)
                .query(`
                    INSERT INTO [INV].[mantenciones] (producto_id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo)
                    OUTPUT INSERTED.*
                    VALUES (@producto_id, @tipo, @fecha_inicio, @fecha_fin, @responsable, @descripcion, @costo)
                `);

            res.json({ success: true, message: 'Mantención registrada correctamente', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error registrando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    finalizarMantencion: async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            const { fecha_fin } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, message: 'ID de mantención requerido' });
            }

            const pool = await getConnection();
            
            const mantencionResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT producto_id FROM [INV].[mantenciones] WHERE id = @id');
            
            if (mantencionResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Mantención no encontrada' });
            }
            
            const producto_id = mantencionResult.recordset[0].producto_id;
            const fechaFinFinal = fecha_fin ? String(fecha_fin).split('T')[0] : new Date().toISOString().split('T')[0];

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('fecha_fin', sql.Date, fechaFinFinal)
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET fecha_fin = @fecha_fin, updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);
            
            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('id_estado_equipo', sql.Int, 1)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            res.json({ success: true, message: 'Mantención finalizada correctamente', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error finalizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateMantencion: async (req, res) => {
        try {
            const id = req.params.id || req.body.id;
            const { fecha_inicio, fecha_fin, responsable, descripcion, costo, tipo } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, message: 'ID de mantención requerido' });
            }

            const pool = await getConnection();

            const mantencionCheck = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT producto_id FROM [INV].[mantenciones] WHERE id = @id');

            if (mantencionCheck.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Mantención no encontrada' });
            }

            const producto_id = mantencionCheck.recordset[0].producto_id;

            let tipoSanitizado = (tipo || 'RUTINA').toUpperCase().trim();
            if (tipoSanitizado !== 'REPARACION') {
                tipoSanitizado = 'RUTINA';
            }

            const fechaInicioDate = fecha_inicio ? String(fecha_inicio).split('T')[0] : new Date().toISOString().split('T')[0];
            const fechaFinDate = fecha_fin ? String(fecha_fin).split('T')[0] : null;

            await pool.request()
                .input('id', sql.Int, id)
                .input('tipo', sql.NVarChar, tipoSanitizado)
                .input('fecha_inicio', sql.Date, fechaInicioDate)
                .input('fecha_fin', sql.Date, fechaFinDate)
                .input('responsable', sql.NVarChar, responsable || 'Sistema')
                .input('descripcion', sql.NVarChar, descripcion || '')
                .input('costo', sql.Decimal(10,2), costo !== undefined && costo !== null && costo !== '' ? parseFloat(costo) : 0)
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET tipo = @tipo,
                        fecha_inicio = @fecha_inicio,
                        fecha_fin = @fecha_fin,
                        responsable = @responsable,
                        descripcion = @descripcion,
                        costo = @costo,
                        updated_at = GETDATE()
                    WHERE id = @id
                `);

            const hoyStr = new Date().toISOString().split('T')[0];
            const nuevoEstado = (fechaFinDate && fechaFinDate <= hoyStr) ? 1 : (tipoSanitizado === 'REPARACION' ? 4 : 3);
            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('id_estado_equipo', sql.Int, nuevoEstado)
                .query('UPDATE [INV].[productos] SET id_estado_equipo = @id_estado_equipo WHERE id = @producto_id');

            res.json({ success: true, message: 'Mantención actualizada correctamente' });
        } catch (error) {
            console.error('❌ Error actualizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialMantenciones: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT * FROM [INV].[mantenciones]
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getHistorialMantenciones:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    deleteMantencion: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await getConnection();

            const mRes = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT producto_id, fecha_fin FROM [INV].[mantenciones] WHERE id = @id');

            if (mRes.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Mantención no encontrada' });
            }

            const { producto_id, fecha_fin } = mRes.recordset[0];

            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM [INV].[mantenciones] WHERE id = @id');

            if (!fecha_fin) {
                await pool.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 1)
                    .query('UPDATE [INV].[productos] SET id_estado_equipo = @id_estado_equipo WHERE id = @producto_id');
            }

            res.json({ success: true, message: 'Mantención eliminada correctamente' });
        } catch (error) {
            console.error('❌ Error eliminando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialDisposiciones: async (req, res) => {
        try {
            console.log('📥 GET /api/productos/disposiciones');
            
            const pool = await getConnection();
            
            const bajasResult = await pool.request()
                .query(`
                    SELECT 
                        db.id,
                        db.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        db.motivo_baja as motivo,
                        db.fecha_baja as fecha,
                        db.autorizado_por,
                        db.observaciones,
                        'BAJA' as tipo
                    FROM INV.disposicion_baja db
                    INNER JOIN INV.productos p ON db.producto_id = p.id
                    ORDER BY db.fecha_baja DESC
                `);
            
            const donacionesResult = await pool.request()
                .query(`
                    SELECT 
                        dd.id,
                        dd.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        dd.beneficiario,
                        dd.direccion,
                        dd.fecha_entrega as fecha,
                        dd.observaciones,
                        'DONACION' as tipo
                    FROM INV.disposicion_donacion dd
                    INNER JOIN INV.productos p ON dd.producto_id = p.id
                    ORDER BY dd.fecha_entrega DESC
                `);
            
            const laboratorioResult = await pool.request()
                .query(`
                    SELECT 
                        dl.id,
                        dl.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        dl.laboratorio_nombre,
                        dl.autorizado_por,
                        dl.motivo,
                        dl.observaciones,
                        dl.fecha_envio as fecha,
                        'LABORATORIO' as tipo
                    FROM INV.disposicion_laboratorio dl
                    INNER JOIN INV.productos p ON dl.producto_id = p.id
                    ORDER BY dl.fecha_envio DESC
                `);
            
            res.json({
                success: true,
                data: {
                    bajas: bajasResult.recordset,
                    donaciones: donacionesResult.recordset,
                    laboratorio: laboratorioResult.recordset
                }
            });

        } catch (error) {
            console.error('❌ Error en getHistorialDisposiciones:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: { bajas: [], donaciones: [], laboratorio: [] }
            });
        }
    },

    registrarBaja: async (req, res) => {
        try {
            const { producto_id, motivo_baja, autorizado_por, observaciones } = req.body;

            if (!producto_id) {
                return res.status(400).json({ success: false, message: 'El ID del producto es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('motivo_baja', sql.NVarChar, motivo_baja || 'No especificado')
                    .input('fecha_baja', sql.DateTime, new Date())
                    .input('autorizado_por', sql.NVarChar, autorizado_por || 'Sistema')
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .query(`
                        INSERT INTO INV.disposicion_baja (producto_id, motivo_baja, fecha_baja, autorizado_por, observaciones)
                        VALUES (@producto_id, @motivo_baja, @fecha_baja, @autorizado_por, @observaciones)
                    `);

                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 6)
                    .query(`
                        UPDATE [INV].[productos] 
                        SET id_estado_equipo = @id_estado_equipo,
                            bodega_id = NULL
                        WHERE id = @id
                    `);

                await transaction.commit();

                res.json({ success: true, message: 'Baja registrada exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en registrarBaja:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    registrarDonacion: async (req, res) => {
        try {
            const { producto_id, beneficiario, direccion, observaciones } = req.body;

            if (!producto_id) {
                return res.status(400).json({ success: false, message: 'El ID del producto es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('beneficiario', sql.NVarChar, beneficiario || 'No especificado')
                    .input('direccion', sql.NVarChar, direccion || '')
                    .input('fecha_entrega', sql.DateTime, new Date())
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .query(`
                        INSERT INTO INV.disposicion_donacion (producto_id, beneficiario, direccion, fecha_entrega, observaciones)
                        VALUES (@producto_id, @beneficiario, @direccion, @fecha_entrega, @observaciones)
                    `);

                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 6)
                    .query(`
                        UPDATE [INV].[productos] 
                        SET id_estado_equipo = @id_estado_equipo,
                            bodega_id = NULL
                        WHERE id = @id
                    `);

                await transaction.commit();

                res.json({ success: true, message: 'Donación registrada exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en registrarDonacion:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODO CORREGIDO - REGISTRAR ENVÍO A LABORATORIO
    // ============================================
    registrarLaboratorio: async (req, res) => {
        try {
            console.log('📥 POST /api/productos/disposicion/laboratorio');
            console.log('Body:', req.body);
            
            const { 
                producto_id, 
                laboratorio_nombre, 
                autorizado_por, 
                motivo, 
                observaciones 
            } = req.body;
            
            if (!producto_id || !laboratorio_nombre || !autorizado_por) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos requeridos: producto_id, laboratorio_nombre y autorizado_por' 
                });
            }
            
            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();
            
            try {
                // Verificar producto
                const productoInfo = await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .query(`
                        SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo
                        FROM INV.productos WHERE id = @id
                    `);
                
                if (productoInfo.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
                }
                
                const producto = productoInfo.recordset[0];
                
                // Crear tabla si no existe
                try {
                    await transaction.request().query(`
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='disposicion_laboratorio' AND xtype='U')
                        CREATE TABLE INV.disposicion_laboratorio (
                            id INT IDENTITY(1,1) PRIMARY KEY,
                            producto_id INT NOT NULL,
                            laboratorio_nombre NVARCHAR(255) NOT NULL,
                            autorizado_por NVARCHAR(255) NOT NULL,
                            motivo NVARCHAR(500) NULL,
                            observaciones NVARCHAR(MAX) NULL,
                            documento_respaldo NVARCHAR(500) NULL,
                            fecha_envio DATETIME DEFAULT GETDATE(),
                            FOREIGN KEY (producto_id) REFERENCES INV.productos(id)
                        )
                    `);
                } catch (tableError) {
                    console.log('⚠️ Tabla ya existe o error:', tableError.message);
                }
                
                // Insertar en disposicion_laboratorio
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('laboratorio_nombre', sql.NVarChar, laboratorio_nombre)
                    .input('autorizado_por', sql.NVarChar, autorizado_por)
                    .input('motivo', sql.NVarChar, motivo || 'Envío a laboratorio para análisis')
                    .input('observaciones', sql.NVarChar, observaciones || null)
                    .query(`
                        INSERT INTO INV.disposicion_laboratorio (
                            producto_id, laboratorio_nombre, autorizado_por, 
                            motivo, observaciones, fecha_envio
                        ) VALUES (
                            @producto_id, @laboratorio_nombre, @autorizado_por,
                            @motivo, @observaciones, GETDATE()
                        )
                    `);
                
                // Cambiar estado a NO DISPONIBLE (5)
                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 5)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @id_estado_equipo
                        WHERE id = @id
                    `);
                
                // Registrar en historial
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('accion', sql.NVarChar, 'LABORATORIO')
                    .input('detalles', sql.NVarChar, `Producto enviado a laboratorio: ${laboratorio_nombre}. Autorizado por: ${autorizado_por}`)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                        VALUES (@producto_id, @accion, @detalles, @fecha_hora)
                    `);
                
                await transaction.commit();
                
                console.log(`✅ Producto ${producto_id} enviado a laboratorio exitosamente`);
                
                res.json({ 
                    success: true, 
                    message: `Producto enviado a laboratorio: ${laboratorio_nombre}`,
                    data: producto 
                });
                
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en registrarLaboratorio:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================
    
    getMarcas: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT marca FROM [INV].[productos]
                    WHERE marca IS NOT NULL AND marca != '' AND id_estado_equipo != 6
                    ORDER BY marca
                `);

            res.json({ success: true, data: result.recordset.map(r => r.marca) });

        } catch (error) {
            console.error('❌ Error en getMarcas:', error);
            res.json({ success: true, data: [] });
        }
    },

    // ============================================
    // NUEVO MÉTODO - OBTENER BODEGAS
    // ============================================
    getBodegas: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query('SELECT id, nombre FROM INV.bodegas ORDER BY nombre');
            
            res.json({ success: true, data: result.recordset });
        } catch (error) {
            console.error('❌ Error en getBodegas:', error);
            res.json({ success: true, data: [] });
        }
    },

    // ============================================
    // NUEVO MÉTODO - OBTENER ESTADOS
    // ============================================
    getEstados: async (req, res) => {
        try {
            const estados = [
                { id: 1, nombre: 'DISPONIBLE' },
                { id: 2, nombre: 'ASIGNADO' },
                { id: 3, nombre: 'EN MANTENCIÓN' },
                { id: 4, nombre: 'EN REPARACIÓN' },
                { id: 5, nombre: 'NO DISPONIBLE' }
            ];
            res.json({ success: true, data: estados });
        } catch (error) {
            console.error('❌ Error en getEstados:', error);
            res.json({ success: true, data: [] });
        }
    },

    getProductosDisponibles: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.precio,
                        p.condicion,
                        p.bodega_id,
                        b.nombre as bodega_nombre
                    FROM [INV].[productos] p
                    LEFT JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                    WHERE p.id_estado_equipo = 1
                    ORDER BY p.nombre
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getProductosDisponibles:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getProductosPorBodega: async (req, res) => {
        try {
            const { bodegaId } = req.params;
            
            if (!bodegaId || isNaN(parseInt(bodegaId))) {
                return res.status(400).json({ success: false, message: 'ID de bodega inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('bodega_id', sql.Int, bodegaId)
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.precio,
                        p.condicion,
                        p.id_estado_equipo,
                        p.bodega_id,
                        b.nombre as bodega_nombre
                    FROM [INV].[productos] p
                    INNER JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                    WHERE p.bodega_id = @bodega_id AND p.id_estado_equipo != 6
                    ORDER BY p.nombre
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getProductosPorBodega:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialUso: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT * FROM [INV].[producto_uso]
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_asignacion DESC
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getHistorialUso:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    verificarQR: async (req, res) => {
        try {
            const { id } = req.params;
            const { qr } = req.query;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, nombre, codigo_qr FROM [INV].[productos]
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];

            res.json({
                success: true,
                data: {
                    producto_id: producto.id,
                    nombre: producto.nombre,
                    qr_actual: producto.codigo_qr,
                    qr_recibido: qr,
                    coincide: producto.codigo_qr === qr
                }
            });

        } catch (error) {
            console.error('❌ Error verificando QR:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_estado_equipo } = req.body;

            if (id_estado_equipo === undefined) {
                return res.status(400).json({ success: false, message: 'El estado es requerido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('id_estado_equipo', sql.Int, id_estado_equipo)
                .query(`
                    UPDATE [INV].[productos] SET id_estado_equipo = @id_estado_equipo
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];
            producto.estado = getEstadoTexto(producto.id_estado_equipo);

            res.json({ success: true, message: 'Estado actualizado', data: producto });

        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    finalizarMantencionPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_fin } = req.body;

            if (!id || !fecha_fin) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
            }

            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .input('fecha_fin', sql.DateTime, new Date(fecha_fin))
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET fecha_fin = @fecha_fin, updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE producto_id = @producto_id AND fecha_fin IS NULL
                `);
            
            await pool.request()
                .input('producto_id', sql.Int, id)
                .input('id_estado_equipo', sql.Int, 1)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            res.json({ success: true, message: 'Mantención finalizada', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error finalizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODO PARA ASIGNAR PRODUCTO A COLABORADOR
    // ============================================
    asignarProducto: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                colaborador_id, 
                motivo, 
                observaciones, 
                fecha_asignacion,
                es_prestamo,
                fecha_devolucion_esperada 
            } = req.body;

            console.log('📥 POST /api/productos/asignar:', { 
                producto_id: id, 
                colaborador_id, 
                es_prestamo 
            });

            if (!colaborador_id) {
                return res.status(400).json({ success: false, message: 'El colaborador es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                // Verificar producto
                const productoResult = await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        SELECT id, nombre, id_estado_equipo, cantidad, es_granel 
                        FROM INV.productos WHERE id = @id
                    `);

                if (productoResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
                }

                const producto = productoResult.recordset[0];

                if (producto.id_estado_equipo !== 1) {
                    await transaction.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        message: `No se puede asignar. El producto está ${getEstadoTexto(producto.id_estado_equipo)}` 
                    });
                }

                // Verificar colaborador
                const colaboradorResult = await transaction.request()
                    .input('id', sql.Int, colaborador_id)
                    .query(`
                        SELECT id, nombre, email, rut
                        FROM INV.colaboradores WHERE id = @id AND estado = 'ACTIVO'
                    `);

                if (colaboradorResult.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, message: 'Colaborador no encontrado o inactivo' });
                }

                const colaborador = colaboradorResult.recordset[0];

                // Finalizar asignaciones activas anteriores
                await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .query(`
                        UPDATE INV.asignaciones 
                        SET fecha_devolucion = GETDATE()
                        WHERE producto_id = @producto_id AND (fecha_devolucion IS NULL OR fecha_devolucion = '')
                    `);

                // Crear nueva asignación
                const esPrestamoValue = (es_prestamo === true || es_prestamo === 1 || es_prestamo === '1') ? 1 : 0;
                
                const asignacionResult = await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .input('colaborador_id', sql.Int, colaborador_id)
                    .input('fecha_asignacion', sql.DateTime, fecha_asignacion || new Date())
                    .input('motivo', sql.NVarChar, motivo || (esPrestamoValue ? 'Préstamo de equipo' : 'Asignación de equipo'))
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .input('es_prestamo', sql.Bit, esPrestamoValue)
                    .input('fecha_devolucion_esperada', sql.DateTime, esPrestamoValue ? (fecha_devolucion_esperada || null) : null)
                    .query(`
                        INSERT INTO INV.asignaciones (
                            producto_id, colaborador_id, fecha_asignacion, 
                            motivo, observaciones, es_prestamo, fecha_devolucion_esperada
                        )
                        OUTPUT INSERTED.*
                        VALUES (
                            @producto_id, @colaborador_id, @fecha_asignacion,
                            @motivo, @observaciones, @es_prestamo, @fecha_devolucion_esperada
                        )
                    `);

                const nuevaAsignacion = asignacionResult.recordset[0];

                const isGranel = producto.es_granel === 1 || producto.es_granel === true;
                const cantActual = producto.cantidad !== undefined && producto.cantidad !== null ? parseInt(producto.cantidad) : 1;
                
                if (isGranel) {
                    const nuevaCant = Math.max(0, cantActual - 1);
                    const nuevoEstado = nuevaCant <= 0 ? 5 : 1;
                    await transaction.request()
                        .input('id', sql.Int, id)
                        .input('nueva_cant', sql.Int, nuevaCant)
                        .input('id_estado_equipo', sql.Int, nuevoEstado)
                        .query(`
                            UPDATE INV.productos 
                            SET cantidad = @nueva_cant,
                                id_estado_equipo = @id_estado_equipo 
                            WHERE id = @id
                        `);

                    await transaction.request()
                        .input('producto_id', sql.Int, id)
                        .input('accion', sql.NVarChar, 'ENTREGA_GRANEL')
                        .input('detalles', sql.NVarChar, `Entrega a granel: 1 unidad(es). Asignado a colaborador ID: ${colaborador_id}. Motivo: ${motivo || 'Asignación'}`)
                        .input('fecha_hora', sql.DateTime, new Date())
                        .query(`
                            INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                            VALUES (@producto_id, @accion, @detalles, @fecha_hora)
                        `);
                } else {
                    await transaction.request()
                        .input('id', sql.Int, id)
                        .input('id_estado_equipo', sql.Int, 2)
                        .query(`
                            UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id
                        `);
                }

                await transaction.commit();

                console.log(`✅ Asignación creada - ID: ${nuevaAsignacion.id}, es_prestamo: ${esPrestamoValue}`);

                res.status(201).json({
                    success: true,
                    message: esPrestamoValue ? 'Préstamo registrado correctamente' : 'Producto asignado correctamente',
                    data: nuevaAsignacion,
                    producto: {
                        id: producto.id,
                        nombre: producto.nombre,
                        estado: 'ASIGNADO',
                        es_prestamo: esPrestamoValue
                    }
                });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en asignarProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // POST - Descontar stock de producto a granel
    descontarStock: async (req, res) => {
        try {
            const { id } = req.params;
            const { cantidad, observacion } = req.body;
            const productoModel = require('../models/productoModel');

            if (!cantidad || parseInt(cantidad) <= 0) {
                return res.status(400).json({ success: false, message: 'La cantidad a entregar debe ser mayor a 0' });
            }

            const productoActualizado = await productoModel.descontarStock(id, cantidad, observacion, req.user?.id || null);

            res.json({
                success: true,
                message: `Se descontaron ${cantidad} unidad(es) correctamente.`,
                data: productoActualizado
            });
        } catch (error) {
            console.error('❌ Error en descontarStock controller:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = productoController;