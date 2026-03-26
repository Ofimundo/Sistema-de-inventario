// src/pages/HistorialPage.jsx - VERSIÓN CORREGIDA CON STOCK EN MENÚ
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
    Switch,
    Fade,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tab,
    Tabs
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
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
    Warning as WarningIcon,
    DeleteForever as DeleteForeverIcon,
    VolunteerActivism as VolunteerActivismIcon,
    Inventory2 as Inventory2Icon,
    BarChart as BarChartIcon
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
function StatCard({ icon: Icon, title, value, color, loading }) {
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
        <StyledCard>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Avatar sx={{ bgcolor: alpha(color, 0.1), color, width: 48, height: 48 }}>
                        <Icon />
                    </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {title}
                </Typography>
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

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

// Función para generar clave única
const generarKeyUnica = (item, index) => {
    if (item && item.id) {
        return `${item.origen || 'item'}-${item.id}-${index}`;
    }
    return `${item?.origen || 'item'}-${index}-${Date.now()}-${Math.random()}`;
};

const HistorialPage = () => {
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
    const [bajas, setBajas] = useState([]);
    const [donaciones, setDonaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
        origen: 'todos',
        fechaInicio: null,
        fechaFin: null
    });

    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    
    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // MENÚ ACTUALIZADO CON STOCK POR MARCA Y MODELO
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
        { text: 'Bodegas', icon: <WarehouseIcon />, path: '/bodegas' },
        { text: 'Colaboradores', icon: <PersonIcon />, path: '/colaboradores' },
        { text: 'Asignaciones', icon: <AssignmentIcon />, path: '/asignacion' },
        { text: 'Stock por Marca/Modelo', icon: <Inventory2Icon />, path: '/stock' },
        { text: 'Historial', icon: <HistoryIcon />, path: '/historial' },
    ];

    // Función para mostrar notificaciones
    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Cargar notificaciones
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

    const saveNotificacionesToStorage = useCallback((notis) => {
        try {
            localStorage.setItem('dashboard_notificaciones', JSON.stringify(notis));
        } catch (error) {
            console.error('Error saving notificaciones:', error);
        }
    }, []);

    const handleMarcarComoLeida = useCallback((id) => {
        setNotificaciones((prev) => {
            const nuevas = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
        showSnackbar('Notificación marcada como leída', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    const handleMarcarTodasLeidas = useCallback(() => {
        setNotificaciones((prev) => {
            const nuevas = prev.map((n) => ({ ...n, leida: true }));
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas(0);
        showSnackbar('Todas las notificaciones marcadas', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    const handleEliminarNotificacion = useCallback((id) => {
        setNotificaciones((prev) => {
            const nuevas = prev.filter((n) => n.id !== id);
            saveNotificacionesToStorage(nuevas);
            return nuevas;
        });
        setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
        showSnackbar('Notificación eliminada', 'success');
    }, [saveNotificacionesToStorage, showSnackbar]);

    const handleEliminarTodasNotificaciones = useCallback(() => {
        setNotificaciones([]);
        setNotificacionesNoLeidas(0);
        localStorage.removeItem('dashboard_notificaciones');
        showSnackbar('Todas las notificaciones eliminadas', 'success');
    }, [showSnackbar]);

    // Exportar a Excel
    const handleExportExcel = useCallback(async () => {
        if (exportLoading) return;
        
        try {
            setExportLoading(true);
            showSnackbar('Generando reporte de historial...', 'info');
            
            const blob = await historialService.exportarExcel(filtros);
            
            if (!blob || blob.size === 0) {
                throw new Error('El archivo generado está vacío');
            }
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            let nombreArchivo = `historial_completo_${fecha}.xlsx`;
            
            if (filtros.origen && filtros.origen !== 'todos') {
                nombreArchivo = `historial_${filtros.origen}_${fecha}.xlsx`;
            }
            
            link.setAttribute('download', nombreArchivo);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSnackbar('✅ Reporte generado y descargado exitosamente', 'success');
            
        } catch (error) {
            console.error('❌ Error exportando:', error);
            let errorMessage = 'Error al generar el reporte';
            if (error.message) errorMessage = error.message;
            showSnackbar(errorMessage, 'error');
        } finally {
            setExportLoading(false);
        }
    }, [showSnackbar, filtros, exportLoading]);

    // Cargar historial
    const cargarHistorial = useCallback(async () => {
        setLoading(true);
        setApiError(false);
        
        try {
            console.log('🔄 Cargando historial...');
            
            const completoResponse = await historialService.getHistorialCompleto();
            
            if (completoResponse && completoResponse.success) {
                const data = completoResponse.data || {};
                
                setHistorialCompleto(data.completo || []);
                setBajas(data.bajas || []);
                setDonaciones(data.donaciones || []);
                
                console.log('✅ Historial cargado:', {
                    completo: data.completo?.length || 0,
                    bajas: data.bajas?.length || 0,
                    donaciones: data.donaciones?.length || 0
                });
                
                setApiError(false);
            } else {
                setHistorialCompleto([]);
                setBajas([]);
                setDonaciones([]);
                console.log('⚠️ No se recibieron datos válidos del servidor');
            }

        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            setApiError(true);
            showSnackbar('Error al cargar el historial', 'error');
            setHistorialCompleto([]);
            setBajas([]);
            setDonaciones([]);
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
        cargarHistorial();
    }, [navigate, loadNotificacionesFromStorage, cargarHistorial]);

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
            origen: 'todos',
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
        cargarHistorial();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const getFechaTexto = (item) => {
        const fecha = item.fecha || item.fecha_hora || item.fecha_accion;
        if (!fecha) return 'Fecha desconocida';
        try {
            return new Date(fecha).toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const getIconoPorOrigen = (origen, accion) => {
        if (origen === 'baja') return <DeleteForeverIcon />;
        if (origen === 'donacion') return <VolunteerActivismIcon />;
        if (origen === 'historial') return <HistoryIcon />;
        return <MovimientoIcon />;
    };

    const getColorPorOrigen = (origen, accion) => {
        if (origen === 'baja') return colors.error;
        if (origen === 'donacion') return colors.secondary;
        if (origen === 'historial') return colors.primary;
        return colors.info;
    };

    const getLabelPorOrigen = (origen, accion) => {
        if (origen === 'baja') return 'Baja';
        if (origen === 'donacion') return 'Donación';
        if (origen === 'historial') return 'Historial';
        return 'Movimiento';
    };

    // Obtener datos según pestaña
    const getDatosActuales = () => {
        switch(tabValue) {
            case 0: return historialCompleto;
            case 1: return bajas;
            case 2: return donaciones;
            default: return [];
        }
    };

    // Filtrar datos
    const filtrarDatos = (items) => {
        if (!items || items.length === 0) return [];
        
        return items.filter(item => {
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                const producto = item.producto_nombre || '';
                const descripcion = item.descripcion || '';
                const usuario = item.usuario_responsable || '';
                
                const coincide = 
                    producto.toLowerCase().includes(busquedaLower) ||
                    descripcion.toLowerCase().includes(busquedaLower) ||
                    usuario.toLowerCase().includes(busquedaLower);
                
                if (!coincide) return false;
            }

            if (filtros.origen !== 'todos' && item.origen !== filtros.origen) {
                return false;
            }

            const fecha = new Date(item.fecha || 0);
            if (filtros.fechaInicio && fecha < filtros.fechaInicio) return false;
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59);
                if (fecha > fechaFin) return false;
            }

            return true;
        });
    };

    const ordenarDatos = (items) => {
        if (!items || items.length === 0) return [];
        
        return [...items].sort((a, b) => {
            let aValue, bValue;
            
            if (orderBy === 'fecha') {
                aValue = new Date(a.fecha || 0);
                bValue = new Date(b.fecha || 0);
            } else if (orderBy === 'producto') {
                aValue = a.producto_nombre || '';
                bValue = b.producto_nombre || '';
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

    const datosFiltrados = ordenarDatos(filtrarDatos(getDatosActuales()));
    const paginatedData = datosFiltrados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const origenesUnicos = ['todos', ...new Set(historialCompleto.map(i => i.origen).filter(Boolean))];

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
                    notificaciones.map((notif) => (
                        <NotificacionItem
                            key={generarKeyUnica(notif, notif.id)}
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
                            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                                Historial del Sistema
                            </Typography>

                            <IconButton color="inherit" onClick={handleNotificacionesClick}>
                                <Badge badgeContent={notificacionesNoLeidas} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                            <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                                {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                            </IconButton>
                            <IconButton color="inherit" onClick={handleMenu}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    {user?.nombre?.charAt(0) || user?.usuario?.charAt(0) || 'U'}
                                </Avatar>
                            </IconButton>

                            <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                                <MuiMenuItem onClick={() => { setOpenPerfil(true); handleClose(); }}>
                                    <PersonIcon sx={{ mr: 1 }} /> Perfil
                                </MuiMenuItem>
                                <MuiMenuItem onClick={() => { setOpenConfig(true); handleClose(); }}>
                                    <SettingsIcon sx={{ mr: 1 }} /> Configuración
                                </MuiMenuItem>
                                <Divider />
                                <MuiMenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 1 }} /> Salir
                                </MuiMenuItem>
                            </MuiMenu>
                        </Toolbar>
                    </AppBar>

                    <Toolbar />

                    <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                        {/* Header */}
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
                                Historial del Sistema
                            </Typography>
                            <Typography sx={{ opacity: 0.9, mb: 3 }}>
                                Consulta todos los movimientos, bajas y donaciones realizados
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
                                <Alert severity="warning" sx={{ mt: 3 }} action={
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
                            <Grid item xs={12} sm={6} md={4}>
                                <StatCard icon={HistoryIcon} title="TOTAL REGISTROS" value={historialCompleto.length} color={colors.primary} loading={loading} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <StatCard icon={DeleteForeverIcon} title="BAJAS" value={bajas.length} color={colors.error} loading={loading} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <StatCard icon={VolunteerActivismIcon} title="DONACIONES" value={donaciones.length} color={colors.secondary} loading={loading} />
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
                                                    placeholder="Buscar por producto, descripción o usuario..."
                                                    value={filtros.busqueda}
                                                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                                                        endAdornment: filtros.busqueda && (
                                                            <IconButton size="small" onClick={() => handleFiltroChange('busqueda', '')}>
                                                                <CloseIcon fontSize="small" />
                                                            </IconButton>
                                                        )
                                                    }}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={2}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Origen</InputLabel>
                                                    <Select
                                                        value={filtros.origen}
                                                        onChange={(e) => handleFiltroChange('origen', e.target.value)}
                                                        label="Origen"
                                                    >
                                                        {origenesUnicos.map(o => (
                                                            <MenuItem key={o} value={o}>
                                                                {o === 'todos' ? 'Todos' : o.charAt(0).toUpperCase() + o.slice(1)}
                                                            </MenuItem>
                                                        ))}
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
                                            <Button size="small" onClick={limpiarFiltros} startIcon={<ClearIcon />} variant="outlined" sx={{ mr: 1 }}>
                                                Limpiar
                                            </Button>
                                            <Button size="small" onClick={() => setMostrarFiltros(false)} variant="contained">
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
                                sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
                            >
                                <Tab icon={<HistoryIcon />} label={isMobile ? "" : "TODOS"} iconPosition="start" />
                                <Tab icon={<DeleteForeverIcon />} label={isMobile ? "" : "BAJAS"} iconPosition="start" />
                                <Tab icon={<VolunteerActivismIcon />} label={isMobile ? "" : "DONACIONES"} iconPosition="start" />
                            </Tabs>

                            {/* Panel de Todos */}
                            <TabPanel value={tabValue} index={0}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Origen</StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel active={orderBy === 'fecha'} direction={order} onClick={() => handleRequestSort('fecha')}>
                                                        Fecha
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <TableSortLabel active={orderBy === 'producto'} direction={order} onClick={() => handleRequestSort('producto')}>
                                                        Producto
                                                    </TableSortLabel>
                                                </StyledTableCell>
                                                <StyledTableCell>Acción</StyledTableCell>
                                                <StyledTableCell>Descripción</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                                            ) : paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                                        <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                                        <Typography variant="h6">No hay registros</Typography>
                                                        <Typography variant="body2" color="text.secondary">No se encontraron movimientos en el historial</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, index)} hover>
                                                        <TableCell>
                                                            <Chip
                                                                icon={getIconoPorOrigen(item.origen, item.accion)}
                                                                label={getLabelPorOrigen(item.origen, item.accion)}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(getColorPorOrigen(item.origen, item.accion), 0.1),
                                                                    color: getColorPorOrigen(item.origen, item.accion)
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {item.producto_nombre || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={item.accion} size="small" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={item.descripcion || ''}>
                                                                <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {item.descripcion || 'Sin descripción'}
                                                                </Typography>
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell>{item.usuario_responsable || 'Sistema'}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Bajas */}
                            <TabPanel value={tabValue} index={1}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'}>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Fecha</StyledTableCell>
                                                <StyledTableCell>Producto</StyledTableCell>
                                                <StyledTableCell>Motivo</StyledTableCell>
                                                <StyledTableCell>Observaciones</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                                            ) : bajas.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} align="center">No hay bajas registradas</TableCell></TableRow>
                                            ) : (
                                                bajas.map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>{item.producto_nombre || 'N/A'}</TableCell>
                                                        <TableCell>{item.motivo_baja || item.descripcion || 'Sin motivo'}</TableCell>
                                                        <TableCell>{item.observaciones || '-'}</TableCell>
                                                        <TableCell>{item.usuario_responsable || item.autorizado_por || 'Sistema'}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Panel de Donaciones */}
                            <TabPanel value={tabValue} index={2}>
                                <StyledTableContainer>
                                    <Table size={isTablet ? 'small' : 'medium'}>
                                        <TableHead>
                                            <TableRow>
                                                <StyledTableCell>Fecha</StyledTableCell>
                                                <StyledTableCell>Producto</StyledTableCell>
                                                <StyledTableCell>Beneficiario</StyledTableCell>
                                                <StyledTableCell>Dirección</StyledTableCell>
                                                <StyledTableCell>Usuario</StyledTableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                                            ) : donaciones.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} align="center">No hay donaciones registradas</TableCell></TableRow>
                                            ) : (
                                                donaciones.map((item, index) => (
                                                    <StyledTableRow key={generarKeyUnica(item, index)} hover>
                                                        <TableCell>{getFechaTexto(item)}</TableCell>
                                                        <TableCell>{item.producto_nombre || 'N/A'}</TableCell>
                                                        <TableCell>{item.beneficiario || item.descripcion || 'N/A'}</TableCell>
                                                        <TableCell>{item.direccion || '-'}</TableCell>
                                                        <TableCell>{item.usuario_responsable || 'Sistema'}</TableCell>
                                                    </StyledTableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            </TabPanel>

                            {/* Paginación */}
                            {datosFiltrados.length > rowsPerPage && (
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    component="div"
                                    count={datosFiltrados.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    labelRowsPerPage="Filas"
                                    sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                                />
                            )}
                        </Paper>

                        {/* Diálogos */}
                        <Dialog open={openPerfil} onClose={() => setOpenPerfil(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Mi Perfil</DialogTitle>
                            <DialogContent dividers>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}><TextField fullWidth label="Nombre" value={perfilData.nombre} onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })} /></Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Email" value={perfilData.email} onChange={(e) => setPerfilData({ ...perfilData, email: e.target.value })} /></Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Usuario" value={perfilData.usuario} disabled /></Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Rol" value={perfilData.rol} disabled /></Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenPerfil(false)}>Cancelar</Button>
                                <Button onClick={() => { showSnackbar('Perfil actualizado'); setOpenPerfil(false); }} variant="contained">Guardar</Button>
                            </DialogActions>
                        </Dialog>

                        <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Configuración</DialogTitle>
                            <DialogContent dividers>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>{darkMode ? <DarkModeIcon /> : <LightModeIcon />}</ListItemIcon>
                                        <ListItemText primary="Modo Oscuro" secondary="Activar tema oscuro" />
                                        <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                                    </ListItem>
                                </List>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenConfig(false)}>Cancelar</Button>
                                <Button onClick={() => { showSnackbar('Configuración guardada'); setOpenConfig(false); }} variant="contained">Guardar</Button>
                            </DialogActions>
                        </Dialog>

                        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
                        </Snackbar>

                        {notificacionesPopover}
                    </Container>

                    <ScrollTop />
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default HistorialPage;