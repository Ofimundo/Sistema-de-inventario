// backend/models/productoModel.js - VERSIÓN SIN producto_bodega
const { getConnection, sql } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * Mapea los datos del frontend a los nombres de columna de la BD (SIN CANTIDAD)
 */
function mapFrontendToDB(data) {
    const mapped = { ...data };
    
    if (data.es_granel !== undefined) {
        mapped.es_granel = data.es_granel ? 1 : 0;
    } else {
        mapped.es_granel = 0;
    }

    if (data.cantidad !== undefined && data.cantidad !== null) {
        mapped.cantidad = parseInt(data.cantidad) || 1;
    } else {
        mapped.cantidad = 1;
    }
    
    // Mapear estado_id / id_estado_equipo a id_estado_equipo (columna real en BD: int)
    const estadoIdMap = {
        'DISPONIBLE': 1,
        'ASIGNADO': 2,
        'EN MANTENCIÓN': 3,
        'EN_MANTENCION': 3,
        'EN REPARACIÓN': 4,
        'EN_REPARACION': 4,
        'NO DISPONIBLE': 5,
        'NO_DISPONIBLE': 5,
        'BAJA': 6,
        'DONADO': 5,
        'PRÉSTAMO': 7
    };

    if (data.id_estado_equipo !== undefined) {
        mapped.id_estado_equipo = parseInt(data.id_estado_equipo) || 1;
    } else if (data.estado_id !== undefined) {
        mapped.id_estado_equipo = parseInt(data.estado_id) || 1;
    } else if (data.estado !== undefined) {
        if (typeof data.estado === 'number') {
            mapped.id_estado_equipo = data.estado;
        } else {
            mapped.id_estado_equipo = estadoIdMap[data.estado.toString().toUpperCase()] || 1;
        }
    } else {
        mapped.id_estado_equipo = 1;
    }
    delete mapped.estado;
    delete mapped.estado_id;
    
    // Mapear bodega_id (ahora directamente en productos)
    if (data.bodega_id !== undefined) {
        mapped.bodega_id = data.bodega_id;
    }
    
    // Eliminar campos que no existen en la BD
    delete mapped.bodega_nombre;
    delete mapped.estado_nombre;
    delete mapped.estado_color;
    delete mapped.categoria;
    delete mapped.stock_minimo;
    delete mapped.stock_maximo;
    delete mapped.observaciones;
    delete mapped.ubicacion;
    delete mapped.historial_uso;
    delete mapped.historial_mantenciones;
    delete mapped.tiene_mantencion_activa;
    delete mapped.requiere_mantencion;
    delete mapped.mantencion_data;
    delete mapped.tipo_mantencion;
    delete mapped.fecha_mantencion;
    delete mapped.responsable_mantencion;
    delete mapped.descripcion_mantencion;
    delete mapped.costo_mantencion;
    
    return mapped;
}

/**
 * Mapea los datos de la BD al formato del frontend (SIN CANTIDAD)
 */
function mapDBToFrontend(data) {
    if (!data) return data;
    
    const mapped = { ...data };
    
    mapped.cantidad = data.cantidad !== undefined && data.cantidad !== null ? data.cantidad : 1;
    mapped.es_granel = data.es_granel === 1 || data.es_granel === true ? true : false;
    mapped.total_utilizado = data.total_utilizado !== undefined ? data.total_utilizado : 0;
    mapped.stock = mapped.cantidad;
    
    const idToEstadoMap = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE',
        6: 'BAJA',
        7: 'PRÉSTAMO'
    };

    mapped.estado_id = data.id_estado_equipo || 1;
    mapped.estado = data.estado_nombre || idToEstadoMap[mapped.estado_id] || 'DISPONIBLE';
    
    return mapped;
}

class ProductoModel {
    // ============================================
    // MÉTODOS PRINCIPALES - CRUD
    // ============================================

    /**
     * Obtiene todos los productos con filtros (SIN CANTIDAD - SIN producto_bodega)
     */
    async findAll(filters = {}) {
        try {
            const pool = await getConnection();
            let query = `
                SELECT 
                    p.*,
                    b.nombre as bodega_nombre,
                    b.ubicacion as bodega_ubicacion,
                    e.nombre as estado_nombre,
                    e.color as estado_color,
                    (SELECT COUNT(*) FROM INV.producto_uso pu WHERE pu.producto_id = p.id AND pu.fecha_devolucion IS NULL) as total_asignaciones_activas,
                    (SELECT COUNT(*) FROM INV.producto_uso pu WHERE pu.producto_id = p.id) as total_asignaciones
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                LEFT JOIN INV.estados_equipos e ON p.id_estado_equipo = e.id_estado_equipo
                WHERE 1=1
            `;
            const request = pool.request();

            if (filters.nombre) {
                query += ' AND p.nombre LIKE @nombre';
                request.input('nombre', sql.NVarChar, `%${filters.nombre}%`);
            }
            if (filters.marca) {
                query += ' AND p.marca = @marca';
                request.input('marca', sql.NVarChar, filters.marca);
            }
            if (filters.estado) {
                query += ' AND (e.nombre = @estado OR p.id_estado_equipo = @estado_id)';
                request.input('estado', sql.NVarChar, filters.estado);
                request.input('estado_id', sql.Int, parseInt(filters.estado) || 0);
            }
            if (filters.numero_serie) {
                query += ' AND p.numero_serie LIKE @numero_serie';
                request.input('numero_serie', sql.NVarChar, `%${filters.numero_serie}%`);
            }
            if (filters.bodega_id) {
                query += ' AND p.bodega_id = @bodega_id';
                request.input('bodega_id', sql.Int, filters.bodega_id);
            }
            if (filters.search) {
                query += ` AND (
                    p.nombre LIKE @search OR 
                    p.numero_serie LIKE @search OR 
                    p.codigo_qr LIKE @search OR 
                    p.marca LIKE @search OR 
                    p.modelo LIKE @search
                )`;
                request.input('search', sql.NVarChar, `%${filters.search}%`);
            }

            query += ' ORDER BY p.fecha_creacion DESC';
            
            const result = await request.query(query);
            
            // Para cada producto, obtener su historial de uso y mantenciones
            const productos = [];
            for (const p of result.recordset) {
                const producto = mapDBToFrontend(p);
                
                // Obtener historial de uso
                const historialResult = await pool.request()
                    .input('producto_id', sql.Int, p.id)
                    .query(`
                        SELECT 
                            id,
                            producto_id,
                            nombre_usuario,
                            fecha_asignacion,
                            fecha_devolucion,
                            comentario,
                            motivo,
                            estado,
                            email,
                            rut_usuario,
                            cargo,
                            departamento
                        FROM INV.producto_uso 
                        WHERE producto_id = @producto_id 
                        ORDER BY fecha_asignacion DESC
                    `);
                
                // Obtener mantenciones
                const mantencionesResult = await pool.request()
                    .input('producto_id', sql.Int, p.id)
                    .query(`
                        SELECT 
                            id,
                            producto_id,
                            tipo,
                            fecha_inicio,
                            fecha_fin,
                            responsable,
                            descripcion,
                            costo,
                            created_at,
                            updated_at
                        FROM [INV].[mantenciones]
                        WHERE producto_id = @producto_id
                        ORDER BY fecha_inicio DESC
                    `);
                
                // Determinar si tiene mantención activa
                const tieneMantencionActiva = mantencionesResult.recordset.some(m => !m.fecha_fin);
                
                // Mapear para el frontend (sin cantidad)
                producto.historial_uso = historialResult.recordset.map(reg => ({
                    id: reg.id,
                    nombre_persona: reg.nombre_usuario,
                    nombre_usuario: reg.nombre_usuario,
                    fecha_asignacion: reg.fecha_asignacion,
                    fecha_devolucion: reg.fecha_devolucion,
                    condicion_entrega: reg.comentario,
                    observaciones: reg.motivo,
                    estado: reg.estado,
                    email: reg.email,
                    rut_usuario: reg.rut_usuario,
                    cargo: reg.cargo,
                    departamento: reg.departamento
                }));
                
                producto.historial_mantenciones = mantencionesResult.recordset;
                producto.tiene_mantencion_activa = tieneMantencionActiva;
                
                productos.push(producto);
            }
            
            console.log(`✅ findAll: ${productos.length} productos encontrados`);
            return productos;
        } catch (error) {
            console.error('❌ Error en findAll:', error);
            throw error;
        }
    }

    /**
     * Busca un producto por ID (SIN CANTIDAD - SIN producto_bodega)
     */
    async findById(id) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                console.error('❌ ID inválido en findById:', id);
                return null;
            }

            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, idNum)
                .query(`
                    SELECT 
                        p.*,
                        b.nombre as bodega_nombre,
                        b.ubicacion as bodega_ubicacion,
                        e.nombre as estado_nombre,
                        e.color as estado_color,
                        (SELECT COUNT(*) FROM INV.producto_uso pu WHERE pu.producto_id = p.id AND pu.fecha_devolucion IS NULL) as asignaciones_activas
                    FROM INV.productos p
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.estados_equipos e ON p.id_estado_equipo = e.id_estado_equipo
                    WHERE p.id = @id
                `);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            const producto = result.recordset[0];
            
            // Obtener historial de uso
            const historialResult = await pool.request()
                .input('producto_id', sql.Int, idNum)
                .query(`
                    SELECT 
                        id,
                        producto_id,
                        nombre_usuario,
                        fecha_asignacion,
                        fecha_devolucion,
                        comentario,
                        motivo,
                        estado,
                        email,
                        rut_usuario,
                        cargo,
                        departamento
                    FROM INV.producto_uso 
                    WHERE producto_id = @producto_id 
                    ORDER BY fecha_asignacion DESC
                `);
            
            // Obtener mantenciones
            const mantencionesResult = await pool.request()
                .input('producto_id', sql.Int, idNum)
                .query(`
                    SELECT 
                        id,
                        producto_id,
                        tipo,
                        fecha_inicio,
                        fecha_fin,
                        responsable,
                        descripcion,
                        costo,
                        created_at,
                        updated_at
                    FROM [INV].[mantenciones]
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);
            
            const tieneMantencionActiva = mantencionesResult.recordset.some(m => !m.fecha_fin);
            
            // Mapear para el frontend (sin cantidad)
            const mappedProducto = mapDBToFrontend(producto);
            mappedProducto.historial_uso = historialResult.recordset.map(reg => ({
                id: reg.id,
                nombre_persona: reg.nombre_usuario,
                nombre_usuario: reg.nombre_usuario,
                fecha_asignacion: reg.fecha_asignacion,
                fecha_devolucion: reg.fecha_devolucion,
                condicion_entrega: reg.comentario,
                observaciones: reg.motivo,
                estado: reg.estado,
                email: reg.email,
                rut_usuario: reg.rut_usuario,
                cargo: reg.cargo,
                departamento: reg.departamento
            }));
            mappedProducto.historial_mantenciones = mantencionesResult.recordset;
            mappedProducto.tiene_mantencion_activa = tieneMantencionActiva;
            mappedProducto.historial_asignaciones = mappedProducto.historial_uso;
            
            console.log(`✅ Historial cargado para producto ${idNum}: ${mappedProducto.historial_uso.length} registros de uso, ${mappedProducto.historial_mantenciones.length} mantenciones`);
            
            return mappedProducto;
        } catch (error) {
            console.error('❌ Error en findById:', error);
            return null;
        }
    }

    /**
     * Crea un nuevo producto (SIN CANTIDAD - SIN producto_bodega)
     */
    async create(productoData) {
        try {
            const pool = await getConnection();
            
            const dbData = mapFrontendToDB(productoData);
            
            const codigo_qr = dbData.codigo_qr || `QR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            // Verificar si el número de serie ya existe
            if (dbData.numero_serie) {
                const existe = await pool.request()
                    .input('numero_serie', sql.NVarChar, dbData.numero_serie)
                    .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie');
                
                if (existe.recordset.length > 0) {
                    throw new Error('El número de serie ya existe');
                }
            }

            // Verificar si el código QR ya existe
            if (codigo_qr) {
                const existe = await pool.request()
                    .input('codigo_qr', sql.NVarChar, codigo_qr)
                    .query('SELECT id FROM INV.productos WHERE codigo_qr = @codigo_qr');
                
                if (existe.recordset.length > 0) {
                    throw new Error('El código QR ya existe');
                }
            }

            // INSERT con bodega_id, cantidad y es_granel directamente
            const result = await pool.request()
                .input('codigo_qr', sql.NVarChar, codigo_qr)
                .input('nombre', sql.NVarChar, dbData.nombre)
                .input('numero_serie', sql.NVarChar, dbData.numero_serie || '')
                .input('marca', sql.NVarChar, dbData.marca || '')
                .input('modelo', sql.NVarChar, dbData.modelo || '')
                .input('precio', sql.Decimal(18,2), dbData.precio || 0)
                .input('moneda', sql.NVarChar, dbData.moneda || 'CLP')
                .input('oc_numero', sql.NVarChar, dbData.oc_numero || '')
                .input('factura_numero', sql.NVarChar, dbData.factura_numero || '')
                .input('descripcion', sql.NVarChar, dbData.descripcion || '')
                .input('id_estado_equipo', sql.Int, dbData.id_estado_equipo || 1)
                .input('condicion', sql.NVarChar, dbData.condicion || 'NUEVO')
                .input('imagen_path', sql.NVarChar, dbData.imagen_path || '')
                .input('bodega_id', sql.Int, dbData.bodega_id || null)
                .input('cantidad', sql.Int, dbData.cantidad || 1)
                .input('es_granel', sql.Bit, dbData.es_granel ? 1 : 0)
                .input('fecha_creacion', sql.DateTime, new Date())
                .query(`
                    INSERT INTO INV.productos (
                        codigo_qr, nombre, numero_serie, marca, modelo,
                        precio, moneda, oc_numero, factura_numero, descripcion,
                        id_estado_equipo, condicion, imagen_path, bodega_id, cantidad, es_granel, fecha_creacion
                    )
                    OUTPUT INSERTED.id, INSERTED.codigo_qr
                    VALUES (
                        @codigo_qr, @nombre, @numero_serie, @marca, @modelo,
                        @precio, @moneda, @oc_numero, @factura_numero, @descripcion,
                        @id_estado_equipo, @condicion, @imagen_path, @bodega_id, @cantidad, @es_granel, @fecha_creacion
                    )
                `);
            
            const productoId = result.recordset[0].id;

            // Guardar historial de uso si existe
            if (productoData.historial_uso && Array.isArray(productoData.historial_uso) && productoData.historial_uso.length > 0) {
                for (const uso of productoData.historial_uso) {
                    await pool.request()
                        .input('producto_id', sql.Int, productoId)
                        .input('nombre_usuario', sql.NVarChar, uso.nombre_persona || uso.nombre_usuario || '')
                        .input('fecha_asignacion', sql.DateTime, uso.fecha_asignacion ? new Date(uso.fecha_asignacion) : new Date())
                        .input('fecha_devolucion', sql.DateTime, uso.fecha_devolucion ? new Date(uso.fecha_devolucion) : null)
                        .input('comentario', sql.NVarChar, uso.condicion_entrega || '')
                        .input('motivo', sql.NVarChar, uso.observaciones || 'Registro de uso')
                        .input('estado', sql.NVarChar, 'devuelto')
                        .input('email', sql.NVarChar, uso.email || '')
                        .input('rut_usuario', sql.NVarChar, uso.rut_usuario || '')
                        .input('cargo', sql.NVarChar, uso.cargo || '')
                        .input('departamento', sql.NVarChar, uso.departamento || '')
                        .query(`
                            INSERT INTO INV.producto_uso (
                                producto_id, nombre_usuario, fecha_asignacion, fecha_devolucion, 
                                comentario, motivo, estado, email, rut_usuario, cargo, departamento
                            )
                            VALUES (
                                @producto_id, @nombre_usuario, @fecha_asignacion, @fecha_devolucion,
                                @comentario, @motivo, @estado, @email, @rut_usuario, @cargo, @departamento
                            )
                        `);
                }
                console.log(`✅ Historial de uso guardado: ${productoData.historial_uso.length} registros`);
            }

            // Registrar en movimientos
            await this.registrarMovimiento({
                producto_id: productoId,
                accion: 'CREACION',
                usuario_id: null,
                oc_numero: dbData.oc_numero || '',
                factura_numero: dbData.factura_numero || '',
                detalles: 'Producto creado en el sistema'
            });

            const nuevoProducto = await this.findById(productoId);
            return nuevoProducto;
        } catch (error) {
            console.error('❌ Error en create:', error);
            throw error;
        }
    }

    /**
     * Actualiza un producto existente (SIN CANTIDAD - SIN producto_bodega)
     */
    async update(id, productoData) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                throw new Error('ID de producto inválido');
            }

            const pool = await getConnection();
            
            const productoActual = await this.findById(idNum);
            if (!productoActual) {
                throw new Error('Producto no encontrado');
            }

            const dbData = mapFrontendToDB(productoData);

            // Verificar si el número de serie ya existe
            if (dbData.numero_serie && dbData.numero_serie !== productoActual.numero_serie) {
                const existe = await pool.request()
                    .input('numero_serie', sql.NVarChar, dbData.numero_serie)
                    .input('id', sql.Int, idNum)
                    .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie AND id != @id');
                
                if (existe.recordset.length > 0) {
                    throw new Error('El número de serie ya existe');
                }
            }

            // Verificar si el código QR ya existe
            if (dbData.codigo_qr && dbData.codigo_qr !== productoActual.codigo_qr) {
                const existe = await pool.request()
                    .input('codigo_qr', sql.NVarChar, dbData.codigo_qr)
                    .input('id', sql.Int, idNum)
                    .query('SELECT id FROM INV.productos WHERE codigo_qr = @codigo_qr AND id != @id');
                
                if (existe.recordset.length > 0) {
                    throw new Error('El código QR ya existe');
                }
            }

            const transaction = pool.transaction();
            await transaction.begin();

            try {
                // Actualizar tabla productos (incluyendo bodega_id)
                let query = 'UPDATE INV.productos SET ';
                const updates = [];
                const request = transaction.request();
                request.input('id', sql.Int, idNum);

                const updatableFields = [
                    'codigo_qr', 'nombre', 'numero_serie', 'marca', 'modelo',
                    'precio', 'moneda', 'oc_numero', 'factura_numero', 'descripcion', 
                    'id_estado_equipo', 'condicion', 'imagen_path', 'bodega_id', 'cantidad', 'es_granel'
                ];

                updatableFields.forEach(field => {
                    if (dbData[field] !== undefined) {
                        updates.push(`${field} = @${field}`);
                        let type = sql.NVarChar;
                        if (field === 'precio') type = sql.Decimal(18,2);
                        if (field === 'bodega_id' || field === 'id_estado_equipo' || field === 'cantidad') type = sql.Int;
                        if (field === 'es_granel') type = sql.Bit;
                        request.input(field, type, dbData[field]);
                    }
                });

                if (updates.length > 0) {
                    query += updates.join(', ') + ' WHERE id = @id';
                    await request.query(query);
                    console.log(`✅ Producto ${idNum} actualizado. Campos: ${updates.join(', ')}`);
                }

                // ===== MANEJO DEL HISTORIAL DE USO =====
                let historialArray = productoData.historial_uso;
                if (typeof historialArray === 'string') {
                    try {
                        historialArray = JSON.parse(historialArray);
                    } catch (e) {
                        console.error('❌ Error parseando historial:', e);
                        historialArray = [];
                    }
                }
                
                if (historialArray && Array.isArray(historialArray) && historialArray.length > 0) {
                    console.log(`📥 Procesando ${historialArray.length} registros de historial`);
                    
                    await transaction.request()
                        .input('producto_id', sql.Int, idNum)
                        .query('DELETE FROM INV.producto_uso WHERE producto_id = @producto_id');
                    
                    for (const uso of historialArray) {
                        await transaction.request()
                            .input('producto_id', sql.Int, idNum)
                            .input('nombre_usuario', sql.NVarChar, uso.nombre_persona || uso.nombre_usuario || '')
                            .input('fecha_asignacion', sql.DateTime, uso.fecha_asignacion ? new Date(uso.fecha_asignacion) : new Date())
                            .input('fecha_devolucion', sql.DateTime, uso.fecha_devolucion ? new Date(uso.fecha_devolucion) : null)
                            .input('comentario', sql.NVarChar, uso.condicion_entrega || '')
                            .input('motivo', sql.NVarChar, uso.observaciones || 'Registro de uso')
                            .input('estado', sql.NVarChar, 'devuelto')
                            .input('email', sql.NVarChar, uso.email || '')
                            .input('rut_usuario', sql.NVarChar, uso.rut_usuario || '')
                            .input('cargo', sql.NVarChar, uso.cargo || '')
                            .input('departamento', sql.NVarChar, uso.departamento || '')
                            .query(`
                                INSERT INTO INV.producto_uso (
                                    producto_id, nombre_usuario, fecha_asignacion, fecha_devolucion,
                                    comentario, motivo, estado, email, rut_usuario, cargo, departamento
                                )
                                VALUES (
                                    @producto_id, @nombre_usuario, @fecha_asignacion, @fecha_devolucion,
                                    @comentario, @motivo, @estado, @email, @rut_usuario, @cargo, @departamento
                                )
                            `);
                    }
                    console.log(`✅ Historial de uso actualizado: ${historialArray.length} registros`);
                }

                // ===== MANEJO DE MANTENCIONES =====
                if (productoData.requiere_mantencion === true || productoData.requiere_mantencion === 'true') {
                    console.log('🔧 Procesando solicitud de mantención');
                    
                    let mantencionData;
                    if (typeof productoData.mantencion_data === 'string') {
                        try {
                            mantencionData = JSON.parse(productoData.mantencion_data);
                        } catch (e) {
                            mantencionData = productoData.mantencion_data || {};
                        }
                    } else {
                        mantencionData = productoData.mantencion_data || {};
                    }
                    
                    const mantencionActivaCheck = await transaction.request()
                        .input('producto_id', sql.Int, idNum)
                        .query(`
                            SELECT id FROM [INV].[mantenciones] 
                            WHERE producto_id = @producto_id AND fecha_fin IS NULL
                        `);

                    if (mantencionActivaCheck.recordset.length === 0) {
                        const tipo = mantencionData.tipo || 'RUTINA';
                        const fecha_inicio = mantencionData.fecha_inicio || new Date().toISOString().split('T')[0];
                        const responsable = mantencionData.responsable || 'Sistema';
                        const descripcion = mantencionData.descripcion || 'Mantención registrada';
                        const costo = mantencionData.costo || 0;

                        await transaction.request()
                            .input('producto_id', sql.Int, idNum)
                            .input('tipo', sql.NVarChar, tipo)
                            .input('fecha_inicio', sql.DateTime, new Date(fecha_inicio))
                            .input('responsable', sql.NVarChar, responsable)
                            .input('descripcion', sql.NVarChar, descripcion)
                            .input('costo', sql.Decimal(18,2), costo)
                            .query(`
                                INSERT INTO [INV].[mantenciones] (
                                    producto_id, tipo, fecha_inicio, responsable, 
                                    descripcion, costo
                                )
                                VALUES (
                                    @producto_id, @tipo, @fecha_inicio, @responsable,
                                    @descripcion, @costo
                                )
                            `);

                        const nuevoEstadoId = tipo === 'REPARACION' ? 4 : 3;
                        const nuevoEstado = tipo === 'REPARACION' ? 'EN REPARACIÓN' : 'EN MANTENCIÓN';
                        await transaction.request()
                            .input('producto_id', sql.Int, idNum)
                            .input('id_estado_equipo', sql.Int, nuevoEstadoId)
                            .query(`
                                UPDATE [INV].[productos] 
                                SET id_estado_equipo = @id_estado_equipo
                                WHERE id = @producto_id
                            `);
                        
                        await this.registrarCambioEstado(idNum, nuevoEstado, `Mantención ${tipo.toLowerCase()} iniciada`, null);
                    }
                }

                // Registrar movimientos según cambios
                if (dbData.estado && dbData.estado !== productoActual.estado) {
                    await this.registrarMovimiento({
                        producto_id: idNum,
                        accion: 'CAMBIO_ESTADO',
                        usuario_id: null,
                        oc_numero: dbData.oc_numero || '',
                        factura_numero: dbData.factura_numero || '',
                        detalles: `Cambio de estado: ${productoActual.estado} → ${dbData.estado}`
                    });
                }

                // Cambio de bodega (ahora directamente en productos)
                if (dbData.bodega_id !== undefined && dbData.bodega_id !== productoActual.bodega_id) {
                    let bodegaNombre = null;
                    if (dbData.bodega_id) {
                        const bodegaResult = await pool.request()
                            .input('bodega_id', sql.Int, dbData.bodega_id)
                            .query('SELECT nombre FROM INV.bodegas WHERE id = @bodega_id');
                        bodegaNombre = bodegaResult.recordset[0]?.nombre;
                    }
                    
                    await this.registrarMovimiento({
                        producto_id: idNum,
                        accion: 'CAMBIO_BODEGA',
                        usuario_id: null,
                        oc_numero: dbData.oc_numero || '',
                        factura_numero: dbData.factura_numero || '',
                        detalles: `Cambio de bodega: ${productoActual.bodega_nombre || 'Ninguna'} → ${bodegaNombre || 'Ninguna'}`
                    });
                }

                if (dbData.condicion && dbData.condicion !== productoActual.condicion) {
                    await this.registrarMovimiento({
                        producto_id: idNum,
                        accion: 'CAMBIO_CONDICION',
                        usuario_id: null,
                        oc_numero: dbData.oc_numero || '',
                        factura_numero: dbData.factura_numero || '',
                        detalles: `Cambio de condición: ${productoActual.condicion || 'NUEVO'} → ${dbData.condicion}`
                    });
                }

                if (historialArray && historialArray.length > 0) {
                    await this.registrarMovimiento({
                        producto_id: idNum,
                        accion: 'ACTUALIZACION_HISTORIAL',
                        usuario_id: null,
                        oc_numero: dbData.oc_numero || '',
                        factura_numero: dbData.factura_numero || '',
                        detalles: `Historial de uso actualizado (${historialArray.length} registros)`
                    });
                }

                await transaction.commit();

                const productoActualizado = await this.findById(idNum);
                return productoActualizado;
                
            } catch (error) {
                await transaction.rollback();
                console.error('❌ Error en transacción:', error);
                throw error;
            }
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw error;
        }
    }

    /**
     * Elimina un producto (SIN CANTIDAD - SIN producto_bodega)
     */
    async delete(id, options = {}) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                throw new Error('ID de producto inválido');
            }

            const pool = await getConnection();
            
            const producto = await this.findById(idNum);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            if (producto.total_asignaciones_activas > 0) {
                throw new Error('No se puede eliminar un producto con asignaciones activas');
            }

            const transaction = pool.transaction();
            await transaction.begin();

            try {
                // Eliminar imagen asociada si existe
                if (producto.imagen_path && options.deleteImage !== false) {
                    try {
                        const imagePath = path.join(__dirname, '../../uploads', path.basename(producto.imagen_path));
                        await fs.unlink(imagePath);
                        console.log('✅ Imagen eliminada:', imagePath);
                    } catch (err) {
                        console.log('⚠️ No se pudo eliminar la imagen:', err.message);
                    }
                }

                await transaction.request()
                    .input('producto_id', sql.Int, idNum)
                    .query('DELETE FROM INV.producto_uso WHERE producto_id = @producto_id');

                await transaction.request()
                    .input('producto_id', sql.Int, idNum)
                    .query('DELETE FROM [INV].[mantenciones] WHERE producto_id = @producto_id');

                // Ya no es necesario eliminar de producto_bodega
                
                await this.registrarMovimiento({
                    producto_id: idNum,
                    accion: 'ELIMINACION',
                    usuario_id: options.usuario_id || null,
                    oc_numero: '',
                    factura_numero: '',
                    detalles: `Producto eliminado: ${producto.nombre}`
                });

                await transaction.request()
                    .input('id', sql.Int, idNum)
                    .query('DELETE FROM INV.productos WHERE id = @id');

                await transaction.commit();

                console.log(`✅ Producto ${idNum} eliminado correctamente`);
                return true;
                
            } catch (error) {
                await transaction.rollback();
                console.error('❌ Error en transacción:', error);
                throw error;
            }
        } catch (error) {
            console.error('❌ Error en delete:', error);
            throw error;
        }
    }

    // ============================================
    // MÉTODOS PARA HISTORIAL Y ASIGNACIONES
    // ============================================

    /**
     * Obtiene productos asignados a usuarios (no devueltos)
     */
    async getAsignados() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT pu.*, 
                           p.nombre as producto_nombre, 
                           p.marca, p.modelo, p.numero_serie, 
                           p.codigo_qr, p.imagen_path,
                           p.condicion,
                           p.bodega_id,
                           b.nombre as bodega_nombre,
                           e.nombre as estado_nombre,
                           e.color as estado_color
                    FROM INV.producto_uso pu
                    INNER JOIN INV.productos p ON pu.producto_id = p.id
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.estados_equipos e ON p.id_estado_equipo = e.id_estado_equipo
                    WHERE pu.fecha_devolucion IS NULL
                    ORDER BY pu.fecha_asignacion DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error en getAsignados:', error);
            return [];
        }
    }

    /**
     * Obtiene el historial de asignaciones de un usuario por email
     */
    async getHistorialPorEmail(email) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT pu.*, 
                           p.nombre as producto_nombre, 
                           p.marca, p.modelo, p.numero_serie, 
                           p.codigo_qr, p.imagen_path,
                           p.condicion,
                           p.bodega_id,
                           b.nombre as bodega_nombre
                    FROM INV.producto_uso pu
                    INNER JOIN INV.productos p ON pu.producto_id = p.id
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    WHERE pu.email = @email
                    ORDER BY pu.fecha_asignacion DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error en getHistorialPorEmail:', error);
            return [];
        }
    }

    /**
     * Asigna un producto a un usuario (SIN CANTIDAD - SIN producto_bodega)
     */
    async asignarAUsuario(asignacionData) {
        try {
            const pool = await getConnection();
            
            const producto = await this.findById(asignacionData.producto_id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }
            
            if (producto.estado !== 'DISPONIBLE') {
                throw new Error('El producto no está disponible para asignación');
            }

            // Registrar en producto_uso
            const result = await pool.request()
                .input('producto_id', sql.Int, asignacionData.producto_id)
                .input('nombre_usuario', sql.NVarChar, asignacionData.nombre_usuario)
                .input('email', sql.NVarChar, asignacionData.email || '')
                .input('rut_usuario', sql.NVarChar, asignacionData.rut_usuario || '')
                .input('cargo', sql.NVarChar, asignacionData.cargo || '')
                .input('departamento', sql.NVarChar, asignacionData.departamento || '')
                .input('fecha_asignacion', sql.DateTime, new Date())
                .input('motivo', sql.NVarChar, asignacionData.motivo || 'Asignación de equipo')
                .input('comentario', sql.NVarChar, asignacionData.comentario || '')
                .query(`
                    INSERT INTO INV.producto_uso (
                        producto_id, nombre_usuario, email, rut_usuario,
                        cargo, departamento, fecha_asignacion, motivo, comentario
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @producto_id, @nombre_usuario, @email, @rut_usuario,
                        @cargo, @departamento, @fecha_asignacion, @motivo, @comentario
                    )
                `);

            const usoId = result.recordset[0].id;

            // Cambiar estado a ASIGNADO
            await pool.request()
                .input('producto_id', sql.Int, asignacionData.producto_id)
                .input('id_estado_equipo', sql.Int, 2)
                .query(`
                    UPDATE INV.productos 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            await this.registrarMovimiento({
                producto_id: asignacionData.producto_id,
                accion: 'ASIGNACION',
                usuario_id: null,
                oc_numero: '',
                factura_numero: '',
                detalles: `Asignado a: ${asignacionData.nombre_usuario}`
            });

            return { id: usoId, ...asignacionData };
        } catch (error) {
            console.error('Error en asignarAUsuario:', error);
            throw error;
        }
    }

    /**
     * Devuelve un producto asignado
     */
    async devolverProducto(usoId, devolucionData) {
        try {
            const pool = await getConnection();
            
            const asignacion = await pool.request()
                .input('id', sql.Int, usoId)
                .query('SELECT * FROM INV.producto_uso WHERE id = @id');
            
            if (asignacion.recordset.length === 0) {
                throw new Error('Asignación no encontrada');
            }

            const asignacionData = asignacion.recordset[0];

            if (asignacionData.fecha_devolucion !== null) {
                throw new Error('El producto ya fue devuelto');
            }

            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('id', sql.Int, usoId)
                    .input('fecha_devolucion', sql.DateTime, new Date())
                    .input('comentario_devolucion', sql.NVarChar, devolucionData.comentario || '')
                    .query(`
                        UPDATE INV.producto_uso 
                        SET fecha_devolucion = @fecha_devolucion,
                            comentario_devolucion = @comentario_devolucion
                        WHERE id = @id
                    `);

                await transaction.request()
                    .input('producto_id', sql.Int, asignacionData.producto_id)
                    .input('id_estado_equipo', sql.Int, 1)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @id_estado_equipo
                        WHERE id = @producto_id
                    `);

                await transaction.commit();

                await this.registrarMovimiento({
                    producto_id: asignacionData.producto_id,
                    accion: 'DEVOLUCION',
                    usuario_id: null,
                    oc_numero: '',
                    factura_numero: '',
                    detalles: `Devuelto por: ${asignacionData.nombre_usuario}`
                });

                return { success: true };
                
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error en devolverProducto:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas completas de productos (SIN CANTIDAD)
     */
    async getStats() {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .query(`
                    SELECT 
                        COUNT(*) as totalProductos,
                        ISNULL(SUM(CASE WHEN id_estado_equipo = 1 THEN 1 ELSE 0 END), 0) as disponibles,
                        ISNULL(SUM(CASE WHEN id_estado_equipo = 2 THEN 1 ELSE 0 END), 0) as asignados,
                        ISNULL(SUM(CASE WHEN id_estado_equipo IN (3, 4) THEN 1 ELSE 0 END), 0) as enMantencion,
                        ISNULL(SUM(CASE WHEN id_estado_equipo = 4 THEN 1 ELSE 0 END), 0) as enReparacion,
                        ISNULL(SUM(CASE WHEN id_estado_equipo IN (5, 6) THEN 1 ELSE 0 END), 0) as noDisponibles,
                        ISNULL(SUM(precio), 0) as valorTotal,
                        ISNULL(AVG(precio), 0) as precioPromedio
                    FROM INV.productos
                `);
            
            const stats = result.recordset[0] || {};

            stats.totalProductos = stats.totalProductos || 0;
            stats.disponibles = stats.disponibles || 0;
            stats.asignados = stats.asignados || 0;
            stats.enMantencion = stats.enMantencion || 0;
            stats.enReparacion = stats.enReparacion || 0;
            stats.noDisponibles = stats.noDisponibles || 0;
            stats.valorTotal = stats.valorTotal || 0;
            stats.precioPromedio = stats.precioPromedio || 0;

            return stats;
        } catch (error) {
            console.error('❌ Error en getStats:', error);
            return {
                totalProductos: 0,
                disponibles: 0,
                asignados: 0,
                enMantencion: 0,
                enReparacion: 0,
                noDisponibles: 0,
                valorTotal: 0,
                precioPromedio: 0
            };
        }
    }

    /**
     * Obtiene productos disponibles (SIN producto_bodega)
     */
    async getDisponibles() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        p.id,
                        p.codigo_qr,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.precio,
                        p.moneda,
                        p.descripcion,
                        p.estado,
                        p.condicion,
                        p.imagen_path,
                        p.fecha_creacion,
                        p.bodega_id,
                        b.nombre as bodega_nombre,
                        b.ubicacion as bodega_ubicacion
                    FROM INV.productos p
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    WHERE p.id_estado_equipo = 1
                    ORDER BY p.nombre ASC
                `);
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getDisponibles:', error);
            return [];
        }
    }

    /**
     * Obtiene productos por bodega (SIN CANTIDAD - SIN producto_bodega)
     */
    async getProductosPorBodega(bodegaId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('bodega_id', sql.Int, bodegaId)
                .query(`
                    SELECT 
                        p.*,
                        p.bodega_id,
                        b.id as bodega_id,
                        b.nombre as bodega_nombre,
                        b.ubicacion as bodega_ubicacion,
                        e.nombre as estado_nombre,
                        e.color as estado_color
                    FROM INV.productos p
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.estados_equipos e ON p.id_estado_equipo = e.id_estado_equipo
                    WHERE p.bodega_id = @bodega_id
                    ORDER BY p.nombre ASC
                `);
            
            const productos = [];
            for (const p of result.recordset) {
                const producto = mapDBToFrontend(p);
                
                const historialResult = await pool.request()
                    .input('producto_id', sql.Int, p.id)
                    .query(`
                        SELECT 
                            id,
                            producto_id,
                            nombre_usuario,
                            fecha_asignacion,
                            fecha_devolucion,
                            comentario,
                            motivo,
                            estado,
                            email,
                            rut_usuario,
                            cargo,
                            departamento
                        FROM INV.producto_uso 
                        WHERE producto_id = @producto_id 
                        ORDER BY fecha_asignacion DESC
                    `);
                
                const mantencionesResult = await pool.request()
                    .input('producto_id', sql.Int, p.id)
                    .query(`
                        SELECT 
                            id,
                            producto_id,
                            tipo,
                            fecha_inicio,
                            fecha_fin,
                            responsable,
                            descripcion,
                            costo,
                            created_at,
                            updated_at
                        FROM [INV].[mantenciones]
                        WHERE producto_id = @producto_id
                        ORDER BY fecha_inicio DESC
                    `);
                
                producto.historial_uso = historialResult.recordset.map(reg => ({
                    id: reg.id,
                    nombre_persona: reg.nombre_usuario,
                    nombre_usuario: reg.nombre_usuario,
                    fecha_asignacion: reg.fecha_asignacion,
                    fecha_devolucion: reg.fecha_devolucion,
                    condicion_entrega: reg.comentario,
                    observaciones: reg.motivo,
                    estado: reg.estado,
                    email: reg.email,
                    rut_usuario: reg.rut_usuario,
                    cargo: reg.cargo,
                    departamento: reg.departamento
                }));
                
                producto.historial_mantenciones = mantencionesResult.recordset;
                productos.push(producto);
            }
            
            return productos;
        } catch (error) {
            console.error('Error en getProductosPorBodega:', error);
            return [];
        }
    }

    /**
     * Busca un producto por código QR
     */
    async findByQr(codigo_qr) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('codigo_qr', sql.NVarChar, codigo_qr)
                .query(`
                    SELECT p.*, 
                           p.bodega_id,
                           b.nombre as bodega_nombre,
                           e.nombre as estado_nombre,
                           e.color as estado_color
                    FROM INV.productos p
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.estados_equipos e ON p.id_estado_equipo = e.id_estado_equipo
                    WHERE p.codigo_qr = @codigo_qr
                `);
            
            return result.recordset[0] ? mapDBToFrontend(result.recordset[0]) : null;
        } catch (error) {
            console.error('Error en findByQr:', error);
            return null;
        }
    }

    // ============================================
    // MÉTODOS AUXILIARES (sin cambios significativos)
    // ============================================

    async registrarMovimiento(movimientoData) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('producto_id', sql.Int, movimientoData.producto_id)
                .input('accion', sql.NVarChar, movimientoData.accion)
                .input('usuario_id', sql.Int, movimientoData.usuario_id || null)
                .input('oc_numero', sql.NVarChar, movimientoData.oc_numero || '')
                .input('factura_numero', sql.NVarChar, movimientoData.factura_numero || '')
                .input('detalles', sql.NVarChar, movimientoData.detalles || '')
                .input('fecha_hora', sql.DateTime, new Date())
                .query(`
                    INSERT INTO INV.historial (
                        producto_id, accion, usuario_id, oc_numero, 
                        factura_numero, detalles, fecha_hora
                    )
                    VALUES (
                        @producto_id, @accion, @usuario_id, @oc_numero,
                        @factura_numero, @detalles, @fecha_hora
                    )
                `);
        } catch (error) {
            console.error('Error registrando movimiento:', error);
        }
    }

    async getHistorialEstado(productoId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, productoId)
                .query(`
                    SELECT id, producto_id, estado, motivo, fecha
                    FROM INV.historial_estado
                    WHERE producto_id = @producto_id
                    ORDER BY fecha DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error obteniendo historial de estado:', error);
            return [];
        }
    }

    async registrarCambioEstado(productoId, estado, motivo = '', usuarioId = null) {
        try {
            const pool = await getConnection();
            await pool.request()
                .input('producto_id', sql.Int, productoId)
                .input('estado', sql.NVarChar, estado)
                .input('motivo', sql.NVarChar, motivo || '')
                .input('fecha', sql.DateTime, new Date())
                .query(`
                    INSERT INTO INV.historial_estado (producto_id, estado, motivo, fecha)
                    VALUES (@producto_id, @estado, @motivo, @fecha)
                `);
        } catch (error) {
            console.error('Error registrando cambio de estado:', error);
        }
    }

    async getHistorialDocumentos(documentoId) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('documento_id', sql.Int, documentoId)
                .query(`
                    SELECT id, documento_id, accion, usuario_id, usuario_nombre,
                           ip_usuario, detalles, fecha_accion
                    FROM INV.historial_documentos
                    WHERE documento_id = @documento_id
                    ORDER BY fecha_accion DESC
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error obteniendo historial de documentos:', error);
            return [];
        }
    }

    async registrarDonacion(donacionData) {
        try {
            const pool = await getConnection();
            
            const producto = await this.findById(donacionData.producto_id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            const result = await pool.request()
                .input('producto_id', sql.Int, donacionData.producto_id)
                .input('beneficiario', sql.NVarChar, donacionData.beneficiario)
                .input('rut_beneficiario', sql.NVarChar, donacionData.rut_beneficiario || '')
                .input('direccion', sql.NVarChar, donacionData.direccion || '')
                .input('comuna', sql.NVarChar, donacionData.comuna || '')
                .input('ciudad', sql.NVarChar, donacionData.ciudad || '')
                .input('fecha_entrega', sql.DateTime, donacionData.fecha_entrega || new Date())
                .input('documento_firmado', sql.NVarChar, donacionData.documento_firmado || '')
                .input('observaciones', sql.NVarChar, donacionData.observaciones || '')
                .input('usuario_id', sql.Int, donacionData.usuario_id || null)
                .query(`
                    INSERT INTO INV.disposicion_donacion (
                        producto_id, beneficiario, rut_beneficiario, direccion,
                        comuna, ciudad, fecha_entrega, documento_firmado, observaciones, usuario_id
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @producto_id, @beneficiario, @rut_beneficiario, @direccion,
                        @comuna, @ciudad, @fecha_entrega, @documento_firmado, @observaciones, @usuario_id
                    )
                `);

            const donacionId = result.recordset[0].id;

            await pool.request()
                .input('producto_id', sql.Int, donacionData.producto_id)
                .input('id_estado_equipo', sql.Int, 5)
                .input('bodega_id', sql.Int, null) // Limpiar bodega
                .query(`
                    UPDATE INV.productos 
                    SET id_estado_equipo = @id_estado_equipo, bodega_id = @bodega_id
                    WHERE id = @producto_id
                `);

            await this.registrarMovimiento({
                producto_id: donacionData.producto_id,
                accion: 'DONACION',
                usuario_id: donacionData.usuario_id || null,
                oc_numero: '',
                factura_numero: '',
                detalles: `Producto donado a: ${donacionData.beneficiario}`
            });

            return { id: donacionId, ...donacionData, producto_nombre: producto.nombre };
        } catch (error) {
            console.error('Error registrando donación:', error);
            throw error;
        }
    }

    async registrarBaja(bajaData) {
        try {
            const pool = await getConnection();
            
            const producto = await this.findById(bajaData.producto_id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            const result = await pool.request()
                .input('producto_id', sql.Int, bajaData.producto_id)
                .input('motivo_baja', sql.NVarChar, bajaData.motivo_baja)
                .input('fecha_baja', sql.DateTime, bajaData.fecha_baja || new Date())
                .input('autorizado_por', sql.NVarChar, bajaData.autorizado_por || '')
                .input('documento_autorizacion', sql.NVarChar, bajaData.documento_autorizacion || '')
                .input('observaciones', sql.NVarChar, bajaData.observaciones || '')
                .input('usuario_id', sql.Int, bajaData.usuario_id || null)
                .query(`
                    INSERT INTO INV.disposicion_baja (
                        producto_id, motivo_baja, fecha_baja,
                        autorizado_por, documento_autorizacion, observaciones, usuario_id
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @producto_id, @motivo_baja, @fecha_baja,
                        @autorizado_por, @documento_autorizacion, @observaciones, @usuario_id
                    )
                `);

            const bajaId = result.recordset[0].id;

            await pool.request()
                .input('producto_id', sql.Int, bajaData.producto_id)
                .input('id_estado_equipo', sql.Int, 6)
                .input('bodega_id', sql.Int, null) // Limpiar bodega
                .query(`
                    UPDATE INV.productos 
                    SET id_estado_equipo = @id_estado_equipo, bodega_id = @bodega_id
                    WHERE id = @producto_id
                `);

            await this.registrarMovimiento({
                producto_id: bajaData.producto_id,
                accion: 'BAJA',
                usuario_id: bajaData.usuario_id || null,
                oc_numero: '',
                factura_numero: '',
                detalles: `Producto dado de baja. Motivo: ${bajaData.motivo_baja}`
            });

            return { id: bajaId, ...bajaData, producto_nombre: producto.nombre };
        } catch (error) {
            console.error('Error registrando baja:', error);
            throw error;
        }
    }

    async getHistorialDisposiciones() {
        try {
            const pool = await getConnection();
            
            const donaciones = await pool.request()
                .query(`
                    SELECT 
                        'donación' as tipo,
                        d.id,
                        p.nombre as producto,
                        p.codigo_qr,
                        d.beneficiario,
                        d.rut_beneficiario as rut,
                        d.direccion,
                        d.comuna,
                        d.ciudad,
                        d.fecha_entrega as fecha,
                        d.documento_firmado as documento,
                        d.observaciones,
                        u.usuario as registrado_por,
                        b.nombre as bodega_nombre
                    FROM INV.disposicion_donacion d
                    INNER JOIN INV.productos p ON d.producto_id = p.id
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.usuarios u ON d.usuario_id = u.id
                    ORDER BY d.fecha_entrega DESC
                `);

            const bajas = await pool.request()
                .query(`
                    SELECT 
                        'baja' as tipo,
                        b.id,
                        p.nombre as producto,
                        p.codigo_qr,
                        b.motivo_baja as motivo,
                        b.fecha_baja as fecha,
                        b.autorizado_por,
                        b.documento_autorizacion as documento,
                        b.observaciones,
                        u.usuario as registrado_por,
                        bodega.nombre as bodega_nombre
                    FROM INV.disposicion_baja b
                    INNER JOIN INV.productos p ON b.producto_id = p.id
                    LEFT JOIN INV.bodegas bodega ON p.bodega_id = bodega.id
                    LEFT JOIN INV.usuarios u ON b.usuario_id = u.id
                    ORDER BY b.fecha_baja DESC
                `);

            return {
                donaciones: donaciones.recordset,
                bajas: bajas.recordset
            };
        } catch (error) {
            console.error('Error obteniendo historial de disposiciones:', error);
            return { donaciones: [], bajas: [] };
        }
    }

    async updateImagen(id, imagenPath, options = {}) {
        try {
            const pool = await getConnection();
            
            const producto = await this.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            if (producto.imagen_path && options.deleteOld) {
                try {
                    const oldImagePath = path.join(__dirname, '../../uploads', path.basename(producto.imagen_path));
                    await fs.unlink(oldImagePath);
                    console.log('✅ Imagen anterior eliminada:', oldImagePath);
                } catch (err) {
                    console.log('⚠️ No se pudo eliminar la imagen anterior:', err.message);
                }
            }

            await pool.request()
                .input('id', sql.Int, id)
                .input('imagen_path', sql.NVarChar, imagenPath)
                .query(`
                    UPDATE INV.productos 
                    SET imagen_path = @imagen_path
                    WHERE id = @id
                `);

            await this.registrarMovimiento({
                producto_id: id,
                accion: 'CAMBIO_IMAGEN',
                usuario_id: options.usuario_id || null,
                oc_numero: '',
                factura_numero: '',
                detalles: 'Imagen actualizada'
            });

            return await this.findById(id);
        } catch (error) {
            console.error('Error en updateImagen:', error);
            throw error;
        }
    }

    async deleteImagen(id, options = {}) {
        try {
            const pool = await getConnection();
            
            const producto = await this.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            if (!producto.imagen_path) {
                throw new Error('El producto no tiene imagen');
            }

            try {
                const imagePath = path.join(__dirname, '../../uploads', path.basename(producto.imagen_path));
                await fs.unlink(imagePath);
                console.log('✅ Imagen eliminada:', imagePath);
            } catch (err) {
                console.log('⚠️ No se pudo eliminar la imagen:', err.message);
            }

            await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    UPDATE INV.productos 
                    SET imagen_path = NULL
                    WHERE id = @id
                `);

            await this.registrarMovimiento({
                producto_id: id,
                accion: 'ELIMINACION_IMAGEN',
                usuario_id: options.usuario_id || null,
                oc_numero: '',
                factura_numero: '',
                detalles: 'Imagen eliminada'
            });

            return await this.findById(id);
        } catch (error) {
            console.error('Error en deleteImagen:', error);
            throw error;
        }
    }

    /**
     * Descuenta stock de un producto a granel (entrega sin acta)
     */
    async descontarStock(id, cantidadADescontar, observacion = '', usuarioId = null) {
        try {
            const idNum = parseInt(id);
            const cantNum = parseInt(cantidadADescontar);
            if (isNaN(idNum) || idNum <= 0 || isNaN(cantNum) || cantNum <= 0) {
                throw new Error('Parámetros inválidos para descontar stock');
            }

            const pool = await getConnection();
            const producto = await this.findById(idNum);

            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            const stockActual = producto.cantidad !== undefined && producto.cantidad !== null ? producto.cantidad : 1;
            if (cantNum > stockActual) {
                throw new Error(`La cantidad a entregar (${cantNum}) no puede superar el stock actual (${stockActual})`);
            }

            const nuevoStock = stockActual - cantNum;
            const nuevoEstadoId = nuevoStock <= 0 ? 5 : producto.id_estado_equipo; // 5 = NO DISPONIBLE si queda en 0

            await pool.request()
                .input('id', sql.Int, idNum)
                .input('cantidad', sql.Int, nuevoStock)
                .input('id_estado_equipo', sql.Int, nuevoEstadoId)
                .query(`
                    UPDATE INV.productos 
                    SET cantidad = @cantidad,
                        id_estado_equipo = @id_estado_equipo
                    WHERE id = @id
                `);

            await this.registrarMovimiento({
                producto_id: idNum,
                accion: 'ENTREGA_GRANEL',
                usuario_id: usuarioId,
                oc_numero: '',
                factura_numero: '',
                detalles: `Entrega a granel: ${cantNum} unidad(es). Stock restante: ${nuevoStock}. Obs: ${observacion || 'Sin observación'}`
            });

            return await this.findById(idNum);
        } catch (error) {
            console.error('❌ Error en descontarStock:', error);
            throw error;
        }
    }
}

module.exports = new ProductoModel();