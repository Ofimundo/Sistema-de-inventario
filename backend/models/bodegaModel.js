// backend/models/bodegaModel.js
const { getConnection, sql } = require('../config/database');

class BodegaModel {
    // Obtener todas las bodegas
    async findAll() {
        try {
            const pool = await getConnection();
            console.log('📥 Obteniendo bodegas...');
            
            // Usar producto_bodega para contar productos
            const result = await pool.request()
                .query(`
                    SELECT 
                        b.*,
                        (SELECT COUNT(DISTINCT producto_id) FROM [INV].[producto_bodega] WHERE [bodega_id] = b.[id]) as total_productos,
                        (SELECT ISNULL(SUM(cantidad), 0) FROM [INV].[producto_bodega] WHERE [bodega_id] = b.[id]) as total_stock
                    FROM [INV].[bodegas] b
                    ORDER BY b.[nombre]
                `);
            
            console.log(`📦 Bodegas encontradas: ${result.recordset.length}`);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en findAll:', error);
            throw error;
        }
    }

    // Buscar bodega por ID
    async findById(id) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) return null;
            
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, idNum)
                .query(`
                    SELECT * FROM [INV].[bodegas] b
                    WHERE b.[id] = @id
                `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en findById:', error);
            return null;
        }
    }

    // Crear bodega
    async create(bodegaData) {
        try {
            const pool = await getConnection();
            
            console.log('📝 Creando bodega con datos:', bodegaData);
            
            const result = await pool.request()
                .input('nombre', sql.NVarChar, bodegaData.nombre)
                .input('ubicacion', sql.NVarChar, bodegaData.ubicacion || '')
                .input('responsable', sql.NVarChar, bodegaData.responsable || null)
                .input('descripcion', sql.NVarChar, bodegaData.descripcion || '')
                .query(`
                    INSERT INTO [INV].[bodegas] ([nombre], [ubicacion], [responsable], [descripcion])
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @ubicacion, @responsable, @descripcion)
                `);
            
            console.log(`✅ Bodega creada con ID: ${result.recordset[0].id}`);
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Error en create:', error);
            throw error;
        }
    }

    // Actualizar bodega
    async update(id, bodegaData) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                throw new Error('ID inválido');
            }
            
            const pool = await getConnection();
            
            console.log(`📝 Actualizando bodega ${idNum} con datos:`, bodegaData);
            
            const updates = [];
            const request = pool.request();
            
            if (bodegaData.nombre !== undefined) {
                updates.push('[nombre] = @nombre');
                request.input('nombre', sql.NVarChar, bodegaData.nombre);
            }
            
            if (bodegaData.ubicacion !== undefined) {
                updates.push('[ubicacion] = @ubicacion');
                request.input('ubicacion', sql.NVarChar, bodegaData.ubicacion);
            }
            
            if (bodegaData.responsable !== undefined) {
                updates.push('[responsable] = @responsable');
                request.input('responsable', sql.NVarChar, bodegaData.responsable);
            }
            
            if (bodegaData.descripcion !== undefined) {
                updates.push('[descripcion] = @descripcion');
                request.input('descripcion', sql.NVarChar, bodegaData.descripcion);
            }
            
            if (updates.length === 0) {
                return await this.findById(idNum);
            }
            
            const query = `UPDATE [INV].[bodegas] SET ${updates.join(', ')} WHERE [id] = @id`;
            request.input('id', sql.Int, idNum);
            
            await request.query(query);
            console.log(`✅ Bodega ${idNum} actualizada`);
            
            return await this.findById(idNum);
        } catch (error) {
            console.error('❌ Error en update:', error);
            throw error;
        }
    }

    // Eliminar bodega
    async delete(id) {
        try {
            const idNum = parseInt(id);
            if (isNaN(idNum) || idNum <= 0) {
                throw new Error('ID inválido');
            }
            
            const pool = await getConnection();
            
            // Verificar si tiene productos en producto_bodega
            const check = await pool.request()
                .input('bodegaId', sql.Int, idNum)
                .query('SELECT COUNT(*) as [count] FROM [INV].[producto_bodega] WHERE [bodega_id] = @bodegaId');
            
            if (check.recordset[0].count > 0) {
                throw new Error('No se puede eliminar la bodega porque tiene productos asignados en producto_bodega');
            }

            await pool.request()
                .input('id', sql.Int, idNum)
                .query('DELETE FROM [INV].[bodegas] WHERE [id] = @id');
            
            return true;
        } catch (error) {
            console.error('❌ Error en delete:', error);
            throw error;
        }
    }

    // Obtener productos de una bodega
    async getProductos(bodegaId) {
        try {
            const idNum = parseInt(bodegaId);
            if (isNaN(idNum) || idNum <= 0) return [];
            
            const pool = await getConnection();
            const result = await pool.request()
                .input('bodegaId', sql.Int, idNum)
                .query(`
                    SELECT 
                        p.*,
                        pb.cantidad as cantidad_en_bodega
                    FROM [INV].[productos] p
                    INNER JOIN [INV].[producto_bodega] pb ON p.id = pb.producto_id
                    WHERE pb.bodega_id = @bodegaId
                    ORDER BY p.nombre
                `);
            
            return result.recordset;
        } catch (error) {
            console.error('❌ Error en getProductos:', error);
            return [];
        }
    }
}

module.exports = new BodegaModel();