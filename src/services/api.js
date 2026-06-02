// src/services/api.js
import axios from 'axios';

/**
 * Obtiene la URL base según las variables de entorno
 */
const getBaseURL = () => {
    if (import.meta.env && import.meta.env.VITE_API_URL) {
        console.log('✅ Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }
    
    if (process.env && process.env.REACT_APP_API_URL) {
        console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
        return process.env.REACT_APP_API_URL;
    }
    
    console.log('⚠️ No se encontraron variables de entorno, usando fallback: http://localhost:98/api');
    return 'http://localhost:98/api';
};

const API_URL = getBaseURL();

console.log('🚀 API URL configurada:', API_URL);

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
// INTERCEPTOR DE RESPUESTAS - ACTUALIZADO (NO REDIRIGE EN ERRORES DE PERFIL)
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
        
        // Detectar si es un endpoint de perfil
        const isProfileEndpoint = originalRequest.url?.includes('/profile') || 
                                  originalRequest.url?.includes('/perfil');
        
        // Manejo de token expirado (401) - EXCEPTO PARA ENDPOINTS DE PERFIL
        if (status === 401 && !originalRequest._retry && !isProfileEndpoint && !originalRequest.url?.includes('/login')) {
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
        
        // Para errores en endpoints de perfil, NO redirigir
        if (status === 401 && isProfileEndpoint) {
            console.warn('   ⚠️ Error 401 en endpoint de perfil, pero NO se redirige al login');
            return Promise.reject({
                success: false,
                message: data.message || 'Error de autenticación al actualizar perfil',
                status,
                isProfileError: true
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
// SERVICIO DE AUTENTICACIÓN - ACTUALIZADO CON RUT
// ============================================
export const authService = {
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
                    rut: data.usuario?.rut || '',
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                console.log('✅ Usuario guardado en localStorage (RUT:', userToStore.rut, ')');
                
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
                rut: userData.rut?.trim() || null,
                cargo: userData.cargo?.trim() || null,
                departamento: userData.departamento?.trim() || null,
                rol: 'usuario'
            };
            
            console.log('📦 Datos a enviar:', { ...datosRegistro, password: '***' });
            
            const response = await api.post('/auth/register', datosRegistro);
            
            console.log('📥 Respuesta del servidor:', response.data);
            
            if (response.data && response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                const userToStore = {
                    id: response.data.user?.id || response.data.usuario?.id,
                    usuario: userData.usuario.trim(),
                    nombre: userData.nombre.trim(),
                    email: userData.email.trim().toLowerCase(),
                    rut: userData.rut?.trim() || '',
                    cargo: userData.cargo?.trim() || '',
                    departamento: userData.departamento?.trim() || '',
                    rol: response.data.user?.rol || response.data.usuario?.rol || 'usuario'
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                console.log('✅ Usuario guardado en localStorage (RUT:', userToStore.rut, ')');
                
                return {
                    success: true,
                    message: response.data.message || 'Usuario registrado exitosamente',
                    data: response.data,
                    usuario: userToStore
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
    
    updateProfile: async (userData) => {
        try {
            console.log('📝 Actualizando perfil de usuario...', { ...userData, rut: userData.rut });
            
            // Usar el endpoint correcto /auth/profile (no /auth/perfil)
            const response = await api.put('/auth/profile', {
                nombre: userData.nombre,
                email: userData.email,
                cargo: userData.cargo || '',
                departamento: userData.departamento || '',
                rut: userData.rut || ''
            });
            
            console.log('📥 Respuesta del servidor:', response.data);
            
            if (response.data && response.data.success) {
                const currentUser = authService.getCurrentUser();
                
                const updatedUser = {
                    ...currentUser,
                    id: currentUser?.id,
                    usuario: currentUser?.usuario,
                    nombre: response.data.user?.nombre || userData.nombre,
                    email: response.data.user?.email || userData.email,
                    rut: response.data.user?.rut || userData.rut || currentUser?.rut,
                    cargo: response.data.user?.cargo || userData.cargo || currentUser?.cargo || '',
                    departamento: response.data.user?.departamento || userData.departamento || currentUser?.departamento || '',
                    rol: currentUser?.rol || 'usuario'
                };
                
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('✅ Perfil actualizado en localStorage (RUT:', updatedUser.rut, ')');
                
                return {
                    success: true,
                    message: response.data.message || 'Perfil actualizado correctamente',
                    usuario: updatedUser
                };
            }
            
            return {
                success: false,
                message: response.data?.message || 'Error al actualizar perfil'
            };
            
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            
            // Si hay error, guardar localmente como fallback (NO cerrar sesión)
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, ...userData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('⚠️ Perfil guardado SOLO en localStorage (RUT:', updatedUser.rut, ')');
                return {
                    success: true,
                    message: 'Perfil actualizado localmente',
                    usuario: updatedUser
                };
            }
            
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    },
    
    changePassword: async (currentPassword, newPassword) => {
        try {
            console.log('🔐 Cambiando contraseña...');
            
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            
            console.log('📥 Respuesta del servidor:', response.data);
            
            if (response.data && response.data.success) {
                return {
                    success: true,
                    message: response.data.message || 'Contraseña cambiada correctamente'
                };
            }
            
            return {
                success: false,
                message: response.data?.message || 'Error al cambiar contraseña'
            };
            
        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Error de conexión'
            };
        }
    },
    
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
    
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        try {
            if (userStr) {
                const user = JSON.parse(userStr);
                console.log('👤 Usuario actual desde localStorage (RUT:', user.rut, ')');
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return null;
        }
    },
    
    getToken: () => {
        return localStorage.getItem('token');
    }
};

// ============================================
// SERVICIO DE ASIGNACIONES
// ============================================
export const asignacionesService = {
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/asignaciones', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo asignaciones:', error);
            throw error;
        }
    },
    
    getActivas: async () => {
        try {
            const response = await api.get('/asignaciones/activas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo asignaciones activas:', error);
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
    
    getById: async (id) => {
        try {
            const response = await api.get(`/asignaciones/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo asignación ${id}:`, error);
            throw error;
        }
    },
    
    create: async (data) => {
        try {
            const response = await api.post('/asignaciones', data);
            return response.data;
        } catch (error) {
            console.error('Error creando asignación:', error);
            throw error;
        }
    },
    
    createPrestamo: async (data) => {
        try {
            const response = await api.post('/asignaciones/prestamo', data);
            return response.data;
        } catch (error) {
            console.error('Error creando préstamo:', error);
            throw error;
        }
    },
    
    recibir: async (id, data) => {
        try {
            const response = await api.post(`/asignaciones/${id}/recibir`, data);
            return response.data;
        } catch (error) {
            console.error(`Error recibiendo asignación ${id}:`, error);
            throw error;
        }
    },
    
    finalizar: async (id, data) => {
        try {
            const response = await api.put(`/asignaciones/${id}/finalizar`, data);
            return response.data;
        } catch (error) {
            console.error(`Error finalizando asignación ${id}:`, error);
            throw error;
        }
    },
    
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
// SERVICIO DE PRODUCTOS
// ============================================
export const productosService = {
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/productos', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            const response = await api.get(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo producto ${id}:`, error);
            throw error;
        }
    },
    
    create: async (data) => {
        try {
            const response = await api.post('/productos', data);
            return response.data;
        } catch (error) {
            console.error('Error creando producto:', error);
            throw error;
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await api.put(`/productos/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando producto ${id}:`, error);
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            const response = await api.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando producto ${id}:`, error);
            throw error;
        }
    },
    
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
    getAll: async () => {
        try {
            const response = await api.get('/bodegas');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo bodegas:', error);
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            const response = await api.get(`/bodegas/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo bodega ${id}:`, error);
            throw error;
        }
    },
    
    create: async (data) => {
        try {
            const response = await api.post('/bodegas', data);
            return response.data;
        } catch (error) {
            console.error('Error creando bodega:', error);
            throw error;
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await api.put(`/bodegas/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando bodega ${id}:`, error);
            throw error;
        }
    },
    
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
    getAll: async (params = {}) => {
        try {
            const response = await api.get('/colaboradores', { params });
            return response.data;
        } catch (error) {
            console.error('Error obteniendo colaboradores:', error);
            throw error;
        }
    },
    
    getById: async (id) => {
        try {
            const response = await api.get(`/colaboradores/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo colaborador ${id}:`, error);
            throw error;
        }
    },
    
    create: async (data) => {
        try {
            const response = await api.post('/colaboradores', data);
            return response.data;
        } catch (error) {
            console.error('Error creando colaborador:', error);
            throw error;
        }
    },
    
    update: async (id, data) => {
        try {
            const response = await api.put(`/colaboradores/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error actualizando colaborador ${id}:`, error);
            throw error;
        }
    },
    
    delete: async (id) => {
        try {
            const response = await api.delete(`/colaboradores/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error eliminando colaborador ${id}:`, error);
            throw error;
        }
    },
    
    getProductosAsignados: async (id) => {
        try {
            const response = await api.get(`/colaboradores/${id}/asignaciones`);
            return response.data;
        } catch (error) {
            console.error(`Error obteniendo productos asignados para colaborador ${id}:`, error);
            throw error;
        }
    },
    
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