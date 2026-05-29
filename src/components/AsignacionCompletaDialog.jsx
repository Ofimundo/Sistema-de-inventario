// src/components/AsignacionCompletaDialog.jsx - VERSIÓN COMPLETA (NO ELIMINA NADA)
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Paper,
    Avatar,
    Stack,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
    Chip,
    Grid
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Person as PersonIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Check as CheckIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Clear as ClearIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import colaboradorService from '../services/colaboradorService';
import api from '../services/api';

// URL BASE
const API_BASE_URL = 'https://sistema-inventario-backend-p3xg.onrender.com';

// ============================================
// COMPONENTE DE FIRMA DIBUJADA
// ============================================
const FirmaDibujada = ({ onFirmaGuardada, valorInicial = '', width = 450, height = 150, label = 'Firma' }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (valorInicial && valorInicial !== '' && valorInicial.startsWith('data:image')) {
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
            e.preventDefault();
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
        <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1, bgcolor: '#fafafa' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    border: `2px solid #000`,
                    backgroundColor: 'white',
                    cursor: 'crosshair',
                    width: '100%',
                    height: 'auto',
                    touchAction: 'none'
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
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Dibuje su firma en el recuadro (soporta mouse y pantalla táctil)
            </Typography>
        </Box>
    );
};

// ============================================
// COMPONENTE DE FIRMA POR TEXTO
// ============================================
const FirmaTexto = ({ label, onFirmaCapturada, valorInicial = '', required = true }) => {
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
        <Box sx={{ border: `1px solid #ddd`, p: 2, mb: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
            
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const AsignacionCompletaDialog = ({ open, onClose, productoSeleccionado, onSuccess, esPrestamo = false }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [success, setSuccess] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [asignacionId, setAsignacionId] = useState(null);
    const [documentoGenerado, setDocumentoGenerado] = useState(null);

    useEffect(() => {
        if (open && productoSeleccionado) {
            cargarColaboradores();
            setColaboradorSeleccionado(null);
            setMotivo(esPrestamo ? 'PRÉSTAMO TEMPORAL DE EQUIPO' : '');
            setObservaciones(esPrestamo ? `Préstamo registrado el ${new Date().toLocaleDateString()}` : '');
            setFirmaTrabajadorText('');
            setFirmaGerenteText('');
            setFirmaTrabajadorDibujo('');
            setFirmaGerenteDibujo('');
            setError('');
            setSearchTerm('');
            setSuccess(false);
            setShowConfirmDialog(false);
            setAsignacionId(null);
            setDocumentoGenerado(null);
            setTipoFirmaTrabajador('texto');
            setTipoFirmaGerente('texto');
        }
    }, [open, productoSeleccionado, esPrestamo]);

    const cargarColaboradores = async () => {
        try {
            const response = await colaboradorService.getColaboradores({ estado: 'ACTIVO' });
            setColaboradores(response || []);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            setError('Error al cargar la lista de colaboradores');
        }
    };

    const colaboradoresFiltrados = colaboradores.filter(col => 
        col.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // Función para generar y descargar el acta de asignación
    const generarYDescargarActa = async (idAsignacion) => {
        try {
            console.log('📄 Generando acta para asignación ID:', idAsignacion);
            
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/asignaciones/generar-acta-asignacion`;
            
            const actaData = {
                id_asignacion: idAsignacion,
                colaborador: {
                    nombre: colaboradorSeleccionado.nombre,
                    rut: colaboradorSeleccionado.rut,
                    email: colaboradorSeleccionado.email || '',
                    cargo: colaboradorSeleccionado.cargo || '',
                    departamento: colaboradorSeleccionado.departamento || '',
                    direccion: colaboradorSeleccionado.direccion || 'Lota Nº2305, comuna de Providencia',
                    fecha_nacimiento: colaboradorSeleccionado.fecha_nacimiento || '1990-01-01',
                    nacionalidad: 'chilena'
                },
                productos: [{
                    tipo: 'Equipo',
                    nombre: productoSeleccionado.nombre,
                    marca: productoSeleccionado.marca || 'N/A',
                    modelo: productoSeleccionado.modelo || 'N/A',
                    numero_serie: productoSeleccionado.numero_serie || 'N/A',
                    condicion: productoSeleccionado.condicion || 'NUEVO',
                    cantidad: 1
                }],
                fecha_asignacion: new Date().toISOString(),
                motivo: motivo,
                observaciones: observaciones || 'Sin observaciones',
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
                // Descargar el PDF
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
                    console.log('✅ Acta generada y descargada correctamente');
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error generando acta:', error);
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!colaboradorSeleccionado) {
            setError('Debe seleccionar un colaborador');
            return;
        }
        if (!motivo.trim()) {
            setError('Debe ingresar un motivo');
            return;
        }
        
        if (!esPrestamo) {
            const firmaTrabajador = getFirmaTrabajadorFinal();
            const firmaGerente = getFirmaGerenteFinal();

            if (!firmaTrabajador) {
                setError('La firma del trabajador es requerida');
                return;
            }
            if (!firmaGerente) {
                setError('La firma del gerente general es requerida');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const userStr = localStorage.getItem('user');
            let usuarioResponsable = 'Sistema';
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    usuarioResponsable = user.nombre || user.usuario || 'Sistema';
                } catch (e) {
                    usuarioResponsable = userStr;
                }
            }
            
            // Crear la asignación
            const asignacionResponse = await api.post('/asignaciones', {
                producto_id: productoSeleccionado.id,
                colaborador_id: colaboradorSeleccionado.id,
                motivo: motivo,
                observaciones: observaciones,
                fecha_asignacion: new Date().toISOString(),
                usuario_responsable: usuarioResponsable,
                firma_trabajador: esPrestamo ? null : getFirmaTrabajadorFinal(),
                firma_gerente: esPrestamo ? null : getFirmaGerenteFinal(),
                es_prestamo: esPrestamo || false
            });

            console.log('📥 Respuesta de asignación:', asignacionResponse.data);

            if (asignacionResponse.data?.success || asignacionResponse.data?.id) {
                const newAsignacionId = asignacionResponse.data?.data?.id || asignacionResponse.data?.id;
                setAsignacionId(newAsignacionId);
                
                // SI NO ES PRÉSTAMO, generar y descargar el acta automáticamente
                let documentoGeneradoOk = false;
                if (!esPrestamo && newAsignacionId) {
                    documentoGeneradoOk = await generarYDescargarActa(newAsignacionId);
                }
                
                setShowConfirmDialog(true);
                setSuccess(true);
                
                if (onSuccess) {
                    const mensaje = esPrestamo 
                        ? `✅ Préstamo registrado exitosamente para ${productoSeleccionado.nombre}`
                        : documentoGeneradoOk 
                            ? `✅ Asignación completada exitosamente para ${productoSeleccionado.nombre}. El acta se ha descargado.`
                            : `✅ Asignación completada exitosamente para ${productoSeleccionado.nombre}.`;
                    
                    onSuccess({
                        success: true,
                        message: mensaje,
                        asignacion_id: newAsignacionId,
                        es_prestamo: esPrestamo,
                        documento_generado: documentoGeneradoOk
                    });
                }
            } else {
                throw new Error(asignacionResponse.data?.message || 'Error al crear la asignación');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la transacción');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setColaboradorSeleccionado(null);
        setMotivo('');
        setObservaciones('');
        setFirmaTrabajadorText('');
        setFirmaGerenteText('');
        setFirmaTrabajadorDibujo('');
        setFirmaGerenteDibujo('');
        setError('');
        setSearchTerm('');
        setSuccess(false);
        setShowConfirmDialog(false);
        setAsignacionId(null);
        setDocumentoGenerado(null);
        onClose();
    };

    const handleDescargarActa = async () => {
        if (!asignacionId || downloading) return;
        
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/asignaciones/descargar-acta/${asignacionId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `acta_asignacion_${asignacionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            console.log('✅ Acta descargada');
        } catch (error) {
            console.error('Error descargando acta:', error);
            alert('Error al descargar el acta');
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    const ConfirmacionDialog = () => (
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: esPrestamo ? '#F59E0B' : '#4caf50', color: 'white', textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {esPrestamo ? '¡Préstamo Registrado!' : '¡Asignación Exitosa!'}
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                    {esPrestamo 
                        ? 'El préstamo se ha registrado correctamente en el sistema.'
                        : 'El acta de Asignación se ha generado correctamente.'
                    }
                </Typography>
                
                {!esPrestamo && (
                    <>
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
                                acta_asignacion_{asignacionId}.pdf
                            </Typography>
                        </Box>
                        
                        <Button 
                            variant="contained" 
                            startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                            onClick={handleDescargarActa}
                            disabled={downloading}
                            sx={{ mt: 2, borderRadius: 0, bgcolor: '#0A66C2' }}
                        >
                            {downloading ? 'Descargando...' : 'Descargar Acta'}
                        </Button>
                    </>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {esPrestamo 
                        ? `Producto: ${productoSeleccionado?.nombre} | Colaborador: ${colaboradorSeleccionado?.nombre}`
                        : `Se ha asignado el producto ${productoSeleccionado?.nombre} a ${colaboradorSeleccionado?.nombre}`
                    }
                </Typography>
                
                {esPrestamo && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 0 }}>
                        <Typography variant="body2">
                            <strong>ℹ️ Nota:</strong> Este es un préstamo temporal y no genera documento formal.
                        </Typography>
                    </Alert>
                )}
                
                <Button 
                    variant="outlined" 
                    onClick={() => {
                        setShowConfirmDialog(false);
                        handleClose();
                    }}
                    sx={{ mt: 3, borderRadius: 0 }}
                >
                    Cerrar
                </Button>
            </DialogContent>
        </Dialog>
    );

    if (!productoSeleccionado) return null;

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            {esPrestamo ? (
                                <PersonIcon sx={{ color: '#F59E0B' }} />
                            ) : (
                                <AssignmentIcon sx={{ color: '#0A66C2' }} />
                            )}
                            <Typography variant="h6">
                                {esPrestamo ? 'Registrar Préstamo de Producto' : 'Asignar Producto con Firma Digital'}
                            </Typography>
                            {esPrestamo && (
                                <Chip 
                                    label="SIN DOCUMENTO" 
                                    size="small" 
                                    sx={{ bgcolor: '#F59E0B', color: 'white', fontWeight: 500 }} 
                                />
                            )}
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Producto: <strong>{productoSeleccionado.nombre}</strong> | N° Serie: <strong>{productoSeleccionado.numero_serie || 'N/A'}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Estado actual: <strong style={{ color: productoSeleccionado.id_estado_equipo === 1 ? '#10B981' : '#F59E0B' }}>
                            {productoSeleccionado.id_estado_equipo === 1 ? 'DISPONIBLE' : productoSeleccionado.id_estado_equipo === 2 ? 'ASIGNADO' : 'NO DISPONIBLE'}
                        </strong>
                    </Typography>
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={3}>
                        {/* Selección de Colaborador */}
                        <TextField
                            fullWidth
                            placeholder="Buscar colaborador por nombre, RUT, email o cargo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        
                        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd' }}>
                            {colaboradoresFiltrados.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        {searchTerm ? 'No se encontraron colaboradores' : 'No hay colaboradores activos'}
                                    </Typography>
                                </Box>
                            ) : (
                                colaboradoresFiltrados.map((col) => (
                                    <Box
                                        key={col.id}
                                        sx={{
                                            p: 2,
                                            borderBottom: `1px solid #ddd`,
                                            cursor: 'pointer',
                                            backgroundColor: colaboradorSeleccionado?.id === col.id ? '#e3f2fd' : 'transparent',
                                            '&:hover': { backgroundColor: '#f5f5f5' }
                                        }}
                                        onClick={() => setColaboradorSeleccionado(col)}
                                    >
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: esPrestamo ? '#F59E0B' : '#0A66C2', color: 'white' }}>
                                                {col.nombre?.charAt(0) || '?'}
                                            </Avatar>
                                            <Box flex={1}>
                                                <Typography variant="subtitle2" fontWeight={500}>{col.nombre}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {col.cargo || 'Sin cargo'} • {col.departamento || 'Sin departamento'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {col.email} {col.rut && `• RUT: ${col.rut}`}
                                                </Typography>
                                            </Box>
                                            {colaboradorSeleccionado?.id === col.id && <CheckCircleIcon sx={{ color: '#4caf50' }} />}
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Paper>

                        {/* Motivo y Observaciones */}
                        <TextField
                            fullWidth
                            label={esPrestamo ? "Motivo del préstamo *" : "Motivo de asignación *"}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            multiline
                            rows={2}
                            placeholder={esPrestamo 
                                ? "Ej: Préstamo para capacitación, Uso temporal para evento, etc."
                                : "Ej: Proyecto específico, Reemplazo de equipo, Uso temporal, etc."
                            }
                            required
                        />
                        
                        <TextField
                            fullWidth
                            label="Observaciones adicionales"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            multiline
                            rows={2}
                        />

                        {/* Firmas - Solo para asignaciones normales */}
                        {!esPrestamo && (
                            <>
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
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
                                            label="Firma del Trabajador (Texto)"
                                            onFirmaCapturada={setFirmaTrabajadorText}
                                            valorInicial={firmaTrabajadorText}
                                            required={true}
                                        />
                                    ) : (
                                        <FirmaDibujada
                                            label="Firma del Trabajador (Dibujada)"
                                            onFirmaGuardada={setFirmaTrabajadorDibujo}
                                            valorInicial={firmaTrabajadorDibujo}
                                            width={450}
                                            height={150}
                                        />
                                    )}
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
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
                                            label="Firma del Gerente (Texto)"
                                            onFirmaCapturada={setFirmaGerenteText}
                                            valorInicial={firmaGerenteText}
                                            required={true}
                                        />
                                    ) : (
                                        <FirmaDibujada
                                            label="Firma del Gerente (Dibujada)"
                                            onFirmaGuardada={setFirmaGerenteDibujo}
                                            valorInicial={firmaGerenteDibujo}
                                            width={450}
                                            height={150}
                                        />
                                    )}
                                </Box>
                            </>
                        )}

                        {esPrestamo && (
                            <Alert severity="info" sx={{ borderRadius: 0 }}>
                                <Typography variant="body2">
                                    <strong>ℹ️ Préstamo sin documento:</strong> Este préstamo no generará un documento formal.
                                </Typography>
                            </Alert>
                        )}

                        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleClose} sx={{ borderRadius: 0 }}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading || !colaboradorSeleccionado || !motivo}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                                sx={{ borderRadius: 0, bgcolor: esPrestamo ? '#F59E0B' : '#0A66C2' }}
                            >
                                {loading ? 'Procesando...' : (esPrestamo ? 'Registrar Préstamo' : 'Confirmar Asignación')}
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>

            <ConfirmacionDialog />
        </>
    );
};

export default AsignacionCompletaDialog;