// src/pages/BodegasPage.jsx - VERSIÓN CORREGIDA
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
    CardActionArea,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    CssBaseline,
    ThemeProvider,
    createTheme,
    Menu as MuiMenu,
    MenuItem as MuiMenuItem,
    Collapse,
    Skeleton,
    Zoom,
    Fab,
    styled
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Warehouse as WarehouseIcon,
    Inventory as InventoryIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Close as CloseIcon,
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    History as HistoryIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Assignment as AssignmentIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    DeleteForever as DeleteForeverIcon,
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
    People as PeopleIcon,
    Store as StoreIcon,
    Warning as WarningIcon,
    Cancel as CancelIcon,
    Inventory2 as Inventory2Icon,
    Visibility as VisibilityIcon,
    Description as DescriptionIcon,
    Build as BuildIcon
} from '@mui/icons-material';
import api from '../services/api';
import OfilabFooter from '../components/OfilabFooter';

const drawerWidth = 260;

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

// Diálogo de confirmación personalizado
function ConfirmDeleteDialog({ open, onClose, onConfirm, bodegaNombre, loading }) {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ 
                bgcolor: alpha(colors.error, 0.1), 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderBottom: `1px solid ${alpha(colors.error, 0.2)}`
            }}>
                <Avatar sx={{ bgcolor: colors.error, width: 56, height: 56 }}>
                    <WarningIcon sx={{ fontSize: 32 }} />
                </Avatar>
            </Box>
            
            <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    ¿Eliminar Bodega?
                </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Estás a punto de eliminar la bodega:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.error, mb: 2 }}>
                    "{bodegaNombre}"
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Esta acción no se puede deshacer. Los productos asociados a esta bodega quedarán sin ubicación.
                    </Typography>
                </Alert>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
                <Button 
                    onClick={onClose}
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    sx={{ flex: 1 }}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button 
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                    sx={{ flex: 1 }}
                    disabled={loading}
                >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

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

// Tarjeta de producto mejorada
function ProductoCard({ producto, onVerDetalle }) {
    const getEstadoColor = (estado) => {
        switch(estado?.toUpperCase()) {
            case 'DISPONIBLE': return colors.success;
            case 'ASIGNADO': return colors.warning;
            case 'EN MANTENCIÓN': return colors.info;
            case 'EN REPARACIÓN': return colors.secondary;
            default: return colors.text.secondary;
        }
    };

    return (
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, '&:hover': { boxShadow: 2 } }}>
            <CardActionArea onClick={() => onVerDetalle(producto)}>
                <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), width: 40, height: 40 }}>
                                    <InventoryIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{producto.nombre || 'Sin nombre'}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Serie: {producto.numero_serie || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant="caption" color="text.secondary">Marca/Modelo</Typography>
                            <Typography variant="body2">{producto.marca || '-'} / {producto.modelo || '-'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant="caption" color="text.secondary">Stock</Typography>
                            <Chip 
                                label={producto.cantidad || producto.stock || 0} 
                                size="small" 
                                color="primary" 
                                sx={{ fontWeight: 600, mt: 0.5 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Typography variant="caption" color="text.secondary">Estado</Typography>
                            <Chip 
                                label={producto.estado || producto.estado_texto || 'DISPONIBLE'} 
                                size="small" 
                                sx={{
                                    mt: 0.5,
                                    backgroundColor: alpha(getEstadoColor(producto.estado || producto.estado_texto), 0.1),
                                    color: getEstadoColor(producto.estado || producto.estado_texto),
                                    fontWeight: 500
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

// Diálogo de detalle de producto
function ProductoDetailDialog({ open, onClose, producto }) {
    if (!producto) return null;

    const getEstadoColor = (estado) => {
        switch(estado?.toUpperCase()) {
            case 'DISPONIBLE': return colors.success;
            case 'ASIGNADO': return colors.warning;
            case 'EN MANTENCIÓN': return colors.info;
            case 'EN REPARACIÓN': return colors.secondary;
            default: return colors.text.secondary;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: alpha(colors.primary, 0.05) }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <InventoryIcon sx={{ color: colors.primary }} />
                    <Typography variant="h6">Detalle del Producto</Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{producto.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            N° Serie: {producto.numero_serie || 'N/A'}
                        </Typography>
                        {producto.codigo_qr && (
                            <Typography variant="body2" color="text.secondary">
                            Código QR: {producto.codigo_qr}
                            </Typography>
                        )}
                    </Grid>
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Marca</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{producto.marca || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Modelo</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{producto.modelo || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Precio</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ${(producto.precio || 0).toLocaleString('es-CL')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Condición</Typography>
                        <Chip 
                            label={producto.condicion || 'NUEVO'} 
                            size="small" 
                            sx={{ mt: 0.5 }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Estado</Typography>
                        <Chip 
                            label={producto.estado || producto.estado_texto || 'DISPONIBLE'} 
                            size="small" 
                            sx={{
                                mt: 0.5,
                                backgroundColor: alpha(getEstadoColor(producto.estado || producto.estado_texto), 0.1),
                                color: getEstadoColor(producto.estado || producto.estado_texto)
                            }}
                        />
                    </Grid>
                    {producto.descripcion && (
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Descripción</Typography>
                            <Typography variant="body2">{producto.descripcion}</Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}

// Botón flotante
function ScrollTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(document.documentElement.scrollTop > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <Zoom in={visible}>
            <Box
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
            >
                <Fab size="small" sx={{ bgcolor: colors.primary, color: 'white' }}>
                    <ChevronLeftIcon sx={{ transform: 'rotate(90deg)' }} />
                </Fab>
            </Box>
        </Zoom>
    );
}

const BodegasPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
    
    // Estados
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [darkMode, setDarkMode] = useState(false);
    
    const [bodegas, setBodegas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({ ubicacion: '', responsable: '' });
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openProductoDetail, setOpenProductoDetail] = useState(false);
    const [selectedBodega, setSelectedBodega] = useState(null);
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [productosEnBodega, setProductosEnBodega] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [orderBy, setOrderBy] = useState('nombre');
    const [order, setOrder] = useState('asc');
    const [stats, setStats] = useState({
        totalBodegas: 0,
        conProductos: 0,
        vacias: 0,
        totalProductos: 0
    });
    
    // Estados para el diálogo de confirmación
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [bodegaToDelete, setBodegaToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        ubicacion: '',
        responsable: '',
        descripcion: ''
    });

    const activeFiltersCount = Object.values(filters).filter(v => v).length;

    // MENÚ ACTUALIZADO
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

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    // Cargar bodegas
    const fetchBodegas = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/bodegas');
            
            let bodegasData = [];
            if (response.data && response.data.success) {
                bodegasData = response.data.data || [];
            } else if (Array.isArray(response.data)) {
                bodegasData = response.data;
            }
            
            console.log('📦 Bodegas cargadas:', bodegasData.length);
            setBodegas(bodegasData);
            setStats({
                totalBodegas: bodegasData.length,
                conProductos: bodegasData.filter(b => (b.total_productos || 0) > 0).length,
                vacias: bodegasData.filter(b => (b.total_productos || 0) === 0).length,
                totalProductos: bodegasData.reduce((acc, b) => acc + (b.total_productos || 0), 0)
            });
        } catch (error) {
            console.error('Error cargando bodegas:', error);
            showSnackbar('Error al cargar bodegas', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showSnackbar]);

    // ✅ FUNCIÓN CORREGIDA para cargar productos de una bodega específica
    const handleVerProductos = useCallback(async (bodega) => {
        try {
            setSelectedBodega(bodega);
            setOpenDetail(true);
            setLoadingProductos(true);
            
            console.log('🔍 Cargando productos de bodega:', bodega.id, bodega.nombre);
            
            // Usar el endpoint correcto que devuelve los productos
            const response = await api.get(`/bodegas/${bodega.id}`);
            
            let productosData = [];
            if (response.data && response.data.success) {
                // La respuesta viene en response.data.data.productos
                if (response.data.data && response.data.data.productos) {
                    productosData = response.data.data.productos;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    productosData = response.data.data;
                } else if (Array.isArray(response.data.data)) {
                    productosData = response.data.data;
                }
            } else if (Array.isArray(response.data)) {
                productosData = response.data;
            }
            
            console.log(`📦 Productos encontrados en ${bodega.nombre}:`, productosData.length);
            setProductosEnBodega(productosData);
            
            if (productosData.length === 0) {
                showSnackbar(`No hay productos en ${bodega.nombre}`, 'info');
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            showSnackbar('Error al cargar productos de la bodega', 'error');
            setProductosEnBodega([]);
        } finally {
            setLoadingProductos(false);
        }
    }, [showSnackbar]);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(currentUser);
        fetchBodegas();
    }, [fetchBodegas]);

    const handleOpenForm = (bodega = null) => {
        if (bodega) {
            setFormData({
                nombre: bodega.nombre || '',
                ubicacion: bodega.ubicacion || '',
                responsable: bodega.responsable || '',
                descripcion: bodega.descripcion || ''
            });
            setSelectedBodega(bodega);
        } else {
            setFormData({
                nombre: '',
                ubicacion: '',
                responsable: '',
                descripcion: ''
            });
            setSelectedBodega(null);
        }
        setOpenForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSaveBodega = async () => {
        try {
            if (!formData.nombre?.trim()) {
                showSnackbar('El nombre es requerido', 'error');
                return;
            }

            const bodegaData = {
                nombre: formData.nombre.trim(),
                ubicacion: formData.ubicacion?.trim() || '',
                responsable: formData.responsable?.trim() || null,
                descripcion: formData.descripcion?.trim() || ''
            };

            if (selectedBodega) {
                await api.put(`/bodegas/${selectedBodega.id}`, bodegaData);
                showSnackbar('Bodega actualizada', 'success');
            } else {
                await api.post('/bodegas', bodegaData);
                showSnackbar('Bodega creada', 'success');
            }
            
            handleCloseForm();
            fetchBodegas();
        } catch (error) {
            console.error('Error:', error);
            showSnackbar('Error al guardar', 'error');
        }
    };

    // Función para abrir el diálogo de confirmación
    const handleOpenConfirmDialog = (bodega) => {
        setBodegaToDelete(bodega);
        setConfirmDialogOpen(true);
    };

    // Función para cerrar el diálogo de confirmación
    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
        setBodegaToDelete(null);
    };

    // Función para eliminar la bodega
    const handleConfirmDelete = async () => {
        if (!bodegaToDelete) return;
        
        setDeleting(true);
        try {
            await api.delete(`/bodegas/${bodegaToDelete.id}`);
            showSnackbar(`Bodega "${bodegaToDelete.nombre}" eliminada correctamente`, 'success');
            setConfirmDialogOpen(false);
            fetchBodegas();
            setTimeout(() => setBodegaToDelete(null), 300);
        } catch (error) {
            console.error('Error al eliminar:', error);
            showSnackbar('Error al eliminar la bodega', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleCloseForm = () => {
        setOpenForm(false);
        setSelectedBodega(null);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBodegas();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Tema
    const customTheme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: colors.primary },
            secondary: { main: colors.secondary }
        }
    });

    // Filtrar bodegas
    const filteredBodegas = bodegas.filter(b => {
        const responsable = b.responsable || '';
        return (!searchTerm || 
            b.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            responsable.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!filters.ubicacion || b.ubicacion?.toLowerCase().includes(filters.ubicacion.toLowerCase())) &&
            (!filters.responsable || responsable.toLowerCase().includes(filters.responsable.toLowerCase()));
    });

    const sortedBodegas = [...filteredBodegas].sort((a, b) => {
        let aVal = a[orderBy] || '';
        let bVal = b[orderBy] || '';
        if (orderBy === 'responsable') {
            aVal = a.responsable || '';
            bVal = b.responsable || '';
        }
        return order === 'asc' 
            ? aVal.toString().localeCompare(bVal.toString())
            : bVal.toString().localeCompare(aVal.toString());
    });

    const paginatedBodegas = sortedBodegas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const columns = isMobile 
        ? ['nombre', 'productos', 'acciones']
        : isTablet 
            ? ['nombre', 'ubicacion', 'responsable', 'productos', 'acciones']
            : ['nombre', 'ubicacion', 'responsable', 'productos', 'descripcion', 'acciones'];

    return (
        <ThemeProvider theme={customTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                {/* Drawer */}
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
                    <Toolbar>
                        <Box display="flex" alignItems="center" gap={1}>
                            <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                        </Box>
                    </Toolbar>
                    <Divider />
                    <List>
                        {menuItems.map(item => (
                            <ListItemButton 
                                key={item.text} 
                                onClick={() => navigate(item.path)}
                                selected={window.location.pathname === item.path}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        ))}
                    </List>
                </Drawer>

                <Box sx={{ flexGrow: 1 }}>
                    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                        <Toolbar>
                            <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 1.5 }}>
                                <MenuIcon />
                            </IconButton>
                            <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
                                <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '46px', width: 'auto', objectFit: 'contain' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Gestión de Bodegas</Typography>
                            </Box>
                            
                            <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                                {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                            </IconButton>
                            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary }}>
                                    {user?.usuario?.charAt(0) || user?.nombre?.charAt(0) || 'U'}
                                </Avatar>
                            </IconButton>

                            <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                                <MuiMenuItem onClick={() => setDarkMode(!darkMode)}>
                                    {darkMode ? <LightModeIcon sx={{ mr: 1 }} /> : <DarkModeIcon sx={{ mr: 1 }} />}
                                    {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
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
                        {/* Header */}
                        <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: 'white' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Gestión de Bodegas</Typography>
                            <Typography sx={{ mb: 3, opacity: 0.9 }}>Administra las bodegas y visualiza los productos almacenados</Typography>
                            
                            <GradientButton startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
                                Nueva Bodega
                            </GradientButton>
                        </Paper>

                        {/* Stats */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard icon={WarehouseIcon} title="TOTAL BODEGAS" value={stats.totalBodegas} color={colors.primary} loading={loading} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard icon={CheckCircleOutlineIcon} title="CON PRODUCTOS" value={stats.conProductos} color={colors.success} loading={loading} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard icon={DeleteForeverIcon} title="VACÍAS" value={stats.vacias} color={colors.warning} loading={loading} />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard icon={InventoryIcon} title="TOTAL PRODUCTOS" value={stats.totalProductos} color={colors.info} loading={loading} />
                            </Grid>
                        </Grid>

                        {/* Filtros */}
                        <FilterPaper>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={5}>
                                    <TextField
                                        fullWidth
                                        placeholder="Buscar por nombre, ubicación o responsable..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                                            endAdornment: searchTerm && (
                                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                                    <CloseIcon />
                                                </IconButton>
                                            )
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
                                    >
                                        Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                                    </Button>
                                </Grid>
                                <Grid item xs={6} md={4}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="error"
                                        startIcon={<FilterListOffIcon />}
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilters({ ubicacion: '', responsable: '' });
                                        }}
                                    >
                                        Limpiar
                                    </Button>
                                </Grid>
                            </Grid>

                            <Collapse in={showAdvancedFilters}>
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Filtros avanzados</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField 
                                                fullWidth 
                                                label="Ubicación" 
                                                size="small" 
                                                value={filters.ubicacion} 
                                                onChange={(e) => setFilters({...filters, ubicacion: e.target.value})} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField 
                                                fullWidth 
                                                label="Responsable" 
                                                size="small" 
                                                value={filters.responsable} 
                                                onChange={(e) => setFilters({...filters, responsable: e.target.value})} 
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Collapse>
                        </FilterPaper>

                        {/* Tabla */}
                        <StyledTableContainer>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {columns.includes('nombre') && (
                                            <StyledTableCell>
                                                <TableSortLabel active={orderBy === 'nombre'} direction={order} onClick={() => {
                                                    setOrder(orderBy === 'nombre' && order === 'asc' ? 'desc' : 'asc');
                                                    setOrderBy('nombre');
                                                }}>Nombre</TableSortLabel>
                                            </StyledTableCell>
                                        )}
                                        {columns.includes('ubicacion') && <StyledTableCell>Ubicación</StyledTableCell>}
                                        {columns.includes('responsable') && (
                                            <StyledTableCell>
                                                <TableSortLabel active={orderBy === 'responsable'} direction={order} onClick={() => {
                                                    setOrder(orderBy === 'responsable' && order === 'asc' ? 'desc' : 'asc');
                                                    setOrderBy('responsable');
                                                }}>Responsable</TableSortLabel>
                                            </StyledTableCell>
                                        )}
                                        {columns.includes('productos') && (
                                            <StyledTableCell>
                                                <TableSortLabel active={orderBy === 'total_productos'} direction={order} onClick={() => {
                                                    setOrder(orderBy === 'total_productos' && order === 'asc' ? 'desc' : 'asc');
                                                    setOrderBy('total_productos');
                                                }}>Productos</TableSortLabel>
                                            </StyledTableCell>
                                        )}
                                        {columns.includes('descripcion') && <StyledTableCell>Descripción</StyledTableCell>}
                                        <StyledTableCell align="center">Acciones</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={columns.length + 1} align="center"><CircularProgress /></TableCell></TableRow>
                                    ) : paginatedBodegas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 5 }}>
                                                <WarehouseIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                                <Typography variant="h6" color="text.secondary">No hay bodegas registradas</Typography>
                                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()} sx={{ mt: 2 }}>
                                                    Crear Bodega
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedBodegas.map(bodega => (
                                            <StyledTableRow key={bodega.id} hover>
                                                {columns.includes('nombre') && (
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>{bodega.nombre}</Typography>
                                                    </TableCell>
                                                )}
                                                {columns.includes('ubicacion') && (
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <LocationIcon fontSize="small" color="disabled" />
                                                            {bodega.ubicacion || '—'}
                                                        </Box>
                                                    </TableCell>
                                                )}
                                                {columns.includes('responsable') && (
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <PersonIcon fontSize="small" color="disabled" />
                                                            {bodega.responsable || 'Sin responsable'}
                                                        </Box>
                                                    </TableCell>
                                                )}
                                                {columns.includes('productos') && (
                                                    <TableCell>
                                                        <Chip 
                                                            icon={<InventoryIcon fontSize="small" />}
                                                            label={bodega.total_productos || 0}
                                                            size="small"
                                                            color={bodega.total_productos > 0 ? 'success' : 'default'}
                                                            sx={{ fontWeight: 500 }}
                                                        />
                                                    </TableCell>
                                                )}
                                                {columns.includes('descripcion') && (
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {bodega.descripcion || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                )}
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        <Tooltip title="Ver productos">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleVerProductos(bodega)} 
                                                                sx={{ color: colors.info }}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" onClick={() => handleOpenForm(bodega)} sx={{ color: colors.primary }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <IconButton size="small" onClick={() => handleOpenConfirmDialog(bodega)} sx={{ color: colors.error }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={filteredBodegas.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, p) => setPage(p)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                labelRowsPerPage="Filas por página"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />
                        </StyledTableContainer>

                        {/* Diálogo de productos en bodega - CORREGIDO */}
                        <Dialog 
                            open={openDetail} 
                            onClose={() => {
                                setOpenDetail(false);
                                setProductosEnBodega([]);
                            }} 
                            maxWidth="md" 
                            fullWidth
                        >
                            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(colors.primary, 0.02) }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <StoreIcon sx={{ color: colors.primary }} />
                                        <Typography variant="h6">
                                            Productos en {selectedBodega?.nombre}
                                        </Typography>
                                        <Chip 
                                            label={`${productosEnBodega.length} producto${productosEnBodega.length !== 1 ? 's' : ''}`} 
                                            size="small" 
                                            color={productosEnBodega.length > 0 ? 'primary' : 'default'}
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                    <IconButton onClick={() => {
                                        setOpenDetail(false);
                                        setProductosEnBodega([]);
                                    }}>
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </DialogTitle>
                            <DialogContent dividers sx={{ p: 2 }}>
                                {loadingProductos ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Cargando productos...</Typography>
                                    </Box>
                                ) : productosEnBodega.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 5 }}>
                                        <InventoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            No hay productos en esta bodega
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Los productos se asignan a bodegas desde la sección de Productos
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={2}>
                                        {productosEnBodega.map((producto, index) => (
                                            <ProductoCard 
                                                key={producto.id || index} 
                                                producto={producto} 
                                                onVerDetalle={(prod) => {
                                                    setSelectedProducto(prod);
                                                    setOpenProductoDetail(true);
                                                }} 
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button 
                                    onClick={() => {
                                        setOpenDetail(false);
                                        setProductosEnBodega([]);
                                    }} 
                                    variant="contained"
                                >
                                    Cerrar
                                </Button>
                            </DialogActions>
                        </Dialog>

                        <ProductoDetailDialog
                            open={openProductoDetail}
                            onClose={() => setOpenProductoDetail(false)}
                            producto={selectedProducto}
                        />

                        {/* Formulario */}
                        <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
                            <DialogTitle sx={{ bgcolor: alpha(colors.primary, 0.05) }}>
                                {selectedBodega ? 'Editar Bodega' : 'Nueva Bodega'}
                            </DialogTitle>
                            <DialogContent dividers>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            size="small"
                                            placeholder="Ej: Bodega Central"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Ubicación"
                                            name="ubicacion"
                                            value={formData.ubicacion}
                                            onChange={handleInputChange}
                                            size="small"
                                            placeholder="Ej: Av. Principal 123, Santiago"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Responsable"
                                            name="responsable"
                                            value={formData.responsable}
                                            onChange={handleInputChange}
                                            size="small"
                                            placeholder="Nombre del encargado"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Descripción"
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleInputChange}
                                            size="small"
                                            placeholder="Información adicional sobre la bodega..."
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={handleCloseForm} variant="outlined">Cancelar</Button>
                                <Button onClick={handleSaveBodega} variant="contained" color="primary">
                                    {selectedBodega ? 'Actualizar' : 'Guardar'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Diálogo de confirmación para eliminar */}
                        <ConfirmDeleteDialog
                            open={confirmDialogOpen}
                            onClose={handleCloseConfirmDialog}
                            onConfirm={handleConfirmDelete}
                            bodegaNombre={bodegaToDelete?.nombre || ''}
                            loading={deleting}
                        />

                        <Snackbar 
                            open={snackbar.open} 
                            autoHideDuration={6000} 
                            onClose={() => setSnackbar({...snackbar, open: false})}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        >
                            <Alert 
                                severity={snackbar.severity} 
                                onClose={() => setSnackbar({...snackbar, open: false})}
                                variant="filled"
                            >
                                {snackbar.message}
                            </Alert>
                        </Snackbar>

                        <ScrollTop />
                    </Container>
                    <OfilabFooter />
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default BodegasPage;