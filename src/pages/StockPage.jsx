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

// 4 Empresas oficiales
const OPCIONES_EMPRESA_STOCK = [
    { valor: 'GLOBAL', label: 'Global' },
    { valor: 'HIWAY', label: 'HIway' },
    { valor: 'LATAM_LITE', label: 'Latam Lite' },
    { valor: 'OFIMUNDO', label: 'Ofimundo' }
];

// Helper para obtener label bonito de empresa (Dreamtec -> Latam Lite)
const formatEmpresaLabel = (empresa) => {
    if (!empresa) return '';
    const empUpper = String(empresa).trim().toUpperCase();
    if (empUpper === 'DREAMTEC') return 'Latam Lite';
    if (empUpper === 'LATAM_LITE' || empUpper === 'LATAM LITE') return 'Latam Lite';
    if (empUpper === 'HIWAY') return 'HIway';
    if (empUpper === 'OFIMUNDO') return 'Ofimundo';
    if (empUpper === 'GLOBAL') return 'Global';
    return String(empresa);
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
                    <Typography variant="h6" fontWeight={700}>{titulo}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 2 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(colors.primary, 0.04) }}>
                                <StyledTableCell sx={{ fontWeight: 700 }}>N° Serie / Tipo</StyledTableCell>
                                <StyledTableCell sx={{ fontWeight: 700 }}>Estado</StyledTableCell>
                                <StyledTableCell sx={{ fontWeight: 700 }}>Asignado a</StyledTableCell>
                                <StyledTableCell sx={{ fontWeight: 700 }}>Bodega</StyledTableCell>
                                <StyledTableCell sx={{ fontWeight: 700 }}>Condición</StyledTableCell>
                                {productos.some(p => p.es_granel === 1 || p.es_granel === true) && (
                                    <StyledTableCell align="center" sx={{ fontWeight: 700 }}>Acciones</StyledTableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {productos.map((producto) => {
                                const esGranel = producto.es_granel === 1 || producto.es_granel === true;
                                const colaboradorNombre = producto.colaborador_asignado?.colaborador_nombre || producto.colaborador_asignado?.nombre || producto.colaborador_nombre;
                                const tieneColaborador = !!colaboradorNombre;
                                const esAsignado = producto.id_estado_equipo === 2 || producto.estado === 'ASIGNADO' || tieneColaborador;
                                const esDisponible = (producto.id_estado_equipo === 1 || producto.estado === 'DISPONIBLE' || !producto.estado) && !tieneColaborador;

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
                                                    sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: alpha(colors.primary, 0.03), borderColor: alpha(colors.primary, 0.3) }}
                                                />
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {esGranel ? (
                                                <Typography variant="body2" fontWeight={600} color={colors.secondary}>
                                                    {producto.cantidad !== undefined ? producto.cantidad : 1} ud. disponibles
                                                </Typography>
                                            ) : (
                                                <Chip 
                                                    label={esAsignado ? 'ASIGNADO' : esDisponible ? 'DISPONIBLE' : (producto.estado || 'NO DISPONIBLE')} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: alpha(esDisponible ? colors.success : esAsignado ? colors.info : colors.warning, 0.1),
                                                        color: esDisponible ? colors.success : esAsignado ? colors.info : colors.warning,
                                                        fontWeight: 700
                                                    }}
                                                />
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {colaboradorNombre ? (
                                                <Box display="flex" flexDirection="column" gap={0.25}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 22, height: 22, bgcolor: alpha(colors.primary, 0.1), color: colors.primary, fontSize: 11, fontWeight: 700 }}>
                                                            {colaboradorNombre.charAt(0)}
                                                        </Avatar>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {colaboradorNombre}
                                                        </Typography>
                                                    </Box>
                                                    {(producto.colaborador_asignado?.empresa || producto.colaborador_empresa) && (
                                                        <Chip 
                                                            label={formatEmpresaLabel(producto.colaborador_asignado?.empresa || producto.colaborador_empresa)} 
                                                            size="small" 
                                                            sx={{ 
                                                                height: 18, 
                                                                fontSize: '0.675rem', 
                                                                fontWeight: 700, 
                                                                bgcolor: alpha(colors.primary, 0.08), 
                                                                color: colors.primary,
                                                                alignSelf: 'flex-start',
                                                                ml: 3.75
                                                            }} 
                                                        />
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {esAsignado ? (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            ) : (
                                                <Chip 
                                                    icon={<StoreIcon />} 
                                                    label={producto.bodega_nombre || 'Sin bodega'} 
                                                    size="small" 
                                                    sx={{ backgroundColor: alpha(colors.info, 0.08), color: colors.info }} 
                                                />
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Typography variant="body2">{producto.condicion || 'NUEVO'}</Typography>
                                        </TableCell>

                                        {productos.some(p => p.es_granel === 1 || p.es_granel === true) && (
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
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}

// Componente Principal
const StockPage = () => {
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(false);
    
    const [productos, setProductos] = useState([]);
    const [resumenStock, setResumenStock] = useState([]);
    const [resumenFiltrado, setResumenFiltrado] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos'); // 'todos', 'equipos', 'granel'
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [empresas, setEmpresas] = useState([]);
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

    // Función para agrupar productos por marca y modelo (insensible a mayúsculas/minúsculas y espacios)
    const agruparProductos = (productosList) => {
        const grupos = {};
        
        productosList.forEach(producto => {
            // Ignorar productos dados de baja (id_estado_equipo = 6)
            if (producto.id_estado_equipo === 6 || producto.estado === 'BAJA') return;
            
            const rawMarca = (producto.marca || 'SIN MARCA').trim();
            const rawModelo = (producto.modelo || 'SIN MODELO').trim();
            const rawNombre = (producto.nombre || 'SIN NOMBRE').trim();

            const marcaNorm = rawMarca.toUpperCase();
            const modeloNorm = rawModelo.toUpperCase();
            const nombreNorm = rawNombre.toUpperCase();
            
            // Agrupar por Marca + Modelo + Nombre insensibles a mayúsculas
            const key = `${marcaNorm}|${modeloNorm}|${nombreNorm}`;
            
            const esGranel = producto.es_granel === 1 || producto.es_granel === true;
            const stockActual = producto.cantidad !== undefined ? parseInt(producto.cantidad) : 1;
            const utilizados = producto.total_utilizado !== undefined ? parseInt(producto.total_utilizado) : 0;

            const colaboradorNombre = producto.colaborador_asignado?.colaborador_nombre || producto.colaborador_asignado?.nombre || producto.colaborador_nombre;
            const tieneColaborador = !!colaboradorNombre;
            const esAsignado = producto.id_estado_equipo === 2 || producto.estado === 'ASIGNADO' || tieneColaborador;
            const esDisponible = (producto.id_estado_equipo === 1 || producto.estado === 'DISPONIBLE' || !producto.estado) && !tieneColaborador;
            const esMantencion = producto.id_estado_equipo === 3 || producto.estado === 'EN MANTENCIÓN';
            const esReparacion = producto.id_estado_equipo === 4 || producto.estado === 'EN REPARACIÓN';
            
            if (!grupos[key]) {
                grupos[key] = {
                    marca: rawMarca,
                    modelo: rawModelo,
                    nombre: rawNombre,
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
                if (esDisponible && stockActual > 0) {
                    grupos[key].disponibles += stockActual;
                } else {
                    grupos[key].noDisponibles += stockActual;
                }
            } else {
                grupos[key].total++;
                if (esAsignado) {
                    grupos[key].asignados++;
                } else if (esDisponible) {
                    grupos[key].disponibles++;
                } else if (esMantencion) {
                    grupos[key].enMantencion++;
                } else if (esReparacion) {
                    grupos[key].enReparacion++;
                } else {
                    grupos[key].noDisponibles++;
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
            
            // Obtener categorías y marcas únicas para filtros
            const categoriasUnicas = [...new Set(productosActivos.map(p => (p.nombre || 'SIN TIPO').trim()))].sort();
            setCategorias(categoriasUnicas);

            const marcasUnicas = [...new Set(productosActivos.map(p => (p.marca || 'SIN MARCA').trim()))].sort();
            setMarcas(marcasUnicas);
            
            // Empresas oficiales (Global, HIway, Latam Lite, Ofimundo)
            setEmpresas(OPCIONES_EMPRESA_STOCK);

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
                g.modelo?.toLowerCase().includes(term) ||
                g.productos.some(p => 
                    p.numero_serie?.toLowerCase().includes(term) ||
                    (p.colaborador_asignado?.nombre || p.colaborador_nombre)?.toLowerCase().includes(term) ||
                    (p.colaborador_asignado?.empresa || p.colaborador_empresa)?.toLowerCase().includes(term)
                )
            );
        }
        
        if (filterCategoria) {
            filtrados = filtrados.filter(g => g.nombre?.trim().toLowerCase() === filterCategoria.trim().toLowerCase());
        }

        if (filterMarca) {
            filtrados = filtrados.filter(g => g.marca?.trim().toLowerCase() === filterMarca.trim().toLowerCase());
        }

        if (filterTipo === 'granel') {
            filtrados = filtrados.filter(g => g.esGranel);
        } else if (filterTipo === 'equipos') {
            filtrados = filtrados.filter(g => !g.esGranel);
        }

        if (filterEmpresa) {
            const filterEmpUpper = filterEmpresa.trim().toUpperCase();
            filtrados = filtrados.filter(g => 
                g.productos.some(p => {
                    const rawEmp = p.colaborador_asignado?.empresa || p.colaborador_empresa;
                    if (!rawEmp) return false;
                    const empUpper = String(rawEmp).trim().toUpperCase();
                    if (filterEmpUpper === 'LATAM_LITE' || filterEmpUpper === 'LATAM LITE') {
                        return empUpper === 'LATAM_LITE' || empUpper === 'LATAM LITE' || empUpper === 'DREAMTEC';
                    }
                    return empUpper === filterEmpUpper;
                })
            );
        }
        
        setResumenFiltrado(filtrados);
    }, [searchTerm, filterCategoria, filterMarca, filterTipo, filterEmpresa, resumenStock]);

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
        setFilterCategoria('');
        setFilterMarca('');
        setFilterTipo('todos');
        setFilterEmpresa('');
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
                            setDrawerOpen(false);
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
                {/* Header Banner estilo Cápsula */}
                <Paper
                    sx={{
                        px: { xs: 2.5, sm: 3.5 },
                        py: { xs: 1.5, sm: 2 },
                        mb: 2.5,
                        borderRadius: '50px',
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        boxShadow: '0 8px 25px rgba(124, 58, 237, 0.25)'
                    }}
                >
                    <Box sx={{ pl: { sm: 1 } }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Control de Stock e Insumos
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, display: 'block', mt: 0.25 }}>
                            Visualiza equipos individuales y productos a granel (cables, conectores) con el desglose de cuántos se utilizaron y cuántos quedan
                        </Typography>
                    </Box>

                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 1, width: '100%' }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={() => fetchData(true)}>REINTENTAR</Button>
                        }>
                            No se pudo conectar con el servidor.
                        </Alert>
                    )}
                </Paper>

                {/* Top Marcas */}
                {topMarcas.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 3, bgcolor: '#FFFFFF' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <TrendingUpIcon sx={{ color: colors.primary, fontSize: '1.2rem' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.text.primary, fontSize: '0.85rem' }}>
                                Top Marcas con Mayor Registro
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                            {topMarcas.map((marca) => (
                                <Paper 
                                    key={marca.marca} 
                                    variant="outlined" 
                                    sx={{ 
                                        px: 2, 
                                        py: 1, 
                                        minWidth: 80, 
                                        textAlign: 'center', 
                                        borderRadius: 2, 
                                        bgcolor: alpha(colors.primary, 0.03),
                                        borderColor: alpha(colors.primary, 0.15)
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: colors.primary, fontSize: '0.95rem', lineHeight: 1.1 }}>
                                        {marca.cantidad}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.725rem', textTransform: 'uppercase', display: 'block', mt: 0.2 }}>
                                        {marca.marca}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                )}

                {/* Filtros */}
                <FilterPaper sx={{ p: 2.5, mb: 3 }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-end">
                        {/* Campo de búsqueda */}
                        <Box sx={{ flex: '2 1 300px', minWidth: 260 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Buscar Equipo / Insumo
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, marca, modelo, N° serie o colaborador..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
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
                        </Box>

                        {/* Filtro: Tipo de Producto */}
                        <Box sx={{ flex: '1 1 220px', minWidth: 220 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Tipo de Producto
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filterCategoria}
                                    onChange={(e) => setFilterCategoria(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Todos los tipos</MenuItem>
                                    {categorias.map(cat => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Filtro: Marca */}
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Marca
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filterMarca}
                                    onChange={(e) => setFilterMarca(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Todas las marcas</MenuItem>
                                    {marcas.map(marca => (
                                        <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Filtro: Empresa */}
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Empresa
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={filterEmpresa}
                                    onChange={(e) => setFilterEmpresa(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="">Todas las empresas</MenuItem>
                                    {OPCIONES_EMPRESA_STOCK.map(emp => (
                                        <MenuItem key={emp.valor} value={emp.valor}>{emp.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Botón Limpiar */}
                        <Box sx={{ flex: '0 0 auto', minWidth: 140 }}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                onClick={handleClearFilters}
                                startIcon={<ClearIcon />}
                                disabled={!searchTerm && !filterCategoria && !filterMarca && !filterEmpresa}
                                size="small"
                                sx={{ py: 0.85, height: 40 }}
                            >
                                Limpiar Filtros
                            </Button>
                        </Box>
                    </Stack>
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
                                                    const colaboradorNombre = producto.colaborador_asignado?.colaborador_nombre || producto.colaborador_asignado?.nombre || producto.colaborador_nombre || asignacionActiva?.colaborador_nombre;
                                                    const esAsignado = producto.id_estado_equipo === 2 || producto.estado === 'ASIGNADO' || !!colaboradorNombre;
                                                    const estadoColor = 
                                                        esAsignado ? colors.warning :
                                                        producto.id_estado_equipo === 1 ? colors.success :
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
                                                                {esAsignado ? (
                                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                                ) : (
                                                                    <Chip 
                                                                        icon={<StoreIcon />} 
                                                                        label={producto.bodega_nombre || 'Sin bodega'} 
                                                                        size="small" 
                                                                        sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} 
                                                                    />
                                                                )}
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
                                                                ) : colaboradorNombre ? (
                                                                    <Box display="flex" flexDirection="column" gap={0.25}>
                                                                        <Box display="flex" alignItems="center" gap={1}>
                                                                            <Avatar sx={{ width: 22, height: 22, bgcolor: alpha(colors.primary, 0.1), color: colors.primary, fontSize: 11, fontWeight: 700 }}>
                                                                                {colaboradorNombre.charAt(0)}
                                                                            </Avatar>
                                                                            <Typography variant="body2" fontWeight={600}>
                                                                                {colaboradorNombre}
                                                                            </Typography>
                                                                        </Box>
                                                                        {(producto.colaborador_asignado?.empresa || producto.colaborador_empresa) && (
                                                                            <Chip 
                                                                                label={formatEmpresaLabel(producto.colaborador_asignado?.empresa || producto.colaborador_empresa)} 
                                                                                size="small" 
                                                                                sx={{ 
                                                                                    height: 18, 
                                                                                    fontSize: '0.675rem', 
                                                                                    fontWeight: 700, 
                                                                                    bgcolor: alpha(colors.primary, 0.08), 
                                                                                    color: colors.primary,
                                                                                    alignSelf: 'flex-start',
                                                                                    ml: 3.75
                                                                                }} 
                                                                            />
                                                                        )}
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