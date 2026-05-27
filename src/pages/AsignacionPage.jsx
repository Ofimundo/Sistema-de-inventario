// src/pages/AsignacionPage.jsx - VERSIÓN CORREGIDA CON PRÉSTAMO
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
    Visibility as VisibilityIcon
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
    const [filters, setFilters] = useState({ bodega_id: '' });
    const [bodegas, setBodegas] = useState([]);
    const [openAsignacion, setOpenAsignacion] = useState(false);
    const [openRecepcion, setOpenRecepcion] = useState(false);
    const [openPrestamo, setOpenPrestamo] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        
        setApiError(false);

        try {
            const filterParams = {};
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            
            console.log('📤 Cargando productos...');
            const productosData = await productosServiceLocal.getProductos(searchTerm, filterParams);
            
            console.log('📦 Productos recibidos:', productosData?.length || 0);
            
            let todosLosProductos = [];
            if (productosData && Array.isArray(productosData)) {
                todosLosProductos = productosData;
            } else if (productosData && productosData.data && Array.isArray(productosData.data)) {
                todosLosProductos = productosData.data;
            }
            
            // Depuración
            if (todosLosProductos.length > 0) {
                console.log('🔍 Primeros 3 productos:');
                todosLosProductos.slice(0, 3).forEach(p => {
                    console.log(`   - ${p.nombre}: estado = ${p.estado}, id_estado_equipo = ${p.id_estado_equipo}`);
                });
            }
            
            // Procesar productos - asegurar que id_estado_equipo sea número
            const productosProcesados = todosLosProductos.map(p => ({
                ...p,
                id_estado_equipo: Number(p.id_estado_equipo) || 1,
            }));
            
            // Filtrar productos dados de baja (estado 6)
            const productosFiltrados = productosProcesados.filter(p => p.id_estado_equipo !== 6);
            setProductos(productosFiltrados);
            
            console.log(`📊 Productos cargados: ${productosFiltrados.length} total`);
            console.log(`   📊 Disponibles (estado 1): ${productosFiltrados.filter(p => p.id_estado_equipo === 1).length}`);
            console.log(`   📊 Asignados (estado 2): ${productosFiltrados.filter(p => p.id_estado_equipo === 2).length}`);
            
            // Cargar asignaciones activas
            try {
                console.log('📤 Cargando asignaciones activas...');
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
            
            // Cargar bodegas
            try {
                const bodegasData = await productosServiceLocal.getBodegas();
                setBodegas(bodegasData || []);
                console.log(`✅ ${bodegasData?.length || 0} bodegas cargadas`);
            } catch (err) {
                console.error('Error cargando bodegas:', err);
                setBodegas([]);
            }
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos', 'error');
            setProductos([]);
            setAsignacionesActivas([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, filters.bodega_id]);

    const handleAsignar = (producto) => {
        console.log('🔍 Asignar producto:', {
            id: producto.id,
            nombre: producto.nombre,
            id_estado_equipo: producto.id_estado_equipo,
            estado: getEstadoTexto(producto.id_estado_equipo)
        });
        
        if (producto.id_estado_equipo !== 1) {
            showSnackbar(`Este producto no está disponible para asignación. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning');
            return;
        }
        setProductoSeleccionado(producto);
        setOpenAsignacion(true);
    };

    const handlePrestamo = (producto) => {
        console.log('🔍 Préstamo producto:', {
            id: producto.id,
            nombre: producto.nombre,
            id_estado_equipo: producto.id_estado_equipo,
            estado: getEstadoTexto(producto.id_estado_equipo)
        });
        
        if (producto.id_estado_equipo !== 1) {
            showSnackbar(`Este producto no está disponible para préstamo. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning');
            return;
        }
        setProductoSeleccionado(producto);
        setOpenPrestamo(true);
    };

    const handleRecibir = (producto) => {
        const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
        
        console.log('🔍 Recibir producto:', {
            id: producto.id,
            nombre: producto.nombre,
            id_estado_equipo: producto.id_estado_equipo,
            asignacionActiva: asignacionActiva ? `Encontrada (ID: ${asignacionActiva.id})` : 'No encontrada'
        });
        
        if (!asignacionActiva) {
            showSnackbar('No se encontró una asignación activa para este producto', 'error');
            return;
        }
        
        setProductoSeleccionado(producto);
        setAsignacionSeleccionada(asignacionActiva);
        setOpenRecepcion(true);
    };

    const handleAsignacionSuccess = (result) => {
        showSnackbar(result.message || 'Asignación completada exitosamente', 'success');
        setOpenAsignacion(false);
        fetchData(true);
    };

    const handlePrestamoSuccess = (result) => {
        showSnackbar(result.message || 'Préstamo registrado exitosamente', 'success');
        setOpenPrestamo(false);
        fetchData(true);
    };

    const handleRecepcionSuccess = (result) => {
        showSnackbar(result.message || 'Recepción completada exitosamente', 'success');
        setOpenRecepcion(false);
        fetchData(true);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({ bodega_id: '' });
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
            return (
                producto.nombre?.toLowerCase().includes(term) ||
                producto.marca?.toLowerCase().includes(term) ||
                producto.numero_serie?.toLowerCase().includes(term) ||
                (producto.modelo && producto.modelo.toLowerCase().includes(term))
            );
        }
        return true;
    });

    const paginatedProductos = filteredProductos.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

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
                    <IconButton color="inherit" onClick={() => fetchData(true)} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                {/* Header */}
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Gestión de Asignaciones con Firma Digital
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Asigna productos a colaboradores con firma digital y control de inventario
                    </Typography>
                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 3, borderRadius: 0 }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={() => fetchData(true)} sx={{ borderRadius: 0 }}>REINTENTAR</Button>
                        }>
                            No se pudo conectar con el servidor. Verifica tu conexión.
                        </Alert>
                    )}
                </Paper>

                {/* Stats Cards */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48, mb: 1 }}>
                                    <AssignmentIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : asignacionesActivas.length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Asignaciones Activas</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 48, height: 48, mb: 1 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : productos.filter(p => p.id_estado_equipo === 1).length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Productos Disponibles</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 48, height: 48, mb: 1 }}>
                                    <InventoryIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : productos.filter(p => p.id_estado_equipo === 2).length}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Productos Asignados</Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Filtros */}
                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={6} md={3}>
                            <Button fullWidth variant="outlined" color="error" startIcon={<FilterListOffIcon />} onClick={handleClearFilters} disabled={!searchTerm && activeFiltersCount === 0} sx={{ borderRadius: 0 }}>
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
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={9} align="center"><CircularProgress /><Typography sx={{ mt: 2 }}>Cargando productos...</Typography></TableCell></TableRow>
                            ) : paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography><Typography variant="body2" color="text.secondary">No se encontraron productos con los filtros aplicados</Typography></TableCell></TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const asignacionActiva = getAsignacionActiva(producto.id);
                                    const estaDisponible = producto.id_estado_equipo === 1;
                                    const estaAsignado = producto.id_estado_equipo === 2;
                                    
                                    return (
                                        <TableRow key={producto.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1) }}>
                                                        <InventoryIcon sx={{ fontSize: 16 }} />
                                                    </Avatar>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {producto.nombre}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{producto.marca || '-'}</TableCell>
                                            <TableCell>{producto.modelo || '-'}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={producto.numero_serie || 'N/A'} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={<StoreIcon />} 
                                                    label={producto.bodega_nombre || 'Sin bodega'} 
                                                    size="small" 
                                                    sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={producto.condicion || 'NUEVO'} 
                                                    size="small" 
                                                    sx={{ 
                                                        backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? alpha(colors.warning, 0.1) : alpha(colors.success, 0.1),
                                                        color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? colors.warning : colors.success
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={getEstadoTexto(producto.id_estado_equipo)} 
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: alpha(getEstadoColor(producto.id_estado_equipo), 0.1), 
                                                        color: getEstadoColor(producto.id_estado_equipo),
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {asignacionActiva ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.success, 0.1) }}>
                                                            <PersonIcon sx={{ fontSize: 14 }} />
                                                        </Avatar>
                                                        <Typography variant="body2">
                                                            {asignacionActiva.colaborador_nombre}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    {estaDisponible ? (
                                                        <>
                                                            <Tooltip title="Asignar producto (con documento)">
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={<AssignmentIcon />}
                                                                    onClick={() => handleAsignar(producto)}
                                                                    sx={{ bgcolor: colors.primary, borderRadius: 0 }}
                                                                >
                                                                    Asignar
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip title="Préstamo (sin documento)">
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<PersonIcon />}
                                                                    onClick={() => handlePrestamo(producto)}
                                                                    sx={{ borderRadius: 0, borderColor: colors.warning, color: colors.warning }}
                                                                >
                                                                    Préstamo
                                                                </Button>
                                                            </Tooltip>
                                                        </>
                                                    ) : estaAsignado ? (
                                                        <Tooltip title="Recibir producto (devolución)">
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<ReceiptIcon />}
                                                                onClick={() => handleRecibir(producto)}
                                                                sx={{ bgcolor: colors.warning, borderRadius: 0 }}
                                                            >
                                                                Recibir
                                                            </Button>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title="Producto no disponible para asignación">
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                disabled
                                                                sx={{ opacity: 0.5, borderRadius: 0 }}
                                                            >
                                                                No disponible
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    {asignacionActiva && (
                                                        <Tooltip title="Ver detalles de asignación">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => {
                                                                    setAsignacionSeleccionada(asignacionActiva);
                                                                }} 
                                                                sx={{ color: colors.info }}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
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
                    <TablePagination 
                        rowsPerPageOptions={[5, 10, 25, 50]} 
                        component="div" 
                        count={filteredProductos.length} 
                        rowsPerPage={rowsPerPage} 
                        page={page} 
                        onPageChange={handleChangePage} 
                        onRowsPerPageChange={handleChangeRowsPerPage} 
                        labelRowsPerPage="Filas" 
                    />
                </StyledTableContainer>

                {/* Diálogos */}
                <AsignacionCompletaDialog 
                    open={openAsignacion} 
                    onClose={() => setOpenAsignacion(false)} 
                    productoSeleccionado={productoSeleccionado} 
                    onSuccess={handleAsignacionSuccess} 
                />
                
                <RecepcionDialog 
                    open={openRecepcion} 
                    onClose={() => setOpenRecepcion(false)} 
                    producto={productoSeleccionado} 
                    asignacion={asignacionSeleccionada} 
                    onSuccess={handleRecepcionSuccess} 
                />

                <PrestamoDialog 
                    open={openPrestamo} 
                    onClose={() => setOpenPrestamo(false)} 
                    productoSeleccionado={productoSeleccionado} 
                    onSuccess={handlePrestamoSuccess} 
                />

                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar} 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default AsignacionPage;