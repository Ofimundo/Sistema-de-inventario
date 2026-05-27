// src/components/PrestamoDialog.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    Chip,
    Stack,
    Divider,
    Paper
} from '@mui/material';
import {
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    Inventory as InventoryIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../services/api';

const colors = {
    primary: '#0A66C2',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E5E7EB',
    background: '#F9FAFB'
};

const StyledDialogPaper = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: 0,
        width: '100%',
        maxWidth: 600
    }
}));

const PrestamoDialog = ({ open, onClose, productoSeleccionado, onSuccess }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorId, setColaboradorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            fetchColaboradores();
        }
    }, [open]);

    const fetchColaboradores = async () => {
        setLoading(true);
        try {
            const response = await api.get('/colaboradores');
            let colaboradoresData = [];
            if (response.data.success && Array.isArray(response.data.data)) {
                colaboradoresData = response.data.data;
            } else if (Array.isArray(response.data)) {
                colaboradoresData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                colaboradoresData = response.data.data;
            }
            setColaboradores(colaboradoresData);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            setError('No se pudieron cargar los colaboradores');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!colaboradorId) {
            setError('Debe seleccionar un colaborador');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const prestamoData = {
                producto_id: productoSeleccionado.id,
                colaborador_id: colaboradorId,
                es_prestamo: true,
                fecha_prestamo: new Date().toISOString(),
                observaciones: `PRÉSTAMO - ${productoSeleccionado.nombre} - ${new Date().toLocaleDateString()}`
            };

            const response = await api.post('/asignaciones', prestamoData);
            
            if (response.data && (response.data.success || response.data.id)) {
                onSuccess({ 
                    message: 'Préstamo registrado exitosamente (sin documento generado)',
                    prestamo: response.data 
                });
                handleClose();
            } else {
                throw new Error('Error al registrar el préstamo');
            }
        } catch (error) {
            console.error('Error registrando préstamo:', error);
            setError(error.response?.data?.message || 'Error al registrar el préstamo');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setColaboradorId('');
        setSearchTerm('');
        setError(null);
        onClose();
    };

    const filteredColaboradores = colaboradores.filter(colab => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            colab.nombre?.toLowerCase().includes(term) ||
            colab.rut?.toLowerCase().includes(term) ||
            colab.email?.toLowerCase().includes(term)
        );
    });

    return (
        <StyledDialogPaper open={open} onClose={handleClose} maxWidth="md">
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, pb: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: colors.primary, width: 32, height: 32 }}>
                            <AssignmentIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            Registrar Préstamo
                        </Typography>
                        <Chip 
                            label="SIN DOCUMENTO" 
                            size="small" 
                            sx={{ 
                                bgcolor: colors.warning, 
                                color: 'white',
                                fontWeight: 500,
                                fontSize: '0.7rem'
                            }} 
                        />
                    </Box>
                    <Button size="small" onClick={handleClose}>
                        <CloseIcon />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: colors.background, borderRadius: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Producto a prestar
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: colors.primary, width: 40, height: 40 }}>
                            <InventoryIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="body1" fontWeight={500}>
                                {productoSeleccionado?.nombre}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={0.5}>
                                <Chip label={`Marca: ${productoSeleccionado?.marca || '-'}`} size="small" variant="outlined" />
                                <Chip label={`Modelo: ${productoSeleccionado?.modelo || '-'}`} size="small" variant="outlined" />
                                <Chip label={`Serie: ${productoSeleccionado?.numero_serie || '-'}`} size="small" variant="outlined" />
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Seleccionar Colaborador
                </Typography>
                
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar colaborador por nombre, RUT o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {loading && !colaboradores.length ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={40} />
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredColaboradores.length === 0 ? (
                            <Alert severity="info" sx={{ borderRadius: 0 }}>
                                No se encontraron colaboradores
                            </Alert>
                        ) : (
                            filteredColaboradores.map((colab) => (
                                <Paper
                                    key={colab.id}
                                    variant="outlined"
                                    onClick={() => setColaboradorId(colab.id)}
                                    sx={{
                                        p: 2,
                                        mb: 1,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderColor: colaboradorId === colab.id ? colors.primary : colors.border,
                                        bgcolor: colaboradorId === colab.id ? `${colors.primary}08` : 'transparent',
                                        '&:hover': {
                                            borderColor: colors.primary,
                                            bgcolor: `${colors.primary}04`
                                        }
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar sx={{ bgcolor: colaboradorId === colab.id ? colors.primary : '#ccc' }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="body1" fontWeight={500}>
                                                {colab.nombre}
                                            </Typography>
                                            <Stack direction="row" spacing={2} mt={0.5}>
                                                <Typography variant="caption" color="text.secondary">
                                                    RUT: {colab.rut || '-'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Email: {colab.email || '-'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Depto: {colab.departamento || '-'}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        {colaboradorId === colab.id && (
                                            <CheckCircleIcon sx={{ color: colors.success }} />
                                        )}
                                    </Stack>
                                </Paper>
                            ))
                        )}
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 0 }}>
                        {error}
                    </Alert>
                )}

                <Alert severity="info" sx={{ mt: 2, borderRadius: 0 }}>
                    <Typography variant="body2">
                        <strong>⚠️ Importante:</strong> Este es un <strong>PRÉSTAMO</strong> y no generará un documento formal. 
                        Se registrará en el sistema con la bandera <strong>es_prestamo = 1</strong>.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ borderTop: `1px solid ${colors.border}`, p: 2 }}>
                <Button onClick={handleClose} sx={{ borderRadius: 0 }}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!colaboradorId || loading}
                    sx={{ bgcolor: colors.primary, borderRadius: 0 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Registrar Préstamo'}
                </Button>
            </DialogActions>
        </StyledDialogPaper>
    );
};

export default PrestamoDialog;