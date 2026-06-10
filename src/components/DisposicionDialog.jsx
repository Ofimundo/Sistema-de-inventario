// src/components/DisposicionDialog.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Paper,
    Typography,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Alert,
    CircularProgress,
    Box,
    alpha,
    Divider,
    IconButton
} from '@mui/material';
import {
    DeleteForever as DeleteForeverIcon,
    VolunteerActivism as VolunteerActivismIcon,
    Close as CloseIcon,
    Upload as UploadIcon,
    PictureAsPdf as PdfIcon,
    Description as DescriptionIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import api from '../services/api';

const colors = {
    primary: '#0A66C2',
    secondary: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB'
};

// Función para obtener el icono según el tipo de archivo
const getFileIcon = (filename) => {
    if (!filename) return <DescriptionIcon />;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#dc2626' }} />;
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return <ImageIcon sx={{ color: '#3b82f6' }} />;
    return <DescriptionIcon sx={{ color: '#6b7280' }} />;
};

export function DisposicionDialog({ open, onClose, producto, onSuccess }) {
    const [tipo, setTipo] = useState('BAJA');
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [autorizadoPor, setAutorizadoPor] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [direccion, setDireccion] = useState('');
    const [recibe, setRecibe] = useState('');
    const [documento, setDocumento] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            setTipo('BAJA');
            setMotivo('');
            setDescripcion('');
            setAutorizadoPor('');
            setInstitucion('');
            setDireccion('');
            setRecibe('');
            setDocumento(null);
            setError('');
            setSuccess('');
        }
    }, [open, producto]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('El archivo no puede superar los 5MB');
                return;
            }
            setDocumento(file);
            setError('');
        }
    };

    const removeFile = () => {
        setDocumento(null);
    };

    const validateForm = () => {
        if (tipo === 'BAJA') {
            if (!motivo?.trim()) {
                setError('Debe ingresar un motivo de baja');
                return false;
            }
            if (!autorizadoPor?.trim()) {
                setError('Debe ingresar quién autoriza la baja');
                return false;
            }
        } else {
            if (!institucion?.trim()) {
                setError('Debe ingresar la institución/beneficiario');
                return false;
            }
            if (!direccion?.trim()) {
                setError('Debe ingresar la dirección');
                return false;
            }
        }

        if (!producto || !producto.id) {
            setError('No hay producto seleccionado');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('producto_id', String(producto.id));
            formData.append('tipo', tipo);
            
            if (tipo === 'BAJA') {
                formData.append('motivo_baja', motivo.trim());
                formData.append('autorizado_por', autorizadoPor.trim());
                
                if (descripcion?.trim()) {
                    formData.append('observaciones', descripcion.trim());
                }
                
                if (documento) {
                    formData.append('documento_autorizacion', documento);
                }
                
                // Llamada al endpoint de baja
                const response = await api.post('/productos/baja', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data?.success) {
                    setSuccess(`✅ Baja registrada para ${producto.nombre}`);
                    setTimeout(() => {
                        if (onSuccess) onSuccess(response.data.message || `Baja registrada para ${producto.nombre}`);
                        onClose();
                    }, 1500);
                } else {
                    throw new Error(response.data?.message || 'Error al registrar la baja');
                }
                
            } else {
                formData.append('beneficiario', institucion.trim());
                formData.append('direccion', direccion.trim());
                
                let observacionesStr = '';
                if (recibe?.trim()) observacionesStr += `Recibe: ${recibe.trim()}. `;
                if (motivo?.trim()) observacionesStr += `Motivo: ${motivo.trim()}. `;
                if (descripcion?.trim()) observacionesStr += descripcion.trim();
                
                formData.append('observaciones', observacionesStr.trim() || 'Sin observaciones');
                
                if (documento) {
                    formData.append('documento_firmado', documento);
                }
                
                // Llamada al endpoint de donación
                const response = await api.post('/productos/donacion', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                if (response.data?.success) {
                    setSuccess(`✅ Donación registrada para ${producto.nombre}`);
                    setTimeout(() => {
                        if (onSuccess) onSuccess(response.data.message || `Donación registrada para ${producto.nombre}`);
                        onClose();
                    }, 1500);
                } else {
                    throw new Error(response.data?.message || 'Error al registrar la donación');
                }
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!producto) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Error</Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning">No hay producto seleccionado</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="contained">Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        {tipo === 'BAJA' ? (
                            <DeleteForeverIcon sx={{ color: colors.error }} />
                        ) : (
                            <VolunteerActivismIcon sx={{ color: colors.success }} />
                        )}
                        <Typography variant="h6">
                            {tipo === 'BAJA' ? 'Registrar Baja de Producto' : 'Registrar Donación de Producto'}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Stack spacing={3}>
                    {/* Información del producto */}
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.primary, 0.02) }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            📦 Producto: {producto.nombre} (ID: {producto.id})
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            <strong>N° Serie:</strong> {producto.numero_serie || 'N/A'} | 
                            <strong> Marca:</strong> {producto.marca || 'N/A'} | 
                            <strong> Modelo:</strong> {producto.modelo || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            <strong>Condición:</strong> {producto.condicion || 'NUEVO'} | 
                            <strong> Estado actual:</strong> {producto.estado || (producto.id_estado_equipo === 1 ? 'DISPONIBLE' : 'NO DISPONIBLE')}
                        </Typography>
                    </Paper>

                    {/* Selector de tipo de disposición */}
                    <FormControl component="fieldset">
                        <FormLabel sx={{ fontWeight: 600 }}>Tipo de disposición</FormLabel>
                        <RadioGroup 
                            row 
                            value={tipo} 
                            onChange={(e) => {
                                setTipo(e.target.value);
                                setError('');
                            }}
                        >
                            <FormControlLabel value="BAJA" control={<Radio />} label="🗑️ Baja" />
                            <FormControlLabel value="DONACION" control={<Radio />} label="🎁 Donación" />
                        </RadioGroup>
                    </FormControl>

                    {tipo === 'BAJA' ? (
                        <>
                            <TextField
                                fullWidth
                                label="Motivo de baja *"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                error={!!error && error.includes('motivo')}
                                placeholder="Ej: Obsoleto, Dañado, Robo, Pérdida..."
                                helperText="Especifique la razón de la baja"
                            />

                            <TextField
                                fullWidth
                                label="Autorizado por *"
                                value={autorizadoPor}
                                onChange={(e) => setAutorizadoPor(e.target.value)}
                                error={!!error && error.includes('autoriza')}
                                placeholder="Nombre de quien autoriza la baja"
                                helperText="Persona que autoriza esta acción"
                            />

                            <TextField
                                fullWidth
                                label="Descripción adicional"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Detalles adicionales sobre la baja..."
                            />
                        </>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                label="Institución/Beneficiario *"
                                value={institucion}
                                onChange={(e) => setInstitucion(e.target.value)}
                                error={!!error && error.includes('institución')}
                                placeholder="Nombre de la institución que recibe"
                                helperText="Organización o persona que recibe el equipo"
                            />

                            <TextField
                                fullWidth
                                label="Dirección *"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                error={!!error && error.includes('dirección')}
                                placeholder="Dirección completa del beneficiario"
                            />

                            <TextField
                                fullWidth
                                label="Persona que recibe"
                                value={recibe}
                                onChange={(e) => setRecibe(e.target.value)}
                                placeholder="Nombre de quien recibe el equipo (opcional)"
                            />

                            <TextField
                                fullWidth
                                label="Motivo de la donación"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Motivo de la donación o detalles adicionales..."
                            />

                            <TextField
                                fullWidth
                                label="Descripción adicional"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Observaciones adicionales sobre la donación..."
                            />
                        </>
                    )}

                    {/* Subida de documentos */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Documento de respaldo (opcional)
                        </Typography>
                        <input
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            id="documento-upload"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="documento-upload">
                            <Button 
                                variant="outlined" 
                                component="span" 
                                fullWidth
                                startIcon={<UploadIcon />}
                                sx={{ py: 1.5 }}
                            >
                                {documento ? 'Cambiar documento' : 'Subir documento (PDF, imagen, Word)'}
                            </Button>
                        </label>
                        {documento && (
                            <Box 
                                mt={1.5} 
                                p={1.5} 
                                bgcolor={alpha(colors.primary, 0.05)} 
                                borderRadius={1}
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getFileIcon(documento.name)}
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {documento.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({(documento.size / 1024).toFixed(1)} KB)
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={removeFile} color="error">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máx. 5MB)
                        </Typography>
                    </Box>

                    {/* Mensajes de éxito y error */}
                    {success && (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                            {success}
                        </Alert>
                    )}
                    
                    {error && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button 
                    onClick={onClose} 
                    disabled={loading}
                    variant="outlined"
                >
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    color={tipo === 'BAJA' ? 'error' : 'success'}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Procesando...' : 'Confirmar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}