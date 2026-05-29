// src/components/RecepcionDialog.jsx - VERSIÓN CORREGIDA (con generación de acta de recepción)
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
import { asignacionService } from '../services/asignacionService';

// URL BASE
const API_BASE_URL = 'https://sistema-inventario-backend-p3xg.onrender.com';
console.log('🔧 RecepcionDialog - API_BASE_URL:', API_BASE_URL);

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
    const [recepcionId, setRecepcionId] = useState(null);

    // Detectar si es préstamo
    const esPrestamo = asignacion?.es_prestamo === true || asignacion?.es_prestamo === 1;

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

    // Función para generar y descargar el acta de recepción
    const generarYDescargarActaRecepcion = async (idAsignacion) => {
        try {
            console.log('📄 Generando acta de recepción para asignación ID:', idAsignacion);
            
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/asignaciones/generar-acta-recepcion`;
            
            const actaData = {
                id_asignacion: idAsignacion,
                colaborador: {
                    nombre: asignacion?.colaborador_nombre || '',
                    rut: asignacion?.colaborador_rut || '',
                    email: asignacion?.colaborador_email || '',
                    cargo: asignacion?.colaborador_cargo || '',
                    departamento: asignacion?.colaborador_departamento || '',
                    direccion: asignacion?.colaborador_direccion || 'Lota Nº2305, comuna de Providencia'
                },
                productos: [{
                    tipo: 'Equipo',
                    nombre: producto?.nombre || '',
                    marca: producto?.marca || 'N/A',
                    modelo: producto?.modelo || 'N/A',
                    numero_serie: producto?.numero_serie || 'N/A',
                    cantidad: 1
                }],
                fecha_recepcion: new Date().toISOString(),
                motivo: motivoDevolucion || 'Devolución de equipo',
                observaciones: observacionesDevolucion || 'Sin observaciones',
                condicion_entrega: condicionEntrega,
                firma_trabajador: getFirmaTrabajadorFinal(),
                firma_gerente: getFirmaGerenteFinal(),
                es_prestamo: false
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(actaData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success && result.filename) {
                // Descargar el PDF automáticamente
                const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${result.filename}`;
                const downloadResponse = await fetch(downloadUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob();
                    const downloadUrlBlob = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrlBlob;
                    link.download = result.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrlBlob);
                    console.log('✅ Acta de recepción generada y descargada correctamente');
                    return result.filename;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error generando acta de recepción:', error);
            return null;
        }
    };

    // Función para descargar el acta de recepción manualmente
    const handleDescargarDocumento = async () => {
        if (!asignacion?.id || downloading) return;
        
        setDownloading(true);
        try {
            console.log('📥 Descargando acta de recepción para asignación:', asignacion.id);
            
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/asignaciones/descargar-acta-recepcion/${asignacion.id}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `acta_recepcion_${asignacion.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            console.log('✅ Acta de recepción descargada correctamente');
        } catch (error) {
            console.error('❌ Error descargando acta:', error);
            alert('Error al descargar el acta de recepción. Por favor, intente nuevamente.');
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    const handleSubmit = async () => {
        // Para préstamos, las firmas son opcionales
        if (!esPrestamo) {
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
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                fecha_devolucion: new Date().toISOString(),
                motivo_devolucion: motivoDevolucion || (esPrestamo ? 'Devolución de préstamo' : ''),
                observaciones_devolucion: observacionesDevolucion,
                condicion_entrega: condicionEntrega,
                firma_trabajador_devolucion: esPrestamo ? null : getFirmaTrabajadorFinal(),
                firma_gerente_devolucion: esPrestamo ? null : getFirmaGerenteFinal()
            };

            console.log('📤 Enviando devolución:', payload);

            const response = await api.put(`/asignaciones/${asignacion.id}/finalizar`, payload);

            console.log('📥 Respuesta del servidor:', response.data);

            if (response.data.success) {
                let filenameGenerado = null;
                
                // SI NO ES PRÉSTAMO, generar y descargar el acta de recepción automáticamente
                if (!esPrestamo && asignacion.id) {
                    filenameGenerado = await generarYDescargarActaRecepcion(asignacion.id);
                    if (filenameGenerado) {
                        setDocumentoGenerado({ filename: filenameGenerado });
                    }
                }
                
                setShowConfirmDialog(true);
                setSuccess(true);
                
                if (onSuccess) {
                    const mensaje = esPrestamo 
                        ? 'Devolución de préstamo registrada exitosamente (sin documento)'
                        : filenameGenerado 
                            ? 'Devolución registrada exitosamente. El acta de recepción se ha generado y descargado.'
                            : 'Devolución registrada exitosamente.';
                    
                    onSuccess({
                        success: true,
                        message: mensaje,
                        documento: !esPrestamo ? { filename: filenameGenerado || `acta_recepcion_${asignacion.id}.pdf` } : null,
                        es_prestamo: esPrestamo
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
        setRecepcionId(null);
        onClose();
    };

    // Ventana de confirmación para PRÉSTAMOS
    const ConfirmacionPrestamoDialog = () => (
        <Dialog open={showConfirmDialog && esPrestamo} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#F59E0B', color: 'white', textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ¡Devolución de Préstamo Exitosa!
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                    La devolución del <strong>PRÉSTAMO</strong> se ha registrado correctamente en el sistema.
                </Typography>
                
                <Alert severity="info" sx={{ mt: 2, borderRadius: 0 }}>
                    <Typography variant="body2">
                        <strong>ℹ️ Nota:</strong> Este es un préstamo, por lo tanto no se ha generado un documento formal de recepción.
                    </Typography>
                </Alert>
                
                <Paper variant="outlined" sx={{ p: 2, mt: 2, textAlign: 'left', bgcolor: '#f9f9f9' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        <DescriptionIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Resumen de la Devolución:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Motivo:</strong> {motivoDevolucion || 'Devolución de préstamo'}
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
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Producto: <strong>{producto?.nombre}</strong><br />
                    Colaborador: <strong>{asignacion?.colaborador_nombre}</strong>
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        variant="contained" 
                        onClick={() => {
                            setShowConfirmDialog(false);
                            handleClose();
                        }}
                        sx={{ borderRadius: 0, bgcolor: '#F59E0B' }}
                    >
                        Cerrar
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );

    // Ventana de confirmación para ASIGNACIONES
    const ConfirmacionAsignacionDialog = () => (
        <Dialog open={showConfirmDialog && !esPrestamo} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ¡Devolución Exitosa!
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                    La devolución se ha registrado correctamente y el <strong>Acta de Recepción</strong> se ha generado y descargado automáticamente.
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
                        acta_recepcion_{asignacion?.id}.pdf
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

    if (!producto || !asignacion) return null;

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <ReceiptIcon sx={{ color: esPrestamo ? '#F59E0B' : '#0A66C2' }} />
                            <Typography variant="h6" fontWeight={600}>
                                {esPrestamo ? 'Devolución de Préstamo' : 'Acta de Recepción / Devolución de Equipo'}
                            </Typography>
                            {esPrestamo && (
                                <Chip 
                                    label="PRÉSTAMO - SIN DOCUMENTO" 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: '#F59E0B', 
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: '0.7rem'
                                    }} 
                                />
                            )}
                        </Box>
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

                        {/* MOTIVO DE LA DEVOLUCIÓN */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <WarningIcon fontSize="small" sx={{ color: '#F59E0B' }} />
                                MOTIVO DE LA DEVOLUCIÓN {!esPrestamo && '*'}
                            </Typography>
                            <TextField
                                fullWidth
                                value={motivoDevolucion}
                                onChange={(e) => setMotivoDevolucion(e.target.value)}
                                multiline
                                rows={3}
                                placeholder={esPrestamo 
                                    ? "Ej: Término del préstamo, Devolución anticipada, etc."
                                    : "Ej: Término de contrato, Cambio de equipo, Equipo defectuoso, Mantención preventiva, etc."
                                }
                                helperText={esPrestamo ? "Campo opcional para préstamos" : "Campo obligatorio. Explique detalladamente la razón de la devolución."}
                                error={!!error && !esPrestamo && !motivoDevolucion}
                                sx={{ mt: 1 }}
                            />
                        </Box>

                        {/* OBSERVACIONES */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <DescriptionIcon fontSize="small" sx={{ color: '#3B82F6' }} />
                                OBSERVACIONES
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

                        {/* Firmas - Solo para asignaciones normales */}
                        {!esPrestamo && (
                            <>
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
                            </>
                        )}

                        {esPrestamo && (
                            <Alert severity="info" sx={{ borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>⚠️ Préstamo:</strong> No se requieren firmas para la devolución de un préstamo. 
                                    Solo se registrará la devolución en el sistema sin generar documento formal.
                                </Typography>
                            </Alert>
                        )}

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
                                disabled={loading || (!esPrestamo && (!motivoDevolucion.trim() || !getFirmaTrabajadorFinal() || !getFirmaGerenteFinal()))}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                                sx={{ borderRadius: 0, bgcolor: esPrestamo ? '#F59E0B' : '#0A66C2', '&:hover': { bgcolor: esPrestamo ? '#d97706' : '#0050a0' } }}
                            >
                                {loading ? 'Procesando...' : (esPrestamo ? 'Registrar Devolución' : 'Confirmar Devolución')}
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>

            <ConfirmacionPrestamoDialog />
            <ConfirmacionAsignacionDialog />
        </>
    );
};

export default RecepcionDialog;