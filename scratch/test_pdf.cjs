const { generarActaAsignacionPDF } = require('../backend/controllers/asignacionController');

const dummySignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcIAAAB4CAYAAABhPvLiAAAQAElEQVR4AeydWYwUxR/H6wcoiLgCXoh4ExKvCMEoUUHBXfGIiopGE/UBHryQxI3GGBN38cEHI1HiRaIYj0TN6gMaIx4EBTHRuKiJUUOUQ/E+AEHEVdB/vrX/anpmZ3dnd3tmuqc/k1TX0d1Vv/rUpr9b1VXVg/7jBwEIQAACEMgxgUGOHwQgAAEIQCDHBBDCPDU+dYUABCAAgS4EEMIuSEioBoEvv/zSjR492j3yyCPVKI4yIAABCHRLACHsFg0nKkmgar3rSqE=';

async function test() {
    try {
        console.time('Fast PDF Generation');
        const result = await generarActaAsignacionPDF({
            id_asignacion: 12345,
            colaborador: { nombre: 'Test User', rut: '12345678-9' },
            productos: [{ nombre: 'Laptop Test', numero_serie: 'ABC12345' }],
            fecha_asignacion: new Date(),
            firma_trabajador: dummySignature,
            firma_gerente: dummySignature
        });
        console.timeEnd('Fast PDF Generation');
        console.log('PDF generated successfully! Buffer length:', result?.length);
    } catch (err) {
        console.error('PDF Generation ERROR:', err);
    }
}

test();
