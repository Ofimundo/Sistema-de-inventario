// src/pages/AsignacionPage.jsx - VERSIÓN CORREGIDA (SIN PANTALLA EN BLANCO)
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
    RadioGroup,
    Radio,
    Divider
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
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Description as DescriptionIcon,
    CheckBox as CheckBoxIcon,
    ReceiptLong as ReceiptLongIcon,
    ExpandMore as ExpandMoreIcon,
    FileDownload as FileDownloadIcon,
    Warning as WarningIcon,
    Computer as ComputerIcon,
    Security as SecurityIcon,
    Build as BuildIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import colaboradorService from '../services/colaboradorService';
import RecepcionDialog from '../components/RecepcionDialog';

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

// Mapa de estados
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5,
    BAJA: 6
};

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

// URL BASE para descargas
const API_BASE_URL = 'https://sistema-inventario-backend-p3xg.onrender.com';

// ============================================
// CHECKLIST ITEMS
// ============================================
const CHECKLIST_ITEMS = [
    { id: 'equipo_fisico', label: 'Equipo revisado físicamente' },
    { id: 'cargador', label: 'Cargador entregado' },
    { id: 'mouse', label: 'Mouse entregado' },
    { id: 'audifonos', label: 'Audífonos entregados' },
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
// FUNCIÓN PARA GENERAR PDF DEL CHECKLIST
// ============================================
const generarPDFChecklist = async (checklistData, producto, colaborador, ticketInfo, especificacionesTecnicas) => {
    try {
        const fechaActual = new Date().toLocaleDateString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const itemsMap = {};
        if (checklistData.items) {
            checklistData.items.forEach(item => {
                itemsMap[item.id] = { ok: item.ok, observacion: item.observacion };
            });
        }
        
        const contenidoHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Checklist_${colaborador.nombre?.replace(/\s/g, '_') || 'Entrega'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Arial', sans-serif; background: white; padding: 20px; }
                    .checklist-container { max-width: 1200px; margin: 0 auto; background: white; border: 1px solid #000; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .header h1 { font-size: 24px; font-weight: bold; margin: 0; }
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; border: 1px solid #000; padding: 10px; }
                    .info-row { display: flex; align-items: center; }
                    .info-label { font-weight: bold; width: 120px; font-size: 12px; }
                    .info-value { flex: 1; border-bottom: 1px solid #000; padding: 3px 5px; font-size: 12px; }
                    .checklist-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .checklist-table th { background-color: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; font-weight: bold; }
                    .checklist-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; }
                    .check-ok { font-weight: bold; }
                    .specs-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
                    .specs-table th { background-color: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; font-weight: bold; width: 50%; }
                    .specs-table td { border: 1px solid #000; padding: 8px; font-size: 12px; }
                    .signature-section { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; }
                    .signature-box { width: 45%; text-align: center; }
                    .signature-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 8px; }
                    .signature-name { font-size: 11px; margin-top: 5px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="checklist-container">
                    <div class="header"><h1>CHECKLIST ENTREGA EQUIPOS TI</h1></div>
                    <div class="info-grid">
                        <div class="info-row"><div class="info-label">Ticket:</div><div class="info-value">${ticketInfo.ticket || '_______________'}</div></div>
                        <div class="info-row"><div class="info-label">Fecha:</div><div class="info-value">${fechaActual}</div></div>
                        <div class="info-row"><div class="info-label">Usuario:</div><div class="info-value">${colaborador.usuario || colaborador.nombre?.split(' ')[0]?.toLowerCase() || '________'}</div></div>
                        <div class="info-row"><div class="info-label">Clave:</div><div class="info-value">${colaborador.clave || '********'}</div></div>
                        <div class="info-row"><div class="info-label">Encargado TI:</div><div class="info-value">${ticketInfo.tecnico || '_________________'}</div></div>
                        <div class="info-row"><div class="info-label">Equipo:</div><div class="info-value">${producto.nombre || '_________________'}</div></div>
                        <div class="info-row"><div class="info-label">Serie:</div><div class="info-value">${producto.numero_serie || '_________________'}</div></div>
                    </div>
                    <table class="checklist-table">
                        <thead><tr><th style="width: 60%">Item</th><th style="width: 15%">OK</th><th style="width: 25%">Observación</th></tr></thead>
                        <tbody>
                            ${CHECKLIST_ITEMS.map(item => {
                                const itemData = itemsMap[item.id] || { ok: false, observacion: '' };
                                return `<tr><td>${item.label}</td><td style="text-align: center">${itemData.ok ? '■ Sí' : '□ No'}</td><td>${itemData.observacion || ''}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <table class="specs-table">
                        <thead><tr><th>Especificaciones Técnicas</th><th></th></tr></thead>
                        <tbody>
                            <tr><td><strong>CPU</strong></td><td>${especificacionesTecnicas.cpu || '_________________'}</td></tr>
                            <tr><td><strong>RAM</strong></td><td>${especificacionesTecnicas.ram || '_________________'}</td></tr>
                            <tr><td><strong>Disco</strong></td><td>${especificacionesTecnicas.disco || '_________________'}</td></tr>
                            <tr><td><strong>GPU</strong></td><td>${especificacionesTecnicas.gpu || '_________________'}</td></tr>
                            <tr><td><strong>Tipo</strong></td><td>${especificacionesTecnicas.tipo || '_________________'}</td></tr>
                        </tbody>
                    </table>
                    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #000;">
                        <div style="display: flex; align-items: center;">
                            <span style="font-weight: bold; width: 120px;">Usuario conforme:</span>
                            <span>${checklistData.usuarioConforme ? '■ Sí' : '□ No'}</span>
                        </div>
                    </div>
                    <div class="signature-section">
                        <div class="signature-box"><div class="signature-line"></div><div class="signature-name">Nombre Usuario</div><div class="signature-name">${colaborador.nombre || '_________________'}</div></div>
                        <div class="signature-box"><div class="signature-line"></div><div class="signature-name">Firma Usuario</div></div>
                        <div class="signature-box"><div class="signature-line"></div><div class="signature-name">Fecha</div><div class="signature-name">${fechaActual}</div></div>
                    </div>
                    <div class="footer"><p>Documento generado por Sistema de Gestión de Inventario</p></div>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([contenidoHTML], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const nombreColaborador = colaborador.nombre?.replace(/\s/g, '_') || 'Usuario';
        const filename = `Checklist_${nombreColaborador}_${fechaActual.replace(/\//g, '-')}.html`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error generando checklist:', error);
        return false;
    }
};

// ============================================
// FUNCIÓN PARA DESCARGAR ACTA
// ============================================
const descargarActa = async (asignacionId) => {
    try {
        const token = localStorage.getItem('token');
        const busquedaUrl = `${API_BASE_URL}/api/asignaciones/buscar-documento/${asignacionId}/asignacion`;
        const busquedaResponse = await fetch(busquedaUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (busquedaResponse.ok) {
            const data = await busquedaResponse.json();
            if (data.filename || data.data?.filename) {
                const filename = data.filename || data.data.filename;
                const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${encodeURIComponent(filename)}`;
                const downloadResponse = await fetch(downloadUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error descargando acta:', error);
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
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Dibuje su firma en el recuadro (soporta mouse y pantalla táctil)</Typography>
        </Box>
    );
};

// ============================================
// COMPONENTE DE DIÁLOGO CON CHECKLIST INTEGRADO (CORREGIDO)
// ============================================
const AsignacionConChecklistDialog = ({ open, onClose, producto, tipoAccion, onSuccess }) => {
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [checklistItems, setChecklistItems] = useState(CHECKLIST_ITEMS.map(item => ({ ...item, ok: false, observacion: '' })));
    const [usuarioConforme, setUsuarioConforme] = useState(false);
    const [firmaDigital, setFirmaDigital] = useState('');
    const [ticketInfo, setTicketInfo] = useState({
        ticket: '',
        fecha: new Date().toISOString().split('T')[0],
        tecnico: ''
    });
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');
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

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            setTicketInfo(prev => ({ ...prev, tecnico: user.nombre || user.usuario || 'Técnico' }));
            setShowSuccess(false);
            setActiveStep(0);
            setError('');
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
        const itemsOk = checklistItems.filter(item => item.ok).length;
        return totalItems > 0 ? (itemsOk / totalItems) * 100 : 0;
    };

    const getFirmaTrabajadorFinal = () => tipoFirmaTrabajador === 'dibujo' ? firmaTrabajadorDibujo || '' : firmaTrabajadorText;
    const getFirmaGerenteFinal = () => tipoFirmaGerente === 'dibujo' ? firmaGerenteDibujo || '' : firmaGerenteText;

    const handleNext = () => {
        if (activeStep === 0 && !colaboradorSeleccionado) {
            setError('Debe seleccionar un colaborador');
            return;
        }
        if (activeStep === 0 && calcularProgreso() < 100) {
            setError('Debe completar todos los items del checklist');
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
                firma: firmaDigital,
                fecha: new Date().toISOString(),
                ticketInfo: ticketInfo,
                especificacionesTecnicas: especificacionesTecnicas
            };
            
            localStorage.setItem(`checklist_producto_${producto.id}`, JSON.stringify(checklistData));
            localStorage.setItem(`checklist_fecha_${producto.id}`, new Date().toISOString());

            // Generar y descargar CHECKLIST
            await generarPDFChecklist(checklistData, producto, {
                ...colaboradorSeleccionado,
                usuario: colaboradorSeleccionado.usuario || colaboradorSeleccionado.nombre?.split(' ')[0]?.toLowerCase(),
                clave: colaboradorSeleccionado.clave || '********'
            }, ticketInfo, especificacionesTecnicas);

            if (tipoAccion === 'prestamo') {
                const prestamoResponse = await api.post('/asignaciones', {
                    producto_id: producto.id,
                    colaborador_id: colaboradorSeleccionado.id,
                    motivo: 'PRÉSTAMO TEMPORAL DE EQUIPO',
                    observaciones: observaciones || `Préstamo registrado el ${new Date().toLocaleDateString()}`,
                    fecha_asignacion: new Date().toISOString(),
                    usuario_responsable: usuarioResponsable,
                    firma_trabajador: null,
                    firma_gerente: null,
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

            // Para asignación
            const asignacionResponse = await api.post('/asignaciones', {
                producto_id: producto.id,
                colaborador_id: colaboradorSeleccionado.id,
                motivo: motivo,
                observaciones: observaciones,
                fecha_asignacion: new Date().toISOString(),
                usuario_responsable: usuarioResponsable,
                firma_trabajador: getFirmaTrabajadorFinal(),
                firma_gerente: getFirmaGerenteFinal(),
                es_prestamo: false
            });

            if (asignacionResponse.data?.success || asignacionResponse.data?.id) {
                const newAsignacionId = asignacionResponse.data?.data?.id || asignacionResponse.data?.id;
                
                if (newAsignacionId) {
                    try {
                        const actaData = {
                            id_asignacion: newAsignacionId,
                            colaborador: {
                                nombre: colaboradorSeleccionado.nombre,
                                rut: colaboradorSeleccionado.rut,
                                email: colaboradorSeleccionado.email || '',
                                cargo: colaboradorSeleccionado.cargo || '',
                                departamento: colaboradorSeleccionado.departamento || ''
                            },
                            productos: [{
                                nombre: producto.nombre,
                                marca: producto.marca || 'N/A',
                                modelo: producto.modelo || 'N/A',
                                numero_serie: producto.numero_serie || 'N/A'
                            }],
                            fecha_asignacion: new Date().toISOString(),
                            motivo: motivo,
                            observaciones: observaciones || 'Sin observaciones',
                            firma_trabajador: getFirmaTrabajadorFinal(),
                            firma_gerente: getFirmaGerenteFinal()
                        };
                        
                        await api.post('/asignaciones/generar-acta-asignacion', actaData);
                        
                        // Descargar acta
                        setTimeout(async () => {
                            await descargarActa(newAsignacionId);
                        }, 500);
                        
                    } catch (docError) {
                        console.warn('Error generando acta:', docError);
                    }
                }
                
                setShowSuccess(true);
                setLoading(false);
                
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess({
                            success: true,
                            message: '✅ Asignación completada exitosamente',
                            asignacion_id: newAsignacionId,
                            es_prestamo: false
                        });
                    }
                    onClose();
                }, 2500);
                
            } else {
                throw new Error(asignacionResponse.data?.message || 'Error al procesar');
            }
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
                        Los documentos se han descargado automáticamente.
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
                                    <Grid item xs={12} sm={4}><TextField fullWidth label="N° Ticket" size="small" value={ticketInfo.ticket} onChange={(e) => setTicketInfo({ ...ticketInfo, ticket: e.target.value })} /></Grid>
                                    <Grid item xs={12} sm={4}><TextField fullWidth label="Fecha" size="small" type="date" value={ticketInfo.fecha} onChange={(e) => setTicketInfo({ ...ticketInfo, fecha: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
                                    <Grid item xs={12} sm={4}><TextField fullWidth label="Técnico" size="small" value={ticketInfo.tecnico} onChange={(e) => setTicketInfo({ ...ticketInfo, tecnico: e.target.value })} /></Grid>
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

                            <FormControlLabel control={<Checkbox checked={usuarioConforme} onChange={(e) => setUsuarioConforme(e.target.checked)} />} label="El usuario confirma que el equipo está en buen estado y funciona correctamente" />
                            {usuarioConforme && (<TextField fullWidth label="Firma Digital del Usuario" placeholder="Nombre completo del usuario" value={firmaDigital} onChange={(e) => setFirmaDigital(e.target.value)} sx={{ mt: 2 }} />)}

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleNext} disabled={!colaboradorSeleccionado || progreso < 100 || !usuarioConforme || !firmaDigital} sx={{ borderRadius: 2 }}>Continuar</Button>
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
                                <TextField fullWidth label="Motivo de asignación *" value={motivo} onChange={(e) => setMotivo(e.target.value)} multiline rows={2} placeholder="Ej: Proyecto específico, Reemplazo de equipo, etc." sx={{ mb: 2 }} />
                                <TextField fullWidth label="Observaciones adicionales" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline rows={2} placeholder="Observaciones importantes sobre la transacción..." sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Firma del Trabajador / Colaborador *</Typography>
                                <FormControl component="fieldset" sx={{ mb: 2 }}><RadioGroup row value={tipoFirmaTrabajador} onChange={(e) => setTipoFirmaTrabajador(e.target.value)}><FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" /><FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" /></RadioGroup></FormControl>
                                {tipoFirmaTrabajador === 'texto' ? (<TextField fullWidth multiline rows={2} placeholder="Escriba el nombre completo de la persona que firma" value={firmaTrabajadorText} onChange={(e) => setFirmaTrabajadorText(e.target.value)} sx={{ mb: 2 }} helperText="Ej: Juan Pérez Pérez, RUT: 12.345.678-9" />) : (<FirmaDibujadaComponent onFirmaGuardada={setFirmaTrabajadorDibujo} label="Firma del Trabajador" />)}

                                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>Firma del Gerente General / Autorizante *</Typography>
                                <FormControl component="fieldset" sx={{ mb: 2 }}><RadioGroup row value={tipoFirmaGerente} onChange={(e) => setTipoFirmaGerente(e.target.value)}><FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" /><FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" /></RadioGroup></FormControl>
                                {tipoFirmaGerente === 'texto' ? (<TextField fullWidth multiline rows={2} placeholder="Escriba el nombre completo de la persona que firma" value={firmaGerenteText} onChange={(e) => setFirmaGerenteText(e.target.value)} sx={{ mb: 2 }} helperText="Ej: María Eugenia Navalon, Gerente General" />) : (<FirmaDibujadaComponent onFirmaGuardada={setFirmaGerenteDibujo} label="Firma del Gerente" />)}

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button onClick={handleBack} variant="outlined">Atrás</Button>
                                    <Button variant="contained" onClick={handleFinalizar} disabled={!motivo.trim() || (tipoFirmaTrabajador === 'texto' && !firmaTrabajadorText) || (tipoFirmaGerente === 'texto' && !firmaGerenteText) || loading} sx={{ borderRadius: 2, bgcolor: colors.primary }}>{loading ? <CircularProgress size={24} /> : 'Finalizar Asignación'}</Button>
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
// COMPONENTE DE DETALLES CON DOCUMENTOS
// ============================================
const DetallesDialog = ({ open, onClose, asignacion, producto, onRefresh }) => {
    const [downloading, setDownloading] = useState(false);
    const [documentos, setDocumentos] = useState([]);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);
    const [checklistData, setChecklistData] = useState(null);

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
            try {
                const response = await fetch(`${API_BASE_URL}/api/asignaciones/buscar-documento/${asignacion.id}/asignacion`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await response.json();
                if (data.success && data.data?.filename) {
                    docs.push({ tipo: 'asignacion', nombre: 'Acta de Asignación', filename: data.data.filename });
                }
            } catch (err) {}
            if (asignacion.fecha_devolucion) {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/asignaciones/buscar-documento/${asignacion.id}/recepcion`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await response.json();
                    if (data.success && data.data?.filename) {
                        docs.push({ tipo: 'recepcion', nombre: 'Acta de Recepción', filename: data.data.filename });
                    }
                } catch (err) {}
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
            const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${encodeURIComponent(filename)}`;
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
        if (checklistData) {
            await generarPDFChecklist(
                checklistData, 
                checklistData.producto, 
                checklistData.colaborador, 
                checklistData.ticketInfo || { ticket: '', tecnico: '' },
                checklistData.especificacionesTecnicas || { cpu: '', ram: '', disco: '', gpu: '', tipo: '' }
            );
        }
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
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Equipo</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">Producto:</Typography><Typography variant="body2">{producto?.nombre}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">N° Serie:</Typography><Typography variant="body2">{producto?.numero_serie || 'N/A'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Información del Colaborador</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}><Typography variant="caption">Nombre:</Typography><Typography variant="body2">{asignacion?.colaborador_nombre}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption">RUT:</Typography><Typography variant="body2">{asignacion?.colaborador_rut || '-'}</Typography></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Detalles de la Operación</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={4}><Typography variant="caption">ID:</Typography><Typography variant="body2" fontFamily="monospace">{asignacion?.id}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption">Fecha:</Typography><Typography variant="body2">{new Date(asignacion?.fecha_asignacion).toLocaleDateString()}</Typography></Grid>
                                <Grid item xs={4}><Typography variant="caption">Motivo:</Typography><Typography variant="body2">{asignacion?.motivo || '-'}</Typography></Grid>
                                {asignacion?.fecha_devolucion && (
                                    <>
                                        <Grid item xs={6}><Typography variant="caption">Fecha Devolución:</Typography><Typography variant="body2">{new Date(asignacion.fecha_devolucion).toLocaleDateString()}</Typography></Grid>
                                        <Grid item xs={6}><Typography variant="caption">Condición:</Typography><Typography variant="body2">{asignacion?.condicion_entrega || '-'}</Typography></Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Documentos</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {loadingDocumentos ? (
                                <CircularProgress size={24} />
                            ) : documentos.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No hay documentos disponibles</Typography>
                            ) : (
                                documentos.map((doc) => (
                                    <Box key={doc.tipo} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PdfIcon sx={{ color: '#f44336' }} />
                                            <Typography variant="body2">{doc.nombre}</Typography>
                                        </Box>
                                        <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDescargarDocumento(doc.filename, doc.nombre)} disabled={downloading}>
                                            Descargar
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Lista de verificación de entrega</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {checklistData ? (
                                <>
                                    <Typography variant="caption" color="text.secondary">
                                        Completado el {new Date(checklistData.fecha).toLocaleDateString()}
                                    </Typography>
                                    <Button 
                                        size="small" 
                                        startIcon={<DownloadIcon />} 
                                        onClick={handleDescargarChecklist}
                                        sx={{ mt: 2, display: 'block' }}
                                        variant="contained"
                                        color="primary"
                                    >
                                        Descargar Checklist
                                    </Button>
                                    <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                                        {checklistData.items?.map((item, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                {item.ok ? <CheckCircleIcon sx={{ color: colors.success, fontSize: 16 }} /> : <CloseIcon sx={{ color: colors.error, fontSize: 16 }} />}
                                                <Typography variant="body2">{item.label}</Typography>
                                                {item.observacion && <Typography variant="caption" color="text.secondary"> - {item.observacion}</Typography>}
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No hay checklist disponible para esta asignación</Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">Cerrar</Button>
            </DialogActions>
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
// COMPONENTE PRINCIPAL
// ============================================
const AsignacionPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:600px)');
    const navigate = useNavigate();
    
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
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [tipoAccionActual, setTipoAccionActual] = useState(null);
    const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [apiError, setApiError] = useState(false);
    const [downloadingDoc, setDownloadingDoc] = useState(false);

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const handleGoHome = () => navigate('/dashboard');

    const handleDescargarDocumento = async (asignacionId, tipo) => {
        setDownloadingDoc(true);
        try {
            const token = localStorage.getItem('token');
            const busquedaUrl = `${API_BASE_URL}/api/asignaciones/buscar-documento/${asignacionId}/${tipo}`;
            const busquedaResponse = await fetch(busquedaUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
            if (busquedaResponse.ok) {
                const data = await busquedaResponse.json();
                if (data.filename || data.data?.filename) {
                    const filename = data.filename || data.data.filename;
                    const downloadUrl = `${API_BASE_URL}/api/asignaciones/descargar/${encodeURIComponent(filename)}`;
                    const downloadResponse = await fetch(downloadUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
                    if (downloadResponse.ok) {
                        const blob = await downloadResponse.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        showSnackbar(`Documento descargado correctamente`, 'success');
                        return;
                    }
                }
            }
            showSnackbar(`No se encontró el documento`, 'warning');
        } catch (error) { console.error('Error descargando documento:', error); showSnackbar(`Error al descargar el documento`, 'error'); } 
        finally { setTimeout(() => setDownloadingDoc(false), 1000); }
    };

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
    const getAsignacionActiva = (productoId) => asignacionesActivas.find(a => a.producto_id === productoId);

    const filteredProductos = productos.filter(producto => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = (producto.nombre?.toLowerCase().includes(term) || producto.marca?.toLowerCase().includes(term) || producto.numero_serie?.toLowerCase().includes(term) || (producto.modelo && producto.modelo.toLowerCase().includes(term)));
            if (!matchesSearch) return false;
        }
        const asignacionActiva = getAsignacionActiva(producto.id);
        const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
        switch (filters.tipo_estado) {
            case 'disponibles': return producto.id_estado_equipo === 1;
            case 'asignados': return producto.id_estado_equipo === 2 && !esPrestamo;
            case 'prestamos': return producto.id_estado_equipo === 2 && esPrestamo;
            default: return true;
        }
    });

    const paginatedProductos = filteredProductos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const activeFiltersCount = (filters.bodega_id ? 1 : 0) + (filters.tipo_estado !== 'todos' ? 1 : 0) + (searchTerm ? 1 : 0);
    const totalDisponibles = productos.filter(p => p.id_estado_equipo === 1).length;
    const totalAsignados = productos.filter(p => p.id_estado_equipo === 2).length;
    const totalPrestamos = asignacionesActivas.filter(a => a.es_prestamo === true || a.es_prestamo === 1).length;
    const totalAsignacionesNormales = asignacionesActivas.filter(a => !(a.es_prestamo === true || a.es_prestamo === 1)).length;

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleGoHome} sx={{ mr: 2 }}><HomeIcon /></IconButton>
                    <AssignmentIcon sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Gestión de Asignaciones con Firma Digital</Typography>
                    <IconButton color="inherit" onClick={() => refreshData()} disabled={refreshing}>{refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}</IconButton>
                </Toolbar>
            </AppBar>
            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 1 }}>Gestión de Asignaciones con Firma Digital</Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>Asigna productos a colaboradores con firma digital y control de inventario</Typography>
                    {apiError && (<Alert severity="warning" sx={{ mt: 3, borderRadius: 0 }} icon={<ErrorIcon />} action={<Button color="inherit" size="small" onClick={() => refreshData()} sx={{ borderRadius: 0 }}>REINTENTAR</Button>}>No se pudo conectar con el servidor. Verifica tu conexión.</Alert>)}
                </Paper>

                <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 48, height: 48, mb: 1 }}><CheckCircleIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <CircularProgress size={24} /> : totalDisponibles}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Productos Disponibles</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48, mb: 1 }}><AssignmentIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <CircularProgress size={24} /> : totalAsignacionesNormales}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Asignaciones Activas</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 48, height: 48, mb: 1 }}><PersonIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <CircularProgress size={24} /> : totalPrestamos}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Préstamos Activos</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.error, 0.1), color: colors.error, width: 48, height: 48, mb: 1 }}><InventoryIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{loading ? <CircularProgress size={24} /> : totalAsignados}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Asignados</Typography></CardContent></StyledCard></Grid>
                </Grid>

                <FilterPaper>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}><TextField fullWidth placeholder="Buscar por nombre, marca, modelo o número de serie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, endAdornment: searchTerm && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><CloseIcon fontSize="small" /></IconButton></InputAdornment>) }} size="small" /></Grid>
                        <Grid item xs={6} md={3}><FormControl fullWidth size="small"><InputLabel>Bodega</InputLabel><Select value={filters.bodega_id} onChange={(e) => setFilters({ ...filters, bodega_id: e.target.value })} label="Bodega"><MenuItem value="">Todas</MenuItem>{bodegas.map((b) => (<MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>))}</Select></FormControl></Grid>
                        <Grid item xs={12} md={3}><ToggleButtonGroup value={filters.tipo_estado} exclusive onChange={handleTipoEstadoChange} size="small" fullWidth sx={{ height: 40 }}><ToggleButton value="todos" sx={{ borderRadius: 0, textTransform: 'none' }}>Todos</ToggleButton><ToggleButton value="disponibles" sx={{ borderRadius: 0, textTransform: 'none' }}><CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, color: colors.success }} />Disponibles</ToggleButton><ToggleButton value="asignados" sx={{ borderRadius: 0, textTransform: 'none' }}><AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: colors.primary }} />Asignados</ToggleButton><ToggleButton value="prestamos" sx={{ borderRadius: 0, textTransform: 'none' }}><PersonIcon sx={{ fontSize: 16, mr: 0.5, color: colors.warning }} />Préstamos</ToggleButton></ToggleButtonGroup></Grid>
                        <Grid item xs={6} md={2}><Button fullWidth variant="outlined" color="error" startIcon={<FilterListOffIcon />} onClick={handleClearFilters} disabled={activeFiltersCount === 0} sx={{ borderRadius: 0 }}>Limpiar filtros</Button></Grid>
                    </Grid>
                </FilterPaper>

                <StyledTableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead><TableRow><StyledTableCell>Producto</StyledTableCell><StyledTableCell>Marca</StyledTableCell><StyledTableCell>Modelo</StyledTableCell><StyledTableCell>N° Serie</StyledTableCell><StyledTableCell>Bodega</StyledTableCell><StyledTableCell>Condición</StyledTableCell><StyledTableCell>Estado / Tipo</StyledTableCell><StyledTableCell>Asignado a</StyledTableCell><StyledTableCell align="center">Acciones</StyledTableCell></TableRow></TableHead>
                        <TableBody>
                            {loading && paginatedProductos.length === 0 ? (<TableRow><TableCell colSpan={9} align="center"><CircularProgress /><Typography sx={{ mt: 2 }}>Cargando productos...</Typography></TableCell></TableRow>) : paginatedProductos.length === 0 ? (<TableRow><TableCell colSpan={9} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography><Typography variant="body2" color="text.secondary">No se encontraron productos con los filtros aplicados</Typography></TableCell></TableRow>) : (paginatedProductos.map((producto) => {
                                const asignacionActiva = getAsignacionActiva(producto.id);
                                const estaDisponible = producto.id_estado_equipo === 1;
                                const estaAsignado = producto.id_estado_equipo === 2;
                                const esPrestamo = asignacionActiva?.es_prestamo === true || asignacionActiva?.es_prestamo === 1;
                                return (<TableRow key={`${producto.id}-${producto.numero_serie || producto.id}`} hover>
                                    <TableCell><Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 32, height: 32, bgcolor: alpha(colors.primary, 0.1) }}><InventoryIcon sx={{ fontSize: 16 }} /></Avatar><Typography variant="body2" fontWeight={500}>{producto.nombre}</Typography></Box></TableCell>
                                    <TableCell>{producto.marca || '-'}</TableCell><TableCell>{producto.modelo || '-'}</TableCell>
                                    <TableCell><Chip label={producto.numero_serie || 'N/A'} size="small" variant="outlined" /></TableCell>
                                    <TableCell><Chip icon={<StoreIcon />} label={producto.bodega_nombre || 'Sin bodega'} size="small" sx={{ backgroundColor: alpha(colors.info, 0.1), color: colors.info }} /></TableCell>
                                    <TableCell><Chip label={producto.condicion || 'NUEVO'} size="small" sx={{ backgroundColor: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? alpha(colors.warning, 0.1) : alpha(colors.success, 0.1), color: (producto.condicion === 'USADO' || producto.condicion === 'REACONDICIONADO') ? colors.warning : colors.success }} /></TableCell>
                                    <TableCell><Stack direction="column" spacing={0.5}><Chip label={getEstadoTexto(producto.id_estado_equipo)} size="small" sx={{ backgroundColor: alpha(getEstadoColor(producto.id_estado_equipo), 0.1), color: getEstadoColor(producto.id_estado_equipo), fontWeight: 500, fontSize: '0.7rem' }} />{asignacionActiva && (<Chip icon={esPrestamo ? <PersonIcon sx={{ fontSize: 12 }} /> : <AssignmentIcon sx={{ fontSize: 12 }} />} label={esPrestamo ? "PRÉSTAMO" : "ASIGNACIÓN"} size="small" sx={{ backgroundColor: esPrestamo ? alpha(colors.warning, 0.1) : alpha(colors.primary, 0.1), color: esPrestamo ? colors.warning : colors.primary, fontWeight: 600, fontSize: '0.65rem', height: 20 }} />)}</Stack></TableCell>
                                    <TableCell>{asignacionActiva ? (<Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 24, height: 24, bgcolor: alpha(esPrestamo ? colors.warning : colors.success, 0.1) }}><PersonIcon sx={{ fontSize: 14 }} /></Avatar><Typography variant="body2">{asignacionActiva.colaborador_nombre}</Typography></Box>) : (<Typography variant="body2" color="text.secondary">-</Typography>)}</TableCell>
                                    <TableCell align="center"><Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">{estaDisponible ? (<><Button variant="contained" size="small" startIcon={<AssignmentIcon />} onClick={() => handleAsignar(producto)} sx={{ bgcolor: colors.primary, borderRadius: 0, minWidth: 80 }}>Asignar</Button><Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={() => handlePrestamo(producto)} sx={{ borderRadius: 0, borderColor: colors.warning, color: colors.warning, minWidth: 80 }}>Préstamo</Button></>) : estaAsignado ? (<><Button variant="contained" size="small" startIcon={<ReceiptIcon />} onClick={() => handleRecibir(producto)} sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary, borderRadius: 0, minWidth: 80 }}>Recibir</Button><IconButton size="small" onClick={() => handleDescargarDocumento(asignacionActiva.id, 'asignacion')} disabled={downloadingDoc} sx={{ color: '#f44336' }}><PdfIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => handleVerDetalles(producto)} sx={{ color: esPrestamo ? colors.warning : colors.info }}><VisibilityIcon fontSize="small" /></IconButton></>) : (<Button variant="outlined" size="small" disabled sx={{ opacity: 0.5, borderRadius: 0 }}>No disponible</Button>)}</Stack></TableCell>
                                </TableRow>);
                            }))}
                        </TableBody>
                    </Table>
                    <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredProductos.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Filas" />
                </StyledTableContainer>

                <AsignacionConChecklistDialog open={openChecklistDialog} onClose={() => { setOpenChecklistDialog(false); setProductoSeleccionado(null); setTipoAccionActual(null); }} producto={productoSeleccionado} tipoAccion={tipoAccionActual} onSuccess={handleChecklistSuccess} />
                <RecepcionDialog open={openRecepcion} onClose={() => setOpenRecepcion(false)} producto={productoSeleccionado} asignacion={asignacionSeleccionada} onSuccess={handleRecepcionSuccess} />
                <DetallesDialog open={openDetalles} onClose={() => setOpenDetalles(false)} asignacion={asignacionSeleccionada} producto={productoSeleccionado} onRefresh={refreshData} />
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>{snackbar.message}</Alert></Snackbar>
            </Container>
        </Box>
    );
};

export default AsignacionPage;