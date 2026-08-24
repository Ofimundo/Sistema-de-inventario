// src/components/ErrorBoundary.jsx
import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🔴 ErrorBoundary capturó un error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                        bgcolor: '#f8fafc',
                        p: 3
                    }}
                >
                    <Paper
                        elevation={4}
                        sx={{
                            p: 4,
                            maxWidth: 500,
                            width: '100%',
                            textAlign: 'center',
                            borderRadius: 4,
                            borderTop: '4px solid #ef4444'
                        }}
                    >
                        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>
                            ⚠️
                        </Typography>
                        <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                            Ha ocurrido un error inesperado
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            La vista se interrumpió debido a un problema temporal. Puedes intentar recargar la página o volver al panel principal.
                        </Typography>
                        {this.state.error?.message && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    mb: 3,
                                    bgcolor: '#fef2f2',
                                    borderColor: '#fca5a5',
                                    textAlign: 'left',
                                    overflowX: 'auto'
                                }}
                            >
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#991b1b' }}>
                                    {this.state.error.message}
                                </Typography>
                            </Paper>
                        )}
                        <Box display="flex" gap={2} justifyContent="center">
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={this.handleReset}
                                sx={{
                                    bgcolor: '#0A66C2',
                                    '&:hover': { bgcolor: '#084e96' }
                                }}
                            >
                                Recargar página
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<HomeIcon />}
                                onClick={this.handleGoHome}
                            >
                                Ir al Inicio
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
