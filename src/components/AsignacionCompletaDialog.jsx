// src/components/AsignacionCompletaDialog.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
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
    Radio
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
} from '@mui/icons-material';
import colaboradorService from '../services/colaboradorService';
import api from '../services/api';

// ============================================
// 🔥 URL BASE DINÁMICA
// ============================================
const getApiBaseUrl = () => {
    // Para Vite
    if (import.meta.env && import.meta.env.VITE_API_URL) {
        let url = import.meta.env.VITE_API_URL;
        // Eliminar /api del final si existe
        if (url.endsWith('/api')) {
            url = url.slice(0, -4);
        }
        console.log('📍 API Base URL (desde VITE):', url);
        return url;
    }
    // Para Create React App
    if (process.env && process.env.REACT_APP_API_URL) {
        let url = process.env.REACT_APP_API_URL;
        if (url.endsWith('/api')) {
            url = url.slice(0, -4);
        }
        console.log('📍 API Base URL (desde CRA):', url);
        return url;
    }
    // Fallback para desarrollo local
    console.log('📍 API Base URL (fallback local):', 'http://localhost:98');
    return 'http://localhost:98';
};

const API_BASE_URL = getApiBaseUrl();

// Componente de Firma Dibujada (Canvas)
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

// Componente de Firma por Texto
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

const AsignacionCompletaDialog = ({ open, onClose, productoSeleccionado, onSuccess }) => {
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
    const [documentoGenerado, setDocumentoGenerado] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (open && productoSeleccionado) {
            cargarColaboradores();
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
            setDocumentoGenerado(null);
            setTipoFirmaTrabajador('texto');
            setTipoFirmaGerente('texto');
        }
    }, [open, productoSeleccionado]);

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

    // ✅ FUNCIÓN CORREGIDA PARA DESCARGAR DOCUMENTO
    const handleDescargarDocumento = async () => {
        if (!documentoGenerado || !documentoGenerado.filename || downloading) return;
        
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            // Usar la URL base de api (ya tiene /api incluido)
            const downloadUrl = `${api.defaults.baseURL}/asignaciones/descargar/${documentoGenerado.filename}`;
            console.log('📥 Descargando documento desde:', downloadUrl);
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = documentoGenerado.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Documento descargado:', documentoGenerado.filename);
        } catch (error) {
            console.error('❌ Error descargando documento:', error);
            alert('Error al descargar el documento. Por favor, intente nuevamente.');
        } finally {
            setTimeout(() => setDownloading(false), 1000);
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
            
            const asignacionResponse = await api.post('/asignaciones', {
                producto_id: productoSeleccionado.id,
                colaborador_id: colaboradorSeleccionado.id,
                motivo: motivo,
                observaciones: observaciones,
                fecha_asignacion: new Date().toISOString().split('T')[0],
                usuario_responsable: usuarioResponsable,
                firma_trabajador: firmaTrabajador,
                firma_gerente: firmaGerente
            });

            if (asignacionResponse.data?.success) {
                // Generar acta PDF después de la asignación
                const actaData = {
                    id_asignacion: asignacionResponse.data.data?.id,
                    colaborador: {
                        nombre: colaboradorSeleccionado.nombre,
                        rut: colaboradorSeleccionado.rut,
                        email: colaboradorSeleccionado.email,
                        cargo: colaboradorSeleccionado.cargo,
                        departamento: colaboradorSeleccionado.departamento,
                        nacionalidad: 'chilena',
                        fecha_nacimiento: colaboradorSeleccionado.fecha_nacimiento || '1990-01-01',
                        domicilio: colaboradorSeleccionado.domicilio || colaboradorSeleccionado.direccion || '',
                        comuna: colaboradorSeleccionado.comuna || '',
                        ciudad: colaboradorSeleccionado.ciudad || ''
                    },
                    productos: [{
                        tipo: 'Equipo',
                        nombre: productoSeleccionado.nombre,
                        marca: productoSeleccionado.marca,
                        modelo: productoSeleccionado.modelo,
                        numero_serie: productoSeleccionado.numero_serie,
                        condicion: productoSeleccionado.condicion || 'NUEVO'
                    }],
                    fecha_asignacion: new Date(),
                    motivo: motivo,
                    observaciones: observaciones,
                    firma_trabajador: getFirmaTrabajadorFinal(),
                    firma_gerente: getFirmaGerenteFinal(),
                    usuario_responsable: usuarioResponsable
                };

                const actaResponse = await api.post('/asignaciones/generar-acta-asignacion', actaData);
                
                if (actaResponse.data?.success) {
                    setDocumentoGenerado(actaResponse.data);
                }
                
                setShowConfirmDialog(true);
                setSuccess(true);
                
                if (onSuccess) {
                    onSuccess({
                        success: true,
                        message: `✅ Asignación completada exitosamente para ${productoSeleccionado.nombre}`,
                        documento: actaResponse.data
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
        setDocumentoGenerado(null);
        onClose();
    };

    // Ventana de confirmación con documento
    const ConfirmacionDialog = () => (
        <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 50, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ¡Asignación Exitosa!
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" gutterBottom>
                    El acta de <strong>Asignación</strong> se ha generado correctamente.
                </Typography>
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
                        {documentoGenerado?.filename || 'acta_asignacion.pdf'}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Se ha asignado el producto <strong>{productoSeleccionado?.nombre}</strong> a <strong>{colaboradorSeleccionado?.nombre}</strong>
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
                        <Typography variant="h6">¡Asignación Exitosa!</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Box textAlign="center" py={2}>
                        <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>Asignación completada exitosamente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Se ha asignado el producto <strong>{productoSeleccionado?.nombre}</strong> a <strong>{colaboradorSeleccionado?.nombre}</strong>
                        </Typography>
                        <Button variant="contained" onClick={handleClose} sx={{ mt: 3, borderRadius: 0 }}>Cerrar</Button>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    if (!productoSeleccionado) return null;

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <AssignmentIcon sx={{ color: '#0A66C2' }} />
                        <Typography variant="h6">Asignar Producto con Firma Digital</Typography>
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
                                            <Avatar sx={{ bgcolor: '#0A66C2', color: 'white' }}>
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
                            label="Motivo de asignación *"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Ej: Proyecto específico, Reemplazo de equipo, Uso temporal, etc."
                            required
                        />
                        
                        <TextField
                            fullWidth
                            label="Observaciones adicionales"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Observaciones importantes sobre la transacción..."
                        />

                        {/* Firma del Trabajador */}
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

                        {/* Firma del Gerente */}
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

                        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleClose} sx={{ borderRadius: 0 }}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading || !colaboradorSeleccionado || !motivo}
                                startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                                sx={{ borderRadius: 0, bgcolor: '#0A66C2' }}
                            >
                                {loading ? 'Procesando...' : 'Confirmar Asignación'}
                            </Button>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Ventana de confirmación con documento */}
            <ConfirmacionDialog />
        </>
    );
};

export default AsignacionCompletaDialog;