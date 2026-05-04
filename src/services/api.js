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
    if (process.env && process.env.REACT_APP_API_URL ) {
        console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
        return process.env.REACT_APP_API_URL ;
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

export default api;