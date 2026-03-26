// src/pages/RecoverPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    InputAdornment
} from '@mui/material';
import {
    Email as EmailIcon,
    LockReset as LockResetIcon,
    Check as CheckIcon,
    ArrowBack as ArrowBackIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import authService from '../services/auth';

const steps = ['Ingresar Email', 'Nueva Contraseña', 'Completado'];

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
    maxWidth: 450,
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3),
        maxWidth: '90%',
        borderRadius: 20,
    },
}));

const RecoverPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const [activeStep, setActiveStep] = useState(token ? 1 : 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const newPassword = watch('nueva_contraseña', '');

    // Paso 1: Solicitar recuperación
    const handleRecoverRequest = async (data) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const result = await authService.recoverPassword(data.email);
            if (result.success) {
                setEmail(data.email);
                setSuccessMessage(result.message || 'Se han enviado las instrucciones a tu correo');
                setActiveStep(1); // CORREGIDO: Ir al paso 1 (ingresar token)
            } else {
                setError(result.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            setError(error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    // Paso 2: Resetear contraseña (con token)
    const handleResetPassword = async (data) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const urlToken = token || data.token;
            const result = await authService.resetPassword(urlToken, data.nueva_contraseña);
            
            if (result.success) {
                setSuccessMessage(result.message || 'Contraseña actualizada exitosamente');
                setActiveStep(2);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(result.message || 'Error al resetear contraseña');
            }
        } catch (error) {
            setError(error.message || 'Error al resetear contraseña');
        } finally {
            setLoading(false);
        }
    };

    // Renderizar paso actual
    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box component="form" onSubmit={handleSubmit(handleRecoverRequest)} sx={{ width: '100%' }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                mb: 3, 
                                textAlign: 'center',
                                color: '#4a5568',
                            }}
                        >
                            Ingrese su correo electrónico. Le enviaremos un enlace para recuperar su contraseña.
                        </Typography>

                        <TextField
                            required
                            fullWidth
                            label="Email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            margin="normal"
                            {...register('email', { 
                                required: 'El email es requerido',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 12,
                                    backgroundColor: alpha('#fff', 0.9),
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                    },
                                    '&.Mui-focused': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
                                    },
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                                },
                                '&:disabled': {
                                    background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                                },
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                        >
                            {loading ? 'Enviando...' : 'ENVIAR INSTRUCCIONES'}
                        </Button>
                    </Box>
                );

            case 1:
                return (
                    <Box component="form" onSubmit={handleSubmit(handleResetPassword)} sx={{ width: '100%' }}>
                        {successMessage && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                {successMessage}
                            </Alert>
                        )}

                        {!token && (
                            <TextField
                                required
                                fullWidth
                                label="Token de recuperación"
                                placeholder="Ingresa el token recibido"
                                margin="normal"
                                {...register('token', { 
                                    required: 'El token es requerido' 
                                })}
                                error={!!errors.token}
                                helperText={errors.token?.message}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockResetIcon sx={{ color: '#667eea' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 12,
                                        backgroundColor: alpha('#fff', 0.9),
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                        },
                                        '&.Mui-focused': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
                                        },
                                    },
                                }}
                            />
                        )}

                        <TextField
                            required
                            fullWidth
                            label="Nueva Contraseña"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            margin="normal"
                            {...register('nueva_contraseña', { 
                                required: 'La nueva contraseña es requerida',
                                minLength: {
                                    value: 6,
                                    message: 'Mínimo 6 caracteres'
                                }
                            })}
                            error={!!errors.nueva_contraseña}
                            helperText={errors.nueva_contraseña?.message}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockResetIcon sx={{ color: '#667eea' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 12,
                                    backgroundColor: alpha('#fff', 0.9),
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                    },
                                    '&.Mui-focused': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
                                    },
                                },
                            }}
                        />

                        <TextField
                            required
                            fullWidth
                            label="Confirmar Contraseña"
                            type="password"
                            placeholder="Repite tu contraseña"
                            margin="normal"
                            {...register('confirmar_contraseña', { 
                                required: 'Confirme su contraseña',
                                validate: value => 
                                    value === newPassword || 'Las contraseñas no coinciden'
                            })}
                            error={!!errors.confirmar_contraseña}
                            helperText={errors.confirmar_contraseña?.message}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockResetIcon sx={{ color: '#667eea' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 12,
                                    backgroundColor: alpha('#fff', 0.9),
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                    },
                                    '&.Mui-focused': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
                                    },
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                borderRadius: 12,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                                },
                                '&:disabled': {
                                    background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                                },
                            }}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
                        >
                            {loading ? 'Actualizando...' : 'ACTUALIZAR CONTRASEÑA'}
                        </Button>
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ textAlign: 'center', py: 2, width: '100%' }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: alpha('#4caf50', 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            <CheckIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2d3748' }}>
                            ¡Contraseña actualizada!
                        </Typography>
                        <Typography variant="body1" paragraph sx={{ color: '#4a5568', mb: 3 }}>
                            Su contraseña ha sido actualizada exitosamente.
                            Será redirigido al login en unos segundos.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{
                                borderRadius: 12,
                                py: 1.2,
                                px: 4,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                                },
                            }}
                        >
                            Ir al Login
                        </Button>
                    </Box>
                );

            default:
                return null;
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
                {/* Logo y título */}
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
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                        }}
                    >
                        <InventoryIcon sx={{ fontSize: 30, color: 'white' }} />
                    </Box>

                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#2d3748',
                            mb: 1,
                        }}
                    >
                        Recuperar Contraseña
                    </Typography>
                </Box>

                <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

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

                {renderStep()}

                <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            sx={{
                                color: '#667eea',
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: alpha('#667eea', 0.04),
                                },
                            }}
                        >
                            Volver al Login
                        </Button>
                    </Link>
                </Box>

                {/* Footer */}
                <Typography
                    variant="caption"
                    sx={{
                        mt: 3,
                        color: '#a0aec0',
                        textAlign: 'center',
                        width: '100%',
                        display: 'block',
                    }}
                >
                    © 2026 Sistema de Gestión de Inventario
                </Typography>
            </StyledPaper>
        </Box>
    );
};

export default RecoverPassword;