// src/components/FirmaDibujadaDialog.jsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography
} from '@mui/material';
import { Draw as DrawIcon } from '@mui/icons-material';
import FirmaCanvas from './FirmaCanvas';

const FirmaDibujadaDialog = ({ open, onClose, onConfirm, titulo }) => {
    const [firmaData, setFirmaData] = useState(null);

    const handleFirmaGuardada = (data) => {
        setFirmaData(data);
    };

    const handleConfirmar = () => {
        if (firmaData) {
            onConfirm(firmaData);
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <DrawIcon sx={{ color: '#0A66C2' }} />
                    <Typography variant="h6">{titulo || 'Firma Digital'}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <FirmaCanvas onFirmaGuardada={handleFirmaGuardada} width={450} height={180} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ borderRadius: 0 }}>Cancelar</Button>
                <Button 
                    onClick={handleConfirmar} 
                    variant="contained" 
                    color="primary" 
                    disabled={!firmaData}
                    sx={{ borderRadius: 0 }}
                >
                    Confirmar Firma
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FirmaDibujadaDialog;