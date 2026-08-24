// src/pages/ColaboradoresPage.jsx - VERSIÓN CORREGIDA (CON refreshProductosAsignados DEFINIDA)
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Collapse,
    FormHelperText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon,
    Person as PersonIcon,
    Home as HomeIcon,
    FilterListOff as FilterListOffIcon,
    AssignmentInd as AssignmentIndIcon,
    Inventory as InventoryIcon,
    Business as BusinessIcon,
    SortByAlpha as SortByAlphaIcon,
    Clear as ClearIcon,
    FilterAlt as FilterAltIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Warehouse as WarehouseIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Build as BuildIcon,
    Description as DescriptionIcon,
    Inventory2 as Inventory2Icon,
    History as HistoryIcon
} from '@mui/icons-material';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import colaboradorService from '../services/colaboradorService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import OfilabFooter from '../components/OfilabFooter';

// Colores corporativos OFILAB
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

// Opciones de empresas
const OPCIONES_EMPRESA = [
    { valor: 'GLOBAL', label: 'Global', color: '#8B5CF6', icon: '🌍' },
    { valor: 'DREAMTEC', label: 'Dreamtec', color: '#EC4899', icon: '✨' },
    { valor: 'OFIMUNDO', label: 'Ofimundo', color: '#0A66C2', icon: '🏢' },
    { valor: 'HIWAY', label: 'HIway', color: '#10B981', icon: '🛣️' }
];

// Obtener color de empresa
const getEmpresaColor = (empresa) => {
    if (!empresa) return '#6B7280';
    const found = OPCIONES_EMPRESA.find(e => e.valor.toUpperCase() === String(empresa).trim().toUpperCase());
    return found ? found.color : '#6B7280';
};

// Obtener label de empresa
const getEmpresaLabel = (empresa) => {
    if (!empresa) return 'No asignada';
    const found = OPCIONES_EMPRESA.find(e => e.valor.toUpperCase() === String(empresa).trim().toUpperCase());
    return found ? found.label : String(empresa);
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

// Componente de filtros avanzados
const AdvancedFilters = ({ filters, onFilterChange, onClearFilters, departamentos, activeFiltersCount }) => {
    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Empresa</InputLabel>
                        <Select
                            value={filters.empresa}
                            onChange={(e) => onFilterChange('empresa', e.target.value)}
                            label="Empresa"
                        >
                            <MenuItem value="">Todas</MenuItem>
                            {OPCIONES_EMPRESA.map((emp) => (
                                <MenuItem key={emp.valor} value={emp.valor}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <span>{emp.icon}</span>
                                        {emp.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={filters.estado}
                            onChange={(e) => onFilterChange('estado', e.target.value)}
                            label="Estado"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="ACTIVO">Activos</MenuItem>
                            <MenuItem value="INACTIVO">Inactivos</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Departamento</InputLabel>
                        <Select
                            value={filters.departamento}
                            onChange={(e) => onFilterChange('departamento', e.target.value)}
                            label="Departamento"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {departamentos.map((depto) => (
                                <MenuItem key={depto} value={depto}>{depto}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Asignaciones</InputLabel>
                        <Select
                            value={filters.asignaciones}
                            onChange={(e) => onFilterChange('asignaciones', e.target.value)}
                            label="Asignaciones"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="con_asignaciones">Con productos asignados</MenuItem>
                            <MenuItem value="sin_asignaciones">Sin productos asignados</MenuItem>
                            <MenuItem value="con_historial">Con historial de asignaciones</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Ordenar por</InputLabel>
                        <Select
                            value={filters.ordenarPor}
                            onChange={(e) => onFilterChange('ordenarPor', e.target.value)}
                            label="Ordenar por"
                        >
                            <MenuItem value="nombre_asc">Nombre (A-Z)</MenuItem>
                            <MenuItem value="nombre_desc">Nombre (Z-A)</MenuItem>
                            <MenuItem value="empresa_asc">Empresa (A-Z)</MenuItem>
                            <MenuItem value="empresa_desc">Empresa (Z-A)</MenuItem>
                            <MenuItem value="asignaciones_desc">Más asignaciones</MenuItem>
                            <MenuItem value="asignaciones_asc">Menos asignaciones</MenuItem>
                            <MenuItem value="fecha_ingreso_desc">Más recientes</MenuItem>
                            <MenuItem value="fecha_ingreso_asc">Más antiguos</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            
            {activeFiltersCount > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<ClearIcon />}
                        onClick={onClearFilters}
                    >
                        Limpiar todos los filtros ({activeFiltersCount})
                    </Button>
                </Box>
            )}
        </Box>
    );
};

// Diálogo de detalle de colaborador
const ColaboradorDetailDialog = ({ open, onClose, colaborador, productos = [], onRefresh, loading }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            const parsed = new Date(dateString);
            if (isNaN(parsed.getTime())) return String(dateString);
            return format(parsed, 'dd/MM/yyyy', { locale: es });
        } catch {
            return String(dateString);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            const parsed = new Date(dateString);
            if (isNaN(parsed.getTime())) return String(dateString);
            return format(parsed, "dd/MM/yyyy HH:mm", { locale: es });
        } catch {
            return String(dateString);
        }
    };

    if (!colaborador) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: getEmpresaColor(colaborador.empresa), width: 56, height: 56 }}>
                            {colaborador.nombre?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {colaborador.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {colaborador.rut} • {colaborador.email}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                    size="small"
                                    icon={<BusinessIcon />}
                                    label={getEmpresaLabel(colaborador.empresa)}
                                    sx={{
                                        backgroundColor: alpha(getEmpresaColor(colaborador.empresa), 0.1),
                                        color: getEmpresaColor(colaborador.empresa),
                                        fontWeight: 500
                                    }}
                                />
                                <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                    Total Asignaciones: {colaborador.total_asignaciones || 0} | 
                                    Activas: {colaborador.asignaciones_activas || 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <IconButton onClick={onRefresh} size="small" title="Actualizar productos" disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Información Personal
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Empresa:</Typography>
                                    <Chip
                                        size="small"
                                        label={getEmpresaLabel(colaborador.empresa)}
                                        sx={{
                                            backgroundColor: alpha(getEmpresaColor(colaborador.empresa), 0.1),
                                            color: getEmpresaColor(colaborador.empresa)
                                        }}
                                    />
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">RUT:</Typography>
                                    <Typography fontWeight={500}>{colaborador.rut}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Email:</Typography>
                                    <Typography fontWeight={500}>{colaborador.email}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Teléfono:</Typography>
                                    <Typography fontWeight={500}>{colaborador.telefono || 'No registrado'}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Dirección:</Typography>
                                    <Typography fontWeight={500}>{colaborador.direccion || 'No registrada'}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Fecha Nacimiento:</Typography>
                                    <Typography fontWeight={500}>{formatDate(colaborador.fecha_nacimiento)}</Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Información Laboral
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Cargo:</Typography>
                                    <Typography fontWeight={500}>{colaborador.cargo || 'No especificado'}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Departamento:</Typography>
                                    <Typography fontWeight={500}>{colaborador.departamento || 'No especificado'}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Fecha Ingreso:</Typography>
                                    <Typography fontWeight={500}>{formatDate(colaborador.fecha_ingreso)}</Typography>
                                </Box>
                                <Divider />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography color="text.secondary">Estado:</Typography>
                                    <Chip
                                        size="small"
                                        label={colaborador.estado}
                                        sx={{
                                            backgroundColor: colaborador.estado === 'ACTIVO' 
                                                ? alpha(colors.success, 0.1) 
                                                : alpha(colors.error, 0.1),
                                            color: colaborador.estado === 'ACTIVO' 
                                                ? colors.success 
                                                : colors.error,
                                        }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            <Box display="flex" alignItems="center" gap={1}>
                                <AssignmentIndIcon />
                                Productos Asignados ({productos.length})
                            </Box>
                        </Typography>
                        
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2 }}>Cargando productos asignados...</Typography>
                            </Box>
                        ) : productos.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: alpha(colors.primary, 0.02) }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Marca</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Modelo</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Serie</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Fecha Asignación</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {productos.map((prod, idx) => (
                                            <TableRow key={prod.asignacion_id || prod.id || idx}>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <InventoryIcon fontSize="small" sx={{ color: colors.primary }} />
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {prod.producto_nombre || prod.nombre}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{prod.marca || '-'}</TableCell>
                                                <TableCell>{prod.modelo || '-'}</TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                        {prod.numero_serie || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{formatDateTime(prod.fecha_asignacion)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={prod.fecha_devolucion ? 'DEVUELTO' : 'ASIGNADO'}
                                                        sx={{
                                                            backgroundColor: prod.fecha_devolucion 
                                                                ? alpha(colors.info, 0.1) 
                                                                : alpha(colors.success, 0.1),
                                                            color: prod.fecha_devolucion 
                                                                ? colors.info 
                                                                : colors.success,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Alert severity="info" sx={{ mt: 1 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <InventoryIcon />
                                    <Typography>Este colaborador no tiene productos asignados actualmente</Typography>
                                </Box>
                            </Alert>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Formulario de colaborador
const ColaboradorForm = ({ open, onClose, colaborador, onSave }) => {
    const [formData, setFormData] = useState({
        rut: '',
        nombre: '',
        email: '',
        telefono: '',
        cargo: '',
        departamento: '',
        fecha_ingreso: '',
        estado: 'ACTIVO',
        direccion: '',
        fecha_nacimiento: '',
        empresa: 'OFIMUNDO'
    });

    const [errores, setErrores] = useState({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (colaborador) {
                setFormData({
                    rut: colaborador.rut || '',
                    nombre: colaborador.nombre || '',
                    email: colaborador.email || '',
                    telefono: colaborador.telefono || '',
                    cargo: colaborador.cargo || '',
                    departamento: colaborador.departamento || '',
                    fecha_ingreso: colaborador.fecha_ingreso?.split('T')[0] || '',
                    estado: colaborador.estado || 'ACTIVO',
                    direccion: colaborador.direccion || '',
                    fecha_nacimiento: colaborador.fecha_nacimiento?.split('T')[0] || '',
                    empresa: colaborador.empresa || 'OFIMUNDO'
                });
            } else {
                setFormData({
                    rut: '',
                    nombre: '',
                    email: '',
                    telefono: '',
                    cargo: '',
                    departamento: '',
                    fecha_ingreso: '',
                    estado: 'ACTIVO',
                    direccion: '',
                    fecha_nacimiento: '',
                    empresa: 'OFIMUNDO'
                });
            }
            setErrores({});
            setErrorMessage('');
            setIsSubmitting(false);
        }
    }, [colaborador, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'rut') {
            const rutLimpio = value.replace(/[^0-9kK]/g, '');
            if (rutLimpio.length <= 9) {
                setFormData({ ...formData, [name]: colaboradorService.formatRut(rutLimpio) });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        if (errores[name]) {
            setErrores({ ...errores, [name]: null });
        }
        
        if (name === 'empresa' && value?.toUpperCase() === 'HIWAY') {
            if (errores.email && !formData.email?.trim()) {
                setErrores(prev => ({ ...prev, email: null }));
            }
        }
        
        if (errorMessage) setErrorMessage('');
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.rut?.trim()) {
            nuevosErrores.rut = 'El RUT es requerido';
        } else if (!colaboradorService.validateRut(formData.rut)) {
            nuevosErrores.rut = 'RUT inválido';
        }

        if (!formData.nombre?.trim()) {
            nuevosErrores.nombre = 'El nombre es requerido';
        }

        const isHiway = formData.empresa?.toUpperCase() === 'HIWAY';

        if (!isHiway) {
            if (!formData.email?.trim()) {
                nuevosErrores.email = 'El email es requerido';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                nuevosErrores.email = 'Email inválido';
            }
        } else if (formData.email?.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
            nuevosErrores.email = 'Email inválido';
        }

        if (!formData.empresa) {
            nuevosErrores.empresa = 'Debe seleccionar una empresa';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) return;
        
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setLoading(true);
        setErrorMessage('');

        try {
            const dataToSend = {
                ...formData,
                rut: formData.rut.replace(/[^0-9kK]/g, '').toUpperCase(),
                empresa: formData.empresa || 'OFIMUNDO'
            };

            let response;
            if (colaborador && colaborador.id) {
                response = await colaboradorService.updateColaborador(colaborador.id, dataToSend);
            } else {
                response = await colaboradorService.createColaborador(dataToSend);
            }

            if (response && response.success) {
                if (onSave) {
                    await onSave(response.data);
                }
                handleClose();
            } else {
                throw new Error(response?.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            const serverMsg = error.response?.data?.message || error.message || 'Error al procesar la solicitud';
            let finalMsg = serverMsg;
            if (
                serverMsg.includes('UNIQUE KEY constraint') || 
                serverMsg.includes('duplicate key') || 
                serverMsg.includes('UQ__colabora')
            ) {
                finalMsg = `El colaborador con RUT ${formData.rut} ya se encuentra registrado en el sistema.`;
            }
            setErrorMessage(finalMsg);
            setIsSubmitting(false);
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            rut: '',
            nombre: '',
            email: '',
            telefono: '',
            cargo: '',
            departamento: '',
            fecha_ingreso: '',
            estado: 'ACTIVO',
            direccion: '',
            fecha_nacimiento: '',
            empresa: 'OFIMUNDO'
        });
        setErrores({});
        setErrorMessage('');
        setLoading(false);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                    {colaborador ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
                        {errorMessage}
                    </Alert>
                )}
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small" error={!!errores.empresa}>
                            <InputLabel>Empresa *</InputLabel>
                            <Select
                                name="empresa"
                                value={formData.empresa}
                                onChange={handleChange}
                                label="Empresa *"
                                disabled={loading}
                            >
                                {OPCIONES_EMPRESA.map((emp) => (
                                    <MenuItem key={emp.valor} value={emp.valor}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <span>{emp.icon}</span>
                                            <Typography>{emp.label}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errores.empresa && <FormHelperText error>{errores.empresa}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="RUT *"
                            name="rut"
                            value={formData.rut}
                            onChange={handleChange}
                            error={!!errores.rut}
                            helperText={errores.rut}
                            size="small"
                            placeholder="12.345.678-9"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nombre completo *"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            error={!!errores.nombre}
                            helperText={errores.nombre}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={formData.empresa?.toUpperCase() === 'HIWAY' ? "Email (opcional)" : "Email *"}
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errores.email}
                            helperText={errores.email}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Cargo"
                            name="cargo"
                            value={formData.cargo}
                            onChange={handleChange}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Departamento"
                            name="departamento"
                            value={formData.departamento}
                            onChange={handleChange}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha de ingreso"
                            name="fecha_ingreso"
                            value={formData.fecha_ingreso}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Estado</InputLabel>
                            <Select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                label="Estado"
                                disabled={loading}
                            >
                                <MenuItem value="ACTIVO">Activo</MenuItem>
                                <MenuItem value="INACTIVO">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Dirección"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            multiline
                            rows={2}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha de nacimiento"
                            name="fecha_nacimiento"
                            value={formData.fecha_nacimiento}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            disabled={loading}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={handleClose} variant="outlined" disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || isSubmitting}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Guardando...' : (colaborador ? 'Actualizar' : 'Crear')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Diálogo de confirmación de eliminación
const ConfirmDeleteDialog = ({ open, onClose, colaborador, onConfirm }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: alpha(colors.error, 0.05)
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <DeleteIcon sx={{ color: colors.error }} />
                    <Typography variant="h6">Confirmar Eliminación</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Esta acción eliminará permanentemente al colaborador.
                </Alert>
                
                <Typography variant="body1" gutterBottom>
                    ¿Está seguro que desea eliminar a <strong>{colaborador?.nombre}</strong>?
                </Typography>
                
                {colaborador && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Empresa:</strong> {getEmpresaLabel(colaborador.empresa)}
                        </Typography>
                        <Typography variant="body2">
                            <strong>RUT:</strong> {colaborador.rut}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Email:</strong> {colaborador.email}
                        </Typography>
                        {colaborador.asignaciones_activas > 0 && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                ⚠️ Este colaborador tiene {colaborador.asignaciones_activas} productos asignados. 
                                Debe devolverlos antes de eliminar.
                            </Alert>
                        )}
                    </Paper>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    color="error"
                    disabled={colaborador?.asignaciones_activas > 0}
                >
                    Eliminar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Componente principal
const ColaboradoresPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
    const navigate = useNavigate();
    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);

    // Estados
    const [colaboradores, setColaboradores] = useState([]);
    const [filteredColaboradores, setFilteredColaboradores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({
        estado: '',
        departamento: '',
        empresa: '',
        asignaciones: '',
        ordenarPor: 'nombre_asc'
    });
    const [departamentos, setDepartamentos] = useState([]);
    const [stats, setStats] = useState({
        total_colaboradores: 0,
        activos: 0,
        inactivos: 0,
        total_departamentos: 0,
        total_equipos_asignados: 0
    });

    // Diálogos
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
    const [selectedColaborador, setSelectedColaborador] = useState(null);
    const [selectedColaboradorDetail, setSelectedColaboradorDetail] = useState(null);
    const [productosAsignados, setProductosAsignados] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const refreshTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);

    // UI
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    // Cleanup al desmontar el componente
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    // Función para ordenar colaboradores
    const sortColaboradores = useCallback((colaboradoresList, ordenarPor) => {
        if (!Array.isArray(colaboradoresList)) return [];
        const sorted = [...colaboradoresList].filter(Boolean);
        
        switch (ordenarPor) {
            case 'nombre_asc':
                return sorted.sort((a, b) => (a?.nombre || '').localeCompare(b?.nombre || ''));
            case 'nombre_desc':
                return sorted.sort((a, b) => (b?.nombre || '').localeCompare(a?.nombre || ''));
            case 'empresa_asc':
                return sorted.sort((a, b) => (a?.empresa || '').localeCompare(b?.empresa || ''));
            case 'empresa_desc':
                return sorted.sort((a, b) => (b?.empresa || '').localeCompare(a?.empresa || ''));
            case 'asignaciones_desc':
                return sorted.sort((a, b) => (b?.asignaciones_activas || 0) - (a?.asignaciones_activas || 0));
            case 'asignaciones_asc':
                return sorted.sort((a, b) => (a?.asignaciones_activas || 0) - (b?.asignaciones_activas || 0));
            case 'fecha_ingreso_desc':
                return sorted.sort((a, b) => new Date(b?.fecha_ingreso || 0) - new Date(a?.fecha_ingreso || 0));
            case 'fecha_ingreso_asc':
                return sorted.sort((a, b) => new Date(a?.fecha_ingreso || 0) - new Date(b?.fecha_ingreso || 0));
            default:
                return sorted;
        }
    }, []);

    // Función para filtrar colaboradores localmente
    const applyFilters = useCallback(() => {
        if (!Array.isArray(colaboradores)) {
            setFilteredColaboradores([]);
            return;
        }
        let result = colaboradores.filter(Boolean);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(col => 
                col && (
                    (col.nombre && col.nombre.toLowerCase().includes(term)) ||
                    (col.rut && col.rut.toLowerCase().includes(term)) ||
                    (col.email && col.email.toLowerCase().includes(term))
                )
            );
        }

        if (filters.empresa) {
            result = result.filter(col => col && col.empresa && String(col.empresa).trim().toUpperCase() === String(filters.empresa).trim().toUpperCase());
        }

        if (filters.estado) {
            result = result.filter(col => col && col.estado === filters.estado);
        }

        if (filters.departamento) {
            result = result.filter(col => col && col.departamento === filters.departamento);
        }

        if (filters.asignaciones) {
            switch (filters.asignaciones) {
                case 'con_asignaciones':
                    result = result.filter(col => col && (col.asignaciones_activas || 0) > 0);
                    break;
                case 'sin_asignaciones':
                    result = result.filter(col => col && (col.asignaciones_activas || 0) === 0);
                    break;
                case 'con_historial':
                    result = result.filter(col => col && (col.total_asignaciones || 0) > 0);
                    break;
                default:
                    break;
            }
        }

        result = sortColaboradores(result, filters.ordenarPor);
        setFilteredColaboradores(result);
    }, [colaboradores, searchTerm, filters, sortColaboradores]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Función para cargar datos - CON PREVENCIÓN DE LLAMADAS MÚLTIPLES
    const fetchData = useCallback(async (showRefresh = false) => {
        if (isFetchingRef.current) return;
        
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        isFetchingRef.current = true;
        setIsFetching(true);

        try {
            const data = await colaboradorService.getColaboradores();
            console.log('📊 Datos de colaboradores recibidos:', data?.length || 0);
            const list = Array.isArray(data) ? data.filter(Boolean) : [];
            setColaboradores(list);
            
            const activos = list.filter(c => c && c.estado === 'ACTIVO').length;
            const inactivos = list.filter(c => c && c.estado === 'INACTIVO').length;
            const departamentosUnicos = [...new Set(list.map(c => c?.departamento).filter(Boolean))];
            
            setStats({
                total_colaboradores: list.length,
                activos: activos,
                inactivos: inactivos,
                total_departamentos: departamentosUnicos.length,
                total_equipos_asignados: list.reduce((sum, col) => sum + (col?.asignaciones_activas || 0), 0)
            });

            if (showRefresh) {
                showSnackbar('Datos actualizados', 'success');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
            isFetchingRef.current = false;
            setIsFetching(false);
        }
    }, [showSnackbar]);

    // Función para cargar datos iniciales
    const fetchInitialData = useCallback(async () => {
        try {
            const colaboradoresData = await colaboradorService.getColaboradores();
            if (Array.isArray(colaboradoresData)) {
                const departamentosUnicos = [...new Set(colaboradoresData.map(c => c?.departamento).filter(Boolean))];
                setDepartamentos(departamentosUnicos);
            }
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }, []);

    // Efecto único para carga inicial
    useEffect(() => {
        const loadData = async () => {
            await fetchData();
            await fetchInitialData();
        };
        loadData();
    }, []);

    // Función para cargar productos asignados
    const loadProductosAsignados = useCallback(async (colaboradorId) => {
        setLoadingProductos(true);
        try {
            console.log(`📥 Cargando productos asignados para colaborador ID: ${colaboradorId}`);
            const productos = await colaboradorService.getProductosAsignados(colaboradorId);
            console.log(`✅ Productos asignados encontrados: ${productos?.length || 0}`);
            setProductosAsignados(productos || []);
            return productos;
        } catch (error) {
            console.error('Error cargando productos asignados:', error);
            showSnackbar('Error al cargar productos asignados', 'error');
            setProductosAsignados([]);
            return [];
        } finally {
            setLoadingProductos(false);
        }
    }, [showSnackbar]);

    // Función para refrescar productos asignados (DEFINIDA CORRECTAMENTE)
    const refreshProductosAsignados = useCallback(async () => {
        if (selectedColaboradorDetail) {
            console.log('🔄 Refrescando productos asignados...');
            await loadProductosAsignados(selectedColaboradorDetail.id);
        }
    }, [selectedColaboradorDetail, loadProductosAsignados]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({
            estado: '',
            departamento: '',
            empresa: '',
            asignaciones: '',
            ordenarPor: 'nombre_asc'
        });
        setShowAdvancedFilters(false);
    }, []);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleOpenForm = useCallback((colaborador = null) => {
        setSelectedColaborador(colaborador);
        setOpenForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setSelectedColaborador(null);
        setOpenForm(false);
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
            fetchData();
        }, 300);
    }, [fetchData]);

    const handleSave = useCallback(async (colaboradorData) => {
        setOpenForm(false);
        setSelectedColaborador(null);
        
        showSnackbar(
            selectedColaborador ? 'Colaborador actualizado correctamente' : 'Colaborador creado correctamente',
            'success'
        );
        
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
            fetchData();
            fetchInitialData();
        }, 500);
    }, [selectedColaborador, fetchData, fetchInitialData, showSnackbar]);

    const handleOpenDetail = useCallback(async (colaborador) => {
        try {
            console.log('🔍 Abriendo detalle para colaborador:', colaborador.id, colaborador.nombre);
            setSelectedColaboradorDetail(colaborador);
            await loadProductosAsignados(colaborador.id);
            setOpenDetail(true);
        } catch (error) {
            console.error('Error abriendo detalle:', error);
            showSnackbar('Error al cargar productos asignados', 'error');
            setProductosAsignados([]);
            setSelectedColaboradorDetail(colaborador);
            setOpenDetail(true);
        }
    }, [loadProductosAsignados, showSnackbar]);

    const handleCloseDetail = useCallback(() => {
        setSelectedColaboradorDetail(null);
        setProductosAsignados([]);
        setOpenDetail(false);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!selectedColaborador) return;

        if (selectedColaborador.asignaciones_activas > 0) {
            showSnackbar(`No se puede eliminar. El colaborador tiene ${selectedColaborador.asignaciones_activas} productos asignados.`, 'error');
            return;
        }

        try {
            await colaboradorService.deleteColaborador(selectedColaborador.id);
            showSnackbar('Colaborador eliminado', 'success');
            await fetchData();
            await fetchInitialData();
        } catch (error) {
            console.error('Error eliminando:', error);
            showSnackbar(error.message || 'Error al eliminar', 'error');
        } finally {
            setSelectedColaborador(null);
        }
    }, [selectedColaborador, fetchData, fetchInitialData, showSnackbar]);

    const handleRefresh = useCallback(() => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        fetchData(true);
        if (selectedColaboradorDetail) {
            loadProductosAsignados(selectedColaboradorDetail.id);
        }
    }, [fetchData, selectedColaboradorDetail, loadProductosAsignados]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedColaboradores = filteredColaboradores.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
        value && value !== '' && key !== 'ordenarPor'
    ).length + (searchTerm ? 1 : 0);

    const statsPorEmpresa = OPCIONES_EMPRESA.map(emp => ({
        ...emp,
        cantidad: Array.isArray(colaboradores)
            ? colaboradores.filter(c => c && c.empresa && String(c.empresa).trim().toUpperCase() === emp.valor.toUpperCase()).length
            : 0
    }));

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
                <AppBar 
                    position="fixed" 
                    elevation={1}
                    sx={{ 
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                        bgcolor: colors.surface, 
                        color: colors.text.primary,
                        borderBottom: `1px solid ${colors.border}`
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            onClick={() => setDrawerOpen(!drawerOpen)}
                            edge="start"
                            sx={{ mr: 1.5 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1 }}>
                            <img src="/Logo_transparente.png" alt="OFILAB Logo" style={{ height: '46px', width: 'auto', objectFit: 'contain' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Gestión de Colaboradores
                            </Typography>
                        </Box>
                        <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Toolbar />

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
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>
                        Gestión de Colaboradores
                    </Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>
                        Administra la información de los colaboradores y sus asignaciones
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <GradientButton
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenForm()}
                            disabled={loading}
                        >
                            Nuevo Colaborador
                        </GradientButton>
                    </Stack>
                </Paper>

                {/* Stats Cards con empresas */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                                    {loading ? <CircularProgress size={24} /> : stats.total_colaboradores}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Colaboradores
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
                                    {loading ? <CircularProgress size={24} /> : stats.activos}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Activos
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning }}>
                                    {loading ? <CircularProgress size={24} /> : stats.total_departamentos}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Departamentos
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
                                    {loading ? <CircularProgress size={24} /> : stats.total_equipos_asignados}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Equipos Asignados
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Stats por empresa - FILTRO RÁPIDO */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={4} sm={4} md={4}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                textAlign: 'center',
                                borderRadius: 2,
                                borderTop: `3px solid ${colors.info}`,
                                cursor: 'pointer',
                                bgcolor: !filters.empresa ? alpha(colors.info, 0.05) : 'transparent'
                            }}
                            onClick={() => handleFilterChange('empresa', '')}
                        >
                            <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                                📊
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.info }}>
                                {loading ? <CircularProgress size={20} color="inherit" /> : colaboradores.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Todos
                            </Typography>
                            {!filters.empresa && (
                                <Chip size="small" label="Activo" color="info" sx={{ mt: 1 }} />
                            )}
                        </Paper>
                    </Grid>
                    {statsPorEmpresa.map((emp) => (
                        <Grid item xs={4} sm={4} md={4} key={emp.valor}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    borderRadius: 2,
                                    borderTop: `3px solid ${emp.color}`,
                                    cursor: 'pointer',
                                    bgcolor: filters.empresa === emp.valor ? alpha(emp.color, 0.05) : 'transparent'
                                }}
                                onClick={() => {
                                    if (filters.empresa === emp.valor) {
                                        handleFilterChange('empresa', '');
                                    } else {
                                        handleFilterChange('empresa', emp.valor);
                                    }
                                }}
                            >
                                <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                                    {emp.icon}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: emp.color }}>
                                    {loading ? <CircularProgress size={20} color="inherit" /> : emp.cantidad}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {emp.label}
                                </Typography>
                                {filters.empresa === emp.valor && (
                                    <Chip size="small" label="Filtro activo" color="primary" sx={{ mt: 1 }} />
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Barra de búsqueda y filtros */}
                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por nombre, RUT o email..."
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
                            <Button
                                fullWidth
                                variant={showAdvancedFilters ? "contained" : "outlined"}
                                startIcon={showAdvancedFilters ? <FilterListOffIcon /> : <FilterAltIcon />}
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                color={showAdvancedFilters ? "primary" : "inherit"}
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
                                onClick={handleClearFilters}
                                disabled={activeFiltersCount === 0}
                            >
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>

                    <Collapse in={showAdvancedFilters}>
                        <AdvancedFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                            departamentos={departamentos}
                            activeFiltersCount={activeFiltersCount}
                        />
                    </Collapse>
                </FilterPaper>

                {/* Información de filtros activos */}
                {activeFiltersCount > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                            Filtros activos:
                        </Typography>
                        {searchTerm && (
                            <Chip
                                size="small"
                                label={`Búsqueda: ${searchTerm}`}
                                onDelete={() => setSearchTerm('')}
                                variant="outlined"
                            />
                        )}
                        {filters.empresa && (
                            <Chip
                                size="small"
                                label={`Empresa: ${getEmpresaLabel(filters.empresa)}`}
                                onDelete={() => handleFilterChange('empresa', '')}
                                variant="outlined"
                            />
                        )}
                        {filters.estado && (
                            <Chip
                                size="small"
                                label={`Estado: ${filters.estado}`}
                                onDelete={() => handleFilterChange('estado', '')}
                                variant="outlined"
                            />
                        )}
                        {filters.departamento && (
                            <Chip
                                size="small"
                                label={`Departamento: ${filters.departamento}`}
                                onDelete={() => handleFilterChange('departamento', '')}
                                variant="outlined"
                            />
                        )}
                        {filters.asignaciones && (
                            <Chip
                                size="small"
                                label={`Asignaciones: ${filters.asignaciones === 'con_asignaciones' ? 'Con productos asignados' : filters.asignaciones === 'sin_asignaciones' ? 'Sin productos asignados' : 'Con historial'}`}
                                onDelete={() => handleFilterChange('asignaciones', '')}
                                variant="outlined"
                            />
                        )}
                        <Chip
                            size="small"
                            icon={<SortByAlphaIcon />}
                            label={`Orden: ${filters.ordenarPor === 'nombre_asc' ? 'Nombre A-Z' : filters.ordenarPor === 'nombre_desc' ? 'Nombre Z-A' : filters.ordenarPor === 'empresa_asc' ? 'Empresa A-Z' : filters.ordenarPor === 'empresa_desc' ? 'Empresa Z-A' : filters.ordenarPor === 'asignaciones_desc' ? 'Más asignaciones' : filters.ordenarPor === 'asignaciones_asc' ? 'Menos asignaciones' : 'Más recientes'}`}
                            variant="outlined"
                        />
                    </Box>
                )}

                {/* Resultados encontrados */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Mostrando {paginatedColaboradores.length} de {filteredColaboradores.length} colaboradores
                        {filteredColaboradores.length !== colaboradores.length && ` (filtrados de ${colaboradores.length} totales)`}
                    </Typography>
                </Box>

                {/* Tabla de colaboradores */}
                <StyledTableContainer>
                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Colaborador</StyledTableCell>
                                <StyledTableCell>Empresa</StyledTableCell>
                                <StyledTableCell>Contacto</StyledTableCell>
                                <StyledTableCell>Cargo/Depto</StyledTableCell>
                                <StyledTableCell align="center">Asignaciones</StyledTableCell>
                                <StyledTableCell>Estado</StyledTableCell>
                                <StyledTableCell align="center">Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Cargando colaboradores...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedColaboradores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No hay colaboradores
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {activeFiltersCount > 0 ? 'Intenta con otros filtros' : 'Comienza creando un nuevo colaborador'}
                                        </Typography>
                                        {activeFiltersCount > 0 ? (
                                            <Button
                                                variant="outlined"
                                                startIcon={<FilterListOffIcon />}
                                                onClick={handleClearFilters}
                                                sx={{ mt: 1 }}
                                            >
                                                Limpiar filtros
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => handleOpenForm()}
                                                sx={{ mt: 1 }}
                                            >
                                                Crear Colaborador
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedColaboradores.filter(Boolean).map((col, index) => (
                                    <TableRow key={`${col?.id || index}-${col?.rut || ''}-${index}`} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar sx={{ bgcolor: getEmpresaColor(col?.empresa), width: 40, height: 40 }}>
                                                    {col?.nombre?.charAt(0) || 'U'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {col.nombre}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {col.rut}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                icon={<BusinessIcon />}
                                                label={getEmpresaLabel(col.empresa)}
                                                sx={{
                                                    backgroundColor: alpha(getEmpresaColor(col.empresa), 0.1),
                                                    color: getEmpresaColor(col.empresa),
                                                    fontWeight: 500
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{col.email}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {col.telefono || 'Sin teléfono'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{col.cargo || '-'}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {col.departamento || 'Sin depto.'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography 
                                                    variant="h5" 
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        color: col.asignaciones_activas > 0 ? colors.success : colors.text.secondary,
                                                        fontSize: '1.5rem'
                                                    }}
                                                >
                                                    {col.asignaciones_activas || 0}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                    de {col.total_asignaciones || 0} totales
                                                </Typography>
                                                {col.asignaciones_activas > 0 && (
                                                    <Chip 
                                                        size="small" 
                                                        label={`${col.asignaciones_activas} producto(s) asignado(s)`}
                                                        color="success" 
                                                        variant="outlined"
                                                        sx={{ mt: 0.5, fontSize: '0.65rem', height: '20px' }}
                                                    />
                                                )}
                                                {col.total_asignaciones > 0 && col.asignaciones_activas === 0 && (
                                                    <Chip 
                                                        size="small" 
                                                        label="Histórico"
                                                        variant="outlined"
                                                        sx={{ mt: 0.5, fontSize: '0.65rem', height: '20px' }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={col.estado}
                                                size="small"
                                                sx={{
                                                    backgroundColor: col.estado === 'ACTIVO' 
                                                        ? alpha(colors.success, 0.1) 
                                                        : alpha(colors.error, 0.1),
                                                    color: col.estado === 'ACTIVO' 
                                                        ? colors.success 
                                                        : colors.error,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="Ver detalles y productos asignados">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpenDetail(col)}
                                                        sx={{ color: colors.info }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => handleOpenForm(col)}
                                                        sx={{ color: colors.primary }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={col.asignaciones_activas > 0 ? `Tiene ${col.asignaciones_activas} productos asignados` : "Eliminar"}>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => {
                                                            setSelectedColaborador(col);
                                                            setOpenConfirmDelete(true);
                                                        }}
                                                        disabled={col.asignaciones_activas > 0}
                                                        sx={{ 
                                                            color: col.asignaciones_activas > 0 
                                                                ? colors.text.disabled 
                                                                : colors.error 
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredColaboradores.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                </StyledTableContainer>

                {/* Diálogos */}
                <ColaboradorForm
                    open={openForm}
                    onClose={handleCloseForm}
                    colaborador={selectedColaborador}
                    onSave={handleSave}
                />

                <ColaboradorDetailDialog
                    open={openDetail}
                    onClose={handleCloseDetail}
                    colaborador={selectedColaboradorDetail}
                    productos={productosAsignados}
                    onRefresh={refreshProductosAsignados}
                    loading={loadingProductos}
                />

                <ConfirmDeleteDialog
                    open={openConfirmDelete}
                    onClose={() => setOpenConfirmDelete(false)}
                    colaborador={selectedColaborador}
                    onConfirm={handleDelete}
                />

                {/* Snackbar */}
                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity}
                        sx={{ borderRadius: 2 }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
            <OfilabFooter />
        </Box>
        </Box>
    );
};

export default ColaboradoresPage;