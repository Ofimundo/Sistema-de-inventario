// src/pages/AnexosPage.jsx - VERSIÓN COMPLETA CON FIRMAS FUNCIONALES
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
    RadioGroup,
    Radio,
    FormControlLabel
} from '@mui/material';
import {
    Description,
    Assignment,
    Person,
    Business,
    CheckCircle,
    Close,
    Download,
    Visibility,
    Search,
    Delete,
    Refresh,
    Home,
    Warning,
    Edit
} from '@mui/icons-material';
import api from '../services/api';

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
// COMPONENTE DE FIRMA DIBUJADA
// ============================================
const FirmaDibujada = ({ onFirmaGuardada, valorInicial = '', height = 150, label = 'Firma' }) => {
    const canvasRef = React.useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (valorInicial && valorInicial !== '') {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setHasSignature(true);
                };
                img.src = valorInicial;
            }
        }
    }, [valorInicial]);

    const startDrawing = (e) => {
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
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const ctx = canvas.getContext('2d');
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
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSignature) {
            const canvas = canvasRef.current;
            const signatureDataUrl = canvas.toDataURL('image/png');
            onFirmaGuardada(signatureDataUrl);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onFirmaGuardada('');
    };

    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                {label}
            </Typography>
            <canvas
                ref={canvasRef}
                width={450}
                height={height}
                style={{
                    border: `2px solid #333`,
                    backgroundColor: 'white',
                    cursor: 'crosshair',
                    width: '100%',
                    height: 'auto',
                    touchAction: 'none',
                    borderRadius: 4
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button size="small" variant="outlined" onClick={clearCanvas} startIcon={<Close />} sx={{ borderRadius: 0 }}>
                    Limpiar
                </Button>
            </Box>
        </Box>
    );
};

// ============================================
// COMPONENTE DE FIRMA POR TEXTO
// ============================================
const FirmaTexto = ({ onFirmaCapturada, valorInicial = '', required = true, label = 'Firma' }) => {
    const [firma, setFirma] = useState(valorInicial);
    const [editando, setEditando] = useState(!valorInicial);
    const [temp, setTemp] = useState(valorInicial || '');

    const guardar = () => {
        if (required && !temp.trim()) return;
        setFirma(temp);
        setEditando(false);
        onFirmaCapturada(temp);
    };

    const editar = () => {
        setTemp(firma);
        setEditando(true);
    };

    const cancelar = () => {
        setTemp(firma);
        setEditando(false);
    };

    return (
        <Box sx={{ border: `1px solid #ddd`, p: 2, borderRadius: 1, bgcolor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ color: '#0A66C2', fontSize: 20 }} />
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </Typography>
            
            {editando ? (
                <>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Escriba el nombre completo de la persona que firma"
                        value={temp}
                        onChange={(e) => setTemp(e.target.value)}
                        sx={{ mb: 1 }}
                        helperText="Ej: Juan Pérez Pérez, RUT: 12.345.678-9"
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={cancelar} sx={{ borderRadius: 0 }}>Cancelar</Button>
                        <Button size="small" variant="contained" onClick={guardar} sx={{ borderRadius: 0 }}>Guardar</Button>
                    </Box>
                </>
            ) : (
                <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', border: `1px solid #4caf50`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {firma || (required ? 'Firma pendiente' : 'No especificada')}
                    </Typography>
                    <Button size="small" onClick={editar} sx={{ borderRadius: 0 }}>Editar</Button>
                </Box>
            )}
        </Box>
    );
};

// ============================================
// COMPONENTE DE DIÁLOGO PARA FIRMAR ANEXO
// ============================================
const FirmarAnexoDialog = ({ open, onClose, anexo, onFirmaExitosa }) => {
    const [firmaTrabajadorText, setFirmaTrabajadorText] = useState('');
    const [firmaGerenteText, setFirmaGerenteText] = useState('');
    const [firmaTrabajadorDibujo, setFirmaTrabajadorDibujo] = useState('');
    const [firmaGerenteDibujo, setFirmaGerenteDibujo] = useState('');
    const [tipoFirmaTrabajador, setTipoFirmaTrabajador] = useState('texto');
    const [tipoFirmaGerente, setTipoFirmaGerente] = useState('texto');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (open && anexo) {
            setFirmaTrabajadorText(anexo.colaborador_nombre || '');
            setFirmaGerenteText('');
            setFirmaTrabajadorDibujo('');
            setFirmaGerenteDibujo('');
            setError('');
        }
    }, [open, anexo]);

    const getFirmaTrabajadorFinal = () => {
        if (tipoFirmaTrabajador === 'dibujo') {
            return firmaTrabajadorDibujo || '';
        }
        return firmaTrabajadorText;
    };

    const getFirmaGerenteFinal = () => {
        if (tipoFirmaGerente === 'dibujo') {
            return firmaGerenteDibujo || '';
        }
        return firmaGerenteText;
    };

    // ============================================
    // handleFirmar - VERSIÓN CORREGIDA CON DESCARGAR PDF
    // ============================================
    const handleFirmar = async () => {
        const firmaTrabajador = getFirmaTrabajadorFinal();
        const firmaGerente = getFirmaGerenteFinal();

        if (!firmaTrabajador) {
            setError('La firma del trabajador es requerida');
            return;
        }

        if (!firmaGerente) {
            setError('La firma del gerente es requerida');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const response = await fetch(`${API_BASE_URL}/anexos/${anexo.id}/firmar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firma_trabajador: firmaTrabajador,
                    firma_gerente: firmaGerente
                })
            });

            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/pdf')) {
                // Es un PDF - descargar automáticamente
                const blob = await response.blob();
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `anexo_firmado_${anexo.id}.pdf`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }
                
                // Descargar el PDF
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                onFirmaExitosa({ success: true, message: 'Anexo firmado y descargado correctamente' });
                onClose();
            } else {
                // Es JSON - procesar normalmente
                const data = await response.json();
                if (data.success) {
                    onFirmaExitosa(data);
                    onClose();
                } else {
                    setError(data.message || 'Error al firmar el anexo');
                }
            }
        } catch (error) {
            console.error('❌ Error al firmar:', error);
            setError(error.message || 'Error al firmar el anexo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle sx={{ color: colors.success }} />
                    <Typography variant="h6" fontWeight={600}>
                        Firmar Anexo
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    ID Anexo: <strong>{anexo?.id}</strong> | Colaborador: <strong>{anexo?.colaborador_nombre}</strong>
                </Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            📄 Resumen del Anexo
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Producto:</Typography>
                                <Typography variant="body2">{anexo?.producto_nombre || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Serie:</Typography>
                                <Typography variant="body2">{anexo?.numero_serie || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Empresa:</Typography>
                                <Typography variant="body2">{anexo?.empresa || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Fecha:</Typography>
                                <Typography variant="body2">{anexo?.fecha_creacion ? new Date(anexo.fecha_creacion).toLocaleDateString() : 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Firma del Trabajador *
                        </Typography>
                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <RadioGroup
                                row
                                value={tipoFirmaTrabajador}
                                onChange={(e) => setTipoFirmaTrabajador(e.target.value)}
                            >
                                <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                            </RadioGroup>
                        </FormControl>
                        
                        {tipoFirmaTrabajador === 'texto' ? (
                            <FirmaTexto
                                onFirmaCapturada={setFirmaTrabajadorText}
                                valorInicial={firmaTrabajadorText}
                                required={true}
                                label="Firma del Trabajador"
                            />
                        ) : (
                            <FirmaDibujada
                                onFirmaGuardada={setFirmaTrabajadorDibujo}
                                valorInicial={firmaTrabajadorDibujo}
                                height={150}
                                label="Dibuje su firma aquí"
                            />
                        )}
                    </Box>

                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Firma del Gerente General *
                        </Typography>
                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <RadioGroup
                                row
                                value={tipoFirmaGerente}
                                onChange={(e) => setTipoFirmaGerente(e.target.value)}
                            >
                                <FormControlLabel value="texto" control={<Radio />} label="Firma por Texto" />
                                <FormControlLabel value="dibujo" control={<Radio />} label="Firma Dibujada" />
                            </RadioGroup>
                        </FormControl>
                        
                        {tipoFirmaGerente === 'texto' ? (
                            <FirmaTexto
                                onFirmaCapturada={setFirmaGerenteText}
                                valorInicial={firmaGerenteText}
                                required={true}
                                label="Firma del Gerente"
                            />
                        ) : (
                            <FirmaDibujada
                                onFirmaGuardada={setFirmaGerenteDibujo}
                                valorInicial={firmaGerenteDibujo}
                                height={150}
                                label="Dibuje su firma aquí"
                            />
                        )}
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ borderRadius: 1 }}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 0 }}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleFirmar}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    sx={{ borderRadius: 0, bgcolor: colors.success }}
                >
                    {loading ? 'Firmando...' : 'Firmar Anexo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const AnexosPage = () => {
    const navigate = useNavigate();
    const isMounted = useRef(true);
    
    const [activeStep, setActiveStep] = useState(0);
    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
    const [empresasDisponibles, setEmpresasDisponibles] = useState([]);
    const [firmaTrabajador, setFirmaTrabajador] = useState('');
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
    const [firmarDialogOpen, setFirmarDialogOpen] = useState(false);
    const [anexoSeleccionado, setAnexoSeleccionado] = useState(null);

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
                cargarProductos(),
                cargarColaboradores(),
                cargarAnexos()
            ]);
            if (isMounted.current) {
                setInitialLoading(false);
            }
        };
        cargarDatosIniciales();
    }, []);

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

    const cargarProductos = async () => {
        try {
            const response = await api.get('/productos');
            let productosData = [];
            if (response.data?.data && Array.isArray(response.data.data)) {
                productosData = response.data.data;
            } else if (Array.isArray(response.data)) {
                productosData = response.data;
            }
            
            const productosProcesados = (productosData || []).map(p => ({
                id: p.id,
                nombre: p.nombre || 'Sin nombre',
                marca: p.marca || 'N/A',
                modelo: p.modelo || 'N/A',
                numero_serie: p.numero_serie || 'N/A',
                condicion: p.condicion || 'NUEVO',
                id_estado_equipo: p.id_estado_equipo || 1,
                estado_texto: getEstadoTexto(p.id_estado_equipo),
                colaborador_asignado: p.colaborador_asignado || null
            }));
            
            if (isMounted.current) {
                setProductos(productosProcesados);
                console.log(`✅ ${productosProcesados.length} productos cargados`);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            if (isMounted.current) setError('Error al cargar los productos');
        }
    };

    const cargarColaboradores = async () => {
        try {
            const response = await api.get('/colaboradores');
            let colaboradoresData = [];
            if (response.data?.data && Array.isArray(response.data.data)) {
                colaboradoresData = response.data.data;
            } else if (Array.isArray(response.data)) {
                colaboradoresData = response.data;
            }
            if (isMounted.current) {
                setColaboradores(colaboradoresData || []);
                console.log(`✅ ${(colaboradoresData || []).length} colaboradores cargados`);
            }
        } catch (error) {
            console.error('Error cargando colaboradores:', error);
            if (isMounted.current) setError('Error al cargar los colaboradores');
        }
    };

    const cargarAnexos = async () => {
        try {
            const response = await api.get('/anexos');
            console.log('📄 Anexos cargados:', response.data);
            if (isMounted.current) {
                let anexosData = [];
                if (response.data?.success && Array.isArray(response.data.data)) {
                    anexosData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    anexosData = response.data;
                }
                setAnexos(anexosData);
                console.log(`✅ ${anexosData.length} anexos cargados`);
            }
        } catch (error) {
            console.error('Error cargando anexos:', error);
            if (isMounted.current) setAnexos([]);
        }
    };

    const getEstadoTexto = (estadoId) => {
        const estados = { 1: 'DISPONIBLE', 2: 'ASIGNADO', 3: 'EN MANTENCIÓN', 4: 'EN REPARACIÓN', 5: 'NO DISPONIBLE', 6: 'BAJA' };
        return estados[estadoId] || 'DESCONOCIDO';
    };

    const getEstadoColor = (estadoId) => {
        const colores = { 1: '#10B981', 2: '#F59E0B', 3: '#3B82F6', 4: '#EF4444', 5: '#6B7280', 6: '#9CA3AF' };
        return colores[estadoId] || '#6B7280';
    };

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        if (producto.colaborador_asignado && producto.colaborador_asignado.id) {
            setColaboradorSeleccionado({
                id: producto.colaborador_asignado.id,
                nombre: producto.colaborador_asignado.nombre || '',
                rut: producto.colaborador_asignado.rut || '',
                email: producto.colaborador_asignado.email || '',
                cargo: producto.colaborador_asignado.cargo || '',
                departamento: producto.colaborador_asignado.departamento || ''
            });
            setFirmaTrabajador(producto.colaborador_asignado.nombre);
        } else {
            setColaboradorSeleccionado(null);
            setFirmaTrabajador('');
        }
        setActiveStep(2);
    };

    const handleSeleccionarColaborador = (colaborador) => {
        setColaboradorSeleccionado(colaborador);
        setFirmaTrabajador(colaborador.nombre);
        setActiveStep(3);
    };

    const handleGenerarAnexo = async () => {
        if (!productoSeleccionado || !colaboradorSeleccionado) {
            setError('Faltan datos del producto o colaborador');
            return;
        }
        if (!empresaSeleccionada) {
            setError('Debe seleccionar una empresa');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/anexos/generar', {
                colaborador: {
                    id: colaboradorSeleccionado.id,
                    nombre: colaboradorSeleccionado.nombre,
                    rut: colaboradorSeleccionado.rut,
                    email: colaboradorSeleccionado.email || '',
                    cargo: colaboradorSeleccionado.cargo || '',
                    departamento: colaboradorSeleccionado.departamento || '',
                    direccion: colaboradorSeleccionado.direccion || ''
                },
                producto: {
                    id: productoSeleccionado.id,
                    nombre: productoSeleccionado.nombre,
                    marca: productoSeleccionado.marca || 'N/A',
                    modelo: productoSeleccionado.modelo || 'N/A',
                    numero_serie: productoSeleccionado.numero_serie || 'N/A',
                    condicion: productoSeleccionado.condicion || 'NUEVO',
                    tipo: 'Equipo'
                },
                empresa: empresaSeleccionada,
                observaciones: observaciones,
                firma_trabajador: firmaTrabajador || colaboradorSeleccionado.nombre,
                firma_gerente: null,
                asignacion_id: null
            }, {
                responseType: 'blob'
            });
            
            const contentType = response.headers['content-type'] || 'application/pdf';
            const isPdf = contentType.toLowerCase().includes('pdf');
            const fileExt = isPdf ? 'pdf' : 'docx';

            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `anexo_${empresaSeleccionada.replace(/\s/g, '_')}_${colaboradorSeleccionado.nombre.replace(/\s/g, '_')}_${Date.now()}.${fileExt}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setSuccess('Anexo generado correctamente');
            setActiveStep(4);
            setTimeout(async () => { await cargarAnexos(); }, 1000);
            setTimeout(() => {
                if (isMounted.current) {
                    setActiveStep(0);
                    setProductoSeleccionado(null);
                    setColaboradorSeleccionado(null);
                    setFirmaTrabajador('');
                    setObservaciones('');
                    setSearchTerm('');
                }
            }, 3000);
        } catch (error) {
            console.error('Error generando anexo:', error);
            setError(error.response?.data?.message || 'Error al generar el anexo');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarAnexo = async (anexo) => {
        try {
            const response = await api.get(`/anexos/descargar/${anexo.id}`, { responseType: 'blob' });
            const contentType = response.headers['content-type'] || 'application/pdf';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const isPdf = contentType.toLowerCase().includes('pdf') || anexo.documento_generado?.endsWith('.pdf');
            const defaultFilename = `anexo_${anexo.id}.${isPdf ? 'pdf' : 'docx'}`;
            link.download = anexo.documento_generado || defaultFilename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setSuccess('Documento descargado correctamente');
        } catch (error) {
            console.error('Error:', error);
            setError('Error al descargar el documento');
        }
    };

    const handleFirmarAnexo = (anexo) => {
        setAnexoSeleccionado(anexo);
        setFirmarDialogOpen(true);
    };

    const handleFirmaExitosa = (response) => {
        setSuccess('✅ Anexo firmado correctamente');
        cargarAnexos();
        setTimeout(() => {
            setSuccess('');
        }, 5000);
    };

    const handleEliminarAnexo = (anexo) => {
        setAnexoToDelete(anexo);
        setDeleteDialogOpen(true);
    };

    const confirmarEliminar = async () => {
        if (!anexoToDelete) return;
        setEliminando(true);
        try {
            await api.delete(`/anexos/${anexoToDelete.id}`);
            setSuccess('Anexo eliminado correctamente');
            await cargarAnexos();
            setDeleteDialogOpen(false);
            // Evitar nullificar inmediatamente para que el Dialog no falle en su animación de cierre
            setTimeout(() => setAnexoToDelete(null), 300);
        } catch (error) {
            console.error('Error:', error);
            setError(error?.message || 'Error al eliminar el anexo');
        } finally {
            setEliminando(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([cargarEmpresas(), cargarProductos(), cargarColaboradores(), cargarAnexos()]);
        setRefreshing(false);
        setSuccess('Datos actualizados correctamente');
    };

    const handleVolverInicio = () => navigate('/dashboard');

    const productosFiltrados = (productos || []).filter(p =>
        p.nombre?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        p.numero_serie?.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const colaboradoresFiltrados = (colaboradores || []).filter(c =>
        c.nombre?.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        c.rut?.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (initialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: colors.background }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: colors.surface, color: colors.text.primary, borderBottom: `1px solid ${colors.border}` }}>
                <Toolbar>
                    <IconButton edge="start" onClick={handleVolverInicio} sx={{ mr: 2 }}>
                        <Home />
                    </IconButton>
                    <Description sx={{ mr: 1, color: colors.primary }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Anexos de Contrato
                    </Typography>
                    <IconButton onClick={refreshData} disabled={refreshing}>
                        {refreshing ? <CircularProgress size={24} /> : <Refresh />}
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
                <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 0, background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`, color: 'white' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Anexos de Contrato</Typography>
                    <Typography sx={{ opacity: 0.9, mb: 3 }}>Generación de anexos de entrega de herramientas de trabajo</Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                            variant={!verAnexos ? 'contained' : 'outlined'}
                            onClick={() => setVerAnexos(false)}
                            startIcon={<Description />}
                            sx={{ 
                                bgcolor: !verAnexos ? 'white' : 'transparent',
                                color: !verAnexos ? colors.primary : 'white',
                                borderColor: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Nuevo Anexo
                        </Button>
                        <Button 
                            variant={verAnexos ? 'contained' : 'outlined'}
                            onClick={() => { setVerAnexos(true); cargarAnexos(); }}
                            startIcon={<Visibility />}
                            sx={{ 
                                bgcolor: verAnexos ? 'white' : 'transparent',
                                color: verAnexos ? colors.primary : 'white',
                                borderColor: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Ver Anexos Generados
                        </Button>
                    </Box>
                </Paper>

                {!verAnexos ? (
                    <Paper sx={{ p: 3 }}>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            <Step>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                        <Business />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 1: Seleccionar Empresa</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Selecciona la empresa para el anexo
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Empresa</InputLabel>
                                        <Select 
                                            value={empresaSeleccionada} 
                                            onChange={(e) => setEmpresaSeleccionada(e.target.value)} 
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
                                            onClick={() => setActiveStep(1)} 
                                            disabled={!empresaSeleccionada}
                                        >
                                            Continuar
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}>
                                        <Assignment />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 2: Seleccionar Producto</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Selecciona el equipo que se entregará
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Buscar producto por nombre, serie o marca..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                                        }}
                                        sx={{ mb: 2 }}
                                    />
                                    <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        {productosFiltrados.length === 0 ? (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography color="text.secondary">No hay productos disponibles</Typography>
                                                <Button size="small" onClick={refreshData} sx={{ mt: 1 }}>
                                                    Recargar productos
                                                </Button>
                                            </Box>
                                        ) : (
                                            productosFiltrados.map((producto) => (
                                                <Box
                                                    key={producto.id}
                                                    sx={{
                                                        p: 2,
                                                        borderBottom: `1px solid ${colors.border}`,
                                                        cursor: 'pointer',
                                                        bgcolor: productoSeleccionado?.id === producto.id ? alpha(colors.primary, 0.05) : 'transparent',
                                                        '&:hover': { bgcolor: alpha(colors.primary, 0.02) }
                                                    }}
                                                    onClick={() => handleSeleccionarProducto(producto)}
                                                >
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                                        <Box flex={1}>
                                                            <Typography variant="body1" fontWeight={500}>{producto.nombre}</Typography>
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                Serie: {producto.numero_serie || 'N/A'} | Marca: {producto.marca || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                        <Chip 
                                                            label={producto.estado_texto} 
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: alpha(getEstadoColor(producto.id_estado_equipo), 0.1),
                                                                color: getEstadoColor(producto.id_estado_equipo)
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ))
                                        )}
                                    </Paper>
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                        <Button onClick={() => setActiveStep(0)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => setActiveStep(2)} disabled={!productoSeleccionado}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary }}>
                                        <Person />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 3: Seleccionar Colaborador</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Selecciona el colaborador que recibirá el equipo
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Buscar colaborador por nombre, RUT o email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        sx={{ mb: 2 }}
                                    />
                                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                                        {colaboradoresFiltrados.length === 0 ? (
                                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography color="text.secondary">No hay colaboradores</Typography>
                                                <Button size="small" onClick={refreshData} sx={{ mt: 1 }}>
                                                    Recargar colaboradores
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
                                                    <Box>
                                                        <Typography variant="body1" fontWeight={500}>{col.nombre}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            RUT: {col.rut} | {col.cargo || 'Sin cargo'} | {col.departamento || 'Sin departamento'}
                                                        </Typography>
                                                        {col.email && (
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                {col.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {colaboradorSeleccionado?.id === col.id && (
                                                        <CheckCircle sx={{ color: colors.success }} />
                                                    )}
                                                </Box>
                                            ))
                                        )}
                                    </Paper>
                                    <Box display="flex" justifyContent="space-between">
                                        <Button onClick={() => setActiveStep(1)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => setActiveStep(3)} disabled={!colaboradorSeleccionado}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success }}>
                                        <Business />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 4: Detalles y Generación</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Completa la información para generar el documento
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Firma del Trabajador"
                                                value={firmaTrabajador}
                                                onChange={(e) => setFirmaTrabajador(e.target.value)}
                                                helperText="Nombre de quien firma como trabajador"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Observaciones"
                                                value={observaciones}
                                                onChange={(e) => setObservaciones(e.target.value)}
                                                multiline
                                                rows={3}
                                                placeholder="Observaciones adicionales para el anexo..."
                                            />
                                        </Grid>
                                    </Grid>

                                    <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: alpha(colors.info, 0.05) }}>
                                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>📋 Resumen del documento</Typography>
                                        <Divider sx={{ mb: 1 }} />
                                        <Typography variant="body2">
                                            <strong>Empresa:</strong> {empresaSeleccionada}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Producto:</strong> {productoSeleccionado?.nombre} (Serie: {productoSeleccionado?.numero_serie})
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Colaborador:</strong> {colaboradorSeleccionado?.nombre} - {colaboradorSeleccionado?.rut}
                                        </Typography>
                                    </Paper>

                                    <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                                        <Button onClick={() => setActiveStep(2)} variant="outlined">Atrás</Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleGenerarAnexo}
                                            disabled={loading}
                                            sx={{ bgcolor: colors.success }}
                                        >
                                            {loading ? <CircularProgress size={24} /> : 'Generar Anexo'}
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success }}>
                                        <CheckCircle />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 5: ¡Anexo Generado!</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        El documento ha sido generado correctamente
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        El anexo ha sido generado correctamente.
                                    </Alert>
                                    <Box display="flex" gap={2}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={() => {
                                                setActiveStep(0);
                                                setProductoSeleccionado(null);
                                                setColaboradorSeleccionado(null);
                                                setFirmaTrabajador('');
                                                setObservaciones('');
                                                setSearchTerm('');
                                                cargarProductos();
                                                cargarColaboradores();
                                            }}
                                        >
                                            Crear Nuevo Anexo
                                        </Button>
                                        <Button variant="contained" onClick={() => { setVerAnexos(true); cargarAnexos(); }}>
                                            Ver Anexos Generados
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>
                        </Stepper>
                    </Paper>
                ) : (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>📄 Anexos Generados</Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(colors.primary, 0.05) }}>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Colaborador</strong></TableCell>
                                        <TableCell><strong>Producto</strong></TableCell>
                                        <TableCell><strong>Empresa</strong></TableCell>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
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
                                                    <Typography variant="caption" color="text.secondary">{anexo.colaborador_rut || 'N/A'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{anexo.producto_nombre || 'N/A'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Serie: {anexo.numero_serie || 'N/A'}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={anexo.empresa || 'N/A'} 
                                                        size="small"
                                                        sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary }}
                                                    />
                                                </TableCell>
                                                <TableCell>{anexo.fecha_creacion ? new Date(anexo.fecha_creacion).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={anexo.estado || 'PENDIENTE'}
                                                        size="small"
                                                        sx={{ 
                                                            bgcolor: anexo.estado === 'FIRMADO' ? alpha(colors.success, 0.1) : alpha(colors.warning, 0.1),
                                                            color: anexo.estado === 'FIRMADO' ? colors.success : colors.warning
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        {anexo.estado !== 'FIRMADO' && (
                                                            <Tooltip title="Firmar">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleFirmarAnexo(anexo)} 
                                                                    sx={{ color: colors.success }}
                                                                >
                                                                    <CheckCircle fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Descargar">
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
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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

                {/* Diálogo de confirmación para eliminar */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
                                    <strong>Producto:</strong> {anexoToDelete.producto_nombre || 'N/A'}<br />
                                    <strong>Fecha:</strong> {anexoToDelete.fecha_creacion ? new Date(anexoToDelete.fecha_creacion).toLocaleDateString() : 'N/A'}
                                </Box>
                            )}
                        </Typography>
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            Esta acción no se puede deshacer.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
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

                {/* Diálogo para firmar anexo */}
                <FirmarAnexoDialog 
                    open={firmarDialogOpen}
                    onClose={() => {
                        setFirmarDialogOpen(false);
                        setAnexoSeleccionado(null);
                    }}
                    anexo={anexoSeleccionado}
                    onFirmaExitosa={handleFirmaExitosa}
                />

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
        </Box>
    );
};

// Error boundary para capturar el error que causa la pantalla blanca
class AnexosPageErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary atrapó un error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box p={4} m={4} bgcolor="#fff" borderRadius={2} border="1px solid red">
                    <Typography variant="h5" color="error" gutterBottom>
                        Ocurrió un error inesperado (Pantalla Blanca)
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Por favor, toma una captura de este error y envíala para corregirlo:
                    </Typography>
                    <Box component="pre" p={2} bgcolor="#f5f5f5" borderRadius={1} overflow="auto" fontSize={12}>
                        <code>{this.state.error && this.state.error.toString()}</code>
                        <br />
                        <code>{this.state.errorInfo && this.state.errorInfo.componentStack}</code>
                    </Box>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
                        Recargar página
                    </Button>
                </Box>
            );
        }
        return <AnexosPage {...this.props} />;
    }
}

export default AnexosPageErrorBoundary;