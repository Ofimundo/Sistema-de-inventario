// src/pages/AnexosPage.jsx - VERSIÓN COMPLETAMENTE LIMPIA (SIN ESTADO, SIN FIRMAS)
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
    Container
} from '@mui/material';
import {
    Description,
    Assignment,
    Person,
    Business,
    CheckCircle,
    Download,
    Visibility,
    Search,
    Delete,
    Refresh,
    Home,
    Warning
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

const descargarPDF = (blob, filename) => {
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
            const response = await api.get('/anexos?_t=' + Date.now());
            console.log('📄 Respuesta del backend:', response.data);
            
            if (isMounted.current) {
                let anexosData = [];
                if (response.data?.success && Array.isArray(response.data.data)) {
                    anexosData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    anexosData = response.data;
                }
                
                // ELIMINAR CUALQUIER CAMPO "estado"
                anexosData = anexosData.map(item => {
                    const cleanItem = {};
                    Object.keys(item).forEach(key => {
                        if (key.toLowerCase() !== 'estado' && key.toLowerCase() !== 'status') {
                            cleanItem[key] = item[key];
                        }
                    });
                    return cleanItem;
                });
                
                setAnexos(anexosData);
                console.log(`✅ ${anexosData.length} anexos cargados (sin estado)`);
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
        } else {
            setColaboradorSeleccionado(null);
        }
        setActiveStep(2);
    };

    const handleSeleccionarColaborador = (colaborador) => {
        setColaboradorSeleccionado(colaborador);
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
                    asignacion_id: null
                })
            });

            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/pdf')) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `anexo_${empresaSeleccionada.replace(/\s/g, '_')}_${colaboradorSeleccionado.nombre.replace(/\s/g, '_')}_${Date.now()}.pdf`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '');
                    }
                }
                
                descargarPDF(blob, filename);
                setSuccess('Anexo generado correctamente');
                setActiveStep(4);
                await cargarAnexos();
                setTimeout(() => {
                    if (isMounted.current) {
                        setActiveStep(0);
                        setProductoSeleccionado(null);
                        setColaboradorSeleccionado(null);
                        setObservaciones('');
                        setSearchTerm('');
                    }
                }, 3000);
            } else {
                const data = await response.json();
                if (data.success) {
                    setSuccess('Anexo generado correctamente');
                    setActiveStep(4);
                    await cargarAnexos();
                    setTimeout(() => {
                        if (isMounted.current) {
                            setActiveStep(0);
                            setProductoSeleccionado(null);
                            setColaboradorSeleccionado(null);
                            setObservaciones('');
                            setSearchTerm('');
                        }
                    }, 3000);
                } else {
                    throw new Error(data.message || 'Error al generar el anexo');
                }
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
            const contentType = response.headers['content-type'] || 'application/pdf';
            const blob = new Blob([response.data], { type: contentType });
            
            const isPdf = contentType.toLowerCase().includes('pdf') || anexo.documento_generado?.endsWith('.pdf');
            const defaultFilename = `anexo_${anexo.id}.${isPdf ? 'pdf' : 'docx'}`;
            const filename = anexo.documento_generado || defaultFilename;
            
            descargarPDF(blob, filename);
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
        await Promise.all([cargarEmpresas(), cargarProductos(), cargarColaboradores(), cargarAnexos()]);
        setRefreshing(false);
        setSuccess('Datos actualizados correctamente');
    };

    const handleVolverInicio = () => navigate('/dashboard');

    const handleStepChange = (step) => {
        setActiveStep(step);
    };

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
                            onClick={() => {
                                setVerAnexos(false);
                                setActiveStep(0);
                            }}
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
                            onClick={() => { 
                                setVerAnexos(true); 
                                cargarAnexos(); 
                            }}
                            startIcon={<Visibility />}
                            sx={{ 
                                bgcolor: verAnexos ? 'white' : 'transparent',
                                color: verAnexos ? colors.primary : 'white',
                                borderColor: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }}
                            }
                        >
                            Ver Anexos Generados
                        </Button>
                    </Box>
                </Paper>

                {!verAnexos ? (
                    <Paper sx={{ p: 3 }}>
                        <Stepper activeStep={activeStep} orientation="vertical">
                            <Step expanded={activeStep === 0}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 32, height: 32 }}>
                                        <Business fontSize="small" />
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
                                            onClick={() => handleStepChange(1)} 
                                            disabled={!empresaSeleccionada}
                                        >
                                            Continuar
                                        </Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step expanded={activeStep === 1}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.primary, 0.1), color: colors.primary, width: 32, height: 32 }}>
                                        <Assignment fontSize="small" />
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
                                        <Button onClick={() => handleStepChange(0)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => handleStepChange(2)} disabled={!productoSeleccionado}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step expanded={activeStep === 2}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.secondary, 0.1), color: colors.secondary, width: 32, height: 32 }}>
                                        <Person fontSize="small" />
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
                                        <Button onClick={() => handleStepChange(1)} variant="outlined">Atrás</Button>
                                        <Button variant="contained" onClick={() => handleStepChange(3)} disabled={!colaboradorSeleccionado}>Continuar</Button>
                                    </Box>
                                </StepContent>
                            </Step>

                            <Step expanded={activeStep === 3}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 32, height: 32 }}>
                                        <Business fontSize="small" />
                                    </Avatar>
                                )}>
                                    <Typography variant="h6">Paso 4: Confirmar y Generar</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Confirma los datos para generar el documento
                                    </Typography>
                                </StepLabel>
                                <StepContent>
                                    <Grid container spacing={2}>
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
                                        {observaciones && (
                                            <Typography variant="body2">
                                                <strong>Observaciones:</strong> {observaciones}
                                            </Typography>
                                        )}
                                    </Paper>

                                    <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                                        <Button onClick={() => handleStepChange(2)} variant="outlined">Atrás</Button>
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

                            <Step expanded={activeStep === 4}>
                                <StepLabel StepIconComponent={() => (
                                    <Avatar sx={{ bgcolor: alpha(colors.success, 0.1), color: colors.success, width: 32, height: 32 }}>
                                        <CheckCircle fontSize="small" />
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
                                                handleStepChange(0);
                                                setProductoSeleccionado(null);
                                                setColaboradorSeleccionado(null);
                                                setObservaciones('');
                                                setSearchTerm('');
                                                cargarProductos();
                                                cargarColaboradores();
                                            }}
                                        >
                                            Crear Nuevo Anexo
                                        </Button>
                                        <Button variant="contained" onClick={() => { 
                                            setVerAnexos(true); 
                                            cargarAnexos(); 
                                        }}>
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
                                                 <TableCell>{formatearFechaSegura(anexo.fecha_creacion)}</TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
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
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                                    <strong>Producto:</strong> {anexoToDelete.producto_nombre || 'N/A'}<br />
                                    <strong>Fecha:</strong> {formatearFechaSegura(anexoToDelete.fecha_creacion)}
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
        </Box>
    );
};

export default AnexosPage;