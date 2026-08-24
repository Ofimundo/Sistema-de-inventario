// src/pages/AnexosPage.jsx - GENERACIÓN DE ANEXOS BASADA EN PLANTILLAS WORD OFICIALES Y BD (FILTRADO POR EMPRESA)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    TextField,
    Grid,
    Avatar,
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Divider,
    alpha,
    Stack,
    Tooltip,
    AppBar,
    Toolbar,
    Container,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Description,
    Person,
    Business,
    CheckCircle,
    Download,
    Visibility,
    Search,
    Delete,
    Refresh,
    Home,
    Warning,
    CalendarToday,
    FilterList,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Warehouse as WarehouseIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Build as BuildIcon,
    Inventory2 as Inventory2Icon,
    History as HistoryIcon
} from '@mui/icons-material';
import api from '../services/api';
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

const descargarArchivo = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
};

const getFechaHoyFormat = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AnexosPage = () => {
    const navigate = useNavigate();
    const isMounted = useRef(true);
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    
    const [activeStep, setActiveStep] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState('STUEDEMANN S.A');
    const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
    const [filtrarPorEmpresa, setFiltrarPorEmpresa] = useState(true);
    const [fechaAnexo, setFechaAnexo] = useState(getFechaHoyFormat());
    const [observaciones, setObservaciones] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [verAnexos, setVerAnexos] = useState(false);
    const [anexos, setAnexos] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [anexoToDelete, setAnexoToDelete] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setInitialLoading(true);
            await Promise.all([
                cargarEmpresas(),
                cargarColaboradores(empresaSeleccionada),
                cargarAnexos()
            ]);
            if (isMounted.current) {
                setInitialLoading(false);
            }
        };
        cargarDatosIniciales();
    }, []);

    // Recargar colaboradores cuando cambia la empresa seleccionada o el switch de filtrado
    useEffect(() => {
        if (!initialLoading) {
            const empFiltro = filtrarPorEmpresa ? empresaSeleccionada : 'TODAS';
            cargarColaboradores(empFiltro);
            setColaboradorSeleccionado(null);
        }
    }, [empresaSeleccionada, filtrarPorEmpresa]);

    const cargarEmpresas = async () => {
        try {
            const response = await api.get('/anexos/empresas');
            if (response.data?.success && Array.isArray(response.data.data)) {
                setEmpresasDisponibles(response.data.data);
                if (response.data.data.length > 0 && !empresaSeleccionada) {
                    setEmpresaSeleccionada(response.data.data[0]);
                }
            }
        } catch (error) {
            console.error('Error cargando empresas:', error);
            const empresasDefecto = ['STUEDEMANN S.A', 'Global Horizon Spa', 'Latam Lite Spa'];
            setEmpresasDisponibles(empresasDefecto);
            setEmpresaSeleccionada('STUEDEMANN S.A');
        }
    };

    const cargarColaboradores = async (empresaFiltro = empresaSeleccionada) => {
        try {
            const url = (empresaFiltro && empresaFiltro !== 'TODAS')
                ? `/anexos/colaboradores?empresa=${encodeURIComponent(empresaFiltro)}`
                : '/anexos/colaboradores';
            
            const response = await api.get(url);
            let colaboradoresData = [];
            if (response.data?.data && Array.isArray(response.data.data)) {
                colaboradoresData = response.data.data;
            } else if (Array.isArray(response.data)) {
                colaboradoresData = response.data;
            }
            if (isMounted.current) {
                setColaboradores(colaboradoresData || []);
                console.log(`✅ ${(colaboradoresData || []).length} colaboradores cargados (filtro: ${empresaFiltro})`);
            }
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            if (isMounted.current) setError('Error al cargar los colaboradores');
        }
    };

    const cargarAnexos = async () => {
        try {
            const response = await api.get('/anexos?_t=' + Date.now());
            if (isMounted.current) {
                let anexosData = [];
                if (response.data?.success && Array.isArray(response.data.data)) {
                    anexosData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    anexosData = response.data;
                }
                setAnexos(anexosData);
            }
        } catch (error) {
            console.error('Error cargando anexos:', error);
            if (isMounted.current) setAnexos([]);
        }
    };

    const handleSeleccionarColaborador = (colaborador) => {
        setColaboradorSeleccionado(colaborador);
        setActiveStep(2);
    };

    const formatearFechaEnEspanolString = (fechaStr) => {
        if (!fechaStr) return 'N/A';
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const parts = fechaStr.split('-');
        if (parts.length === 3) {
            const anio = parts[0];
            const mesIdx = parseInt(parts[1], 10) - 1;
            const dia = parseInt(parts[2], 10);
            return `${dia} de ${meses[mesIdx]} del año ${anio}`;
        }
        return fechaStr;
    };

    const handleGenerarAnexo = async () => {
        if (!colaboradorSeleccionado) {
            setError('Debe seleccionar un colaborador');
            return;
        }
        if (!empresaSeleccionada) {
            setError('Debe seleccionar una empresa');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_BASE_URL}/anexos/generar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    colaborador: {
                        id: colaboradorSeleccionado.id,
                        nombre: colaboradorSeleccionado.nombre,
                        rut: colaboradorSeleccionado.rut,
                        email: colaboradorSeleccionado.email || '',
                        cargo: colaboradorSeleccionado.cargo || '',
                        departamento: colaboradorSeleccionado.departamento || ''
                    },
                    empresa: empresaSeleccionada,
                    fecha: fechaAnexo,
                    equipos: colaboradorSeleccionado.equipos || [],
                    observaciones: observaciones
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `anexo_${empresaSeleccionada.replace(/\s/g, '_')}_${colaboradorSeleccionado.nombre.replace(/\s/g, '_')}_${Date.now()}.docx`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }
                
                descargarArchivo(blob, filename);
                setSuccess('Anexo generado correctamente en plantilla Word (.docx)');
                setActiveStep(4);
                await cargarAnexos();
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Error al generar el anexo');
            }
        } catch (error) {
            console.error('Error generando anexo:', error);
            setError(error.message || 'Error al generar el anexo');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarAnexo = async (anexo) => {
        try {
            const response = await api.get(`/anexos/descargar/${anexo.id}`, { responseType: 'blob' });
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            const blob = new Blob([response.data], { type: contentType });
            
            const isDocx = anexo.documento_generado?.endsWith('.docx') || contentType.includes('wordprocessingml');
            const defaultFilename = `anexo_${anexo.id}.${isDocx ? 'docx' : 'pdf'}`;
            const filename = anexo.documento_generado || defaultFilename;
            
            descargarArchivo(blob, filename);
            setSuccess('Documento descargado correctamente');
        } catch (error) {
            console.error('Error:', error);
            setError('Error al descargar el documento');
        }
    };

    const handleEliminarAnexo = (anexo) => {
        setAnexoToDelete(anexo);
        setDeleteDialogOpen(true);
    };

    const formatearFechaSegura = (fechaStr) => {
        if (!fechaStr) return 'N/A';
        try {
            const d = new Date(fechaStr);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString('es-CL');
        } catch (e) {
            return 'N/A';
        }
    };

    const confirmarEliminar = async () => {
        if (!anexoToDelete) return;
        const idToDelete = anexoToDelete.id;
        setEliminando(true);
        try {
            const response = await api.delete(`/anexos/${idToDelete}`);
            if (response.data?.success) {
                if (isMounted.current) {
                    setSuccess('Anexo eliminado correctamente');
                    setAnexos(prev => {
                        const actualizados = prev.filter(a => a.id !== idToDelete);
                        if (page > 0 && page * rowsPerPage >= actualizados.length) {
                            setPage(Math.max(0, page - 1));
                        }
                        return actualizados;
                    });
                }
                handleCloseDeleteDialog();
                await cargarAnexos();
            } else {
                if (isMounted.current) setError(response.data?.message || 'Error al eliminar el anexo');
            }
        } catch (error) {
            console.error('Error:', error);
            if (isMounted.current) setError(error.response?.data?.message || error.message || 'Error al eliminar el anexo');
        } finally {
            if (isMounted.current) setEliminando(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setTimeout(() => {
            if (isMounted.current) setAnexoToDelete(null);
        }, 300);
    };

    const refreshData = async () => {
        setRefreshing(true);
        const empFiltro = filtrarPorEmpresa ? empresaSeleccionada : 'TODAS';
        await Promise.all([cargarEmpresas(), cargarColaboradores(empFiltro), cargarAnexos()]);
        setRefreshing(false);
        setSuccess('Datos actualizados correctamente');
    };

    const handleVolverInicio = () => navigate('/dashboard');

    const handleStepChange = (step) => {
        setActiveStep(step);
    };

    const colaboradoresFiltrados = (colaboradores || []).filter(c =>
        c.nombre?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        c.rut?.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (initialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: colors.background }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando datos del sistema...</Typography>
            </Box>
        );
    }

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Productos', icon: <Description />, path: '/productos' },
        { text: 'Bodegas', icon: <WarehouseIcon />, path: '/bodegas' },
        { text: 'Colaboradores', icon: <PeopleIcon />, path: '/colaboradores' },
        { text: 'Asignaciones', icon: <AssignmentIcon />, path: '/asignacion' },
        { text: 'Mantención', icon: <BuildIcon />, path: '/mantenciones' },
        { text: 'Anexos', icon: <Description />, path: '/anexos' },
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
                                Anexos de Contrato
                            </Typography>
                        </Box>
                        <IconButton onClick={refreshData} disabled={refreshing}>
                            {refreshing ? <CircularProgress size={24} /> : <Refresh />}
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Toolbar />

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Anexos de Contrato</Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>Generación oficial de anexos de entrega de equipos en formato Word (.docx)</Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                            onClick={() => {
                                setVerAnexos(false);
                                setActiveStep(0);
                            }}
                            startIcon={<Description />}
                            sx={{ 
                                bgcolor: !verAnexos ? '#FFFFFF' : 'transparent',
                                color: !verAnexos ? colors.primary : '#FFFFFF',
                                border: '1px solid #FFFFFF',
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: !verAnexos ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                '&:hover': { 
                                    bgcolor: !verAnexos ? '#F3F4F6' : 'rgba(255,255,255,0.15)',
                                    borderColor: '#FFFFFF'
                                }
                            }}
                        >
                            Nuevo Anexo
                        </Button>
                        <Button 
                            onClick={() => { 
                                setVerAnexos(true); 
                                cargarAnexos(); 
                            }}
                            startIcon={<Visibility />}
                            sx={{ 
                                bgcolor: verAnexos ? '#FFFFFF' : 'transparent',
                                color: verAnexos ? colors.primary : '#FFFFFF',
                                border: '1px solid #FFFFFF',
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: verAnexos ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                '&:hover': { 
                                    bgcolor: verAnexos ? '#F3F4F6' : 'rgba(255,255,255,0.15)',
                                    borderColor: '#FFFFFF'
                                }
                            }}
                        >
                            Ver Anexos Generados
                        </Button>
                    </Box>
                </Paper>

                {!verAnexos ? (
                    <Paper sx={{ p: 3 }}>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            
                            {/* PASO 1: EMPRESA */}
                            <Step expanded={activeStep === 0}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 32, height: 32 }}>
                                        <Business fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 1: Seleccionar Empresa</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Selecciona la empresa para filtrar los colaboradores y cargar la plantilla correspondiente
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Empresa</InputLabel>
                                        <Select 
                                            value={empresaSeleccionada} 
                                            onChange={(e) => {
                                                setEmpresaSeleccionada(e.target.value);
                                                setColaboradorSeleccionado(null);
                                            }} 
                                            label="Empresa"
                                        >
                                            {empresasDisponibles.map((emp) => (
                                                <MenuItem key={emp} value={emp}>{emp}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => handleStepChange(1)} 
                                            disabled={!empresaSeleccionada}
                                        >
                                            Continuar
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            {/* PASO 2: COLABORADOR */}
                            <Step expanded={activeStep === 1}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, width: 32, height: 32 }}>
                                        <Person fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 2: Seleccionar Colaborador</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Selecciona el colaborador registrado para la empresa seleccionada
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                        <Chip 
                                            icon={<FilterList fontSize="small" />} 
                                            label={filtrarPorEmpresa ? `Empresa: ${empresaSeleccionada}` : 'Mostrando colaboradores de TODAS las empresas'} 
                                            color={filtrarPorEmpresa ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                        <Button 
                                            size="small" 
                                            onClick={() => setFiltrarPorEmpresa(!filtrarPorEmpresa)}
                                        >
                                            {filtrarPorEmpresa ? 'Ver todos los colaboradores' : `Filtrar solo por ${empresaSeleccionada}`}
                                        </Button>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Buscar colaborador por nombre o RUT..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                                        }}
                                        sx={{ mb: 2 }}
                                    />
                                    <Paper variant="outlined" sx={{ maxHeight: 350, overflow: 'auto', mb: 2 }}>
                                        {colaboradoresFiltrados.length === 0 ? (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography color="text.secondary" gutterBottom>
                                                    No hay colaboradores registrados para {empresaSeleccionada}
                                                </Typography>
                                                <Button size="small" variant="outlined" onClick={() => setFiltrarPorEmpresa(false)}>
                                                    Ver todos los colaboradores del sistema
                                                </Button>
                                            </Box>
                                        ) : (
                                            colaboradoresFiltrados.map((col) => (
                                                <Box
                                                    key={col.id}
                                                    sx={{
                                                        p: 2,
                                                        borderBottom: `1px solid ${colors.border}`,
                                                        cursor: 'pointer',
                                                        bgcolor: colaboradorSeleccionado?.id === col.id ? alpha(colors.primary, 0.05) : 'transparent',
                                                        '&:hover': { bgcolor: alpha(colors.primary, 0.02) }
                                                    }}
                                                    onClick={() => handleSeleccionarColaborador(col)}
                                                >
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Box>
                                                            <Typography variant="body1" fontWeight={500}>{col.nombre}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                RUT: {col.rut} | {col.cargo || 'Sin cargo'} | {col.departamento || 'Sin departamento'}
                                                            </Typography>
                                                            {col.empresa && (
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                    Empresa en BD: <strong>{col.empresa}</strong>
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" display="block" color="primary" sx={{ mt: 0.5 }}>
                                                                📦 Equipos asignados activos: {(col.equipos || []).length}
                                                            </Typography>
                                                        </Box>
                                                        {colaboradorSeleccionado?.id === col.id && (
                                                            <CheckCircle sx={{ color: colors.success }} />
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))
                                        )}
                                    </Paper>
                                    <Box display="flex" justifyContent="space-between">
                                        <Button onClick={() => handleStepChange(0)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => handleStepChange(2)} disabled={!colaboradorSeleccionado}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            {/* PASO 3: FECHA DEL ANEXO Y OBSERVACIONES */}
                            <Step expanded={activeStep === 2}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 32, height: 32 }}>
                                        <CalendarToday fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 3: Fecha del Anexo y Observaciones</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ingresa la fecha que se plasmará en el documento Word (marcador &#123;&#123;fecha&#125;&#125;)
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Fecha del Anexo"
                                                value={fechaAnexo}
                                                onChange={(e) => setFechaAnexo(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                helperText={`Se inyectará como: "${formatearFechaEnEspanolString(fechaAnexo)}"`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Observaciones adicionales"
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                placeholder="Notas internas..."
                                            />
                                        </Grid>
                                    </Grid>
                                    <Box display="flex" justifyContent="space-between">
                                        <Button onClick={() => handleStepChange(1)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => handleStepChange(3)}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            {/* PASO 4: CONFIRMAR Y GENERAR */}
                            <Step expanded={activeStep === 3}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 32, height: 32 }}>
                                        <CheckCircle fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 4: Confirmar y Generar Documento Word</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Verifica los datos exactos que se plasmarán en la plantilla Word
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: alpha(colors.info, 0.04) }}>
                                        <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
                                            📄 Reemplazo estricto de marcadores de la plantilla
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Empresa empleadora:</strong> {empresaSeleccionada}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    <strong>&#123;&#123;nombre&#125;&#125;:</strong> {colaboradorSeleccionado?.nombre}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    <strong>&#123;&#123;rut&#125;&#125;:</strong> {colaboradorSeleccionado?.rut}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    <strong>&#123;&#123;fecha&#125;&#125;:</strong> {formatearFechaEnEspanolString(fechaAnexo)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" fontWeight={600} gutterBottom>
                                                    <strong>Tabla de &#123;&#123;equipos&#125;&#125; a incluir:</strong>
                                                </Typography>
                                                {colaboradorSeleccionado?.equipos && colaboradorSeleccionado.equipos.length > 0 ? (
                                                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                                        {colaboradorSeleccionado.equipos.map((eq, idx) => (
                                                            <Typography component="li" variant="caption" key={idx} display="list-item">
                                                                <strong>{eq.tipo}</strong> | Marca: {eq.marca || 'N/A'} | Modelo: {eq.modelo || 'N/A'} | Serie: {eq.numero_serie || 'N/A'}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="error">
                                                        Sin equipos asignados activos en la base de datos.
                                                    </Typography>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    <Box display="flex" justifyContent="space-between">
                                        <Button onClick={() => handleStepChange(2)} variant="outlined">Atrás</Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleGenerarAnexo}
                                            disabled={loading}
                                            startIcon={<Download />}
                                            sx={{ bgcolor: colors.success, '&:hover': { bgcolor: '#059669' } }}
                                        >
                                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generar Anexo (.docx)'}
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            {/* PASO 5: ÉXITO */}
                            <Step expanded={activeStep === 4}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 32, height: 32 }}>
                                        <CheckCircle fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">¡Anexo Generado con Éxito!</Typography>
                                </StepLabel>
                                <StepContent>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        El archivo Word (.docx) ha sido generado con éxito y descargado automáticamente.
                                    </Alert>
                                    <Box display="flex" gap={2}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={() => {
                                                handleStepChange(0);
                                                setColaboradorSeleccionado(null);
                                                setObservaciones('');
                                                setSearchTerm('');
                                                cargarColaboradores(empresaSeleccionada);
                                            }}
                                        >
                                            Crear Nuevo Anexo
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => { 
                                                setVerAnexos(true); 
                                                cargarAnexos(); 
                                            }}
                                        >
                                            Ver Anexos Generados
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>
                        </Stepper>
                    </Paper>
                ) : (
                    /* SECCIÓN DE VER ANEXOS GENERADOS */
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>📄 Anexos Generados</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(colors.primary, 0.05) }}>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Colaborador</strong></TableCell>
                                        <TableCell><strong>Empresa</strong></TableCell>
                                        <TableCell><strong>Fecha del Anexo</strong></TableCell>
                                        <TableCell align="center"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {anexos.length > 0 ? (
                                        anexos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((anexo) => (
                                            <TableRow key={anexo.id} hover>
                                                <TableCell>{anexo.id}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>{anexo.colaborador_nombre || 'N/A'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">RUT: {anexo.colaborador_rut || 'N/A'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={anexo.empresa || 'N/A'} 
                                                        size="small"
                                                        sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}
                                                    />
                                                </TableCell>
                                                <TableCell>{formatearFechaSegura(anexo.fecha_anexo || anexo.fecha_creacion)}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Descargar Word (.docx)">
                                                            <IconButton size="small" onClick={() => handleDescargarAnexo(anexo)} sx={{ color: '#10B981' }}>
                                                                <Download fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <IconButton size="small" onClick={() => handleEliminarAnexo(anexo)} sx={{ color: '#EF4444' }}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Description sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                                <Typography color="text.secondary">No hay anexos generados aún</Typography>
                                                <Button 
                                                    variant="outlined" 
                                                    size="small" 
                                                    onClick={() => setVerAnexos(false)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Crear primer anexo
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {anexos.length > 0 && (
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={anexos.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                labelRowsPerPage="Filas por página"
                            />
                        )}
                    </Paper>
                )}

                {/* DIÁLOGO DE ELIMINACIÓN */}
                <Dialog 
                    open={deleteDialogOpen} 
                    onClose={handleCloseDeleteDialog}
                    keepMounted={false}
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Warning sx={{ color: colors.warning }} />
                            <Typography variant="h6">Confirmar Eliminación</Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            ¿Estás seguro que deseas eliminar este anexo?
                            {anexoToDelete && (
                                <Box component="span" display="block" mt={1} color="text.secondary">
                                    <strong>Colaborador:</strong> {anexoToDelete.colaborador_nombre || 'N/A'}<br />
                                    <strong>Empresa:</strong> {anexoToDelete.empresa || 'N/A'}<br />
                                    <strong>Fecha:</strong> {formatearFechaSegura(anexoToDelete.fecha_anexo || anexoToDelete.fecha_creacion)}
                                </Box>
                            )}
                        </Typography>
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            Esta acción no se puede deshacer.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog} disabled={eliminando}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={confirmarEliminar} 
                            variant="contained" 
                            sx={{ bgcolor: colors.error }}
                            disabled={eliminando}
                        >
                            {eliminando ? <CircularProgress size={24} /> : 'Eliminar'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>
                        {error}
                    </Alert>
                </Snackbar>
                <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>
                        {success}
                    </Alert>
                </Snackbar>
            </Container>
            <OfilabFooter />
        </Box>
        </Box>
    );
};

export default AnexosPage;