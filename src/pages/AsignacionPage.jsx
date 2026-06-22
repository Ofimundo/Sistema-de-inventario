// src/pages/AsignacionPage.jsx - VERSIÓN COMPLETA CORREGIDA (CON ACTUALIZACIÓN AUTOMÁTICA)
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
    Checkbox,
    FormControlLabel,
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
    Home as HomeIcon,
    FilterListOff as FilterListOffIcon,
    Store as StoreIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    PictureAsPdf as PdfIcon,
    Description as DescriptionIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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
                                return `<tr><td style="padding: 8px; border: 1px solid #000;">${item.label}</td><td style="text-align: center; border: 1px solid #000;">${itemData.ok ? '✓' : '✗'}</td><td style="border: 1px solid #000;">${itemData.observacion || ''}</td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    <table class="specs-table">
                        <thead><tr><th>Especificaciones Técnicas</th><th></th></tr></thead>
                        <tbody>
                            <tr><td style="border: 1px solid #000;"><strong>CPU</strong></td><td style="border: 1px solid #000;">${especificacionesTecnicas.cpu || '_________________'}</td></tr>
                            <tr><td style="border: 1px solid #000;"><strong>RAM</strong></td><td style="border: 1px solid #000;">${especificacionesTecnicas.ram || '_________________'}</td></tr>
                            <tr><td style="border: 1px solid #000;"><strong>Disco</strong></td><td style="border: 1px solid #000;">${especificacionesTecnicas.disco || '_________________'}</td></tr>
                            <td><td style="border: 1px solid #000;"><strong>GPU</strong></td><td style="border: 1px solid #000;">${especificacionesTecnicas.gpu || '_________________'}</td></tr>
                            <tr><td style="border: 1px solid #000;"><strong>Tipo</strong></td><td style="border: 1px solid #000;">${especificacionesTecnicas.tipo || '_________________'}</td></tr>
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
// FUNCIÓN PARA DESCARGAR PDF
// ============================================
const descargarPDF = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
// COMPONENTE DE DIÁLOGO CON CHECKLIST INTEGRADO
// ============================================
const AsignacionConChecklistDialog = ({ open, onClose, producto, tipoAccion, onSuccess }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [searchColaborador, setSearchColaborador] = useState('');
    const [motivo, setMotivo] = useState('');
    const [fechaDevolucion, setFechaDevolucion] = useState('');
    const [firmaData, setFirmaData] = useState('');
    const [checklistItems, setChecklistItems] = useState(CHECKLIST_ITEMS.map(item => ({ ...item, ok: false, observacion: '' })));
    const [usuarioConforme, setUsuarioConforme] = useState(false);
    const [ticketInfo, setTicketInfo] = useState({ ticket: '', tecnico: '' });
    const [especificacionesTecnicas, setEspecificacionesTecnicas] = useState({ cpu: '', ram: '', disco: '', gpu: '', tipo: '' });

    const esPrestamo = tipoAccion === 'prestamo';

    useEffect(() => {
        if (open) {
            cargarColaboradores();
            setStep(0);
            setColaboradorSeleccionado(null);
            setMotivo('');
            setFechaDevolucion('');
            setFirmaData('');
            setChecklistItems(CHECKLIST_ITEMS.map(item => ({ ...item, ok: false, observacion: '' })));
            setUsuarioConforme(false);
            setTicketInfo({ ticket: '', tecnico: '' });
            setEspecificacionesTecnicas({
                cpu: '',
                ram: '',
                disco: '',
                gpu: '',
                tipo: producto?.nombre || ''
            });
        }
    }, [open, producto]);

    const cargarColaboradores = async () => {
        try {
            const response = await api.get('/colaboradores');
            const colaboradoresData = response.data.data || response.data || [];
            setColaboradores(colaboradoresData);
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
        }
    };

    const handleChecklistChange = (index, field, value) => {
        const nuevos = [...checklistItems];
        nuevos[index][field] = value;
        setChecklistItems(nuevos);
    };

    const handleGuardarFirma = (firma) => {
        setFirmaData(firma);
    };

    const handleSubmit = async () => {
        if (!colaboradorSeleccionado) {
            onSuccess({ error: true, message: 'Debe seleccionar un colaborador' });
            return;
        }
        if (!motivo) {
            onSuccess({ error: true, message: 'Debe ingresar un motivo' });
            return;
        }
        if (esPrestamo && !fechaDevolucion) {
            onSuccess({ error: true, message: 'Debe ingresar una fecha de devolución para el préstamo' });
            return;
        }

        setLoading(true);
        try {
            const colaboradorId = colaboradorSeleccionado.id;

            const checklistCompleto = {
                fecha: new Date().toISOString(),
                producto: { id: producto.id, nombre: producto.nombre, numero_serie: producto.numero_serie },
                colaborador: colaboradorSeleccionado,
                items: checklistItems,
                usuarioConforme,
                ticketInfo,
                especificacionesTecnicas
            };
            localStorage.setItem(`checklist_producto_${producto.id}`, JSON.stringify(checklistCompleto));

            const asignacionData = {
                producto_id: producto.id,
                colaborador_id: colaboradorId,
                motivo: motivo,
                es_prestamo: esPrestamo ? 1 : 0,
                fecha_devolucion: esPrestamo ? fechaDevolucion : null,
                firma_trabajador: firmaData,
                observaciones: JSON.stringify({ checklist: checklistItems, especificaciones: especificacionesTecnicas, ticket: ticketInfo })
            };

            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_BASE_URL}/asignaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(asignacionData)
            });

            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/pdf')) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `acta_asignacion_${Date.now()}.pdf`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }
                descargarPDF(blob, filename);
                await generarPDFChecklist(checklistCompleto, producto, colaboradorSeleccionado, ticketInfo, especificacionesTecnicas);
                onSuccess({ message: esPrestamo ? 'Préstamo registrado correctamente' : 'Asignación registrada correctamente', documentoGenerado: true, refresh: true });
            } else {
                const data = await response.json();
                if (data.success) {
                    await generarPDFChecklist(checklistCompleto, producto, colaboradorSeleccionado, ticketInfo, especificacionesTecnicas);
                    onSuccess({ message: esPrestamo ? 'Préstamo registrado correctamente' : 'Asignación registrada correctamente', refresh: true });
                } else {
                    throw new Error(data.message || 'Error al registrar');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            onSuccess({ error: true, message: error.message || 'Error al procesar la solicitud' });
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const getStepContent = (stepIndex) => {
        switch (stepIndex) {
            case 0:
                return (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Seleccionar Colaborador</Typography>
                        <TextField 
                            fullWidth 
                            placeholder="Buscar colaborador por nombre o RUT..." 
                            value={searchColaborador} 
                            onChange={(e) => setSearchColaborador(e.target.value)} 
                            size="small" 
                            sx={{ mb: 2 }} 
                        />
                        <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                            {colaboradores
                                .filter(c => c.nombre?.toLowerCase().includes(searchColaborador.toLowerCase()) || c.rut?.includes(searchColaborador))
                                .map(col => (
                                    <Paper 
                                        key={col.id} 
                                        onClick={() => setColaboradorSeleccionado(col)} 
                                        sx={{ 
                                            p: 1.5, 
                                            mb: 1, 
                                            cursor: 'pointer', 
                                            bgcolor: colaboradorSeleccionado?.id === col.id ? alpha(colors.primary, 0.1) : 'transparent', 
                                            border: colaboradorSeleccionado?.id === col.id ? `1px solid ${colors.primary}` : `1px solid ${colors.border}` 
                                        }}
                                    >
                                        <Typography variant="body2" fontWeight={500}>{col.nombre}</Typography>
                                        <Typography variant="caption" color="text.secondary">RUT: {col.rut} | {col.cargo || 'Sin cargo'}</Typography>
                                    </Paper>
                                ))}
                            {colaboradores.filter(c => c.nombre?.toLowerCase().includes(searchColaborador.toLowerCase()) || c.rut?.includes(searchColaborador)).length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No se encontraron colaboradores
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Información de {esPrestamo ? 'Préstamo' : 'Asignación'}</Typography>
                        <TextField fullWidth label="Motivo" multiline rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} sx={{ mb: 2 }} />
                        {esPrestamo && (
                            <TextField fullWidth type="date" label="Fecha de Devolución" value={fechaDevolucion} onChange={(e) => setFechaDevolucion(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                        )}
                        <TextField fullWidth label="Ticket / ID Referencia" placeholder="Ticket o número de referencia" value={ticketInfo.ticket} onChange={(e) => setTicketInfo({ ...ticketInfo, ticket: e.target.value })} sx={{ mb: 2 }} />
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Especificaciones Técnicas</Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={12}><TextField fullWidth label="CPU" size="small" value={especificacionesTecnicas.cpu} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, cpu: e.target.value })} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="RAM" size="small" value={especificacionesTecnicas.ram} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, ram: e.target.value })} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Disco" size="small" value={especificacionesTecnicas.disco} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, disco: e.target.value })} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="GPU" size="small" value={especificacionesTecnicas.gpu} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, gpu: e.target.value })} /></Grid>
                            <Grid item xs={6}><TextField fullWidth label="Tipo" size="small" value={especificacionesTecnicas.tipo} onChange={(e) => setEspecificacionesTecnicas({ ...especificacionesTecnicas, tipo: e.target.value })} /></Grid>
                        </Grid>
                    </Box>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Checklist de Entrega</Typography>
                        <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                            {checklistItems.map((item, idx) => (
                                <Box key={item.id} sx={{ mb: 2, p: 1, border: `1px solid ${colors.border}` }}>
                                    <FormControlLabel control={<Checkbox checked={item.ok} onChange={(e) => handleChecklistChange(idx, 'ok', e.target.checked)} />} label={<Typography variant="body2" fontWeight={500}>{item.label}</Typography>} />
                                    <TextField fullWidth size="small" placeholder="Observación (opcional)" value={item.observacion} onChange={(e) => handleChecklistChange(idx, 'observacion', e.target.value)} />
                                </Box>
                            ))}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <FormControlLabel control={<Checkbox checked={usuarioConforme} onChange={(e) => setUsuarioConforme(e.target.checked)} />} label="El usuario declara que el equipo fue entregado conforme a lo indicado" />
                    </Box>
                );
            case 4:
                return (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Firma Digital</Typography>
                        <FirmaDibujadaComponent onFirmaGuardada={handleGuardarFirma} label="Firma del Trabajador" height={150} />
                    </Box>
                );
            default:
                return null;
        }
    };

    if (!open || !producto) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: alpha(esPrestamo ? colors.warning : colors.primary, 0.1) }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary }}>
                            {esPrestamo ? <PersonIcon /> : <AssignmentIcon />}
                        </Avatar>
                        <Typography variant="h6" fontWeight={600}>
                            {esPrestamo ? 'Registrar Préstamo' : 'Registrar Asignación'} - {producto.nombre}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={step} orientation="vertical">
                    <Step><StepLabel>Seleccionar Colaborador</StepLabel><StepContent>{getStepContent(0)}</StepContent></Step>
                    <Step><StepLabel>Información del {esPrestamo ? 'Préstamo' : 'Asignación'}</StepLabel><StepContent>{getStepContent(1)}</StepContent></Step>
                    <Step><StepLabel>Especificaciones Técnicas</StepLabel><StepContent>{getStepContent(2)}</StepContent></Step>
                    <Step><StepLabel>Checklist de Entrega</StepLabel><StepContent>{getStepContent(3)}</StepContent></Step>
                    <Step><StepLabel>Firma Digital</StepLabel><StepContent>{getStepContent(4)}</StepContent></Step>
                </Stepper>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                {step > 0 && <Button onClick={() => setStep(step - 1)} disabled={loading}>Atrás</Button>}
                {step < 4 ? (
                    <Button variant="contained" onClick={() => setStep(step + 1)} disabled={loading}>Siguiente</Button>
                ) : (
                    <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null}>
                        {loading ? 'Procesando...' : (esPrestamo ? 'Registrar Préstamo' : 'Registrar Asignación')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

// ============================================
// COMPONENTE DE DETALLES CON DOCUMENTOS
// ============================================
const DetallesDialog = ({ open, onClose, asignacion, producto, onRefresh }) => {
    const [downloading, setDownloading] = useState({
        asignacion: false,
        recepcion: false,
        checklist: false
    });
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
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            try {
                const response = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/asignacion`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.data?.filename) {
                    docs.push({ 
                        tipo: 'asignacion', 
                        nombre: '📄 Acta de Asignación', 
                        filename: data.data.filename,
                        icon: <PdfIcon sx={{ color: '#dc2626' }} />
                    });
                }
            } catch (err) {
                console.log('No se encontró acta de asignación');
            }
            
            if (asignacion.fecha_devolucion) {
                try {
                    const response = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/recepcion`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success && data.data?.filename) {
                        docs.push({ 
                            tipo: 'recepcion', 
                            nombre: '📋 Acta de Recepción', 
                            filename: data.data.filename,
                            icon: <PdfIcon sx={{ color: '#10b981' }} />
                        });
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
            const checklistGuardado = localStorage.getItem(`checklist_producto_${asignacion.producto_id}`);
            if (checklistGuardado) {
                setChecklistData(JSON.parse(checklistGuardado));
            }
        } catch (error) {
            console.error('Error cargando checklist:', error);
        }
    };

    const handleDescargarActaAsignacion = async () => {
        if (downloading.asignacion) return;
        
        setDownloading(prev => ({ ...prev, asignacion: true }));
        
        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const busquedaResponse = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/asignacion`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await busquedaResponse.json();
            
            if (data.success && data.data?.filename) {
                const downloadResponse = await fetch(`${API_BASE_URL}/asignaciones/descargar/${encodeURIComponent(data.data.filename)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob();
                    descargarPDF(blob, data.data.filename);
                }
            }
        } catch (error) {
            console.error('Error descargando acta de asignación:', error);
        } finally {
            setDownloading(prev => ({ ...prev, asignacion: false }));
        }
    };

    const handleDescargarActaRecepcion = async () => {
        if (downloading.recepcion) return;
        
        setDownloading(prev => ({ ...prev, recepcion: true }));
        
        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const busquedaResponse = await fetch(`${API_BASE_URL}/asignaciones/buscar-documento/${asignacion.id}/recepcion`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await busquedaResponse.json();
            
            if (data.success && data.data?.filename) {
                const downloadResponse = await fetch(`${API_BASE_URL}/asignaciones/descargar/${encodeURIComponent(data.data.filename)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (downloadResponse.ok) {
                    const blob = await downloadResponse.blob();
                    descargarPDF(blob, data.data.filename);
                }
            }
        } catch (error) {
            console.error('Error descargando acta de recepción:', error);
        } finally {
            setDownloading(prev => ({ ...prev, recepcion: false }));
        }
    };

    const handleDescargarChecklist = async () => {
        if (downloading.checklist) return;
        
        if (!checklistData) {
            console.error('No hay checklist disponible');
            return;
        }
        
        setDownloading(prev => ({ ...prev, checklist: true }));
        
        try {
            await generarPDFChecklist(
                checklistData, 
                checklistData.producto, 
                checklistData.colaborador, 
                checklistData.ticketInfo || { ticket: '', tecnico: '' },
                checklistData.especificacionesTecnicas || { cpu: '', ram: '', disco: '', gpu: '', tipo: '' }
            );
        } catch (error) {
            console.error('Error descargando checklist:', error);
        } finally {
            setDownloading(prev => ({ ...prev, checklist: false }));
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
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>📦 Información del Equipo</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Producto:</Typography>
                                    <Typography variant="body2"><strong>{producto?.nombre}</strong></Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">N° Serie:</Typography>
                                    <Typography variant="body2">{producto?.numero_serie || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Marca:</Typography>
                                    <Typography variant="body2">{producto?.marca || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Modelo:</Typography>
                                    <Typography variant="body2">{producto?.modelo || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>👤 Información del Colaborador</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Nombre:</Typography>
                                    <Typography variant="body2"><strong>{asignacion?.colaborador_nombre}</strong></Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">RUT:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_rut || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Cargo:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_cargo || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Departamento:</Typography>
                                    <Typography variant="body2">{asignacion?.colaborador_departamento || '-'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>📋 Detalles de la Operación</Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">ID Asignación:</Typography>
                                    <Typography variant="body2" fontFamily="monospace"><strong>{asignacion?.id}</strong></Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Fecha Asignación:</Typography>
                                    <Typography variant="body2">{new Date(asignacion?.fecha_asignacion).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Motivo:</Typography>
                                    <Typography variant="body2">{asignacion?.motivo || '-'}</Typography>
                                </Grid>
                                {asignacion?.fecha_devolucion && (
                                    <>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Fecha Devolución:</Typography>
                                            <Typography variant="body2">{new Date(asignacion.fecha_devolucion).toLocaleDateString()}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Condición de Entrega:</Typography>
                                            <Typography variant="body2">{asignacion?.condicion_entrega || '-'}</Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>📄 Documentos Disponibles</Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            {loadingDocumentos ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={30} />
                                </Box>
                            ) : (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={downloading.asignacion ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                                        onClick={handleDescargarActaAsignacion}
                                        disabled={downloading.asignacion}
                                        sx={{
                                            bgcolor: '#dc2626',
                                            '&:hover': { bgcolor: '#b91c1c' },
                                            py: 1.5,
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        {downloading.asignacion ? 'Descargando...' : '📄 Acta de Asignación'}
                                    </Button>
                                    
                                    {documentos.some(d => d.tipo === 'recepcion') && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={downloading.recepcion ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                                            onClick={handleDescargarActaRecepcion}
                                            disabled={downloading.recepcion}
                                            sx={{
                                                bgcolor: '#10b981',
                                                '&:hover': { bgcolor: '#059669' },
                                                py: 1.5,
                                                textTransform: 'none',
                                                fontWeight: 600
                                            }}
                                        >
                                            {downloading.recepcion ? 'Descargando...' : '📋 Acta de Recepción'}
                                        </Button>
                                    )}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>✅ Lista de verificación de entrega</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {checklistData ? (
                                <>
                                    <Typography variant="caption" color="text.secondary">
                                        Completado el {new Date(checklistData.fecha).toLocaleDateString()}
                                    </Typography>
                                    <Button 
                                        fullWidth
                                        variant="outlined"
                                        startIcon={downloading.checklist ? <CircularProgress size={20} /> : <DescriptionIcon />}
                                        onClick={handleDescargarChecklist}
                                        disabled={downloading.checklist}
                                        sx={{ mt: 2, mb: 2, py: 1.5, textTransform: 'none' }}
                                    >
                                        {downloading.checklist ? 'Descargando...' : '📋 Descargar Checklist'}
                                    </Button>
                                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                        {checklistData.items?.map((item, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                {item.ok ? 
                                                    <CheckCircleIcon sx={{ color: colors.success, fontSize: 16 }} /> : 
                                                    <CloseIcon sx={{ color: colors.error, fontSize: 16 }} />
                                                }
                                                <Typography variant="body2">{item.label}</Typography>
                                                {item.observacion && (
                                                    <Typography variant="caption" color="text.secondary"> - {item.observacion}</Typography>
                                                )}
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

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const handleGoHome = () => navigate('/dashboard');

    // Función para cargar datos
    const cargarProductosYAsignaciones = useCallback(async () => {
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
            
            const asignacionesResponse = await api.get('/asignaciones/activas');
            let asignaciones = [];
            if (asignacionesResponse.data) {
                if (asignacionesResponse.data.success && Array.isArray(asignacionesResponse.data.data)) { asignaciones = asignacionesResponse.data.data; } 
                else if (Array.isArray(asignacionesResponse.data)) { asignaciones = asignacionesResponse.data; }
            }
            const activas = asignaciones.filter(a => !a.fecha_devolucion);
            setAsignacionesActivas(activas);
            
            const bodegasData = await productosServiceLocal.getBodegas();
            setBodegas(bodegasData || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos', 'error');
        }
    }, [searchTerm, filters.bodega_id]);

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true); else setLoading(true);
        setApiError(false);
        try {
            await cargarProductosYAsignaciones();
        } catch (error) {
            console.error('Error cargando datos:', error);
            setApiError(true);
            showSnackbar('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [cargarProductosYAsignaciones]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        try {
            await cargarProductosYAsignaciones();
        } catch (error) {
            console.error('Error refrescando datos:', error);
            showSnackbar('Error al actualizar los datos', 'error');
        } finally {
            setRefreshing(false);
        }
    }, [cargarProductosYAsignaciones]);

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

    const handleChecklistSuccess = async (result) => {
        if (result?.error) {
            showSnackbar(result.message, 'error');
        } else {
            showSnackbar(result.message || 'Proceso completado exitosamente', 'success');
            // Actualizar los datos después de una asignación exitosa
            if (result.refresh) {
                await refreshData();
            }
        }
        setOpenChecklistDialog(false);
        setProductoSeleccionado(null);
        setTipoAccionActual(null);
    };

    const handleRecepcionSuccess = async () => {
        showSnackbar('Recepción completada exitosamente', 'success');
        setOpenRecepcion(false);
        setProductoSeleccionado(null);
        setAsignacionSeleccionada(null);
        // Actualizar los datos después de una recepción exitosa
        await refreshData();
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

    if (loading && productos.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: colors.background }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando sistema de asignaciones...</Typography>
            </Box>
        );
    }

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
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 48, height: 48, mb: 1 }}><CheckCircleIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{totalDisponibles}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Productos Disponibles</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 48, height: 48, mb: 1 }}><AssignmentIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{totalAsignacionesNormales}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Asignaciones Activas</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.warning, 0.1), color: colors.warning, width: 48, height: 48, mb: 1 }}><PersonIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{totalPrestamos}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Préstamos Activos</Typography></CardContent></StyledCard></Grid>
                    <Grid item xs={12} sm={6} md={3}><StyledCard><CardContent><Avatar sx={{ bgcolor: alpha(colors.error, 0.1), color: colors.error, width: 48, height: 48, mb: 1 }}><InventoryIcon /></Avatar><Typography variant="h4" sx={{ fontWeight: 700 }}>{totalAsignados}</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Asignados</Typography></CardContent></StyledCard></Grid>
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
                            {paginatedProductos.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center"><InventoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} /><Typography variant="h6">No hay productos</Typography><Typography variant="body2" color="text.secondary">No se encontraron productos con los filtros aplicados</Typography></TableCell></TableRow>
                            ) : (
                                paginatedProductos.map((producto) => {
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
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                                                {estaDisponible ? (
                                                    <>
                                                        <Button variant="contained" size="small" startIcon={<AssignmentIcon />} onClick={() => handleAsignar(producto)} sx={{ bgcolor: colors.primary, borderRadius: 0, minWidth: 80 }}>Asignar</Button>
                                                        <Button variant="outlined" size="small" startIcon={<PersonIcon />} onClick={() => handlePrestamo(producto)} sx={{ borderRadius: 0, borderColor: colors.warning, color: colors.warning, minWidth: 80 }}>Préstamo</Button>
                                                    </>
                                                ) : estaAsignado ? (
                                                    <>
                                                        <Button variant="contained" size="small" startIcon={<ReceiptIcon />} onClick={() => handleRecibir(producto)} sx={{ bgcolor: esPrestamo ? colors.warning : colors.primary, borderRadius: 0, minWidth: 80 }}>Recibir</Button>
                                                        <IconButton size="small" onClick={() => handleVerDetalles(producto)} sx={{ color: esPrestamo ? colors.warning : colors.info }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
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
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 0 }}>{snackbar.message}</Alert></Snackbar>
            </Container>
        </Box>
    );
};

export default AsignacionPage;