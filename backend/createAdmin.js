const bcrypt = require('bcryptjs');
const { getConnection } = require('./config/database');

async function createAdmin() {
    try {
        const pool = await getConnection();
        
        // Verificar si ya existe
        const check = await pool.request()
            .query("SELECT COUNT(*) as count FROM usuarios WHERE usuario = 'margarita'");
        
        if (check.recordset[0].count > 0) {
            console.log('✅ Usuario margarita ya existe');
            return;
        }

        // Crear hash de la contraseña
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('🔐 Contraseña hasheada:', hashedPassword);
        
        // Insertar usuario
        const result = await pool.request()
            .input('usuario', 'margarita')
            .input('contraseña', hashedPassword)
            .input('rol', 'admin')
            .query(`
                INSERT INTO usuarios (usuario, contraseña, rol, activo, fecha_creacion)
                OUTPUT INSERTED.id
                VALUES (@usuario, @contraseña, @rol, 1, GETDATE())
            `);
        
        const userId = result.recordset[0].id;
        
        // Insertar detalles
        await pool.request()
            .input('usuario_id', userId)
            .input('nombre', 'Margarita')
            .input('email', 'margarita@empresa.com')
            .input('cargo', 'Administradora')
            .query(`
                INSERT INTO detalles_usuario (usuario_id, nombre, email, cargo)
                VALUES (@usuario_id, @nombre, @email, @cargo)
            `);
        
        console.log('✅ Usuario admin creado: margarita / admin123');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

createAdmin();