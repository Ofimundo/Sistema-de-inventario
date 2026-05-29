// src/pages/ChecklistAsignacionPage.jsx - VERSIÓN CORREGIDA
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
    Divider,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    LinearProgress,
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
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Inventory as InventoryIcon,
    Home as HomeIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    Computer as ComputerIcon,
    Security as SecurityIcon,
    Build as BuildIcon,
    SaveAlt as SaveAltIcon,
    LocalPrintshop as LocalPrintshopIcon,
    ArrowBack as ArrowBackIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

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

// ============================================
// CHECKLIST ITEMS (sin componentes React)
// ============================================
const CHECKLIST_CATEGORIAS = [
    {
        id: 'hardware',
        nombre: 'Hardware',
        items: [
            { id: 'equipo_fisico', label: 'Equipo revisado físicamente', ok: false, observacion: '' },
            { id: 'cargador', label: 'Cargador entregado', ok: false, observacion: '' },
            { id: 'mouse_headset', label: 'Mouse / Headset entregado', ok: false, observacion: '' }
        ]
    },
    {
        id: 'software',
        nombre: 'Software',
        items: [
            { id: 'windows_actualizado', label: 'Windows actualizado', ok: false, observacion: '' },
            { id: 'drivers', label: 'Drivers instalados', ok: false, observacion: '' },
            { id: 'dominio', label: 'Equipo agregado al dominio', ok: false, observacion: '' },
            { id: 'usuario_configurado', label: 'Usuario configurado', ok: false, observacion: '' },
            { id: 'outlook', label: 'Outlook configurado', ok: false, observacion: '' },
            { id: 'mfa', label: 'MFA habilitado', ok: false, observacion: '' },
            { id: 'teams', label: 'Teams instalado', ok: false, observacion: '' },
            { id: 'onedrive', label: 'OneDrive funcionando', ok: false, observacion: '' },
            { id: 'softland', label: 'Softland instalado', ok: false, observacion: '' },
            { id: 'unidad_red', label: 'Unidad red Softland', ok: false, observacion: '' }
        ]
    },
    {
        id: 'redes',
        nombre: 'Redes y Seguridad',
        items: [
            { id: 'vpn', label: 'VPN instalada', ok: false, observacion: '' },
            { id: 'vpn_validada', label: 'VPN validada', ok: false, observacion: '' },
            { id: 'internet', label: 'Internet validado', ok: false, observacion: '' },
            { id: 'recursos_internos', label: 'Acceso recursos internos', ok: false, observacion: '' },
            { id: 'antivirus', label: 'Antivirus operativo', ok: false, observacion: '' },
            { id: 'firewall', label: 'Firewall activo', ok: false, observacion: '' }
        ]
    }
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ChecklistAsignacionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');

    // Obtener datos de la navegación
    const productoDesdeAsignacion = location.state?.producto || null;
    const tipoAccion = location.state?.tipo || 'asignacion'; // 'asignacion' o 'prestamo'

    const [productos, setProductos] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(productoDesdeAsignacion);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [mostrarChecklist, setMostrarChecklist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingColaboradores, setLoadingColaboradores] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [activeStep, setActiveStep] = useState(0);
    const [checklist, setChecklist] = useState(CHECKLIST_CATEGORIAS);
    const [usuarioConforme, setUsuarioConforme] = useState(false);
    const [firmaDigital, setFirmaDigital] = useState('');
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [ticketInfo, setTicketInfo] = useState({
        ticket: '',
        fecha: new Date().toISOString().split('T')[0],
        tecnico: ''
    });
    const [checklistCompletado, setChecklistCompletado] = useState(false);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    const handleVolver = () => {
        navigate('/asignacion');
    };

    // Cargar productos disponibles
    const cargarProductos = async () => {
        setLoading(true);
        setApiError(false);
        try {
            console.log('📤 Cargando productos desde API...');
            const response = await api.get('/productos');
            let productosData = response.data?.data || response.data || [];
            if (!Array.isArray(productosData)) productosData = [];
            
            const disponibles = productosData.filter(p => p.id_estado_equipo === 1);
            console.log(`✅ ${disponibles.length} productos disponibles encontrados`);
            setProductos(disponibles);
        } catch (error) {
            console.error('Error cargando productos:', error);
            setApiError(true);
            showSnackbar('Error al cargar productos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Cargar colaboradores
    const cargarColaboradores = async () => {
        setLoadingColaboradores(true);
        try {
            console.log('📤 Cargando colaboradores desde API...');
            const response = await api.get('/colaboradores');
            let colaboradoresData = response.data?.data || response.data || [];
            if (!Array.isArray(colaboradoresData)) colaboradoresData = [];
            
            const activos = colaboradoresData.filter(c => c.estado === 'ACTIVO');
            console.log(`✅ ${activos.length} colaboradores activos`);
            setColaboradores(activos);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            setColaboradores([]);
        } finally {
            setLoadingColaboradores(false);
        }
    };

    useEffect(() => {
        cargarProductos();
        cargarColaboradores();
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setTicketInfo(prev => ({
            ...prev,
            tecnico: user.nombre || user.usuario || 'Técnico'
        }));
        
        if (productoDesdeAsignacion) {
            setMostrarChecklist(true);
        }
    }, []);

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        console.log('Producto seleccionado:', producto.nombre);
    };

    const handleSeleccionarColaborador = (colaborador) => {
        setColaboradorSeleccionado(colaborador);
        console.log('Colaborador seleccionado:', colaborador.nombre);
    };

    const handleIniciarChecklist = () => {
        if (!productoSeleccionado) {
            showSnackbar('Debes seleccionar un producto', 'warning');
            return;
        }
        if (!colaboradorSeleccionado) {
            showSnackbar('Debes seleccionar un colaborador', 'warning');
            return;
        }
        setMostrarChecklist(true);
        setActiveStep(0);
    };

    const handleCheckChange = (categoriaIdx, itemIdx) => {
        const newChecklist = [...checklist];
        newChecklist[categoriaIdx].items[itemIdx].ok = !newChecklist[categoriaIdx].items[itemIdx].ok;
        setChecklist(newChecklist);
    };

    const handleObservacionChange = (categoriaIdx, itemIdx, value) => {
        const newChecklist = [...checklist];
        newChecklist[categoriaIdx].items[itemIdx].observacion = value;
        setChecklist(newChecklist);
    };

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const calcularProgreso = () => {
        let totalItems = 0;
        let itemsOk = 0;
        checklist.forEach(categoria => {
            categoria.items.forEach(item => {
                totalItems++;
                if (item.ok) itemsOk++;
            });
        });
        return totalItems > 0 ? (itemsOk / totalItems) * 100 : 0;
    };

    // Función para guardar el checklist y continuar - CORREGIDA (sin elementos React)
    const handleCompletarChecklist = () => {
        setGenerandoPDF(true);
        
        setTimeout(() => {
            setGenerandoPDF(false);
            
            // Crear un objeto limpio para guardar en localStorage (sin elementos React)
            const checklistData = {
                producto: {
                    id: productoSeleccionado.id,
                    nombre: productoSeleccionado.nombre,
                    numero_serie: productoSeleccionado.numero_serie,
                    marca: productoSeleccionado.marca,
                    modelo: productoSeleccionado.modelo,
                    id_estado_equipo: productoSeleccionado.id_estado_equipo
                },
                colaborador: {
                    id: colaboradorSeleccionado.id,
                    nombre: colaboradorSeleccionado.nombre,
                    rut: colaboradorSeleccionado.rut,
                    email: colaboradorSeleccionado.email,
                    cargo: colaboradorSeleccionado.cargo,
                    departamento: colaboradorSeleccionado.departamento
                },
                ticket: ticketInfo,
                fecha: new Date().toISOString(),
                firma: firmaDigital,
                categorias: checklist.map(cat => ({
                    id: cat.id,
                    nombre: cat.nombre,
                    items: cat.items.map(item => ({
                        id: item.id,
                        label: item.label,
                        ok: item.ok,
                        observacion: item.observacion
                    }))
                })),
                tipo: tipoAccion,
                completado: true
            };
            
            // Guardar en localStorage
            localStorage.setItem(`checklist_producto_${productoSeleccionado.id}`, JSON.stringify(checklistData));
            localStorage.setItem(`checklist_fecha_${productoSeleccionado.id}`, new Date().toISOString());
            
            console.log('✅ Checklist guardado en localStorage');
            
            showSnackbar('✅ Checklist completado exitosamente. Redirigiendo...', 'success');
            
            setChecklistCompletado(true);
            
            // Redirigir a asignaciones con datos simples (sin elementos React)
            setTimeout(() => {
                navigate('/asignacion', {
                    state: {
                        producto: {
                            id: productoSeleccionado.id,
                            nombre: productoSeleccionado.nombre,
                            numero_serie: productoSeleccionado.numero_serie,
                            marca: productoSeleccionado.marca,
                            modelo: productoSeleccionado.modelo,
                            id_estado_equipo: productoSeleccionado.id_estado_equipo
                        },
                        colaborador: {
                            id: colaboradorSeleccionado.id,
                            nombre: colaboradorSeleccionado.nombre,
                            rut: colaboradorSeleccionado.rut
                        },
                        checklistCompletado: true,
                        tipo: tipoAccion,
                        fechaChecklist: new Date().toISOString()
                    }
                });
            }, 1500);
        }, 800);
    };

    const progreso = calcularProgreso();

    const productosFiltrados = productos.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return p.nombre?.toLowerCase().includes(term) ||
               p.numero_serie?.toLowerCase().includes(term) ||
               p.marca?.toLowerCase().includes(term);
    });

    if (checklistCompletado) {
        return (
            <Box sx={{ bgcolor: colors.background, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: colors.success, mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        ¡Checklist Completado!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        El checklist se ha guardado correctamente.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Serás redirigido para continuar con el proceso.
                    </Typography>
                    <CircularProgress size={30} />
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleGoHome} sx={{ mr: 2 }}>
                        <HomeIcon />
                    </IconButton>
                    <CheckBoxIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Checklist de Entrega de Equipos
                    </Typography>
                    <Button 
                        variant="outlined" 
                        startIcon={<ArrowBackIcon />}
                        onClick={handleVolver}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Volver
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 4, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Lista de verificación de entrega de equipos TI
                    </Typography>
                    <Typography sx={{ opacity: 0.9 }}>
                        Complete el checklist antes de {tipoAccion === 'asignacion' ? 'asignar' : 'prestar'} el equipo al colaborador.
                    </Typography>
                </Paper>

                {!mostrarChecklist ? (
                    <>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, borderRadius: 3, border: `1px solid ${colors.border}` }}>
                                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                        <InventoryIcon color="primary" />
                                        Seleccionar Producto
                                        <Chip label={`${productosFiltrados.length} disponibles`} size="small" color="info" />
                                        <IconButton size="small" onClick={cargarProductos} disabled={loading}>
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Buscar producto..."
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
                                            )
                                        }}
                                        sx={{ mb: 2 }}
                                    />

                                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        {loading ? (
                                            <Box textAlign="center" py={4}>
                                                <CircularProgress />
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Cargando productos...</Typography>
                                            </Box>
                                        ) : productosFiltrados.length === 0 ? (
                                            <Box textAlign="center" py={4}>
                                                <InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                                <Typography variant="body1" color="text.secondary">No hay productos disponibles</Typography>
                                            </Box>
                                        ) : (
                                            productosFiltrados.map((producto) => {
                                                const isDisponible = producto.id_estado_equipo === 1;
                                                return (
                                                    <Card 
                                                        key={producto.id} 
                                                        sx={{ 
                                                            mb: 1, 
                                                            cursor: isDisponible ? 'pointer' : 'not-allowed',
                                                            opacity: isDisponible ? 1 : 0.6,
                                                            border: productoSeleccionado?.id === producto.id ? `2px solid ${colors.success}` : `1px solid ${colors.border}`,
                                                            bgcolor: productoSeleccionado?.id === producto.id ? alpha(colors.success, 0.05) : 'transparent'
                                                        }}
                                                        onClick={() => isDisponible && handleSeleccionarProducto(producto)}
                                                    >
                                                        <CardContent sx={{ py: 1.5 }}>
                                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                <Box>
                                                                    <Typography variant="body1" fontWeight={500}>
                                                                        {producto.nombre}
                                                                        {!isDisponible && <Chip size="small" label="No disponible" sx={{ ml: 1, height: 20 }} color="warning" />}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Serie: {producto.numero_serie || 'N/A'} | {producto.marca || '-'} {producto.modelo || '-'}
                                                                    </Typography>
                                                                </Box>
                                                                {productoSeleccionado?.id === producto.id && <CheckCircleIcon sx={{ color: colors.success }} />}
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, borderRadius: 3, border: `1px solid ${colors.border}` }}>
                                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                        <PersonIcon color="success" />
                                        Seleccionar Colaborador
                                        <Chip label={`${colaboradores.length} activos`} size="small" color="info" />
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        {loadingColaboradores ? (
                                            <Box textAlign="center" py={4}>
                                                <CircularProgress />
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Cargando colaboradores...</Typography>
                                            </Box>
                                        ) : colaboradores.length === 0 ? (
                                            <Box textAlign="center" py={4}>
                                                <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                                                <Typography variant="body1" color="text.secondary">No hay colaboradores activos</Typography>
                                            </Box>
                                        ) : (
                                            colaboradores.map((colaborador) => (
                                                <Card 
                                                    key={colaborador.id} 
                                                    sx={{ 
                                                        mb: 1, 
                                                        cursor: 'pointer',
                                                        border: colaboradorSeleccionado?.id === colaborador.id ? `2px solid ${colors.success}` : `1px solid ${colors.border}`,
                                                        bgcolor: colaboradorSeleccionado?.id === colaborador.id ? alpha(colors.success, 0.05) : 'transparent'
                                                    }}
                                                    onClick={() => handleSeleccionarColaborador(colaborador)}
                                                >
                                                    <CardContent sx={{ py: 1.5 }}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography variant="body1" fontWeight={500}>
                                                                    {colaborador.nombre}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {colaborador.rut} | {colaborador.cargo || '-'} | {colaborador.departamento || '-'}
                                                                </Typography>
                                                            </Box>
                                                            {colaboradorSeleccionado?.id === colaborador.id && <CheckCircleIcon sx={{ color: colors.success }} />}
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button variant="outlined" size="large" onClick={handleVolver} sx={{ borderRadius: 2, px: 4 }}>
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<CheckBoxIcon />}
                                onClick={handleIniciarChecklist}
                                disabled={!productoSeleccionado || !colaboradorSeleccionado}
                                sx={{ borderRadius: 2, px: 4, bgcolor: colors.success }}
                            >
                                Iniciar Checklist
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${colors.border}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                                <CheckBoxIcon color="primary" />
                                Checklist de Entrega - {productoSeleccionado?.nombre}
                            </Typography>
                            <Button variant="outlined" size="small" onClick={() => setMostrarChecklist(false)}>
                                Volver a selección
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2" color="text.secondary">Progreso de verificación</Typography>
                                <Typography variant="body2" fontWeight={600} color={progreso === 100 ? colors.success : colors.primary}>
                                    {Math.round(progreso)}%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={progreso} sx={{ height: 10, borderRadius: 5 }} />
                        </Box>

                        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(colors.primary, 0.03), border: `1px solid ${colors.border}` }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        <InventoryIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> Equipo
                                    </Typography>
                                    <Typography variant="body2"><strong>Producto:</strong> {productoSeleccionado?.nombre}</Typography>
                                    <Typography variant="body2"><strong>N° Serie:</strong> {productoSeleccionado?.numero_serie || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        <PersonIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} /> Colaborador
                                    </Typography>
                                    <Typography variant="body2"><strong>Nombre:</strong> {colaboradorSeleccionado?.nombre}</Typography>
                                    <Typography variant="body2"><strong>RUT:</strong> {colaboradorSeleccionado?.rut}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 2, mb: 3, border: `1px solid ${colors.border}` }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Ticket</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="N° Ticket" size="small" value={ticketInfo.ticket} onChange={(e) => setTicketInfo({ ...ticketInfo, ticket: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Fecha" size="small" type="date" value={ticketInfo.fecha} onChange={(e) => setTicketInfo({ ...ticketInfo, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField fullWidth label="Técnico" size="small" value={ticketInfo.tecnico} onChange={(e) => setTicketInfo({ ...ticketInfo, tecnico: e.target.value })} />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Stepper activeStep={activeStep} orientation="vertical">
                            {checklist.map((categoria, categoriaIdx) => (
                                <Step key={categoria.id}>
                                    <StepLabel StepIconComponent={() => (
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                            {categoria.id === 'hardware' && <ComputerIcon sx={{ fontSize: 16 }} />}
                                            {categoria.id === 'software' && <BuildIcon sx={{ fontSize: 16 }} />}
                                            {categoria.id === 'redes' && <SecurityIcon sx={{ fontSize: 16 }} />}
                                        </Avatar>
                                    )}>
                                        <Typography variant="subtitle1" fontWeight={600}>{categoria.nombre}</Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <Paper sx={{ p: 2, mb: 2 }}>
                                            {categoria.items.map((item, itemIdx) => (
                                                <Box key={item.id} sx={{ mb: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={item.ok}
                                                                onChange={() => handleCheckChange(categoriaIdx, itemIdx)}
                                                                icon={<CheckBoxOutlineBlankIcon />}
                                                                checkedIcon={<CheckBoxIcon />}
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{item.label}</Typography>}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Observación (opcional)"
                                                        value={item.observacion}
                                                        onChange={(e) => handleObservacionChange(categoriaIdx, itemIdx, e.target.value)}
                                                        sx={{ mt: 1, ml: 4, width: 'calc(100% - 32px)' }}
                                                    />
                                                </Box>
                                            ))}
                                        </Paper>
                                        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                                            <Button variant="contained" onClick={handleNext}>
                                                {activeStep === checklist.length - 1 ? 'Finalizar' : 'Continuar'}
                                            </Button>
                                            {activeStep > 0 && <Button onClick={handleBack}>Atrás</Button>}
                                        </Box>
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>

                        {activeStep === checklist.length && (
                            <Paper sx={{ p: 3, mt: 3, bgcolor: alpha(colors.success, 0.05), border: `1px solid ${colors.success}` }}>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <CheckCircleIcon color="success" /> Confirmación de Entrega
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                
                                <FormControlLabel
                                    control={<Checkbox checked={usuarioConforme} onChange={(e) => setUsuarioConforme(e.target.checked)} />}
                                    label="El usuario confirma que el equipo está en buen estado y funciona correctamente"
                                />

                                {usuarioConforme && (
                                    <Box sx={{ mt: 2 }}>
                                        <TextField
                                            fullWidth
                                            label="Firma Digital del Usuario"
                                            placeholder="Nombre completo del usuario"
                                            value={firmaDigital}
                                            onChange={(e) => setFirmaDigital(e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            Al hacer clic en "Completar Checklist", se guardará el checklist y podrás continuar con la {tipoAccion === 'asignacion' ? 'asignación' : 'préstamo'} del equipo.
                                        </Alert>
                                        <Box display="flex" gap={2} flexWrap="wrap">
                                            <Button
                                                variant="contained"
                                                color="success"
                                                startIcon={generandoPDF ? <CircularProgress size={20} /> : <SaveAltIcon />}
                                                onClick={handleCompletarChecklist}
                                                disabled={!usuarioConforme || !firmaDigital || generandoPDF}
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                            >
                                                {generandoPDF ? 'Guardando...' : 'Completar Checklist'}
                                            </Button>
                                            <Button variant="outlined" startIcon={<LocalPrintshopIcon />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>
                                                Imprimir Checklist
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        )}
                    </Paper>
                )}

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default ChecklistAsignacionPage;