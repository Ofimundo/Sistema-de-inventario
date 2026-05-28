// src/pages/AsignacionPage.jsx - VERSIÓN CORREGIDA (SIN PANTALLA EN BLANCO)
import React, { useState, useEffect, useCallback } from 'react';
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
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    Home as HomeIcon,
    FilterListOff as FilterListOffIcon,
    Store as StoreIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AsignacionCompletaDialog from '../components/AsignacionCompletaDialog';
import RecepcionDialog from '../components/RecepcionDialog';
import PrestamoDialog from '../components/PrestamoDialog';

// ============================================
// COLORES
// ============================================
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

// Mapa de estados
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5,
    BAJA: 6
};

const ESTADO_TEXTO = {
    1: 'DISPONIBLE',
    2: 'ASIGNADO',
    3: 'EN MANTENCIÓN',
    4: 'EN REPARACIÓN',
    5: 'NO DISPONIBLE',
    6: 'BAJA'
};

const ESTADO_COLOR = {
    1: '#10B981',
    2: '#F59E0B',
    3: '#3B82F6',
    4: '#EF4444',
    5: '#6B7280',
    6: '#9CA3AF'
};

const getEstadoTexto = (estadoId) => {
    const id = Number(estadoId);
    return ESTADO_TEXTO[id] || 'DESCONOCIDO';
};

const getEstadoColor = (estadoId) => {
    const id = Number(estadoId);
    return ESTADO_COLOR[id] || '#6B7280';
};

// URL BASE para descargas
const API_BASE_URL = 'https://sistema-inventario-backend-p3xg.onrender.com';

// ============================================
// COMPONENTES STYLED
// ============================================
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: 0,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${colors.border}`,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    borderRadius: 0,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${colors.border}`,
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    borderRadius: 0,
    border: `1px solid ${colors.border}`,
    overflowX: 'auto',
    backgroundColor: theme.palette.background.paper,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: alpha(colors.primary, 0.02),
    borderBottom: `1px solid ${colors.border}`,
}));

// ============================================
// COMPONENTE DE DETALLES
// ============================================
const DetallesDialog = ({ open, onClose, asignacion, producto }) => {
    const [downloading, setDownloading] = useState(false);

    const esPrestamo = asignacion?.es_prestamo === true || asignacion?.es_prestamo === 1;

    const handleDescargarDocumento = async (filename, tipo) => {
        if (!filename || downloading) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${filename}`;
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando:', error);
            alert(`Error al descargar el ${tipo}`);
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1) }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary }}>
                            <AssignmentIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            Detalles de {esPrestamo ? 'Préstamo' : 'Asignación'}
                        </Typography>
                        {esPrestamo && (
                            <Chip label="PRÉSTAMO" size="small" sx={{ bgcolor: colors.warning, color: 'white' }} />
                        )}
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <InventoryIcon fontSize="small" color="primary" />
                                Información del Equipo
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">Producto:</Typography><Typography variant="body2">{producto?.nombre || asignacion?.producto_nombre}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">N° Serie:</Typography><Typography variant="body2">{producto?.numero_serie || asignacion?.numero_serie || 'N/A'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Marca:</Typography><Typography variant="body2">{producto?.marca || asignacion?.marca || '-'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Modelo:</Typography><Typography variant="body2">{producto?.modelo || asignacion?.modelo || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                <PersonIcon fontSize="small" color="success" />
                                Información del Colaborador
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">Nombre:</Typography><Typography variant="body2">{asignacion?.colaborador_nombre}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">RUT:</Typography><Typography variant="body2">{asignacion?.colaborador_rut || '-'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Cargo:</Typography><Typography variant="body2">{asignacion?.colaborador_cargo || '-'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Departamento:</Typography><Typography variant="body2">{asignacion?.colaborador_departamento || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Detalles de la Operación
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">ID:</Typography><Typography variant="body2" fontFamily="monospace">{asignacion?.id}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Fecha:</Typography><Typography variant="body2">{new Date(asignacion?.fecha_asignacion).toLocaleDateString()}</Typography></Grid>
                                <Grid item xs={12}><Typography variant="caption">Motivo:</Typography><Typography variant="body2">{asignacion?.motivo || '-'}</Typography></Grid>
                                <Grid item xs={12}><Typography variant="caption">Observaciones:</Typography><Typography variant="body2">{asignacion?.observaciones || '-'}</Typography></Grid>
                                {asignacion?.fecha_devolucion && (
                                    <>
                                        <Grid item xs={6}><Typography variant="caption">Devolución:</Typography><Typography variant="body2">{new Date(asignacion.fecha_devolucion).toLocaleDateString()}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="caption">Condición:</Typography><Typography variant="body2">{asignacion?.condicion_entrega || '-'}</Typography></Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>

                    {!esPrestamo && (
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom display="flex" alignItems="center" gap={1}>
                                    <DescriptionIcon fontSize="small" color="info" />
                                    Documentos Asociados
                                </Typography>
                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<PdfIcon sx={{ color: '#f44336' }} />}
                                        onClick={() => handleDescargarDocumento(`acta_asignacion_${asignacion?.id}.pdf`, "Acta de Asignación")}
                                        disabled={downloading}
                                        sx={{ borderRadius: 0 }}
                                    >
                                        Acta Asignación
                                    </Button>
                                    {asignacion?.fecha_devolucion && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<PdfIcon sx={{ color: '#f44336' }} />}
                                            onClick={() => handleDescargarDocumento(`acta_recepcion_${asignacion?.id}.pdf`, "Acta de Recepción")}
                                            disabled={downloading}
                                            sx={{ borderRadius: 0 }}
                                        >
                                            Acta Recepción
                                        </Button>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    )}

                    {esPrestamo && (
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 0 }}>
                                <Typography variant="body2">
                                    <strong>ℹ️ Préstamo:</strong> Este registro no tiene documentos asociados.
                                </Typography>
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ borderRadius: 0 }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================
// SERVICIOS LOCALES
// ============================================
const productosServiceLocal = {
    getProductos: async (searchTerm = '', filters = {}) => {
        try {
            let url = '/productos';
            const params = new URLSearchParams();
            
            if (searchTerm) params.append('search', searchTerm);
            if (filters.bodega_id) params.append('bodega_id', filters.bodega_id);
            
            if (params.toString()) url += `?${params.toString()}`;
            
            const response = await api.get(url);
            return response.data.data || response.data || [];
        } catch (error) {
            console.error('Error fetching productos:', error);
            throw error;
        }
    },
    
    getBodegas: async () => {
        try {
            const response = await api.get('/bodegas');
            return response.data.data || response.data || [];
        } catch (error) {
            console.error('Error fetching bodegas:', error);
            return [];
        }
    }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const AsignacionPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    
    const [productos, setProductos] = useState([]);
    const [asignacionesActivas, setAsignacionesActivas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ bodega_id: '', tipo_estado: 'todos' });
    const [bodegas, setBodegas] = useState([]);
    const [openAsignacion, setOpenAsignacion] = useState(false);
    const [openRecepcion, setOpenRecepcion] = useState(false);
    const [openPrestamo, setOpenPrestamo] = useState(false);
    const [openDetalles, setOpenDetalles] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [apiError, setApiError] = useState(false);
    const [downloadingDoc, setDownloadingDoc] = useState(false);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    const handleDescargarDocumento = async (asignacionId, tipo) => {
        setDownloadingDoc(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/asignaciones/buscar-documento/${asignacionId}/${tipo}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.filename) {
                    const downloadResponse = await fetch(`${API_BASE_URL}/api/asignaciones/descargar/${data.filename}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const blob = await downloadResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = data.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    showSnackbar(`Documento descargado correctamente`, 'success');
                } else {
                    showSnackbar(`No se encontró el documento`, 'warning');
                }
            } else {
                showSnackbar(`No se pudo descargar el documento`, 'warning');
            }
        } catch (error) {
            console.error('Error descargando documento:', error);
            showSnackbar(`Error al descargar el documento`, 'error');
        } finally {
            setTimeout(() => setDownloadingDoc(false), 1000);
        }
    };

    // Función principal para cargar datos
    const fetchData = useCallback(async (showRefresh = false) => {
        // No ocultar la tabla durante el refresco para evitar pantalla en blanco
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        setApiError(false);

        try {
            const filterParams = {};
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            
            console.log('📤 Cargando productos...');
            const productosData = await productosServiceLocal.getProductos(searchTerm, filterParams);
            
            let todosLosProductos = [];
            if (productosData && Array.isArray(productosData)) {
                todosLosProductos = productosData;
            } else if (productosData && productosData.data && Array.isArray(productosData.data)) {
                todosLosProductos = productosData.data;
            }
            
            const productosProcesados = todosLosProductos.map(p => ({
                ...p,
                id_estado_equipo: Number(p.id_estado_equipo) || 1,
            }));
            
            const productosFiltrados = productosProcesados.filter(p => p.id_estado_equipo !== 6);
            setProductos(productosFiltrados);
            
            // Cargar asignaciones activas
            try {
                const asignacionesResponse = await api.get('/asignaciones/activas');
                
                let asignaciones = [];
                if (asignacionesResponse.data) {
                    if (asignacionesResponse.data.success && Array.isArray(asignacionesResponse.data.data)) {
                        asignaciones = asignacionesResponse.data.data;
                    } else if (Array.isArray(asignacionesResponse.data)) {
                        asignaciones = asignacionesResponse.data;
                    }
                }
                
                const activas = asignaciones.filter(a => !a.fecha_devolucion);
                setAsignacionesActivas(activas);
                console.log(`✅ ${activas.length} asignaciones activas encontradas`);
            } catch (err) {
                console.error('Error cargando asignaciones:', err);
                // Mantener datos anteriores en caso de error
            }
            
            // Cargar bodegas
            try {
                const bodegasData = await productosServiceLocal.getBodegas();
                setBodegas(bodegasData || []);
            } catch (err) {
                console.error('Error cargando bodegas:', err);
            }
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchTerm, filters.bodega_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Función de refresco - NO muestra loading para evitar pantalla en blanco
    const refreshData = async () => {
        console.log('🔄 Refrescando datos después de operación...');
        setRefreshing(true);
        try {
            const filterParams = {};
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            
            // Cargar productos en segundo plano
            const productosData = await productosServiceLocal.getProductos(searchTerm, filterParams);
            
            let todosLosProductos = [];
            if (productosData && Array.isArray(productosData)) {
                todosLosProductos = productosData;
            } else if (productosData && productosData.data && Array.isArray(productosData.data)) {
                todosLosProductos = productosData.data;
            }
            
            const productosProcesados = todosLosProductos.map(p => ({
                ...p,
                id_estado_equipo: Number(p.id_estado_equipo) || 1,
            }));
            
            const productosFiltrados = productosProcesados.filter(p => p.id_estado_equipo !== 6);
            setProductos(productosFiltrados);
            
            // Cargar asignaciones activas
            const asignacionesResponse = await api.get('/asignaciones/activas');
            let asignaciones = [];
            if (asignacionesResponse.data) {
                if (asignacionesResponse.data.success && Array.isArray(asignacionesResponse.data.data)) {
                    asignaciones = asignacionesResponse.data.data;
                } else if (Array.isArray(asignacionesResponse.data)) {
                    asignaciones = asignacionesResponse.data;
                }
            }
            const activas = asignaciones.filter(a => !a.fecha_devolucion);
            setAsignacionesActivas(activas);
            
        } catch (error) {
            console.error('Error refrescando datos:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleAsignar = (producto) => {
        if (producto.id_estado_equipo !== 1) {
            showSnackbar(`Este producto no está disponible para asignación. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning');
            return;
        }
        setProductoSeleccionado(producto);
        setOpenAsignacion(true);
    };

    const handlePrestamo = (producto) => {
        if (producto.id_estado_equipo !== 1) {
            showSnackbar(`Este producto no está disponible para préstamo. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning');
            return;
        }
        setProductoSeleccionado(producto);
        setOpenPrestamo(true);
    };

    const handleRecibir = (producto) => {
        const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
        
        if (!asignacionActiva) {
            showSnackbar('No se encontró una asignación activa para este producto', 'error');
            return;
        }
        
        setProductoSeleccionado(producto);
        setAsignacionSeleccionada(asignacionActiva);
        setOpenRecepcion(true);
    };

    const handleVerDetalles = (producto) => {
        const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
        if (asignacionActiva) {
            setAsignacionSeleccionada(asignacionActiva);
            setProductoSeleccionado(producto);
            setOpenDetalles(true);
        } else {
            showSnackbar('No hay información de asignación para este producto', 'info');
        }
    };

    // Handlers - Cierran diálogos y refrescan datos
    const handleAsignacionSuccess = () => {
        showSnackbar('Asignación completada exitosamente', 'success');
        setOpenAsignacion(false);
        setProductoSeleccionado(null);
        refreshData();
    };

    const handlePrestamoSuccess = () => {
        showSnackbar('Préstamo registrado exitosamente', 'success');
        setOpenPrestamo(false);
        setProductoSeleccionado(null);
        refreshData();
    };

    const handleRecepcionSuccess = () => {
        showSnackbar('Recepción completada exitosamente', 'success');
        setOpenRecepcion(false);
        setProductoSeleccionado(null);
        setAsignacionSeleccionada(null);
        refreshData();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({ bodega_id: '', tipo_estado: 'todos' });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleTipoEstadoChange = (event, newValue) => {
        if (newValue !== null) {
            setFilters({ ...filters, tipo_estado: newValue });
            setPage(0);
        }
    };

    const getAsignacionActiva = (productoId) => {
        return asignacionesActivas.find(a => a.producto_id === productoId);
    };

    const filteredProductos = productos.filter(producto => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = (
                producto.nombre?.toLowerCase().includes(term) ||
                producto.marca?.toLowerCase().includes(term) ||
                producto.numero_serie?.toLowerCase().includes(term) ||
                (producto.modelo && producto.modelo.toLowerCase().includes(term))
            );
            if (!matchesSearch) return false;
        }
        
        const asignacionActiva = getAsignacionActiva(producto.id);
        const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
        
        switch (filters.tipo_estado) {
            case 'disponibles':
                return producto.id_estado_equipo === 1;
            case 'asignados':
                return producto.id_estado_equipo === 2 && !esPrestamo;
            case 'prestamos':
                return producto.id_estado_equipo === 2 && esPrestamo;
            default:
                return true;
        }
    });

    const paginatedProductos = filteredProductos.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const activeFiltersCount = (filters.bodega_id ? 1 : 0) + (filters.tipo_estado !== 'todos' ? 1 : 0) + (searchTerm ? 1 : 0);

    const totalDisponibles = productos.filter(p => p.id_estado_equipo === 1).length;
    const totalAsignados = productos.filter(p => p.id_estado_equipo === 2).length;
    const totalPrestamos = asignacionesActivas.filter(a => a.es_prestamo === true || a.es_prestamo === 1).length;
    const totalAsignacionesNormales = asignacionesActivas.filter(a => !(a.es_prestamo === true || a.es_prestamo === 1)).length;

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleGoHome} sx={{ mr: 2 }}>
                        <HomeIcon />
                    </IconButton>
                    <AssignmentIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Gestión de Asignaciones con Firma Digital
                    </Typography>
                    <IconButton color="inherit" onClick={() => refreshData()} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Gestión de Asignaciones con Firma Digital
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Asigna productos a colaboradores con firma digital y control de inventario
                    </Typography>
                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 3, borderRadius: 0 }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={() => refreshData()} sx={{ borderRadius: 0 }}>REINTENTAR</Button>
                        }>
                            No se pudo conectar con el servidor. Verifica tu conexión.
                        </Alert>
                    )}
                </Paper>

                {/* Stats Cards */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 48, height: 48, mb: 1 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalDisponibles}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Productos Disponibles</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48, mb: 1 }}>
                                    <AssignmentIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalAsignacionesNormales}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Asignaciones Activas</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 48, height: 48, mb: 1 }}>
                                    <PersonIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalPrestamos}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Préstamos Activos</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.error, 0.1), color: colors.error, width: 48, height: 48, mb: 1 }}>
                                    <InventoryIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalAsignados}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Asignados</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Filtros */}
                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, marca, modelo o número de serie..."
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
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Bodega</InputLabel>
                                <Select value={filters.bodega_id} onChange={(e) => setFilters({ ...filters, bodega_id: e.target.value })} label="Bodega">
                                    <MenuItem value="">Todas</MenuItem>
                                    {bodegas.map((b) => (<MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <ToggleButtonGroup
                                value={filters.tipo_estado}
                                exclusive
                                onChange={handleTipoEstadoChange}
                                size="small"
                                fullWidth
                                sx={{ height: 40 }}
                            >
                                <ToggleButton value="todos" sx={{ borderRadius: 0, textTransform: 'none' }}>Todos</ToggleButton>
                                <ToggleButton value="disponibles" sx={{ borderRadius: 0, textTransform: 'none' }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, color: colors.success }} />
                                    Disponibles
                                </ToggleButton>
                                <ToggleButton value="asignados" sx={{ borderRadius: 0, textTransform: 'none' }}>
                                    <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: colors.primary }} />
                                    Asignados
                                </ToggleButton>
                                <ToggleButton value="prestamos" sx={{ borderRadius: 0, textTransform: 'none' }}>
                                    <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: colors.warning }} />
                                    Préstamos
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Button fullWidth variant="outlined" color="error" startIcon={<FilterListOffIcon />} onClick={handleClearFilters} disabled={activeFiltersCount === 0} sx={{ borderRadius: 0 }}>
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>
                </FilterPaper>

                {/* Tabla de Productos */}
                <StyledTableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Producto</StyledTableCell>
                                <StyledTableCell>Marca</StyledTableCell>
                                <StyledTableCell>Modelo</StyledTableCell>
                                <StyledTableCell>N° Serie</StyledTableCell>
                                <StyledTableCell>Bodega</StyledTableCell>
                                <StyledTableCell>Condición</StyledTableCell>
                                <StyledTableCell>Estado / Tipo</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center"><CircularProgress /><Typography sx={{ mt: 2 }}>Cargando productos...</Typography></TableCell></TableRow>
                            ) : paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography><Typography variant="body2" color="text.secondary">No se encontraron productos con los filtros aplicados</Typography></TableCell></TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const asignacionActiva = getAsignacionActiva(producto.id);
                                    const estaDisponible = producto.id_estado_equipo === 1;
                                    const estaAsignado = producto.id_estado_equipo === 2;
                                    const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
                                    
                                    return (
                                        <TableRow key={producto.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1) }}>
                                                        <InventoryIcon sx={{ fontSize: 16 }} />
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight={500}>{producto.nombre}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{producto.marca || '-'}</TableCell>
                                            <TableCell>{producto.modelo || '-'}</TableCell>
                                            <TableCell><Chip label={producto.numero_serie || 'N/A'} size="small" variant="outlined" /></TableCell>
                                            <TableCell><Chip icon={<StoreIcon />} label={producto.bodega_nombre || 'Sin bodega'} size="small" sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} /></TableCell>
                                            <TableCell><Chip label={producto.condicion || 'NUEVO'} size="small" sx={{ backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? alpha(colors.warning, 0.1) : alpha(colors.success, 0.1), color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? colors.warning : colors.success }} /></TableCell>
                                            <TableCell>
                                                <Stack direction="column" spacing={0.5}>
                                                    <Chip label={getEstadoTexto(producto.id_estado_equipo)} size="small" sx={{ backgroundColor: alpha(getEstadoColor(producto.id_estado_equipo), 0.1), color: getEstadoColor(producto.id_estado_equipo), fontWeight: 500, fontSize: '0.7rem' }} />
                                                    {asignacionActiva && (
                                                        <Chip icon={esPrestamo ? <PersonIcon sx={{ fontSize: 12 }} /> : <AssignmentIcon sx={{ fontSize: 12 }} />} label={esPrestamo ? "PRÉSTAMO" : "ASIGNACIÓN"} size="small" sx={{ backgroundColor: esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1), color: esPrestamo ? colors.warning : colors.primary, fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {asignacionActiva ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(esPrestamo ? colors.warning : colors.success, 0.1) }}><PersonIcon sx={{ fontSize: 14 }} /></Avatar>
                                                        <Typography variant="body2">{asignacionActiva.colaborador_nombre}</Typography>
                                                    </Box>
                                                ) : (<Typography variant="body2" color="text.secondary">-</Typography>)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                                    {estaDisponible ? (
                                                        <>
                                                            <Tooltip title="Asignar producto (con documento)">
                                                                <Button variant="contained" size="small" startIcon={<AssignmentIcon />} onClick={() => handleAsignar(producto)} sx={{ bgcolor: colors.primary, borderRadius: 0, minWidth: 80 }}>Asignar</Button>
                                                            </Tooltip>
                                                            <Tooltip title="Préstamo (sin documento)">
                                                                <Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={() => handlePrestamo(producto)} sx={{ borderRadius: 0, borderColor: colors.warning, color: colors.warning, minWidth: 80 }}>Préstamo</Button>
                                                            </Tooltip>
                                                        </>
                                                    ) : estaAsignado ? (
                                                        <>
                                                            <Tooltip title={`Recibir ${esPrestamo ? 'préstamo' : 'producto'}`}>
                                                                <Button variant="contained" size="small" startIcon={<ReceiptIcon />} onClick={() => handleRecibir(producto)} sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary, borderRadius: 0, minWidth: 80 }}>Recibir</Button>
                                                            </Tooltip>
                                                            {!esPrestamo && (
                                                                <Tooltip title="Descargar Acta">
                                                                    <IconButton size="small" onClick={() => handleDescargarDocumento(asignacionActiva.id, 'asignacion')} disabled={downloadingDoc} sx={{ color: '#f44336' }}>
                                                                        <PdfIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="Ver detalles">
                                                                <IconButton size="small" onClick={() => handleVerDetalles(producto)} sx={{ color: esPrestamo ? colors.warning : colors.info }}>
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <Tooltip title="Producto no disponible">
                                                            <Button variant="outlined" size="small" disabled sx={{ opacity: 0.5, borderRadius: 0 }}>No disponible</Button>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredProductos.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas" />
                </StyledTableContainer>

                {/* Diálogos */}
                <AsignacionCompletaDialog open={openAsignacion} onClose={() => setOpenAsignacion(false)} productoSeleccionado={productoSeleccionado} onSuccess={handleAsignacionSuccess} />
                <RecepcionDialog open={openRecepcion} onClose={() => setOpenRecepcion(false)} producto={productoSeleccionado} asignacion={asignacionSeleccionada} onSuccess={handleRecepcionSuccess} />
                <PrestamoDialog open={openPrestamo} onClose={() => setOpenPrestamo(false)} productoSeleccionado={productoSeleccionado} onSuccess={handlePrestamoSuccess} />
                <DetallesDialog open={openDetalles} onClose={() => setOpenDetalles(false)} asignacion={asignacionSeleccionada} producto={productoSeleccionado} />

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>{snackbar.message}</Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default AsignacionPage;