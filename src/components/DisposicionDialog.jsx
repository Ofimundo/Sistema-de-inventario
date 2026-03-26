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
    alpha
} from '@mui/material';
import {
    DeleteForever as DeleteForeverIcon,
    VolunteerActivism as VolunteerActivismIcon
} from '@mui/icons-material';
import { productosService } from '../services/productos';

const colors = {
    primary: '#0A66C2',
    secondary: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB'
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
        }
    }, [open, producto]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setDocumento(file);
        }
    };

    const handleSubmit = async () => {
        if (tipo === 'BAJA') {
            if (!motivo?.trim()) {
                setError('Debe ingresar un motivo de baja');
                return;
            }
            if (!autorizadoPor?.trim()) {
                setError('Debe ingresar quién autoriza la baja');
                return;
            }
        } else {
            if (!institucion?.trim()) {
                setError('Debe ingresar la institución/beneficiario');
                return;
            }
            if (!direccion?.trim()) {
                setError('Debe ingresar la dirección');
                return;
            }
        }

        if (!producto || !producto.id) {
            setError('No hay producto seleccionado');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('producto_id', String(producto.id));
            
            let response;
            
            if (tipo === 'BAJA') {
                formData.append('motivo_baja', motivo.trim());
                formData.append('autorizado_por', autorizadoPor.trim());
                
                if (descripcion?.trim()) {
                    formData.append('observaciones', descripcion.trim());
                }
                
                if (documento) {
                    formData.append('documento_autorizacion', documento);
                }
                
                response = await productosService.registrarBaja(formData);
                
                // Actualizar estado del producto
                if (response && response.success) {
                    // El backend debería actualizar el estado a 'NO DISPONIBLE' y registrar fecha_baja
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
                
                response = await productosService.registrarDonacion(formData);
                
                // Actualizar estado del producto
                if (response && response.success) {
                    // El backend debería actualizar el estado a 'NO DISPONIBLE' y registrar fecha_donacion
                }
            }
            
            if (response && response.success) {
                const mensaje = tipo === 'BAJA' 
                    ? `Baja registrada para ${producto.nombre}` 
                    : `Donación registrada para ${producto.nombre}`;
                
                onSuccess(mensaje);
                onClose();
            } else {
                throw new Error(response?.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setError(error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!producto) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogContent>
                    <Alert severity="warning">No hay producto seleccionado</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
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
            </DialogTitle>
            
            <DialogContent dividers>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.primary, 0.02) }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Producto: {producto.nombre} (ID: {producto.id})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Serie: {producto.numero_serie || 'N/A'} | Condición: {producto.condicion || 'NUEVO'} | 
                            Estado actual: {producto.estado || 'DISPONIBLE'}
                        </Typography>
                    </Paper>

                    <FormControl component="fieldset">
                        <FormLabel>Tipo de disposición</FormLabel>
                        <RadioGroup row value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <FormControlLabel value="BAJA" control={<Radio />} label="Baja" />
                            <FormControlLabel value="DONACION" control={<Radio />} label="Donación" />
                        </RadioGroup>
                    </FormControl>

                    {tipo === 'BAJA' ? (
                        <>
                            <TextField
                                fullWidth
                                label="Motivo de baja *"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                error={!!error && !motivo}
                                helperText={error && !motivo ? 'Requerido' : ''}
                                placeholder="Ej: Obsoleto, Dañado, Robo..."
                            />

                            <TextField
                                fullWidth
                                label="Autorizado por *"
                                value={autorizadoPor}
                                onChange={(e) => setAutorizadoPor(e.target.value)}
                                error={!!error && !autorizadoPor}
                                helperText={error && !autorizadoPor ? 'Requerido' : ''}
                                placeholder="Nombre de quien autoriza"
                            />

                            <TextField
                                fullWidth
                                label="Descripción"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Detalles adicionales..."
                            />
                        </>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                label="Institución/Beneficiario *"
                                value={institucion}
                                onChange={(e) => setInstitucion(e.target.value)}
                                error={!!error && !institucion}
                                helperText={error && !institucion ? 'Requerido' : ''}
                                placeholder="Nombre de la institución que recibe"
                            />

                            <TextField
                                fullWidth
                                label="Dirección *"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                error={!!error && !direccion}
                                helperText={error && !direccion ? 'Requerido' : ''}
                                placeholder="Dirección completa"
                            />

                            <TextField
                                fullWidth
                                label="Persona que recibe"
                                value={recibe}
                                onChange={(e) => setRecibe(e.target.value)}
                                placeholder="Nombre de quien recibe (opcional)"
                            />

                            <TextField
                                fullWidth
                                label="Motivo/Descripción"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Motivo de la donación o detalles adicionales..."
                            />
                        </>
                    )}

                    <Box>
                        <input
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            style={{ display: 'none' }}
                            id="documento-upload"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="documento-upload">
                            <Button variant="outlined" component="span" fullWidth>
                                {documento ? 'Cambiar documento' : 'Subir documento (opcional)'}
                            </Button>
                        </label>
                        {documento && (
                            <Box mt={1} p={1} bgcolor={alpha(colors.primary, 0.05)} borderRadius={1}>
                                <Typography variant="body2">{documento.name}</Typography>
                            </Box>
                        )}
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    color={tipo === 'BAJA' ? 'error' : 'success'}
                    disabled={loading}
                >
                    {loading ? 'Procesando...' : 'Confirmar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}