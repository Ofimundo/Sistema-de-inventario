const { generarActaAsignacionPDF } = require('../backend/controllers/asignacionController');

async function test() {
    try {
        console.log('Testing generarActaAsignacionPDF...');
        const result = await generarActaAsignacionPDF({
            id_asignacion: 12345,
            colaborador: { nombre: 'Test User', rut: '12345678-9' },
            productos: [{ nombre: 'Laptop Test', numero_serie: 'ABC12345' }],
            fecha_asignacion: new Date(),
            firma_trabajador: 'Test User',
            firma_gerente: 'Manager Test'
        });
        console.log('PDF generated successfully! Buffer length:', result?.length);
    } catch (err) {
        console.error('PDF Generation ERROR:', err);
    }
}

test();
