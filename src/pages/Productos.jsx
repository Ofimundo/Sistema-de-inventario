// src/pages/Productos.jsx - VERSIÓN CORREGIDA (solo cambios en la detección de préstamos)
import React, { useState, useEffect, useCallback } from 'react';
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
    FormHelperText,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    Drawer,
    Badge,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Autocomplete,
    Checkbox,
    Switch
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Assignment as AssignmentIcon,
    Search as SearchIcon,
    Inventory as InventoryIcon,
    Close as CloseIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Build as BuildIcon,
    Handyman as HandymanIcon,
    DeleteForever as DeleteForeverIcon,
    AttachMoney as AttachMoneyIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Error as ErrorIcon,
    Image as ImageIcon,
    VolunteerActivism as VolunteerActivismIcon,
    History as HistoryIcon,
    CalendarToday as CalendarTodayIcon,
    AssignmentInd as AssignmentIndIcon,
    Home as HomeIcon,
    FilterList as FilterListIcon,
    FilterListOff as FilterListOffIcon,
    Download as DownloadIcon,
    Store as StoreIcon,
    ExpandMore as ExpandMoreIcon,
    QrCode as QrCodeIcon,
    Science as ScienceIcon,
    Clear as ClearIcon,
    Category as CategoryIcon,
    LocalOffer as LocalOfferIcon,
    ReceiptLong as ReceiptLongIcon,
    CheckCircle as CheckCircleIcon,
    RemoveCircleOutline as RemoveCircleOutlineIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Warehouse as WarehouseIcon,
    People as PeopleIcon,
    Description as DescriptionIcon,
    Inventory2 as Inventory2Icon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productosService } from '../services/productos';
import colaboradorService from '../services/colaboradorService';
import { exportService } from '../services/exportService';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

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
    laboratory: '#8B5CF6',
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

const FilterTabContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    marginBottom: theme.spacing(3),
    borderRadius: 12,
    backgroundColor: alpha(colors.primary, 0.03),
    border: `1px solid ${alpha(colors.primary, 0.1)}`,
}));

const FilterBadge = styled(Chip)(({ theme, active }) => ({
    borderRadius: 20,
    padding: '8px 16px',
    backgroundColor: active ? colors.primary : 'transparent',
    color: active ? 'white' : colors.text.primary,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    '&:hover': {
        backgroundColor: active ? colors.primary : alpha(colors.primary, 0.05),
        transform: 'translateY(-2px)',
        transition: 'transform 0.2s',
    },
    cursor: 'pointer',
}));

const FilterSection = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(colors.primary, 0.03),
    borderRadius: 12,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    border: `1px solid ${alpha(colors.primary, 0.1)}`,
}));

const FilterChipContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: alpha(colors.background, 0.5),
    borderRadius: 8,
}));

const SearchContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: 'white',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

const HistorialContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: alpha(colors.background, 0.7),
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    maxHeight: '500px',
    overflowY: 'auto'
}));

const TimelineItem = styled(Box)(({ theme }) => ({
    position: 'relative',
    paddingLeft: 30,
    paddingBottom: 24,
    '&:before': {
        content: '""',
        position: 'absolute',
        left: 6,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: alpha(colors.primary, 0.2)
    },
    '&:last-child:before': {
        display: 'none'
    }
}));

const TimelineDot = styled(Box)(({ theme, color = colors.primary }) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: color,
    border: `2px solid ${alpha(color, 0.3)}`,
    zIndex: 1
}));

const CATEGORIAS_QR_PERMITIDAS = [
    'notebook',
    'audifono', 'audífono', 'audifonos', 'audífonos', 'headset', 'headphone',
    'mouse', 'raton', 'ratón',
    'celular', 'smartphone', 'telefono', 'teléfono', 'móvil', 'movil',
    'teclado', 'keyboard',
    'online', 'onlione', 'ups',
    'all in one', 'all-in-one', 'allinone', 'aio'
];

const esAptoParaQR = (producto) => {
    if (!producto) return false;
    if (producto.es_granel) return false;
    const nombre = (producto.nombre || '').toLowerCase();
    const categoria = (producto.categoria || producto.tipo || '').toLowerCase();
    const descripcion = (producto.descripcion || '').toLowerCase();

    return CATEGORIAS_QR_PERMITIDAS.some(cat => 
        nombre.includes(cat) || categoria.includes(cat) || descripcion.includes(cat)
    );
};

// ============================================
// MODAL DE CÓDIGO QR PARA PRODUCTOS PERMITIDOS
// ============================================
function ProductoQRModal({ open, onClose, producto }) {
    if (!producto) return null;

    const colaboradorNombre = producto.colaborador_asignado?.nombre 
        ? `${producto.colaborador_asignado.nombre} ${producto.colaborador_asignado.apellido || ''}`.trim()
        : (producto.colaborador_nombre ? `${producto.colaborador_nombre} ${producto.colaborador_apellido || ''}`.trim() : 'Sin Asignar (En Bodega)');

    // URL que redirige automáticamente a la descarga del PDF de la Ficha Técnica protegida por contraseña (Ofilab2026*)
    const qrDataText = `${window.location.origin}/qr-info?serie=${encodeURIComponent(producto.numero_serie || '')}&id=${producto.id}`;

    const handleDescargarQR = () => {
        const svgElement = document.getElementById('qr-code-svg-element')?.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = 400;
            canvas.height = 400;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, 400, 400);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${producto.numero_serie || producto.id}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', py: 1.5, px: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <QrCodeIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={700}>
                            Código QR del Equipo
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 2, px: 2, textAlign: 'center' }}>
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1.5, 
                        bgcolor: '#F9FAFB', 
                        border: '1.5px solid #E5E7EB', 
                        borderRadius: '12px',
                        display: 'inline-block',
                        mx: 'auto',
                        mb: 0.5
                    }}
                >
                    <Box id="qr-code-svg-element" sx={{ display: 'flex', justifyContent: 'center', p: 1, bgcolor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <QRCodeSVG 
                            value={qrDataText} 
                            size={145}
                            level="M"
                            includeMargin={true}
                        />
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1, color: '#111827', fontSize: '0.85rem' }}>
                        {producto.nombre}
                    </Typography>

                    <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: 'block', fontSize: '0.75rem' }}>
                        N° Serie: {producto.numero_serie || 'N/A'}
                    </Typography>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ py: 1.5, px: 2, gap: 1, justifyContent: 'space-between' }}>
                <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ fontSize: '0.75rem' }}>
                    Cerrar
                </Button>
                <Button 
                    onClick={handleDescargarQR} 
                    variant="contained" 
                    color="primary"
                    size="small"
                    startIcon={<DownloadIcon fontSize="small" />}
                    sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' } }}
                >
                    Descargar QR
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// COMPONENTE DE FILTROS VISUALES
// ============================================
function VisualFilters({ filterType, onFilterChange, counts }) {
    const filters = [
        { id: 'todos', label: 'Todos', icon: <InventoryIcon fontSize="small" />, color: colors.primary, count: counts.todos },
        { id: 'disponibles', label: 'Disponibles', icon: <CheckCircleIcon fontSize="small" />, color: colors.success, count: counts.disponibles },
        { id: 'asignados', label: 'Asignados', icon: <AssignmentIndIcon fontSize="small" />, color: colors.info, count: counts.asignados },
        { id: 'prestamos', label: 'Préstamos', icon: <ReceiptLongIcon fontSize="small" />, color: colors.warning, count: counts.prestamos },
        { id: 'qr', label: 'Equipos con QR', icon: <QrCodeIcon fontSize="small" />, color: '#7C3AED', count: counts.qr },
    ];

    return (
        <FilterTabContainer>
            <Grid container spacing={1}>
                {filters.map((filter) => (
                    <Grid item key={filter.id}>
                        <FilterBadge
                            icon={filter.icon}
                            label={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {filter.label}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={filter.count}
                                        sx={{
                                            height: 20,
                                            fontSize: '0.7rem',
                                            backgroundColor: filterType === filter.id ? 'white' : alpha(filter.color, 0.1),
                                            color: filterType === filter.id ? filter.color : filter.color,
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                            }
                            active={filterType === filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            sx={{
                                backgroundColor: filterType === filter.id ? filter.color : 'transparent',
                                borderColor: filterType === filter.id ? filter.color : colors.border,
                                '&:hover': {
                                    backgroundColor: filterType === filter.id ? filter.color : alpha(filter.color, 0.05),
                                }
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
        </FilterTabContainer>
    );
}

// ============================================
// COMPONENTE DE FILTROS AVANZADOS
// ============================================
function AdvancedFilters({ filters, onFilterChange, onClearFilters, marcas, estados, bodegas, condiciones, activeFiltersCount, searchTerm, onSearchChange, onClearSearch }) {
    const [selectedMarcas, setSelectedMarcas] = useState([]);
    const [selectedEstados, setSelectedEstados] = useState([]);
    const [selectedCondiciones, setSelectedCondiciones] = useState([]);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    useEffect(() => {
        setSelectedMarcas(filters.marcas || []);
    }, [filters.marcas]);

    useEffect(() => {
        setSelectedEstados(filters.estados || []);
    }, [filters.estados]);

    useEffect(() => {
        setSelectedCondiciones(filters.condiciones || []);
    }, [filters.condiciones]);

    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    const handleMarcaToggle = (marca) => {
        const newSelected = selectedMarcas.includes(marca)
            ? selectedMarcas.filter(m => m !== marca)
            : [...selectedMarcas, marca];
        setSelectedMarcas(newSelected);
        onFilterChange('marcas', newSelected);
    };

    const handleEstadoToggle = (estadoNombre) => {
        const newSelected = selectedEstados.includes(estadoNombre)
            ? selectedEstados.filter(e => e !== estadoNombre)
            : [...selectedEstados, estadoNombre];
        setSelectedEstados(newSelected);
        onFilterChange('estados', newSelected);
    };

    const handleCondicionToggle = (condicion) => {
        const newSelected = selectedCondiciones.includes(condicion)
            ? selectedCondiciones.filter(c => c !== condicion)
            : [...selectedCondiciones, condicion];
        setSelectedCondiciones(newSelected);
        onFilterChange('condiciones', newSelected);
    };

    const handleSearch = () => {
        onSearchChange(localSearchTerm);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearSearch = () => {
        setLocalSearchTerm('');
        onClearSearch();
    };

    const estadoNombres = estados.map(e => typeof e === 'string' ? e : e.nombre);

    return (
        <Box sx={{ mt: 3 }}>
            <SearchContainer>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <TextField
                        fullWidth
                        placeholder="🔍 Buscar por nombre, marca, modelo, serie o colaborador..."
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.primary }} /></InputAdornment>,
                            endAdornment: localSearchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={handleClearSearch}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                        sx={{ flex: 1, minWidth: 200 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        startIcon={<SearchIcon />}
                        sx={{
                            backgroundColor: colors.primary,
                            '&:hover': { backgroundColor: colors.primary, opacity: 0.9 },
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Buscar
                    </Button>
                </Box>
                
                {searchTerm && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Búsqueda activa:
                        </Typography>
                        <Chip
                            size="small"
                            label={`"${searchTerm}"`}
                            onDelete={handleClearSearch}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                )}
            </SearchContainer>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <FilterSection>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <CategoryIcon sx={{ color: colors.primary }} />
                            <Typography variant="subtitle2" fontWeight={600}>
                                Marcas
                            </Typography>
                            {selectedMarcas.length > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${selectedMarcas.length} seleccionadas`} 
                                    onDelete={() => handleMarcaToggle(selectedMarcas[0])}
                                    deleteIcon={<ClearIcon />}
                                />
                            )}
                        </Box>
                        <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                            <Grid container spacing={1}>
                                {marcas && marcas.length > 0 ? marcas.slice(0, 15).map((marca) => (
                                    <Grid item xs={6} sm={4} key={marca}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedMarcas.includes(marca)}
                                                    onChange={() => handleMarcaToggle(marca)}
                                                    sx={{ color: colors.primary }}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" noWrap>
                                                    {marca}
                                                </Typography>
                                            }
                                        />
                                    </Grid>
                                )) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                                        No hay marcas registradas
                                    </Typography>
                                )}
                            </Grid>
                        </Box>
                        {marcas && marcas.length > 15 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                +{marcas.length - 15} marcas más
                            </Typography>
                        )}
                    </FilterSection>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FilterSection>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <LocalOfferIcon sx={{ color: colors.primary }} />
                            <Typography variant="subtitle2" fontWeight={600}>
                                Estados del Producto
                            </Typography>
                            {selectedEstados.length > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${selectedEstados.length} seleccionados`} 
                                    onDelete={() => handleEstadoToggle(selectedEstados[0])}
                                    deleteIcon={<ClearIcon />}
                                />
                            )}
                        </Box>
                        <Grid container spacing={1}>
                            {estadoNombres.map((estadoNombre) => (
                                <Grid item xs={6} key={estadoNombre}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={selectedEstados.includes(estadoNombre)}
                                                onChange={() => handleEstadoToggle(estadoNombre)}
                                                sx={{ color: colors.primary }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                {estadoNombre}
                                            </Typography>
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </FilterSection>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FilterSection>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <CategoryIcon sx={{ color: colors.primary }} />
                            <Typography variant="subtitle2" fontWeight={600}>
                                Condiciones
                            </Typography>
                            {selectedCondiciones.length > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${selectedCondiciones.length} seleccionadas`} 
                                    onDelete={() => handleCondicionToggle(selectedCondiciones[0])}
                                    deleteIcon={<ClearIcon />}
                                />
                            )}
                        </Box>
                        <Grid container spacing={1}>
                            {condiciones.map((condicion) => (
                                <Grid item xs={6} key={condicion}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={selectedCondiciones.includes(condicion)}
                                                onChange={() => handleCondicionToggle(condicion)}
                                                sx={{ color: colors.primary }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                {condicion === 'NUEVO' ? 'Nuevo' : condicion === 'USADO' ? 'Usado' : 'Reacondicionado'}
                                            </Typography>
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </FilterSection>
                </Grid>

                <Grid item xs={12} md={4}>
                    <FilterSection>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <StoreIcon sx={{ color: colors.primary }} />
                            <Typography variant="subtitle2" fontWeight={600}>
                                Bodegas
                            </Typography>
                        </Box>
                        <FormControl fullWidth size="small">
                            <Select
                                value={filters.bodega_id || ''}
                                onChange={(e) => onFilterChange('bodega_id', e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="">Todas las bodegas</MenuItem>
                                {bodegas && bodegas.map((bodega) => (
                                    <MenuItem key={bodega.id} value={bodega.id}>
                                        {bodega.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </FilterSection>
                </Grid>
            </Grid>

            {(selectedMarcas.length > 0 || selectedEstados.length > 0 || selectedCondiciones.length > 0 || filters.bodega_id) && (
                <FilterChipContainer>
                    <Typography variant="body2" fontWeight={500} sx={{ mr: 1 }}>
                        Filtros activos:
                    </Typography>
                    {selectedMarcas.map((marca) => (
                        <Chip 
                            key={`marca-${marca}`} 
                            size="small" 
                            label={`Marca: ${marca}`} 
                            onDelete={() => handleMarcaToggle(marca)} 
                            variant="outlined" 
                        />
                    ))}
                    {selectedEstados.map((estado) => (
                        <Chip 
                            key={`estado-${estado}`} 
                            size="small" 
                            label={`Estado: ${estado}`} 
                            onDelete={() => handleEstadoToggle(estado)} 
                            variant="outlined" 
                        />
                    ))}
                    {selectedCondiciones.map((condicion) => (
                        <Chip 
                            key={`condicion-${condicion}`} 
                            size="small" 
                            label={`Condición: ${condicion === 'NUEVO' ? 'Nuevo' : condicion === 'USADO' ? 'Usado' : 'Reacondicionado'}`} 
                            onDelete={() => handleCondicionToggle(condicion)} 
                            variant="outlined" 
                        />
                    ))}
                    {filters.bodega_id && bodegas && (
                        <Chip 
                            size="small" 
                            label={`Bodega: ${bodegas.find(b => b.id === filters.bodega_id)?.nombre || ''}`} 
                            onDelete={() => onFilterChange('bodega_id', '')} 
                            variant="outlined" 
                        />
                    )}
                    <Button 
                        size="small" 
                        color="error" 
                        onClick={onClearFilters} 
                        startIcon={<FilterListOffIcon />} 
                        sx={{ ml: 1 }}
                    >
                        Limpiar todos
                    </Button>
                </FilterChipContainer>
            )}
        </Box>
    );
}

// ============================================
// COMPONENTE PARA MOSTRAR HISTORIAL DE USO / ASIGNACIONES
// ============================================
function HistorialUsoRender({ historial = [] }) {
    if (!historial || historial.length === 0) {
        return (
            <Box textAlign="center" py={3}>
                <PersonIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography color="text.secondary">No hay historial de uso o asignaciones registradas</Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {historial.map((item, idx) => {
                const nombrePersona = item.colaborador_nombre || item.nombre || item.colaborador || item.nombre_persona || 'Colaborador';
                const fechaAsig = item.fecha_asignacion || item.fecha_inicio || item.fecha_registro;
                const fechaDev = item.fecha_devolucion || item.fecha_fin;
                const esActivo = !fechaDev;
                const esPrestamo = item.es_prestamo === 1;

                const fechaAsigFormateada = fechaAsig && !isNaN(new Date(fechaAsig).getTime())
                    ? new Date(fechaAsig).toLocaleDateString('es-CL')
                    : 'Sin fecha de asignación';

                const fechaDevFormateada = fechaDev && !isNaN(new Date(fechaDev).getTime())
                    ? new Date(fechaDev).toLocaleDateString('es-CL')
                    : (esActivo ? 'En uso actual' : 'Devuelto');

                return (
                    <ListItem key={item.id || idx} divider alignItems="flex-start" sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                            <Avatar sx={{ 
                                bgcolor: esActivo ? alpha(colors.primary, 0.1) : alpha(colors.text.disabled, 0.1),
                                color: esActivo ? colors.primary : colors.text.secondary
                            }}>
                                <PersonIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {nombrePersona}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={esActivo ? (esPrestamo ? 'PRÉSTAMO ACTIVO' : 'ASIGNADO') : 'DEVUELTO / FINALIZADO'}
                                        sx={{ 
                                            backgroundColor: esActivo ? (esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1)) : alpha(colors.text.disabled, 0.1),
                                            color: esActivo ? (esPrestamo ? colors.warning : colors.primary) : colors.text.secondary,
                                            height: 20,
                                            fontSize: '0.7rem',
                                            fontWeight: 700
                                        }}
                                    />
                                </Box>
                            }
                            secondary={
                                <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        📅 Asignado: <strong>{fechaAsigFormateada}</strong> — 
                                        {esActivo ? ' 🟢 En uso activo' : ` Devuelto: ${fechaDevFormateada}`}
                                    </Typography>
                                    {item.motivo && (
                                        <Typography variant="caption" color="text.secondary">
                                            Motivo: {item.motivo}
                                        </Typography>
                                    )}
                                    {item.observaciones && (
                                        <Typography variant="caption" color="text.secondary">
                                            Observaciones: {item.observaciones}
                                        </Typography>
                                    )}
                                </Stack>
                            }
                        />
                    </ListItem>
                );
            })}
        </List>
    );
}

// ============================================
// COMPONENTE PARA MOSTRAR HISTORIAL DE MANTENCIONES
// ============================================
function HistorialMantenciones({ mantenciones = [] }) {
    if (!mantenciones || mantenciones.length === 0) {
        return (
            <Box textAlign="center" py={2}>
                <BuildIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                <Typography color="text.secondary">No hay mantenciones registradas</Typography>
            </Box>
        );
    }

    return (
        <List>
            {mantenciones.map((mant, idx) => (
                <ListItem key={idx} divider alignItems="flex-start">
                    <ListItemAvatar>
                        <Avatar sx={{ 
                            bgcolor: mant.fecha_fin ? alpha(colors.success, 0.1) : alpha(colors.warning, 0.1),
                            color: mant.fecha_fin ? colors.success : colors.warning
                        }}>
                            {mant.tipo === 'RUTINA' ? <BuildIcon /> : <HandymanIcon />}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="subtitle2">
                                    {mant.tipo === 'RUTINA' ? 'Mantención de Rutina' : 'Reparación'}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={mant.fecha_fin ? 'COMPLETADA' : 'EN PROGRESO'}
                                    sx={{
                                        backgroundColor: mant.fecha_fin ? alpha(colors.success, 0.1) : alpha(colors.warning, 0.1),
                                        color: mant.fecha_fin ? colors.success : colors.warning,
                                        height: 20
                                    }}
                                />
                            </Box>
                        }
                        secondary={
                            <>
                                <Typography variant="caption" display="block">
                                    Inicio: {new Date(mant.fecha_inicio).toLocaleDateString('es-CL')} 
                                    {mant.fecha_fin && ` - Término: ${new Date(mant.fecha_fin).toLocaleDateString('es-CL')}`}
                                    {!mant.fecha_fin && ' - En curso'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Responsable: {mant.responsable}
                                </Typography>
                                {mant.costo > 0 && (
                                    <Typography variant="caption" display="block" color="success.main">
                                        Costo: ${mant.costo.toLocaleString('es-CL')}
                                    </Typography>
                                )}
                                {mant.descripcion && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {mant.descripcion}
                                    </Typography>
                                )}
                            </>
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
}

// ============================================
// DIÁLOGO DE HISTORIAL DE USO
// ============================================
function HistorialUsoDialog({ open, onClose, producto, historial = [] }) {
    const [tabValue, setTabValue] = useState(0);
    
    if (!producto) return null;

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
            return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
        } catch {
            return dateString;
        }
    };

    const getDuration = (inicio, fin) => {
        if (!inicio || !fin) return null;
        try {
            const days = differenceInDays(new Date(fin), new Date(inicio));
            if (days === 0) return 'Menos de 1 día';
            if (days === 1) return '1 día';
            return `${days} días`;
        } catch {
            return null;
        }
    };

    const historialOrdenado = [...historial].sort((a, b) => {
        return new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion);
    });

    const historialActivo = historialOrdenado.filter(h => !h.fecha_devolucion);
    const historialCompletado = historialOrdenado.filter(h => h.fecha_devolucion);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <HistoryIcon sx={{ color: colors.primary }} />
                        <Typography variant="h6">
                            Historial de Uso - {producto.nombre}
                        </Typography>
                    </Box>
                    <Chip
                        label={producto.condicion || 'NUEVO'}
                        size="small"
                        sx={{ 
                            backgroundColor: alpha(colors.info, 0.1),
                            color: colors.info,
                            fontWeight: 500
                        }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Serie: {producto.numero_serie || 'N/A'} | ID: {producto.id}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab 
                            label={
                                <Badge badgeContent={historialActivo.length} color="info">
                                    Historial Completo
                                </Badge>
                            } 
                        />
                        <Tab label="Resumen" />
                    </Tabs>
                </Box>

                {tabValue === 0 ? (
                    <HistorialContainer>
                        {historialOrdenado.length === 0 ? (
                            <Box textAlign="center" py={4}>
                                <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                <Typography color="text.secondary">
                                    No hay registros de uso para este producto
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {historialOrdenado.map((registro, index) => (
                                    <TimelineItem key={registro.id || index}>
                                        <TimelineDot color={!registro.fecha_devolucion ? colors.success : colors.primary} />
                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <Chip
                                                    size="small"
                                                    label={!registro.fecha_devolucion ? 'Activo' : 'Completado'}
                                                    sx={{
                                                        backgroundColor: !registro.fecha_devolucion ? 
                                                            alpha(colors.success, 0.1) : alpha(colors.info, 0.1),
                                                        color: !registro.fecha_devolucion ? 
                                                            colors.success : colors.info
                                                    }}
                                                />
                                                {registro.estado && (
                                                    <Chip
                                                        size="small"
                                                        label={registro.estado}
                                                        sx={{ backgroundColor: alpha(colors.primary, 0.1) }}
                                                    />
                                                )}
                                            </Box>

                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                            Usuario
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={500}>
                                                            {registro.nombre_usuario || registro.nombre_persona || registro.colaborador_nombre || 'No especificado'}
                                                        </Typography>
                                                        {registro.email && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {registro.email}
                                                            </Typography>
                                                        )}
                                                    </Grid>

                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                            Fechas
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Asignación: {formatDateTime(registro.fecha_asignacion)}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Devolución: {registro.fecha_devolucion ? formatDateTime(registro.fecha_devolucion) : 'Pendiente'}
                                                        </Typography>
                                                        {registro.fecha_devolucion && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Duración: {getDuration(registro.fecha_asignacion, registro.fecha_devolucion)}
                                                            </Typography>
                                                        )}
                                                    </Grid>

                                                    {registro.condicion_entrega && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Condición de entrega
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {registro.condicion_entrega}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {registro.observaciones && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Observaciones
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {registro.observaciones}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {registro.motivo && (
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                Motivo
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {registro.motivo}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </Paper>
                                        </Box>
                                    </TimelineItem>
                                ))}
                            </Box>
                        )}
                    </HistorialContainer>
                ) : (
                    <HistorialContainer>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: alpha(colors.info, 0.05) }}>
                                    <Badge
                                        badgeContent={historialActivo.length}
                                        color="info"
                                        sx={{ '& .MuiBadge-badge': { fontSize: 12 } }}
                                    >
                                        <AssignmentIndIcon sx={{ fontSize: 40, color: colors.info }} />
                                    </Badge>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        {historialActivo.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Asignaciones Activas
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: alpha(colors.success, 0.05) }}>
                                    <Badge
                                        badgeContent={historialCompletado.length}
                                        color="success"
                                        sx={{ '& .MuiBadge-badge': { fontSize: 12 } }}
                                    >
                                        <HistoryIcon sx={{ fontSize: 40, color: colors.success }} />
                                    </Badge>
                                    <Typography variant="h6" sx={{ mt: 2 }}>
                                        {historialCompletado.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Asignaciones Completadas
                                    </Typography>
                                </Paper>
                            </Grid>

                            {historialCompletado.length > 0 && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        Últimas asignaciones
                                    </Typography>
                                    <List>
                                        {historialCompletado.slice(0, 3).map((reg, idx) => (
                                            <ListItem key={idx} divider>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1) }}>
                                                        <PersonIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={reg.nombre_usuario || reg.nombre_persona || reg.colaborador_nombre}
                                                    secondary={
                                                        <>
                                                            <Typography component="span" variant="body2" color="text.primary">
                                                                {formatDate(reg.fecha_asignacion)} → {formatDate(reg.fecha_devolucion)}
                                                            </Typography>
                                                            {reg.condicion_entrega && (
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                    Condición: {reg.condicion_entrega}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}
                        </Grid>
                    </HistorialContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE DISPOSICIÓN (BAJA/DONACIÓN/LABORATORIO)
// ============================================
function DisposicionDialog({ open, onClose, producto, onSuccess }) {
    const [tipo, setTipo] = useState('BAJA');
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [autorizadoPor, setAutorizadoPor] = useState('');
    const [institucion, setInstitucion] = useState('');
    const [direccion, setDireccion] = useState('');
    const [recibe, setRecibe] = useState('');
    const [documento, setDocumento] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [laboratorioNombre, setLaboratorioNombre] = useState('');
    const [laboratorioContacto, setLaboratorioContacto] = useState('');

    useEffect(() => {
        if (open) {
            setTipo('BAJA');
            setMotivo('');
            setDescripcion('');
            setObservaciones('');
            setAutorizadoPor('');
            setInstitucion('');
            setDireccion('');
            setRecibe('');
            setDocumento(null);
            setError('');
            setLaboratorioNombre('');
            setLaboratorioContacto('');
        }
    }, [open, producto]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setDocumento(file);
        }
    };

    const handleSubmit = async () => {
        if (tipo === 'BAJA') {
            if (!motivo?.trim()) {
                setError('Debe ingresar un motivo de baja');
                return;
            }
            if (!autorizadoPor?.trim()) {
                setError('Debe ingresar quién autoriza la baja');
                return;
            }
        } else if (tipo === 'DONACION') {
            if (!institucion?.trim()) {
                setError('Debe ingresar la institución/beneficiario');
                return;
            }
            if (!direccion?.trim()) {
                setError('Debe ingresar la dirección');
                return;
            }
        } else if (tipo === 'LABORATORIO') {
            if (!laboratorioNombre?.trim()) {
                setError('Debe ingresar el nombre del laboratorio');
                return;
            }
            if (!autorizadoPor?.trim()) {
                setError('Debe ingresar quién autoriza la salida a laboratorio');
                return;
            }
        }

        if (!producto || !producto.id) {
            setError('No hay producto seleccionado');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('producto_id', String(producto.id));
            
            let response;
            
            if (tipo === 'BAJA') {
                formData.append('motivo_baja', motivo.trim());
                formData.append('autorizado_por', autorizadoPor.trim());
                
                if (descripcion?.trim()) {
                    formData.append('observaciones', descripcion.trim());
                }
                
                if (documento) {
                    formData.append('documento_autorizacion', documento);
                }
                
                response = await productosService.registrarBaja(formData);
                
            } else if (tipo === 'DONACION') {
                formData.append('beneficiario', institucion.trim());
                formData.append('direccion', direccion.trim());
                
                let observacionesStr = '';
                if (recibe?.trim()) observacionesStr += `Recibe: ${recibe.trim()}. `;
                if (motivo?.trim()) observacionesStr += `Motivo: ${motivo.trim()}. `;
                if (descripcion?.trim()) observacionesStr += descripcion.trim();
                
                formData.append('observaciones', observacionesStr.trim() || 'Sin observaciones');
                
                if (documento) {
                    formData.append('documento_firmado', documento);
                }
                
                response = await productosService.registrarDonacion(formData);
            } else if (tipo === 'LABORATORIO') {
                formData.append('tipo_disposicion', 'LABORATORIO');
                formData.append('laboratorio_nombre', laboratorioNombre.trim());
                formData.append('autorizado_por', autorizadoPor.trim());
                formData.append('motivo', motivo.trim() || 'Envío a laboratorio para análisis');
                if (laboratorioContacto?.trim()) formData.append('contacto', laboratorioContacto.trim());
                if (descripcion?.trim()) formData.append('descripcion', descripcion.trim());
                if (observaciones?.trim()) formData.append('observaciones', observaciones.trim());
                if (documento) formData.append('documento_respaldo', documento);
                response = await productosService.registrarLaboratorio(formData);
            }
            
            if (response && response.success) {
                let mensaje = '';
                if (tipo === 'BAJA') {
                    mensaje = `Baja registrada para ${producto.nombre}`;
                } else if (tipo === 'DONACION') {
                    mensaje = `Donación registrada para ${producto.nombre}`;
                } else {
                    mensaje = `Producto enviado a laboratorio: ${laboratorioNombre}`;
                }
                
                onSuccess(mensaje);
                onClose();
            } else {
                throw new Error(response?.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setError(error.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!producto) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogContent>
                    <Alert severity="warning">No hay producto seleccionado</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    {tipo === 'BAJA' ? (
                        <DeleteForeverIcon sx={{ color: colors.error }} />
                    ) : tipo === 'DONACION' ? (
                        <VolunteerActivismIcon sx={{ color: colors.success }} />
                    ) : (
                        <ScienceIcon sx={{ color: colors.laboratory }} />
                    )}
                    <Typography variant="h6">
                        {tipo === 'BAJA' ? 'Registrar Baja de Producto' : tipo === 'DONACION' ? 'Registrar Donación de Producto' : 'Enviar Producto a Laboratorio'}
                    </Typography>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.primary, 0.02) }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Producto: {producto.nombre} (ID: {producto.id})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Serie: {producto.numero_serie || 'N/A'} | Condición: {producto.condicion || 'NUEVO'}
                        </Typography>
                    </Paper>

                    <FormControl component="fieldset">
                        <FormLabel>Tipo de disposición</FormLabel>
                        <RadioGroup row value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <FormControlLabel value="BAJA" control={<Radio />} label="Baja" />
                            <FormControlLabel value="DONACION" control={<Radio />} label="Donación" />
                            <FormControlLabel 
                                value="LABORATORIO" 
                                control={<Radio />} 
                                label={
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <ScienceIcon fontSize="small" />
                                        <span>Laboratorio</span>
                                    </Box>
                                } 
                            />
                        </RadioGroup>
                    </FormControl>

                    {tipo === 'BAJA' ? (
                        <>
                            <TextField
                                fullWidth
                                label="Motivo de baja *"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                error={!!error && !motivo}
                                helperText={error && !motivo ? 'Requerido' : ''}
                                placeholder="Ej: Obsoleto, Dañado, Robo..."
                            />

                            <TextField
                                fullWidth
                                label="Autorizado por *"
                                value={autorizadoPor}
                                onChange={(e) => setAutorizadoPor(e.target.value)}
                                error={!!error && !autorizadoPor}
                                helperText={error && !autorizadoPor ? 'Requerido' : ''}
                                placeholder="Nombre de quien autoriza"
                            />

                            <TextField
                                fullWidth
                                label="Descripción"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Detalles adicionales..."
                            />

                            <TextField
                                fullWidth
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Observaciones adicionales..."
                            />
                        </>
                    ) : tipo === 'DONACION' ? (
                        <>
                            <TextField
                                fullWidth
                                label="Institución/Beneficiario *"
                                value={institucion}
                                onChange={(e) => setInstitucion(e.target.value)}
                                error={!!error && !institucion}
                                helperText={error && !institucion ? 'Requerido' : ''}
                                placeholder="Nombre de la institución que recibe"
                            />

                            <TextField
                                fullWidth
                                label="Dirección *"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                error={!!error && !direccion}
                                helperText={error && !direccion ? 'Requerido' : ''}
                                placeholder="Dirección completa"
                            />

                            <TextField
                                fullWidth
                                label="Persona que recibe"
                                value={recibe}
                                onChange={(e) => setRecibe(e.target.value)}
                                placeholder="Nombre de quien recibe (opcional)"
                            />

                            <TextField
                                fullWidth
                                label="Motivo/Descripción"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Motivo de la donación o detalles adicionales..."
                            />
                        </>
                    ) : (
                        <>
                            <Alert severity="info" icon={<ScienceIcon />}>
                                El producto será enviado a laboratorio para análisis. El estado cambiará a "EN LABORATORIO".
                            </Alert>

                            <TextField
                                fullWidth
                                label="Nombre del Laboratorio *"
                                value={laboratorioNombre}
                                onChange={(e) => setLaboratorioNombre(e.target.value)}
                                error={!!error && !laboratorioNombre}
                                helperText={error && !laboratorioNombre ? 'Requerido' : ''}
                                placeholder="Ej: Laboratorio de Calidad, Labtest, etc."
                                disabled={loading}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><ScienceIcon sx={{ color: colors.laboratory }} /></InputAdornment>
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Autorizado por *"
                                value={autorizadoPor}
                                onChange={(e) => setAutorizadoPor(e.target.value)}
                                error={!!error && !autorizadoPor}
                                helperText={error && !autorizadoPor ? 'Requerido' : ''}
                                placeholder="Nombre de quien autoriza el envío a laboratorio"
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Contacto en laboratorio"
                                value={laboratorioContacto}
                                onChange={(e) => setLaboratorioContacto(e.target.value)}
                                placeholder="Nombre de la persona de contacto (opcional)"
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Motivo del envío"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Ej: Análisis de calidad, Pruebas técnicas, Certificación, etc."
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Descripción detallada"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                multiline
                                rows={3}
                                placeholder="Detalles adicionales sobre el envío a laboratorio..."
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                multiline
                                rows={2}
                                placeholder="Observaciones adicionales..."
                                disabled={loading}
                            />
                        </>
                    )}

                    <Box>
                        <input
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            style={{ display: 'none' }}
                            id="documento-upload"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="documento-upload">
                            <Button variant="outlined" component="span" fullWidth>
                                {documento ? 'Cambiar documento' : 'Subir documento (opcional)'}
                            </Button>
                        </label>
                        {documento && (
                            <Box mt={1} p={1} bgcolor={alpha(colors.primary, 0.05)} borderRadius={1}>
                                <Typography variant="body2">{documento.name}</Typography>
                            </Box>
                        )}
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    color={tipo === 'BAJA' ? 'error' : (tipo === 'DONACION' ? 'success' : 'secondary')}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : (tipo === 'BAJA' ? <DeleteForeverIcon /> : (tipo === 'DONACION' ? <VolunteerActivismIcon /> : <ScienceIcon />))}
                    sx={{
                        ...(tipo === 'LABORATORIO' && {
                            background: `linear-gradient(135deg, ${colors.laboratory} 0%, ${colors.secondary} 100%)`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${colors.laboratory} 0%, ${colors.secondary} 100%)`,
                            }
                        })
                    }}
                >
                    {loading ? 'Procesando...' : (tipo === 'BAJA' ? 'Registrar Baja' : (tipo === 'DONACION' ? 'Registrar Donación' : 'Enviar a Laboratorio'))}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN
// ============================================
function ConfirmDeleteDialog({ open, onClose, producto, onConfirm }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: alpha(colors.error, 0.05)
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <DeleteForeverIcon sx={{ color: colors.error }} />
                    <Typography variant="h6">Confirmar Eliminación</Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Esta acción eliminará permanentemente el producto.
                </Alert>
                
                <Typography variant="body1" gutterBottom>
                    ¿Está seguro que desea eliminar el producto?
                </Typography>
                
                {producto && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: alpha(colors.background, 0.5) }}>
                        <Typography variant="subtitle2" gutterBottom>
                            <strong>{producto.nombre}</strong>
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">ID:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{producto.id}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Serie:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{producto.numero_serie || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                    startIcon={<CancelIcon />}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                >
                    Eliminar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE ASIGNACIÓN A COLABORADOR
// ============================================
function AsignacionColaboradorDialog({ open, onClose, producto, onSuccess }) {
    const [colaboradores, setColaboradores] = useState([]);
    const [selectedColaborador, setSelectedColaborador] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [esPrestamo, setEsPrestamo] = useState(false);
    const [fechaDevolucion, setFechaDevolucion] = useState('');

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            setSelectedColaborador(null);
            setMotivo('');
            setObservaciones('');
            setError('');
            setSearchTerm('');
            setEsPrestamo(false);
            setFechaDevolucion('');
        }
    }, [open]);

    const cargarColaboradores = async () => {
        try {
            const response = await colaboradorService.getColaboradores({ estado: 'ACTIVO' });
            setColaboradores(response || []);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            setError('Error al cargar la lista de colaboradores');
        }
    };

    const colaboradoresFiltrados = colaboradores.filter(col => 
        col.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selectedColaborador) {
            setError('Debe seleccionar un colaborador');
            return;
        }

        if (esPrestamo && !fechaDevolucion) {
            setError('Debe ingresar una fecha de devolución para el préstamo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = {
                colaborador_id: selectedColaborador.id,
                motivo: motivo.trim() || (esPrestamo ? 'Préstamo de equipo' : 'Asignación de equipo'),
                observaciones: observaciones.trim() || '',
                fecha_asignacion: new Date().toISOString().split('T')[0],
                es_prestamo: esPrestamo ? 1 : 0,
                fecha_devolucion_esperada: esPrestamo ? fechaDevolucion : null
            };

            const response = await productosService.asignarProducto(producto.id, selectedColaborador.id, data);

            if (response && response.success) {
                const tipoAsignacion = esPrestamo ? 'préstamo' : 'asignación';
                onSuccess(`Producto ${tipoAsignacion} correctamente a ${selectedColaborador.nombre}`, response.producto);
                onClose();
            } else {
                throw new Error(response?.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Error al procesar la asignación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                pb: 2,
                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIndIcon sx={{ color: colors.primary }} />
                    <Typography variant="h6">
                        Asignar Producto a Colaborador
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Producto: <strong>{producto?.nombre}</strong> (ID: {producto?.id})
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                <Stack spacing={3}>
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: alpha(colors.primary, 0.05), 
                        borderRadius: 2,
                        border: `1px solid ${alpha(colors.primary, 0.1)}`
                    }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Detalles del producto:
                        </Typography>
                        <Typography variant="body2">
                            <strong>Nombre:</strong> {producto?.nombre}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Serie:</strong> {producto?.numero_serie || 'N/A'}
                        </Typography>
                    </Box>

                    <FormControl component="fieldset">
                        <FormLabel>Tipo de asignación</FormLabel>
                        <RadioGroup row value={esPrestamo ? 'prestamo' : 'asignacion'} onChange={(e) => setEsPrestamo(e.target.value === 'prestamo')}>
                            <FormControlLabel value="asignacion" control={<Radio />} label="Asignación permanente" />
                            <FormControlLabel value="prestamo" control={<Radio />} label="Préstamo temporal" />
                        </RadioGroup>
                    </FormControl>

                    {esPrestamo && (
                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha de devolución esperada *"
                            value={fechaDevolucion}
                            onChange={(e) => setFechaDevolucion(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            helperText="Fecha en la que se espera la devolución del producto"
                        />
                    )}

                    <TextField
                        fullWidth
                        placeholder="Buscar colaborador por nombre, RUT, email o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6B7280' }} /></InputAdornment>,
                        }}
                        size="small"
                    />

                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {colaboradoresFiltrados.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                    {searchTerm ? 'No se encontraron colaboradores' : 'No hay colaboradores activos registrados'}
                                </Typography>
                                <Button 
                                    size="small" 
                                    sx={{ mt: 1 }}
                                    onClick={() => window.location.href = '/colaboradores'}
                                >
                                    Ir a gestión de colaboradores
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
                                        backgroundColor: selectedColaborador?.id === col.id ? alpha(colors.primary, 0.05) : 'transparent',
                                        '&:hover': { backgroundColor: alpha(colors.primary, 0.03) },
                                        transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => setSelectedColaborador(col)}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                            {col.nombre?.charAt(0) || '?'}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="subtitle2" fontWeight={500}>
                                                {col.nombre}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {col.cargo || 'Sin cargo'} • {col.departamento || 'Sin departamento'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {col.email} {col.rut && `• RUT: ${col.rut}`}
                                            </Typography>
                                        </Box>
                                        {selectedColaborador?.id === col.id && (
                                            <CheckCircleOutlineIcon sx={{ color: colors.success }} />
                                        )}
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Paper>

                    {selectedColaborador && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: alpha(colors.success, 0.05), 
                            borderRadius: 2,
                            border: `1px solid ${alpha(colors.success, 0.2)}`
                        }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom color={colors.success}>
                                Colaborador seleccionado:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                                <Avatar sx={{ bgcolor: colors.success }}>
                                    {selectedColaborador.nombre?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight={500}>
                                        {selectedColaborador.nombre}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedColaborador.cargo || 'Sin cargo'} • {selectedColaborador.departamento || 'Sin departamento'}
                                    </Typography>
                                    {selectedColaborador.email && (
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedColaborador.email}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        label="Motivo de asignación"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder={esPrestamo ? "Ej: Préstamo para proyecto específico..." : "Ej: Asignación permanente por cargo..."}
                        multiline
                        rows={2}
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        label="Observaciones adicionales"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Detalles adicionales sobre la asignación..."
                        multiline
                        rows={2}
                        disabled={loading}
                    />

                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !selectedColaborador}
                    startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIndIcon />}
                    sx={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                            transform: 'translateY(-1px)'
                        }
                    }}
                >
                    {loading ? 'Procesando...' : (esPrestamo ? 'Confirmar Préstamo' : 'Confirmar Asignación')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DIÁLOGO DE DETALLE DE PRODUCTO
// ============================================
function ProductoDetailDialog({ open, onClose, producto, getImageUrl, historialUso = [], historialMantenciones = [] }) {
    const [tabValue, setTabValue] = useState(0);
    const [openHistorialDialog, setOpenHistorialDialog] = useState(false);
    const [productoParaHistorial, setProductoParaHistorial] = useState(null);
    
    if (!producto) return null;

    const getEstadoColor = (estado, esPrestamo = false) => {
        if (esPrestamo) return colors.warning;
        const colores = {
            'DISPONIBLE': colors.success,
            'ASIGNADO': colors.info,
            'EN MANTENCIÓN': colors.warning,
            'EN REPARACIÓN': colors.warning,
            'NO DISPONIBLE': colors.error,
            'EN LABORATORIO': colors.laboratory
        };
        return colores[estado] || colors.text.secondary;
    };

    const getCondicionColor = (condicion) => {
        return condicion === 'USADO' ? colors.warning : colors.success;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No registrada';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    const handleOpenHistorial = () => {
        setProductoParaHistorial(producto);
        setOpenHistorialDialog(true);
    };

    const handleCloseHistorial = () => {
        setOpenHistorialDialog(false);
        setProductoParaHistorial(null);
    };

    // CORREGIDO: Verificar múltiples fuentes de es_prestamo
    const esPrestamo = producto.asignacion_activa?.es_prestamo === 1 || 
                       producto.colaborador_asignado?.es_prestamo === 1 ||
                       producto.es_prestamo === 1;
    
    const estadoMostrar = esPrestamo ? 'PRÉSTAMO' : (producto.estado || 'DISPONIBLE');

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                            src={getImageUrl(producto.imagen_path)}
                            sx={{
                                width: 60,
                                height: 60,
                                border: `2px solid ${colors.primary}`,
                            }}
                        >
                            <ImageIcon />
                        </Avatar>
                        <Box flex={1}>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {producto.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {producto.id} • Serie: {producto.numero_serie || 'N/A'}
                            </Typography>
                            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                    label={estadoMostrar}
                                    size="small"
                                    sx={{ 
                                        backgroundColor: alpha(getEstadoColor(producto.estado, esPrestamo), 0.1), 
                                        color: getEstadoColor(producto.estado, esPrestamo),
                                    }}
                                />
                                <Chip
                                    label={producto.condicion || 'NUEVO'}
                                    size="small"
                                    sx={{ 
                                        backgroundColor: alpha(getCondicionColor(producto.condicion), 0.1),
                                        color: getCondicionColor(producto.condicion),
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogTitle>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Información" />
                        <Tab 
                            label={
                                <Badge badgeContent={historialUso.length} color="info" max={99}>
                                    Historial de Uso
                                </Badge>
                            } 
                        />
                        <Tab 
                            label={
                                <Badge badgeContent={historialMantenciones.length} color="warning" max={99}>
                                    Mantenciones
                                </Badge>
                            } 
                        />
                    </Tabs>
                </Box>

                <DialogContent dividers>
                    {tabValue === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Información Básica
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Stack spacing={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Marca:</Typography>
                                            <Typography fontWeight={500}>{producto.marca || '-'}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Modelo:</Typography>
                                            <Typography fontWeight={500}>{producto.modelo || '-'}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Precio:</Typography>
                                            <Typography fontWeight={600} color={colors.primary}>
                                                ${(producto.precio || 0).toLocaleString('es-CL')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    Documentos y Fechas
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Stack spacing={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">OC N°:</Typography>
                                            <Typography fontWeight={500}>{producto.oc_numero || 'N/A'}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Factura N°:</Typography>
                                            <Typography fontWeight={500}>{producto.factura_numero || 'N/A'}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Fecha Adquisición:</Typography>
                                            <Typography fontWeight={500}>{formatDate(producto.fecha_adquisicion)}</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                            {producto.descripcion && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Descripción
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(colors.background, 0.5) }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {producto.descripcion}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}
                            {esPrestamo && producto.asignacion_activa?.fecha_devolucion_esperada && (
                                <Grid item xs={12}>
                                    <Alert severity="info" icon={<ReceiptLongIcon />}>
                                        <strong>Préstamo activo</strong> - Fecha de devolución esperada: {formatDate(producto.asignacion_activa.fecha_devolucion_esperada)}
                                    </Alert>
                                </Grid>
                            )}
                            {producto.colaborador_asignado && (
                                <Grid item xs={12}>
                                    <Alert severity="info" icon={<PersonIcon />}>
                                        <strong>Asignado a:</strong> {producto.colaborador_asignado.nombre}
                                        {producto.colaborador_asignado.cargo && ` (${producto.colaborador_asignado.cargo})`}
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>
                    )}

                    {tabValue === 1 && (
                        <Box>
                            <Button
                                variant="outlined"
                                startIcon={<HistoryIcon />}
                                onClick={handleOpenHistorial}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Ver historial completo de uso
                            </Button>
                            <HistorialUsoRender historial={historialUso} />
                        </Box>
                    )}

                    {tabValue === 2 && (
                        <HistorialMantenciones mantenciones={historialMantenciones} />
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} variant="contained" color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            <HistorialUsoDialog
                open={openHistorialDialog}
                onClose={handleCloseHistorial}
                producto={productoParaHistorial || producto}
                historial={historialUso}
            />
        </>
    );
}

// ============================================
// FORMULARIO DE PRODUCTO (COMPLETO)
// ============================================
function ProductoForm({ open, onClose, producto, onSave }) {
    const [formData, setFormData] = useState({
        nombre: '',
        precio: '',
        oc_numero: '',
        factura_numero: '',
        descripcion: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        condicion: 'NUEVO',
        bodega_id: '',
        estado: 'DISPONIBLE',
        es_granel: false,
        cantidad: 1
    });

    const [errores, setErrores] = useState({});
    const [showHistorial, setShowHistorial] = useState(false);
    const [historialUso, setHistorialUso] = useState([]);
    const [historialMantenciones, setHistorialMantenciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bodegas, setBodegas] = useState([]);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState('');
    const [motivoAsignacion, setMotivoAsignacion] = useState('');
    const [observacionesAsignacion, setObservacionesAsignacion] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const [mostrarMantencion, setMostrarMantencion] = useState(false);
    const [accionMantencion, setAccionMantencion] = useState('ninguna');
    const [tipoMantencion, setTipoMantencion] = useState('RUTINA');
    const [fechaInicioMantencion, setFechaInicioMantencion] = useState(new Date().toISOString().split('T')[0]);
    const [responsableMantencion, setResponsableMantencion] = useState('');
    const [descripcionMantencion, setDescripcionMantencion] = useState('');
    const [costoMantencion, setCostoMantencion] = useState('');
    const [fechaTerminoMantencion, setFechaTerminoMantencion] = useState(new Date().toISOString().split('T')[0]);
    const [observacionesMantencion, setObservacionesMantencion] = useState('');

    const [nombresProductosExistentes, setNombresProductosExistentes] = useState([]);
    const [marcasExistentes, setMarcasExistentes] = useState([]);
    const [modelosExistentes, setModelosExistentes] = useState([]);
    const [todosLosProductos, setTodosLosProductos] = useState([]);

    const opcionesEstado = [
        'DISPONIBLE',
        'EN MANTENCIÓN',
        'EN REPARACIÓN',
        'NO DISPONIBLE'
    ];

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        const fetchTodosLosProductos = async () => {
            try {
                const productosData = await productosService.getProductos('', {});
                if (productosData && Array.isArray(productosData)) {
                    setTodosLosProductos(productosData);
                    const nombresUnicos = [...new Set(productosData.map(p => p.nombre).filter(n => n && n.trim() !== ''))];
                    setNombresProductosExistentes(nombresUnicos.sort());
                    const marcasUnicas = [...new Set(productosData.map(p => p.marca).filter(m => m && m.trim() !== ''))];
                    setMarcasExistentes(marcasUnicas.sort());
                    const modelosUnicos = [...new Set(productosData.map(p => p.modelo).filter(m => m && m.trim() !== ''))];
                    setModelosExistentes(modelosUnicos.sort());
                }
            } catch (error) {
                console.error('Error cargando productos para autocompletado:', error);
            }
        };
        if (open) fetchTodosLosProductos();
    }, [open]);

    useEffect(() => {
        const fetchBodegas = async () => {
            try {
                const bodegasData = await productosService.getBodegas();
                setBodegas(bodegasData || []);
            } catch (error) {
                console.error('Error cargando bodegas:', error);
            }
        };
        if (open) fetchBodegas();
    }, [open]);

    useEffect(() => {
        const fetchColaboradores = async () => {
            try {
                const data = await colaboradorService.getColaboradores({ estado: 'ACTIVO' });
                setColaboradores(data || []);
            } catch (error) {
                console.error('Error cargando colaboradores:', error);
            }
        };
        if (open) fetchColaboradores();
    }, [open]);

    useEffect(() => {
        if (open) {
            if (producto) {
                setFormData({
                    nombre: producto.nombre || '',
                    precio: producto.precio || '',
                    oc_numero: producto.oc_numero || '',
                    factura_numero: producto.factura_numero || '',
                    descripcion: producto.descripcion || '',
                    marca: producto.marca || '',
                    modelo: producto.modelo || '',
                    numero_serie: producto.numero_serie || '',
                    condicion: producto.condicion || 'NUEVO',
                    bodega_id: producto.bodega_id || '',
                    estado: producto.estado || 'DISPONIBLE',
                    es_granel: producto.es_granel === 1 || producto.es_granel === true ? true : false,
                    cantidad: producto.cantidad !== undefined && producto.cantidad !== null ? producto.cantidad : 1
                });
                
                if (producto.id) {
                    productosService.getHistorialMantenciones(producto.id)
                        .then(mants => setHistorialMantenciones(mants || []))
                        .catch(() => setHistorialMantenciones(producto.historial_mantenciones || []));
                    
                    productosService.getHistorialUso(producto.id)
                        .then(hUso => setHistorialUso(hUso || []))
                        .catch(() => setHistorialUso(producto.historial_uso || []));
                } else {
                    setHistorialUso(producto.historial_uso || []);
                    setHistorialMantenciones(producto.historial_mantenciones || []);
                }
                
                if (producto.colaborador_asignado && producto.colaborador_asignado.id) {
                    setColaboradorSeleccionado(producto.colaborador_asignado.id);
                } else {
                    setColaboradorSeleccionado('');
                }
                setMotivoAsignacion('');
                setObservacionesAsignacion('');
                
                const enMantencion = producto.estado === 'EN MANTENCIÓN' || producto.estado === 'EN REPARACIÓN';
                setMostrarMantencion(enMantencion);
                setAccionMantencion(enMantencion ? 'finalizar' : 'ninguna');
                setTipoMantencion(producto.estado === 'EN REPARACIÓN' ? 'REPARACION' : 'RUTINA');
            } else {
                setFormData({
                    nombre: '',
                    precio: '',
                    oc_numero: '',
                    factura_numero: '',
                    descripcion: '',
                    marca: '',
                    modelo: '',
                    numero_serie: '',
                    condicion: 'NUEVO',
                    bodega_id: '',
                    estado: 'DISPONIBLE',
                    es_granel: false,
                    cantidad: 1
                });
                setHistorialUso([]);
                setHistorialMantenciones([]);
                setColaboradorSeleccionado('');
                setMotivoAsignacion('');
                setObservacionesAsignacion('');
                setMostrarMantencion(false);
                setAccionMantencion('ninguna');
            }
            setErrores({});
        }
    }, [producto, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({ ...formData, [name]: value });
        
        if (name === 'estado' && value === 'ASIGNADO') {
            if (!colaboradorSeleccionado) {
                setErrores({ ...errores, asignacion: 'Debe seleccionar un colaborador para asignar el producto' });
            } else {
                setErrores({ ...errores, asignacion: null });
            }
        } else if (name === 'estado' && value !== 'ASIGNADO') {
            setErrores({ ...errores, asignacion: null });
        }
        
        if (errores[name]) {
            setErrores({ ...errores, [name]: null });
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        if (!formData.nombre?.trim()) nuevosErrores.nombre = 'El nombre es requerido';
        if (!formData.bodega_id) nuevosErrores.bodega_id = 'Debe seleccionar una bodega';
        if (!formData.es_granel && !formData.numero_serie?.trim()) {
            nuevosErrores.numero_serie = 'El número de serie es requerido para productos individuales';
        }
        if (formData.es_granel && (isNaN(parseInt(formData.cantidad)) || parseInt(formData.cantidad) <= 0)) {
            nuevosErrores.cantidad = 'La cantidad inicial debe ser mayor a 0';
        }
        if (!formData.condicion) nuevosErrores.condicion = 'Debe seleccionar una condición';
        if (formData.estado === 'ASIGNADO' && !colaboradorSeleccionado) {
            nuevosErrores.asignacion = 'Debe seleccionar un colaborador para asignar el producto';
        }
        
        setErrores(nuevosErrores);
        const esValido = Object.keys(nuevosErrores).length === 0;
        if (!esValido) {
            showSnackbar('Por favor complete todos los campos obligatorios antes de guardar', 'warning');
        }
        return esValido;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);

        try {
            const productoData = {
                nombre: formData.nombre.trim(),
                precio: formData.precio ? parseFloat(formData.precio) : 0,
                oc_numero: formData.oc_numero?.trim() || '',
                factura_numero: formData.factura_numero?.trim() || '',
                descripcion: formData.descripcion?.trim() || '',
                marca: formData.marca?.trim() || '',
                modelo: formData.modelo?.trim() || '',
                numero_serie: formData.numero_serie?.trim() || '',
                condicion: formData.condicion || 'NUEVO',
                bodega_id: formData.bodega_id ? parseInt(formData.bodega_id) : null,
                estado: formData.estado || 'DISPONIBLE',
                es_granel: formData.es_granel ? true : false,
                cantidad: formData.es_granel ? (parseInt(formData.cantidad) || 1) : 1
            };

            console.log('📤 Enviando productoData:', productoData);

            let response;
            let productoId = producto?.id;
            
            if (producto && producto.id) {
                response = await productosService.updateProducto(producto.id, productoData);
                productoId = producto.id;
            } else {
                response = await productosService.createProducto(productoData);
                if (response && response.success && response.data) {
                    productoId = response.data.id;
                }
            }

            if (!response || !response.success) {
                throw new Error(response?.message || 'Error al guardar el producto');
            }

            console.log('✅ Producto guardado con ID:', productoId);

            if (formData.estado === 'ASIGNADO' && colaboradorSeleccionado && productoId) {
                try {
                    console.log('📤 Creando asignación para producto:', productoId, 'colaborador:', colaboradorSeleccionado);
                    
                    const asignacionResponse = await productosService.asignarProducto(productoId, colaboradorSeleccionado, {
                        motivo: motivoAsignacion,
                        observaciones: observacionesAsignacion,
                        fecha_asignacion: new Date().toISOString().split('T')[0]
                    });
                    
                    if (asignacionResponse && asignacionResponse.success) {
                        showSnackbar(`Producto asignado correctamente a ${asignacionResponse.colaborador?.nombre || 'colaborador'}`, 'success');
                    } else {
                        throw new Error(asignacionResponse?.message || 'Error al crear la asignación');
                    }
                } catch (error) {
                    console.error('❌ Error al asignar:', error);
                    showSnackbar('Producto guardado pero hubo error al asignar: ' + (error.message || ''), 'warning');
                }
            } else if (formData.estado !== 'ASIGNADO') {
                showSnackbar(
                    producto ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 
                    'success'
                );
            }
            
            onSave(response.data);
            handleClose();
            
        } catch (error) {
            console.error('❌ Error al guardar producto:', error);
            const apiMessage = error.response?.data?.message;
            let msg = apiMessage || error.message || 'Error al procesar la solicitud';
            if (msg.includes('Cannot insert the value NULL') || msg.includes('column does not allow nulls') || msg.includes('bodega_id')) {
                msg = 'La bodega y los campos obligatorios deben rellenarse antes de guardar';
            }
            showSnackbar(msg, 'warning');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nombre: '',
            precio: '',
            oc_numero: '',
            factura_numero: '',
            descripcion: '',
            marca: '',
            modelo: '',
            numero_serie: '',
            condicion: 'NUEVO',
            bodega_id: '',
            estado: 'DISPONIBLE',
            es_granel: false,
            cantidad: 1
        });
        setErrores({});
        setHistorialUso([]);
        setHistorialMantenciones([]);
        setColaboradorSeleccionado('');
        setMotivoAsignacion('');
        setObservacionesAsignacion('');
        setMostrarMantencion(false);
        setAccionMantencion('ninguna');
        setResponsableMantencion('');
        setDescripcionMantencion('');
        setCostoMantencion('');
        setObservacionesMantencion('');
        setLoading(false);
        onClose();
    };

    // HistorialUsoFormDialog component (simplificado)
    const HistorialUsoFormDialog = ({ open, onClose, onGuardar, historialExistente }) => {
        const [historial, setHistorial] = useState([]);
        const [nuevoRegistro, setNuevoRegistro] = useState({
            nombre_persona: '',
            fecha_asignacion: new Date().toISOString().split('T')[0],
            fecha_devolucion: new Date().toISOString().split('T')[0],
            condicion_entrega: '',
            observaciones: ''
        });

        useEffect(() => {
            if (open) {
                setHistorial(historialExistente || []);
            }
        }, [open, historialExistente]);

        const agregarRegistro = () => {
            if (!nuevoRegistro.nombre_persona?.trim()) {
                alert('El nombre de la persona es requerido');
                return;
            }
            if (!nuevoRegistro.fecha_asignacion) {
                alert('La fecha de asignación es requerida');
                return;
            }
            if (!nuevoRegistro.fecha_devolucion) {
                alert('La fecha de devolución es requerida');
                return;
            }
            if (!nuevoRegistro.condicion_entrega?.trim()) {
                alert('La condición de entrega es requerida');
                return;
            }

            setHistorial([...historial, { 
                ...nuevoRegistro, 
                id: Date.now(),
                fecha_registro: new Date().toISOString()
            }]);
            
            setNuevoRegistro({
                nombre_persona: '',
                fecha_asignacion: new Date().toISOString().split('T')[0],
                fecha_devolucion: new Date().toISOString().split('T')[0],
                condicion_entrega: '',
                observaciones: ''
            });
        };

        const eliminarRegistro = (id) => {
            setHistorial(historial.filter(reg => reg.id !== id));
        };

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon sx={{ color: colors.primary }} />
                        <Typography variant="h6">Historial de Uso del Producto</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <Alert severity="info">
                            Registre la información de las personas que han usado el producto
                        </Alert>

                        <Paper variant="outlined" sx={{ p: 3, bgcolor: alpha(colors.primary, 0.02) }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Registrar nuevo uso
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre de la persona *"
                                        value={nuevoRegistro.nombre_persona}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, nombre_persona: e.target.value })}
                                        size="small"
                                        placeholder="Nombre completo de quien usó el producto"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha de asignación *"
                                        value={nuevoRegistro.fecha_asignacion}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_asignacion: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha de devolución *"
                                        value={nuevoRegistro.fecha_devolucion}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, fecha_devolucion: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Condición de entrega *"
                                        value={nuevoRegistro.condicion_entrega}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, condicion_entrega: e.target.value })}
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder="Describa en qué condiciones se entregó/recibió el equipo"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Observaciones adicionales"
                                        value={nuevoRegistro.observaciones}
                                        onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, observaciones: e.target.value })}
                                        multiline
                                        rows={2}
                                        size="small"
                                        placeholder="Observaciones adicionales (opcional)"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={agregarRegistro}
                                        disabled={!nuevoRegistro.nombre_persona?.trim() || !nuevoRegistro.fecha_asignacion || !nuevoRegistro.fecha_devolucion || !nuevoRegistro.condicion_entrega?.trim()}
                                        startIcon={<AddIcon />}
                                    >
                                        Agregar registro de uso
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {historial.length > 0 ? (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Registros de uso ({historial.length})
                                </Typography>
                                <Stack spacing={2}>
                                    {historial.map((registro, index) => (
                                        <Paper key={registro.id || index} variant="outlined" sx={{ p: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                <Box flex={1}>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {registro.nombre_persona}
                                                    </Typography>
                                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Asignación:
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {new Date(registro.fecha_asignacion).toLocaleDateString('es-CL')}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Devolución:
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {new Date(registro.fecha_devolucion).toLocaleDateString('es-CL')}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        <strong>Condición:</strong> {registro.condicion_entrega}
                                                    </Typography>
                                                    {registro.observaciones && (
                                                        <Typography variant="body2">
                                                            <strong>Obs:</strong> {registro.observaciones}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => eliminarRegistro(registro.id)}
                                                    sx={{ color: colors.error }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <PersonIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                <Typography color="text.secondary">
                                    No hay registros de uso. Agregue el primer registro.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} variant="outlined">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={() => {
                            onGuardar(historial);
                            onClose();
                        }} 
                        variant="contained" 
                        color="primary"
                    >
                        Guardar Historial ({historial.length} registros)
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth 
                scroll="body"
                disableEscapeKeyDown={loading}
            >
                <DialogTitle sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    background: `linear-gradient(135deg, ${alpha(colors.primary, 0.02)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`
                }}>
                    <Typography variant="h6">
                        {producto ? 'Editar Producto' : 'Nuevo Producto'}
                    </Typography>
                </DialogTitle>
                
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {Object.keys(errores).some(k => errores[k]) && (
                            <Grid item xs={12}>
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                    Debe rellenar todos los campos obligatorios (*) antes de guardar.
                                </Alert>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary}>
                                Información Básica
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                freeSolo
                                options={nombresProductosExistentes}
                                value={formData.nombre}
                                onInputChange={(event, newValue) => {
                                    setFormData({ ...formData, nombre: newValue || '' });
                                    if (errores.nombre) {
                                        setErrores({ ...errores, nombre: null });
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, nombre: newValue || '' });
                                    if (errores.nombre) {
                                        setErrores({ ...errores, nombre: null });
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Nombre del producto *"
                                        error={!!errores.nombre}
                                        helperText={errores.nombre || "Escriba el nombre o seleccione uno existente"}
                                        size="small"
                                        disabled={loading}
                                        required
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <InventoryIcon sx={{ fontSize: 16, color: colors.primary }} />
                                            <Typography variant="body2">{option}</Typography>
                                            <Chip 
                                                label="Existente" 
                                                size="small" 
                                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                            />
                                        </Box>
                                    </li>
                                )}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={!!errores.bodega_id} required>
                                <InputLabel>Bodega *</InputLabel>
                                <Select
                                    name="bodega_id"
                                    value={formData.bodega_id}
                                    onChange={handleChange}
                                    label="Bodega *"
                                    size="small"
                                    disabled={loading}
                                    required
                                >
                                    <MenuItem value=""><em>Seleccionar bodega</em></MenuItem>
                                    {bodegas.map((bodega) => (
                                        <MenuItem key={bodega.id} value={bodega.id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StoreIcon fontSize="small" sx={{ color: colors.primary }} />
                                                {bodega.nombre}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errores.bodega_id && (
                                    <FormHelperText>{errores.bodega_id}</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: formData.es_granel ? alpha('#7C3AED', 0.05) : 'transparent', borderColor: formData.es_granel ? '#7C3AED' : 'divider' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.es_granel}
                                            onChange={(e) => setFormData({ ...formData, es_granel: e.target.checked })}
                                            color="secondary"
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600} color={formData.es_granel ? '#7C3AED' : 'text.primary'}>
                                                Producto a Granel / Insumo (Sin N° de Serie / Sin QR)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Activa esta opción para cables, conectores u otros insumos que se manejan por cantidad total en stock y se entregan mediante descuento directo.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>
                        </Grid>

                        {formData.es_granel && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Cantidad inicial en Stock *"
                                    name="cantidad"
                                    type="number"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    error={!!errores.cantidad}
                                    helperText={errores.cantidad || "Stock total disponible (ej: 10 unidades)"}
                                    size="small"
                                    disabled={loading}
                                    required
                                    inputProps={{ min: 1 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><InventoryIcon fontSize="small" sx={{ color: '#7C3AED' }} /></InputAdornment>
                                    }}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={formData.es_granel ? "Número de serie (Opcional / A Granel)" : "Número de serie * (único)"}
                                name="numero_serie"
                                value={formData.numero_serie}
                                onChange={handleChange}
                                error={!!errores.numero_serie}
                                helperText={errores.numero_serie || (formData.es_granel ? "Opcional para insumos a granel" : "")}
                                size="small"
                                placeholder={formData.es_granel ? "A granel (Sin serie)" : "Ej: SN-2024-001"}
                                disabled={loading}
                                required={!formData.es_granel}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><QrCodeIcon fontSize="small" /></InputAdornment>
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Precio"
                                name="precio"
                                type="number"
                                value={formData.precio}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                }}
                                size="small"
                                inputProps={{ min: 0, step: 100 }}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" error={!!errores.condicion}>
                                <InputLabel>Condición *</InputLabel>
                                <Select
                                    name="condicion"
                                    value={formData.condicion}
                                    label="Condición *"
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                >
                                    <MenuItem value="NUEVO">Nuevo</MenuItem>
                                    <MenuItem value="USADO">Usado</MenuItem>
                                    <MenuItem value="REACONDICIONADO">Reacondicionado</MenuItem>
                                </Select>
                                {errores.condicion && <FormHelperText>{errores.condicion}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    label="Estado"
                                    disabled={loading}
                                >
                                    {opcionesEstado.map((estado) => (
                                        <MenuItem key={estado} value={estado}>
                                            {estado}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>




                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                freeSolo
                                options={marcasExistentes}
                                value={formData.marca}
                                onInputChange={(event, newValue, reason) => {
                                    if (reason === 'input') {
                                        setFormData({ ...formData, marca: newValue || '' });
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, marca: newValue || '' });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Marca"
                                        placeholder="Escriba la marca o seleccione una existente"
                                        size="small"
                                        disabled={loading}
                                        helperText="Puede escribir una nueva marca o seleccionar una existente"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <InventoryIcon sx={{ fontSize: 16, color: colors.primary }} />
                                            <Typography variant="body2">{option}</Typography>
                                            <Chip 
                                                label="Existente" 
                                                size="small" 
                                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                            />
                                        </Box>
                                    </li>
                                )}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                freeSolo
                                options={modelosExistentes}
                                value={formData.modelo}
                                onInputChange={(event, newValue, reason) => {
                                    if (reason === 'input') {
                                        setFormData({ ...formData, modelo: newValue || '' });
                                    }
                                }}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, modelo: newValue || '' });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Modelo"
                                        placeholder="Escriba el modelo o seleccione uno existente"
                                        size="small"
                                        disabled={loading}
                                        helperText="Puede escribir un nuevo modelo o seleccionar uno existente"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <InventoryIcon sx={{ fontSize: 16, color: colors.primary }} />
                                            <Typography variant="body2">{option}</Typography>
                                            <Chip 
                                                label="Existente" 
                                                size="small" 
                                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                            />
                                        </Box>
                                    </li>
                                )}
                                fullWidth
                            />
                        </Grid>



                        {historialMantenciones.length > 0 && (
                            <Grid item xs={12}>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <HistoryIcon sx={{ color: colors.info }} />
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                Historial de Mantenciones ({historialMantenciones.length})
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <HistorialMantenciones mantenciones={historialMantenciones} />
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Historial de Uso
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                startIcon={<PersonIcon />}
                                onClick={() => setShowHistorial(true)}
                                fullWidth
                                disabled={loading}
                                sx={{ 
                                    borderColor: colors.info,
                                    color: colors.info,
                                    '&:hover': { borderColor: colors.info, backgroundColor: alpha(colors.info, 0.05) }
                                }}
                            >
                                {historialUso.length > 0 
                                    ? `Editar historial de uso (${historialUso.length} registros)`
                                    : 'Agregar historial de uso'}
                            </Button>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Detalles del Producto
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                multiline
                                rows={3}
                                size="small"
                                placeholder="Descripción del producto..."
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                Documentos
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="N° Orden de Compra"
                                name="oc_numero"
                                value={formData.oc_numero}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="N° Factura"
                                name="factura_numero"
                                value={formData.factura_numero}
                                onChange={handleChange}
                                size="small"
                                disabled={loading}
                            />
                        </Grid>

                        {historialUso.length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600} color={colors.primary} sx={{ mt: 2 }}>
                                    Historial de uso registrado
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1}>
                                    {historialUso.map((reg, idx) => (
                                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, bgcolor: alpha(colors.info, 0.03) }}>
                                            <Typography variant="body2">
                                                <strong>{reg.nombre_persona || reg.nombre_usuario}</strong>
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(reg.fecha_asignacion).toLocaleDateString()} → {new Date(reg.fecha_devolucion).toLocaleDateString()}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={handleClose} 
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                        {loading ? 'Guardando...' : (producto ? 'Actualizar' : 'Crear')}
                    </Button>
                </DialogActions>
            </Dialog>

            <HistorialUsoFormDialog
                open={showHistorial}
                onClose={() => setShowHistorial(false)}
                historialExistente={historialUso}
                onGuardar={(historial) => {
                    setHistorialUso(historial);
                    setShowHistorial(false);
                }}
            />

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

// Componente Modal para Descontar Stock / Entrega a Granel
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
        const stockActual = producto?.cantidad !== undefined && producto?.cantidad !== null ? producto.cantidad : 1;
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
            <DialogTitle sx={{ bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon />
                <Typography variant="h6">Descontar Stock / Entrega a Granel</Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha('#7C3AED', 0.04), borderColor: alpha('#7C3AED', 0.2) }}>
                    <Typography variant="subtitle2" fontWeight={600} color="#7C3AED">
                        {producto?.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Stock Actual Disponible: <strong>{producto?.cantidad !== undefined ? producto.cantidad : 1} unidades</strong>
                    </Typography>
                </Paper>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Esta entrega descontará la cantidad ingresada del inventario y guardará la observación. No genera Acta en PDF ni requiere firma.
                </Alert>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Cantidad a Entregar *"
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            inputProps={{ min: 1, max: producto?.cantidad || 1 }}
                            size="small"
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Observación / Destinatario"
                            placeholder="Ej: Entregado 2 cables HDMI a Juan Pérez para oficina 301"
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            size="small"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading}
                    sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                    Confirmar Entrega
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Productos = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(min-width:601px) and (max-width:960px)');
    const navigate = useNavigate();
    
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [dataLoaded, setDataLoaded] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterType, setFilterType] = useState('todos');
    const [filters, setFilters] = useState({
        estado: '',
        condicion: '',
        bodega_id: '',
        marcas: [],
        estados: [],
        condiciones: []
    });
    
    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [bodegas, setBodegas] = useState([]);
    const [condiciones] = useState(['NUEVO', 'USADO', 'REACONDICIONADO']);
    
    const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
    const [donaciones, setDonaciones] = useState([]);
    const [bajas, setBajas] = useState([]);
    
    const [openForm, setOpenForm] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [openDisposicion, setOpenDisposicion] = useState(false);
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
    const [openHistorial, setOpenHistorial] = useState(false);
    const [openAsignacion, setOpenAsignacion] = useState(false);
    const [openQRModal, setOpenQRModal] = useState(false);
    const [openDescontarStock, setOpenDescontarStock] = useState(false);
    
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [selectedProductoDetail, setSelectedProductoDetail] = useState(null);
    const [productoParaDisposicion, setProductoParaDisposicion] = useState(null);
    const [productoParaHistorial, setProductoParaHistorial] = useState(null);
    const [productoParaAsignar, setProductoParaAsignar] = useState(null);
    const [productoParaQR, setProductoParaQR] = useState(null);
    const [productoParaDescontar, setProductoParaDescontar] = useState(null);

    const handleOpenQRModal = (producto) => {
        setProductoParaQR(producto);
        setOpenQRModal(true);
    };

    const handleCloseQRModal = () => {
        setOpenQRModal(false);
        setProductoParaQR(null);
    };
    const [historialUso, setHistorialUso] = useState([]);
    const [historialMantenciones, setHistorialMantenciones] = useState([]);
    
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [stats, setStats] = useState({
        totalProductos: 0,
        valorTotal: 0
    });
    const [apiError, setApiError] = useState(false);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleGoHome = () => {
        navigate('/dashboard');
    };
    
    // Filtrar productos activos (excluir dados de baja, donados)
    const getProductosActivos = useCallback((productosList) => {
        return productosList.filter(p => {
            // Excluir productos dados de baja
            if (p.fecha_baja) return false;
            // Excluir productos donados
            if (p.fecha_donacion) return false;
            // Excluir productos con estado NO DISPONIBLE
            if (p.estado === 'NO DISPONIBLE') return false;
            return true;
        });
    }, []);

   const getEsPrestamo = (producto) => {
    // Verificar en todas las posibles ubicaciones donde podría venir es_prestamo
    return producto?.asignacion_activa?.es_prestamo === 1 || 
           producto?.es_prestamo === 1 ||
           producto?.colaborador_asignado?.es_prestamo === 1 ||
           // Algunas APIs pueden devolver es_prestamo como string '1' o true
           producto?.asignacion_activa?.es_prestamo === '1' ||
           producto?.es_prestamo === '1' ||
           producto?.colaborador_asignado?.es_prestamo === '1' ||
           // También revisar si el estado indica préstamo
           producto?.estado === 'PRÉSTAMO' ||
           // Último recurso: revisar si hay una asignación activa con fecha de devolución esperada
           (producto?.asignacion_activa?.fecha_devolucion_esperada && 
            !producto?.asignacion_activa?.fecha_devolucion);
};

    const filterCounts = {
        todos: getProductosActivos(productos).length,
        disponibles: getProductosActivos(productos).filter(p => p.estado === 'DISPONIBLE').length,
        asignados: getProductosActivos(productos).filter(p => p.estado === 'ASIGNADO' && !getEsPrestamo(p)).length,
        prestamos: getProductosActivos(productos).filter(p => getEsPrestamo(p)).length,
        qr: getProductosActivos(productos).filter(p => esAptoParaQR(p)).length
    };

    const loadExportData = async () => {
        try {
            console.log('📥 Cargando datos para exportación...');
            
            const historialResponse = await productosService.getHistorialAsignaciones?.() || [];
            setHistorialAsignaciones(historialResponse);
            
            const disposicionesResponse = await productosService.getHistorialDisposiciones?.() || { donaciones: [], bajas: [] };
            setDonaciones(disposicionesResponse.donaciones || []);
            setBajas(disposicionesResponse.bajas || []);
            
            return {
                historial: historialResponse,
                donaciones: disposicionesResponse.donaciones || [],
                bajas: disposicionesResponse.bajas || []
            };
        } catch (error) {
            console.error('Error cargando datos para exportación:', error);
            return { historial: [], donaciones: [], bajas: [] };
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [marcasData, estadosData, bodegasData] = await Promise.all([
                    productosService.getMarcas(),
                    productosService.getEstados(),
                    productosService.getBodegas()
                ]);
                
                setMarcas(marcasData || []);
                setEstados(estadosData || []);
                setBodegas(bodegasData || []);
                
                await loadExportData();
                
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            }
        };
        
        fetchInitialData();
    }, []);

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        try {
            const filterParams = {};
            
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            if (filters.marcas?.length) filterParams.marcas = filters.marcas.join(',');
            if (filters.estados?.length) filterParams.estados = filters.estados.join(',');
            if (filters.condiciones?.length) filterParams.condiciones = filters.condiciones.join(',');
            
            console.log('📤 Enviando filtros:', filterParams);
            
            const productosData = await productosService.getProductos(searchTerm, filterParams);
            setProductos(productosData);
            
            try {
                const statsData = await productosService.getStats();
                setStats({
                    totalProductos: statsData.totalProductos || 0,
                    valorTotal: statsData.valorTotal || 0
                });
            } catch (statsError) {
                console.warn('⚠️ Error cargando estadísticas:', statsError);
            }
            
            setApiError(false);
            setDataLoaded(true);
            
            if (showRefresh) {
                showSnackbar('Datos actualizados', 'success');
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            setDataLoaded(true);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchTerm, filters.bodega_id, filters.marcas, filters.estados, filters.condiciones]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterType('todos');
        setFilters({
            estado: '',
            condicion: '',
            bodega_id: '',
            marcas: [],
            estados: [],
            condiciones: []
        });
        setPage(0);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPage(0);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setPage(0);
    };

    const handleFilterTypeChange = (type) => {
        setFilterType(type);
        setPage(0);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0);
    };

    const handleOpenForm = (producto = null) => {
        setSelectedProducto(producto);
        setOpenForm(true);
    };

    const handleCloseForm = () => {
        setSelectedProducto(null);
        setOpenForm(false);
        fetchData(true);
    };

    const handleOpenDetail = async (producto) => {
        try {
            console.log('🔍 Abriendo detalle para producto:', producto.id);
            
            const [historialData, mantencionesData] = await Promise.all([
                productosService.getHistorialUso(producto.id).catch(() => []),
                productosService.getHistorialMantenciones(producto.id).catch(() => [])
            ]);
            
            if (historialData && historialData.length > 0) {
                setHistorialUso(historialData);
            } else if (producto.historial_uso && producto.historial_uso.length > 0) {
                setHistorialUso(producto.historial_uso);
            } else {
                setHistorialUso([]);
            }

            if (mantencionesData && mantencionesData.length > 0) {
                setHistorialMantenciones(mantencionesData);
            } else if (producto.historial_mantenciones && producto.historial_mantenciones.length > 0) {
                setHistorialMantenciones(producto.historial_mantenciones);
            } else {
                setHistorialMantenciones([]);
            }
            
            setSelectedProductoDetail(producto);
            setOpenDetail(true);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            setHistorialUso(producto.historial_uso || []);
            setHistorialMantenciones(producto.historial_mantenciones || []);
            setSelectedProductoDetail(producto);
            setOpenDetail(true);
        }
    };

    const handleCloseDetail = () => {
        setSelectedProductoDetail(null);
        setHistorialUso([]);
        setHistorialMantenciones([]);
        setOpenDetail(false);
    };

    const handleOpenHistorial = async (producto) => {
        try {
            console.log('🔍 Abriendo historial para producto:', producto.id);
            
            const historialData = await productosService.getHistorialUso(producto.id);
            
            setHistorialUso(historialData.length > 0 ? historialData : (producto.historial_uso || []));
            setProductoParaHistorial(producto);
            setOpenHistorial(true);
        } catch (error) {
            console.error('Error cargando historial:', error);
            showSnackbar('Error al cargar el historial', 'error');
        }
    };

    const handleCloseHistorial = () => {
        setProductoParaHistorial(null);
        setHistorialUso([]);
        setOpenHistorial(false);
    };

    const handleOpenDisposicion = (producto) => {
        setSelectedProducto(producto);
        setProductoParaDisposicion(producto);
        setOpenDisposicion(true);
    };

    const handleCloseDisposicion = () => {
        setSelectedProducto(null);
        setProductoParaDisposicion(null);
        setOpenDisposicion(false);
        fetchData(true);
    };

    const handleDisposicionSuccess = (message) => {
        showSnackbar(message, 'success');
        handleCloseDisposicion();
        fetchData(true);
    };

    const handleOpenAsignacion = (producto) => {
        if (producto.estado !== 'DISPONIBLE') {
            showSnackbar(`No se puede asignar. El producto está ${producto.estado}`, 'warning');
            return;
        }
        setProductoParaAsignar(producto);
        setOpenAsignacion(true);
    };

    const handleCloseAsignacion = () => {
        setProductoParaAsignar(null);
        setOpenAsignacion(false);
    };

    const handleAsignacionSuccess = (message, productoActualizado) => {
        showSnackbar(message, 'success');
        handleCloseAsignacion();
        
        if (productoActualizado) {
            setProductos(prevProductos => 
                prevProductos.map(p => 
                    p.id === productoActualizado.id ? { ...p, ...productoActualizado } : p
                )
            );
        }
        
        fetchData(true);
        loadExportData();
    };

    const handleSaveProducto = async (productoData) => {
        console.log('✅ Producto guardado, productoData recibido:', productoData);
        handleCloseForm();
        
        setTimeout(async () => {
            await fetchData(true);
            await loadExportData();
            
            try {
                const newStats = await productosService.getStats();
                console.log('📊 Nuevas estadísticas:', newStats);
                setStats({
                    totalProductos: newStats.totalProductos || 0,
                    valorTotal: newStats.valorTotal || 0
                });
            } catch (error) {
                console.warn('Error actualizando estadísticas:', error);
            }
        }, 500);
        
        showSnackbar('Producto guardado correctamente', 'success');
    };

    const handleDelete = async () => {
        if (!selectedProducto) return;
        
        try {
            await productosService.deleteProducto(selectedProducto.id);
            showSnackbar('Producto eliminado', 'success');
            await fetchData(true);
            await loadExportData();
            setOpenConfirmDelete(false);
            setTimeout(() => setSelectedProducto(null), 300);
        } catch (error) {
            console.error('Error eliminando:', error);
            showSnackbar('Error al eliminar el producto', 'error');
        }
    };

    const handleEliminarDonar = (producto) => {
        setSelectedProducto(producto);
        setProductoParaDisposicion(producto);
        setOpenDisposicion(true);
    };

    const handleRefresh = () => {
        fetchData(true);
        loadExportData();
    };

    const handleExportExcel = async () => {
        try {
            showSnackbar('Preparando exportación...', 'info');
            
            await loadExportData();
            
            const exportData = {
                productos: getProductosActivos(productos),
                historialAsignaciones: historialAsignaciones,
                donaciones: donaciones,
                bajas: bajas,
                bodegas: bodegas
            };
            
            const filename = `inventario_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
            const result = exportService.exportToExcel(exportData, filename);
            
            if (result.success) {
                showSnackbar('Reporte exportado exitosamente (4 hojas)', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error exportando:', error);
            showSnackbar('Error al exportar reporte', 'error');
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getImageUrl = (imagenPath) => {
        if (!imagenPath) return null;
        if (imagenPath.startsWith('http')) return imagenPath;
        if (imagenPath.startsWith('/uploads/')) return `http://localhost:98${imagenPath}`;
        return `http://localhost:98/uploads/${imagenPath}`;
    };

    const getFilteredByType = (productosList) => {
        switch (filterType) {
            case 'disponibles':
                return productosList.filter(p => p.estado === 'DISPONIBLE');
            case 'asignados':
                return productosList.filter(p => p.estado === 'ASIGNADO' && !getEsPrestamo(p));
            case 'prestamos':
                return productosList.filter(p => getEsPrestamo(p));
            case 'qr':
                return productosList.filter(p => esAptoParaQR(p));
            default:
                return productosList;
        }
    };

    // Aplicar todos los filtros incluyendo la exclusión de productos no activos
    const filteredProductos = getFilteredByType(getProductosActivos(productos)).filter((producto) => {
        if (filters.estado && producto.estado !== filters.estado) {
            return false;
        }
        if (filters.condicion && producto.condicion !== filters.condicion) {
            return false;
        }
        if (filters.bodega_id && producto.bodega_id !== Number(filters.bodega_id)) {
            return false;
        }
        if (filters.marcas && filters.marcas.length > 0) {
            if (!filters.marcas.includes(producto.marca)) {
                return false;
            }
        }
        if (filters.estados && filters.estados.length > 0) {
            if (!filters.estados.includes(producto.estado)) {
                return false;
            }
        }
        if (filters.condiciones && filters.condiciones.length > 0) {
            if (!filters.condiciones.includes(producto.condicion)) {
                return false;
            }
        }
        
        // Búsqueda por texto (incluye nombre del colaborador)
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            
            const nombre = (producto.nombre || '').toLowerCase();
            const marca = (producto.marca || '').toLowerCase();
            const modelo = (producto.modelo || '').toLowerCase();
            const numeroSerie = (producto.numero_serie || '').toLowerCase();
            
            // Buscar en colaborador asignado
            const colaboradorNombre = (producto.colaborador_asignado?.nombre || '').toLowerCase();
            const colaboradorRut = (producto.colaborador_asignado?.rut || '').toLowerCase();
            const colaboradorEmail = (producto.colaborador_asignado?.email || '').toLowerCase();
            
            const coincideProducto = nombre.includes(term) || 
                                     marca.includes(term) || 
                                     modelo.includes(term) || 
                                     numeroSerie.includes(term);
            
            const coincideColaborador = colaboradorNombre.includes(term) || 
                                        colaboradorRut.includes(term) || 
                                        colaboradorEmail.includes(term);
            
            if (!coincideProducto && !coincideColaborador) {
                return false;
            }
        }
        
        return true;
    });

    const paginatedProductos = filteredProductos.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const getEstadoColor = (estado, esPrestamo = false) => {
        if (esPrestamo) return colors.warning;
        const colores = {
            'DISPONIBLE': colors.success,
            'ASIGNADO': colors.info,
            'EN MANTENCIÓN': colors.warning,
            'EN REPARACIÓN': colors.warning,
            'NO DISPONIBLE': colors.error,
            'EN LABORATORIO': colors.laboratory
        };
        return colores[estado] || colors.text.secondary;
    };

    const getEstadoIcon = (estado, esPrestamo = false) => {
        if (esPrestamo) return <ReceiptLongIcon fontSize="small" />;
        const iconos = {
            'DISPONIBLE': <CheckCircleOutlineIcon fontSize="small" />,
            'ASIGNADO': <AssignmentIcon fontSize="small" />,
            'EN MANTENCIÓN': <BuildIcon fontSize="small" />,
            'EN REPARACIÓN': <HandymanIcon fontSize="small" />,
            'NO DISPONIBLE': <DeleteForeverIcon fontSize="small" />,
            'EN LABORATORIO': <ScienceIcon fontSize="small" />
        };
        return iconos[estado] || <InventoryIcon fontSize="small" />;
    };

    const activeFiltersCount = (() => {
        let count = 0;
        if (searchTerm) count++;
        if (filters.bodega_id) count++;
        if (filters.marcas?.length) count++;
        if (filters.estados?.length) count++;
        if (filters.condiciones?.length) count++;
        if (filterType !== 'todos') count++;
        return count;
    })();

    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    if (loading && !dataLoaded) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando productos...</Typography>
            </Box>
        );
    }

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
                <IconButton onClick={() => setDrawerOpen(false)}>
                    <ChevronLeftIcon />
                </IconButton>
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
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                Gestión de Productos
                            </Typography>
                        </Box>
                        <Tooltip title="Exportar a Excel">
                            <IconButton color="inherit" onClick={handleExportExcel} sx={{ mr: 1 }}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
                            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <Toolbar />

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                {/* Header Banner estilo Cápsula con Botones Azules Ovalados */}
                <Paper
                    sx={{
                        px: { xs: 2.5, sm: 3.5 },
                        py: { xs: 1.5, sm: 2 },
                        mb: 2.5,
                        borderRadius: '50px',
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                        color: 'white',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        boxShadow: '0 8px 25px rgba(124, 58, 237, 0.25)'
                    }}
                >
                    <Box sx={{ pl: { sm: 1 } }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Gestión de Productos
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, display: 'block', mt: 0.25 }}>
                            Administra el inventario de productos únicos por número de serie
                        </Typography>
                    </Box>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem' }} />}
                            onClick={() => handleOpenForm()}
                            disabled={loading}
                            sx={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                textTransform: 'none',
                                borderRadius: '50px',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                px: 2.2,
                                py: 0.65,
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.5)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Nuevo Producto
                        </Button>
                        
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<DownloadIcon sx={{ color: '#FFFFFF', fontSize: '1.1rem' }} />}
                            onClick={handleExportExcel}
                            sx={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                textTransform: 'none',
                                borderRadius: '50px',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                px: 2.2,
                                py: 0.65,
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.5)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Exportar Reporte
                        </Button>
                    </Stack>

                    {apiError && (
                        <Alert severity="warning" sx={{ mt: 2, width: '100%' }} icon={<ErrorIcon />} action={
                            <Button color="inherit" size="small" onClick={handleRefresh}>
                                REINTENTAR
                            </Button>
                        }>
                            No se pudo conectar con el servidor.
                        </Alert>
                    )}
                </Paper>

                <VisualFilters 
                    filterType={filterType} 
                    onFilterChange={handleFilterTypeChange}
                    counts={filterCounts}
                />



                <FilterPaper className="filter-paper">
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                            <Button
                                fullWidth
                                variant={showAdvancedFilters ? "contained" : "outlined"}
                                startIcon={showAdvancedFilters ? <FilterListOffIcon /> : <FilterListIcon />}
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="filter-button"
                                color={showAdvancedFilters ? "primary" : "inherit"}
                                sx={{
                                    backgroundColor: showAdvancedFilters ? colors.primary : 'transparent',
                                    color: showAdvancedFilters ? 'white' : colors.text.primary,
                                }}
                            >
                                {showAdvancedFilters ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
                                {activeFiltersCount > 0 && (
                                    <Chip
                                        size="small"
                                        label={activeFiltersCount}
                                        sx={{ ml: 1, bgcolor: showAdvancedFilters ? 'white' : colors.primary, color: showAdvancedFilters ? colors.primary : 'white', height: 24 }}
                                    />
                                )}
                            </Button>
                        </Grid>
                        <Grid item xs={6} md={3}>
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
                            marcas={marcas}
                            estados={estados}
                            bodegas={bodegas}
                            condiciones={condiciones}
                            activeFiltersCount={activeFiltersCount}
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                            onClearSearch={handleClearSearch}
                        />
                    </Collapse>
                </FilterPaper>

                <StyledTableContainer>
                    <Table size={isTablet ? 'small' : 'medium'} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Producto</StyledTableCell>
                                <StyledTableCell>Marca</StyledTableCell>
                                <StyledTableCell>Modelo</StyledTableCell>
                                <StyledTableCell>N° Serie</StyledTableCell>
                                <StyledTableCell>Bodega</StyledTableCell>
                                <StyledTableCell>Condición</StyledTableCell>
                                <StyledTableCell>Estado / Tipo</StyledTableCell>
                                <StyledTableCell>Asignado a</StyledTableCell>
                                <StyledTableCell align="center" sx={{ minWidth: 220, width: 220, whiteSpace: 'nowrap' }}>Acciones</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && !dataLoaded ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Cargando productos...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedProductos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No hay productos activos
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={() => handleOpenForm()}
                                        >
                                            Crear Producto
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const bodegaEncontrada = bodegas.find(b => b.id === producto.bodega_id);
                                    const bodegaNombre = bodegaEncontrada?.nombre || producto.bodega_nombre || 'Sin asignar';
                                    const tieneColaborador = !!(producto.colaborador_asignado && producto.colaborador_asignado.nombre);
                                    const estadoReal = (tieneColaborador && (producto.estado === 'DISPONIBLE' || !producto.estado)) ? 'ASIGNADO' : producto.estado;
                                    const disponible = estadoReal === 'DISPONIBLE';
                                    const esPrestamo = getEsPrestamo(producto);
                                    const estadoMostrar = esPrestamo ? 'PRÉSTAMO' : estadoReal;
                                    const estadoColor = getEstadoColor(estadoReal, esPrestamo);
                                    
                                    return (
                                        <TableRow key={producto.id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar 
                                                        src={getImageUrl(producto.imagen_path)} 
                                                        sx={{ width: 32, height: 32 }}
                                                    >
                                                        <ImageIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {producto.nombre}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ID: {producto.id}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{producto.marca || '-'}</TableCell>
                                            <TableCell>{producto.modelo || '-'}</TableCell>
                                            <TableCell>
                                                {producto.es_granel ? (
                                                    <Chip
                                                        icon={<InventoryIcon fontSize="small" />}
                                                        label={`A GRANEL (${producto.cantidad !== undefined ? producto.cantidad : 1} ud.)`}
                                                        size="small"
                                                        sx={{ 
                                                            backgroundColor: alpha('#7C3AED', 0.1),
                                                            color: '#7C3AED',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        icon={<QrCodeIcon fontSize="small" />}
                                                        label={producto.numero_serie || 'N/A'}
                                                        size="small"
                                                        sx={{ 
                                                            backgroundColor: alpha(colors.primary, 0.1),
                                                            color: colors.primary,
                                                            fontFamily: 'monospace'
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {estadoReal === 'ASIGNADO' ? (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                ) : (
                                                    <Chip
                                                        icon={<StoreIcon />}
                                                        label={bodegaNombre}
                                                        size="small"
                                                        sx={{ 
                                                            backgroundColor: alpha(colors.info, 0.1),
                                                            color: colors.info,
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={producto.condicion || 'NUEVO'}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? 
                                                            alpha(colors.warning, 0.1) : alpha(colors.success, 0.1),
                                                        color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? 
                                                            colors.warning : colors.success,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getEstadoIcon(producto.estado, esPrestamo)}
                                                    label={estadoMostrar}
                                                    size="small"
                                                    sx={{ 
                                                        backgroundColor: alpha(estadoColor, 0.1), 
                                                        color: estadoColor,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {producto.colaborador_asignado && !producto.fecha_baja && !producto.fecha_donacion ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(colors.primary, 0.1), fontSize: '0.75rem' }}>
                                                            {producto.colaborador_asignado.nombre?.charAt(0) || '?'}
                                                        </Avatar>
                                                        <Typography variant="body2">
                                                            {producto.colaborador_asignado.nombre}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ minWidth: 220, width: 220, px: 0.5, whiteSpace: 'nowrap' }}>
                                                <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center" flexWrap="nowrap">
                                                    <Tooltip title="Ver detalles">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenDetail(producto)}
                                                            sx={{ color: colors.info, p: '3px' }}
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Editar">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenForm(producto)}
                                                            sx={{ color: colors.primary, p: '3px' }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    

                                                    
                                                    <Tooltip title="Ver historial de uso">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleOpenHistorial(producto)}
                                                            sx={{ color: colors.secondary, p: '3px' }}
                                                        >
                                                            <HistoryIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    {producto.es_granel && (
                                                         <Tooltip title="Entregar / Descontar Stock">
                                                             <IconButton 
                                                                 size="small" 
                                                                 onClick={() => {
                                                                     setProductoParaDescontar(producto);
                                                                     setOpenDescontarStock(true);
                                                                 }}
                                                                 sx={{ color: '#7C3AED', p: '3px' }}
                                                             >
                                                                 <RemoveCircleOutlineIcon fontSize="small" />
                                                             </IconButton>
                                                         </Tooltip>
                                                     )}
                                                    
                                                    {esAptoParaQR(producto) && (
                                                        <Tooltip title="Generar / Ver Código QR">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleOpenQRModal(producto)}
                                                                sx={{ color: '#7C3AED', p: '3px', '&:hover': { bgcolor: alpha('#7C3AED', 0.1) } }}
                                                            >
                                                                <QrCodeIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title="Dar de baja / Donar">
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleEliminarDonar(producto)}
                                                            sx={{ color: colors.error, p: '3px' }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredProductos.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Filas"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                    />
                </StyledTableContainer>

                <ProductoDetailDialog
                    open={openDetail}
                    onClose={handleCloseDetail}
                    producto={selectedProductoDetail}
                    getImageUrl={getImageUrl}
                    historialUso={historialUso}
                    historialMantenciones={historialMantenciones}
                />

                <ProductoForm
                    open={openForm}
                    onClose={handleCloseForm}
                    producto={selectedProducto}
                    onSave={handleSaveProducto}
                />

                <DisposicionDialog
                    open={openDisposicion}
                    onClose={handleCloseDisposicion}
                    producto={productoParaDisposicion}
                    onSuccess={handleDisposicionSuccess}
                />

                <ConfirmDeleteDialog
                    open={openConfirmDelete}
                    onClose={() => setOpenConfirmDelete(false)}
                    producto={selectedProducto}
                    onConfirm={handleDelete}
                />

                <HistorialUsoDialog
                    open={openHistorial}
                    onClose={handleCloseHistorial}
                    producto={productoParaHistorial}
                    historial={historialUso}
                />

                <AsignacionColaboradorDialog
                    open={openAsignacion}
                    onClose={handleCloseAsignacion}
                    producto={productoParaAsignar}
                    onSuccess={handleAsignacionSuccess}
                />
                
                <DescontarStockDialog
                    open={openDescontarStock}
                    onClose={() => setOpenDescontarStock(false)}
                    producto={productoParaDescontar}
                    onSuccess={(msg) => {
                        showSnackbar(msg, 'success');
                        fetchData(false);
                    }}
                />

                <ProductoQRModal
                    open={openQRModal}
                    onClose={handleCloseQRModal}
                    producto={productoParaQR}
                />

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

export default Productos;