import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    CircularProgress,
    Alert,
    Button,
    IconButton,
    Tooltip,
    Tab,
    Tabs,
    Card,
    CardContent,
    Divider,
    Avatar,
    Badge,
    alpha,
    useTheme,
    useMediaQuery,
    Fab,
    Zoom,
    Fade
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
    Description as DocumentIcon,
    SwapHoriz as MovimientoIcon,
    PictureAsPdf as PdfIcon,
    Visibility as ViewIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Email as EmailIcon,
    Assessment as AssessmentIcon,
    Timeline as TimelineIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Home as HomeIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Menu as MenuIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import historialService from '../../services/historialService';

// Colores corporativos
const colors = {
    primary: '#2563eb',
    secondary: '#7c3aed',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
    background: '#f8fafc',
    surface: '#ffffff',
    text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#94a3b8'
    },
    border: '#e2e8f0'
};

// Componente para cada pestaña con diseño mejorado
function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && (
                <Box sx={{ 
                    py: { xs: 2, sm: 3 },
                    opacity: 1,
                    transition: 'opacity 0.3s ease'
                }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Tarjeta de estadísticas responsive
function StatCard({ icon: Icon, title, value, color, trend }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Card sx={{ 
            height: '100%',
            background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
            border: `1px solid ${alpha(color, 0.2)}`,
            borderRadius: { xs: 1.5, sm: 2 },
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 16px ${alpha(color, 0.2)}`
            }
        }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="caption" color="textSecondary" sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                            {title}
                        </Typography>
                        <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
                            fontWeight: 700, 
                            color: color, 
                            mt: 0.5,
                            fontSize: { xs: '1.1rem', sm: '1.5rem' }
                        }}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ 
                        bgcolor: alpha(color, 0.2),
                        color: color,
                        width: { xs: 36, sm: 48 },
                        height: { xs: 36, sm: 48 }
                    }}>
                        <Icon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
}

// Botón flotante para volver arriba
function ScrollTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisible = () => {
            const scrolled = document.documentElement.scrollTop;
            setVisible(scrolled > 300);
        };

        window.addEventListener('scroll', toggleVisible);
        return () => window.removeEventListener('scroll', toggleVisible);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <Zoom in={visible}>
            <Box
                onClick={scrollToTop}
                role="presentation"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 16, sm: 24 },
                    right: { xs: 16, sm: 24 },
                    zIndex: 1000
                }}
            >
                <Fab
                    size="medium"
                    aria-label="Volver arriba"
                    sx={{
                        bgcolor: colors.primary,
                        color: 'white',
                        '&:hover': {
                            bgcolor: colors.secondary,
                        },
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 }
                    }}
                >
                    <KeyboardArrowUpIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Fab>
            </Box>
        </Zoom>
    );
}

export default function HistorialDisposiciones() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    
    const [tabValue, setTabValue] = useState(0);
    const [historialCompleto, setHistorialCompleto] = useState([]);
    const [historialGeneral, setHistorialGeneral] = useState([]);
    const [historialDocumentos, setHistorialDocumentos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        busqueda: '',
        tipo: 'todos',
        fechaInicio: null,
        fechaFin: null
    });

    // Estado para mostrar/ocultar filtros
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        cargarTodosLosHistoriales();
    }, []);

    const cargarTodosLosHistoriales = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const completoResponse = await historialService.getHistorialCompleto();
            if (completoResponse.success) {
                setHistorialCompleto(completoResponse.data.completo || []);
                setHistorialGeneral(completoResponse.data.general || []);
                setHistorialDocumentos(completoResponse.data.documentos || []);
                setMovimientos(completoResponse.data.movimientos || []);
            } else {
                await cargarHistorialesPorSeparado();
            }
        } catch (error) {
            console.error('Error cargando historiales:', error);
            setError('Error al cargar los datos de historial');
            await cargarHistorialesPorSeparado();
        } finally {
            setLoading(false);
        }
    };

    const cargarHistorialesPorSeparado = async () => {
        try {
            const generalResponse = await historialService.getHistorialGeneral();
            const docsResponse = await historialService.getHistorialDocumentos();
            const movResponse = await historialService.getMovimientos();

            if (generalResponse.success) setHistorialGeneral(generalResponse.data || []);
            if (docsResponse.success) setHistorialDocumentos(docsResponse.data || []);
            if (movResponse.success) setMovimientos(movResponse.data || []);

            const combinado = [
                ...(generalResponse.success ? generalResponse.data || [] : []),
                ...(docsResponse.success ? docsResponse.data || [] : []),
                ...(movResponse.success ? movResponse.data || [] : [])
            ].sort((a, b) => {
                const fechaA = a.fecha_hora || a.fecha_accion || a.fecha_movimiento || a.fecha;
                const fechaB = b.fecha_hora || b.fecha_accion || b.fecha_movimiento || b.fecha;
                return new Date(fechaB) - new Date(fechaA);
            });

            setHistorialCompleto(combinado);
        } catch (error) {
            console.error('Error cargando historiales por separado:', error);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(0);
        if (isMobile) setMobileMenuOpen(false);
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

    const filtrarHistorial = (items) => {
        return items.filter(item => {
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                const productoNombre = item.producto_nombre || item.producto?.nombre || '';
                const accion = item.accion || item.tipo_movimiento || '';
                const detalles = item.detalles || item.observaciones || '';
                
                const coincide = productoNombre.toLowerCase().includes(busquedaLower) ||
                    accion.toLowerCase().includes(busquedaLower) ||
                    detalles.toLowerCase().includes(busquedaLower);
                
                if (!coincide) return false;
            }

            if (filtros.tipo !== 'todos') {
                const tipoItem = item.tipo || item.origen || '';
                if (tipoItem !== filtros.tipo) return false;
            }

            const fecha = new Date(
                item.fecha_hora || 
                item.fecha_accion || 
                item.fecha_movimiento || 
                item.fecha || 
                0
            );

            if (filtros.fechaInicio && fecha < filtros.fechaInicio) return false;
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59);
                if (fecha > fechaFin) return false;
            }

            return true;
        });
    };

    const getTipoIcon = (item) => {
        const tipo = item.tipo || item.origen || '';
        
        switch(tipo) {
            case 'general':
                return <HistoryIcon />;
            case 'documento':
                return <DocumentIcon />;
            case 'movimiento':
                return <MovimientoIcon />;
            default:
                return <HistoryIcon />;
        }
    };

    const getTipoColor = (item) => {
        const tipo = item.tipo || item.origen || '';
        
        switch(tipo) {
            case 'general': return colors.primary;
            case 'documento': return colors.secondary;
            case 'movimiento': return colors.success;
            default: return colors.text.secondary;
        }
    };

    const getAccionColor = (accion) => {
        const accionLower = (accion || '').toLowerCase();
        if (accionLower.includes('creado') || accionLower.includes('creación')) return colors.success;
        if (accionLower.includes('asignado')) return colors.info;
        if (accionLower.includes('devuelto')) return colors.warning;
        if (accionLower.includes('eliminado') || accionLower.includes('baja')) return colors.error;
        return colors.primary;
    };

    const getFechaTexto = (item) => {
        const fecha = item.fecha_hora || item.fecha_accion || item.fecha_movimiento || item.fecha;
        if (!fecha) return 'Fecha desconocida';
        
        return new Date(fecha).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUsuarioTexto = (item) => {
        return item.usuario_nombre || 
               item.usuario_responsable || 
               (item.usuario_id ? `ID: ${item.usuario_id}` : 'Sistema');
    };

    const getDatosActuales = () => {
        switch(tabValue) {
            case 0: return historialCompleto;
            case 1: return historialGeneral;
            case 2: return historialDocumentos;
            case 3: return movimientos;
            default: return [];
        }
    };

    const datosFiltrados = filtrarHistorial(getDatosActuales());
    const paginatedData = datosFiltrados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Versión móvil de la tabla
    const renderMobileCard = (item) => (
        <Card sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.border}` }}>
            <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                        icon={getTipoIcon(item)}
                        label={item.tipo || item.origen || 'desconocido'}
                        size="small"
                        sx={{
                            bgcolor: alpha(getTipoColor(item), 0.1),
                            color: getTipoColor(item),
                            fontWeight: 600,
                            '& .MuiChip-icon': {
                                color: getTipoColor(item)
                            }
                        }}
                    />
                    <Chip 
                        label={item.accion || item.tipo_movimiento || 'Acción'}
                        size="small"
                        sx={{
                            bgcolor: alpha(getAccionColor(item.accion || item.tipo_movimiento), 0.1),
                            color: getAccionColor(item.accion || item.tipo_movimiento),
                            fontWeight: 600
                        }}
                    />
                </Box>

                <Box sx={{ mt: 1.5 }}>
                    <Grid container spacing={1}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Fecha</Typography>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="body2">{getFechaTexto(item)}</Typography>
                        </Grid>

                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Producto</Typography>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.producto_nombre || `ID: ${item.producto_id}`}
                            </Typography>
                        </Grid>

                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Usuario</Typography>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="body2">{getUsuarioTexto(item)}</Typography>
                        </Grid>

                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Detalles</Typography>
                        </Grid>
                        <Grid item xs={8}>
                            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                {item.detalles || item.observaciones || 'Sin detalles'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress sx={{ color: colors.primary }} />
                <Typography sx={{ ml: 2, color: colors.text.secondary }}>
                    Cargando historial...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            minHeight: '100vh',
            bgcolor: colors.background,
            pb: 4
        }}>
            {/* Botón de volver al inicio fijo en la esquina superior izquierda */}
            <Fade in={true}>
                <Box
                    sx={{
                        position: 'fixed',
                        top: { xs: 16, sm: 24 },
                        left: { xs: 16, sm: 24 },
                        zIndex: 1100
                    }}
                >
                    <Tooltip title="Volver al inicio">
                        <Fab
                            size={isMobile ? "small" : "medium"}
                            aria-label="home"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                                bgcolor: colors.primary,
                                color: 'white',
                                '&:hover': {
                                    bgcolor: colors.secondary,
                                    transform: 'scale(1.1)'
                                },
                                boxShadow: 3,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <HomeIcon />
                        </Fab>
                    </Tooltip>
                </Box>
            </Fade>

            {/* Botón flotante para volver arriba */}
            <ScrollTop />

            {/* Contenido principal con padding superior para el botón */}
            <Box sx={{ pt: { xs: 8, sm: 10 } }}>
                {/* Encabezado con diseño corporativo responsive */}
                <Paper sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mb: { xs: 2, sm: 3 },
                    mx: { xs: 2, sm: 3 },
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    color: 'white',
                    borderRadius: { xs: 2, sm: 3 }
                }}>
                    <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }} textAlign={{ xs: 'center', sm: 'left' }}>
                                <AssessmentIcon sx={{ 
                                    fontSize: { xs: 32, sm: 40 }, 
                                    mr: { xs: 0, sm: 2 },
                                    mb: { xs: 1, sm: 0 }
                                }} />
                                <Box>
                                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
                                        Historial del Sistema
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                        Seguimiento completo de todas las operaciones y movimientos
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }} gap={1}>
                                <Tooltip title="Exportar a Excel">
                                    <IconButton sx={{ 
                                        color: 'white', 
                                        bgcolor: alpha('#ffffff', 0.1), 
                                        '&:hover': { bgcolor: alpha('#ffffff', 0.2) },
                                        size: isMobile ? 'small' : 'medium'
                                    }}>
                                        <DownloadIcon fontSize={isMobile ? 'small' : 'medium'} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Tarjetas de estadísticas responsive */}
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Grid item xs={6} sm={6} md={3}>
                            <StatCard
                                icon={HistoryIcon}
                                title="Total Registros"
                                value={datosFiltrados.length}
                                color={colors.primary}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                            <StatCard
                                icon={HistoryIcon}
                                title="General"
                                value={filtrarHistorial(historialGeneral).length}
                                color={colors.primary}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                            <StatCard
                                icon={DocumentIcon}
                                title="Documentos"
                                value={filtrarHistorial(historialDocumentos).length}
                                color={colors.secondary}
                            />
                        </Grid>
                        <Grid item xs={6} sm={6} md={3}>
                            <StatCard
                                icon={MovimientoIcon}
                                title="Movimientos"
                                value={filtrarHistorial(movimientos).length}
                                color={colors.success}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Barra de acciones responsive */}
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                    <Paper sx={{ 
                        p: { xs: 1.5, sm: 2 }, 
                        mb: { xs: 2, sm: 3 }, 
                        borderRadius: 2, 
                        border: `1px solid ${colors.border}` 
                    }}>
                        <Grid container spacing={1.5} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    placeholder="Buscar en el historial..."
                                    value={filtros.busqueda}
                                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: colors.text.secondary }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: filtros.busqueda && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => handleFiltroChange('busqueda', '')}>
                                                    <ClearIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: colors.primary,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<FilterIcon />}
                                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                                    size={isMobile ? "small" : "medium"}
                                    sx={{
                                        color: mostrarFiltros ? colors.primary : colors.text.secondary,
                                        borderColor: mostrarFiltros ? colors.primary : colors.border,
                                        '&:hover': {
                                            borderColor: colors.primary,
                                            backgroundColor: alpha(colors.primary, 0.05)
                                        },
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                >
                                    {mostrarFiltros ? 'Ocultar' : 'Filtros'}
                                </Button>
                            </Grid>
                            <Grid item xs={6} md={2}>
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
                                        <MenuItem value="movimiento">Movimientos</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                    <DatePicker
                                        label="Desde"
                                        value={filtros.fechaInicio}
                                        onChange={(date) => handleFiltroChange('fechaInicio', date)}
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small', 
                                                fullWidth: true,
                                                placeholder: 'Desde',
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: colors.primary,
                                                        },
                                                    },
                                                }
                                            } 
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                    <DatePicker
                                        label="Hasta"
                                        value={filtros.fechaFin}
                                        onChange={(date) => handleFiltroChange('fechaFin', date)}
                                        slotProps={{ 
                                            textField: { 
                                                size: 'small', 
                                                fullWidth: true,
                                                placeholder: 'Hasta',
                                                sx: {
                                                    '& .MuiOutlinedInput-root': {
                                                        '&:hover fieldset': {
                                                            borderColor: colors.primary,
                                                        },
                                                    },
                                                }
                                            } 
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* Tabs con diseño mejorado y responsive */}
                <Box sx={{ px: { xs: 2, sm: 3 } }}>
                    <Paper sx={{ 
                        width: '100%', 
                        borderRadius: { xs: 1.5, sm: 2 },
                        overflow: 'hidden',
                        border: `1px solid ${colors.border}`
                    }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant={isMobile ? "scrollable" : "fullWidth"}
                            scrollButtons={isMobile ? "auto" : false}
                            allowScrollButtonsMobile
                            sx={{
                                borderBottom: 1,
                                borderColor: colors.border,
                                bgcolor: colors.background,
                                '& .MuiTab-root': {
                                    minHeight: { xs: 48, sm: 64 },
                                    fontWeight: 600,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    '&.Mui-selected': {
                                        color: colors.primary,
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: colors.primary,
                                    height: 3
                                }
                            }}
                        >
                            <Tab 
                                icon={<AssessmentIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                                label={isMobile ? "" : "COMPLETO"} 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<HistoryIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                                label={isMobile ? "" : "GENERAL"} 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<DocumentIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                                label={isMobile ? "" : "DOCUMENTOS"} 
                                iconPosition="start"
                            />
                            <Tab 
                                icon={<MovimientoIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />} 
                                label={isMobile ? "" : "MOVIMIENTOS"} 
                                iconPosition="start"
                            />
                        </Tabs>

                        {/* Panel de Historial Completo */}
                        <TabPanel value={tabValue} index={0}>
                            {isMobile ? (
                                // Vista móvil con cards
                                <Box sx={{ px: 1 }}>
                                    {paginatedData.length === 0 ? (
                                        <Box textAlign="center" py={6}>
                                            <HistoryIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                            <Typography variant="body1" color="textSecondary">
                                                No hay registros en el historial
                                            </Typography>
                                        </Box>
                                    ) : (
                                        paginatedData.map((item, index) => renderMobileCard(item))
                                    )}
                                </Box>
                            ) : (
                                // Vista desktop con tabla
                                <TableContainer>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Tipo</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Producto</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Acción</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Usuario</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Detalles</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                        <HistoryIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            No hay registros en el historial
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((item, index) => (
                                                    <TableRow 
                                                        key={item.id || index} 
                                                        hover
                                                        sx={{
                                                            '&:hover': {
                                                                bgcolor: alpha(colors.primary, 0.05)
                                                            }
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Chip
                                                                icon={getTipoIcon(item)}
                                                                label={item.tipo || item.origen || 'desconocido'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(getTipoColor(item), 0.1),
                                                                    color: getTipoColor(item),
                                                                    fontWeight: 600,
                                                                    '& .MuiChip-icon': {
                                                                        color: getTipoColor(item)
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center">
                                                                <EventIcon sx={{ fontSize: 16, color: colors.text.secondary, mr: 1 }} />
                                                                <Typography variant="body2">{getFechaTexto(item)}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center">
                                                                <InventoryIcon sx={{ fontSize: 16, color: colors.text.secondary, mr: 1 }} />
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {item.producto_nombre || `ID: ${item.producto_id}`}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={item.accion || item.tipo_movimiento || 'Acción'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(getAccionColor(item.accion || item.tipo_movimiento), 0.1),
                                                                    color: getAccionColor(item.accion || item.tipo_movimiento),
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center">
                                                                <PersonIcon sx={{ fontSize: 16, color: colors.text.secondary, mr: 1 }} />
                                                                <Typography variant="body2">{getUsuarioTexto(item)}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip title={item.detalles || item.observaciones || 'Sin detalles'}>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    sx={{ 
                                                                        maxWidth: 250,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        color: colors.text.secondary
                                                                    }}
                                                                >
                                                                    {item.detalles || item.observaciones || 'Sin detalles'}
                                                                </Typography>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        {/* Panel de Historial General */}
                        <TabPanel value={tabValue} index={1}>
                            {isMobile ? (
                                <Box sx={{ px: 1 }}>
                                    {filtrarHistorial(historialGeneral).length === 0 ? (
                                        <Box textAlign="center" py={6}>
                                            <HistoryIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                            <Typography variant="body1" color="textSecondary">
                                                No hay registros en el historial general
                                            </Typography>
                                        </Box>
                                    ) : (
                                        filtrarHistorial(historialGeneral)
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((item) => renderMobileCard(item))
                                    )}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Producto</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Acción</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>OC/Factura</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Usuario</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Detalles</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(historialGeneral).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                        <HistoryIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            No hay registros en el historial general
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filtrarHistorial(historialGeneral)
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item) => (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell>{getFechaTexto(item)}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {item.producto_nombre || `ID: ${item.producto_id}`}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={item.accion}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(getAccionColor(item.accion), 0.1),
                                                                        color: getAccionColor(item.accion),
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.oc_numero && (
                                                                    <Chip 
                                                                        label={`OC: ${item.oc_numero}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mr: 1 }}
                                                                    />
                                                                )}
                                                                {item.factura_numero && (
                                                                    <Chip 
                                                                        label={`Fact: ${item.factura_numero}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{item.usuario_nombre || `ID: ${item.usuario_id}`}</TableCell>
                                                            <TableCell>
                                                                <Tooltip title={item.detalles}>
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            maxWidth: 200,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            color: colors.text.secondary
                                                                        }}
                                                                    >
                                                                        {item.detalles}
                                                                    </Typography>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        {/* Panel de Historial Documentos */}
                        <TabPanel value={tabValue} index={2}>
                            {isMobile ? (
                                <Box sx={{ px: 1 }}>
                                    {filtrarHistorial(historialDocumentos).length === 0 ? (
                                        <Box textAlign="center" py={6}>
                                            <DocumentIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                            <Typography variant="body1" color="textSecondary">
                                                No hay registros en el historial de documentos
                                            </Typography>
                                        </Box>
                                    ) : (
                                        filtrarHistorial(historialDocumentos)
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((item) => renderMobileCard(item))
                                    )}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Documento</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Acción</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Usuario</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>IP</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Detalles</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(historialDocumentos).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                                        <DocumentIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            No hay registros en el historial de documentos
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filtrarHistorial(historialDocumentos)
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item) => (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell>{getFechaTexto(item)}</TableCell>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <PdfIcon sx={{ color: colors.error, mr: 1 }} />
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {item.nombre_documento || `ID: ${item.documento_id}`}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={item.accion}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(colors.secondary, 0.1),
                                                                        color: colors.secondary,
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{item.usuario_nombre || `ID: ${item.usuario_id}`}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={item.ip_usuario || 'N/A'}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Tooltip title={item.detalles}>
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            maxWidth: 200,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            color: colors.text.secondary
                                                                        }}
                                                                    >
                                                                        {item.detalles}
                                                                    </Typography>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        {/* Panel de Movimientos */}
                        <TabPanel value={tabValue} index={3}>
                            {isMobile ? (
                                <Box sx={{ px: 1 }}>
                                    {filtrarHistorial(movimientos).length === 0 ? (
                                        <Box textAlign="center" py={6}>
                                            <MovimientoIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                            <Typography variant="body1" color="textSecondary">
                                                No hay registros de movimientos
                                            </Typography>
                                        </Box>
                                    ) : (
                                        filtrarHistorial(movimientos)
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((item) => renderMobileCard(item))
                                    )}
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Producto</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Tipo</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Usuario</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: colors.background }}>Observaciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtrarHistorial(movimientos).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <MovimientoIcon sx={{ fontSize: 48, color: colors.text.disabled, mb: 2 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            No hay registros de movimientos
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filtrarHistorial(movimientos)
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((item) => (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell>{getFechaTexto(item)}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {item.producto_nombre || `ID: ${item.producto_id}`}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={item.tipo_movimiento}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: alpha(colors.success, 0.1),
                                                                        color: colors.success,
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{item.usuario_responsable}</TableCell>
                                                            <TableCell>
                                                                <Tooltip title={item.observaciones}>
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        sx={{ 
                                                                            maxWidth: 200,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                            color: colors.text.secondary
                                                                        }}
                                                                    >
                                                                        {item.observaciones}
                                                                    </Typography>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </TabPanel>

                        {/* Paginación responsive */}
                        <Box sx={{ 
                            p: { xs: 1.5, sm: 2 }, 
                            borderTop: `1px solid ${colors.border}`,
                            bgcolor: colors.background
                        }}>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                component="div"
                                count={datosFiltrados.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage={isMobile ? "" : "Filas por página"}
                                labelDisplayedRows={({ from, to, count }) => (
                                    <Typography variant="body2" sx={{ color: colors.text.secondary, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        {from}-{to} de {count} registros
                                    </Typography>
                                )}
                                sx={{
                                    '& .MuiTablePagination-select': {
                                        borderRadius: 1,
                                        border: `1px solid ${colors.border}`,
                                        '&:hover': {
                                            borderColor: colors.primary
                                        }
                                    },
                                    '& .MuiTablePagination-actions': {
                                        '& button': {
                                            '&:hover': {
                                                bgcolor: alpha(colors.primary, 0.1)
                                            }
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}