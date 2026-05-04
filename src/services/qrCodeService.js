// src/services/qrCodeService.js
import api from './api';

// Definir API_URL de manera segura
const API_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:98';
    }
    return window.location.origin;
})();

export const QRCodeService = {
    // Obtener información de un código QR por su ID
    async obtenerInfoQR(qrId) {
        try {
            console.log(`📥 Obteniendo información del QR: ${qrId}`);
            
            const response = await api.get(`/qr/${qrId}/info`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ Error obteniendo info QR:', error);
            
            if (error.response) {
                return { 
                    success: false, 
                    message: error.response.data?.message || `Error ${error.response.status}`,
                    status: error.response.status
                };
            } else if (error.request) {
                return { 
                    success: false, 
                    message: 'No se pudo conectar con el servidor' 
                };
            } else {
                return { 
                    success: false, 
                    message: error.message || 'Error desconocido' 
                };
            }
        }
    },

    // Verificar validez de un QR
    async verificarQR(qrId) {
        try {
            console.log(`🔍 Verificando QR: ${qrId}`);
            const response = await api.get(`/qr/${qrId}/verificar`);
            
            return response.data;
            
        } catch (error) {
            console.error('❌ Error verificando QR:', error);
            return { 
                success: false, 
                valido: false,
                message: error.response?.data?.message || error.message 
            };
        }
    },

    // Validar formato de ID de QR
    validarQRId(qrId) {
        if (!qrId) return false;
        
        const patronQR = /^QR-[\w-]+$/;
        const esNumerico = /^\d+$/.test(qrId);
        
        return patronQR.test(qrId) || esNumerico;
    }
};