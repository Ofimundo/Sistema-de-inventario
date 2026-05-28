// src/services/api.js
import axios from 'axios';

/**
 * Obtiene la URL base según las variables de entorno
 */
const getBaseURL = () => {
    // 🔥 IMPORTANTE: Vite usa import.meta.env, Create React App usa process.env
    // Primero intentar con Vite
    if (import.meta.env && import.meta.env.VITE_API_URL) {
        console.log('✅ Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }
    
    // Luego intentar con Create React App
    if (process.env && process.env.REACT_APP_API_URL) {
        console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
        return process.env.REACT_APP_API_URL;
    }
    
    // Fallback para desarrollo local
    console.log('⚠️ No se encontraron variables de entorno, usando fallback: http://localhost:98/api');
    return 'http://localhost:98/api';
};

const API_URL = getBaseURL();

console.log('🚀 API URL configurada:', API_URL);

// Crear instancia de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
    withCredentials: true
});

// ============================================
// INTERCEPTOR DE PETICIONES
// ============================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            const tokenFormatted = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            config.headers.Authorization = tokenFormatted;
        }
        
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        
        if (config.data && config.method !== 'get') {
            const logData = { ...config.data };
            if (logData.password) logData.password = '***';
            if (logData.contraseña) logData.contraseña = '***';
            console.log('   📦 Body:', logData);
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Error en petición:', error);
        return Promise.reject(error);
    }
);

// ============================================
// INTERCEPTOR DE RESPUESTAS
// ============================================
api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        console.error('❌ Error en respuesta:');
        
        if (!error.response) {
            console.error('   🔌 Sin conexión al servidor');
            console.error('   💡 Verifica que el backend esté corriendo en:', API_URL);
            return Promise.reject({
                success: false,
                message: `No se pudo conectar al servidor en ${API_URL}. Verifica que el backend esté corriendo.`,
                originalError: error
            });
        }
        
        const status = error.response.status;
        const data = error.response.data;
        
        console.error(`   🔴 Status: ${status}`);
        console.error('   📄 Data:', data);
        
        // Manejo de token expirado (401)
        if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/login')) {
            originalRequest._retry = true;
            
            console.log('   🔐 Token expirado, limpiando sesión...');
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }
            
            return Promise.reject({
                success: false,
                message: data.message || 'Sesión expirada. Por favor inicia sesión nuevamente.',
                status
            });
        }
        
        const errorResponse = {
            success: false,
            message: data.message || data.error || `Error ${status}`,
            status,
            data: data
        };
        
        return Promise.reject(errorResponse);
    }
);

// ============================================
// SERVICIO DE AUTENTICACIÓN
// ============================================
export const authService = {
    /**
     * Iniciar sesión
     */
    login: async (usuario, password) => {
        try {
            console.log('🔐 Intentando login...');
            console.log('   📡 URL base:', API_URL);
            console.log('   📡 Endpoint completo:', `${API_URL}/auth/login`);
            
            const response = await api.post('/auth/login', {
                usuario: usuario.trim(),
                password
            });
            
            console.log('📦 Respuesta del servidor:', response.data);
            
            const data = response.data;
            
            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                
                const userToStore = {
                    id: data.usuario?.id,
                    usuario: data.usuario?.usuario || usuario,
                    nombre: data.usuario?.nombre || '',
                    email: data.usuario?.email || '',
                    cargo: data.usuario?.cargo || '',
                    departamento: data.usuario?.departamento || '',
                    rol: data.usuario?.rol || 'usuario',
                    rut: data.usuario?.rut || ''
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                console.log('✅ Usuario guardado en localStorage:', userToStore);
                
                return {
                    success: true,
                    message: data.message || 'Login exitoso',
                    usuario: userToStore,
                    token: data.token,
                    data: {
                        ...data,
                        usuario: userToStore
                    }
                };
            }
            
            return {
                success: false,
                message: data.message || 'Error al iniciar sesión'
            };
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                message: error.message || error.response?.data?.message || 'Error de conexión'
            };
        }
    },
    
    /**
     * Registrar usuario
     */
    register: async (userData) => {
        try {
            console.log('📝 Registrando usuario...');
            
            if (!userData.nombre?.trim()) {
                throw new Error('El nombre es requerido');
            }
            if (!userData.email?.trim()) {
                throw new Error('El email es requerido');
            }
            if (!userData.usuario?.trim()) {
                throw new Error('El usuario es requerido');
            }
            if (!userData.contraseña || userData.contraseña.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            
            const datosRegistro = {
                usuario: userData.usuario.trim(),
                password: userData.contraseña,
                nombre: userData.nombre.trim(),
                email: userData.email.trim().toLowerCase(),
                cargo: userData.cargo?.trim() || '',
                departamento: userData.departamento?.trim() || '',
                rol: 'usuario'
            };
            
            const response = await api.post('/auth/register', datosRegistro);
            
            if (response.data && response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                const userToStore = {
                    id: response.data.user?.id,
                    usuario: userData.usuario.trim(),
                    nombre: userData.nombre.trim(),
                    email: userData.email.trim().toLowerCase(),
                    cargo: userData.cargo?.trim() || '',
                    departamento: userData.departamento?.trim() || '',
                    rol: response.data.user?.rol || 'usuario',
                    rut: response.data.user?.rut || ''
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                
                return {
                    success: true,
                    message: response.data.message || 'Usuario registrado exitosamente',
                    data: response.data
                };
            }
            
            return {
                success: false,
                message: response.data?.message || 'Error al registrar usuario'
            };
            
        } catch (error) {
            console.error('❌ Error en registro:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    },
    
    /**
     * Cerrar sesión
     */
    logout: async () => {
        try {
            console.log('🚪 Cerrando sesión...');
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            return {
                success: true,
                message: 'Sesión cerrada exitosamente'
            };
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            return {
                success: false,
                message: error.message || 'Error al cerrar sesión'
            };
        }
    },
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            
            if (now > exp) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return false;
            }
            
            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Obtener usuario actual
     */
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        try {
            if (userStr) {
                return JSON.parse(userStr);
            }
            return null;
        } catch {
            return null;
        }
    },
    
    /**
     * Obtener token actual
     */
    getToken: () => {
        return localStorage.getItem('token');
    }
};

// ============================================
// SERVICIO DE ASIGNACIONES (ENDPOINTS FALTANTES)
// ============================================
export const asignacionesService = {
    /**
     * Obtener todas las asignaciones
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/asignaciones', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo asignaciones:', error);
            throw error;
        }
    },
    
    /**
     * Obtener asignaciones activas (sin fecha_devolucion)
     */
    getActivas: async () => {
        try {
            const response = await api.get('/asignaciones/activas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo asignaciones activas:', error);
            // Si el endpoint no existe, intentar filtrar localmente
            try {
                const todas = await asignacionesService.getAll();
                if (todas.success && todas.data) {
                    const activas = todas.data.filter(a => !a.fecha_devolucion);
                    return { success: true, data: activas };
                }
            } catch (e) {
                console.error('Error en fallback:', e);
            }
            return { success: false, data: [], message: error.message };
        }
    },
    
    /**
     * Obtener una asignación por ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/asignaciones/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo asignación ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Crear una nueva asignación
     */
    create: async (data) => {
        try {
            const response = await api.post('/asignaciones', data);
            return response.data;
        } catch (error) {
            console.error('Error creando asignación:', error);
            throw error;
        }
    },
    
    /**
     * Crear un préstamo (sin firma digital)
     */
    createPrestamo: async (data) => {
        try {
            const response = await api.post('/asignaciones/prestamo', data);
            return response.data;
        } catch (error) {
            console.error('Error creando préstamo:', error);
            throw error;
        }
    },
    
    /**
     * Recibir un producto (registrar devolución)
     */
    recibir: async (id, data) => {
        try {
            const response = await api.post(`/asignaciones/${id}/recibir`, data);
            return response.data;
        } catch (error) {
            console.error(`Error recibiendo asignación ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtener estadísticas de préstamos
     */
    getStatsPrestamos: async () => {
        try {
            const response = await asignacionesService.getActivas();
            let prestamos = [];
            
            if (response.success && response.data) {
                prestamos = response.data.filter(a => a.es_prestamo === true || a.es_prestamo === 1);
            }
            
            return {
                total: prestamos.length,
                activos: prestamos.filter(p => !p.fecha_devolucion).length,
                devueltos: prestamos.filter(p => p.fecha_devolucion).length
            };
        } catch (error) {
            console.error('Error obteniendo stats de préstamos:', error);
            return { total: 0, activos: 0, devueltos: 0 };
        }
    }
};

// ============================================
// SERVICIO DE PRODUCTOS (endpoints adicionales)
// ============================================
export const productosService = {
    /**
     * Obtener todos los productos
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/productos', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            throw error;
        }
    },
    
    /**
     * Obtener un producto por ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo producto ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Crear un nuevo producto
     */
    create: async (data) => {
        try {
            const response = await api.post('/productos', data);
            return response.data;
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    },
    
    /**
     * Actualizar un producto
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/productos/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando producto ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Eliminar un producto
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando producto ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtener productos con stock bajo
     */
    getBajoStock: async (limite = 5) => {
        try {
            const response = await productosService.getAll();
            if (response.success && response.data) {
                const bajos = response.data.filter(p => (p.cantidad || 0) < limite);
                return { success: true, data: bajos };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error('Error obteniendo productos bajo stock:', error);
            return { success: false, data: [] };
        }
    },
    
    /**
     * Exportar productos a Excel
     */
    exportExcel: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/export/productos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Error al exportar');
            return await response.blob();
        } catch (error) {
            console.error('Error exportando productos:', error);
            throw error;
        }
    }
};

// ============================================
// SERVICIO DE BODEGAS
// ============================================
export const bodegasService = {
    /**
     * Obtener todas las bodegas
     */
    getAll: async () => {
        try {
            const response = await api.get('/bodegas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo bodegas:', error);
            throw error;
        }
    },
    
    /**
     * Obtener una bodega por ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/bodegas/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo bodega ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Crear una nueva bodega
     */
    create: async (data) => {
        try {
            const response = await api.post('/bodegas', data);
            return response.data;
        } catch (error) {
            console.error('Error creando bodega:', error);
            throw error;
        }
    },
    
    /**
     * Actualizar una bodega
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/bodegas/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando bodega ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Eliminar una bodega
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/bodegas/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando bodega ${id}:`, error);
            throw error;
        }
    }
};

// ============================================
// SERVICIO DE COLABORADORES
// ============================================
export const colaboradoresService = {
    /**
     * Obtener todos los colaboradores
     */
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/colaboradores', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo colaboradores:', error);
            throw error;
        }
    },
    
    /**
     * Obtener un colaborador por ID
     */
    getById: async (id) => {
        try {
            const response = await api.get(`/colaboradores/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo colaborador ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Crear un nuevo colaborador
     */
    create: async (data) => {
        try {
            const response = await api.post('/colaboradores', data);
            return response.data;
        } catch (error) {
            console.error('Error creando colaborador:', error);
            throw error;
        }
    },
    
    /**
     * Actualizar un colaborador
     */
    update: async (id, data) => {
        try {
            const response = await api.put(`/colaboradores/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando colaborador ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Eliminar un colaborador
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`/colaboradores/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando colaborador ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtener productos asignados a un colaborador
     */
    getProductosAsignados: async (id) => {
        try {
            const response = await api.get(`/colaboradores/${id}/asignaciones`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo productos asignados para colaborador ${id}:`, error);
            throw error;
        }
    },
    
    /**
     * Obtener estadísticas de colaboradores
     */
    getStats: async () => {
        try {
            const response = await colaboradoresService.getAll();
            if (response.success && response.data) {
                const activos = response.data.filter(c => c.estado === 'ACTIVO').length;
                const inactivos = response.data.filter(c => c.estado === 'INACTIVO').length;
                const departamentos = [...new Set(response.data.map(c => c.departamento).filter(Boolean))];
                
                return {
                    total_colaboradores: response.data.length,
                    activos,
                    inactivos,
                    total_departamentos: departamentos.length,
                    total_equipos_asignados: response.data.reduce((sum, c) => sum + (c.asignaciones_activas || 0), 0)
                };
            }
            return {
                total_colaboradores: 0,
                activos: 0,
                inactivos: 0,
                total_departamentos: 0,
                total_equipos_asignados: 0
            };
        } catch (error) {
            console.error('Error obteniendo stats de colaboradores:', error);
            return {
                total_colaboradores: 0,
                activos: 0,
                inactivos: 0,
                total_departamentos: 0,
                total_equipos_asignados: 0
            };
        }
    },
    
    /**
     * Obtener departamentos únicos
     */
    getDepartamentos: async () => {
        try {
            const response = await colaboradoresService.getAll();
            if (response.success && response.data) {
                const departamentos = [...new Set(response.data.map(c => c.departamento).filter(Boolean))];
                return departamentos;
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo departamentos:', error);
            return [];
        }
    }
};

// ============================================
// SERVICIO DE HISTORIAL
// ============================================
export const historialService = {
    /**
     * Obtener últimos movimientos
     */
    getUltimosMovimientos: async (limit = 10) => {
        try {
            const response = await asignacionesService.getAll({ limit, sort: '-fecha_asignacion' });
            if (response.success && response.data) {
                return response.data.slice(0, limit).map(a => ({
                    id: a.id,
                    descripcion: `${a.es_prestamo ? 'Préstamo' : 'Asignación'}: ${a.producto_nombre || 'Producto'} → ${a.colaborador_nombre || 'colaborador'}`,
                    tipo: a.es_prestamo ? 'prestamo' : 'asignacion',
                    fecha: a.fecha_asignacion,
                    usuario: a.usuario_creador || 'Sistema'
                }));
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo últimos movimientos:', error);
            return [];
        }
    },
    
    /**
     * Buscar en historial
     */
    search: async (termino) => {
        try {
            const response = await asignacionesService.getAll({ search: termino });
            if (response.success && response.data) {
                return response.data.map(a => ({
                    id: a.id,
                    descripcion: `${a.es_prestamo ? 'Préstamo' : 'Asignación'}: ${a.producto_nombre || 'Producto'} → ${a.colaborador_nombre || 'colaborador'}`,
                    tipo: a.es_prestamo ? 'prestamo' : 'asignacion',
                    fecha: a.fecha_asignacion,
                    usuario: a.usuario_creador || 'Sistema'
                }));
            }
            return [];
        } catch (error) {
            console.error('Error buscando en historial:', error);
            return [];
        }
    }
};

export default api;