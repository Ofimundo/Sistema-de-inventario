// src/pages/Login.jsx - VERSIÓN CORREGIDA
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
import { authService } from '../services/api';

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
            
            // Llamar al servicio de login
            const result = await authService.login(data.usuario, data.password);
            
            console.log('📦 Resultado del login:', result);
            
            if (result && result.success) {
                // ✅ CORREGIDO: Los datos del usuario están en result.data
                const userData = result.data?.usuario || result.usuario;
                
                if (userData) {
                    console.log('✅ Login exitoso, usuario:', userData.usuario);
                    console.log('✅ Token guardado:', localStorage.getItem('token') ? 'Sí' : 'No');
                    console.log('✅ User guardado:', localStorage.getItem('user') ? 'Sí' : 'No');
                    
                    // Forzar un pequeño delay para asegurar que localStorage se escribió
                    setTimeout(() => {
                        navigate('/dashboard', { replace: true });
                    }, 100);
                } else {
                    setError('No se recibieron datos del usuario');
                }
            } else {
                setError(result?.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            setError(error.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2,
                margin: 0,
                minHeight: '100vh',
                width: '100vw',
                boxSizing: 'border-box',
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
                    <Avatar
                        sx={{
                            width: isMobile ? 70 : 80,
                            height: isMobile ? 70 : 80,
                            mb: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                    >
                        <InventoryIcon sx={{ fontSize: isMobile ? 35 : 40, color: 'white' }} />
                    </Avatar>

                    <Typography
                        variant={isMobile ? 'h5' : 'h4'}
                        sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#2d3748',
                            lineHeight: 1.2,
                            width: '100%',
                        }}
                    >
                        StockMaster Pro
                    </Typography>
                    
                    <Typography
                        variant={isMobile ? 'subtitle1' : 'h6'}
                        sx={{
                            fontWeight: 500,
                            textAlign: 'center',
                            color: '#4a5568',
                            mb: 2,
                            width: '100%',
                        }}
                    >
                        Sistema de Gestión de Inventario
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                            },
                            '&:disabled': {
                                background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                            },
                        }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
                    </Button>

                    <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                            O
                        </Typography>
                    </Divider>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            mb: 2,
                            width: '100%',
                        }}
                    >
                        <Link to="/register" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                            <Button
                                fullWidth={isMobile}
                                variant="text"
                                sx={{
                                    color: '#667eea',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                                    '&:hover': {
                                        backgroundColor: alpha('#667eea', 0.04),
                                    },
                                }}
                                disabled={loading}
                            >
                                Crear Cuenta
                            </Button>
                        </Link>

                        <Link to="/recover-password" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                            <Button
                                fullWidth={isMobile}
                                variant="text"
                                sx={{
                                    color: '#667eea',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                                    '&:hover': {
                                        backgroundColor: alpha('#667eea', 0.04),
                                    },
                                }}
                                disabled={loading}
                            >
                                ¿Olvidaste tu contraseña?
                            </Button>
                        </Link>
                    </Box>
                </Box>

                <Typography
                    variant="caption"
                    sx={{
                        mt: 3,
                        color: '#a0aec0',
                        textAlign: 'center',
                        fontSize: isMobile ? '0.7rem' : '0.75rem',
                        width: '100%',
                        display: 'block',
                    }}
                >
                    © 2026 StockMaster Pro v2.0
                </Typography>
            </StyledPaper>
        </Box>
    );
};

export default Login;