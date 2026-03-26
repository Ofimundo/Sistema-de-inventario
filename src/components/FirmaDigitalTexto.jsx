// src/components/FirmaDigitalTexto.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import { EditNote as SignatureIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

const FirmaDigitalTexto = ({ label, onFirmaCapturada, valorInicial = '', required = true }) => {
    const [firma, setFirma] = useState(valorInicial);
    const [modoEdicion, setModoEdicion] = useState(!valorInicial);
    const [firmaTemporal, setFirmaTemporal] = useState(valorInicial || '');

    const handleGuardarFirma = () => {
        if (required && !firmaTemporal.trim()) {
            return;
        }
        setFirma(firmaTemporal);
        setModoEdicion(false);
        onFirmaCapturada(firmaTemporal);
    };

    const handleEditar = () => {
        setFirmaTemporal(firma);
        setModoEdicion(true);
    };

    const handleCancelar = () => {
        setFirmaTemporal(firma);
        setModoEdicion(false);
    };

    return (
        <Box sx={{ 
            border: `1px solid #000`, 
            p: 2, 
            mb: 2,
            bgcolor: '#fafafa'
        }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SignatureIcon sx={{ color: '#0A66C2', fontSize: 20 }} />
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </Typography>
            
            {modoEdicion ? (
                <>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Escriba el nombre completo de la persona que firma"
                        value={firmaTemporal}
                        onChange={(e) => setFirmaTemporal(e.target.value)}
                        sx={{ mb: 1 }}
                        helperText="Ej: Juan Pérez Pérez, RUT: 12.345.678-9"
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={handleCancelar} sx={{ borderRadius: 0 }}>
                            Cancelar
                        </Button>
                        <Button 
                            size="small" 
                            variant="contained" 
                            onClick={handleGuardarFirma}
                            startIcon={<SaveIcon />}
                            sx={{ borderRadius: 0 }}
                        >
                            Guardar firma
                        </Button>
                    </Box>
                </>
            ) : (
                <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#e8f5e9', 
                    border: `1px solid #4caf50`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {firma || (required ? 'Firma pendiente' : 'No especificada')}
                    </Typography>
                    <IconButton size="small" onClick={handleEditar} sx={{ color: '#0A66C2' }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

export default FirmaDigitalTexto;