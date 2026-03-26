// src/services/api.js
import axios from 'axios';

/**
 * Obtiene la URL base correcta según el entorno
 */
const getBaseURL = () => {
    const hostname = window.location.hostname;
    
    console.log('📍 Información de conexión:');
    console.log('   - Hostname:', hostname);
    console.log('   - Puerto frontend:', window.location.port);
    
    // Desarrollo local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const url = 'http://localhost:5000/api';
        console.log('✅ Modo: Desarrollo local PC');
        console.log('📡 Conectando a backend:', url);
        return url;
    }
    
    // Desarrollo desde móvil en misma red
    if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/)) {
        const PC_IP = '192.168.1.162';
        const url = `http://${PC_IP}:5000/api`;
        console.log('✅ Modo: Desarrollo móvil');
        console.log('📡 Conectando a backend:', url);
        return url;
    }
    
    // Producción
    console.log('✅ Modo: Producción');
    const url = `${window.location.origin}/api`;
    console.log('📡 Conectando a backend:', url);
    return url;
};

const API_URL = getBaseURL();

// Crear instancia de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
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
                message: 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.',
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
            
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirigir al login si no está ya en esa página
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }
            
            return Promise.reject({
                success: false,
                message: data.message || 'Sesión expirada. Por favor inicia sesión nuevamente.',
                status
            });
        }
        
        // Otros errores
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
            
            const response = await api.post('/auth/login', {
                usuario: usuario.trim(),
                password
            });
            
            const data = response.data;
            
            if (data.success && data.token) {
                // Guardar token
                localStorage.setItem('token', data.token);
                
                // Guardar TODOS los datos del usuario
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
                console.log('✅ Usuario guardado:', userToStore);
                
                return {
                    success: true,
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
            console.log('📝 Registrando usuario:', {
                usuario: userData.usuario,
                nombre: userData.nombre,
                email: userData.email
            });
            
            // Validaciones
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
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('El email no es válido');
            }
            
            // Datos para enviar al backend
            const datosRegistro = {
                usuario: userData.usuario.trim(),
                password: userData.contraseña,
                nombre: userData.nombre.trim(),
                email: userData.email.trim().toLowerCase(),
                cargo: userData.cargo?.trim() || '',
                departamento: userData.departamento?.trim() || '',
                rol: 'usuario'
            };
            
            console.log('📤 Enviando al backend:', {
                ...datosRegistro,
                password: '***'
            });
            
            const response = await api.post('/auth/register', datosRegistro);
            
            console.log('✅ Respuesta registro:', response.data);
            
            if (response.data && response.data.success) {
                // Guardar token si viene en la respuesta
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                // Guardar datos del usuario
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
                console.log('✅ Usuario guardado en localStorage:', userToStore);
                
                return {
                    success: true,
                    message: response.data.message || 'Usuario registrado exitosamente',
                    data: {
                        ...response.data,
                        usuario: userToStore
                    }
                };
            } else {
                return {
                    success: false,
                    message: response.data?.message || 'Error al registrar usuario'
                };
            }
            
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
            
            const token = localStorage.getItem('token');
            if (token) {
                await api.post('/auth/logout').catch(err => {
                    console.log('⚠️ Error en logout (no crítico):', err.message);
                });
            }
            
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            console.log('🧹 Sesión cerrada');
            
            return {
                success: true,
                message: 'Sesión cerrada exitosamente'
            };
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            
            // Asegurar limpieza
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
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
                console.log('⏰ Token expirado');
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
                const user = JSON.parse(userStr);
                console.log('📦 Usuario cargado:', user);
                return user;
            }
            return null;
        } catch {
            console.error('❌ Error al parsear usuario');
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

export default api;