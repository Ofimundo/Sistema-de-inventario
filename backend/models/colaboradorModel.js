// backend/models/colaboradorModel.js
const { getConnection, sql } = require('../config/database');

class ColaboradorModel {
    /**
     * Obtener todos los colaboradores con filtros
     */
    async findAll(filters = {}) {
        try {
            const pool = await getConnection();
            let query = `
                SELECT 
                    c.*,
                    -- Temporalmente sin las subconsultas que usan colaborador_id
                    0 as asignaciones_activas,
                    0 as total_asignaciones
                FROM [INV].[colaboradores] c
                WHERE 1=1
            `;
            
            const request = pool.request();

            if (filters.estado) {
                query += ' AND c.estado = @estado';
                request.input('estado', sql.NVarChar, filters.estado);
            }

            if (filters.departamento) {
                query += ' AND c.departamento = @departamento';
                request.input('departamento', sql.NVarChar, filters.departamento);
            }

            if (filters.search) {
                query += ` AND (
                    c.nombre LIKE @search OR 
                    c.rut LIKE @search OR 
                    c.email LIKE @search OR 
                    c.cargo LIKE @search
                )`;
                request.input('search', sql.NVarChar, `%${filters.search}%`);
            }

            query += ' ORDER BY c.nombre ASC';
            
            console.log('📝 Query colaboradores:', query);
            const result = await request.query(query);
            console.log(`📥 Colaboradores encontrados: ${result.recordset.length}`);
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en findAll colaboradores:', error);
            throw error;
        }
    }

    /**
     * Buscar colaborador por ID
     */
    async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        c.*,
                        0 as asignaciones_activas,
                        0 as total_asignaciones
                    FROM [INV].[colaboradores] c
                    WHERE c.id = @id
                `);

            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en findById colaborador:', error);
            throw error;
        }
    }

    /**
     * Buscar colaborador por RUT
     */
    async findByRut(rut, excludeId = null) {
        try {
            const pool = await getConnection();
            let query = 'SELECT id FROM [INV].[colaboradores] WHERE rut = @rut';
            
            if (excludeId) {
                query += ' AND id != @excludeId';
            }

            const request = pool.request()
                .input('rut', sql.NVarChar, rut);
            
            if (excludeId) {
                request.input('excludeId', sql.Int, excludeId);
            }

            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en findByRut colaborador:', error);
            throw error;
        }
    }

    /**
     * Buscar colaborador por email
     */
    async findByEmail(email, excludeId = null) {
        try {
            const pool = await getConnection();
            let query = 'SELECT id FROM [INV].[colaboradores] WHERE email = @email';
            
            if (excludeId) {
                query += ' AND id != @excludeId';
            }

            const request = pool.request()
                .input('email', sql.NVarChar, email);
            
            if (excludeId) {
                request.input('excludeId', sql.Int, excludeId);
            }

            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en findByEmail colaborador:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo colaborador
     */
    async create(data) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('rut', sql.NVarChar, data.rut)
                .input('nombre', sql.NVarChar, data.nombre)
                .input('email', sql.NVarChar, data.email)
                .input('telefono', sql.NVarChar, data.telefono || null)
                .input('cargo', sql.NVarChar, data.cargo || null)
                .input('departamento', sql.NVarChar, data.departamento || null)
                .input('fecha_ingreso', sql.Date, data.fecha_ingreso || null)
                .input('estado', sql.NVarChar, data.estado || 'ACTIVO')
                .input('direccion', sql.NVarChar, data.direccion || null)
                .input('fecha_nacimiento', sql.Date, data.fecha_nacimiento || null)
                .input('creado_por', sql.Int, data.usuario_id || null)
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

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en create colaborador:', error);
            throw error;
        }
    }

    /**
     * Actualizar colaborador
     */
    async update(id, data) {
        try {
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('rut', sql.NVarChar, data.rut)
                .input('nombre', sql.NVarChar, data.nombre)
                .input('email', sql.NVarChar, data.email)
                .input('telefono', sql.NVarChar, data.telefono || null)
                .input('cargo', sql.NVarChar, data.cargo || null)
                .input('departamento', sql.NVarChar, data.departamento || null)
                .input('fecha_ingreso', sql.Date, data.fecha_ingreso || null)
                .input('estado', sql.NVarChar, data.estado || 'ACTIVO')
                .input('direccion', sql.NVarChar, data.direccion || null)
                .input('fecha_nacimiento', sql.Date, data.fecha_nacimiento || null)
                .input('actualizado_por', sql.Int, data.usuario_id || null)
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

            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en update colaborador:', error);
            throw error;
        }
    }

    /**
     * Eliminar colaborador (solo si no tiene asignaciones)
     */
    async delete(id) {
        try {
            const pool = await getConnection();
            
            // Verificar si tiene asignaciones (por ahora, solo verificamos si existe en producto_uso por nombre)
            // Esto es temporal hasta que agreguemos colaborador_id
            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, `%${id}%`)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM [INV].[producto_uso] 
                    WHERE nombre_usuario LIKE @nombre
                `);

            if (checkResult.recordset[0].total > 0) {
                throw new Error('No se puede eliminar un colaborador con asignaciones');
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM [INV].[colaboradores] OUTPUT DELETED.* WHERE id = @id');

            return result.recordset[0] || null;
        } catch (error) {
            console.error('❌ Error en delete colaborador:', error);
            throw error;
        }
    }

    /**
     * Obtener productos asignados a un colaborador - MODIFICADO
     */
    async getProductosAsignados(colaboradorId) {
        try {
            const pool = await getConnection();
            
            // Primero obtener el colaborador para saber su nombre
            const colaborador = await this.findById(colaboradorId);
            if (!colaborador) return [];
            
            // Buscar por nombre en producto_uso
            const result = await pool.request()
                .input('nombre', sql.NVarChar, `%${colaborador.nombre}%`)
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
                    WHERE pu.nombre_usuario LIKE @nombre
                    ORDER BY pu.fecha_asignacion DESC
                `);

            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getProductosAsignados:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de colaboradores - MODIFICADO
     */
    async getStats() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        COUNT(*) as total_colaboradores,
                        SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
                        SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
                        COUNT(DISTINCT departamento) as total_departamentos,
                        0 as total_equipos_asignados
                    FROM [INV].[colaboradores]
                `);

            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en getStats colaboradores:', error);
            throw error;
        }
    }

    /**
     * Obtener departamentos únicos
     */
    async getDepartamentos() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT departamento 
                    FROM [INV].[colaboradores] 
                    WHERE departamento IS NOT NULL 
                    ORDER BY departamento
                `);

            return result.recordset.map(r => r.departamento);
        } catch (error) {
            console.error('❌ Error en getDepartamentos:', error);
            throw error;
        }
    }
}

module.exports = new ColaboradorModel();