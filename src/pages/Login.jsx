// src/pages/Login.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
    Divider,
    useTheme,
    useMediaQuery,
    Avatar
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person as PersonIcon,
    Lock as LockIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import api, { authService } from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    width: '100%',
    maxWidth: 400,
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3),
        maxWidth: '90%',
        borderRadius: 20,
    },
}));

const Login = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { register, handleSubmit, formState: { errors } } = useForm();

    // Limpiar localStorage al cargar el login
    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        
        try {
            console.log('📤 Intentando login con usuario:', data.usuario);
            console.log('📡 Endpoint:', `${api.defaults.baseURL}/auth/login`);
            
            // Llamar directamente a la API para tener más control
            const response = await api.post('/auth/login', {
                usuario: data.usuario.trim(),
                password: data.password
            });
            
            console.log('📥 Respuesta completa:', response);
            console.log('📦 Datos de respuesta:', response.data);
            
            const responseData = response.data;
            
            if (responseData && responseData.success) {
                // Verificar que tenemos token
                if (!responseData.token) {
                    setError('El servidor no devolvió un token válido');
                    setLoading(false);
                    return;
                }
                
                // Guardar token
                localStorage.setItem('token', responseData.token);
                console.log('✅ Token guardado');
                
                // Obtener datos del usuario (puede venir en 'usuario' o 'user')
                const userData = responseData.usuario || responseData.user;
                
                if (!userData) {
                    setError('No se recibieron datos del usuario');
                    setLoading(false);
                    return;
                }
                
                // Guardar usuario en localStorage
                const userToStore = {
                    id: userData.id,
                    usuario: userData.usuario || data.usuario,
                    nombre: userData.nombre || '',
                    email: userData.email || '',
                    cargo: userData.cargo || '',
                    departamento: userData.departamento || '',
                    rol: userData.rol || 'usuario',
                    rut: userData.rut || ''
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                console.log('✅ Usuario guardado:', userToStore);
                
                // Verificar que se guardó correctamente
                const savedToken = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');
                console.log('🔍 Token guardado:', savedToken ? 'Sí' : 'No');
                console.log('🔍 Usuario guardado:', savedUser ? 'Sí' : 'No');
                
                if (savedToken && savedUser) {
                    console.log('🚀 Redirigiendo al dashboard...');
                    // Usar replace para evitar volver al login con el botón atrás
                    navigate('/dashboard', { replace: true });
                } else {
                    setError('Error al guardar la sesión');
                }
            } else {
                setError(responseData?.message || 'Usuario o contraseña incorrectos');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            console.error('❌ Response:', error.response);
            console.error('❌ Status:', error.response?.status);
            console.error('❌ Data:', error.response?.data);
            
            // Manejar diferentes tipos de errores
            if (error.response?.status === 401) {
                setError('Usuario o contraseña incorrectos');
            } else if (error.response?.status === 400) {
                setError(error.response.data?.message || 'Datos inválidos');
            } else if (error.response?.status === 500) {
                setError('Error en el servidor. Intenta más tarde');
            } else if (error.code === 'ECONNABORTED') {
                setError('Tiempo de espera agotado. Verifica tu conexión');
            } else {
                setError(error.response?.data?.message || error.message || 'Error de conexión con el servidor');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C1D95 100%)',
                padding: 2,
            }}
        >
            <StyledPaper elevation={3}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            mb: 2,
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            display: 'inline-flex',
                            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)'
                        }}
                    >
                        <img 
                            src="/Logo_transparente.png" 
                            alt="OFILAB Logo" 
                            style={{ height: isMobile ? '50px' : '65px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </Box>

                    <Typography
                        variant={isMobile ? 'h5' : 'h4'}
                        sx={{
                            fontWeight: 800,
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2,
                            width: '100%',
                            letterSpacing: '-0.5px'
                        }}
                    >
                        OFILAB
                    </Typography>
                    
                    <Typography
                        variant={isMobile ? 'subtitle2' : 'subtitle1'}
                        sx={{
                            fontWeight: 500,
                            textAlign: 'center',
                            color: '#64748B',
                            mt: 0.5,
                            mb: 2,
                            width: '100%',
                        }}
                    >
                        Sistema de Control de Inventario
                    </Typography>
                </Box>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            width: '100%', 
                            mb: 3,
                            borderRadius: 2,
                        }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Usuario"
                        placeholder="Ingresa tu usuario"
                        autoComplete="username"
                        autoFocus
                        {...register('usuario', { 
                            required: 'El usuario es requerido' 
                        })}
                        error={!!errors.usuario}
                        helperText={errors.usuario?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon sx={{ color: '#667eea' }} />
                                </InputAdornment>
                            ),
                        }}
                        size={isMobile ? 'small' : 'medium'}
                        disabled={loading}
                    />

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Contraseña"
                        placeholder="Ingresa tu contraseña"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password', { 
                            required: 'La contraseña es requerida',
                            minLength: {
                                value: 6,
                                message: 'Mínimo 6 caracteres'
                            }
                        })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#667eea' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size={isMobile ? 'small' : 'medium'}
                                        disabled={loading}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        size={isMobile ? 'small' : 'medium'}
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 3,
                            mb: 2,
                            py: isMobile ? 1.2 : 1.5,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
                            textTransform: 'none',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: 600,
                            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #6D28D9 0%, #C084FC 100%)',
                            },
                            '&:disabled': {
                                background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'INICIAR SESIÓN'
                        )}
                    </Button>

                </Box>

                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} sx={{ mt: 3, width: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Hecho por
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        OFILAB
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', ml: 0.5 }}>
                        © {new Date().getFullYear()}
                    </Typography>
                </Box>
            </StyledPaper>
        </Box>
    );
};

export default Login;
