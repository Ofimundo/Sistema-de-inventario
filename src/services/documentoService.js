// src/services/documentoService.js
import api from './api';

// Definir API_URL de manera segura para el navegador
const API_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    return window.location.origin;
})();

class DocumentoService {
    /**
     * Obtener todos los documentos generados
     */
    async getDocumentos() {
        try {
            console.log('📥 Solicitando documentos...');
            const response = await api.get('/documentos');
            
            if (response.data.success) {
                const documentos = response.data.data || [];
                console.log(`✅ ${documentos.length} documentos encontrados`);
                
                // Normalizar los datos
                return documentos.map(doc => ({
                    id: doc.id || doc._id,
                    nombre: doc.nombre || doc.filename || 'documento',
                    filename: doc.filename || doc.nombre,
                    fecha: doc.fecha || doc.createdAt || doc.fecha_creacion || new Date().toISOString(),
                    tamaño: doc.tamaño || doc.size || 0,
                    tipo: doc.tipo || (doc.nombre?.endsWith('.pdf') ? 'pdf' : 'docx'),
                    ruta: doc.ruta || doc.path || '',
                    asignacion_id: doc.asignacion_id || null,
                    empleado_id: doc.empleado_id || null
                }));
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error obteniendo documentos:', error);
            return [];
        }
    }

    /**
     * Obtener documentos por asignación
     */
    async getDocumentosByAsignacion(asignacionId) {
        try {
            console.log(`📥 Solicitando documentos para asignación: ${asignacionId}`);
            const response = await api.get(`/documentos/asignacion/${asignacionId}`);
            
            if (response.data.success) {
                return response.data.data || [];
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error obteniendo documentos por asignación:', error);
            return [];
        }
    }

    /**
     * Descargar documento - MÉTODO PRINCIPAL
     */
    async descargarDocumento(filename) {
        try {
            console.log(`📥 Descargando documento: ${filename}`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await fetch(`${API_URL}/api/documentos/download/${filename}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace y simular click
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Descarga completada');
            return true;
            
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            
            // Fallback: intentar con URL directa
            try {
                const token = localStorage.getItem('token');
                const fallbackUrl = `${API_URL}/uploads/documentos/${filename}`;
                window.open(fallbackUrl, '_blank');
                return true;
            } catch (fallbackError) {
                throw error;
            }
        }
    }

    /**
     * Descargar documento por ID
     */
    async descargarDocumentoPorId(documentoId) {
        try {
            console.log(`📥 Descargando documento por ID: ${documentoId}`);
            
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/api/documentos/id/${documentoId}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            // Intentar obtener nombre del archivo del header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `documento_${documentoId}.pdf`;
            
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Descarga completada');
            return true;
            
        } catch (error) {
            console.error('❌ Error descargando documento por ID:', error);
            throw error;
        }
    }

    /**
     * Descargar documento usando API de axios (método alternativo)
     */
    async descargarDocumentoConApi(filename) {
        try {
            console.log(`📥 Descargando documento con API: ${filename}`);
            
            const response = await api.get(`/documentos/download/${filename}`, {
                responseType: 'blob'
            });
            
            // Determinar tipo de archivo para la extensión
            const contentType = response.headers['content-type'];
            let extension = 'docx';
            if (contentType?.includes('pdf')) extension = 'pdf';
            if (contentType?.includes('image')) extension = 'jpg';
            
            // Asegurar que el filename tenga la extensión correcta
            let nombreArchivo = filename;
            if (!nombreArchivo.includes('.')) {
                nombreArchivo = `${filename}.${extension}`;
            }
            
            // Crear URL del blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Crear enlace y simular click
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreArchivo);
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Descarga completada');
            return true;
            
        } catch (error) {
            console.error('❌ Error descargando documento con API:', error);
            throw error;
        }
    }

    /**
     * Eliminar documento
     */
    async eliminarDocumento(filename) {
        try {
            console.log(`🗑️ Eliminando documento: ${filename}`);
            
            const response = await api.delete(`/documentos/${filename}`);
            
            if (response.data.success) {
                console.log('✅ Documento eliminado');
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error eliminando documento:', error);
            return false;
        }
    }

    /**
     * Obtener estadísticas de documentos
     */
    async obtenerEstadisticas() {
        try {
            console.log('📥 Solicitando estadísticas de documentos...');
            
            const response = await api.get('/documentos/estadisticas');
            
            if (response.data.success) {
                return response.data.data;
            }
            
            return {
                total: 0,
                docx: 0,
                pdf: 0,
                tamañoTotal: 0,
                ultimoDocumento: null
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                total: 0,
                docx: 0,
                pdf: 0,
                tamañoTotal: 0,
                ultimoDocumento: null
            };
        }
    }

    /**
     * Verificar si un documento existe
     */
    async verificarDocumento(filename) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/documentos/verificar/${filename}`, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Obtener URL pública de un documento
     */
    getUrlDocumento(filename) {
        return `${API_URL}/uploads/documentos/${filename}`;
    }

    /**
     * Obtener URL de descarga con autenticación
     */
    getUrlDescarga(filename) {
        const token = localStorage.getItem('token');
        return `${API_URL}/api/documentos/download/${filename}?token=${token}`;
    }

    /**
     * Obtener documentos paginados
     */
    async getDocumentosPaginados(page = 1, limit = 10) {
        try {
            console.log(`📥 Solicitando documentos - Página ${page}, Límite ${limit}`);
            const response = await api.get(`/documentos?page=${page}&limit=${limit}`);
            
            if (response.data.success) {
                return response.data;
            }
            
            return {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            };
        } catch (error) {
            console.error('❌ Error obteniendo documentos paginados:', error);
            return {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            };
        }
    }

    /**
     * Buscar documentos por término
     */
    async buscarDocumentos(termino) {
        try {
            console.log(`🔍 Buscando documentos con: ${termino}`);
            const response = await api.get(`/documentos/buscar?q=${termino}`);
            
            if (response.data.success) {
                return response.data.data;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error buscando documentos:', error);
            return [];
        }
    }
    // src/services/documentoService.js - Agrega este método

/**
 * Registrar un documento en la base de datos
 */
async registrarDocumento(data) {
    try {
        console.log('📝 Registrando documento en BD:', data);
        const response = await api.post('/documentos/registrar', data);
        
        if (response.data && response.data.success) {
            console.log('✅ Documento registrado:', response.data.data);
            return response.data;
        }
        
        console.warn('⚠️ Respuesta inesperada:', response.data);
        return { success: false, data: null };
    } catch (error) {
        console.error('❌ Error registrando documento:', error);
        return { success: false, error: error.message };
    }
}
}

// Crear una instancia única
const documentoService = new DocumentoService();

export default documentoService;