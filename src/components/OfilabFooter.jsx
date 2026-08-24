import React from 'react';
import { Box, Typography, Container, Stack } from '@mui/material';

const OfilabFooter = () => {
    return (
        <Box 
            component="footer" 
            sx={{ 
                py: 2.5, 
                px: 2, 
                mt: 'auto', 
                backgroundColor: '#ffffff', 
                borderTop: '1px solid #E5E7EB',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.03)'
            }}
        >
            <Container maxWidth="xl">
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    justifyContent="space-between" 
                    alignItems="center" 
                    spacing={1.5}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <img 
                            src="/Logo_transparente.png" 
                            alt="OFILAB Logo" 
                            style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
                        />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Sistema de Control de Inventario
                        </Typography>
                    </Stack>
                    <Box display="flex" alignItems="center" gap={0.8}>
                        <Typography variant="body2" color="text.secondary">
                            Hecho por
                        </Typography>
                        <Typography 
                            variant="body2" 
                            fontWeight={800} 
                            sx={{ 
                                background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.5px'
                            }}
                        >
                            OFILAB
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            © {new Date().getFullYear()} Todos los derechos reservados.
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};

export default OfilabFooter;
