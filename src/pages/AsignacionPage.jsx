// src/pages/AsignacionPage.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
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
    ToggleButton,
    ToggleButtonGroup,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    LinearProgress,
    Checkbox,
    FormControlLabel,
    Divider,
    RadioGroup,
    Radio,
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
    Assignment as AssignmentIcon,
    Check as CheckIcon,
    Home as HomeIcon,
    FilterListOff as FilterListOffIcon,
    Store as StoreIcon,
    Add as AddIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Description as DescriptionIcon,
    CheckBox as CheckBoxIcon,
    Clear as ClearIcon,
    Outbox as OutboxIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Warehouse as WarehouseIcon,
    People as PeopleIcon,
    Build as BuildIcon,
    Inventory2 as Inventory2Icon,
    History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import colaboradorService from '../services/colaboradorService';
import RecepcionDialog from '../components/RecepcionDialog';
import OfilabFooter from '../components/OfilabFooter';

// ============================================
// COLORES
// ============================================
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

const ESTADO_COLOR = {
    1: '#10B981',
    2: '#F59E0B',
    3: '#3B82F6',
    4: '#EF4444',
    5: '#6B7280',
    6: '#9CA3AF'
};

const getEstadoTexto = (estadoId) => {
    const id = Number(estadoId);
    return ESTADO_TEXTO[id] || 'DESCONOCIDO';
};

const getEstadoColor = (estadoId) => {
    const id = Number(estadoId);
    return ESTADO_COLOR[id] || '#6B7280';
};

// URL BASE
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
console.log('🔧 API_BASE_URL en AsignacionPage:', API_BASE_URL);

// ============================================
// CHECKLIST ITEMS
// ============================================
const CHECKLIST_ITEMS = [
    { id: 'equipo_fisico', label: 'Equipo revisado físicamente' },
    { id: 'cargador', label: 'Cargador entregado' },
    { id: 'mouse', label: 'Mouse entregado' },
    { id: 'audifonos', label: 'Audífonos entregados' },
    { id: 'telefono', label: 'Teléfono entregado / Celular' },
    { id: 'esim', label: 'E-Sim / Chip de datos' },
    { id: 'windows_actualizado', label: 'Windows actualizado' },
    { id: 'drivers', label: 'Drivers instalados' },
    { id: 'dominio', label: 'Equipo agregado dominio' },
    { id: 'usuario_configurado', label: 'Usuario configurado' },
    { id: 'outlook', label: 'Outlook configurado' },
    { id: 'mfa', label: 'MFA habilitado' },
    { id: 'teams', label: 'Teams instalado' },
    { id: 'onedrive', label: 'OneDrive funcionando' },
    { id: 'softland', label: 'Softland instalado' },
    { id: 'unidad_red', label: 'Unidad red Softland' },
    { id: 'vpn', label: 'VPN instalada' },
    { id: 'vpn_validada', label: 'VPN validada' },
    { id: 'internet', label: 'Internet validado' },
    { id: 'recursos_internos', label: 'Acceso recursos internos' },
    { id: 'antivirus', label: 'Antivirus operativo' },
    { id: 'firewall', label: 'Firewall activo' }
];

// ============================================
// FUNCIÓN PARA GENERAR CHECKLIST
// ============================================
const generarPDFChecklist = async (checklistData, producto, colaborador, ticketInfo, especificacionesTecnicas, firmaTrabajador, firmaGerente) => {
    try {
        const payload = {
            id_asignacion: Date.now(),
            colaborador: {
                nombre: colaborador?.nombre || '',
                rut: colaborador?.rut || '',
                cargo: colaborador?.cargo || '',
                departamento: colaborador?.departamento || '',
                empresa: colaborador?.empresa || ''
            },
            productos: [{
                nombre: producto?.nombre || '',
                marca: producto?.marca || '',
                modelo: producto?.modelo || '',
                numero_serie: producto?.numero_serie || '',
                condicion: producto?.condicion || ''
            }],
            fecha_asignacion: new Date().toISOString(),
            ticketInfo: ticketInfo || {},
            especificacionesTecnicas: especificacionesTecnicas || {},
            checklistData: checklistData,
            items: checklistData?.items,
            firma_trabajador: firmaTrabajador || colaborador?.nombre || '',
            firma_gerente: firmaGerente || 'María Eugenia Nabalón'
        };

        const response = await fetch(`${API_BASE_URL}/asignaciones/generar-acta-asignacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error al generar el PDF del servidor (${response.status})`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const nombreColaborador = (colaborador?.nombre || 'Colaborador').replace(/\s+/g, '_');
        const filename = `Checklist_Entrega_${nombreColaborador}_${Date.now()}.pdf`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error generando PDF de checklist:', error);
        return false;
    }
};

// ============================================
// COMPONENTE DE FIRMA DIBUJADA
// ============================================
const FirmaDibujadaComponent = ({ onFirmaGuardada, label, height = 120 }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault();
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const ctx = canvas.getContext('2d');
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const ctx = canvas.getContext('2d');
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSignature) {
            const canvas = canvasRef.current;
            const firmaData = canvas.toDataURL('image/png');
            onFirmaGuardada(firmaData);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setHasSignature(false);
        onFirmaGuardada('');
    };

    return (
        <Box sx={{ textAlign: 'center', border: '1px solid #ddd', p: 2, borderRadius: 1, bgcolor: '#fafafa', mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
            <canvas
                ref={canvasRef}
                width={450}
                height={height}
                style={{
                    border: `2px solid #000`,
                    backgroundColor: 'white',
                    cursor: 'crosshair',
                    width: '100%',
                    height: 'auto',
                    touchAction: 'none'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <Button size="small" variant="outlined" startIcon={<ClearIcon />} onClick={clearCanvas} sx={{ mt: 1, borderRadius: 0 }}>Limpiar Firma</Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Dibuje su firma en el recuadro</Typography>
        </Box>
    );
};

// ============================================
// COMPONENTE DE DIÁLOGO CON CHECKLIST INTEGRADO
// ============================================
const AsignacionConChecklistDialog = ({ open, onClose, producto, tipoAccion, onSuccess }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [checklistItems, setChecklistItems] = useState(CHECKLIST_ITEMS.map(item => ({ ...item, ok: false, observacion: '' })));
    const [usuarioConforme, setUsuarioConforme] = useState(false);
    const [ticketInfo, setTicketInfo] = useState({
        ticket: '',
        fecha: new Date().toISOString().split('T')[0],
        tecnico: ''
    });
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [especificacionesTecnicas, setEspecificacionesTecnicas] = useState({
        cpu: '',
        ram: '',
        disco: '',
        gpu: '',
        tipo: ''
    });
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('María Eugenia Nabalón');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setTicketInfo(prev => ({ ...prev, tecnico: user.nombre || user.usuario || 'Técnico' }));
            setShowSuccess(false);
            setActiveStep(0);
            setError('');
            setColaboradorSeleccionado(null);
            setMotivo('');
            setObservaciones('');
            setUsuarioConforme(false);
            setChecklistItems(CHECKLIST_ITEMS.map(item => ({ ...item, ok: false, observacion: '' })));
            setFirmaTrabajadorText('');
            setFirmaGerenteText('María Eugenia Nabalón');
            setFirmaTrabajadorDibujo('');
            setFirmaGerenteDibujo('');
        }
    }, [open]);

    const cargarColaboradores = async () => {
        try {
            const response = await colaboradorService.getColaboradores({ estado: 'ACTIVO' });
            setColaboradores(response || []);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
        }
    };

    const colaboradoresFiltrados = colaboradores.filter(col => 
        col.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckChange = (index) => {
        const newItems = [...checklistItems];
        newItems[index].ok = !newItems[index].ok;
        setChecklistItems(newItems);
    };

    const handleObservacionChange = (index, value) => {
        const newItems = [...checklistItems];
        newItems[index].observacion = value;
        setChecklistItems(newItems);
    };

    const calcularProgreso = () => {
        const totalItems = checklistItems.length;
        const itemsRevisados = checklistItems.filter(item => item.ok || (item.observacion && item.observacion.trim().length > 0)).length;
        return totalItems > 0 ? (itemsRevisados / totalItems) * 100 : 0;
    };

    const getFirmaTrabajadorFinal = () => tipoFirmaTrabajador === 'dibujo' ? firmaTrabajadorDibujo || '' : firmaTrabajadorText;
    const getFirmaGerenteFinal = () => tipoFirmaGerente === 'dibujo' ? firmaGerenteDibujo || '' : firmaGerenteText;

    const handleNext = () => {
        if (activeStep === 0 && !colaboradorSeleccionado) {
            setError('Debe seleccionar un colaborador');
            return;
        }
        if (activeStep === 0 && !usuarioConforme) {
            setError('El usuario debe confirmar la conformidad');
            return;
        }
        setError('');
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    // FUNCIÓN PARA DESCARGAR ACTA DE ASIGNACIÓN (IGUAL QUE RECEPCIÓN)
    const descargarActaAsignacion = async (asignacionId) => {
        try {
            console.log(`📤 Descargando acta de asignación para ${asignacionId}...`);
            
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/asignaciones/descargar-acta/${asignacionId}`;
            console.log('📡 URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `acta_asignacion_${asignacionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            console.log('✅ Acta de asignación descargada');
            return { success: true };
        } catch (error) {
            console.error('❌ Error descargando acta de asignación:', error);
            return { success: false, error };
        }
    };

    const handleFinalizar = async () => {
        if (!colaboradorSeleccionado) {
            setError('Debe seleccionar un colaborador');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userStr = localStorage.getItem('user');
            let usuarioResponsable = 'Sistema';
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    usuarioResponsable = user.nombre || user.usuario || 'Sistema';
                } catch (e) {
                    usuarioResponsable = userStr;
                }
            }

            const checklistData = {
                producto: {
                    id: producto.id,
                    nombre: producto.nombre,
                    marca: producto.marca,
                    modelo: producto.modelo,
                    numero_serie: producto.numero_serie,
                    condicion: producto.condicion
                },
                colaborador: {
                    id: colaboradorSeleccionado.id,
                    nombre: colaboradorSeleccionado.nombre,
                    rut: colaboradorSeleccionado.rut,
                    cargo: colaboradorSeleccionado.cargo,
                    departamento: colaboradorSeleccionado.departamento,
                    usuario: colaboradorSeleccionado.usuario || colaboradorSeleccionado.nombre?.split(' ')[0]?.toLowerCase(),
                    clave: colaboradorSeleccionado.clave || '********'
                },
                items: checklistItems,
                usuarioConforme,
                fecha: new Date().toISOString(),
                ticketInfo: ticketInfo,
                especificacionesTecnicas: especificacionesTecnicas
            };
            
            localStorage.setItem(`checklist_producto_${producto.id}`, JSON.stringify(checklistData));
            localStorage.setItem(`checklist_fecha_${producto.id}`, new Date().toISOString());

            // Guardar checklist en el backend
            try {
                await api.post('/documentos/checklist', {
                    producto_id: producto.id,
                    checklistData
                });
                console.log('✅ Checklist guardado en el servidor');
            } catch (errCheck) {
                console.error('Error guardando checklist en backend:', errCheck);
            }

            // 1. Generar y descargar CHECKLIST DE ENTREGA Y PREPARACIÓN DE EQUIPO (con V°B° de María Eugenia Nabalón)
            await generarPDFChecklist(
                checklistData, 
                producto, 
                {
                    ...colaboradorSeleccionado,
                    usuario: colaboradorSeleccionado.usuario || colaboradorSeleccionado.nombre?.split(' ')[0]?.toLowerCase(),
                    clave: colaboradorSeleccionado.clave || '********'
                }, 
                ticketInfo, 
                especificacionesTecnicas,
                getFirmaTrabajadorFinal(),
                getFirmaGerenteFinal()
            );
            
            console.log('✅ Checklist de entrega descargado');

            if (tipoAccion === 'prestamo') {
                const prestamoResponse = await api.post('/asignaciones', {
                    producto_id: producto.id,
                    colaborador_id: colaboradorSeleccionado.id,
                    motivo: 'PRÉSTAMO TEMPORAL DE EQUIPO',
                    observaciones: observaciones || `Préstamo registrado el ${new Date().toLocaleDateString()}`,
                    fecha_asignacion: new Date().toISOString(),
                    usuario_responsable: usuarioResponsable,
                    es_prestamo: true
                });

                if (prestamoResponse.data?.success || prestamoResponse.data?.id) {
                    setShowSuccess(true);
                    setLoading(false);
                    setTimeout(() => {
                        if (onSuccess) {
                            onSuccess({ success: true, message: '✅ Préstamo registrado exitosamente', es_prestamo: true });
                        }
                        onClose();
                    }, 2000);
                } else {
                    throw new Error(prestamoResponse.data?.message || 'Error al registrar préstamo');
                }
                return;
            }

            // 2. Crear asignación y registrar checklist oficial en servidor
            const asignacionResponse = await api.post('/asignaciones', {
                producto_id: producto.id,
                colaborador_id: colaboradorSeleccionado.id,
                motivo: motivo || 'Asignación de equipo',
                observaciones: observaciones,
                fecha_asignacion: new Date().toISOString(),
                usuario_responsable: usuarioResponsable,
                firma_trabajador: getFirmaTrabajadorFinal(),
                firma_gerente: getFirmaGerenteFinal(),
                es_prestamo: false
            });

            console.log('📝 Respuesta asignación recibida');

            // MOSTRAR VENTANA DE ÉXITO INMEDIATAMENTE
            setShowSuccess(true);
            setLoading(false);

            let newAsignacionId = null;
            if (asignacionResponse.data?.data?.id || asignacionResponse.data?.id) {
                newAsignacionId = asignacionResponse.data?.data?.id || asignacionResponse.data?.id;
                try {
                    await api.post('/documentos/checklist', {
                        asignacion_id: newAsignacionId,
                        producto_id: producto.id,
                        checklistData
                    });
                } catch (e) {
                    console.log('Error guardando checklist por asignacion_id:', e);
                }
            }

            setTimeout(() => {
                if (onSuccess) {
                    onSuccess({
                        success: true,
                        message: '✅ Asignación completada exitosamente con Checklist de Entrega',
                        asignacion_id: newAsignacionId,
                        es_prestamo: false
                    });
                }
                onClose();
            }, 2000);
        } catch (error) {
            console.error('❌ Error:', error);
            setError(error.response?.data?.message || error.message || 'Error al procesar la transacción');
            setLoading(false);
        }
    };

    const progreso = calcularProgreso();

    // Diálogo de éxito
    if (showSuccess) {
        return (
            <Dialog open={open} onClose={() => {}} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: colors.success, color: 'white', textAlign: 'center', py: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 60, mb: 1 }} />
                    <Typography variant="h5">¡Proceso Exitoso!</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" gutterBottom>
                        {tipoAccion === 'asignacion' 
                            ? 'La asignación se ha completado exitosamente.'
                            : 'El préstamo se ha registrado exitosamente.'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {tipoAccion === 'asignacion' 
                            ? '✅ El checklist y el acta de asignación se están descargando automáticamente.'
                            : '✅ El checklist se ha descargado automáticamente.'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>Cerrando...</Typography>
                    <CircularProgress size={30} sx={{ mt: 2 }} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: alpha(colors.primary, 0.05) }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        {tipoAccion === 'asignacion' ? <AssignmentIcon sx={{ color: colors.primary }} /> : <PersonIcon sx={{ color: colors.warning }} />}
                        <Typography variant="h6" fontWeight={600}>{tipoAccion === 'asignacion' ? 'Asignar Producto' : 'Registrar Préstamo'}</Typography>
                        <Chip label={tipoAccion === 'asignacion' ? 'CON DOCUMENTO' : 'SIN DOCUMENTO'} size="small" sx={{ bgcolor: tipoAccion === 'asignacion' ? colors.primary : colors.warning, color: 'white', fontWeight: 500 }} />
                    </Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Producto: <strong>{producto?.nombre}</strong> | N° Serie: <strong>{producto?.numero_serie || 'N/A'}</strong></Typography>
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
                    <Step>
                        <StepLabel StepIconComponent={() => (<Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.success, 0.1), color: colors.success }}><CheckBoxIcon sx={{ fontSize: 16 }} /></Avatar>)}>
                            <Typography variant="subtitle1" fontWeight={600}>Checklist de Entrega</Typography>
                            <Typography variant="caption" color="text.secondary">Verificar que el equipo está en óptimas condiciones</Typography>
                        </StepLabel>
                        <StepContent>
                            <Box sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" color="text.secondary">Progreso de verificación</Typography>
                                    <Typography variant="body2" fontWeight={600} color={progreso === 100 ? colors.success : colors.primary}>{Math.round(progreso)}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={progreso} sx={{ height: 8, borderRadius: 4 }} />
                            </Box>

                            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Seleccionar Colaborador *</Typography>
                            <TextField fullWidth size="small" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ mb: 2 }} />
                            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                                {colaboradoresFiltrados.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: 'center' }}><Typography color="text.secondary">No hay colaboradores</Typography></Box>
                                ) : (
                                    colaboradoresFiltrados.map((col) => (
                                        <Box key={col.id} sx={{ p: 1.5, borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', bgcolor: colaboradorSeleccionado?.id === col.id ? alpha(colors.primary, 0.05) : 'transparent', '&:hover': { bgcolor: alpha(colors.primary, 0.02) } }} onClick={() => setColaboradorSeleccionado(col)}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(colors.primary, 0.1) }}>{col.nombre?.charAt(0) || '?'}</Avatar>
                                                <Box flex={1}>
                                                    <Typography variant="body2" fontWeight={500}>{col.nombre}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{col.rut} | {col.cargo || 'Sin cargo'}</Typography>
                                                </Box>
                                                {colaboradorSeleccionado?.id === col.id && <CheckCircleIcon sx={{ color: colors.success, fontSize: 18 }} />}
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Paper>

                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Verificación del Equipo *</Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: 400, overflow: 'auto' }}>
                                {checklistItems.map((item, index) => (
                                    <Box key={item.id} sx={{ mb: 2 }}>
                                        <FormControlLabel
                                            control={<Checkbox checked={item.ok} onChange={() => handleCheckChange(index)} size="small" />}
                                            label={<Typography variant="body2" sx={{ fontWeight: item.ok ? 'bold' : 'normal' }}>{item.label}</Typography>}
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Observación"
                                            value={item.observacion}
                                            onChange={(e) => handleObservacionChange(index, e.target.value)}
                                            sx={{ mt: 0.5, ml: 3.5, width: 'calc(100% - 28px)' }}
                                        />
                                    </Box>
                                ))}
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Ticket</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="N° Ticket" size="small" value={ticketInfo.ticket} onChange={(e) => setTicketInfo({ ...ticketInfo, ticket: e.target.value })} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Fecha" size="small" type="date" value={ticketInfo.fecha} onChange={(e) => setTicketInfo({ ...ticketInfo, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Técnico" size="small" value={ticketInfo.tecnico} onChange={(e) => setTicketInfo({ ...ticketInfo, tecnico: e.target.value })} />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Especificaciones Técnicas</Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="CPU" size="small" value={especificacionesTecnicas.cpu} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, cpu: e.target.value })} placeholder="Ej: Intel Core i7-13620H" /></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="RAM" size="small" value={especificacionesTecnicas.ram} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, ram: e.target.value })} placeholder="Ej: 16 GB DDR5 5200 MT/s" /></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Disco" size="small" value={especificacionesTecnicas.disco} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, disco: e.target.value })} placeholder="Ej: SSD 477 GB" /></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="GPU" size="small" value={especificacionesTecnicas.gpu} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, gpu: e.target.value })} placeholder="Ej: Intel UHD Graphics" /></Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Tipo" size="small" value={especificacionesTecnicas.tipo} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, tipo: e.target.value })} placeholder="Ej: Notebook Gama Media" /></Grid>
                                </Grid>
                            </Paper>

                            <FormControlLabel 
                                control={<Checkbox checked={usuarioConforme} onChange={(e) => setUsuarioConforme(e.target.checked)} />} 
                                label="El usuario confirma que el equipo está en buen estado y funciona correctamente" 
                            />

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleNext} disabled={!colaboradorSeleccionado || progreso < 100 || !usuarioConforme} sx={{ borderRadius: 2 }}>Continuar</Button>
                            </Box>
                        </StepContent>
                    </Step>

                    {tipoAccion === 'asignacion' && (
                        <Step>
                            <StepLabel StepIconComponent={() => (<Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}><DescriptionIcon sx={{ fontSize: 16 }} /></Avatar>)}>
                                <Typography variant="subtitle1" fontWeight={600}>Detalles de la Asignación</Typography>
                                <Typography variant="caption" color="text.secondary">Completa la información de la asignación</Typography>
                            </StepLabel>
                            <StepContent>
                                <TextField 
                                    fullWidth 
                                    label="Motivo de asignación *" 
                                    value={motivo} 
                                    onChange={(e) => setMotivo(e.target.value)} 
                                    multiline 
                                    rows={2} 
                                    placeholder="Ej: Proyecto específico, Reemplazo de equipo, etc." 
                                    sx={{ mb: 2 }} 
                                />
                                <TextField 
                                    fullWidth 
                                    label="Observaciones adicionales" 
                                    value={observaciones} 
                                    onChange={(e) => setObservaciones(e.target.value)} 
                                    multiline 
                                    rows={2} 
                                    placeholder="Observaciones importantes sobre la transacción..." 
                                    sx={{ mb: 2 }} 
                                />

                                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Firma del Trabajador / Colaborador *</Typography>
                                <FormControl component="fieldset" sx={{ mb: 2 }}>
                                    <RadioGroup row value={tipoFirmaTrabajador} onChange={(e) => setTipoFirmaTrabajador(e.target.value)}>
                                        <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                        <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                                    </RadioGroup>
                                </FormControl>
                                {tipoFirmaTrabajador === 'texto' ? (
                                    <TextField 
                                        fullWidth 
                                        multiline 
                                        rows={2} 
                                        placeholder="Escriba el nombre completo de la persona que firma" 
                                        value={firmaTrabajadorText} 
                                        onChange={(e) => setFirmaTrabajadorText(e.target.value)} 
                                        sx={{ mb: 2 }} 
                                        helperText="Ej: Juan Pérez Pérez, RUT: 12.345.678-9" 
                                    />
                                ) : (
                                    <FirmaDibujadaComponent onFirmaGuardada={setFirmaTrabajadorDibujo} label="Firma del Trabajador" />
                                )}

                                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Visto Bueno (V°B°) Gerente de Tecnología *</Typography>
                                <FormControl component="fieldset" sx={{ mb: 2 }}>
                                    <RadioGroup row value={tipoFirmaGerente} onChange={(e) => setTipoFirmaGerente(e.target.value)}>
                                        <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                        <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                                    </RadioGroup>
                                </FormControl>
                                {tipoFirmaGerente === 'texto' ? (
                                    <TextField 
                                        fullWidth 
                                        multiline 
                                        rows={2} 
                                        placeholder="Nombre del Gerente de Tecnología" 
                                        value={firmaGerenteText} 
                                        onChange={(e) => setFirmaGerenteText(e.target.value)} 
                                        sx={{ mb: 2 }} 
                                        helperText="Nombre predeterminado: María Eugenia Nabalón, Gerente de Tecnología e Innovación" 
                                    />
                                ) : (
                                    <FirmaDibujadaComponent onFirmaGuardada={setFirmaGerenteDibujo} label="Firma V°B° Gerente" />
                                )}

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button onClick={handleBack} variant="outlined">Atrás</Button>
                                    <Button 
                                        variant="contained" 
                                        onClick={handleFinalizar} 
                                        disabled={!motivo.trim() || (tipoFirmaTrabajador === 'texto' && !firmaTrabajadorText) || (tipoFirmaGerente === 'texto' && !firmaGerenteText) || loading} 
                                        sx={{ borderRadius: 2, bgcolor: colors.primary }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Finalizar Asignación'}
                                    </Button>
                                </Box>
                            </StepContent>
                        </Step>
                    )}

                    {tipoAccion === 'prestamo' && activeStep === 1 && (
                        <Step active={true}>
                            <StepLabel StepIconComponent={() => (<Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.success, 0.1), color: colors.success }}><CheckCircleIcon sx={{ fontSize: 16 }} /></Avatar>)}>
                                <Typography variant="subtitle1" fontWeight={600}>Confirmar Préstamo</Typography>
                            </StepLabel>
                            <StepContent>
                                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}><Typography variant="body2"><strong>ℹ️ Préstamo sin documento:</strong> Este préstamo se registrará en el sistema. El checklist se descargará automáticamente.</Typography></Alert>
                                <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 2 }}>
                                    <Button onClick={handleBack} variant="outlined">Atrás</Button>
                                    <Button variant="contained" onClick={handleFinalizar} disabled={loading} sx={{ bgcolor: colors.warning }}>{loading ? <CircularProgress size={24} /> : 'Registrar Préstamo'}</Button>
                                </Box>
                            </StepContent>
                        </Step>
                    )}
                </Stepper>
                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions><Button onClick={onClose} variant="outlined">Cancelar</Button></DialogActions>
        </Dialog>
    );
};

// ============================================
// COMPONENTES STYLED
// ============================================
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%', borderRadius: 0, backgroundColor: theme.palette.background.paper, border: `1px solid ${colors.border}`, transition: 'all 0.3s ease-in-out',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
}));

const FilterPaper = styled(Paper)(({ theme }) => ({ padding: theme.spacing(2), marginBottom: theme.spacing(3), borderRadius: 0, backgroundColor: theme.palette.background.paper, border: `1px solid ${colors.border}` }));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({ borderRadius: 0, border: `1px solid ${colors.border}`, overflowX: 'auto', backgroundColor: theme.palette.background.paper }));

const StyledTableCell = styled(TableCell)(({ theme }) => ({ fontWeight: 600, backgroundColor: alpha(colors.primary, 0.02), borderBottom: `1px solid ${colors.border}` }));

// ============================================
// COMPONENTE PARA EDITAR CHECKLIST Y FIRMAS
// ============================================
const EditarChecklistDialog = ({ open, onClose, asignacion, producto, onChecklistGuardado }) => {
    const [items, setItems] = useState([]);
    const [nuevoItemLabel, setNuevoItemLabel] = useState('');
    const [especificaciones, setEspecificaciones] = useState({ cpu: '', ram: '', disco: '', gpu: '', tipo: '' });
    const [ticketInfo, setTicketInfo] = useState({ ticket: '', tecnico: '' });
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('María Eugenia Nabalón');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && asignacion) {
            cargarDatos();
        }
    }, [open, asignacion]);

    const cargarDatos = async () => {
        let dataPrev = null;
        try {
            const res = await api.get(`/documentos/checklist/${asignacion.id}`);
            if (res.data?.success && res.data.data) {
                dataPrev = res.data.data;
            }
        } catch (e) {
            console.log('No hay checklist previo en backend');
        }

        if (dataPrev) {
            setItems(dataPrev.items || CHECKLIST_ITEMS.map(i => ({ ...i, ok: true, observacion: '' })));
            setEspecificaciones(dataPrev.especificacionesTecnicas || { cpu: 'Intel Core i5/i7', ram: '16 GB', disco: '512 GB SSD', gpu: 'Integrada', tipo: producto?.condicion || 'Notebook Standard' });
            setTicketInfo(dataPrev.ticketInfo || { ticket: '', tecnico: asignacion.usuario_responsable || 'Técnico TI' });
            setFirmaTrabajadorText(dataPrev.firmaTrabajador || asignacion.colaborador_nombre || '');
            setFirmaGerenteText(dataPrev.firmaGerente || 'María Eugenia Nabalón');
        } else {
            setItems(CHECKLIST_ITEMS.map(i => ({ ...i, ok: true, observacion: '' })));
            setEspecificaciones({ cpu: 'Intel Core i5/i7', ram: '16 GB', disco: '512 GB SSD', gpu: 'Integrada', tipo: producto?.condicion || 'Notebook Standard' });
            setTicketInfo({ ticket: '', tecnico: asignacion.usuario_responsable || 'Técnico TI' });
            setFirmaTrabajadorText(asignacion.colaborador_nombre || '');
            setFirmaGerenteText('María Eugenia Nabalón');
        }
    };

    const handleAgregarItemPersonalizado = () => {
        if (!nuevoItemLabel.trim()) return;
        const newItem = {
            id: `custom_${Date.now()}`,
            label: nuevoItemLabel.trim(),
            ok: true,
            observacion: 'Agregado manualmente'
        };
        setItems([...items, newItem]);
        setNuevoItemLabel('');
    };

    const getFirmaTrabajadorFinal = () => tipoFirmaTrabajador === 'dibujo' ? firmaTrabajadorDibujo || '' : firmaTrabajadorText;
    const getFirmaGerenteFinal = () => tipoFirmaGerente === 'dibujo' ? firmaGerenteDibujo || '' : firmaGerenteText;

    const handleGuardar = async () => {
        setSaving(true);
        try {
            const checklistPayload = {
                fecha: new Date().toISOString(),
                items,
                especificacionesTecnicas: especificaciones,
                ticketInfo,
                usuarioConforme: true,
                firmaTrabajador: getFirmaTrabajadorFinal(),
                firmaGerente: getFirmaGerenteFinal(),
                producto,
                colaborador: {
                    nombre: asignacion.colaborador_nombre,
                    rut: asignacion.colaborador_rut,
                    cargo: asignacion.colaborador_cargo,
                    departamento: asignacion.colaborador_departamento
                }
            };

            try {
                await api.post('/documentos/checklist', {
                    asignacion_id: asignacion.id,
                    producto_id: producto.id,
                    checklistData: checklistPayload
                });
            } catch (err) {
                console.warn('Error guardando en backend, continuando local:', err);
            }

            await generarPDFChecklist(
                checklistPayload,
                producto,
                {
                    nombre: asignacion.colaborador_nombre,
                    rut: asignacion.colaborador_rut,
                    cargo: asignacion.colaborador_cargo,
                    departamento: asignacion.colaborador_departamento,
                    usuario: asignacion.colaborador_email?.split('@')[0] || 'usuario',
                    clave: '********'
                },
                ticketInfo,
                especificaciones,
                getFirmaTrabajadorFinal(),
                getFirmaGerenteFinal()
            );

            if (onChecklistGuardado) onChecklistGuardado(checklistPayload);
            onClose();
        } catch (error) {
            console.error('Error guardando checklist editado:', error);
            alert('Ocurrió un error al guardar el checklist');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: alpha(colors.primary, 0.05) }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>✏️ Editar Checklist de Entrega y Firmas</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: colors.primary }}>
                    1. Items de Verificación (Checklist)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3, maxHeight: 260, overflow: 'auto' }}>
                    <Grid container spacing={1.5}>
                        {items.map((item, idx) => (
                            <Grid item xs={12} key={item.id || idx}>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Checkbox 
                                        checked={item.ok} 
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[idx].ok = e.target.checked;
                                            setItems(newItems);
                                        }} 
                                        color="success"
                                    />
                                    <Typography variant="body2" sx={{ minWidth: 200, fontWeight: 500 }}>{item.label}</Typography>
                                    <TextField 
                                        size="small" 
                                        placeholder="Observación..." 
                                        value={item.observacion || ''} 
                                        onChange={(e) => {
                                            const newItems = [...items];
                                            newItems[idx].observacion = e.target.value;
                                            setItems(newItems);
                                        }}
                                        fullWidth
                                    />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                <Box display="flex" gap={1.5} mb={3}>
                    <TextField 
                        size="small" 
                        fullWidth 
                        placeholder="Escriba un item adicional si faltó algo (Ej: Adaptador DisplayPort, Teclado Mecánico...)" 
                        value={nuevoItemLabel} 
                        onChange={(e) => setNuevoItemLabel(e.target.value)} 
                    />
                    <Button 
                        variant="outlined" 
                        onClick={handleAgregarItemPersonalizado}
                        disabled={!nuevoItemLabel.trim()}
                        sx={{ whiteSpace: 'nowrap', borderRadius: 2 }}
                    >
                        + Agregar Item
                    </Button>
                </Box>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: colors.primary }}>
                    2. Especificaciones Técnicas y Ticket
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="CPU" value={especificaciones.cpu} onChange={(e) => setEspecificaciones({ ...especificaciones, cpu: e.target.value })} /></Grid>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="RAM" value={especificaciones.ram} onChange={(e) => setEspecificaciones({ ...especificaciones, ram: e.target.value })} /></Grid>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="Disco" value={especificaciones.disco} onChange={(e) => setEspecificaciones({ ...especificaciones, disco: e.target.value })} /></Grid>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="GPU" value={especificaciones.gpu} onChange={(e) => setEspecificaciones({ ...especificaciones, gpu: e.target.value })} /></Grid>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="Tipo de Equipo" value={especificaciones.tipo} onChange={(e) => setEspecificaciones({ ...especificaciones, tipo: e.target.value })} /></Grid>
                        <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="N° Ticket" value={ticketInfo.ticket} onChange={(e) => setTicketInfo({ ...ticketInfo, ticket: e.target.value })} /></Grid>
                    </Grid>
                </Paper>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: colors.primary }}>
                    3. Firmas y V°B°
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Firma del Colaborador *</Typography>
                            <RadioGroup row value={tipoFirmaTrabajador} onChange={(e) => setTipoFirmaTrabajador(e.target.value)}>
                                <FormControlLabel value="texto" control={<Radio />} label="Texto" />
                                <FormControlLabel value="dibujo" control={<Radio />} label="Dibujo Digital" />
                            </RadioGroup>
                            {tipoFirmaTrabajador === 'texto' ? (
                                <TextField fullWidth size="small" value={firmaTrabajadorText} onChange={(e) => setFirmaTrabajadorText(e.target.value)} placeholder="Nombre del trabajador..." />
                            ) : (
                                <FirmaDibujadaComponent onFirmaGuardada={setFirmaTrabajadorDibujo} label="Dibuje la firma aquí" />
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>V°B° Gerente de Tecnología *</Typography>
                            <RadioGroup row value={tipoFirmaGerente} onChange={(e) => setTipoFirmaGerente(e.target.value)}>
                                <FormControlLabel value="texto" control={<Radio />} label="Texto" />
                                <FormControlLabel value="dibujo" control={<Radio />} label="Dibujo Digital" />
                            </RadioGroup>
                            {tipoFirmaGerente === 'texto' ? (
                                <TextField fullWidth size="small" value={firmaGerenteText} onChange={(e) => setFirmaGerenteText(e.target.value)} placeholder="María Eugenia Nabalón" />
                            ) : (
                                <FirmaDibujadaComponent onFirmaGuardada={setFirmaGerenteDibujo} label="Dibuje la firma V°B° aquí" />
                            )}
                        </Grid>
                    </Grid>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
                <Button onClick={onClose} variant="outlined">Cancelar</Button>
                <Button 
                    onClick={handleGuardar} 
                    variant="contained" 
                    disabled={saving}
                    sx={{ borderRadius: 2, px: 3, bgcolor: colors.primary }}
                >
                    {saving ? <CircularProgress size={24} /> : 'Guardar y Descargar PDF'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================
// COMPONENTE DE DETALLES CON DOCUMENTOS
// ============================================
const DetallesDialog = ({ open, onClose, asignacion, producto, onRefresh }) => {
    const [downloading, setDownloading] = useState(false);
    const [documentos, setDocumentos] = useState([]);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);
    const [checklistData, setChecklistData] = useState(null);
    const [openEditarChecklist, setOpenEditarChecklist] = useState(false);

    const esPrestamo = asignacion?.es_prestamo === true || asignacion?.es_prestamo === 1;

    useEffect(() => {
        if (open && asignacion) {
            cargarDocumentos();
            cargarChecklist();
        }
    }, [open, asignacion]);

    const cargarDocumentos = async () => {
        setLoadingDocumentos(true);
        try {
            const docs = [];
            const token = localStorage.getItem('token');
            
            // Buscar acta de asignación
            try {
                const response = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/asignacion`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                console.log('📋 Documentos encontrados:', data);
                
                if (data.success && data.data?.filename) {
                    docs.push({ tipo: 'asignacion', nombre: 'Checklist de Entrega', filename: data.data.filename });
                } else if (data.filename) {
                    docs.push({ tipo: 'asignacion', nombre: 'Checklist de Entrega', filename: data.filename });
                }
            } catch (err) {
                console.log('No se encontró acta de asignación');
            }
            
            // Buscar acta de recepción
            if (asignacion.fecha_devolucion) {
                try {
                    const response = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/recepcion`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success && data.data?.filename) {
                        docs.push({ tipo: 'recepcion', nombre: 'Acta de Recepción', filename: data.data.filename });
                    } else if (data.filename) {
                        docs.push({ tipo: 'recepcion', nombre: 'Acta de Recepción', filename: data.filename });
                    }
                } catch (err) {
                    console.log('No se encontró acta de recepción');
                }
            }
            setDocumentos(docs);
        } catch (error) {
            console.error('Error cargando documentos:', error);
        } finally {
            setLoadingDocumentos(false);
        }
    };

    const cargarChecklist = async () => {
        try {
            let resChecklist = null;
            if (asignacion?.id) {
                try {
                    resChecklist = await api.get(`/documentos/checklist/${asignacion.id}`);
                } catch (e) {
                    console.log('Sin checklist backend por ID asignación');
                }
            }
            if (!resChecklist?.data?.success && asignacion?.producto_id) {
                try {
                    resChecklist = await api.get(`/documentos/checklist/${asignacion.producto_id}`);
                } catch (e) {
                    console.log('Sin checklist backend por ID producto');
                }
            }

            if (resChecklist?.data?.success && resChecklist.data.data) {
                setChecklistData(resChecklist.data.data);
                return;
            }

            const checklistGuardado = localStorage.getItem(`checklist_producto_${asignacion.producto_id}`);
            if (checklistGuardado) {
                setChecklistData(JSON.parse(checklistGuardado));
            }
        } catch (error) {
            console.error('Error cargando checklist:', error);
        }
    };


    const handleDescargarDocumento = async (filename, tipoDoc) => {
        if (!filename || downloading) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const downloadUrl = `${API_BASE_URL}/asignaciones/descargar/${encodeURIComponent(filename)}`;
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando:', error);
            alert(`Error al descargar el ${tipoDoc}`);
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    const handleDescargarChecklist = async () => {
        const dataToUse = checklistData || {
            items: CHECKLIST_ITEMS.map(i => ({ ...i, ok: true, observacion: '' })),
            usuarioConforme: true,
            ticketInfo: { ticket: '', tecnico: asignacion?.usuario_responsable || 'Técnico TI' },
            especificacionesTecnicas: { cpu: 'N/A', ram: 'N/A', disco: 'N/A', gpu: 'N/A', tipo: producto?.condicion || 'Notebook Standard' }
        };
        await generarPDFChecklist(
            dataToUse, 
            producto, 
            {
                nombre: asignacion?.colaborador_nombre,
                rut: asignacion?.colaborador_rut,
                cargo: asignacion?.colaborador_cargo,
                departamento: asignacion?.colaborador_departamento,
                usuario: asignacion?.colaborador_email?.split('@')[0] || 'usuario',
                clave: '********'
            }, 
            dataToUse.ticketInfo || { ticket: '', tecnico: asignacion?.usuario_responsable || 'Técnico TI' },
            dataToUse.especificacionesTecnicas || { cpu: 'N/A', ram: 'N/A', disco: 'N/A', gpu: 'N/A', tipo: 'Standard' },
            asignacion?.firma_trabajador,
            asignacion?.firma_gerente || 'María Eugenia Nabalón'
        );
    };

    if (!open || !producto || !asignacion) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1) }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary }}><AssignmentIcon /></Avatar>
                        <Typography variant="h6" fontWeight={600}>Detalles de {esPrestamo ? 'Préstamo' : 'Asignación'}</Typography>
                        {esPrestamo && <Chip label="PRÉSTAMO" size="small" sx={{ bgcolor: colors.warning, color: 'white' }} />}
                    </Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Equipo</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">Producto:</Typography><Typography variant="body2" fontWeight={600}>{producto?.nombre}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">N° Serie:</Typography><Typography variant="body2" fontFamily="monospace">{producto?.numero_serie || 'N/A'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Marca:</Typography><Typography variant="body2">{producto?.marca || '-'}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Modelo:</Typography><Typography variant="body2">{producto?.modelo || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Colaborador</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={12}><Typography variant="caption">Nombre:</Typography><Typography variant="body2" fontWeight={600}>{asignacion?.colaborador_nombre}</Typography></Grid>
                                <Grid item xs={12}><Typography variant="caption">RUT:</Typography><Typography variant="body2">{asignacion?.colaborador_rut || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Detalles de la Operación</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">IDENTIFICACIÓN:</Typography><Typography variant="body2" fontFamily="monospace">{asignacion?.id}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">Fecha:</Typography><Typography variant="body2">{new Date(asignacion?.fecha_asignacion).toLocaleDateString()}</Typography></Grid>
                                <Grid item xs={12}><Typography variant="caption">Motivo:</Typography><Typography variant="body2">{asignacion?.motivo || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Documentos de Asignación</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" flexDirection="column" gap={1.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: alpha(colors.primary, 0.04), borderRadius: 1.5, border: `1px solid ${alpha(colors.primary, 0.2)}` }}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 36, height: 36 }}>
                                            <DescriptionIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>Checklist de Entrega y Asignación</Typography>
                                            <Typography variant="caption" color="text.secondary">Documento oficial con Firma del Colaborador y V°B° Gerencial</Typography>
                                        </Box>
                                    </Box>
                                    <Box display="flex" gap={1}>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            startIcon={<EditIcon />} 
                                            onClick={() => setOpenEditarChecklist(true)} 
                                            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, px: 2 }}
                                        >
                                            Editar Checklist
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="contained" 
                                            startIcon={<DownloadIcon />} 
                                            onClick={handleDescargarChecklist} 
                                            disabled={downloading}
                                            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, px: 2.5, bgcolor: colors.primary }}
                                        >
                                            Descargar
                                        </Button>
                                    </Box>
                                </Box>

                                {documentos.filter(d => d.tipo !== 'asignacion').map((doc) => (
                                    <Box key={doc.filename} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1.5, border: `1px solid ${colors.border}` }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <DescriptionIcon sx={{ color: colors.secondary }} />
                                            <Typography variant="body2" fontWeight={600}>{doc.nombre}</Typography>
                                        </Box>
                                        <Button 
                                            size="small" 
                                            variant="outlined" 
                                            startIcon={<DownloadIcon />} 
                                            onClick={() => handleDescargarDocumento(doc.filename, doc.nombre)} 
                                            disabled={downloading}
                                            sx={{ borderRadius: '20px', textTransform: 'none' }}
                                        >
                                            Descargar
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600, bgcolor: colors.primary }}>
                    Cerrar
                </Button>
            </DialogActions>

            {/* MODAL DE EDICIÓN DE CHECKLIST Y FIRMAS */}
            {openEditarChecklist && (
                <EditarChecklistDialog 
                    open={openEditarChecklist} 
                    onClose={() => setOpenEditarChecklist(false)} 
                    asignacion={asignacion} 
                    producto={producto} 
                    onChecklistGuardado={(newData) => setChecklistData(newData)} 
                />
            )}
        </Dialog>
    );
};

// ============================================
// SERVICIOS LOCALES
// ============================================
const productosServiceLocal = {
    getProductos: async (searchTerm = '', filters = {}) => {
        try {
            let url = '/productos';
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filters.bodega_id) params.append('bodega_id', filters.bodega_id);
            if (params.toString()) url += `?${params.toString()}`;
            const response = await api.get(url);
            return response.data.data || response.data || [];
        } catch (error) { console.error('Error fetching productos:', error); throw error; }
    },
    getBodegas: async () => {
        try { const response = await api.get('/bodegas'); return response.data.data || response.data || []; } 
        catch (error) { console.error('Error fetching bodegas:', error); return []; }
    }
};

// ============================================
// DIÁLOGO PARA DESCONTAR STOCK A GRANEL
// ============================================
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
        const stockActual = producto?.cantidad !== undefined ? producto.cantidad : 1;

        if (isNaN(cantNum) || cantNum <= 0) {
            setError('Ingresa una cantidad válida mayor a 0');
            return;
        }

        if (cantNum > stockActual) {
            setError(`La cantidad a entregar (${cantNum}) no puede superar el stock disponible (${stockActual})`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post(`/productos/${producto.id}/descontar-stock`, {
                cantidad: cantNum,
                observacion: observacion.trim()
            });

            if (response.data && response.data.success) {
                onSuccess(`Se descontaron ${cantNum} unidad(es) de ${producto.nombre} correctamente`);
                onClose();
            } else {
                setError(response.data?.message || 'Error al descontar stock');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    if (!open || !producto) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                <OutboxIcon />
                <Typography variant="h6" fontWeight={700}>Entregar / Descontar Stock a Granel</Typography>
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
                    Esta entrega descontará la cantidad ingresada del inventario y registrará la salida en el historial.
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
                            placeholder="Ej: Entrega a colaborador / Uso en oficina central"
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const AsignacionPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    const drawerWidth = 260;
    const [drawerOpen, setDrawerOpen] = useState(false);
    
    const [productos, setProductos] = useState([]);
    const [asignacionesActivas, setAsignacionesActivas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ bodega_id: '', tipo_estado: 'todos' });
    const [bodegas, setBodegas] = useState([]);
    const [openChecklistDialog, setOpenChecklistDialog] = useState(false);
    const [openRecepcion, setOpenRecepcion] = useState(false);
    const [openDetalles, setOpenDetalles] = useState(false);
    const [openDescontarDialog, setOpenDescontarDialog] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [tipoAccionActual, setTipoAccionActual] = useState(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [apiError, setApiError] = useState(false);

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const handleGoHome = () => navigate('/dashboard');

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true); else setLoading(true);
        setApiError(false);
        try {
            const filterParams = {};
            if (filters.bodega_id) filterParams.bodega_id = filters.bodega_id;
            const productosData = await productosServiceLocal.getProductos(searchTerm, filterParams);
            let todosLosProductos = [];
            if (productosData && Array.isArray(productosData)) { todosLosProductos = productosData; } 
            else if (productosData && productosData.data && Array.isArray(productosData.data)) { todosLosProductos = productosData.data; }
            const productosProcesados = todosLosProductos.map(p => ({ ...p, id_estado_equipo: Number(p.id_estado_equipo) || 1 }));
            const productosFiltrados = productosProcesados.filter(p => p.id_estado_equipo !== 6);
            setProductos(productosFiltrados);
            try {
                const asignacionesResponse = await api.get('/asignaciones/activas');
                let asignaciones = [];
                if (asignacionesResponse.data) {
                    if (asignacionesResponse.data.success && Array.isArray(asignacionesResponse.data.data)) { asignaciones = asignacionesResponse.data.data; } 
                    else if (Array.isArray(asignacionesResponse.data)) { asignaciones = asignacionesResponse.data; }
                }
                const activas = asignaciones.filter(a => !a.fecha_devolucion);
                setAsignacionesActivas(activas);
            } catch (err) { console.error('Error cargando asignaciones:', err); }
            try { const bodegasData = await productosServiceLocal.getBodegas(); setBodegas(bodegasData || []); } 
            catch (err) { console.error('Error cargando bodegas:', err); }
        } catch (error) { console.error('Error cargando datos:', error); setApiError(true); showSnackbar('Error al cargar los datos', 'error'); } 
        finally { setLoading(false); setRefreshing(false); }
    }, [searchTerm, filters.bodega_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        try {
            const productosData = await productosServiceLocal.getProductos(searchTerm, { bodega_id: filters.bodega_id });
            let todosLosProductos = [];
            if (productosData && Array.isArray(productosData)) { todosLosProductos = productosData; } 
            else if (productosData && productosData.data && Array.isArray(productosData.data)) { todosLosProductos = productosData.data; }
            const productosProcesados = todosLosProductos.map(p => ({ ...p, id_estado_equipo: Number(p.id_estado_equipo) || 1 }));
            const productosFiltrados = productosProcesados.filter(p => p.id_estado_equipo !== 6);
            setProductos(productosFiltrados);
            const asignacionesResponse = await api.get('/asignaciones/activas');
            let asignaciones = [];
            if (asignacionesResponse.data) {
                if (asignacionesResponse.data.success && Array.isArray(asignacionesResponse.data.data)) { asignaciones = asignacionesResponse.data.data; } 
                else if (Array.isArray(asignacionesResponse.data)) { asignaciones = asignacionesResponse.data; }
            }
            const activas = asignaciones.filter(a => !a.fecha_devolucion);
            setAsignacionesActivas(activas);
        } catch (error) { console.error('Error refrescando datos:', error); showSnackbar('Error al actualizar los datos', 'error'); } 
        finally { setRefreshing(false); }
    }, [searchTerm, filters.bodega_id]);

    const handleAsignar = (producto) => {
        if (producto.id_estado_equipo !== 1) { showSnackbar(`Este producto no está disponible para asignación. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning'); return; }
        setProductoSeleccionado(producto); setTipoAccionActual('asignacion'); setOpenChecklistDialog(true);
    };

    const handlePrestamo = (producto) => {
        if (producto.id_estado_equipo !== 1) { showSnackbar(`Este producto no está disponible para préstamo. Estado actual: ${getEstadoTexto(producto.id_estado_equipo)}`, 'warning'); return; }
        setProductoSeleccionado(producto); setTipoAccionActual('prestamo'); setOpenChecklistDialog(true);
    };

    const handleRecibir = (producto) => {
        const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
        if (!asignacionActiva) { showSnackbar('No se encontró una asignación activa para este producto', 'error'); return; }
        setProductoSeleccionado(producto); setAsignacionSeleccionada(asignacionActiva); setOpenRecepcion(true);
    };

    const handleVerDetalles = (producto) => {
        const asignacionActiva = asignacionesActivas.find(a => a.producto_id === producto.id);
        if (asignacionActiva) { setAsignacionSeleccionada(asignacionActiva); setProductoSeleccionado(producto); setOpenDetalles(true); } 
        else { showSnackbar('No hay información de asignación para este producto', 'info'); }
    };

    const handleChecklistSuccess = (result) => {
        showSnackbar(result.message || 'Proceso completado exitosamente', 'success');
        setOpenChecklistDialog(false);
        setProductoSeleccionado(null);
        setTipoAccionActual(null);
        setTimeout(() => { refreshData(); }, 500);
    };

    const handleRecepcionSuccess = () => {
        showSnackbar('Recepción completada exitosamente', 'success');
        setOpenRecepcion(false);
        setProductoSeleccionado(null);
        setAsignacionSeleccionada(null);
        refreshData();
    };

    const handleClearFilters = () => { setSearchTerm(''); setFilters({ bodega_id: '', tipo_estado: 'todos' }); };
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
    const handleTipoEstadoChange = (event, newValue) => { if (newValue !== null) { setFilters({ ...filters, tipo_estado: newValue }); setPage(0); } };
    const getAsignacionActiva = (productoId) => {
        const found = asignacionesActivas.find(a => a.producto_id === productoId);
        if (found) return found;
        const prod = productos.find(p => p.id === productoId);
        if (prod && (prod.id_estado_equipo === 2 || prod.colaborador_nombre || prod.colaborador_id || prod.colaborador_asignado || prod.asignacion_id)) {
            return {
                id: prod.asignacion_id || prod.id,
                producto_id: prod.id,
                colaborador_id: prod.colaborador_id || prod.colaborador_asignado?.id,
                colaborador_nombre: prod.colaborador_nombre || prod.colaborador_asignado?.nombre || 'Colaborador Asignado',
                colaborador_rut: prod.colaborador_rut || prod.colaborador_asignado?.rut,
                colaborador_email: prod.colaborador_email || prod.colaborador_asignado?.email,
                colaborador_cargo: prod.colaborador_cargo || prod.colaborador_asignado?.cargo,
                colaborador_departamento: prod.colaborador_departamento || prod.colaborador_asignado?.departamento,
                fecha_asignacion: prod.fecha_asignacion || new Date().toISOString(),
                es_prestamo: prod.es_prestamo === 1 || prod.es_prestamo === true
            };
        }
        return null;
    };

    const filteredProductos = productos.filter(producto => {
        const asignacionActiva = getAsignacionActiva(producto.id);
        const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
        const estaAsignado = producto.id_estado_equipo === 2 || !!asignacionActiva;

        // 1. Filtro por Bodega: los equipos asignados no estan fisicamente en la bodega (-), por lo que no coinciden con ninguna bodega especifica
        if (filters.bodega_id && String(filters.bodega_id) !== '') {
            if (estaAsignado) {
                return false;
            }
            const prodBodegaId = String(producto.bodega_id || producto.id_bodega || '');
            if (prodBodegaId !== String(filters.bodega_id)) {
                return false;
            }
        }

        // 2. Filtro por Búsqueda (searchTerm)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = (
                producto.nombre?.toLowerCase().includes(term) || 
                producto.marca?.toLowerCase().includes(term) || 
                producto.numero_serie?.toLowerCase().includes(term) || 
                (producto.modelo && producto.modelo.toLowerCase().includes(term)) ||
                (producto.colaborador_nombre && producto.colaborador_nombre.toLowerCase().includes(term)) ||
                (asignacionActiva?.colaborador_nombre && asignacionActiva.colaborador_nombre.toLowerCase().includes(term)) ||
                (producto.colaborador_rut && producto.colaborador_rut.toLowerCase().includes(term)) ||
                (asignacionActiva?.colaborador_rut && asignacionActiva.colaborador_rut.toLowerCase().includes(term))
            );
            if (!matchesSearch) return false;
        }

        // 3. Filtro por Estado (disponibles, asignados, préstamos)
        switch (filters.tipo_estado) {
            case 'disponibles': 
                return !estaAsignado && (producto.id_estado_equipo === 1 || !producto.id_estado_equipo);
            case 'asignados': 
                return estaAsignado && !esPrestamo;
            case 'prestamos': 
                return estaAsignado && esPrestamo;
            default: 
                return true;
        }
    });

    const paginatedProductos = filteredProductos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const activeFiltersCount = (filters.bodega_id ? 1 : 0) + (filters.tipo_estado !== 'todos' ? 1 : 0) + (searchTerm ? 1 : 0);
    const totalDisponibles = productos.filter(p => p.id_estado_equipo === 1).length;
    const totalAsignados = productos.filter(p => p.id_estado_equipo === 2).length;
    const totalPrestamos = asignacionesActivas.filter(a => a.es_prestamo === true || a.es_prestamo === 1).length;
    const totalAsignacionesNormales = asignacionesActivas.filter(a => !(a.es_prestamo === true || a.es_prestamo === 1)).length;

    if (loading && productos.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: colors.background }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando sistema de asignaciones...</Typography>
            </Box>
        );
    }

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
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Gestión de Asignaciones</Typography>
                        </Box>
                        <IconButton color="inherit" onClick={() => refreshData()} disabled={refreshing}>{refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton>
                    </Toolbar>
                </AppBar>

                <Toolbar />
            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                {/* Header Banner Cápsula con Botón Azul Ovalado */}
                <Paper sx={{ 
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
                }}>
                    <Box sx={{ pl: { sm: 1 } }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            Gestión de Asignaciones
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Asigna productos a colaboradores con control de inventario
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem' }} />}
                        onClick={() => {
                            const primerDisponible = productos.find(p => p.id_estado_equipo === 1);
                            if (primerDisponible) {
                                handleAsignar(primerDisponible);
                            } else {
                                showSnackbar('No hay productos disponibles para asignar en este momento', 'warning');
                            }
                        }}
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
                        Nueva Asignación
                    </Button>
                </Paper>

                {apiError && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} icon={<ErrorIcon />} action={<Button color="inherit" size="small" onClick={() => refreshData()}>REINTENTAR</Button>}>
                        No se pudo conectar con el servidor. Verifica tu conexión.
                    </Alert>
                )}

                {/* Indicadores reducidos (Asignaciones Activas + Préstamos Activos) */}
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                    <Grid item xs={6} sm={4} md={2.5}>
                        <StyledCard>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.primary }}>
                                    {totalAsignacionesNormales}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Asignaciones Activas
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.5}>
                        <StyledCard>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.warning }}>
                                    {totalPrestamos}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Préstamos Activos
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {/* Filtros */}
                <FilterPaper sx={{ p: 2.5, mb: 3 }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-end">
                        {/* Búsqueda */}
                        <Box sx={{ flex: '2 1 300px', minWidth: 260 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Buscar Equipo / Colaborador
                            </Typography>
                            <TextField 
                                fullWidth 
                                placeholder="Buscar por nombre, marca, modelo o N° serie..." 
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
                                    ) 
                                }} 
                                size="small" 
                            />
                        </Box>

                        {/* Bodega */}
                        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Bodega
                            </Typography>
                            <FormControl fullWidth size="small">
                                <Select 
                                    value={filters.bodega_id} 
                                    onChange={(e) => { setFilters({ ...filters, bodega_id: e.target.value }); setPage(0); }} 
                                    displayEmpty
                                >
                                    <MenuItem value="">Todas las bodegas</MenuItem>
                                    {bodegas.map((b) => (
                                        <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Estado */}
                        <Box sx={{ flex: '1 1 320px', minWidth: 300 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary, mb: 0.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                                Estado de Asignación
                            </Typography>
                            <ToggleButtonGroup 
                                value={filters.tipo_estado} 
                                exclusive 
                                onChange={handleTipoEstadoChange} 
                                size="small" 
                                fullWidth 
                                sx={{ height: 40 }}
                            >
                                <ToggleButton value="todos" sx={{ textTransform: 'none', fontWeight: 600 }}>Todos</ToggleButton>
                                <ToggleButton value="disponibles" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, color: colors.success }} />Disponibles
                                </ToggleButton>
                                <ToggleButton value="asignados" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: colors.primary }} />Asignados
                                </ToggleButton>
                                <ToggleButton value="prestamos" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: colors.warning }} />Préstamos
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Botón Limpiar */}
                        <Box sx={{ flex: '0 0 auto', minWidth: 140 }}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                onClick={handleClearFilters} 
                                disabled={activeFiltersCount === 0} 
                                startIcon={<ClearIcon />}
                                size="small" 
                                sx={{ py: 0.85, height: 40 }}
                            >
                                Limpiar Filtros
                            </Button>
                        </Box>
                    </Stack>
                </FilterPaper>

                <StyledTableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead><TableRow><StyledTableCell>Producto</StyledTableCell><StyledTableCell>Marca</StyledTableCell><StyledTableCell>Modelo</StyledTableCell><StyledTableCell>N° Serie</StyledTableCell><StyledTableCell>Bodega</StyledTableCell><StyledTableCell>Condición</StyledTableCell><StyledTableCell>Estado / Tipo</StyledTableCell><StyledTableCell>Asignado a</StyledTableCell><StyledTableCell align="center">Acciones</StyledTableCell></TableRow></TableHead>
                        <TableBody>
                            {paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography><Typography variant="body2" color="text.secondary">No se encontraron productos con los filtros aplicados</Typography></TableCell></TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
                                    const asignacionActiva = getAsignacionActiva(producto.id);
                                    const esGranel = producto.es_granel === 1 || producto.es_granel === true;
                                    const estaAsignado = producto.id_estado_equipo === 2 || !!asignacionActiva;
                                    const estaDisponible = (producto.id_estado_equipo === 1 || !producto.id_estado_equipo) && !asignacionActiva;
                                    const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
                                    return (<TableRow key={`${producto.id}-${producto.numero_serie || producto.id}`} hover>
                                        <TableCell><Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1) }}><InventoryIcon sx={{ fontSize: 16 }} /></Avatar><Typography variant="body2" fontWeight={500}>{producto.nombre}</Typography></Box></TableCell>
                                        <TableCell>{producto.marca || '-'}</TableCell><TableCell>{producto.modelo || '-'}</TableCell>
                                        <TableCell>
                                            {esGranel ? (
                                                <Chip label={`A GRANEL (${producto.cantidad !== undefined ? producto.cantidad : 1} ud.)`} size="small" sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, fontWeight: 600 }} />
                                            ) : (
                                                <Chip label={producto.numero_serie || 'N/A'} size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {estaAsignado ? (
                                                <Typography variant="body2" color="text.secondary">-</Typography>
                                            ) : (
                                                <Chip icon={<StoreIcon />} label={producto.bodega_nombre || 'Sin bodega'} size="small" sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} />
                                            )}
                                        </TableCell>
                                        <TableCell><Chip label={producto.condicion || 'NUEVO'} size="small" sx={{ backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? alpha(colors.warning, 0.1) : alpha(colors.success, 0.1), color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? colors.warning : colors.success }} /></TableCell>
                                        <TableCell>
                                            {esGranel ? (
                                                <Chip label="A GRANEL / INSUMO" size="small" sx={{ backgroundColor: alpha(colors.secondary, 0.1), color: colors.secondary, fontWeight: 600, fontSize: '0.7rem' }} />
                                            ) : (
                                                <Chip 
                                                    icon={estaAsignado ? (esPrestamo ? <PersonIcon sx={{ fontSize: 13 }} /> : <AssignmentIcon sx={{ fontSize: 13 }} />) : undefined}
                                                    label={estaAsignado ? (esPrestamo ? 'PRÉSTAMO' : 'ASIGNADO') : getEstadoTexto(producto.id_estado_equipo)} 
                                                    size="small" 
                                                    sx={{ 
                                                        backgroundColor: alpha(estaAsignado ? (esPrestamo ? colors.warning : colors.primary) : getEstadoColor(producto.id_estado_equipo), 0.1), 
                                                        color: estaAsignado ? (esPrestamo ? colors.warning : colors.primary) : getEstadoColor(producto.id_estado_equipo), 
                                                        fontWeight: 600, 
                                                        fontSize: '0.75rem' 
                                                    }} 
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{asignacionActiva ? (<Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 24, height: 24, bgcolor: alpha(esPrestamo ? colors.warning : colors.success, 0.1) }}><PersonIcon sx={{ fontSize: 14 }} /></Avatar><Typography variant="body2">{asignacionActiva.colaborador_nombre}</Typography></Box>) : (<Typography variant="body2" color="text.secondary">-</Typography>)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="nowrap">
                                                {esGranel ? (
                                                    <Button variant="contained" size="small" startIcon={<OutboxIcon />} onClick={() => { setProductoSeleccionado(producto); setOpenDescontarDialog(true); }} sx={{ bgcolor: colors.secondary, '&:hover': { bgcolor: alpha(colors.secondary, 0.9) }, borderRadius: 0, minWidth: 120 }}>Descontar Stock</Button>
                                                ) : estaAsignado ? (
                                                    <><Button variant="contained" size="small" startIcon={<ReceiptIcon />} onClick={() => handleRecibir(producto)} sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary, borderRadius: 0, minWidth: 80 }}>Recibir</Button><IconButton size="small" onClick={() => handleVerDetalles(producto)} sx={{ color: esPrestamo ? colors.warning : colors.info }}><VisibilityIcon fontSize="small" /></IconButton></>
                                                ) : estaDisponible ? (
                                                    <><Button variant="contained" size="small" startIcon={<AssignmentIcon />} onClick={() => handleAsignar(producto)} sx={{ bgcolor: colors.primary, borderRadius: 0, minWidth: 80 }}>Asignar</Button><Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={() => handlePrestamo(producto)} sx={{ borderRadius: 0, borderColor: colors.warning, color: colors.warning, minWidth: 80 }}>Préstamo</Button></>
                                                ) : (
                                                    <Button variant="outlined" size="small" disabled sx={{ opacity: 0.5, borderRadius: 0 }}>No disponible</Button>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>);
                                })
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredProductos.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas" />
                </StyledTableContainer>

                <AsignacionConChecklistDialog open={openChecklistDialog} onClose={() => { setOpenChecklistDialog(false); setProductoSeleccionado(null); setTipoAccionActual(null); }} producto={productoSeleccionado} tipoAccion={tipoAccionActual} onSuccess={handleChecklistSuccess} />
                <RecepcionDialog open={openRecepcion} onClose={() => setOpenRecepcion(false)} producto={productoSeleccionado} asignacion={asignacionSeleccionada} onSuccess={handleRecepcionSuccess} />
                <DetallesDialog open={openDetalles} onClose={() => setOpenDetalles(false)} asignacion={asignacionSeleccionada} producto={productoSeleccionado} onRefresh={refreshData} />
                <DescontarStockDialog open={openDescontarDialog} onClose={() => setOpenDescontarDialog(false)} producto={productoSeleccionado} onSuccess={(msg) => { showSnackbar(msg, 'success'); refreshData(); }} />
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>{snackbar.message}</Alert></Snackbar>
            </Container>
            <OfilabFooter />
        </Box>
        </Box>
    );
};

export default AsignacionPage;