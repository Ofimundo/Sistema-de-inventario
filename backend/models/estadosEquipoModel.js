const { getConnection, sql } = require('../config/database');

class EstadosEquipoModel {
    /**
     * Obtiene todos los estados de equipo
     * @returns {Promise<Array>} - Lista de estados
     */
    async findAll() {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT id, nombre, descripcion, color_hex, icono
                    FROM INV.estados_equipo
                    ORDER BY id
                `);
            return result.recordset;
        } catch (error) {
            console.error('Error en findAll estados:', error);
            throw error;
        }
    }

    /**
     * Busca un estado por ID
     * @param {number} id - ID del estado
     * @returns {Promise<Object>} - Estado encontrado
     */
    async findById(id) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, nombre, descripcion, color_hex, icono
                    FROM INV.estados_equipo
                    WHERE id = @id
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error en findById estado:', error);
            throw error;
        }
    }

    /**
     * Busca un estado por nombre
     * @param {string} nombre - Nombre del estado
     * @returns {Promise<Object>} - Estado encontrado
     */
    async findByNombre(nombre) {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .query(`
                    SELECT id, nombre, descripcion, color_hex, icono
                    FROM INV.estados_equipo
                    WHERE nombre = @nombre
                `);
            return result.recordset[0];
        } catch (error) {
            console.error('Error en findByNombre estado:', error);
            throw error;
        }
    }
}

module.exports = new EstadosEquipoModel();