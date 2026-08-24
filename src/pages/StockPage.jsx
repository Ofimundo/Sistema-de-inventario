// src/pages/StockPage.jsx - CONTROL DE STOCK CON SOPORTE COMPLETO PARA PRODUCTOS A GRANEL E INSUMOS
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
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
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Home as HomeIcon,
    Store as StoreIcon,
    Close as CloseIcon,
    Clear as ClearIcon,
    ExpandMore as ExpandMoreIcon,
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
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Warehouse as WarehouseIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Description as DescriptionIcon,
    History as HistoryIcon,
    RemoveCircleOutline as RemoveIcon,
    Outbox as OutboxIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productosService } from '../services/productos';
import OfilabFooter from '../components/OfilabFooter';

const colors = {
    primary: '#7C3AED',
    secondary: '#D946EF',
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

// Componente Modal para Descontar Stock / Entrega a Granel (Directo desde Control de Stock)
function DescontarStockDialog({ open, onClose, producto, onSuccess }) {
    const [cantidad, setCantidad] = useState(1);
    const [observacion, setObservacion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setCantidad(1);
            setObservacion('');
            setError('');
        }
    }, [open]);

    const handleSubmit = async () => {
        const cantNum = parseInt(cantidad);
        if (!cantNum || cantNum <= 0) {
            setError('Ingrese una cantidad válida mayor a 0');
            return;
        }
        const stockActual = producto?.cantidad !== undefined ? producto.cantidad : 1;
        if (cantNum > stockActual) {
            setError(`La cantidad (${cantNum}) no puede superar el stock disponible (${stockActual})`);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await productosService.descontarStock(producto.id, cantNum, observacion);
            if (onSuccess) {
                onSuccess(`Se entregaron ${cantNum} unidad(es) de ${producto.nombre}. Stock restante: ${stockActual - cantNum}`);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al descontar stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ bgcolor: alpha(colors.secondary, 0.08), color: colors.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <OutboxIcon />
                <Typography variant="h6" fontWeight={600}>Descontar Stock / Entrega a Granel</Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(colors.secondary, 0.04), borderColor: alpha(colors.secondary, 0.2) }}>
                    <Typography variant="subtitle1" fontWeight={700} color={colors.secondary}>
                        {producto?.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Marca: <strong>{producto?.marca || 'SIN MARCA'}</strong> | Modelo: <strong>{producto?.modelo || 'SIN MODELO'}</strong>
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">
                            🟢 Stock Restante (Quedan): <strong>{producto?.cantidad !== undefined ? producto.cantidad : 1} ud.</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            📤 Utilizados: <strong>{producto?.total_utilizado || 0} ud.</strong>
                        </Typography>
                    </Box>
                </Paper>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Esta entrega descontará la cantidad ingresada del inventario y registrará la salida en el historial de movimientos.
                </Alert>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Cantidad a Descontar / Entregar *"
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            size="small"
                            inputProps={{ min: 1, max: producto?.cantidad || 1 }}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Observación / Destino de Uso (Opcional)"
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            multiline
                            rows={2}
                            size="small"
                            placeholder="Ej: Utilizado para cableado de oficina central"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: colors.secondary, '&:hover': { bgcolor: alpha(colors.secondary, 0.9) } }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Confirmar Entrega'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Componente de Detalle de Producto
function DetalleProductoDialog({ open, onClose, productos, titulo, onDescontar }) {
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
                                <StyledTableCell>N° Serie / Tipo</StyledTableCell>
                                <StyledTableCell>Quedan (Stock)</StyledTableCell>
                                <StyledTableCell>Utilizados</StyledTableCell>
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell>Bodega</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productos.map((producto) => {
                                const esGranel = producto.es_granel === 1 || producto.es_granel === true;
                                return (
                                    <TableRow key={producto.id} hover>
                                        <TableCell>
                                            {esGranel ? (
                                                <Chip 
                                                    label="A GRANEL / INSUMO" 
                                                    size="small" 
                                                    sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, fontWeight: 700 }}
                                                />
                                            ) : (
                                                <Chip 
                                                    label={producto.numero_serie || 'N/A'} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color={esGranel ? colors.secondary : 'text.primary'}>
                                                {esGranel ? `${producto.cantidad !== undefined ? producto.cantidad : 1} unidades` : '1 unidad'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {esGranel ? (
                                                <Chip 
                                                    label={`${producto.total_utilizado || 0} ud.`} 
                                                    size="small"
                                                    sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, fontWeight: 600 }}
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
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
                                        <TableCell align="center">
                                            {esGranel && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="secondary"
                                                    startIcon={<OutboxIcon fontSize="small" />}
                                                    onClick={() => onDescontar(producto)}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Descontar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
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
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    
    const [productos, setProductos] = useState([]);
    const [resumenStock, setResumenStock] = useState([]);
    const [resumenFiltrado, setResumenFiltrado] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos'); // 'todos', 'equipos', 'granel'
    const [marcas, setMarcas] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [detalleProductos, setDetalleProductos] = useState([]);
    const [detalleTitulo, setDetalleTitulo] = useState('');
    const [descontarOpen, setDescontarOpen] = useState(false);
    const [selectedGranelProducto, setSelectedGranelProducto] = useState(null);
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
            
            const esGranel = producto.es_granel === 1 || producto.es_granel === true;
            const stockActual = producto.cantidad !== undefined ? parseInt(producto.cantidad) : 1;
            const utilizados = producto.total_utilizado !== undefined ? parseInt(producto.total_utilizado) : 0;
            
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
                    esGranel: false,
                    totalGranelQuedan: 0,
                    totalGranelUtilizados: 0,
                    totalGranelInicial: 0,
                    productos: []
                };
            }
            
            grupos[key].productos.push(producto);
            
            if (esGranel) {
                grupos[key].esGranel = true;
                grupos[key].totalGranelQuedan += stockActual;
                grupos[key].totalGranelUtilizados += utilizados;
                grupos[key].totalGranelInicial += (stockActual + utilizados);
                grupos[key].total += stockActual;
                if (producto.id_estado_equipo === 1 && stockActual > 0) {
                    grupos[key].disponibles += stockActual;
                } else {
                    grupos[key].noDisponibles += stockActual;
                }
            } else {
                grupos[key].total++;
                switch(producto.id_estado_equipo) {
                    case 1: grupos[key].disponibles++; break;
                    case 2: grupos[key].asignados++; break;
                    case 3: grupos[key].enMantencion++; break;
                    case 4: grupos[key].enReparacion++; break;
                    case 5: grupos[key].noDisponibles++; break;
                    default: break;
                }
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
            
            // Obtener asignaciones activas
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
        const loadData = async () => {
            await fetchData();
        };
        loadData();
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

        if (filterTipo === 'granel') {
            filtrados = filtrados.filter(g => g.esGranel);
        } else if (filterTipo === 'equipos') {
            filtrados = filtrados.filter(g => !g.esGranel);
        }
        
        setResumenFiltrado(filtrados);
    }, [searchTerm, filterMarca, filterTipo, resumenStock]);

    const handleVerDetalle = (grupo) => {
        setDetalleProductos(grupo.productos);
        setDetalleTitulo(`${grupo.nombre} - ${grupo.marca} ${grupo.modelo}`);
        setDetalleOpen(true);
    };

    const handleOpenDescontar = (producto) => {
        setSelectedGranelProducto(producto);
        setDescontarOpen(true);
    };

    const handleDescontarSuccess = (msg) => {
        showSnackbar(msg, 'success');
        fetchData(true);
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : null);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterMarca('');
        setFilterTipo('todos');
    };

    // Calcular estadísticas
    const productosGranel = productos.filter(p => p.es_granel === 1 || p.es_granel === true);
    const productosEquipos = productos.filter(p => !p.es_granel);

    const totalGranelQuedan = productosGranel.reduce((sum, p) => sum + (p.cantidad || 0), 0);
    const totalGranelUtilizados = productosGranel.reduce((sum, p) => sum + (p.total_utilizado || 0), 0);
    const totalGranelInicial = totalGranelQuedan + totalGranelUtilizados;

    const totalProductos = productos.length;
    const totalDisponiblesEquipos = productosEquipos.filter(p => p.id_estado_equipo === 1).length;
    const totalAsignadosEquipos = productosEquipos.filter(p => p.id_estado_equipo === 2).length;
    
    const valorTotalInventario = productos.reduce((sum, p) => {
        const cant = (p.es_granel === 1 || p.es_granel === true) ? (p.cantidad || 1) : 1;
        return sum + ((p.precio || 0) * cant);
    }, 0);

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

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
        { text: 'Bodegas', icon: <WarehouseIcon />, path: '/bodegas' },
        { text: 'Colaboradores', icon: <PeopleIcon />, path: '/colaboradores' },
        { text: 'Asignaciones', icon: <AssignmentIcon />, path: '/asignacion' },
        { text: 'Mantención', icon: <BuildIcon />, path: '/mantenciones' },
        { text: 'Anexos', icon: <DescriptionIcon />, path: '/anexos' },
        { text: 'Stock', icon: <Inventory2Icon />, path: '/stock' },
        { text: 'Historial', icon: <HistoryIcon />, path: '/historial' },
    ];

    const drawer = (
        <Drawer
            variant={isMobile ? 'temporary' : 'persistent'}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            sx={{
                width: drawerOpen ? drawerWidth : 0,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                transition: (theme) => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #E2E8F0' }
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                </Box>
                {isMobile && (
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map(item => (
                    <ListItemButton 
                        key={item.text} 
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) setDrawerOpen(false);
                        }}
                        selected={window.location.pathname === item.path}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}
            </List>
        </Drawer>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.background }}>
            {drawer}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <AppBar position="fixed" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 1.5 }}>
                            <MenuIcon />
                        </IconButton>
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
                            <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '46px', width: 'auto', objectFit: 'contain' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Control de Stock e Insumos a Granel
                            </Typography>
                        </Box>
                        <IconButton color="inherit" onClick={() => fetchData(true)} disabled={refreshing}>
                            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Toolbar />

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Control de Stock e Insumos
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Visualiza equipos individuales y productos a granel (cables, conectores) con el desglose de cuántos se utilizaron y cuántos quedan.
                    </Typography>
                    <Grid container spacing={2} sx={{ opacity: 0.95 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2">
                                💻 Equipos Serializados: <strong>{productosEquipos.length}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2">
                                🟢 Equipos Disponibles: <strong>{totalDisponiblesEquipos}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2">
                                📦 A Granel Quedan: <strong>{totalGranelQuedan} ud.</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2">
                                📤 A Granel Utilizados: <strong>{totalGranelUtilizados} ud.</strong>
                            </Typography>
                        </Grid>
                    </Grid>

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
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Registro de Productos</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {productosEquipos.length} equipos | {productosGranel.length} insumos a granel
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Avatar sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, width: 48, height: 48, mb: 1 }}>
                                    <OutboxIcon />
                                </Avatar>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.secondary }}>
                                    {loading ? <CircularProgress size={24} /> : totalGranelQuedan}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Stock a Granel Quedan</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={totalGranelInicial > 0 ? (totalGranelQuedan / totalGranelInicial) * 100 : 0} 
                                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(colors.secondary, 0.15) }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {totalGranelUtilizados} unidades utilizadas
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
                                    {loading ? <CircularProgress size={24} /> : totalDisponiblesEquipos}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Equipos Disponibles</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={productosEquipos.length ? (totalDisponiblesEquipos / productosEquipos.length) * 100 : 0} 
                                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(colors.success, 0.2) }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {totalAsignadosEquipos} asignados a colaboradores
                                </Typography>
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
                                    Equipos e Insumos evaluados
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
                            Top Marcas con Mayor Registro
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {topMarcas.map((marca) => (
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
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre (ej: cable), marca o modelo..."
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
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Producto</InputLabel>
                                <Select
                                    value={filterTipo}
                                    onChange={(e) => setFilterTipo(e.target.value)}
                                    label="Tipo de Producto"
                                >
                                    <MenuItem value="todos">Todos los productos</MenuItem>
                                    <MenuItem value="equipos">Solo Equipos Individuales (Con Serie)</MenuItem>
                                    <MenuItem value="granel">Solo A Granel / Insumos (Cables, etc.)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
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
                                disabled={!searchTerm && !filterMarca && filterTipo === 'todos'}
                            >
                                Limpiar
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
                        {resumenFiltrado.map((grupo, idx) => (
                            <Accordion
                                key={`${grupo.marca}-${grupo.modelo}-${grupo.nombre}`}
                                expanded={expanded === `panel${idx}`}
                                onChange={handleAccordionChange(`panel${idx}`)}
                                sx={{
                                    borderRadius: 2,
                                    '&:before': { display: 'none' },
                                    border: `1px solid ${grupo.esGranel ? alpha(colors.secondary, 0.4) : colors.border}`,
                                    bgcolor: grupo.esGranel ? alpha(colors.secondary, 0.015) : 'background.paper',
                                    boxShadow: 'none'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '&:hover': { bgcolor: alpha(grupo.esGranel ? colors.secondary : colors.primary, 0.03) },
                                        borderRadius: 2
                                    }}
                                >
                                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" flexWrap="wrap" gap={2}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: alpha(grupo.esGranel ? colors.secondary : colors.primary, 0.1), color: grupo.esGranel ? colors.secondary : colors.primary }}>
                                                {grupo.esGranel ? <OutboxIcon /> : <CategoryIcon />}
                                            </Avatar>
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {grupo.nombre}
                                                    </Typography>
                                                    {grupo.esGranel && (
                                                        <Chip 
                                                            label="A GRANEL / INSUMO" 
                                                            size="small" 
                                                            sx={{ bgcolor: alpha(colors.secondary, 0.15), color: colors.secondary, fontWeight: 700, fontSize: 11 }}
                                                        />
                                                    )}
                                                </Box>
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

                                        {/* Indicadores en resumen del acordeón */}
                                        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                            {grupo.esGranel ? (
                                                <>
                                                    <Chip 
                                                        label={`🟢 Quedan: ${grupo.totalGranelQuedan} ud.`} 
                                                        size="small" 
                                                        sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, fontWeight: 700 }}
                                                    />
                                                    <Chip 
                                                        label={`📤 Utilizados: ${grupo.totalGranelUtilizados} ud.`} 
                                                        size="small" 
                                                        sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, fontWeight: 700 }}
                                                    />
                                                    <Chip 
                                                        label={`📥 Stock Inicial: ${grupo.totalGranelInicial} ud.`} 
                                                        size="small" 
                                                        sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}
                                                    />
                                                </>
                                            ) : (
                                                <>
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
                                                </>
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
                                    {/* Para Insumos a Granel, mostrar un panel visual descriptivo */}
                                    {grupo.esGranel && (
                                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(colors.secondary, 0.03), borderColor: alpha(colors.secondary, 0.2) }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nivel de Stock Restante: <strong>{grupo.totalGranelInicial > 0 ? Math.round((grupo.totalGranelQuedan / grupo.totalGranelInicial) * 100) : 0}%</strong>
                                                    </Typography>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={grupo.totalGranelInicial > 0 ? (grupo.totalGranelQuedan / grupo.totalGranelInicial) * 100 : 0} 
                                                        sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: alpha(colors.warning, 0.2), '& .MuiLinearProgress-bar': { bgcolor: colors.success } }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={8}>
                                                    <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
                                                        <Typography variant="body2">
                                                            🟢 Stock Quedan: <strong>{grupo.totalGranelQuedan} ud.</strong>
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            📤 Entregados/Utilizados: <strong>{grupo.totalGranelUtilizados} ud.</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    )}

                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: alpha(colors.primary, 0.02) }}>
                                                    <StyledTableCell>N° Serie / Tipo</StyledTableCell>
                                                    <StyledTableCell>{grupo.esGranel ? 'Quedan (Stock Actual)' : 'Estado'}</StyledTableCell>
                                                    <StyledTableCell>{grupo.esGranel ? 'Cantidad Utilizada' : 'Condición'}</StyledTableCell>
                                                    <StyledTableCell>Bodega</StyledTableCell>
                                                    <StyledTableCell>{grupo.esGranel ? 'Acciones' : 'Asignado a'}</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {grupo.productos.slice(0, 5).map((producto) => {
                                                    const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
                                                    const esGranel = producto.es_granel === 1 || producto.es_granel === true;
                                                    const estadoColor = 
                                                        producto.id_estado_equipo === 1 ? colors.success :
                                                        producto.id_estado_equipo === 2 ? colors.warning :
                                                        producto.id_estado_equipo === 3 ? colors.info :
                                                        producto.id_estado_equipo === 4 ? colors.error :
                                                        colors.text.disabled;
                                                    
                                                    return (
                                                        <TableRow key={producto.id} hover>
                                                            <TableCell>
                                                                {esGranel ? (
                                                                    <Chip 
                                                                        label="A GRANEL (SIN SERIE)" 
                                                                        size="small" 
                                                                        sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, fontWeight: 700 }}
                                                                    />
                                                                ) : (
                                                                    <Chip 
                                                                        label={producto.numero_serie || 'N/A'} 
                                                                        size="small" 
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </TableCell>

                                                            {/* Columna 2 */}
                                                            <TableCell>
                                                                {esGranel ? (
                                                                    <Typography variant="body2" fontWeight={700} color={colors.success}>
                                                                        {producto.cantidad !== undefined ? producto.cantidad : 1} unidades disponibles
                                                                    </Typography>
                                                                ) : (
                                                                    <Chip 
                                                                        label={producto.estado || ESTADO_TEXTO[producto.id_estado_equipo] || 'DESCONOCIDO'} 
                                                                        size="small"
                                                                        sx={{ 
                                                                            bgcolor: alpha(estadoColor, 0.1),
                                                                            color: estadoColor,
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                )}
                                                            </TableCell>

                                                            {/* Columna 3 */}
                                                            <TableCell>
                                                                {esGranel ? (
                                                                    <Typography variant="body2" fontWeight={600} color={colors.warning}>
                                                                        {producto.total_utilizado || 0} unidades entregadas
                                                                    </Typography>
                                                                ) : (
                                                                    <Typography variant="body2">{producto.condicion || 'NUEVO'}</Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                <Chip 
                                                                    icon={<StoreIcon />} 
                                                                    label={producto.bodega_nombre || 'Sin bodega'} 
                                                                    size="small" 
                                                                    sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} 
                                                                />
                                                            </TableCell>

                                                            {/* Columna 5: Acciones o Asignado */}
                                                            <TableCell>
                                                                {esGranel ? (
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="secondary"
                                                                        startIcon={<OutboxIcon fontSize="small" />}
                                                                        onClick={() => handleOpenDescontar(producto)}
                                                                        sx={{ textTransform: 'none' }}
                                                                    >
                                                                        Descontar Stock
                                                                    </Button>
                                                                ) : asignacionActiva ? (
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
                                        {grupo.productos.length > 5 && (
                                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                                <Button 
                                                    variant="text" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleVerDetalle(grupo);
                                                    }}
                                                >
                                                    Ver los {grupo.productos.length} registros
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
                    onDescontar={(prod) => {
                        setDetalleOpen(false);
                        handleOpenDescontar(prod);
                    }}
                />

                {/* Diálogo para Descontar Stock */}
                <DescontarStockDialog
                    open={descontarOpen}
                    onClose={() => setDescontarOpen(false)}
                    producto={selectedGranelProducto}
                    onSuccess={handleDescontarSuccess}
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
            <OfilabFooter />
        </Box>
        </Box>
    );
};

export default StockPage;