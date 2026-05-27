// src/pages/AsignacionPage.jsx - VERSIÓN CON BOTÓN PARA VER PDF
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
    FormControlLabel,
    Switch,
    FormHelperText
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
    LocalOffer as LocalOfferIcon,
    PictureAsPdf as PdfIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
// COMPONENTE DE DIÁLOGO DE ASIGNACIÓN CON PRÉSTAMO
// ============================================
const AsignacionCompletaDialog = ({ open, onClose, productoSeleccionado, onSuccess }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [selectedColaborador, setSelectedColaborador] = useState('');
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [fechaAsignacion, setFechaAsignacion] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [esPrestamo, setEsPrestamo] = useState(false);

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            setSelectedColaborador('');
            setMotivo('');
            setObservaciones('');
            setError('');
            setSearchTerm('');
            setEsPrestamo(false);
            setFechaAsignacion(new Date().toISOString().split('T')[0]);
        }
    }, [open]);

    const cargarColaboradores = async () => {
        try {
            const response = await api.get('/colaboradores');
            if (response.data && response.data.success) {
                setColaboradores(response.data.data || []);
            }
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
        }
    };

    const colaboradoresFiltrados = colaboradores.filter(col =>
        col.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selectedColaborador) {
            setError('Debe seleccionar un colaborador');
            return;
        }
        if (!motivo.trim()) {
            setError('Debe ingresar un motivo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = {
                producto_id: productoSeleccionado.id,
                colaborador_id: selectedColaborador,
                motivo: motivo.trim(),
                observaciones: observaciones.trim(),
                fecha_asignacion: fechaAsignacion,
                es_prestamo: esPrestamo
            };

            const response = await api.post('/asignaciones', data);
            
            if (response.data && response.data.success) {
                onSuccess(response.data);
                onClose();
            } else {
                throw new Error(response.data?.message || 'Error al crear la asignación');
            }
        } catch (error) {
            console.error('Error en asignación:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!productoSeleccionado) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIcon sx={{ color: colors.primary }} />
                    <Typography variant="h6">Asignar / Prestar Producto</Typography>
                </Box>
                <Box sx={{ mt: 1, p: 1.5, bgcolor: alpha(colors.primary, 0.05), borderRadius: 1 }}>
                    <Typography variant="body2">
                        <strong>Producto:</strong> {productoSeleccionado.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Serie:</strong> {productoSeleccionado.numero_serie || 'N/A'} | 
                        <strong> Marca:</strong> {productoSeleccionado.marca || 'N/A'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.info, 0.03) }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Tipo de Asignación</Typography>
                        <FormControlLabel
                            control={<Switch checked={esPrestamo} onChange={(e) => setEsPrestamo(e.target.checked)} color="primary" />}
                            label={<Box><Typography variant="body2">{esPrestamo ? '📋 PRÉSTAMO TEMPORAL' : '🔒 ASIGNACIÓN PERMANENTE'}</Typography>
                            <Typography variant="caption" color="text.secondary">{esPrestamo ? 'El producto será devuelto en el futuro' : 'El producto queda asignado de forma permanente'}</Typography></Box>}
                        />
                    </Paper>

                    <TextField fullWidth placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }} />

                    <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}>
                        {colaboradoresFiltrados.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">{searchTerm ? 'No se encontraron colaboradores' : 'No hay colaboradores registrados'}</Typography></Box>
                        ) : (
                            colaboradoresFiltrados.map((col) => (
                                <Box key={col.id} sx={{ p: 1.5, borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', backgroundColor: selectedColaborador === col.id ? alpha(colors.primary, 0.05) : 'transparent', '&:hover': { backgroundColor: alpha(colors.primary, 0.03) } }} onClick={() => setSelectedColaborador(col.id)}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>{col.nombre?.charAt(0) || '?'}</Avatar>
                                        <Box flex={1}>
                                            <Typography variant="body2" fontWeight={500}>{col.nombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">{col.cargo || 'Sin cargo'} • {col.departamento || 'Sin departamento'}</Typography>
                                            <Typography variant="caption" display="block" color="text.secondary">{col.email} {col.rut && `• ${col.rut}`}</Typography>
                                        </Box>
                                        {selectedColaborador === col.id && <CheckCircleIcon sx={{ color: colors.success }} />}
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Paper>

                    <TextField fullWidth label="Motivo *" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder={esPrestamo ? "Ej: Préstamo para reunión..." : "Ej: Asignación permanente..."} multiline rows={2} size="small" />
                    <TextField fullWidth type="date" label="Fecha de asignación" value={fechaAsignacion} onChange={(e) => setFechaAsignacion(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                    <TextField fullWidth label="Observaciones adicionales" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline rows={2} size="small" />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading || !selectedColaborador} startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />} sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary }}>
                    {loading ? 'Procesando...' : (esPrestamo ? 'Registrar Préstamo' : 'Asignar Producto')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================
// COMPONENTE DE DIÁLOGO DE RECEPCIÓN (DEVOLUCIÓN)
// ============================================
const RecepcionDialog = ({ open, onClose, producto, asignacion, onSuccess }) => {
    const [fechaDevolucion, setFechaDevolucion] = useState(new Date().toISOString().split('T')[0]);
    const [observaciones, setObservaciones] = useState('');
    const [condicion, setCondicion] = useState('BUENO');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setFechaDevolucion(new Date().toISOString().split('T')[0]);
            setObservaciones('');
            setCondicion('BUENO');
            setError('');
        }
    }, [open]);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const data = {
                fecha_devolucion: fechaDevolucion,
                observaciones_devolucion: observaciones,
                condicion_entrega: condicion
            };

            const response = await api.put(`/asignaciones/${asignacion?.id}/finalizar`, data);
            
            if (response.data && response.data.success) {
                onSuccess(response.data);
                onClose();
            } else {
                throw new Error(response.data?.message || 'Error al procesar la devolución');
            }
        } catch (error) {
            console.error('Error en devolución:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!producto) return null;

    const esPrestamo = asignacion?.es_prestamo === true;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <ReceiptIcon sx={{ color: colors.warning }} />
                    <Typography variant="h6">{esPrestamo ? 'Devolución de Préstamo' : 'Recepción de Producto'}</Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2}>
                    <Box sx={{ p: 1.5, bgcolor: alpha(colors.primary, 0.05), borderRadius: 1 }}>
                        <Typography variant="body2"><strong>Producto:</strong> {producto.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary"><strong>Serie:</strong> {producto.numero_serie || 'N/A'}</Typography>
                        {asignacion && (
                            <>
                                <Typography variant="body2" color="text.secondary"><strong>Colaborador:</strong> {asignacion.colaborador_nombre}</Typography>
                                {esPrestamo && <Typography variant="body2" color={colors.warning}><strong>⚠️ Este es un PRÉSTAMO</strong></Typography>}
                            </>
                        )}
                    </Box>

                    <TextField fullWidth type="date" label="Fecha de devolución" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                    <FormControl fullWidth size="small">
                        <InputLabel>Condición del producto</InputLabel>
                        <Select value={condicion} onChange={(e) => setCondicion(e.target.value)} label="Condición del producto">
                            <MenuItem value="BUENO">Bueno</MenuItem><MenuItem value="REGULAR">Regular</MenuItem>
                            <MenuItem value="MALO">Malo</MenuItem><MenuItem value="DAÑADO">Dañado</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField fullWidth label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline rows={3} size="small" />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading} variant="outlined">Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />} sx={{ bgcolor: colors.warning }}>
                    {loading ? 'Procesando...' : (esPrestamo ? 'Registrar Devolución' : 'Recibir Producto')}
                </Button>
            </DialogActions>
        </Dialog>
    );
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
    const [filters, setFilters] = useState({ bodega_id: '', tipo_visualizacion: 'todos' });
    const [bodegas, setBodegas] = useState([]);
    const [openAsignacion, setOpenAsignacion] = useState(false);
    const [openRecepcion, setOpenRecepcion] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [apiError, setApiError] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    // 🔥 FUNCIÓN PARA DESCARGAR ACTA
    const handleDescargarActa = async (asignacion) => {
        if (!asignacion || !asignacion.documento_path) {
            showSnackbar('No hay documento disponible para esta asignación', 'warning');
            return;
        }
        
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const filename = asignacion.documento_path?.split('/').pop();
            
            if (!filename) {
                throw new Error('Nombre de archivo no encontrado');
            }
            
            const downloadUrl = `https://sistema-inventario-backend-p3xg.onrender.com/api/asignaciones/descargar/${filename}`;
            console.log('📥 Descargando acta desde:', downloadUrl);
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showSnackbar('Acta descargada exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error descargando acta:', error);
            showSnackbar('Error al descargar el acta', 'error');
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        
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
                setAsignacionesActivas([]);
            }
            
            try {
                const bodegasData = await productosServiceLocal.getBodegas();
                setBodegas(bodegasData || []);
            } catch (err) {
                console.error('Error cargando bodegas:', err);
                setBodegas([]);
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
    }, [searchTerm, filters.bodega_id]);

    const handleAsignar = (producto) => {
        if (producto.id_estado_equipo !== 1) {
            showSnackbar(`Este producto no está disponible. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning');
            return;
        }
        setProductoSeleccionado(producto);
        setOpenAsignacion(true);
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

    const handleAsignacionSuccess = (result) => {
        const tipo = result.data?.es_prestamo ? 'Préstamo' : 'Asignación';
        showSnackbar(`${tipo} completado exitosamente`, 'success');
        setOpenAsignacion(false);
        fetchData(true);
    };

    const handleRecepcionSuccess = (result) => {
        showSnackbar('Devolución completada exitosamente', 'success');
        setOpenRecepcion(false);
        fetchData(true);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({ bodega_id: '', tipo_visualizacion: 'todos' });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
        const estaDisponible = producto.id_estado_equipo === 1;
        const estaAsignado = producto.id_estado_equipo === 2;
        const esPrestamo = asignacionActiva?.es_prestamo === true;
        const esPermanente = asignacionActiva?.es_prestamo === false;
        
        switch (filters.tipo_visualizacion) {
            case 'disponibles': return estaDisponible;
            case 'asignados': return estaAsignado;
            case 'prestamos': return estaAsignado && esPrestamo;
            case 'permanentes': return estaAsignado && esPermanente;
            default: return true;
        }
    });

    const paginatedProductos = filteredProductos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '' && v !== 'todos').length;

    const prestamosActivos = asignacionesActivas.filter(a => a.es_prestamo === true).length;
    const disponibles = productos.filter(p => p.id_estado_equipo === 1).length;
    const asignados = productos.filter(p => p.id_estado_equipo === 2).length;

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleGoHome} sx={{ mr: 2 }}><HomeIcon /></IconButton>
                    <AssignmentIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Gestión de Asignaciones y Préstamos</Typography>
                    <IconButton color="inherit" onClick={() => fetchData(true)} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>Gestión de Asignaciones y Préstamos con Firma Digital</Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>Asigna productos, registra préstamos temporales y controla devoluciones</Typography>
                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 3, borderRadius: 0 }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={() => fetchData(true)} sx={{ borderRadius: 0 }}>REINTENTAR</Button>
                        }>No se pudo conectar con el servidor.</Alert>
                    )}
                </Paper>

                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3} md={3}>
                        <StyledCard><CardContent><Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>{loading ? <CircularProgress size={24} /> : asignacionesActivas.length}</Typography><Typography variant="body2" color="text.secondary">Asignaciones Activas</Typography></CardContent></StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                        <StyledCard><CardContent><Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning }}>{loading ? <CircularProgress size={24} /> : prestamosActivos}</Typography><Typography variant="body2" color="text.secondary">Préstamos Activos</Typography></CardContent></StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                        <StyledCard><CardContent><Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>{loading ? <CircularProgress size={24} /> : disponibles}</Typography><Typography variant="body2" color="text.secondary">Productos Disponibles</Typography></CardContent></StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3} md={3}>
                        <StyledCard><CardContent><Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>{loading ? <CircularProgress size={24} /> : asignados}</Typography><Typography variant="body2" color="text.secondary">Productos Asignados</Typography></CardContent></StyledCard>
                    </Grid>
                </Grid>

                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth placeholder="Buscar por nombre, marca, modelo o número de serie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><CloseIcon fontSize="small" /></IconButton></InputAdornment>) }} size="small" />
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
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo</InputLabel>
                                <Select value={filters.tipo_visualizacion} onChange={(e) => setFilters({ ...filters, tipo_visualizacion: e.target.value })} label="Tipo">
                                    <MenuItem value="todos">Todos</MenuItem>
                                    <MenuItem value="disponibles">📦 Disponibles</MenuItem>
                                    <MenuItem value="asignados">🔒 Asignados</MenuItem>
                                    <MenuItem value="prestamos">📋 Préstamos</MenuItem>
                                    <MenuItem value="permanentes">🔐 Permanentes</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <Button fullWidth variant="outlined" color="error" startIcon={<FilterListOffIcon />} onClick={handleClearFilters} disabled={!searchTerm && activeFiltersCount === 0} sx={{ borderRadius: 0 }}>Limpiar</Button>
                        </Grid>
                    </Grid>
                </FilterPaper>

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
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell>Tipo</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={10} align="center"><CircularProgress /><Typography sx={{ mt: 2 }}>Cargando...</Typography></TableCell></TableRow>
                            ) : paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={10} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography></TableCell></TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const asignacionActiva = getAsignacionActiva(producto.id);
                                    const estaDisponible = producto.id_estado_equipo === 1;
                                    const estaAsignado = producto.id_estado_equipo === 2;
                                    const esPrestamo = asignacionActiva?.es_prestamo === true;
                                    const tieneDocumento = asignacionActiva?.documento_path;
                                    
                                    return (
                                        <TableRow key={producto.id} hover>
                                            <TableCell><Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1) }}><InventoryIcon sx={{ fontSize: 16 }} /></Avatar><Typography variant="body2" fontWeight={500}>{producto.nombre}</Typography></Box></TableCell>
                                            <TableCell>{producto.marca || '-'}</TableCell>
                                            <TableCell>{producto.modelo || '-'}</TableCell>
                                            <TableCell><Chip label={producto.numero_serie || 'N/A'} size="small" variant="outlined" /></TableCell>
                                            <TableCell><Chip icon={<StoreIcon />} label={producto.bodega_nombre || 'Sin bodega'} size="small" sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} /></TableCell>
                                            <TableCell><Chip label={producto.condicion || 'NUEVO'} size="small" sx={{ backgroundColor: (producto.condicion === 'USADO') ? alpha(colors.warning, 0.1) : alpha(colors.success, 0.1), color: (producto.condicion === 'USADO') ? colors.warning : colors.success }} /></TableCell>
                                            <TableCell><Chip label={getEstadoTexto(producto.id_estado_equipo)} size="small" sx={{ backgroundColor: alpha(getEstadoColor(producto.id_estado_equipo), 0.1), color: getEstadoColor(producto.id_estado_equipo), fontWeight: 500 }} /></TableCell>
                                            <TableCell>{asignacionActiva && (<Chip label={esPrestamo ? '📋 PRÉSTAMO' : '🔒 ASIGNACIÓN'} size="small" sx={{ backgroundColor: esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1), color: esPrestamo ? colors.warning : colors.primary, fontWeight: 500 }} />)}</TableCell>
                                            <TableCell>{asignacionActiva ? (<Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.success, 0.1) }}><PersonIcon sx={{ fontSize: 14 }} /></Avatar><Typography variant="body2">{asignacionActiva.colaborador_nombre}</Typography></Box>) : (<Typography variant="body2" color="text.secondary">-</Typography>)}</TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    {estaDisponible ? (
                                                        <Tooltip title="Asignar / Prestar">
                                                            <Button variant="contained" size="small" startIcon={<AssignmentIcon />} onClick={() => handleAsignar(producto)} sx={{ bgcolor: colors.primary, borderRadius: 0, minWidth: 80 }}>Asignar</Button>
                                                        </Tooltip>
                                                    ) : estaAsignado ? (
                                                        <>
                                                            <Tooltip title="Recibir / Devolver">
                                                                <Button variant="contained" size="small" startIcon={<ReceiptIcon />} onClick={() => handleRecibir(producto)} sx={{ bgcolor: esPrestamo ? colors.warning : colors.info, borderRadius: 0, minWidth: 80 }}>{esPrestamo ? 'Devolver' : 'Recibir'}</Button>
                                                            </Tooltip>
                                                            {tieneDocumento && (
                                                                <Tooltip title="Ver / Descargar Acta">
                                                                    <IconButton 
                                                                        size="small" 
                                                                        onClick={() => handleDescargarActa(asignacionActiva)}
                                                                        disabled={downloading}
                                                                        sx={{ color: '#f44336' }}
                                                                    >
                                                                        {downloading ? <CircularProgress size={20} /> : <PdfIcon />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Tooltip title="No disponible">
                                                            <Button variant="outlined" size="small" disabled sx={{ opacity: 0.5, borderRadius: 0, minWidth: 80 }}>No disponible</Button>
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

                <AsignacionCompletaDialog open={openAsignacion} onClose={() => setOpenAsignacion(false)} productoSeleccionado={productoSeleccionado} onSuccess={handleAsignacionSuccess} />
                <RecepcionDialog open={openRecepcion} onClose={() => setOpenRecepcion(false)} producto={productoSeleccionado} asignacion={asignacionSeleccionada} onSuccess={handleRecepcionSuccess} />

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default AsignacionPage;