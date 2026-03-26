// src/pages/Register.jsx
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
    Grid,
    useTheme,
    useMediaQuery
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
    Badge as BadgeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { authService } from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: 24,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    maxWidth: 550,
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3),
        maxWidth: '95%',
    },
}));

const Register = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
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
                cargo: data.cargo,
                departamento: data.departamento
            });
            
            const result = await authService.register({
                usuario: data.usuario,
                contraseña: data.contraseña,
                nombre: data.nombre,
                email: data.email,
                rut: data.rut || '',
                cargo: data.cargo || '',
                departamento: data.departamento || ''
            });

            console.log('📦 Respuesta del registro:', result);

            if (result && result.success) {
                setSuccess('✅ Usuario registrado exitosamente. Redirigiendo al login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result?.message || 'Error al registrar usuario');
            }
        } catch (err) {
            console.error('❌ Error en registro:', err);
            setError(err.message || 'Error al registrar usuario');
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 2
        }}>
            <StyledPaper>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2
                    }}>
                        <InventoryIcon sx={{ fontSize: 35, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        Crear Cuenta
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Completa tus datos para registrarte
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

                        <Grid item xs={12}>
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