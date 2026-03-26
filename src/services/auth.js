// src/services/auth.js
import api from './api';

class AuthService {
    constructor() {
        this.tokenKey = 'token';
        this.userKey = 'user';
    }

    /**
     * Iniciar sesión
     */
    async login(usuario, contraseña) {
        try {
            console.log('📤 Intentando login...');
            
            const response = await api.post('/auth/login', {
                usuario,
                contraseña
            });

            console.log('✅ Login response:', response.data);

            if (response.data && response.data.success) {
                if (response.data.token) {
                    localStorage.setItem(this.tokenKey, response.data.token);
                }
                if (response.data.usuario) {
                    localStorage.setItem(this.userKey, JSON.stringify(response.data.usuario));
                }
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    }

    /**
     * Registrar un nuevo usuario
     */
    async register(userData) {
        try {
            console.log('📤 Intentando registrar usuario...');
            console.log('📦 Datos recibidos:', userData);
            
            // Validaciones básicas
            if (!userData.nombre?.trim()) {
                throw new Error('El nombre es requerido');
            }
            if (!userData.email?.trim()) {
                throw new Error('El email es requerido');
            }
            if (!userData.usuario?.trim()) {
                throw new Error('El nombre de usuario es requerido');
            }
            if (!userData.contraseña || userData.contraseña.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('El email no es válido');
            }

            const datosRegistro = {
                usuario: userData.usuario.trim(),
                contraseña: userData.contraseña,
                nombre: userData.nombre.trim(),
                email: userData.email.trim().toLowerCase(),
                cargo: userData.cargo?.trim() || '',
                departamento: userData.departamento?.trim() || '',
                rol: 'usuario'
            };

            console.log('📤 Enviando al backend:', datosRegistro);

            const response = await api.post('/auth/register', datosRegistro);

            console.log('✅ Register response:', response.data);

            if (response.data && response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Error al registrar usuario');
            }
        } catch (error) {
            console.error('❌ Error en register:', error);
            
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            if (error.message) {
                throw error;
            }
            throw new Error('Error al conectar con el servidor');
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    async recoverPassword(email) {
        try {
            console.log('📤 Solicitando recuperación de contraseña para:', email);
            
            const response = await api.post('/auth/forgot-password', { email });

            console.log('✅ Recover password response:', response.data);

            return {
                success: true,
                message: response.data?.message || 'Se han enviado las instrucciones a tu correo'
            };
        } catch (error) {
            console.error('❌ Error en recoverPassword:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * Resetear contraseña
     */
    async resetPassword(token, nuevaContraseña) {
        try {
            console.log('📤 Reseteando contraseña con token');
            
            if (!token) {
                return {
                    success: false,
                    message: 'Token de recuperación no proporcionado'
                };
            }

            if (!nuevaContraseña || nuevaContraseña.length < 6) {
                return {
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                };
            }

            const response = await api.post('/auth/reset-password', { 
                token, 
                nueva_contraseña: nuevaContraseña 
            });

            console.log('✅ Reset password response:', response.data);

            return {
                success: true,
                message: response.data?.message || 'Contraseña actualizada exitosamente'
            };
        } catch (error) {
            console.error('❌ Error en resetPassword:', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Error al procesar la solicitud'
            };
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('dashboard_notificaciones');
    }

    /**
     * Obtener el usuario actual
     */
    getCurrentUser() {
        try {
            const user = localStorage.getItem(this.userKey);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
    }

    /**
     * Obtener el token actual
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Cambiar contraseña (usuario autenticado)
     */
    async cambiarContraseña(contraseñaActual, nuevaContraseña) {
        try {
            const response = await api.post('/auth/change-password', {
                password_actual: contraseñaActual,
                password_nueva: nuevaContraseña
            });
            
            if (response.data && response.data.success) {
                return { 
                    success: true, 
                    message: response.data.message || 'Contraseña actualizada exitosamente' 
                };
            } else {
                return { 
                    success: false, 
                    message: response.data?.message || 'Error al cambiar contraseña' 
                };
            }
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message || 'Error al conectar con el servidor' 
            };
        }
    }

    /**
     * Verificar token de autenticación
     */
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, message: 'No hay token' };
            }

            const response = await api.get('/auth/verify');
            
            if (response.data && response.data.success) {
                return { success: true, usuario: response.data.usuario };
            } else {
                return { success: false, message: 'Token inválido' };
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            return { success: false, message: 'Error al verificar token' };
        }
    }
}

// Exportar una instancia única
const authServiceInstance = new AuthService();
export default authServiceInstance;