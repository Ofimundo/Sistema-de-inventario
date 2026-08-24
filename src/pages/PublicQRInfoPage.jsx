import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Box, 
    CardContent, 
    Typography, 
    Container, 
    Paper, 
    Button, 
    CircularProgress,
    Alert,
    Stack
} from '@mui/material';
import { 
    PictureAsPdf as PdfIcon,
    Lock as LockIcon,
    Download as DownloadIcon
} from '@mui/icons-material';

export default function PublicQRInfoPage() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const serieParam = searchParams.get('serie');

    const [downloading, setDownloading] = useState(true);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    // Determinar la URL del endpoint PDF en el backend
    const getApiBaseUrl = () => {
        if (import.meta.env && import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
        const hostname = window.location.hostname || 'localhost';
        return `${window.location.protocol}//${hostname}:3001/api`;
    };

    const apiBaseUrl = getApiBaseUrl();
    const pdfDownloadUrl = id 
        ? `${apiBaseUrl}/productos/qr-pdf?id=${encodeURIComponent(id)}`
        : `${apiBaseUrl}/productos/qr-pdf?serie=${encodeURIComponent(serieParam || '')}`;

    const triggerDownload = () => {
        setDownloading(true);
        setDownloadSuccess(false);

        // Disparar la descarga directa por ventana/iframe para evitar bloqueos
        window.location.href = pdfDownloadUrl;

        setTimeout(() => {
            setDownloading(false);
            setDownloadSuccess(true);
        }, 1500);
    };

    useEffect(() => {
        triggerDownload();
    }, [id, serieParam]);

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', 
                bgcolor: '#F8FAFC', 
                py: 6, 
                px: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif'
            }}
        >
            <Container maxWidth="xs">
                <Paper 
                    elevation={4} 
                    sx={{ 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        border: '1px solid #E2E8F0',
                        bgcolor: '#FFFFFF',
                        color: '#0F172A',
                        textAlign: 'center'
                    }}
                >
                    {/* Header con Logo Ofilab */}
                    <Box sx={{ p: 4, bgcolor: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                        <Box 
                            component="img" 
                            src="/Logo_transparente.png" 
                            alt="Ofilab Logo" 
                            sx={{ height: 48, maxWidth: '80%', objectFit: 'contain', mx: 'auto', mb: 1.5 }}
                        />
                        <Typography variant="h6" fontWeight={800} sx={{ color: '#0F172A', letterSpacing: '0.5px' }}>
                            Ficha Técnica de Equipo
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                            Sistema de Inventario TI - Ofilab
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        <Stack spacing={3} alignItems="center">
                            {downloading ? (
                                <Box py={2} textAlign="center">
                                    <CircularProgress size={44} sx={{ color: '#0284C7', mb: 2 }} />
                                    <Typography variant="body1" fontWeight={700} color="#0F172A">
                                        Generando PDF Ficha Técnica...
                                    </Typography>
                                    <Typography variant="caption" color="#64748B" sx={{ mt: 1, display: 'block' }}>
                                        La descarga se iniciará automáticamente en breve.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box py={1} textAlign="center">
                                    <PdfIcon sx={{ fontSize: 60, color: '#EF4444', mb: 1 }} />
                                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                                        ¡Documento PDF Listo!
                                    </Typography>
                                    <Typography variant="body2" color="#64748B" sx={{ mt: 0.5 }}>
                                        Si la descarga no comenzó automáticamente, presiona el botón inferior.
                                    </Typography>
                                </Box>
                            )}

                            {/* Mensaje Informativo de Encriptación (sin mostrar el texto de la clave) */}
                            <Alert 
                                severity="info" 
                                icon={<LockIcon sx={{ color: '#0284C7' }} />}
                                sx={{ 
                                    bgcolor: '#F0F9FF', 
                                    color: '#0369A1', 
                                    border: '1px solid #BAE6FD',
                                    borderRadius: '16px',
                                    textAlign: 'left',
                                    width: '100%',
                                    '& .MuiAlert-icon': { alignItems: 'center' }
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={800} color="#0369A1">
                                    Documento Encriptado
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#0C4A6E' }}>
                                    Este archivo PDF está protegido con clave de seguridad para su apertura.
                                </Typography>
                            </Alert>

                            {/* Botón Re-Descarga manual */}
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={triggerDownload}
                                startIcon={<DownloadIcon />}
                                sx={{
                                    bgcolor: '#0284C7',
                                    color: 'white',
                                    fontWeight: 800,
                                    py: 1.5,
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                                    '&:hover': { bgcolor: '#0369A1' }
                                }}
                            >
                                Descargar PDF Ficha Técnica
                            </Button>
                        </Stack>
                    </CardContent>
                </Paper>
            </Container>
        </Box>
    );
}
