// src/pages/Productos.jsx - VERSIÓN COMPLETA CORREGIDA (BODEGA NO OBLIGATORIA)
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Divider,
    Stack,
    alpha,
    Container,
    AppBar,
    Toolbar,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    FormHelperText,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Badge,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Assignment as AssignmentIcon,
    Search as SearchIcon,
    Inventory as InventoryIcon,
    Close as CloseIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Build as BuildIcon,
    Handyman as HandymanIcon,
    DeleteForever as DeleteForeverIcon,
    AttachMoney as AttachMoneyIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    Image as ImageIcon,
    VolunteerActivism as VolunteerActivismIcon,
    History as HistoryIcon,
    CalendarToday as CalendarTodayIcon,
    AssignmentInd as AssignmentIndIcon,
    Home as HomeIcon,
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
    Download as DownloadIcon,
    Store as StoreIcon,
    ExpandMore as ExpandMoreIcon,
    QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productosService } from '../services/productos';
import colaboradorService from '../services/colaboradorService';
import { exportService } from '../services/exportService';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Colores corporativos
const colors = {
    primary: '#0A66C2',
    secondary: '#7C3AED',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        disabled: '#9CA3AF'
    },
    border: '#E5E7EB'
};

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${colors.border}`,
    transition: 'all .3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'white',
    overflowX: 'auto',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    color: colors.text.primary,
    borderBottom: `2px solid ${alpha(colors.primary, 0.2)}`,
    backgroundColor: alpha(colors.primary, 0.02),
    whiteSpace: 'nowrap',
    padding: theme.spacing(1.5, 2),
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(3),
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    backgroundColor: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    color: 'white',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    '&:hover': {
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 10px 20px ${alpha(colors.primary, 0.3)}`,
    },
}));

const HistorialContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: alpha(colors.background, 0.7),
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    maxHeight: '500px',
    overflowY: 'auto'
}));

const TimelineItem = styled(Box)(({ theme }) => ({
    position: 'relative',
    paddingLeft: 30,
    paddingBottom: 24,
    '&:before': {
        content: '""',
        position: 'absolute',
        left: 6,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: alpha(colors.primary, 0.2)
    },
    '&:last-child:before': {
        display: 'none'
    }
}));

const TimelineDot = styled(Box)(({ theme, color = colors.primary }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: color,
    border: `2px solid ${alpha(color, 0.3)}`,
    zIndex: 1
}));

// ============================================
// COMPONENTE PARA MOSTRAR HISTORIAL DE MANTENCIONES
// ============================================
function HistorialMantenciones({ mantenciones = [] }) {
    if (!mantenciones || mantenciones.length === 0) {
        return (
            <Box textAlign="center" py={2}>
                <BuildIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography color="text.secondary">No hay mantenciones registradas</Typography>
            </Box>
        );
    }

    return (
        <List>
            {mantenciones.map((mant, idx) => (
                <ListItem key={idx} divider alignItems="flex-start">
                    <ListItemAvatar>
                        <Avatar sx={{ 
                            bgcolor: mant.fecha_fin ? alpha(colors.success, 0.1) : alpha(colors.warning, 0.1),
                            color: mant.fecha_fin ? colors.success : colors.warning
                        }}>
                            {mant.tipo === 'RUTINA' ? <BuildIcon /> : <HandymanIcon />}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="subtitle2">
                                    {mant.tipo === 'RUTINA' ? 'Mantención de Rutina' : 'Reparación'}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={mant.fecha_fin ? 'COMPLETADA' : 'EN PROGRESO'}
                                    sx={{
                                        backgroundColor: mant.fecha_fin ? alpha(colors.success, 0.1) : alpha(colors.warning, 0.1),
                                        color: mant.fecha_fin ? colors.success : colors.warning,
                                        height: 20
                                    }}
                                />
                            </Box>
                        }
                        secondary={
                            <>
                                <Typography variant="caption" display="block">
                                    Inicio: {new Date(mant.fecha_inicio).toLocaleDateString('es-CL')} 
                                    {mant.fecha_fin && ` - Término: ${new Date(mant.fecha_fin).toLocaleDateString('es-CL')}`}
                                    {!mant.fecha_fin && ' - En curso'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Responsable: {mant.responsable}
                                </Typography>
                                {mant.costo > 0 && (
                                    <Typography variant="caption" display="block" color="success.main">
                                        Costo: ${mant.costo.toLocaleString('es-CL')}
                                    </Typography>
                                )}
                                {mant.descripcion && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {mant.descripcion}
                                    </Typography>
                                )}
                            </>
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
}

// ============================================
// DIÁLOGO DE HISTORIAL DE USO
// ============================================
function HistorialUsoDialog({ open, onClose, producto, historial = [] }) {
    const [tabValue, setTabValue] = useState(0);
    
    if (!producto) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
        } catch {
            return dateString;
        }
    };

    const getDuration = (inicio, fin) => {
        if (!inicio || !fin) return null;
        try {
            const days = differenceInDays(new Date(fin), new Date(inicio));
            if (days === 0) return 'Menos de 1 día';
            if (days === 1) return '1 día';
            return `${days} días`;
        } catch {
            return null;
        }
    };

    const getCondicionColor = (condicion) => {
        const colores = {
            'BUENO': colors.success,
            'REGULAR': colors.warning,
            'MALO': colors.error,
            'NUEVO': colors.success,
            'USADO': colors.warning,
            'REACONDICIONADO': colors.info
        };
        return colores[condicion?.toUpperCase()] || colors.text.secondary;
    };

    const historialOrdenado = [...historial].sort((a, b) => {
        return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
    });

    const historialActivo = historialOrdenado.filter(h => !h.fecha_devolucion);
    const historialCompletado = historialOrdenado.filter(h => h.fecha_devolucion);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <HistoryIcon sx={{ color: colors.primary }} />
                        <Typography variant="h6">
                            Historial de Uso - {producto.nombre}
                        </Typography>
                    </Box>
                    <Chip
                        label={producto.condicion || 'NUEVO'}
                        size="small"
                        sx={{ 
                            backgroundColor: alpha(getCondicionColor(producto.condicion), 0.1),
                            color: getCondicionColor(producto.condicion),
                            fontWeight: 500
                        }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Serie: {producto.numero_serie || 'N/A'} | ID: {producto.id}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab 
                            label={
                                <Badge badgeContent={historialActivo.length} color="info">
                                    Historial Completo
                                </Badge>
                            } 
                        />
                        <Tab label="Resumen" />
                    </Tabs>
                </Box>

                {tabValue === 0 ? (
                    <HistorialContainer>
                        {historialOrdenado.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                <Typography color="text.secondary">
                                    No hay registros de uso para este producto
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {historialOrdenado.map((registro, index) => (
                                    <TimelineItem key={registro.id || index}>
                                        <TimelineDot color={!registro.fecha_devolucion ? colors.success : colors.primary} />
                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Chip
                                                    size="small"
                                                    label={!registro.fecha_devolucion ? 'Activo' : 'Completado'}
                                                    sx={{
                                                        backgroundColor: !registro.fecha_devolucion ? 
                                                            alpha(colors.success, 0.1) : alpha(colors.info, 0.1),
                                                        color: !registro.fecha_devolucion ? 
                                                            colors.success : colors.info
                                                    }}
                                                />
                                                {registro.estado && (
                                                    <Chip
                                                        size="small"
                                                        label={registro.estado}
                                                        sx={{ backgroundColor: alpha(colors.primary, 0.1) }}
                                                    />
                                                )}
                                            </Box>

                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                            Usuario
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={500}>
                                                            {registro.nombre_usuario || registro.nombre_persona || registro.colaborador_nombre || 'No especificado'}
                                                        </Typography>
                                                        {registro.email && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {registro.email}
                                                            </Typography>
                                                        )}
                                                    </Grid>

                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                            Fechas
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Asignación: {formatDateTime(registro.fecha_asignacion)}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Devolución: {registro.fecha_devolucion ? formatDateTime(registro.fecha_devolucion) : 'Pendiente'}
                                                        </Typography>
                                                        {registro.fecha_devolucion && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Duración: {getDuration(registro.fecha_asignacion, registro.fecha_devolucion)}
                                                            </Typography>
                                                        )}
                                                    </Grid>

                                                    {registro.condicion_entrega && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Condición de entrega
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {registro.condicion_entrega}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {registro.observaciones && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Observaciones
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {registro.observaciones}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {registro.motivo && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Motivo
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {registro.motivo}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </Paper>
                                        </Box>
                                    </TimelineItem>
                                ))}
                            </Box>
                        )}
                    </HistorialContainer>
                ) : (
                    <HistorialContainer>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: alpha(colors.info, 0.05) }}>
                                    <Badge
                                        badgeContent={historialActivo.length}
                                        color="info"
                                        sx={{ '& .MuiBadge-badge': { fontSize: 12 } }}
                                    >
                                        <AssignmentIndIcon sx={{ fontSize: 40, color: colors.info }} />
                                    </Badge>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        {historialActivo.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Asignaciones Activas
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: alpha(colors.success, 0.05) }}>
                                    <Badge
                                        badgeContent={historialCompletado.length}
                                        color="success"
                                        sx={{ '& .MuiBadge-badge': { fontSize: 12 } }}
                                    >
                                        <HistoryIcon sx={{ fontSize: 40, color: colors.success }} />
                                    </Badge>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        {historialCompletado.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Asignaciones Completadas
                                    </Typography>
                                </Paper>
                            </Grid>

                            {historialCompletado.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        Últimas asignaciones
                                    </Typography>
                                    <List>
                                        {historialCompletado.slice(0, 3).map((reg, idx) => (
                                            <ListItem key={idx} divider>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1) }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={reg.nombre_usuario || reg.nombre_persona || reg.colaborador_nombre}
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" color="text.primary">
                                                                {formatDate(reg.fecha_asignacion)} → {formatDate(reg.fecha_devolucion)}
                                                            </Typography>
                                                            {reg.condicion_entrega && (
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                    Condición: {reg.condicion_entrega}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}
                        </Grid>
                    </HistorialContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE DISPOSICIÓN (BAJA/DONACIÓN)
// ============================================
function DisposicionDialog({ open, onClose, producto, onSuccess }) {
    const [tipo, setTipo] = useState('BAJA');
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [observaciones, setObservaciones] = useState('');
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
            setObservaciones('');
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
                            Serie: {producto.numero_serie || 'N/A'} | Condición: {producto.condicion || 'NUEVO'}
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

                            <TextField
                                fullWidth
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Observaciones adicionales..."
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

// ============================================
// DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN
// ============================================
function ConfirmDeleteDialog({ open, onClose, producto, onConfirm }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: alpha(colors.error, 0.05)
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <DeleteForeverIcon sx={{ color: colors.error }} />
                    <Typography variant="h6">Confirmar Eliminación</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Esta acción eliminará permanentemente el producto.
                </Alert>
                
                <Typography variant="body1" gutterBottom>
                    ¿Está seguro que desea eliminar el producto?
                </Typography>
                
                {producto && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: alpha(colors.background, 0.5) }}>
                        <Typography variant="subtitle2" gutterBottom>
                            <strong>{producto.nombre}</strong>
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">ID:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{producto.id}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Serie:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{producto.numero_serie || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                    startIcon={<CancelIcon />}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                >
                    Eliminar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE ASIGNACIÓN A COLABORADOR
// ============================================
function AsignacionColaboradorDialog({ open, onClose, producto, onSuccess }) {
    const [colaboradores, setColaboradores] = useState([]);
    const [selectedColaborador, setSelectedColaborador] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            setSelectedColaborador(null);
            setMotivo('');
            setObservaciones('');
            setError('');
            setSearchTerm('');
        }
    }, [open]);

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

    const handleSubmit = async () => {
        if (!selectedColaborador) {
            setError('Debe seleccionar un colaborador');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = {
                colaborador_id: selectedColaborador.id,
                motivo: motivo.trim() || 'Asignación de equipo',
                observaciones: observaciones.trim() || '',
                fecha_asignacion: new Date().toISOString().split('T')[0]
            };

            const response = await productosService.asignarProducto(producto.id, selectedColaborador.id, data);

            if (response && response.success) {
                onSuccess(`Producto asignado correctamente a ${selectedColaborador.nombre}`, response.producto);
                onClose();
            } else {
                throw new Error(response?.message || 'Error al asignar producto');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Error al procesar la asignación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                pb: 2,
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIndIcon sx={{ color: colors.primary }} />
                    <Typography variant="h6">
                        Asignar Producto a Colaborador
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Producto: <strong>{producto?.nombre}</strong> (ID: {producto?.id})
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                <Stack spacing={3}>
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: alpha(colors.primary, 0.05), 
                        borderRadius: 2,
                        border: `1px solid ${alpha(colors.primary, 0.1)}`
                    }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Detalles del producto:
                        </Typography>
                        <Typography variant="body2">
                            <strong>Nombre:</strong> {producto?.nombre}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Serie:</strong> {producto?.numero_serie || 'N/A'}
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        placeholder="Buscar colaborador por nombre, RUT, email o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6B7280' }} /></InputAdornment>,
                        }}
                        size="small"
                    />

                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {colaboradoresFiltrados.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    {searchTerm ? 'No se encontraron colaboradores' : 'No hay colaboradores activos registrados'}
                                </Typography>
                                <Button 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                    onClick={() => window.location.href = '/colaboradores'}
                                >
                                    Ir a gestión de colaboradores
                                </Button>
                            </Box>
                        ) : (
                            colaboradoresFiltrados.map((col) => (
                                <Box
                                    key={col.id}
                                    sx={{
                                        p: 2,
                                        borderBottom: `1px solid ${colors.border}`,
                                        cursor: 'pointer',
                                        backgroundColor: selectedColaborador?.id === col.id ? alpha(colors.primary, 0.05) : 'transparent',
                                        '&:hover': { backgroundColor: alpha(colors.primary, 0.03) },
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => setSelectedColaborador(col)}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                            {col.nombre?.charAt(0) || '?'}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="subtitle2" fontWeight={500}>
                                                {col.nombre}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {col.cargo || 'Sin cargo'} • {col.departamento || 'Sin departamento'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {col.email} {col.rut && `• RUT: ${col.rut}`}
                                            </Typography>
                                        </Box>
                                        {selectedColaborador?.id === col.id && (
                                            <CheckCircleOutlineIcon sx={{ color: colors.success }} />
                                        )}
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Paper>

                    {selectedColaborador && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: alpha(colors.success, 0.05), 
                            borderRadius: 2,
                            border: `1px solid ${alpha(colors.success, 0.2)}`
                        }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom color={colors.success}>
                                Colaborador seleccionado:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                <Avatar sx={{ bgcolor: colors.success }}>
                                    {selectedColaborador.nombre?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight={500}>
                                        {selectedColaborador.nombre}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedColaborador.cargo || 'Sin cargo'} • {selectedColaborador.departamento || 'Sin departamento'}
                                    </Typography>
                                    {selectedColaborador.email && (
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedColaborador.email}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Motivo de asignación"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ej: Uso temporal, Proyecto específico, Reemplazo de equipo, etc."
                        multiline
                        rows={2}
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Observaciones adicionales"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Detalles adicionales sobre la asignación..."
                        multiline
                        rows={2}
                        disabled={loading}
                    />

                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !selectedColaborador}
                    startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIndIcon />}
                    sx={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                            transform: 'translateY(-1px)'
                        }
                    }}
                >
                    {loading ? 'Asignando...' : 'Confirmar Asignación'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE DETALLE DE PRODUCTO
// ============================================
function ProductoDetailDialog({ open, onClose, producto, getImageUrl, historialUso = [], historialMantenciones = [] }) {
    const [tabValue, setTabValue] = useState(0);
    
    if (!producto) return null;

    const getEstadoColor = (estado) => {
        const colores = {
            'DISPONIBLE': colors.success,
            'ASIGNADO': colors.info,
            'EN MANTENCIÓN': colors.warning,
            'EN REPARACIÓN': colors.warning,
            'NO DISPONIBLE': colors.error
        };
        return colores[estado] || colors.text.secondary;
    };

    const getCondicionColor = (condicion) => {
        return condicion === 'USADO' ? colors.warning : colors.success;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                        src={getImageUrl(producto.imagen_path)}
                        sx={{
                            width: 60,
                            height: 60,
                            border: `2px solid ${colors.primary}`,
                        }}
                    >
                        <ImageIcon />
                    </Avatar>
                    <Box flex={1}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {producto.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ID: {producto.id} • Serie: {producto.numero_serie || 'N/A'}
                        </Typography>
                        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                            <Chip
                                label={producto.estado || 'DISPONIBLE'}
                                size="small"
                                sx={{ 
                                    backgroundColor: alpha(getEstadoColor(producto.estado), 0.1), 
                                    color: getEstadoColor(producto.estado),
                                }}
                            />
                            <Chip
                                label={producto.condicion || 'NUEVO'}
                                size="small"
                                sx={{ 
                                    backgroundColor: alpha(getCondicionColor(producto.condicion), 0.1),
                                    color: getCondicionColor(producto.condicion),
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Información" />
                    <Tab 
                        label={
                            <Badge badgeContent={historialUso.length} color="info" max={99}>
                                Historial de Uso
                            </Badge>
                        } 
                    />
                    <Tab 
                        label={
                            <Badge badgeContent={historialMantenciones.length} color="warning" max={99}>
                                Mantenciones
                            </Badge>
                        } 
                    />
                </Tabs>
            </Box>

            <DialogContent dividers>
                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Información Básica
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Marca:</Typography>
                                        <Typography fontWeight={500}>{producto.marca || '-'}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Modelo:</Typography>
                                        <Typography fontWeight={500}>{producto.modelo || '-'}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Precio:</Typography>
                                        <Typography fontWeight={600} color={colors.primary}>
                                            ${(producto.precio || 0).toLocaleString('es-CL')}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Documentos y Fechas
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">OC N°:</Typography>
                                        <Typography fontWeight={500}>{producto.oc_numero || 'N/A'}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Factura N°:</Typography>
                                        <Typography fontWeight={500}>{producto.factura_numero || 'N/A'}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Fecha Adquisición:</Typography>
                                        <Typography fontWeight={500}>{formatDate(producto.fecha_adquisicion)}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                        {producto.descripcion && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Descripción
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.background, 0.5) }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {producto.descripcion}
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                )}

                {tabValue === 1 && (
                    <HistorialUsoDialog
                        open={true}
                        onClose={() => {}}
                        producto={producto}
                        historial={historialUso}
                    />
                )}

                {tabValue === 2 && (
                    <HistorialMantenciones mantenciones={historialMantenciones} />
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// FORMULARIO DE PRODUCTO CON BODEGA NO OBLIGATORIA
// ============================================
function ProductoForm({ open, onClose, producto, onSave }) {
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
    const [showHistorial, setShowHistorial] = useState(false);
    const [historialUso, setHistorialUso] = useState([]);
    const [historialMantenciones, setHistorialMantenciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bodegas, setBodegas] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState('');
    const [motivoAsignacion, setMotivoAsignacion] = useState('');
    const [observacionesAsignacion, setObservacionesAsignacion] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Estados para mantención
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
                const bodegasData = await productosService.getBodegas();
                setBodegas(bodegasData || []);
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

    // Cargar datos del producto
    useEffect(() => {
        if (open) {
            if (producto) {
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
                
                if (producto.historial_uso && Array.isArray(producto.historial_uso)) {
                    setHistorialUso(producto.historial_uso);
                } else {
                    setHistorialUso([]);
                }

                if (producto.historial_mantenciones && Array.isArray(producto.historial_mantenciones)) {
                    setHistorialMantenciones(producto.historial_mantenciones);
                } else {
                    setHistorialMantenciones([]);
                }
                
                if (producto.colaborador_asignado && producto.colaborador_asignado.id) {
                    setColaboradorSeleccionado(producto.colaborador_asignado.id);
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
                setHistorialMantenciones([]);
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

    const validarFormulario = () => {
        const nuevosErrores = {};
        if (!formData.nombre?.trim()) nuevosErrores.nombre = 'El nombre es requerido';
        if (!formData.numero_serie?.trim()) nuevosErrores.numero_serie = 'El número de serie es requerido (producto único)';
        if (!formData.condicion) nuevosErrores.condicion = 'Debe seleccionar una condición';
        // BODEGA NO ES OBLIGATORIA
        if (formData.estado === 'ASIGNADO' && !colaboradorSeleccionado) {
            nuevosErrores.asignacion = 'Debe seleccionar un colaborador para asignar el producto';
        }
        
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {
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

            console.log('📤 Enviando productoData:', productoData);

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

            if (formData.estado === 'ASIGNADO' && colaboradorSeleccionado && productoId) {
                try {
                    console.log('📤 Creando asignación para producto:', productoId, 'colaborador:', colaboradorSeleccionado);
                    
                    const asignacionResponse = await productosService.asignarProducto(productoId, colaboradorSeleccionado, {
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
        setHistorialUso([]);
        setHistorialMantenciones([]);
        setColaboradorSeleccionado('');
        setMotivoAsignacion('');
        setObservacionesAsignacion('');
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
            if (open) {
                setHistorial(historialExistente || []);
            }
        }, [open, historialExistente]);

        const agregarRegistro = () => {
            if (!nuevoRegistro.nombre_persona?.trim()) {
                alert('El nombre de la persona es requerido');
                return;
            }
            if (!nuevoRegistro.fecha_asignacion) {
                alert('La fecha de asignación es requerida');
                return;
            }
            if (!nuevoRegistro.fecha_devolucion) {
                alert('La fecha de devolución es requerida');
                return;
            }
            if (!nuevoRegistro.condicion_entrega?.trim()) {
                alert('La condición de entrega es requerida');
                return;
            }

            setHistorial([...historial, { 
                ...nuevoRegistro, 
                id: Date.now(),
                fecha_registro: new Date().toISOString()
            }]);
            
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
                        <PersonIcon sx={{ color: colors.primary }} />
                        <Typography variant="h6">Historial de Uso del Producto</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <Alert severity="info">
                            Registre la información de las personas que han usado el producto
                        </Alert>

                        <Paper variant="outlined" sx={{ p: 3, bgcolor: alpha(colors.primary, 0.02) }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Registrar nuevo uso
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre de la persona *"
                                        value={nuevoRegistro.nombre_persona}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, nombre_persona: e.target.value })}
                                        size="small"
                                        placeholder="Nombre completo de quien usó el producto"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha de asignación *"
                                        value={nuevoRegistro.fecha_asignacion}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_asignacion: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha de devolución *"
                                        value={nuevoRegistro.fecha_devolucion}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_devolucion: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Condición de entrega *"
                                        value={nuevoRegistro.condicion_entrega}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, condicion_entrega: e.target.value })}
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder="Describa en qué condiciones se entregó/recibió el equipo"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Observaciones adicionales"
                                        value={nuevoRegistro.observaciones}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, observaciones: e.target.value })}
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder="Observaciones adicionales (opcional)"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={agregarRegistro}
                                        disabled={!nuevoRegistro.nombre_persona?.trim() || !nuevoRegistro.fecha_asignacion || !nuevoRegistro.fecha_devolucion || !nuevoRegistro.condicion_entrega?.trim()}
                                        startIcon={<AddIcon />}
                                    >
                                        Agregar registro de uso
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {historial.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Registros de uso ({historial.length})
                                </Typography>
                                <Stack spacing={2}>
                                    {historial.map((registro, index) => (
                                        <Paper key={registro.id || index} variant="outlined" sx={{ p: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                <Box flex={1}>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {registro.nombre_persona}
                                                    </Typography>
                                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Asignación:
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {new Date(registro.fecha_asignacion).toLocaleDateString('es-CL')}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Devolución:
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {new Date(registro.fecha_devolucion).toLocaleDateString('es-CL')}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        <strong>Condición:</strong> {registro.condicion_entrega}
                                                    </Typography>
                                                    {registro.observaciones && (
                                                        <Typography variant="body2">
                                                            <strong>Obs:</strong> {registro.observaciones}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => eliminarRegistro(registro.id)}
                                                    sx={{ color: colors.error }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                <Typography color="text.secondary">
                                    No hay registros de uso. Agregue el primer registro.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} variant="outlined">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={() => {
                            onGuardar(historial);
                            onClose();
                        }} 
                        variant="contained" 
                        color="primary"
                    >
                        Guardar Historial ({historial.length} registros)
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth 
                scroll="body"
                disableEscapeKeyDown={loading}
            >
                <DialogTitle sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                }}>
                    <Typography variant="h6">
                        {producto ? 'Editar Producto' : 'Nuevo Producto'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary}>
                                Información Básica
                            </Typography>
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
                            <FormControl fullWidth>
                                <InputLabel>Bodega (opcional)</InputLabel>
                                <Select
                                    name="bodega_id"
                                    value={formData.bodega_id}
                                    onChange={handleChange}
                                    label="Bodega (opcional)"
                                    size="small"
                                    disabled={loading}
                                >
                                    <MenuItem value=""><em>Sin bodega asignada</em></MenuItem>
                                    {bodegas.map((bodega) => (
                                        <MenuItem key={bodega.id} value={bodega.id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StoreIcon fontSize="small" sx={{ color: colors.primary }} />
                                                {bodega.nombre}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

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
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                }}
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
                                    label="Condición *"
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                >
                                    <MenuItem value="NUEVO">Nuevo</MenuItem>
                                    <MenuItem value="USADO">Usado</MenuItem>
                                    <MenuItem value="REACONDICIONADO">Reacondicionado</MenuItem>
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
                                    {opcionesEstado.map((estado) => (
                                        <MenuItem key={estado} value={estado}>
                                            {estado}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {formData.estado === 'ASIGNADO' && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                    Asignar a Colaborador
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <FormControl fullWidth size="small" error={!!errores.asignacion}>
                                    <InputLabel>Seleccionar Colaborador *</InputLabel>
                                    <Select
                                        value={colaboradorSeleccionado}
                                        onChange={(e) => {
                                            setColaboradorSeleccionado(e.target.value);
                                            if (errores.asignacion) {
                                                setErrores({ ...errores, asignacion: null });
                                            }
                                        }}
                                        label="Seleccionar Colaborador *"
                                        disabled={loading}
                                        required
                                    >
                                        <MenuItem value="">
                                            <em>Seleccione un colaborador</em>
                                        </MenuItem>
                                        {colaboradores.map((col) => (
                                            <MenuItem key={col.id} value={col.id}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.primary, 0.1) }}>
                                                        {col.nombre?.charAt(0) || '?'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {col.nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {col.cargo} • {col.departamento}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errores.asignacion && <FormHelperText error>{errores.asignacion}</FormHelperText>}
                                </FormControl>

                                {colaboradorSeleccionado && (
                                    <Box sx={{ mt: 2, p: 2, bgcolor: alpha(colors.success, 0.05), borderRadius: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={600} color={colors.success} gutterBottom>
                                            Colaborador seleccionado:
                                        </Typography>
                                        {colaboradores.find(c => c.id === parseInt(colaboradorSeleccionado)) && (
                                            <>
                                                <Typography variant="body2">
                                                    <strong>Nombre:</strong> {colaboradores.find(c => c.id === parseInt(colaboradorSeleccionado)).nombre}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Email:</strong> {colaboradores.find(c => c.id === parseInt(colaboradorSeleccionado)).email}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Cargo:</strong> {colaboradores.find(c => c.id === parseInt(colaboradorSeleccionado)).cargo || 'No especificado'}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                )}

                                <TextField
                                    fullWidth
                                    label="Motivo de asignación"
                                    value={motivoAsignacion}
                                    onChange={(e) => setMotivoAsignacion(e.target.value)}
                                    placeholder="Ej: Uso temporal, Proyecto específico, Reemplazo de equipo, etc."
                                    multiline
                                    rows={2}
                                    size="small"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Observaciones adicionales"
                                    value={observacionesAsignacion}
                                    onChange={(e) => setObservacionesAsignacion(e.target.value)}
                                    placeholder="Observaciones adicionales sobre la asignación..."
                                    multiline
                                    rows={2}
                                    size="small"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                />
                                
                                {producto && producto.colaborador_asignado && producto.colaborador_asignado.id && !colaboradorSeleccionado && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Este producto ya está asignado a <strong>{producto.colaborador_asignado.nombre}</strong>
                                    </Alert>
                                )}
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={600} color={colors.primary}>
                                Mantención / Reparación
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <FormControl fullWidth size="small">
                                <InputLabel>Acción de Mantención</InputLabel>
                                <Select
                                    value={accionMantencion}
                                    onChange={(e) => {
                                        setAccionMantencion(e.target.value);
                                        setMostrarMantencion(e.target.value !== 'ninguna');
                                    }}
                                    label="Acción de Mantención"
                                    disabled={loading}
                                >
                                    <MenuItem value="ninguna">Sin acción de mantención</MenuItem>
                                    <MenuItem value="iniciar">Iniciar Mantención / Reparación</MenuItem>
                                    <MenuItem value="finalizar">Finalizar Mantención / Reparación</MenuItem>
                                </Select>
                            </FormControl>

                            {mostrarMantencion && accionMantencion === 'iniciar' && (
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Alert severity="info">
                                        Al iniciar una mantención, el estado del producto cambiará a <strong>{tipoMantencion === 'REPARACION' ? 'EN REPARACIÓN' : 'EN MANTENCIÓN'}</strong>
                                    </Alert>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Tipo</InputLabel>
                                        <Select
                                            value={tipoMantencion}
                                            onChange={(e) => setTipoMantencion(e.target.value)}
                                            label="Tipo"
                                            disabled={loading}
                                        >
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
                                        disabled={loading}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Responsable *"
                                        value={responsableMantencion}
                                        onChange={(e) => setResponsableMantencion(e.target.value)}
                                        size="small"
                                        placeholder="Nombre del responsable"
                                        disabled={loading}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Descripción del trabajo *"
                                        value={descripcionMantencion}
                                        onChange={(e) => setDescripcionMantencion(e.target.value)}
                                        multiline
                                        rows={3}
                                        size="small"
                                        placeholder="Describa el trabajo a realizar..."
                                        disabled={loading}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        label="Costo estimado (opcional)"
                                        value={costoMantencion}
                                        onChange={(e) => setCostoMantencion(e.target.value)}
                                        type="number"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                        size="small"
                                        inputProps={{ min: 0, step: 100 }}
                                        disabled={loading}
                                    />
                                </Stack>
                            )}

                            {mostrarMantencion && accionMantencion === 'finalizar' && (
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <Alert severity="info">
                                        Al finalizar la mantención, el estado del producto volverá a <strong>DISPONIBLE</strong>
                                    </Alert>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha de término *"
                                        value={fechaTerminoMantencion}
                                        onChange={(e) => setFechaTerminoMantencion(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                        disabled={loading}
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
                                        placeholder="Ingrese observaciones sobre la mantención finalizada..."
                                        disabled={loading}
                                    />
                                </Stack>
                            )}
                        </Grid>

                        {historialMantenciones.length > 0 && (
                            <Grid item xs={12}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <HistoryIcon sx={{ color: colors.info }} />
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                Historial de Mantenciones ({historialMantenciones.length})
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <HistorialMantenciones mantenciones={historialMantenciones} />
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Historial de Uso
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                startIcon={<PersonIcon />}
                                onClick={() => setShowHistorial(true)}
                                fullWidth
                                disabled={loading}
                                sx={{ 
                                    borderColor: colors.info,
                                    color: colors.info,
                                    '&:hover': { borderColor: colors.info, backgroundColor: alpha(colors.info, 0.05) }
                                }}
                            >
                                {historialUso.length > 0 
                                    ? `Editar historial de uso (${historialUso.length} registros)`
                                    : 'Agregar historial de uso'}
                            </Button>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Detalles del Producto
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Marca"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Modelo"
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Documentos
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="N° Orden de Compra"
                                name="oc_numero"
                                value={formData.oc_numero}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="N° Factura"
                                name="factura_numero"
                                value={formData.factura_numero}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
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

                        {historialUso.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                    Historial de uso registrado
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1}>
                                    {historialUso.map((reg, idx) => (
                                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, bgcolor: alpha(colors.info, 0.03) }}>
                                            <Typography variant="body2">
                                                <strong>{reg.nombre_persona || reg.nombre_usuario}</strong>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(reg.fecha_asignacion).toLocaleDateString()} → {new Date(reg.fecha_devolucion).toLocaleDateString()}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={handleClose} 
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Productos = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
    const navigate = useNavigate();
    
    // Estados para productos y carga
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Estados para búsqueda y filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({
    estado: '',
    condicion: '',
    bodega_id: ''
});
    
    // Estados para datos auxiliares
    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [condiciones] = useState(['NUEVO', 'USADO', 'REACONDICIONADO']);
    
    // Estados para datos de exportación
    const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
    const [donaciones, setDonaciones] = useState([]);
    const [bajas, setBajas] = useState([]);
    
    // Estados para diálogos
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openDisposicion, setOpenDisposicion] = useState(false);
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
    const [openHistorial, setOpenHistorial] = useState(false);
    const [openAsignacion, setOpenAsignacion] = useState(false);
    
    // Estados para datos seleccionados
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [selectedProductoDetail, setSelectedProductoDetail] = useState(null);
    const [productoParaDisposicion, setProductoParaDisposicion] = useState(null);
    const [productoParaHistorial, setProductoParaHistorial] = useState(null);
    const [productoParaAsignar, setProductoParaAsignar] = useState(null);
    const [historialUso, setHistorialUso] = useState([]);
    const [historialMantenciones, setHistorialMantenciones] = useState([]);
    
    // Estados para UI
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [stats, setStats] = useState({
        totalProductos: 0,
        valorTotal: 0
    });
    const [apiError, setApiError] = useState(false);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };
    

    const loadExportData = async () => {
        try {
            console.log('📥 Cargando datos para exportación...');
            
            const historialResponse = await productosService.getHistorialAsignaciones?.() || [];
            setHistorialAsignaciones(historialResponse);
            
            const disposicionesResponse = await productosService.getHistorialDisposiciones?.() || { donaciones: [], bajas: [] };
            setDonaciones(disposicionesResponse.donaciones || []);
            setBajas(disposicionesResponse.bajas || []);
            
            return {
                historial: historialResponse,
                donaciones: disposicionesResponse.donaciones || [],
                bajas: disposicionesResponse.bajas || []
            };
        } catch (error) {
            console.error('Error cargando datos para exportación:', error);
            return { historial: [], donaciones: [], bajas: [] };
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [marcasData, estadosData, bodegasData] = await Promise.all([
                    productosService.getMarcas(),
                    productosService.getEstados(),
                    productosService.getBodegas()
                ]);
                
                setMarcas(marcasData || []);
                setEstados(estadosData || []);
                setBodegas(bodegasData || []);
                
                await loadExportData();
                
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            }
        };
        
        fetchInitialData();
    }, []);

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        try {
            const filterParams = {};
            
            if (filters.marca) filterParams.marca = filters.marca;
            if (filters.estado) filterParams.estado = filters.estado;
            if (filters.condicion) filterParams.condicion = filters.condicion;
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            
            console.log('📤 Enviando filtros:', filterParams);
            
            const productosData = await productosService.getProductos(searchTerm, filterParams);
            setProductos(productosData);
            
            try {
                const statsData = await productosService.getStats();
                setStats({
                    totalProductos: statsData.totalProductos || 0,
                    valorTotal: statsData.valorTotal || 0
                });
            } catch (statsError) {
                console.warn('⚠️ Error cargando estadísticas:', statsError);
            }
            
            setApiError(false);
            
            if (showRefresh) {
                showSnackbar('Datos actualizados', 'success');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, filters.marca, filters.estado, filters.condicion, filters.bodega_id]);

        const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({
    estado: '',
    condicion: '',
    bodega_id: ''
});
        setPage(0);
    };

    const handleFilterChange = (field) => (event) => {
        setFilters(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleOpenForm = (producto = null) => {
        setSelectedProducto(producto);
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setSelectedProducto(null);
        setOpenForm(false);
        fetchData();
    };

    const handleOpenDetail = async (producto) => {
        try {
            console.log('🔍 Abriendo detalle para producto:', producto.id);
            
            const historialData = await productosService.getHistorialUso(producto.id);
            
            if (historialData && historialData.length > 0) {
                setHistorialUso(historialData);
            } else if (producto.historial_uso && producto.historial_uso.length > 0) {
                setHistorialUso(producto.historial_uso);
            } else {
                setHistorialUso([]);
            }

            if (producto.historial_mantenciones && producto.historial_mantenciones.length > 0) {
                setHistorialMantenciones(producto.historial_mantenciones);
            } else {
                setHistorialMantenciones([]);
            }
            
            setSelectedProductoDetail(producto);
            setOpenDetail(true);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            setHistorialUso(producto.historial_uso || []);
            setHistorialMantenciones(producto.historial_mantenciones || []);
            setSelectedProductoDetail(producto);
            setOpenDetail(true);
        }
    };

    const handleCloseDetail = () => {
        setSelectedProductoDetail(null);
        setHistorialUso([]);
        setHistorialMantenciones([]);
        setOpenDetail(false);
    };

    const handleOpenHistorial = async (producto) => {
        try {
            console.log('🔍 Abriendo historial para producto:', producto.id);
            
            const historialData = await productosService.getHistorialUso(producto.id);
            
            setHistorialUso(historialData.length > 0 ? historialData : (producto.historial_uso || []));
            setProductoParaHistorial(producto);
            setOpenHistorial(true);
        } catch (error) {
            console.error('Error cargando historial:', error);
            showSnackbar('Error al cargar el historial', 'error');
        }
    };

    const handleCloseHistorial = () => {
        setProductoParaHistorial(null);
        setHistorialUso([]);
        setOpenHistorial(false);
    };

    const handleOpenDisposicion = (producto) => {
        setSelectedProducto(producto);
        setProductoParaDisposicion(producto);
        setOpenDisposicion(true);
    };

    const handleCloseDisposicion = () => {
        setSelectedProducto(null);
        setProductoParaDisposicion(null);
        setOpenDisposicion(false);
        fetchData();
    };

    const handleDisposicionSuccess = (message) => {
        showSnackbar(message, 'success');
        handleCloseDisposicion();
        fetchData();
    };

    const handleOpenAsignacion = (producto) => {
        if (producto.estado !== 'DISPONIBLE') {
            showSnackbar(`No se puede asignar. El producto está ${producto.estado}`, 'warning');
            return;
        }
        setProductoParaAsignar(producto);
        setOpenAsignacion(true);
    };

    const handleCloseAsignacion = () => {
        setProductoParaAsignar(null);
        setOpenAsignacion(false);
    };

    const handleAsignacionSuccess = (message, productoActualizado) => {
        showSnackbar(message, 'success');
        handleCloseAsignacion();
        
        if (productoActualizado) {
            setProductos(prevProductos => 
                prevProductos.map(p => 
                    p.id === productoActualizado.id ? { ...p, ...productoActualizado } : p
                )
            );
        }
        
        fetchData();
        loadExportData();
    };

    const handleSaveProducto = async (productoData) => {
        console.log('✅ Producto guardado, productoData recibido:', productoData);
        handleCloseForm();
        
        setTimeout(async () => {
            await fetchData(true);
            await loadExportData();
            
            try {
                const newStats = await productosService.getStats();
                console.log('📊 Nuevas estadísticas:', newStats);
                setStats({
                    totalProductos: newStats.totalProductos || 0,
                    valorTotal: newStats.valorTotal || 0
                });
            } catch (error) {
                console.warn('Error actualizando estadísticas:', error);
            }
        }, 500);
        
        showSnackbar('Producto guardado correctamente', 'success');
    };

    const handleDelete = async () => {
        if (!selectedProducto) return;
        
        try {
            await productosService.deleteProducto(selectedProducto.id);
            showSnackbar('Producto eliminado', 'success');
            await fetchData();
            await loadExportData();
        } catch (error) {
            console.error('Error eliminando:', error);
            showSnackbar('Error al eliminar el producto', 'error');
        }
    };

    const handleEliminarDonar = (producto) => {
        setSelectedProducto(producto);
        setProductoParaDisposicion(producto);
        setOpenDisposicion(true);
    };

    const handleRefresh = () => {
        fetchData(true);
        loadExportData();
    };

    const handleExportExcel = async () => {
        try {
            showSnackbar('Preparando exportación...', 'info');
            
            await loadExportData();
            
            const exportData = {
                productos: productos,
                historialAsignaciones: historialAsignaciones,
                donaciones: donaciones,
                bajas: bajas,
                bodegas: bodegas
            };
            
            const filename = `inventario_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
            const result = exportService.exportToExcel(exportData, filename);
            
            if (result.success) {
                showSnackbar('Reporte exportado exitosamente (4 hojas)', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error exportando:', error);
            showSnackbar('Error al exportar reporte', 'error');
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getImageUrl = (imagenPath) => {
        if (!imagenPath) return null;
        if (imagenPath.startsWith('http')) return imagenPath;
        if (imagenPath.startsWith('/uploads/')) return `http://localhost:98${imagenPath}`;
        return `http://localhost:98/uploads/${imagenPath}`;
    };

// ============================================
// FILTROS CORREGIDOS
// ============================================

const filteredProductos = productos.filter((producto) => {

    // FILTRO POR ESTADO
    if (filters.estado && producto.estado !== filters.estado) {
        return false;
    }

    // FILTRO POR CONDICION
    if (filters.condicion && producto.condicion !== filters.condicion) {
        return false;
    }

    // FILTRO POR BODEGA
    if (filters.bodega_id && producto.bodega_id !== Number(filters.bodega_id)) {
        return false;
    }

    // BUSCADOR GENERAL
    if (searchTerm && searchTerm.trim() !== '') {

        const term = searchTerm.toLowerCase().trim();

        const nombre = (producto.nombre || '').toLowerCase();
        const marca = (producto.marca || '').toLowerCase();
        const modelo = (producto.modelo || '').toLowerCase();

        const numeroSerie =
            (producto.numero_serie ||
            producto.numeroSerie ||
            producto.serial ||
            producto.serie ||
            '').toLowerCase();

        const codigo = (producto.codigo || '').toLowerCase();

        if (
            !nombre.includes(term) &&
            !marca.includes(term) &&
            !modelo.includes(term) &&
            !numeroSerie.includes(term) &&
            !codigo.includes(term)
        ) {
            return false;
        }
    }

    return true;
});

    const paginatedProductos = filteredProductos.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const getEstadoColor = (estado) => {
        const colores = {
            'DISPONIBLE': colors.success,
            'ASIGNADO': colors.info,
            'EN MANTENCIÓN': colors.warning,
            'EN REPARACIÓN': colors.warning,
            'NO DISPONIBLE': colors.error
        };
        return colores[estado] || colors.text.secondary;
    };

    const getEstadoIcon = (estado) => {
        const iconos = {
            'DISPONIBLE': <CheckCircleOutlineIcon fontSize="small" />,
            'ASIGNADO': <AssignmentIcon fontSize="small" />,
            'EN MANTENCIÓN': <BuildIcon fontSize="small" />,
            'EN REPARACIÓN': <HandymanIcon fontSize="small" />,
            'NO DISPONIBLE': <DeleteForeverIcon fontSize="small" />
        };
        return iconos[estado] || <InventoryIcon fontSize="small" />;
    };

        const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length + (searchTerm ? 1 : 0);
    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                    bgcolor: colors.surface, 
                    color: colors.text.primary,
                    borderBottom: `1px solid ${colors.border}`
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleGoHome}
                        sx={{ mr: 2 }}
                    >
                        <HomeIcon />
                    </IconButton>
                    <InventoryIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Gestión de Productos
                    </Typography>
                    <Tooltip title="Exportar a Excel">
                        <IconButton color="inherit" onClick={handleExportExcel} sx={{ mr: 1 }}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper
                    sx={{
                        p: { xs: 3, md: 4 },
                        mb: 4,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        color: 'white',
                    }}
                >
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Gestión de Productos
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Administra el inventario de productos únicos por número de serie
                    </Typography>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <GradientButton
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenForm()}
                            disabled={loading}
                        >
                            Nuevo Producto
                        </GradientButton>
                        
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExportExcel}
                            sx={{
                                borderColor: 'white',
                                color: 'white',
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Exportar Reporte
                        </Button>
                    </Stack>

                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 3 }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={handleRefresh}>
                                REINTENTAR
                            </Button>
                        }>
                            No se pudo conectar con el servidor.
                        </Alert>
                    )}
                </Paper>

                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={6}>
                        <StyledCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48 }}>
                                        <InventoryIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                                    {loading ? <CircularProgress size={24} /> : stats.totalProductos}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Total Productos
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                    ({productos.filter(p => p.estado === 'DISPONIBLE').length} disponibles, {' '}
                                    {productos.filter(p => p.estado === 'ASIGNADO').length} asignados)
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={6}>
                        <StyledCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Avatar sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, width: 48, height: 48 }}>
                                        <AttachMoneyIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                                    {loading ? <CircularProgress size={24} /> : `$${stats.valorTotal.toLocaleString('es-CL')}`}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Valor Total
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={4} md={2}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color={colors.warning}>
                                {productos.filter(p => p.estado === 'EN MANTENCIÓN' || p.estado === 'EN REPARACIÓN').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                En Mantención
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={4} md={2}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color={colors.error}>
                                {productos.filter(p => p.estado === 'NO DISPONIBLE' || p.fecha_baja || p.fecha_donacion).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                No Disponibles
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={4} md={2}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color={colors.error}>
                                {productos.filter(p => p.fecha_baja).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Dados de Baja
                            </Typography>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={4} md={2}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color={colors.success}>
                                {productos.filter(p => p.fecha_donacion).length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Donados
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <FilterPaper className="filter-paper">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, marca, serie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6B7280' }} /></InputAdornment>,
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
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Button
                                fullWidth
                                variant={showAdvancedFilters ? "contained" : "outlined"}
                                startIcon={showAdvancedFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="filter-button"
                                color={showAdvancedFilters ? "primary" : "inherit"}
                            >
                                {showAdvancedFilters ? 'Ocultar filtros' : 'Filtros avanzados'}
                                {activeFiltersCount > 0 && (
                                    <Chip
                                        size="small"
                                        label={activeFiltersCount}
                                        sx={{ ml: 1, bgcolor: colors.primary, color: 'white', height: 24 }}
                                    />
                                )}
                            </Button>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<FilterListOffIcon />}
                                onClick={handleClearFilters}
                                disabled={!searchTerm && activeFiltersCount === 0}
                                className="filter-button"
                            >
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>

<Collapse in={showAdvancedFilters}>
    <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" className="filters-title">
            FILTROS AVANZADOS
        </Typography>

        <Grid container spacing={2}>

            {/* FILTRO ESTADO */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                    <InputLabel id="estado-label">Estado</InputLabel>
                    <Select
                        labelId="estado-label"
                        value={filters.estado}
                        onChange={handleFilterChange('estado')}
                        label="Estado"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {estados.map((estado) => (
                            <MenuItem key={estado.id} value={estado.nombre}>
                                {estado.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/* FILTRO CONDICION */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                    <InputLabel id="condicion-label">Condición</InputLabel>
                    <Select
                        labelId="condicion-label"
                        value={filters.condicion}
                        onChange={handleFilterChange('condicion')}
                        label="Condición"
                    >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="Nuevo">Nuevo</MenuItem>
                        <MenuItem value="Usado">Usado</MenuItem>
                        <MenuItem value="Reparacion">Reparación</MenuItem>
                        <MenuItem value="Dañado">Dañado</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {/* FILTRO BODEGA */}
            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                    <InputLabel id="bodega-label">Bodega</InputLabel>
                    <Select
                        labelId="bodega-label"
                        value={filters.bodega_id}
                        onChange={handleFilterChange('bodega_id')}
                        label="Bodega"
                    >
                        <MenuItem value="">Todas</MenuItem>
                        {bodegas.map((bodega) => (
                            <MenuItem key={bodega.id} value={bodega.id}>
                                {bodega.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

        </Grid>
    </Box>
</Collapse>
                </FilterPaper>

                <StyledTableContainer>
                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Producto</StyledTableCell>
                                <StyledTableCell>Marca</StyledTableCell>
                                <StyledTableCell>N° Serie</StyledTableCell>
                                <StyledTableCell>Precio</StyledTableCell>
                                <StyledTableCell>Bodega</StyledTableCell>
                                <StyledTableCell>Condición</StyledTableCell>
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Cargando productos...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedProductos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No hay productos
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenForm()}
                                        >
                                            Crear Producto
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const bodegaEncontrada = bodegas.find(b => b.id === producto.bodega_id);
                                    const bodegaNombre = bodegaEncontrada?.nombre || producto.bodega_nombre || 'Sin asignar';
                                    const disponible = producto.estado === 'DISPONIBLE';
                                    
                                    return (
                                        <TableRow key={producto.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar 
                                                        src={getImageUrl(producto.imagen_path)} 
                                                        sx={{ width: 32, height: 32 }}
                                                    >
                                                        <ImageIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {producto.nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ID: {producto.id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{producto.marca || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<QrCodeIcon fontSize="small" />}
                                                    label={producto.numero_serie || 'N/A'}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: alpha(colors.primary, 0.1),
                                                        color: colors.primary,
                                                        fontFamily: 'monospace'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>${(producto.precio || 0).toLocaleString('es-CL')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<StoreIcon />}
                                                    label={bodegaNombre}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: alpha(colors.info, 0.1),
                                                        color: colors.info,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={producto.condicion || 'NUEVO'}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? 
                                                            alpha(colors.warning, 0.1) : alpha(colors.success, 0.1),
                                                        color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? 
                                                            colors.warning : colors.success,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getEstadoIcon(producto.estado)}
                                                    label={producto.estado}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: alpha(getEstadoColor(producto.estado), 0.1), 
                                                        color: getEstadoColor(producto.estado),
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Ver detalles">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenDetail(producto)}
                                                            sx={{ color: colors.info }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Editar">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenForm(producto)}
                                                            sx={{ color: colors.primary }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Asignar a colaborador">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenAsignacion(producto)}
                                                            disabled={!disponible}
                                                            sx={{ color: colors.success }}
                                                        >
                                                            <AssignmentIndIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Ver historial de uso">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenHistorial(producto)}
                                                            sx={{ color: colors.secondary }}
                                                        >
                                                            <HistoryIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Eliminar/Donar">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleEliminarDonar(producto)}
                                                            sx={{ color: colors.error }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredProductos.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                    />
                </StyledTableContainer>

                <ProductoDetailDialog
                    open={openDetail}
                    onClose={handleCloseDetail}
                    producto={selectedProductoDetail}
                    getImageUrl={getImageUrl}
                    historialUso={historialUso}
                    historialMantenciones={historialMantenciones}
                />

                <ProductoForm
                    open={openForm}
                    onClose={handleCloseForm}
                    producto={selectedProducto}
                    onSave={handleSaveProducto}
                />

                <DisposicionDialog
                    open={openDisposicion}
                    onClose={handleCloseDisposicion}
                    producto={productoParaDisposicion}
                    onSuccess={handleDisposicionSuccess}
                />

                <ConfirmDeleteDialog
                    open={openConfirmDelete}
                    onClose={() => setOpenConfirmDelete(false)}
                    producto={selectedProducto}
                    onConfirm={handleDelete}
                />

                <HistorialUsoDialog
                    open={openHistorial}
                    onClose={handleCloseHistorial}
                    producto={productoParaHistorial}
                    historial={historialUso}
                />

                <AsignacionColaboradorDialog
                    open={openAsignacion}
                    onClose={handleCloseAsignacion}
                    producto={productoParaAsignar}
                    onSuccess={handleAsignacionSuccess}
                />

                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity}
                        sx={{ borderRadius: 2 }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default Productos;