// src/components/ProductoForm.jsx - VERSIÓN SIN CANTIDAD
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
    Stack,
    alpha,
    Avatar,
    Chip,
    FormHelperText,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    RadioGroup,
    Radio,
    FormControlLabel,
    FormLabel
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Inventory as InventoryIcon,
    Store as StoreIcon,
    Person as PersonIcon,
    AssignmentInd as AssignmentIndIcon,
    History as HistoryIcon,
    Description as DescriptionIcon,
    Upload as UploadIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    ExpandMore as ExpandMoreIcon,
    Build as BuildIcon,
    Handyman as HandymanIcon,
    DeleteForever as DeleteForeverIcon,
    VolunteerActivism as VolunteerActivismIcon,
    QrCode as QrCodeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { productosService } from '../services/productos';
import colaboradorService from '../services/colaboradorService';

const colors = {
    primary: '#0A66C2',
    secondary: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB'
};

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    backgroundColor: alpha(colors.primary, 0.02)
}));

function ProductoForm({ open, onClose, producto, onSave }) {
    // Estado principal del formulario (SIN CANTIDAD)
    const [formData, setFormData] = useState({
        nombre: '',
        precio: '',
        oc_numero: '',
        factura_numero: '',
        descripcion: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        condicion: 'NUEVO',
        bodega_id: '',
        estado: 'DISPONIBLE'
    });

    const [errores, setErrores] = useState({});
    const [loading, setLoading] = useState(false);
    const [bodegas, setBodegas] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState('');
    const [motivoAsignacion, setMotivoAsignacion] = useState('');
    const [observacionesAsignacion, setObservacionesAsignacion] = useState('');
    const [documentoAsignacion, setDocumentoAsignacion] = useState(null);
    const [documentoNombre, setDocumentoNombre] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [historialUso, setHistorialUso] = useState([]);
    const [showHistorial, setShowHistorial] = useState(false);
    const [colaboradorInfo, setColaboradorInfo] = useState(null);

    // Estados para mantención/reparación
    const [mostrarMantencion, setMostrarMantencion] = useState(false);
    const [accionMantencion, setAccionMantencion] = useState('ninguna');
    const [tipoMantencion, setTipoMantencion] = useState('RUTINA');
    const [fechaInicioMantencion, setFechaInicioMantencion] = useState(new Date().toISOString().split('T')[0]);
    const [responsableMantencion, setResponsableMantencion] = useState('');
    const [descripcionMantencion, setDescripcionMantencion] = useState('');
    const [costoMantencion, setCostoMantencion] = useState('');
    const [fechaTerminoMantencion, setFechaTerminoMantencion] = useState(new Date().toISOString().split('T')[0]);
    const [observacionesMantencion, setObservacionesMantencion] = useState('');

    const opcionesEstado = [
        'DISPONIBLE',
        'ASIGNADO',
        'EN MANTENCIÓN',
        'EN REPARACIÓN',
        'NO DISPONIBLE'
    ];

    const opcionesCondicion = ['NUEVO', 'USADO', 'REACONDICIONADO'];

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Cargar bodegas
    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const data = await productosService.getBodegas();
                setBodegas(data || []);
            } catch (error) {
                console.error('Error cargando bodegas:', error);
            }
        };
        if (open) fetchBodegas();
    }, [open]);

    // Cargar colaboradores
    useEffect(() => {
        const fetchColaboradores = async () => {
            try {
                const data = await colaboradorService.getColaboradores({ estado: 'ACTIVO' });
                setColaboradores(data || []);
            } catch (error) {
                console.error('Error cargando colaboradores:', error);
            }
        };
        if (open) fetchColaboradores();
    }, [open]);

    // Actualizar información del colaborador cuando se selecciona
    useEffect(() => {
        if (colaboradorSeleccionado) {
            const colaborador = colaboradores.find(c => c.id === parseInt(colaboradorSeleccionado));
            setColaboradorInfo(colaborador || null);
        } else {
            setColaboradorInfo(null);
        }
    }, [colaboradorSeleccionado, colaboradores]);

    // Cargar datos del producto para edición (SIN CANTIDAD)
    useEffect(() => {
        if (open) {
            if (producto) {
                console.log('📦 Cargando producto para edición:', producto);
                
                setFormData({
                    nombre: producto.nombre || '',
                    precio: producto.precio || '',
                    oc_numero: producto.oc_numero || '',
                    factura_numero: producto.factura_numero || '',
                    descripcion: producto.descripcion || '',
                    marca: producto.marca || '',
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    condicion: producto.condicion || 'NUEVO',
                    bodega_id: producto.bodega_id || '',
                    estado: producto.estado || 'DISPONIBLE'
                });
                
                // Cargar historial de uso si existe
                if (producto.historial_uso && Array.isArray(producto.historial_uso)) {
                    setHistorialUso(producto.historial_uso);
                } else {
                    setHistorialUso([]);
                }
                
                // Si el producto ya tiene un colaborador asignado
                if (producto.colaborador_asignado && producto.colaborador_asignado.id) {
                    setColaboradorSeleccionado(producto.colaborador_asignado.id.toString());
                } else {
                    setColaboradorSeleccionado('');
                }
                setMotivoAsignacion('');
                setObservacionesAsignacion('');
                
                const enMantencion = producto.estado === 'EN MANTENCIÓN' || producto.estado === 'EN REPARACIÓN';
                setMostrarMantencion(enMantencion);
                setAccionMantencion(enMantencion ? 'finalizar' : 'ninguna');
                setTipoMantencion(producto.estado === 'EN REPARACIÓN' ? 'REPARACION' : 'RUTINA');
            } else {
                // Reset para nuevo producto
                setFormData({
                    nombre: '',
                    precio: '',
                    oc_numero: '',
                    factura_numero: '',
                    descripcion: '',
                    marca: '',
                    modelo: '',
                    numero_serie: '',
                    condicion: 'NUEVO',
                    bodega_id: '',
                    estado: 'DISPONIBLE'
                });
                setHistorialUso([]);
                setColaboradorSeleccionado('');
                setMotivoAsignacion('');
                setObservacionesAsignacion('');
                setMostrarMantencion(false);
                setAccionMantencion('ninguna');
            }
            setErrores({});
        }
    }, [producto, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Validación para estado ASIGNADO
        if (name === 'estado' && value === 'ASIGNADO') {
            if (!colaboradorSeleccionado) {
                setErrores({ ...errores, asignacion: 'Debe seleccionar un colaborador para asignar el producto' });
            } else {
                setErrores({ ...errores, asignacion: null });
            }
        } else if (name === 'estado' && value !== 'ASIGNADO') {
            setErrores({ ...errores, asignacion: null });
        }
        
        if (errores[name]) {
            setErrores({ ...errores, [name]: null });
        }
    };

    const handleDocumentoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                showSnackbar('Tipo de archivo no permitido. Use PDF, DOC, DOCX, JPG o PNG.', 'error');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showSnackbar('El archivo no debe superar los 10MB', 'error');
                return;
            }
            setDocumentoAsignacion(file);
            setDocumentoNombre(file.name);
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        if (!formData.nombre?.trim()) nuevosErrores.nombre = 'El nombre es requerido';
        if (!formData.numero_serie?.trim()) nuevosErrores.numero_serie = 'El número de serie es requerido (producto único)';
        if (!formData.condicion) nuevosErrores.condicion = 'Debe seleccionar una condición';
        if (!formData.bodega_id) nuevosErrores.bodega_id = 'Debe seleccionar una bodega';
        
        if (formData.estado === 'ASIGNADO') {
            if (!colaboradorSeleccionado) {
                nuevosErrores.asignacion = 'Debe seleccionar un colaborador para asignar el producto';
            }
            if (!motivoAsignacion?.trim()) {
                nuevosErrores.motivo = 'El motivo de asignación es requerido';
            }
        }
        
        // Validar mantención
        if (accionMantencion === 'iniciar') {
            if (!responsableMantencion?.trim()) {
                nuevosErrores.responsable = 'El responsable es requerido';
            }
            if (!descripcionMantencion?.trim()) {
                nuevosErrores.descripcionMantencion = 'La descripción es requerida';
            }
        }
        
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) return;
        setLoading(true);

        try {
            // Datos del producto SIN CANTIDAD
            const productoData = {
                nombre: formData.nombre.trim(),
                precio: formData.precio ? parseFloat(formData.precio) : 0,
                oc_numero: formData.oc_numero?.trim() || '',
                factura_numero: formData.factura_numero?.trim() || '',
                descripcion: formData.descripcion?.trim() || '',
                marca: formData.marca?.trim() || '',
                modelo: formData.modelo?.trim() || '',
                numero_serie: formData.numero_serie?.trim() || '',
                condicion: formData.condicion || 'NUEVO',
                bodega_id: formData.bodega_id ? parseInt(formData.bodega_id) : null,
                estado: formData.estado || 'DISPONIBLE'
            };

            console.log('📤 Enviando productoData (sin cantidad):', productoData);

            let response;
            let productoId = producto?.id;
            
            if (producto && producto.id) {
                response = await productosService.updateProducto(producto.id, productoData);
                productoId = producto.id;
            } else {
                response = await productosService.createProducto(productoData);
                if (response && response.success && response.data) {
                    productoId = response.data.id;
                }
            }

            if (!response || !response.success) {
                throw new Error(response?.message || 'Error al guardar el producto');
            }

            console.log('✅ Producto guardado con ID:', productoId);

            // Si el estado es ASIGNADO y hay colaborador seleccionado, crear la asignación
            if (formData.estado === 'ASIGNADO' && colaboradorSeleccionado && productoId) {
                try {
                    console.log('📤 Creando asignación para producto:', productoId, 'colaborador:', colaboradorSeleccionado);
                    
                    const asignacionResponse = await productosService.asignarProducto(productoId, parseInt(colaboradorSeleccionado), {
                        motivo: motivoAsignacion,
                        observaciones: observacionesAsignacion,
                        fecha_asignacion: new Date().toISOString().split('T')[0]
                    });
                    
                    if (asignacionResponse && asignacionResponse.success) {
                        showSnackbar(`Producto asignado correctamente a ${asignacionResponse.colaborador?.nombre || 'colaborador'}`, 'success');
                    } else {
                        throw new Error(asignacionResponse?.message || 'Error al crear la asignación');
                    }
                } catch (error) {
                    console.error('❌ Error al asignar:', error);
                    showSnackbar('Producto guardado pero hubo error al asignar: ' + (error.message || ''), 'warning');
                }
            }
            
            // Procesar mantención si corresponde
            if (accionMantencion !== 'ninguna' && productoId) {
                if (accionMantencion === 'iniciar') {
                    if (!responsableMantencion?.trim()) {
                        throw new Error('El responsable es requerido para iniciar mantención');
                    }
                    if (!descripcionMantencion?.trim()) {
                        throw new Error('La descripción es requerida para iniciar mantención');
                    }
                    
                    const mantencionData = {
                        producto_id: productoId,
                        tipo: tipoMantencion,
                        fecha_inicio: fechaInicioMantencion,
                        responsable: responsableMantencion,
                        descripcion: descripcionMantencion,
                        costo: parseFloat(costoMantencion) || 0
                    };
                    
                    const mantencionResponse = await productosService.iniciarMantencion(mantencionData);
                    if (mantencionResponse && mantencionResponse.success) {
                        showSnackbar('Producto guardado y mantención iniciada correctamente', 'success');
                    } else {
                        throw new Error(mantencionResponse?.message || 'Error al iniciar mantención');
                    }
                } else if (accionMantencion === 'finalizar') {
                    if (!fechaTerminoMantencion) {
                        throw new Error('La fecha de término es requerida');
                    }
                    
                    const mantencionData = {
                        producto_id: productoId,
                        fecha_fin: fechaTerminoMantencion,
                        observaciones: observacionesMantencion
                    };
                    
                    const mantencionResponse = await productosService.finalizarMantencion(mantencionData);
                    if (mantencionResponse && mantencionResponse.success) {
                        showSnackbar('Producto guardado y mantención finalizada correctamente', 'success');
                    } else {
                        throw new Error(mantencionResponse?.message || 'Error al finalizar mantención');
                    }
                }
            } else if (formData.estado !== 'ASIGNADO') {
                showSnackbar(
                    producto ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                    'success'
                );
            }
            
            // Guardar historial de uso si existe
            if (historialUso.length > 0 && productoId) {
                try {
                    await productosService.guardarHistorialUso(productoId, historialUso);
                    console.log('✅ Historial de uso guardado:', historialUso.length, 'registros');
                } catch (error) {
                    console.error('❌ Error guardando historial:', error);
                }
            }
            
            onSave(response.data);
            handleClose();
            
        } catch (error) {
            console.error('❌ Error al guardar producto:', error);
            showSnackbar('Error: ' + (error.message || 'Error al procesar la solicitud'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nombre: '',
            precio: '',
            oc_numero: '',
            factura_numero: '',
            descripcion: '',
            marca: '',
            modelo: '',
            numero_serie: '',
            condicion: 'NUEVO',
            bodega_id: '',
            estado: 'DISPONIBLE'
        });
        setErrores({});
        setColaboradorSeleccionado('');
        setMotivoAsignacion('');
        setObservacionesAsignacion('');
        setDocumentoAsignacion(null);
        setDocumentoNombre('');
        setHistorialUso([]);
        setMostrarMantencion(false);
        setAccionMantencion('ninguna');
        setResponsableMantencion('');
        setDescripcionMantencion('');
        setCostoMantencion('');
        setObservacionesMantencion('');
        setLoading(false);
        onClose();
    };

    // Diálogo de historial de uso
    const HistorialUsoFormDialog = ({ open, onClose, onGuardar, historialExistente }) => {
        const [historial, setHistorial] = useState([]);
        const [nuevoRegistro, setNuevoRegistro] = useState({
            nombre_persona: '',
            fecha_asignacion: new Date().toISOString().split('T')[0],
            fecha_devolucion: new Date().toISOString().split('T')[0],
            condicion_entrega: '',
            observaciones: ''
        });

        useEffect(() => {
            if (open) setHistorial(historialExistente || []);
        }, [open, historialExistente]);

        const agregarRegistro = () => {
            if (!nuevoRegistro.nombre_persona?.trim()) {
                showSnackbar('Nombre de la persona requerido', 'error');
                return;
            }
            if (!nuevoRegistro.fecha_asignacion) {
                showSnackbar('Fecha de asignación requerida', 'error');
                return;
            }
            if (!nuevoRegistro.fecha_devolucion) {
                showSnackbar('Fecha de devolución requerida', 'error');
                return;
            }
            if (!nuevoRegistro.condicion_entrega?.trim()) {
                showSnackbar('Condición de entrega requerida', 'error');
                return;
            }

            setHistorial([...historial, { ...nuevoRegistro, id: Date.now(), fecha_registro: new Date().toISOString() }]);
            setNuevoRegistro({
                nombre_persona: '',
                fecha_asignacion: new Date().toISOString().split('T')[0],
                fecha_devolucion: new Date().toISOString().split('T')[0],
                condicion_entrega: '',
                observaciones: ''
            });
        };

        const eliminarRegistro = (id) => {
            setHistorial(historial.filter(reg => reg.id !== id));
        };

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <HistoryIcon sx={{ color: colors.primary }} />
                        <Typography variant="h6">Historial de Uso del Producto</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <Alert severity="info">Registre la información de las personas que han usado el producto</Alert>
                        <Paper variant="outlined" sx={{ p: 3, bgcolor: alpha(colors.primary, 0.02) }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>Registrar nuevo uso</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Nombre de la persona *" value={nuevoRegistro.nombre_persona} onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, nombre_persona: e.target.value })} size="small" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="date" label="Fecha de asignación *" value={nuevoRegistro.fecha_asignacion} onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_asignacion: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth type="date" label="Fecha de devolución *" value={nuevoRegistro.fecha_devolucion} onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_devolucion: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Condición de entrega *" value={nuevoRegistro.condicion_entrega} onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, condicion_entrega: e.target.value })} multiline rows={2} size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Observaciones" value={nuevoRegistro.observaciones} onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, observaciones: e.target.value })} multiline rows={2} size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button fullWidth variant="contained" onClick={agregarRegistro} startIcon={<AddIcon />}>Agregar registro</Button>
                                </Grid>
                            </Grid>
                        </Paper>
                        {historial.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>Registros ({historial.length})</Typography>
                                <Stack spacing={1}>
                                    {historial.map((reg, idx) => (
                                        <Paper key={reg.id || idx} variant="outlined" sx={{ p: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                <Box flex={1}>
                                                    <Typography variant="subtitle2" fontWeight={600}>{reg.nombre_persona}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{new Date(reg.fecha_asignacion).toLocaleDateString()} → {new Date(reg.fecha_devolucion).toLocaleDateString()}</Typography>
                                                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Condición:</strong> {reg.condicion_entrega}</Typography>
                                                    {reg.observaciones && <Typography variant="body2"><strong>Obs:</strong> {reg.observaciones}</Typography>}
                                                </Box>
                                                <IconButton size="small" onClick={() => eliminarRegistro(reg.id)} sx={{ color: colors.error }}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => { onGuardar(historial); onClose(); }} variant="contained" color="primary">Guardar ({historial.length} registros)</Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="body" disableEscapeKeyDown={loading}>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)` }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <InventoryIcon sx={{ color: colors.primary }} />
                            <Typography variant="h6">{producto ? 'Editar Producto' : 'Nuevo Producto'}</Typography>
                        </Box>
                        <IconButton onClick={handleClose} size="small" disabled={loading}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Información Básica */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>Información Básica</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Nombre del producto *" 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                error={!!errores.nombre} 
                                helperText={errores.nombre} 
                                size="small" 
                                disabled={loading} 
                                required 
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errores.bodega_id}>
                                <InputLabel>Bodega *</InputLabel>
                                <Select 
                                    name="bodega_id" 
                                    value={formData.bodega_id} 
                                    onChange={handleChange} 
                                    label="Bodega *" 
                                    size="small" 
                                    disabled={loading} 
                                    required
                                >
                                    <MenuItem value=""><em>Seleccione una bodega</em></MenuItem>
                                    {bodegas.map((bodega) => (
                                        <MenuItem key={bodega.id} value={bodega.id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StoreIcon fontSize="small" sx={{ color: colors.primary }} />
                                                {bodega.nombre}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errores.bodega_id && <FormHelperText>{errores.bodega_id}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        {/* NÚMERO DE SERIE - CAMPO OBLIGATORIO */}
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Número de serie * (único)" 
                                name="numero_serie" 
                                value={formData.numero_serie} 
                                onChange={handleChange} 
                                error={!!errores.numero_serie} 
                                helperText={errores.numero_serie} 
                                size="small" 
                                placeholder="Ej: SN-2024-001" 
                                disabled={loading} 
                                required 
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><QrCodeIcon fontSize="small" /></InputAdornment>
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Precio" 
                                name="precio" 
                                type="number" 
                                value={formData.precio} 
                                onChange={handleChange} 
                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                                size="small" 
                                inputProps={{ min: 0, step: 100 }} 
                                disabled={loading} 
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" error={!!errores.condicion}>
                                <InputLabel>Condición *</InputLabel>
                                <Select 
                                    name="condicion" 
                                    value={formData.condicion} 
                                    onChange={handleChange} 
                                    label="Condición *" 
                                    disabled={loading} 
                                    required
                                >
                                    {opcionesCondicion.map((cond) => (<MenuItem key={cond} value={cond}>{cond}</MenuItem>))}
                                </Select>
                                {errores.condicion && <FormHelperText>{errores.condicion}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estado</InputLabel>
                                <Select 
                                    name="estado" 
                                    value={formData.estado} 
                                    onChange={handleChange} 
                                    label="Estado" 
                                    disabled={loading}
                                >
                                    {opcionesEstado.map((estado) => (<MenuItem key={estado} value={estado}>{estado}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* SECCIÓN DE HISTORIAL DE USO */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary} sx={{ mt: 1 }}>Historial de Uso</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Button 
                                variant="outlined" 
                                startIcon={<HistoryIcon />} 
                                onClick={() => setShowHistorial(true)} 
                                fullWidth 
                                disabled={loading} 
                                sx={{ borderColor: colors.info, color: colors.info }}
                            >
                                {historialUso.length > 0 ? `Editar historial de uso (${historialUso.length} registros)` : 'Agregar historial de uso'}
                            </Button>
                            {historialUso.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    {historialUso.slice(0, 2).map((reg, idx) => (
                                        <Paper key={idx} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: alpha(colors.info, 0.03) }}>
                                            <Typography variant="body2"><strong>{reg.nombre_persona}</strong></Typography>
                                            <Typography variant="caption">{new Date(reg.fecha_asignacion).toLocaleDateString()} → {new Date(reg.fecha_devolucion).toLocaleDateString()}</Typography>
                                        </Paper>
                                    ))}
                                    {historialUso.length > 2 && <Typography variant="caption">+{historialUso.length - 2} más...</Typography>}
                                </Box>
                            )}
                        </Grid>

                        {/* SECCIÓN DE ASIGNACIÓN A COLABORADOR */}
                        {formData.estado === 'ASIGNADO' && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>Asignar a Colaborador</Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <FormControl fullWidth size="small" error={!!errores.asignacion}>
                                    <InputLabel>Seleccionar Colaborador *</InputLabel>
                                    <Select 
                                        value={colaboradorSeleccionado} 
                                        onChange={(e) => setColaboradorSeleccionado(e.target.value)} 
                                        label="Seleccionar Colaborador *" 
                                        disabled={loading} 
                                        required
                                    >
                                        <MenuItem value=""><em>Seleccione un colaborador</em></MenuItem>
                                        {colaboradores.map((col) => (
                                            <MenuItem key={col.id} value={col.id.toString()}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.primary, 0.1) }}>{col.nombre?.charAt(0) || '?'}</Avatar>
                                                    <Box>
                                                        <Typography variant="body2">{col.nombre}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{col.cargo || 'Sin cargo'} • {col.departamento || 'Sin departamento'}</Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errores.asignacion && <FormHelperText error>{errores.asignacion}</FormHelperText>}
                                </FormControl>

                                {colaboradorInfo && (
                                    <StyledPaper sx={{ mt: 2 }}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: colors.success, width: 48, height: 48 }}>{colaboradorInfo.nombre?.charAt(0)}</Avatar>
                                            <Box flex={1}>
                                                <Typography variant="subtitle2" fontWeight={600}>{colaboradorInfo.nombre}</Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">{colaboradorInfo.cargo || 'Sin cargo'} • {colaboradorInfo.departamento || 'Sin departamento'}</Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">{colaboradorInfo.email} • {colaboradorInfo.telefono || 'Sin teléfono'}</Typography>
                                            </Box>
                                            <CheckCircleOutlineIcon sx={{ color: colors.success }} />
                                        </Box>
                                    </StyledPaper>
                                )}

                                <TextField 
                                    fullWidth 
                                    label="Motivo de asignación *" 
                                    value={motivoAsignacion} 
                                    onChange={(e) => setMotivoAsignacion(e.target.value)} 
                                    placeholder="Ej: Uso temporal, Proyecto específico..." 
                                    multiline 
                                    rows={2} 
                                    size="small" 
                                    disabled={loading} 
                                    sx={{ mt: 2 }} 
                                    error={!!errores.motivo} 
                                    helperText={errores.motivo} 
                                    required 
                                />
                                <TextField 
                                    fullWidth 
                                    label="Observaciones adicionales" 
                                    value={observacionesAsignacion} 
                                    onChange={(e) => setObservacionesAsignacion(e.target.value)} 
                                    placeholder="Observaciones adicionales..." 
                                    multiline 
                                    rows={2} 
                                    size="small" 
                                    disabled={loading} 
                                    sx={{ mt: 2 }} 
                                />

                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" fontWeight={600} color={colors.primary} gutterBottom>Acta de Asignación</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.info, 0.02) }}>
                                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                            <Button variant="outlined" component="label" startIcon={<UploadIcon />} disabled={loading} sx={{ borderColor: colors.info, color: colors.info }}>
                                                Subir Acta
                                                <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleDocumentoChange} />
                                            </Button>
                                            {documentoNombre && (
                                                <Chip 
                                                    icon={<DescriptionIcon />} 
                                                    label={documentoNombre} 
                                                    onDelete={() => { setDocumentoAsignacion(null); setDocumentoNombre(''); }} 
                                                    sx={{ maxWidth: '300px' }} 
                                                />
                                            )}
                                            <Typography variant="caption" color="text.secondary">Formatos: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</Typography>
                                        </Box>
                                        {!documentoNombre && <Alert severity="info" sx={{ mt: 2 }}>Se recomienda subir el acta de asignación firmada.</Alert>}
                                    </Paper>
                                </Box>
                            </Grid>
                        )}

                        {/* SECCIÓN DE MANTENCIÓN/REPARACIÓN */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>Mantención / Reparación</Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <FormControl fullWidth size="small">
                                <InputLabel>Acción de Mantención</InputLabel>
                                <Select 
                                    value={accionMantencion} 
                                    onChange={(e) => { setAccionMantencion(e.target.value); setMostrarMantencion(e.target.value !== 'ninguna'); }} 
                                    label="Acción de Mantención" 
                                    disabled={loading}
                                >
                                    <MenuItem value="ninguna">Sin acción</MenuItem>
                                    <MenuItem value="iniciar">Iniciar Mantención / Reparación</MenuItem>
                                    <MenuItem value="finalizar">Finalizar Mantención / Reparación</MenuItem>
                                </Select>
                            </FormControl>

                            {mostrarMantencion && accionMantencion === 'iniciar' && (
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Alert severity="info">Al iniciar, el estado cambiará a {tipoMantencion === 'REPARACION' ? 'EN REPARACIÓN' : 'EN MANTENCIÓN'}</Alert>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tipo</InputLabel>
                                        <Select value={tipoMantencion} onChange={(e) => setTipoMantencion(e.target.value)}>
                                            <MenuItem value="RUTINA">Mantención de Rutina</MenuItem>
                                            <MenuItem value="REPARACION">Reparación</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField 
                                        fullWidth 
                                        type="date" 
                                        label="Fecha de inicio" 
                                        value={fechaInicioMantencion} 
                                        onChange={(e) => setFechaInicioMantencion(e.target.value)} 
                                        InputLabelProps={{ shrink: true }} 
                                        size="small" 
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Responsable *" 
                                        value={responsableMantencion} 
                                        onChange={(e) => setResponsableMantencion(e.target.value)} 
                                        size="small" 
                                        required 
                                        error={!!errores.responsable} 
                                        helperText={errores.responsable}
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Descripción del trabajo *" 
                                        value={descripcionMantencion} 
                                        onChange={(e) => setDescripcionMantencion(e.target.value)} 
                                        multiline 
                                        rows={3} 
                                        size="small" 
                                        required 
                                        error={!!errores.descripcionMantencion} 
                                        helperText={errores.descripcionMantencion}
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Costo estimado" 
                                        value={costoMantencion} 
                                        onChange={(e) => setCostoMantencion(e.target.value)} 
                                        type="number" 
                                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} 
                                        size="small" 
                                    />
                                </Stack>
                            )}

                            {mostrarMantencion && accionMantencion === 'finalizar' && (
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Alert severity="info">Al finalizar, el estado volverá a DISPONIBLE</Alert>
                                    <TextField 
                                        fullWidth 
                                        type="date" 
                                        label="Fecha de término *" 
                                        value={fechaTerminoMantencion} 
                                        onChange={(e) => setFechaTerminoMantencion(e.target.value)} 
                                        InputLabelProps={{ shrink: true }} 
                                        size="small" 
                                        required 
                                    />
                                    <TextField 
                                        fullWidth 
                                        label="Observaciones" 
                                        value={observacionesMantencion} 
                                        onChange={(e) => setObservacionesMantencion(e.target.value)} 
                                        multiline 
                                        rows={3} 
                                        size="small" 
                                    />
                                </Stack>
                            )}
                        </Grid>

                        {/* Detalles del Producto */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>Detalles del Producto</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Marca" name="marca" value={formData.marca} onChange={handleChange} size="small" disabled={loading} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} size="small" disabled={loading} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>Documentos de Compra</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="N° Orden de Compra" name="oc_numero" value={formData.oc_numero} onChange={handleChange} size="small" disabled={loading} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="N° Factura" name="factura_numero" value={formData.factura_numero} onChange={handleChange} size="small" disabled={loading} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField 
                                fullWidth 
                                label="Descripción" 
                                name="descripcion" 
                                value={formData.descripcion} 
                                onChange={handleChange} 
                                multiline 
                                rows={3} 
                                size="small" 
                                placeholder="Descripción del producto..." 
                                disabled={loading} 
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" startIcon={<CancelIcon />} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        color="primary" 
                        disabled={loading} 
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />} 
                        sx={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                    >
                        {loading ? 'Guardando...' : (producto ? 'Actualizar' : 'Crear')}
                    </Button>
                </DialogActions>
            </Dialog>

            <HistorialUsoFormDialog 
                open={showHistorial} 
                onClose={() => setShowHistorial(false)} 
                historialExistente={historialUso} 
                onGuardar={(historial) => { 
                    setHistorialUso(historial); 
                    setShowHistorial(false); 
                }} 
            />

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default ProductoForm;