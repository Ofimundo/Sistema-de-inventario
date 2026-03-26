// src/pages/HistorialDisposiciones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    TableSortLabel,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    ListItemAvatar,
    Popover,
    CssBaseline,
    ThemeProvider,
    createTheme,
    Menu as MuiMenu,
    MenuItem as MuiMenuItem,
    Badge,
    Skeleton,
    Zoom,
    Fab,
    styled,
    Tab,
    Tabs,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    Fade
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
    Description as DocumentIcon,
    SwapHoriz as MovimientoIcon,
    Autorenew as AutorenewIcon,
    Clear as ClearIcon,
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    Warehouse as WarehouseIcon,
    Assignment as AssignmentIcon,
    Logout as LogoutIcon,
    Notifications as NotificationsIcon,
    ChevronLeft as ChevronLeftIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Error as ErrorIcon,
    DeleteSweep as DeleteSweepIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    FilterAlt as FilterAltIcon,
    FilterAltOff as FilterAltOffIcon,
    Download as DownloadIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import historialService from '../services/historialService';

const drawerWidth = 260;

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
    '&::-webkit-scrollbar': {
        height: 8,
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: alpha(colors.primary, 0.05),
        borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(colors.primary, 0.3),
        borderRadius: 4,
        '&:hover': {
            backgroundColor: alpha(colors.primary, 0.5),
        },
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    color: colors.text.primary,
    borderBottom: `2px solid ${alpha(colors.primary, 0.2)}`,
    backgroundColor: alpha(colors.primary, 0.02),
    whiteSpace: 'nowrap',
    padding: theme.spacing(1.5, 2),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: alpha(colors.primary, 0.04),
        cursor: 'pointer',
    },
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

const NotificacionItem = styled(ListItem)(({ theme, leida }) => ({
    backgroundColor: leida ? 'transparent' : alpha(colors.warning, 0.05),
    '&:hover': {
        backgroundColor: alpha(colors.primary, 0.05)
    }
}));

// Tarjeta de estadísticas
function StatCard({ icon: Icon, title, value, change, color, loading, onClick }) {
    if (loading) {
        return (
            <StyledCard>
                <CardContent>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton variant="text" height={32} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="60%" />
                </CardContent>
            </StyledCard>
        );
    }

    return (
        <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Avatar sx={{ bgcolor: alpha(color, 0.1), color, width: 48, height: 48 }}>
                        <Icon />
                    </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' } }}>
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {title}
                </Typography>
                {change && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                        {change}
                    </Typography>
                )}
            </CardContent>
        </StyledCard>
    );
}

// Botón flotante para volver arriba
function ScrollTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = document.documentElement.scrollTop;
            setVisible(scrolled > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Zoom in={visible}>
            <Box
                onClick={scrollToTop}
                role="presentation"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000
                }}
            >
                <Fab
                    size="small"
                    aria-label="Volver arriba"
                    sx={{
                        bgcolor: colors.primary,
                        color: 'white',
                        '&:hover': { bgcolor: colors.secondary },
                    }}
                >
                    <ChevronLeftIcon sx={{ transform: 'rotate(90deg)' }} />
                </Fab>
            </Box>
        </Zoom>
    );
}

// Componente para cada pestaña
function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

// Función para generar clave única para cada fila
const generarKeyUnica = (item, index) => {
    if (item && item.id) {
        return `${item.origen || 'item'}-${item.id}-${index}`;
    }
    return `${item?.origen || 'item'}-${index}-${Date.now()}-${Math.random()}`;
};

const HistorialDisposiciones = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
    
    // Estados del Dashboard
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificacionesAnchor, setNotificacionesAnchor] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [darkMode, setDarkMode] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
    const [openConfig, setOpenConfig] = useState(false);
    const [openPerfil, setOpenPerfil] = useState(false);
    const [perfilData, setPerfilData] = useState({ nombre: '', email: '', usuario: '', rol: '' });
    
    // Estados para historial
    const [tabValue, setTabValue] = useState(0);
    const [historialCompleto, setHistorialCompleto] = useState([]);
    const [historialGeneral, setHistorialGeneral] = useState([]);
    const [historialDocumentos, setHistorialDocumentos] = useState([]);
    const [historialEstados, setHistorialEstados] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [apiError, setApiError] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    
    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('fecha');
    const [order, setOrder] = useState('desc');
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        tipo: 'todos',
        fechaInicio: null,
        fechaFin: null
    });

    // Estado para mostrar/ocultar filtros
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    
    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
        { text: 'Bodegas', icon: <WarehouseIcon />, path: '/bodegas' },
        { text: 'Asignaciones', icon: <AssignmentIcon />, path: '/asignacion' },
        { text: 'Historial', icon: <HistoryIcon />, path: '/historial' },
    ];

    // Función para mostrar notificaciones
    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    // Función para cerrar notificaciones
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Cargar notificaciones desde localStorage
    const loadNotificacionesFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem('dashboard_notificaciones');
            if (stored) {
                const parsed = JSON.parse(stored);
                setNotificaciones(parsed);
                setNotificacionesNoLeidas(parsed.filter((n) => !n.leida).length);
                return parsed;
            }
        } catch (error) {
            console.error('Error loading notificaciones:', error);
        }
        return [];
    }, []);

    // Guardar notificaciones en localStorage
    const saveNotificacionesToStorage = useCallback((notis) => {
        try {
            localStorage.setItem('dashboard_notificaciones', JSON.stringify(notis));
        } catch (error) {
            console.error('Error saving notificaciones:', error);
        }
    }, []);

    // Marcar notificación como leída
    const handleMarcarComoLeida = useCallback((id) => {
        setNotificaciones((prev) => {
            const nuevas = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
        showSnackbar('Notificación marcada como leída', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    // Marcar todas como leídas
    const handleMarcarTodasLeidas = useCallback(() => {
        setNotificaciones((prev) => {
            const nuevas = prev.map((n) => ({ ...n, leida: true }));
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas(0);
        showSnackbar('Todas las notificaciones marcadas', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    // Eliminar notificación
    const handleEliminarNotificacion = useCallback((id) => {
        setNotificaciones((prev) => {
            const nuevas = prev.filter((n) => n.id !== id);
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
        showSnackbar('Notificación eliminada', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    // Eliminar todas las notificaciones
    const handleEliminarTodasNotificaciones = useCallback(() => {
        setNotificaciones([]);
        setNotificacionesNoLeidas(0);
        localStorage.removeItem('dashboard_notificaciones');
        showSnackbar('Todas las notificaciones eliminadas', 'success');
    }, [showSnackbar]);

    // Función para exportar a Excel
    const handleExportExcel = useCallback(async () => {
        if (exportLoading) return;
        
        try {
            setExportLoading(true);
            showSnackbar('Generando reporte de historial...', 'info');
            
            console.log('📤 Exportando con filtros:', filtros);
            
            const blob = await historialService.exportarExcel(filtros);
            
            if (!blob || blob.size < 100) {
                throw new Error('El archivo generado está vacío o es inválido');
            }
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const fecha = new Date().toISOString().slice(0, 10);
            const tipoFiltro = filtros.tipo !== 'todos' ? `_${filtros.tipo}` : '';
            link.setAttribute('download', `historial_disposiciones${tipoFiltro}_${fecha}.xlsx`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSnackbar('✅ Reporte de historial generado exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error exportando historial:', error);
            
            let mensajeError = 'Error al generar el reporte';
            if (error.message?.includes('404')) {
                mensajeError = 'La ruta de exportación no existe en el servidor';
            } else if (error.message?.includes('500')) {
                mensajeError = 'Error interno del servidor al generar el reporte';
            } else if (error.message?.includes('Failed to fetch')) {
                mensajeError = 'No se pudo conectar con el servidor';
            } else if (error.message) {
                mensajeError = error.message;
            }
            
            showSnackbar(mensajeError, 'error');
        } finally {
            setExportLoading(false);
        }
    }, [showSnackbar, filtros, exportLoading]);

    // Cargar historiales
    const cargarTodosLosHistoriales = useCallback(async () => {
        setLoading(true);
        setApiError(false);
        
        try {
            console.log('🔄 Cargando historial de disposiciones...');
            
            // Intentar cargar historial de disposiciones
            const response = await historialService.getHistorialDisposiciones();
            
            if (response && response.success) {
                const data = response.data || {};
                
                console.log('✅ Historial cargado:', {
                    completo: data.completo?.length || 0,
                    general: data.general?.length || 0,
                    documentos: data.documentos?.length || 0,
                    estados: data.estados?.length || 0,
                    movimientos: data.movimientos?.length || 0
                });
                
                setHistorialCompleto(data.completo || []);
                setHistorialGeneral(data.general || []);
                setHistorialDocumentos(data.documentos || []);
                setHistorialEstados(data.estados || []);
                setMovimientos(data.movimientos || []);
                
                setApiError(false);
            } else {
                // Si no hay datos, inicializar arrays vacíos
                console.log('⚠️ No se recibieron datos válidos del servidor');
                setHistorialCompleto([]);
                setHistorialGeneral([]);
                setHistorialDocumentos([]);
                setHistorialEstados([]);
                setMovimientos([]);
            }

        } catch (error) {
            console.error('❌ Error cargando historiales:', error);
            setError('Error al cargar los datos de historial');
            setApiError(true);
            showSnackbar('Error al cargar el historial', 'error');
            // Inicializar arrays vacíos para evitar errores
            setHistorialCompleto([]);
            setHistorialGeneral([]);
            setHistorialDocumentos([]);
            setHistorialEstados([]);
            setMovimientos([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showSnackbar]);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!currentUser || !currentUser.id) { 
            navigate('/login'); 
            return; 
        }
        
        setUser(currentUser);
        setPerfilData({
            nombre: currentUser.nombre || '',
            email: currentUser.email || '',
            usuario: currentUser.usuario || '',
            rol: currentUser.rol || '',
        });
        
        loadNotificacionesFromStorage();
        cargarTodosLosHistoriales();
    }, [navigate, loadNotificacionesFromStorage, cargarTodosLosHistoriales]);

    // Responsive drawer
    useEffect(() => {
        setDrawerOpen(!isMobile);
    }, [isMobile]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(0);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros({ ...filtros, [campo]: valor });
        setPage(0);
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            tipo: 'todos',
            fechaInicio: null,
            fechaFin: null
        });
        setPage(0);
    };

    // Funciones del menú
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificacionesClick = (event) => {
        setNotificacionesAnchor(event.currentTarget);
    };

    const handleNotificacionesClose = () => {
        setNotificacionesAnchor(null);
    };

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        cargarTodosLosHistoriales();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ============ FUNCIONES PARA DETERMINAR ORIGEN ============
    
    const getOrigen = (item) => {
        if (item.origen) return item.origen;
        
        // Detectar por campos presentes
        if (item.documento_id !== undefined) return 'documento';
        if (item.estado_anterior !== undefined || item.estado_nuevo !== undefined) return 'estado';
        if (item.tipo_movimiento) return 'movimiento';
        if (item.accion && ['ASIGNACION', 'DEVOLUCION', 'CREACION', 'ACTUALIZACION'].includes(item.accion)) return 'movimiento';
        
        return 'general';
    };

    const getTipoIcon = (item) => {
        const origen = getOrigen(item);
        
        switch(origen) {
            case 'general': return <HistoryIcon />;
            case 'documento': return <DocumentIcon />;
            case 'estado': return <AutorenewIcon />;
            case 'movimiento': return <MovimientoIcon />;
            default: return <HistoryIcon />;
        }
    };

    const getTipoColor = (item) => {
        const origen = getOrigen(item);
        
        switch(origen) {
            case 'general': return colors.primary;
            case 'documento': return colors.secondary;
            case 'estado': return colors.warning;
            case 'movimiento': return colors.success;
            default: return colors.info;
        }
    };

    const getTipoLabel = (item) => {
        const origen = getOrigen(item);
        
        switch(origen) {
            case 'general': return 'General';
            case 'documento': return 'Documento';
            case 'estado': return 'Estado';
            case 'movimiento': return 'Movimiento';
            default: return origen.charAt(0).toUpperCase() + origen.slice(1);
        }
    };

    const getAccionTexto = (item) => {
        if (item.accion) return item.accion;
        if (item.tipo_movimiento) return item.tipo_movimiento;
        
        const origen = getOrigen(item);
        switch(origen) {
            case 'documento': return 'Acción sobre documento';
            case 'estado': return 'Cambio de estado';
            default: return 'Acción';
        }
    };

    const getFechaTexto = (item) => {
        const fecha = item.fecha_hora || item.fecha_accion || item.fecha_movimiento || item.fecha;
        if (!fecha) return 'Fecha desconocida';
        
        try {
            return new Date(fecha).toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const getUsuarioTexto = (item) => {
        return item.usuario_nombre || 
               item.usuario_responsable || 
               item.usuario ||
               (item.usuario_id ? `ID: ${item.usuario_id}` : 'Sistema');
    };

    const getDetallesTexto = (item) => {
        const origen = getOrigen(item);
        
        if (item.detalles) return item.detalles;
        if (item.observaciones) return item.observaciones;
        
        switch(origen) {
            case 'documento':
                return item.nombre_documento || 'Documento procesado';
            case 'estado':
                return `${item.estado_anterior || '?'} → ${item.estado_nuevo || item.estado || '?'}`;
            default:
                return 'Sin detalles';
        }
    };

    const getProductoTexto = (item) => {
        return item.producto_nombre || 
               item.producto?.nombre || 
               (item.producto_id ? `ID: ${item.producto_id}` : 'N/A');
    };

    // Datos según la pestaña seleccionada
    const getDatosActuales = () => {
        switch(tabValue) {
            case 0: return historialCompleto;
            case 1: return historialGeneral.map(item => ({ ...item, origen: 'general' }));
            case 2: return historialDocumentos.map(item => ({ ...item, origen: 'documento' }));
            case 3: return historialEstados.map(item => ({ ...item, origen: 'estado' }));
            case 4: return movimientos.map(item => ({ ...item, origen: 'movimiento' }));
            default: return [];
        }
    };

    // Función para ordenar datos
    const ordenarDatos = (items) => {
        if (!items || items.length === 0) return [];
        
        return [...items].sort((a, b) => {
            let aValue, bValue;
            
            if (orderBy === 'fecha') {
                aValue = new Date(a.fecha_hora || a.fecha_accion || a.fecha_movimiento || a.fecha || 0);
                bValue = new Date(b.fecha_hora || b.fecha_accion || b.fecha_movimiento || b.fecha || 0);
            } else if (orderBy === 'producto') {
                aValue = (a.producto_nombre || a.producto?.nombre || '').toLowerCase();
                bValue = (b.producto_nombre || b.producto?.nombre || '').toLowerCase();
            } else if (orderBy === 'usuario') {
                aValue = (a.usuario_nombre || a.usuario_responsable || '').toLowerCase();
                bValue = (b.usuario_nombre || b.usuario_responsable || '').toLowerCase();
            } else {
                aValue = a[orderBy];
                bValue = b[orderBy];
            }
            
            if (typeof aValue === 'string') {
                return order === 'asc' 
                    ? (aValue || '').localeCompare(bValue || '')
                    : (bValue || '').localeCompare(aValue || '');
            }
            
            return order === 'asc' 
                ? (aValue || 0) - (bValue || 0)
                : (bValue || 0) - (aValue || 0);
        });
    };

    // Filtrar historial según los criterios
    const filtrarHistorial = (items) => {
        if (!items || items.length === 0) return [];
        
        return items.filter(item => {
            // Filtro por búsqueda
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                const productoNombre = (item.producto_nombre || 
                                      item.producto?.nombre || 
                                      item.nombre_documento || 
                                      '').toLowerCase();
                const accion = (item.accion || item.tipo_movimiento || '').toLowerCase();
                const detalles = (item.detalles || item.observaciones || '').toLowerCase();
                const usuario = (item.usuario_nombre || 
                               item.usuario_responsable || 
                               item.usuario ||
                               '').toLowerCase();
                
                const coincide = 
                    productoNombre.includes(busquedaLower) ||
                    accion.includes(busquedaLower) ||
                    detalles.includes(busquedaLower) ||
                    usuario.includes(busquedaLower);
                
                if (!coincide) return false;
            }

            // Filtro por tipo/origen
            if (filtros.tipo !== 'todos') {
                const origen = getOrigen(item);
                if (origen !== filtros.tipo) return false;
            }

            // Filtro por fecha
            const fecha = new Date(
                item.fecha_hora || 
                item.fecha_accion || 
                item.fecha_movimiento || 
                item.fecha || 
                0
            );

            if (filtros.fechaInicio && fecha < filtros.fechaInicio) {
                return false;
            }
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59);
                if (fecha > fechaFin) {
                    return false;
                }
            }

            return true;
        });
    };

    const datosFiltrados = ordenarDatos(filtrarHistorial(getDatosActuales()));
    const paginatedData = datosFiltrados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Tema
    const customTheme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: colors.primary },
            secondary: { main: colors.secondary },
            background: {
                default: darkMode ? '#0F172A' : colors.background,
                paper: darkMode ? '#1E293B' : colors.surface,
            },
            text: {
                primary: darkMode ? '#F1F5F9' : colors.text.primary,
                secondary: darkMode ? '#94A3B8' : colors.text.secondary,
            },
        },
        shape: { borderRadius: 14 },
    });

    // Drawer
    const drawer = (
        <Drawer
            variant={isMobile ? 'temporary' : 'persistent'}
            open={drawerOpen}
            onClose={handleDrawerToggle}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    bgcolor: 'background.paper',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    StockMaster
                </Typography>
                {isMobile && (
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) handleDrawerToggle();
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

    // Notificaciones Popover
    const notificacionesPopover = (
        <Popover
            open={Boolean(notificacionesAnchor)}
            anchorEl={notificacionesAnchor}
            onClose={handleNotificacionesClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{ sx: { width: 350, maxHeight: 450, borderRadius: 2 } }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Notificaciones
                </Typography>
                <Box>
                    <Tooltip title="Actualizar">
                        <IconButton size="small" onClick={handleRefresh}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {notificacionesNoLeidas > 0 && (
                        <Tooltip title="Marcar todas">
                            <IconButton size="small" onClick={handleMarcarTodasLeidas}>
                                <CheckIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {notificaciones.length > 0 && (
                        <Tooltip title="Eliminar todas">
                            <IconButton size="small" onClick={handleEliminarTodasNotificaciones}>
                                <DeleteSweepIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
                {notificaciones.length > 0 ? (
                    notificaciones.map((notif, index) => (
                        <NotificacionItem
                            key={generarKeyUnica(notif, notif.id || index)}
                            leida={notif.leida}
                            secondaryAction={
                                <Box>
                                    {!notif.leida && (
                                        <IconButton size="small" onClick={() => handleMarcarComoLeida(notif.id)}>
                                            <CheckIcon sx={{ fontSize: 16, color: colors.success }} />
                                        </IconButton>
                                    )}
                                    <IconButton size="small" onClick={() => handleEliminarNotificacion(notif.id)}>
                                        <CloseIcon sx={{ fontSize: 16, color: colors.error }} />
                                    </IconButton>
                                </Box>
                            }
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning }}>
                                    <WarningIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={notif.titulo}
                                secondary={notif.mensaje}
                                primaryTypographyProps={{ fontWeight: notif.leida ? 400 : 600 }}
                            />
                        </NotificacionItem>
                    ))
                ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography color="textSecondary">No hay notificaciones</Typography>
                    </Box>
                )}
            </List>
        </Popover>
    );

    if (!user) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando...</Typography>
        </Box>
    );

    return (
        <ThemeProvider theme={customTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {drawer}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <AppBar
                        position="fixed"
                        elevation={1}
                        sx={{
                            zIndex: (theme) => theme.zIndex.drawer + 1,
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Toolbar>
                            <IconButton color="inherit" onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
                                <MenuIcon />
                            </IconButton>
                            <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                                Historial de Disposiciones
                            </Typography>

                            <IconButton color="inherit" onClick={handleNotificacionesClick}>
                                <Badge badgeContent={notificacionesNoLeidas} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                            <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                                {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
                            </IconButton>
                            <IconButton color="inherit" onClick={handleMenu}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {user?.nombre?.charAt(0) || user?.usuario?.charAt(0) || 'U'}
                                </Avatar>
                            </IconButton>

                            <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                                <MuiMenuItem onClick={() => { setOpenPerfil(true); setAnchorEl(null); }}>
                                    <PersonIcon sx={{ mr: 1 }} /> Perfil
                                </MuiMenuItem>
                                <MuiMenuItem onClick={() => { setOpenConfig(true); setAnchorEl(null); }}>
                                    <SettingsIcon sx={{ mr: 1 }} /> Configuración
                                </MuiMenuItem>
                                <Divider />
                                <MuiMenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 1 }} /> Salir
                                </MuiMenuItem>
                            </MuiMenu>
                        </Toolbar>
                    </AppBar>

                    <Toolbar id="back-to-top" />

                    <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                        {/* Header con gradiente */}
                        <Paper
                            sx={{
                                p: { xs: 3, md: 4 },
                                mb: 4,
                                borderRadius: 4,
                                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                                color: 'white',
                            }}
                        >
                            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                Historial de Disposiciones
                            </Typography>
                            <Typography sx={{ opacity: 0.9, mb: 3 }}>
                                Consulta todos los movimientos, documentos y acciones del sistema
                            </Typography>
                            
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <GradientButton
                                    startIcon={mostrarFiltros ? <FilterAltOffIcon /> : <FilterAltIcon />}
                                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                                >
                                    {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
                                </GradientButton>
                                
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportExcel}
                                    disabled={exportLoading}
                                    sx={{
                                        borderColor: 'white',
                                        color: 'white',
                                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    {exportLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Exportar Excel'}
                                </Button>
                            </Stack>

                            {apiError && (
                                <Alert severity="warning" sx={{ mt: 3 }} icon={<ErrorIcon />} action={
                                    <Button color="inherit" size="small" onClick={handleRefresh}>
                                        REINTENTAR
                                    </Button>
                                }>
                                    Error de conexión con el servidor
                                </Alert>
                            )}
                        </Paper>

                        {/* Stats Cards */}
                        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <StatCard
                                    icon={HistoryIcon}
                                    title="TOTAL REGISTROS"
                                    value={historialCompleto.length}
                                    color={colors.primary}
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <StatCard
                                    icon={HistoryIcon}
                                    title="GENERAL"
                                    value={historialGeneral.length}
                                    change={historialCompleto.length > 0 ? `${((historialGeneral.length / historialCompleto.length) * 100).toFixed(0)}%` : '0%'}
                                    color={colors.success}
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <StatCard
                                    icon={DocumentIcon}
                                    title="DOCUMENTOS"
                                    value={historialDocumentos.length}
                                    change={historialCompleto.length > 0 ? `${((historialDocumentos.length / historialCompleto.length) * 100).toFixed(0)}%` : '0%'}
                                    color={colors.warning}
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <StatCard
                                    icon={AutorenewIcon}
                                    title="ESTADOS"
                                    value={historialEstados.length}
                                    change={historialCompleto.length > 0 ? `${((historialEstados.length / historialCompleto.length) * 100).toFixed(0)}%` : '0%'}
                                    color={colors.info}
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={6} sm={6} md={2.4}>
                                <StatCard
                                    icon={MovimientoIcon}
                                    title="MOVIMIENTOS"
                                    value={movimientos.length}
                                    change={historialCompleto.length > 0 ? `${((movimientos.length / historialCompleto.length) * 100).toFixed(0)}%` : '0%'}
                                    color={colors.secondary}
                                    loading={loading}
                                />
                            </Grid>
                        </Grid>

                        {/* Filtros */}
                        {mostrarFiltros && (
                            <FilterPaper>
                                <Fade in={mostrarFiltros}>
                                    <Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Buscar en el historial..."
                                                    value={filtros.busqueda}
                                                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon sx={{ color: 'text.secondary' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: filtros.busqueda && (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => handleFiltroChange('busqueda', '')}>
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Tipo</InputLabel>
                                                    <Select
                                                        value={filtros.tipo}
                                                        onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                                                        label="Tipo"
                                                    >
                                                        <MenuItem value="todos">Todos</MenuItem>
                                                        <MenuItem value="general">General</MenuItem>
                                                        <MenuItem value="documento">Documentos</MenuItem>
                                                        <MenuItem value="estado">Estados</MenuItem>
                                                        <MenuItem value="movimiento">Movimientos</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                    <DatePicker
                                                        label="Desde"
                                                        value={filtros.fechaInicio}
                                                        onChange={(date) => handleFiltroChange('fechaInicio', date)}
                                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                    <DatePicker
                                                        label="Hasta"
                                                        value={filtros.fechaFin}
                                                        onChange={(date) => handleFiltroChange('fechaFin', date)}
                                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                        </Grid>
                                        <Box display="flex" justifyContent="flex-end" mt={2}>
                                            <Button 
                                                size="small" 
                                                onClick={limpiarFiltros}
                                                startIcon={<ClearIcon />}
                                                variant="outlined"
                                                sx={{ mr: 1 }}
                                            >
                                                Limpiar
                                            </Button>
                                            <Button 
                                                size="small" 
                                                onClick={() => setMostrarFiltros(false)}
                                                variant="contained"
                                                color="primary"
                                            >
                                                Aplicar
                                            </Button>
                                        </Box>
                                    </Box>
                                </Fade>
                            </FilterPaper>
                        )}

                        {/* Tabs */}
                        <Paper sx={{ width: '100%', borderRadius: 2 }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ 
                                    borderBottom: 1, 
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    borderTopLeftRadius: 8,
                                    borderTopRightRadius: 8,
                                }}
                            >
                                <Tab 
                                    icon={<HistoryIcon />} 
                                    label={isMobile ? "" : "COMPLETO"} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<HistoryIcon />} 
                                    label={isMobile ? "" : "GENERAL"} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<DocumentIcon />} 
                                    label={isMobile ? "" : "DOCUMENTOS"} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<AutorenewIcon />} 
                                    label={isMobile ? "" : "ESTADOS"} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    icon={<MovimientoIcon />} 
                                    label={isMobile ? "" : "MOVIMIENTOS"} 
                                    iconPosition="start"
                                />
                            </Tabs>

                            {/* Panel de Historial Completo */}
                            <TabPanel value={tabValue} index={0}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Tipo</StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'fecha'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('fecha')}
                                                    >
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'producto'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('producto')}
                                                    >
                                                        Producto
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Acción</StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'usuario'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('usuario')}
                                                    >
                                                        Usuario
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Detalles</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <CircularProgress />
                                                        <Typography sx={{ mt: 2 }}>Cargando historial...</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom>
                                                            No hay registros en el historial
                                                        </Typography>
                                                        <Button
                                                            variant="contained"
                                                            onClick={handleRefresh}
                                                        >
                                                            Recargar
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, index)} hover>
                                                        <TableCell>
                                                            <Chip
                                                                icon={getTipoIcon(item)}
                                                                label={getTipoLabel(item)}
                                                                size="small"
                                                                sx={{ 
                                                                    bgcolor: alpha(getTipoColor(item), 0.1),
                                                                    color: getTipoColor(item),
                                                                    fontWeight: 500
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {getFechaTexto(item)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {getProductoTexto(item)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={getAccionTexto(item)}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {getUsuarioTexto(item)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={getDetallesTexto(item)}>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        maxWidth: 250,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                >
                                                                    {getDetallesTexto(item)}
                                                                </Typography>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Historial General */}
                            <TabPanel value={tabValue} index={1}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'fecha'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('fecha')}
                                                    >
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'producto'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('producto')}
                                                    >
                                                        Producto
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Acción</StyledTableCell>
                                                <StyledTableCell>OC/Factura</StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'usuario'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('usuario')}
                                                    >
                                                        Usuario
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Detalles</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(historialGeneral.map(item => ({ ...item, origen: 'general' }))).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom>
                                                            No hay registros en el historial general
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ordenarDatos(filtrarHistorial(historialGeneral.map(item => ({ ...item, origen: 'general' }))))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, item.id || index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {getProductoTexto(item)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={item.accion} 
                                                                size="small" 
                                                                sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.oc_numero && <div>OC: {item.oc_numero}</div>}
                                                            {item.factura_numero && <div>Fact: {item.factura_numero}</div>}
                                                        </TableCell>
                                                        <TableCell>{getUsuarioTexto(item)}</TableCell>
                                                        <TableCell>{getDetallesTexto(item)}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Historial Documentos */}
                            <TabPanel value={tabValue} index={2}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'fecha'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('fecha')}
                                                    >
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Documento</StyledTableCell>
                                                <StyledTableCell>Acción</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                                <StyledTableCell>IP</StyledTableCell>
                                                <StyledTableCell>Detalles</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(historialDocumentos.map(item => ({ ...item, origen: 'documento' }))).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <DocumentIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom>
                                                            No hay registros en el historial de documentos
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ordenarDatos(filtrarHistorial(historialDocumentos.map(item => ({ ...item, origen: 'documento' }))))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, item.id || index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <DocumentIcon sx={{ color: colors.secondary, fontSize: 20 }} />
                                                                {item.nombre_documento || `ID: ${item.documento_id}`}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={item.accion} 
                                                                size="small" 
                                                                sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{getUsuarioTexto(item)}</TableCell>
                                                        <TableCell>{item.ip_usuario || 'N/A'}</TableCell>
                                                        <TableCell>{getDetallesTexto(item)}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Historial Estados */}
                            <TabPanel value={tabValue} index={3}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'fecha'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('fecha')}
                                                    >
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Producto</StyledTableCell>
                                                <StyledTableCell>Cambio</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                                <StyledTableCell>IP</StyledTableCell>
                                                <StyledTableCell>Detalles</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(historialEstados.map(item => ({ ...item, origen: 'estado' }))).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <AutorenewIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom>
                                                            No hay registros de cambios de estado
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ordenarDatos(filtrarHistorial(historialEstados.map(item => ({ ...item, origen: 'estado' }))))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, item.id || index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {item.producto_nombre || `ID: ${item.producto_id}`}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                                <Chip 
                                                                    label={item.estado_anterior || '?'} 
                                                                    size="small" 
                                                                    sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning }}
                                                                />
                                                                <AutorenewIcon sx={{ fontSize: 16, color: colors.text.secondary }} />
                                                                <Chip 
                                                                    label={item.estado_nuevo || item.estado || '?'} 
                                                                    size="small" 
                                                                    sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success }}
                                                                />
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{getUsuarioTexto(item)}</TableCell>
                                                        <TableCell>{item.ip_usuario || 'N/A'}</TableCell>
                                                        <TableCell>{getDetallesTexto(item)}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Movimientos */}
                            <TabPanel value={tabValue} index={4}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'fecha'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('fecha')}
                                                    >
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel
                                                        active={orderBy === 'producto'}
                                                        direction={order}
                                                        onClick={() => handleRequestSort('producto')}
                                                    >
                                                        Producto
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Tipo</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                                <StyledTableCell>Observaciones</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(movimientos.map(item => ({ ...item, origen: 'movimiento' }))).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                                        <MovimientoIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6" gutterBottom>
                                                            No hay registros de movimientos
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                ordenarDatos(filtrarHistorial(movimientos.map(item => ({ ...item, origen: 'movimiento' }))))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, item.id || index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {item.producto_nombre || `ID: ${item.producto_id}`}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={item.tipo_movimiento || item.accion} 
                                                                size="small" 
                                                                sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{item.usuario_responsable || item.usuario_nombre}</TableCell>
                                                        <TableCell>{item.observaciones || item.detalles}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Paginación */}
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                component="div"
                                count={datosFiltrados.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Filas"
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                            />
                        </Paper>

                        {/* Diálogos de Perfil y Configuración */}
                        <Dialog open={openPerfil} onClose={() => setOpenPerfil(false)} maxWidth="sm" fullWidth>
                            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6">Mi Perfil</Typography>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Nombre"
                                            value={perfilData.nombre}
                                            onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={perfilData.email}
                                            onChange={(e) => setPerfilData({ ...perfilData, email: e.target.value })}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Usuario"
                                            value={perfilData.usuario}
                                            disabled
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Rol"
                                            value={perfilData.rol}
                                            disabled
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setOpenPerfil(false)} variant="outlined">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => { showSnackbar('Perfil actualizado', 'success'); setOpenPerfil(false); }}
                                    variant="contained"
                                >
                                    Guardar
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="sm" fullWidth>
                            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="h6">Configuración</Typography>
                            </DialogTitle>
                            <DialogContent dividers>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Modo Oscuro"
                                            secondary="Activar tema oscuro"
                                        />
                                        <Switch
                                            checked={darkMode}
                                            onChange={(e) => setDarkMode(e.target.checked)}
                                        />
                                    </ListItem>
                                </List>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setOpenConfig(false)} variant="outlined">
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => { showSnackbar('Configuración guardada', 'success'); setOpenConfig(false); }}
                                    variant="contained"
                                >
                                    Guardar
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Snackbar */}
                        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {snackbar.message}
                            </Alert>
                        </Snackbar>

                        {/* Notificaciones Popover */}
                        {notificacionesPopover}
                    </Container>

                    <ScrollTop />
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default HistorialDisposiciones;