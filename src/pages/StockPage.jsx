// src/pages/StockPage.jsx - VERSIÓN CORREGIDA QUE OBTIENE PRODUCTOS DEL BACKEND
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Home as HomeIcon,
    FilterListOff as FilterListOffIcon,
    Store as StoreIcon,
    Close as CloseIcon,
    Clear as ClearIcon,
    ExpandMore as ExpandMoreIcon,
    BarChart as BarChartIcon,
    Category as CategoryIcon,
    ModelTraining as ModelIcon,
    BrandingWatermark as BrandIcon,
    Inventory2 as Inventory2Icon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as AttachMoneyIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Build as BuildIcon,
    Engineering as EngineeringIcon,
    Block as BlockIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productosService } from '../services/productos';
import api from '../services/api';

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

// Componentes Styled
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    borderRadius: 16,
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
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${colors.border}`,
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: alpha(colors.primary, 0.02),
    borderBottom: `1px solid ${colors.border}`,
}));

// Componente de Detalle de Producto
function DetalleProductoDialog({ open, onClose, productos, titulo }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <InventoryIcon sx={{ color: colors.primary }} />
                    <Typography variant="h6">{titulo}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(colors.primary, 0.02) }}>
                                <StyledTableCell>N° Serie</StyledTableCell>
                                <StyledTableCell>Condición</StyledTableCell>
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell>Bodega</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell>Precio</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productos.map((producto) => (
                                <TableRow key={producto.id} hover>
                                    <TableCell>
                                        <Chip 
                                            label={producto.numero_serie || 'N/A'} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{producto.condicion || 'NUEVO'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={producto.estado || ESTADO_TEXTO[producto.id_estado_equipo] || 'DESCONOCIDO'} 
                                            size="small"
                                            sx={{ 
                                                bgcolor: alpha(
                                                    producto.id_estado_equipo === 1 ? colors.success :
                                                    producto.id_estado_equipo === 2 ? colors.warning :
                                                    producto.id_estado_equipo === 3 ? colors.info :
                                                    producto.id_estado_equipo === 4 ? colors.error :
                                                    colors.text.disabled, 0.1
                                                ),
                                                color: producto.id_estado_equipo === 1 ? colors.success :
                                                       producto.id_estado_equipo === 2 ? colors.warning :
                                                       producto.id_estado_equipo === 3 ? colors.info :
                                                       producto.id_estado_equipo === 4 ? colors.error :
                                                       colors.text.disabled
                                            }}
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
                                        {producto.colaborador_asignado?.colaborador_nombre || producto.colaborador_nombre ? (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.success, 0.1) }}>
                                                    <PersonIcon sx={{ fontSize: 14 }} />
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {producto.colaborador_asignado?.colaborador_nombre || producto.colaborador_nombre}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {producto.precio ? `$${producto.precio.toLocaleString()}` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}

// Componente Principal
const StockPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    
    const [productos, setProductos] = useState([]);
    const [resumenStock, setResumenStock] = useState([]);
    const [resumenFiltrado, setResumenFiltrado] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [marcas, setMarcas] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [detalleProductos, setDetalleProductos] = useState([]);
    const [detalleTitulo, setDetalleTitulo] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [apiError, setApiError] = useState(false);
    const [asignacionesActivas, setAsignacionesActivas] = useState([]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    // Función para agrupar productos por marca, modelo y nombre
    const agruparProductos = (productosList) => {
        const grupos = {};
        
        productosList.forEach(producto => {
            // Ignorar productos dados de baja
            if (producto.id_estado_equipo === 6) return;
            
            const marca = producto.marca || 'SIN MARCA';
            const modelo = producto.modelo || 'SIN MODELO';
            const nombre = producto.nombre || 'SIN NOMBRE';
            const key = `${marca}|${modelo}|${nombre}`;
            
            if (!grupos[key]) {
                grupos[key] = {
                    marca: marca,
                    modelo: modelo,
                    nombre: nombre,
                    total: 0,
                    disponibles: 0,
                    asignados: 0,
                    enMantencion: 0,
                    enReparacion: 0,
                    noDisponibles: 0,
                    productos: []
                };
            }
            
            grupos[key].total++;
            grupos[key].productos.push(producto);
            
            // Contar por estado
            switch(producto.id_estado_equipo) {
                case 1: grupos[key].disponibles++; break;
                case 2: grupos[key].asignados++; break;
                case 3: grupos[key].enMantencion++; break;
                case 4: grupos[key].enReparacion++; break;
                case 5: grupos[key].noDisponibles++; break;
                default: break;
            }
        });
        
        return Object.values(grupos);
    };

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            console.log('📥 Obteniendo productos del backend...');
            
            // Obtener productos desde el servicio
            const productosData = await productosService.getProductos();
            console.log('📦 Productos recibidos:', productosData.length);
            
            // Filtrar productos dados de baja (id_estado_equipo = 6)
            const productosActivos = productosData.filter(p => p.id_estado_equipo !== 6);
            console.log('📦 Productos activos:', productosActivos.length);
            
            setProductos(productosActivos);
            
            // Obtener asignaciones activas para mostrar a quién está asignado cada producto
            try {
                const asignacionesResponse = await api.get('/asignaciones/activas');
                if (asignacionesResponse.data && asignacionesResponse.data.success) {
                    setAsignacionesActivas(asignacionesResponse.data.data || []);
                }
            } catch (err) {
                console.error('Error cargando asignaciones:', err);
            }
            
            // Agrupar productos
            const grupos = agruparProductos(productosActivos);
            setResumenStock(grupos);
            setResumenFiltrado(grupos);
            
            // Obtener marcas únicas para filtro
            const marcasUnicas = [...new Set(productosActivos.map(p => p.marca || 'SIN MARCA'))].sort();
            setMarcas(marcasUnicas);
            
            setApiError(false);
            
            if (showRefresh) {
                showSnackbar('Datos actualizados', 'success');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos del stock', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtrar resumen
    useEffect(() => {
        let filtrados = [...resumenStock];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtrados = filtrados.filter(g => 
                g.nombre?.toLowerCase().includes(term) ||
                g.marca?.toLowerCase().includes(term) ||
                g.modelo?.toLowerCase().includes(term)
            );
        }
        
        if (filterMarca) {
            filtrados = filtrados.filter(g => g.marca === filterMarca);
        }
        
        setResumenFiltrado(filtrados);
    }, [searchTerm, filterMarca, resumenStock]);

    const handleVerDetalle = (grupo) => {
        setDetalleProductos(grupo.productos);
        setDetalleTitulo(`${grupo.nombre} - ${grupo.marca} ${grupo.modelo}`);
        setDetalleOpen(true);
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : null);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterMarca('');
    };

    // Calcular estadísticas
    const totalProductos = productos.length;
    const totalDisponibles = productos.filter(p => p.id_estado_equipo === 1).length;
    const totalAsignados = productos.filter(p => p.id_estado_equipo === 2).length;
    const totalMantencion = productos.filter(p => p.id_estado_equipo === 3).length;
    const totalReparacion = productos.filter(p => p.id_estado_equipo === 4).length;
    const totalNoDisponibles = productos.filter(p => p.id_estado_equipo === 5).length;
    const valorTotalInventario = productos.reduce((sum, p) => sum + (p.precio || 0), 0);
    const precioPromedio = totalProductos > 0 ? valorTotalInventario / totalProductos : 0;

    // Top marcas
    const topMarcas = Object.entries(
        productos.reduce((acc, p) => {
            const marca = p.marca || 'SIN MARCA';
            acc[marca] = (acc[marca] || 0) + 1;
            return acc;
        }, {})
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([marca, cantidad]) => ({ marca, cantidad }));

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleGoHome} sx={{ mr: 2 }}>
                        <HomeIcon />
                    </IconButton>
                    <Inventory2Icon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Control de Stock por Marca y Modelo
                    </Typography>
                    <IconButton color="inherit" onClick={() => fetchData(true)} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Control de Stock
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Visualiza el inventario agrupado por marca, modelo y nombre de producto
                    </Typography>
                    <Typography sx={{ opacity: 0.8 }}>
                        📦 Total de productos: <strong>{totalProductos}</strong> | 
                        🟢 Disponibles: <strong>{totalDisponibles}</strong> | 
                        🟠 Asignados: <strong>{totalAsignados}</strong>
                    </Typography>

                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 3 }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={() => fetchData(true)}>REINTENTAR</Button>
                        }>
                            No se pudo conectar con el servidor.
                        </Alert>
                    )}
                </Paper>

                {/* Tarjetas de Estadísticas */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48, mb: 1 }}>
                                    <InventoryIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalProductos}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Productos</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {marcas.length} marcas
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 48, height: 48, mb: 1 }}>
                                    <CheckCircleIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalDisponibles}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Disponibles</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={totalProductos ? (totalDisponibles / totalProductos) * 100 : 0} 
                                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(colors.success, 0.2) }}
                                />
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 48, height: 48, mb: 1 }}>
                                    <WarningIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : totalAsignados}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Asignados</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={totalProductos ? (totalAsignados / totalProductos) * 100 : 0} 
                                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(colors.warning, 0.2) }}
                                />
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.info, 0.1), color: colors.info, width: 48, height: 48, mb: 1 }}>
                                    <AttachMoneyIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    {loading ? <CircularProgress size={24} /> : `$${valorTotalInventario.toLocaleString()}`}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Valor Total Inventario</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Promedio: ${precioPromedio.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Top Marcas */}
                {topMarcas.length > 0 && (
                    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon sx={{ color: colors.primary }} />
                            Top Marcas con Mayor Stock
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {topMarcas.map((marca, index) => (
                                <Grid item xs={12} sm={6} md={2.4} key={marca.marca}>
                                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(colors.primary, 0.02) }}>
                                        <Typography variant="h6" fontWeight="bold" color={colors.primary}>
                                            {marca.cantidad}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {marca.marca}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}

                {/* Filtros */}
                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, marca o modelo..."
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
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Filtrar por Marca</InputLabel>
                                <Select
                                    value={filterMarca}
                                    onChange={(e) => setFilterMarca(e.target.value)}
                                    label="Filtrar por Marca"
                                >
                                    <MenuItem value="">Todas las marcas</MenuItem>
                                    {marcas.map(marca => (
                                        <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                onClick={handleClearFilters}
                                startIcon={<ClearIcon />}
                                disabled={!searchTerm && !filterMarca}
                            >
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>
                </FilterPaper>

                {/* Lista de Grupos de Productos */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <CircularProgress />
                    </Box>
                ) : resumenFiltrado.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <Inventory2Icon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No se encontraron productos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Intenta con otros filtros o agrega nuevos productos
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {resumenFiltrado.map((grupo, index) => (
                            <Accordion
                                key={`${grupo.marca}-${grupo.modelo}-${grupo.nombre}`}
                                expanded={expanded === `panel${index}`}
                                onChange={handleAccordionChange(`panel${index}`)}
                                sx={{
                                    borderRadius: 2,
                                    '&:before': { display: 'none' },
                                    border: `1px solid ${colors.border}`,
                                    boxShadow: 'none'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '&:hover': { bgcolor: alpha(colors.primary, 0.02) },
                                        borderRadius: 2
                                    }}
                                >
                                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" flexWrap="wrap" gap={2}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                                <CategoryIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {grupo.nombre}
                                                </Typography>
                                                <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                                    <Chip 
                                                        size="small" 
                                                        icon={<BrandIcon />} 
                                                        label={`Marca: ${grupo.marca}`}
                                                        variant="outlined"
                                                    />
                                                    <Chip 
                                                        size="small" 
                                                        icon={<ModelIcon />} 
                                                        label={`Modelo: ${grupo.modelo}`}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            <Chip 
                                                label={`Total: ${grupo.total}`} 
                                                size="small" 
                                                sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}
                                            />
                                            <Chip 
                                                label={`Disponibles: ${grupo.disponibles}`} 
                                                size="small" 
                                                sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success }}
                                            />
                                            <Chip 
                                                label={`Asignados: ${grupo.asignados}`} 
                                                size="small" 
                                                sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning }}
                                            />
                                            {grupo.enMantencion > 0 && (
                                                <Chip 
                                                    icon={<BuildIcon />}
                                                    label={`Mantención: ${grupo.enMantencion}`} 
                                                    size="small" 
                                                    sx={{ bgcolor: alpha(colors.info, 0.1), color: colors.info }}
                                                />
                                            )}
                                            {grupo.enReparacion > 0 && (
                                                <Chip 
                                                    icon={<EngineeringIcon />}
                                                    label={`Reparación: ${grupo.enReparacion}`} 
                                                    size="small" 
                                                    sx={{ bgcolor: alpha(colors.error, 0.1), color: colors.error }}
                                                />
                                            )}
                                            <Button 
                                                size="small" 
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleVerDetalle(grupo);
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                Ver detalle
                                            </Button>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: alpha(colors.primary, 0.02) }}>
                                                    <StyledTableCell>N° Serie</StyledTableCell>
                                                    <StyledTableCell>Estado</StyledTableCell>
                                                    <StyledTableCell>Condición</StyledTableCell>
                                                    <StyledTableCell>Bodega</StyledTableCell>
                                                    <StyledTableCell>Asignado a</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {grupo.productos.slice(0, 5).map((producto) => {
                                                    const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
                                                    const estadoColor = 
                                                        producto.id_estado_equipo === 1 ? colors.success :
                                                        producto.id_estado_equipo === 2 ? colors.warning :
                                                        producto.id_estado_equipo === 3 ? colors.info :
                                                        producto.id_estado_equipo === 4 ? colors.error :
                                                        colors.text.disabled;
                                                    
                                                    return (
                                                        <TableRow key={producto.id} hover>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={producto.numero_serie || 'N/A'} 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={producto.estado || ESTADO_TEXTO[producto.id_estado_equipo] || 'DESCONOCIDO'} 
                                                                    size="small"
                                                                    sx={{ 
                                                                        bgcolor: alpha(estadoColor, 0.1),
                                                                        color: estadoColor,
                                                                        fontWeight: 500
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{producto.condicion || 'NUEVO'}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    icon={<StoreIcon />} 
                                                                    label={producto.bodega_nombre || 'Sin bodega'} 
                                                                    size="small" 
                                                                    sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} 
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
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                        {grupo.total > 5 && (
                                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                                <Button 
                                                    variant="text" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleVerDetalle(grupo);
                                                    }}
                                                >
                                                    Ver los {grupo.total} productos
                                                </Button>
                                            </Box>
                                        )}
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                )}

                {/* Diálogo de Detalle */}
                <DetalleProductoDialog
                    open={detalleOpen}
                    onClose={() => setDetalleOpen(false)}
                    productos={detalleProductos}
                    titulo={detalleTitulo}
                />

                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar} 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default StockPage;