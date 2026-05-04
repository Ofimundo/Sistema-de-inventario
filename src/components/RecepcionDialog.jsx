// src/components/RecepcionDialog.jsx
/* eslint-disable react-hooks/static-components */
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Stack,
    Alert,
    CircularProgress,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider,
    Paper,
    Grid,
    Chip
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Check as CheckIcon,
    Draw as DrawIcon,
    Clear as ClearIcon,
    RestartAlt as RestartIcon,
    Person as PersonIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Inventory as InventoryIcon,
    Description as DescriptionIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';

// URL base fija para el backend
const API_BASE_URL = 'http://localhost:98';

// Componente de Firma Dibujada (Canvas)
const FirmaDibujada = ({ onFirmaGuardada, valorInicial = '', width = 450, height = 180, label = 'Firma' }) => {
    const canvasRef = React.useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (valorInicial && valorInicial !== '') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setHasSignature(true);
                };
                img.src = valorInicial;
            }
        }
    }, [valorInicial]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSignature) {
            const canvas = canvasRef.current;
            const signatureDataUrl = canvas.toDataURL('image/png');
            onFirmaGuardada(signatureDataUrl);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onFirmaGuardada('');
    };

    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                {label}
            </Typography>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    border: `2px solid #333`,
                    backgroundColor: 'white',
                    cursor: 'crosshair',
                    width: '100%',
                    height: 'auto',
                    touchAction: 'none',
                    borderRadius: 4
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={clearCanvas} startIcon={<ClearIcon />} sx={{ borderRadius: 0 }}>
                    Limpiar
                </Button>
                <Button size="small" variant="outlined" onClick={clearCanvas} startIcon={<RestartIcon />} sx={{ borderRadius: 0 }}>
                    Reiniciar
                </Button>
            </Box>
        </Box>
    );
};

// Componente de Firma por Texto
const FirmaTexto = ({ onFirmaCapturada, valorInicial = '', required = true, label = 'Firma' }) => {
    const [firma, setFirma] = useState(valorInicial);
    const [editando, setEditando] = useState(!valorInicial);
    const [temp, setTemp] = useState(valorInicial || '');

    const guardar = () => {
        if (required && !temp.trim()) return;
        setFirma(temp);
        setEditando(false);
        onFirmaCapturada(temp);
    };

    const editar = () => {
        setTemp(firma);
        setEditando(true);
    };

    const cancelar = () => {
        setTemp(firma);
        setEditando(false);
    };

    return (
        <Box sx={{ border: `1px solid #ddd`, p: 2, borderRadius: 1, bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#0A66C2', fontSize: 20 }} />
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </Typography>
            
            {editando ? (
                <>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Escriba el nombre completo de la persona que firma"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        sx={{ mb: 1 }}
                        helperText="Ej: Juan Pérez Pérez, RUT: 12.345.678-9"
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={cancelar} sx={{ borderRadius: 0 }}>Cancelar</Button>
                        <Button size="small" variant="contained" onClick={guardar} sx={{ borderRadius: 0 }}>Guardar</Button>
                    </Box>
                </>
            ) : (
                <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', border: `1px solid #4caf50`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {firma || (required ? 'Firma pendiente' : 'No especificada')}
                    </Typography>
                    <Button size="small" onClick={editar} sx={{ borderRadius: 0 }}>Editar</Button>
                </Box>
            )}
        </Box>
    );
};

// Componente principal
const RecepcionDialog = ({ open, onClose, producto, asignacion, onSuccess }) => {
    const [motivoDevolucion, setMotivoDevolucion] = useState('');
    const [observacionesDevolucion, setObservacionesDevolucion] = useState('');
    const [condicionEntrega, setCondicionEntrega] = useState('BUENO');
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [documentoGenerado, setDocumentoGenerado] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const getFirmaTrabajadorFinal = () => {
        if (tipoFirmaTrabajador === 'dibujo') {
            return firmaTrabajadorDibujo || '';
        }
        return firmaTrabajadorText;
    };

    const getFirmaGerenteFinal = () => {
        if (tipoFirmaGerente === 'dibujo') {
            return firmaGerenteDibujo || '';
        }
        return firmaGerenteText;
    };

    const handleDescargarDocumento = () => {
        if (documentoGenerado && documentoGenerado.filename && !downloading) {
            setDownloading(true);
            try {
                const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${documentoGenerado.filename}`;
                console.log('📥 Descargando documento:', documentoGenerado.filename);
                
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = documentoGenerado.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('❌ Error descargando documento:', error);
                alert('Error al descargar el documento. Por favor, intente nuevamente.');
            } finally {
                setTimeout(() => setDownloading(false), 1000);
            }
        }
    };

    const handleSubmit = async () => {
        if (!motivoDevolucion.trim()) {
            setError('Debe ingresar el MOTIVO DE LA DEVOLUCIÓN (campo obligatorio)');
            return;
        }
        
        const firmaTrabajadorFinal = getFirmaTrabajadorFinal();
        const firmaGerenteFinal = getFirmaGerenteFinal();

        if (!firmaTrabajadorFinal) {
            setError('La firma del trabajador es requerida');
            return;
        }
        if (!firmaGerenteFinal) {
            setError('La firma del gerente general es requerida');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // IMPORTANTE: Los nombres de los campos deben coincidir con el backend
            const payload = {
                fecha_devolucion: new Date().toISOString(),
                motivo_devolucion: motivoDevolucion,
                observaciones_devolucion: observacionesDevolucion,
                condicion_entrega: condicionEntrega,
                firma_trabajador_devolucion: firmaTrabajadorFinal,
                firma_gerente_devolucion: firmaGerenteFinal
            };

            console.log('📤 Enviando devolución:', payload);
            console.log('🔍 Firma trabajador recibida:', firmaTrabajadorFinal ? '✅ Si' : '❌ No');
            console.log('🔍 Firma gerente recibida:', firmaGerenteFinal ? '✅ Si' : '❌ No');

            const response = await api.put(`/asignaciones/${asignacion.id}/finalizar`, payload);

            console.log('📥 Respuesta del servidor:', response.data);

            if (response.data.success) {
                if (response.data.data?.documento) {
                    setDocumentoGenerado(response.data.data.documento);
                }
                setShowConfirmDialog(true);
                setSuccess(true);
                
                if (onSuccess) {
                    onSuccess({
                        success: true,
                        message: 'Producto recibido correctamente',
                        documento: response.data.data?.documento
                    });
                }
            } else {
                throw new Error(response.data?.message || 'Error al procesar la recepción');
            }
        } catch (error) {
            console.error('❌ Error en recepción:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la transacción');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setMotivoDevolucion('');
        setObservacionesDevolucion('');
        setCondicionEntrega('BUENO');
        setFirmaTrabajadorText('');
        setFirmaGerenteText('');
        setFirmaTrabajadorDibujo('');
        setFirmaGerenteDibujo('');
        setError('');
        setSuccess(false);
        setShowConfirmDialog(false);
        setDocumentoGenerado(null);
        onClose();
    };

    // Ventana de confirmación con documento
    const ConfirmacionDialog = () => (
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ¡Recepción Exitosa!
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                    El <strong>Acta de Recepción</strong> se ha generado correctamente.
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mt: 2, textAlign: 'left', bgcolor: '#f9f9f9' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        <DescriptionIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Resumen de la Devolución:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Motivo:</strong> {motivoDevolucion}
                    </Typography>
                    {observacionesDevolucion && (
                        <Typography variant="body2">
                            <strong>Observaciones:</strong> {observacionesDevolucion}
                        </Typography>
                    )}
                    <Typography variant="body2">
                        <strong>Condición:</strong> {condicionEntrega}
                    </Typography>
                </Paper>
                
                <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}>
                    <PdfIcon sx={{ color: '#f44336' }} />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {documentoGenerado?.filename || 'acta_recepcion.pdf'}
                    </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Producto: <strong>{producto?.nombre}</strong><br />
                    Colaborador: <strong>{asignacion?.colaborador_nombre}</strong>
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button 
                        variant="contained" 
                        startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                        onClick={handleDescargarDocumento}
                        disabled={downloading}
                        sx={{ borderRadius: 0, bgcolor: '#0A66C2' }}
                    >
                        {downloading ? 'Descargando...' : 'Descargar Acta'}
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => {
                            setShowConfirmDialog(false);
                            handleClose();
                        }}
                        sx={{ borderRadius: 0 }}
                    >
                        Cerrar
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );

    if (success && !showConfirmDialog) {
        return (
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon sx={{ color: '#4caf50' }} />
                        <Typography variant="h6">¡Recepción Exitosa!</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box textAlign="center" py={2}>
                        <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>Producto recibido correctamente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Se ha recibido el producto <strong>{producto?.nombre}</strong>
                        </Typography>
                        <Button variant="contained" onClick={handleClose} sx={{ mt: 3, borderRadius: 0 }}>Cerrar</Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ReceiptIcon sx={{ color: '#F59E0B' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Acta de Recepción / Devolución de Equipo
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        ID Asignación: <strong>{asignacion?.id}</strong> | Fecha: <strong>{new Date().toLocaleDateString('es-CL')}</strong>
                    </Typography>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        {/* Información del Producto */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <InventoryIcon fontSize="small" color="primary" />
                                Información del Equipo
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Producto:</Typography>
                                    <Typography variant="body2">{producto?.nombre}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">N° Serie:</Typography>
                                    <Typography variant="body2" fontFamily="monospace">{producto?.numero_serie || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Marca:</Typography>
                                    <Typography variant="body2">{producto?.marca || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Modelo:</Typography>
                                    <Typography variant="body2">{producto?.modelo || '-'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Información del Colaborador */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <PersonIcon fontSize="small" color="success" />
                                Información del Colaborador
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Nombre:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_nombre}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">RUT:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_rut || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Cargo:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_cargo || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Departamento:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_departamento || '-'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Divider sx={{ my: 1 }} />

                        {/* PUNTO 4 - MOTIVO DE LA DEVOLUCIÓN */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <WarningIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                                4. MOTIVO DE LA DEVOLUCIÓN *
                            </Typography>
                            <TextField
                                fullWidth
                                value={motivoDevolucion}
                                onChange={(e) => setMotivoDevolucion(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Ej: Término de contrato, Cambio de equipo, Equipo defectuoso, Mantención preventiva, Actualización tecnológica, etc."
                                helperText="Campo obligatorio. Explique detalladamente la razón de la devolución."
                                error={!!error && !motivoDevolucion}
                                sx={{ mt: 1 }}
                            />
                        </Box>

                        {/* PUNTO 5 - OBSERVACIONES */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <DescriptionIcon fontSize="small" sx={{ color: '#3B82F6' }} />
                                5. OBSERVACIONES
                            </Typography>
                            <TextField
                                fullWidth
                                value={observacionesDevolucion}
                                onChange={(e) => setObservacionesDevolucion(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Describa cualquier detalle adicional sobre la condición del equipo, accesorios entregados, daños existentes, piezas faltantes, etc."
                                helperText="Campo opcional. Incluya información relevante sobre el estado del equipo."
                            />
                        </Box>

                        {/* Condición de Entrega */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Condición de Entrega *
                            </Typography>
                            <RadioGroup row value={condicionEntrega} onChange={(e) => setCondicionEntrega(e.target.value)}>
                                <FormControlLabel value="BUENO" control={<Radio />} label="✅ Bueno - Funciona correctamente" />
                                <FormControlLabel value="REGULAR" control={<Radio />} label="⚠️ Regular - Con detalles menores" />
                                <FormControlLabel value="MALO" control={<Radio />} label="❌ Malo - No funciona/Requiere reparación" />
                            </RadioGroup>
                        </Box>

                        <Divider />

                        {/* Firmas */}
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Firmas de Conformidad
                        </Typography>

                        {/* Firma del Trabajador */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                                Firma del Trabajador / Colaborador *
                            </Typography>
                            <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <RadioGroup
                                    row
                                    value={tipoFirmaTrabajador}
                                    onChange={(e) => setTipoFirmaTrabajador(e.target.value)}
                                >
                                    <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                    <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                                </RadioGroup>
                            </FormControl>
                            
                            {tipoFirmaTrabajador === 'texto' ? (
                                <FirmaTexto
                                    onFirmaCapturada={setFirmaTrabajadorText}
                                    valorInicial={firmaTrabajadorText}
                                    required={true}
                                    label="Firma del Trabajador"
                                />
                            ) : (
                                <FirmaDibujada
                                    onFirmaGuardada={setFirmaTrabajadorDibujo}
                                    valorInicial={firmaTrabajadorDibujo}
                                    width={450}
                                    height={150}
                                    label="Dibuje su firma aquí"
                                />
                            )}
                        </Box>

                        {/* Firma del Gerente */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                                Firma del Gerente General / Autorizante *
                            </Typography>
                            <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <RadioGroup
                                    row
                                    value={tipoFirmaGerente}
                                    onChange={(e) => setTipoFirmaGerente(e.target.value)}
                                >
                                    <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                    <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                                </RadioGroup>
                            </FormControl>
                            
                            {tipoFirmaGerente === 'texto' ? (
                                <FirmaTexto
                                    onFirmaCapturada={setFirmaGerenteText}
                                    valorInicial={firmaGerenteText}
                                    required={true}
                                    label="Firma del Gerente"
                                />
                            ) : (
                                <FirmaDibujada
                                    onFirmaGuardada={setFirmaGerenteDibujo}
                                    valorInicial={firmaGerenteDibujo}
                                    width={450}
                                    height={150}
                                    label="Dibuje su firma aquí"
                                />
                            )}
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 1 }}>
                                {error}
                            </Alert>
                        )}
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 0 }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading || !motivoDevolucion.trim() || !getFirmaTrabajadorFinal() || !getFirmaGerenteFinal()}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                                sx={{ borderRadius: 0, bgcolor: '#F59E0B', '&:hover': { bgcolor: '#d97706' } }}
                            >
                                {loading ? 'Procesando...' : 'Confirmar Recepción'}
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>

            <ConfirmacionDialog />
        </>
    );
};

export default RecepcionDialog;