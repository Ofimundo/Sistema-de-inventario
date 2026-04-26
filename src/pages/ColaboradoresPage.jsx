// src/pages/ColaboradoresPage.jsx
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
    Badge,
    Collapse
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
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
    AssignmentInd as AssignmentIndIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import colaboradorService from '../services/colaboradorService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

// Diálogo de detalle de colaborador
const ColaboradorDetailDialog = ({ open, onClose, colaborador, productos = [], onRefresh, loading }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
        } catch {
            return dateString;
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
                        <Avatar sx={{ bgcolor: colors.primary, width: 56, height: 56 }}>
                            {colaborador.nombre?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {colaborador.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {colaborador.rut} • {colaborador.email}
                            </Typography>
                            <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                Total Asignaciones: {colaborador.total_asignaciones || 0} | 
                                Activas: {colaborador.asignaciones_activas || 0}
                            </Typography>
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
                                        {productos.map((prod) => (
                                            <TableRow key={prod.asignacion_id || prod.id}>
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
        fecha_nacimiento: ''
    });

    const [errores, setErrores] = useState({});
    const [loading, setLoading] = useState(false);

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
                    fecha_nacimiento: colaborador.fecha_nacimiento?.split('T')[0] || ''
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
                    fecha_nacimiento: ''
                });
            }
            setErrores({});
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

        if (!formData.email?.trim()) {
            nuevosErrores.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            nuevosErrores.email = 'Email inválido';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) return;

        setLoading(true);

        try {
            const dataToSend = {
                ...formData,
                rut: formData.rut.replace(/[^0-9kK]/g, '').toUpperCase()
            };

            let response;
            if (colaborador && colaborador.id) {
                response = await colaboradorService.updateColaborador(colaborador.id, dataToSend);
            } else {
                response = await colaboradorService.createColaborador(dataToSend);
            }

            if (response && response.success) {
                onSave(response.data);
                handleClose();
            } else {
                throw new Error(response?.message || 'Error al guardar');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            alert(error.message || 'Error al procesar la solicitud');
        } finally {
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
            fecha_nacimiento: ''
        });
        setErrores({});
        setLoading(false);
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
                <Grid container spacing={2}>
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
                            label="Email *"
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
                    disabled={loading}
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

    // Estados
    const [colaboradores, setColaboradores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState({
        estado: '',
        departamento: ''
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

    // UI
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };

    // Cargar datos iniciales
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [departamentosData, statsData] = await Promise.all([
                colaboradorService.getDepartamentos(),
                colaboradorService.getStats()
            ]);

            setDepartamentos(departamentosData || []);
            setStats(statsData || {
                total_colaboradores: 0,
                activos: 0,
                inactivos: 0,
                total_departamentos: 0,
                total_equipos_asignados: 0
            });

            await fetchData();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    };

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const filterParams = {};
            if (filters.estado) filterParams.estado = filters.estado;
            if (filters.departamento) filterParams.departamento = filters.departamento;
            if (searchTerm) filterParams.search = searchTerm;

            const data = await colaboradorService.getColaboradores(filterParams);
            
            // Debug: Verificar datos recibidos
            console.log('📊 Datos de colaboradores recibidos:', data);
            if (data && data.length > 0) {
                const adan = data.find(c => c.nombre === 'Adan Moris');
                if (adan) {
                    console.log('🔴 ADAN MORIS:', {
                        nombre: adan.nombre,
                        total_asignaciones: adan.total_asignaciones,
                        asignaciones_activas: adan.asignaciones_activas
                    });
                }
            }
            
            setColaboradores(data || []);

            if (showRefresh) {
                showSnackbar('Datos actualizados', 'success');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Función para cargar productos asignados a un colaborador
    const loadProductosAsignados = async (colaboradorId) => {
        setLoadingProductos(true);
        try {
            console.log(`📥 Cargando productos asignados para colaborador ID: ${colaboradorId}`);
            const productos = await colaboradorService.getProductosAsignados(colaboradorId);
            console.log(`✅ Productos asignados encontrados: ${productos.length}`, productos);
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
    };

    // Función para refrescar los productos asignados
    const refreshProductosAsignados = async () => {
        if (selectedColaboradorDetail) {
            console.log('🔄 Refrescando productos asignados...');
            await loadProductosAsignados(selectedColaboradorDetail.id);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, filters.estado, filters.departamento]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilters({
            estado: '',
            departamento: ''
        });
    };

    const handleFilterChange = (field) => (event) => {
        setFilters(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleOpenForm = (colaborador = null) => {
        setSelectedColaborador(colaborador);
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setSelectedColaborador(null);
        setOpenForm(false);
        fetchData();
        fetchInitialData();
    };

    const handleOpenDetail = async (colaborador) => {
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
    };

    const handleCloseDetail = () => {
        setSelectedColaboradorDetail(null);
        setProductosAsignados([]);
        setOpenDetail(false);
    };

    const handleDelete = async () => {
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
        }
    };

    const handleSave = async (colaboradorData) => {
        handleCloseForm();
        showSnackbar(
            selectedColaborador ? 'Colaborador actualizado' : 'Colaborador creado',
            'success'
        );
        await fetchData();
        await fetchInitialData();
    };

    const handleRefresh = () => {
        fetchData(true);
        fetchInitialData();
        if (selectedColaboradorDetail) {
            loadProductosAsignados(selectedColaboradorDetail.id);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Filtrado local
    const filteredColaboradores = colaboradores.filter(col => {
        if (filters.estado && col.estado !== filters.estado) return false;
        if (filters.departamento && col.departamento !== filters.departamento) return false;
        return true;
    });

    const paginatedColaboradores = filteredColaboradores.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

    // Calcular estadísticas reales
    const totalAsignaciones = colaboradores.reduce((sum, col) => sum + (col.total_asignaciones || 0), 0);
    const totalAsignacionesActivas = colaboradores.reduce((sum, col) => sum + (col.asignaciones_activas || 0), 0);

    console.log(`📊 Total de asignaciones en la lista: ${totalAsignaciones}, Activas: ${totalAsignacionesActivas}`);

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar 
                position="static" 
                elevation={0}
                sx={{ 
                    bgcolor: colors.surface, 
                    color: colors.text.primary,
                    borderBottom: `1px solid ${colors.border}`
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleGoHome}
                        sx={{ mr: 2 }}
                    >
                        <HomeIcon />
                    </IconButton>
                    <PersonIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Gestión de Colaboradores
                    </Typography>
                    <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                    </IconButton>
                </Toolbar>
            </AppBar>

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

                {/* Stats Cards */}
                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
                                    {loading ? <CircularProgress size={24} /> : colaboradores.length}
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
                                    {loading ? <CircularProgress size={24} /> : totalAsignacionesActivas}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Equipos Asignados
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
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
                                startIcon={showAdvancedFilters ? <FilterListOffIcon /> : <FilterListIcon />}
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
                                disabled={!searchTerm && activeFiltersCount === 0}
                            >
                                Limpiar filtros
                            </Button>
                        </Grid>
                    </Grid>

                    <Collapse in={showAdvancedFilters}>
                        <Box sx={{ mt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Estado</InputLabel>
                                        <Select
                                            value={filters.estado}
                                            onChange={handleFilterChange('estado')}
                                            label="Estado"
                                        >
                                            <MenuItem value="">Todos</MenuItem>
                                            <MenuItem value="ACTIVO">Activos</MenuItem>
                                            <MenuItem value="INACTIVO">Inactivos</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Departamento</InputLabel>
                                        <Select
                                            value={filters.departamento}
                                            onChange={handleFilterChange('departamento')}
                                            label="Departamento"
                                        >
                                            <MenuItem value="">Todos</MenuItem>
                                            {departamentos.map((depto) => (
                                                <MenuItem key={depto} value={depto}>{depto}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </FilterPaper>

                {/* Tabla de colaboradores */}
                <StyledTableContainer>
                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Colaborador</StyledTableCell>
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Cargando colaboradores...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedColaboradores.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No hay colaboradores
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenForm()}
                                        >
                                            Crear Colaborador
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedColaboradores.map((col) => (
                                    <TableRow key={col.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar sx={{ bgcolor: colors.primary, width: 40, height: 40 }}>
                                                    {col.nombre?.charAt(0) || 'U'}
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
                                        
                                        {/* COLUMNA DE ASIGNACIONES CORREGIDA - Usando total_asignaciones y asignaciones_activas directamente */}
                                        <TableCell align="center">
                                            <Box sx={{ textAlign: 'center' }}>
                                                {/* Número grande de asignaciones activas */}
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
                                                
                                                {/* Mostrar un chip si tiene asignaciones activas */}
                                                {col.asignaciones_activas > 0 && (
                                                    <Chip 
                                                        size="small" 
                                                        label={`${col.asignaciones_activas} producto(s) asignado(s)`}
                                                        color="success" 
                                                        variant="outlined"
                                                        sx={{ mt: 0.5, fontSize: '0.65rem', height: '20px' }}
                                                    />
                                                )}
                                                
                                                {/* Si no tiene asignaciones activas pero tiene históricas */}
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
        </Box>
    );
};

export default ColaboradoresPage;