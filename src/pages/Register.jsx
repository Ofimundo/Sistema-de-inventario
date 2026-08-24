/* eslint-disable react-hooks/incompatible-library */

import React, { useState } from 'react';
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
    Grid
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    PersonAdd as PersonAddIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
    Lock as LockIcon,
    Inventory as InventoryIcon,
    ArrowBack as ArrowBackIcon,
    Badge as BadgeIcon,
    Phone as PhoneIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    maxWidth: 650,
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3),
        maxWidth: '95%',
    },
}));

const Register = () => {
    const navigate = useNavigate();
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const password = watch('contraseña', '');

    const onSubmit = async (data) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('📝 Enviando datos de registro:', {
                usuario: data.usuario,
                nombre: data.nombre,
                email: data.email,
                rut: data.rut,
                telefono: data.telefono,
                cargo: data.cargo,
                departamento: data.departamento,
                direccion: data.direccion
            });
            
            // Enviar todos los datos al backend
            const response = await api.post('/auth/register', {
                usuario: data.usuario,
                password: data.contraseña,
                nombre: data.nombre,
                email: data.email,
                rut: data.rut || '',
                telefono: data.telefono || '',
                cargo: data.cargo || '',
                departamento: data.departamento || '',
                direccion: data.direccion || '',
                rol: 'usuario'
            });

            console.log('📦 Respuesta del registro:', response.data);

            if (response.data && response.data.success) {
                // Guardar el token
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                // Obtener los datos del usuario de la respuesta (priorizar datos del backend)
                const usuarioData = response.data.usuario || response.data.user || {};
                
                // Guardar TODOS los datos del usuario en localStorage
                const userData = {
                    id: usuarioData.id,
                    usuario: data.usuario,
                    nombre: data.nombre,
                    email: data.email,
                    rut: data.rut || usuarioData.rut || '',
                    telefono: data.telefono || usuarioData.telefono || '',
                    cargo: data.cargo || usuarioData.cargo || '',
                    departamento: data.departamento || usuarioData.departamento || '',
                    direccion: data.direccion || usuarioData.direccion || '',
                    rol: usuarioData.rol || 'usuario'
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('✅ Usuario guardado en localStorage:', userData);
                
                setSuccess('✅ Usuario registrado exitosamente. Redirigiendo al dashboard...');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(response.data?.message || 'Error al registrar usuario');
            }
        } catch (err) {
            console.error('❌ Error en registro:', err);
            setError(err.response?.data?.message || err.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #4C1D95 100%)',
            p: 2
        }}>
            <StyledPaper>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        display: 'inline-flex',
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)',
                        mb: 2
                    }}>
                        <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '55px', width: 'auto', objectFit: 'contain' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Crear Cuenta - OFILAB
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Completa tus datos para registrarte en el sistema
                    </Typography>
                </Box>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 3 }}
                        onClose={() => setError('')}
                    >
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert 
                        severity="success" 
                        sx={{ mb: 3 }}
                        onClose={() => setSuccess('')}
                    >
                        {success}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Nombre Completo"
                                {...register('nombre', { required: 'El nombre es requerido' })}
                                error={!!errors.nombre}
                                helperText={errors.nombre?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Usuario"
                                {...register('usuario', { 
                                    required: 'El usuario es requerido',
                                    minLength: { value: 3, message: 'Mínimo 3 caracteres' }
                                })}
                                error={!!errors.usuario}
                                helperText={errors.usuario?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BadgeIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Email"
                                type="email"
                                {...register('email', { 
                                    required: 'El email es requerido',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Email inválido'
                                    }
                                })}
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="RUT"
                                {...register('rut')}
                                placeholder="12.345.678-9"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BadgeIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                {...register('telefono')}
                                placeholder="+56 9 1234 5678"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cargo"
                                {...register('cargo')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <WorkIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Departamento"
                                {...register('departamento')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BusinessIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Dirección"
                                {...register('direccion')}
                                placeholder="Dirección completa"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <HomeIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                {...register('contraseña', { 
                                    required: 'La contraseña es requerida',
                                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                                })}
                                error={!!errors.contraseña}
                                helperText={errors.contraseña?.message}
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
                                                disabled={loading}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Confirmar Contraseña"
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...register('confirmarContraseña', { 
                                    required: 'Confirme su contraseña',
                                    validate: value => value === password || 'Las contraseñas no coinciden'
                                })}
                                error={!!errors.confirmarContraseña}
                                helperText={errors.confirmarContraseña?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton 
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                                edge="end" 
                                                disabled={loading}
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 4,
                            py: 1.5,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                            },
                        }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                    >
                        {loading ? 'Registrando...' : 'REGISTRARSE'}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <Button 
                                variant="text" 
                                startIcon={<ArrowBackIcon />} 
                                sx={{ color: '#667eea' }} 
                                disabled={loading}
                            >
                                ¿Ya tienes cuenta? Inicia Sesión
                            </Button>
                        </Link>
                    </Box>
                </form>
            </StyledPaper>
        </Box>
    );
};

export default Register;