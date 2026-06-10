// src/pages/Dashboard.jsx - VERSIÓN COMPLETA CORREGIDA (SIN PANTALLA EN BLANCO)
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Drawer,
  useMediaQuery,
  Snackbar,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
  Switch,
  Fab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Stack,
  Chip
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  Autorenew as AutorenewIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Inventory2 as Inventory2Icon,
  BarChart as BarChartIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";
import api from "../services/api";

const drawerWidth = 260;

// ============================================
// SERVICIO DE PRODUCTOS
// ============================================
const productosService = {
  getProductos: async () => {
    try {
      const response = await api.get("/productos");
      let productos = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        productos = response.data.data;
      } else if (Array.isArray(response.data)) {
        productos = response.data;
      }
      return productos.map(p => ({
        ...p,
        id_estado_equipo: Number(p.id_estado_equipo) || 1,
        cantidad: p.cantidad || 1,
        precio: p.precio || 0
      }));
    } catch (error) {
      console.error("Error fetching productos:", error);
      return [];
    }
  },
  
  getStats: async (productos) => {
    const productosArray = Array.isArray(productos) ? productos : [];
    const estadosBaja = [5, 6];
    const productosActivos = productosArray.filter(p => !estadosBaja.includes(p.id_estado_equipo));
    const productosDadosDeBaja = productosArray.filter(p => estadosBaja.includes(p.id_estado_equipo));
    
    return {
      totalProductos: productosArray.length,
      dadosDeBaja: productosDadosDeBaja.length,
      totalActivos: productosActivos.length,
      disponibles: productosActivos.filter(p => p.id_estado_equipo === 1).length,
      asignados: productosActivos.filter(p => p.id_estado_equipo === 2).length,
      enMantencion: productosActivos.filter(p => p.id_estado_equipo === 3).length,
      enReparacion: productosActivos.filter(p => p.id_estado_equipo === 4).length,
      bajoStock: productosActivos.filter(p => (p.cantidad || 1) < 5).length,
      valorTotal: productosActivos.reduce((sum, p) => sum + ((p.precio || 0) * (p.cantidad || 1)), 0),
    };
  },
  
  exportExcel: async () => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = api.defaults.baseURL || 'https://sistema-inventario-backend-p3xg.onrender.com/api';
      const exportUrl = `${baseURL}/export/productos`;
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al generar el reporte');
      return await response.blob();
    } catch (error) {
      console.error("Error exporting Excel:", error);
      throw error;
    }
  },
  
  search: async (term, productos) => {
    const productosArray = Array.isArray(productos) ? productos : [];
    const lowerTerm = term.toLowerCase();
    return productosArray.filter(p => 
      (p.nombre?.toLowerCase() || '').includes(lowerTerm) ||
      (p.codigo?.toLowerCase() || '').includes(lowerTerm) ||
      (p.marca?.toLowerCase() || '').includes(lowerTerm) ||
      (p.numero_serie?.toLowerCase() || '').includes(lowerTerm)
    );
  }
};

const bodegasService = {
  getBodegas: async () => {
    try {
      const response = await api.get("/bodegas");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching bodegas:", error);
      return [];
    }
  }
};

// ============================================
// SERVICIO DE PRÉSTAMOS - CORREGIDO CON MANEJO DE ERRORES
// ============================================
const prestamosService = {
  getStatsPrestamos: async () => {
    try {
      console.log('📊 Obteniendo estadísticas de préstamos...');
      const response = await api.get('/asignaciones/activas');
      
      let asignaciones = [];
      
      // Manejar diferentes estructuras de respuesta
      if (response.data?.data && Array.isArray(response.data.data)) {
        asignaciones = response.data.data;
      } else if (Array.isArray(response.data)) {
        asignaciones = response.data;
      } else if (response.data?.asignaciones && Array.isArray(response.data.asignaciones)) {
        asignaciones = response.data.asignaciones;
      } else {
        console.warn('⚠️ Estructura de datos no reconocida:', response.data);
        return { total: 0, activos: 0 };
      }
      
      // Verificar que asignaciones sea un array
      if (!Array.isArray(asignaciones)) {
        console.warn('⚠️ asignaciones no es un array:', asignaciones);
        return { total: 0, activos: 0 };
      }
      
      // Filtrar préstamos de manera segura (manejar cuando es_prestamo no existe)
      const prestamos = asignaciones.filter(a => {
        if (a && typeof a === 'object') {
          if (a.es_prestamo !== undefined) {
            return a.es_prestamo === true || a.es_prestamo === 1 || a.es_prestamo === 'true';
          }
          return false;
        }
        return false;
      });
      
      const activos = prestamos.filter(p => {
        if (p && typeof p === 'object') {
          return !p.fecha_devolucion;
        }
        return false;
      }).length;
      
      console.log(`📊 Préstamos encontrados: ${prestamos.length}, activos: ${activos}`);
      
      return { total: prestamos.length, activos };
      
    } catch (error) {
      console.error("Error obteniendo préstamos:", error);
      return { total: 0, activos: 0 };
    }
  }
};

// ============================================
// AUTH SERVICE
// ============================================
const authService = {
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return null;
      return JSON.parse(user);
    } catch {
      return null;
    }
  },
  
  updateProfile: async (userData) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Usuario no encontrado' };
    }
    
    const updatedUser = { 
      ...currentUser, 
      nombre: userData.nombre || currentUser.nombre,
      email: userData.email || currentUser.email,
      cargo: userData.cargo || currentUser.cargo,
      departamento: userData.departamento || currentUser.departamento,
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    try {
      await api.put('/auth/profile', {
        nombre: userData.nombre,
        email: userData.email,
        cargo: userData.cargo || '',
        departamento: userData.departamento || '',
      });
    } catch (error) {
      console.warn('Error en backend, datos guardados localmente');
    }
    
    return { 
      success: true, 
      usuario: updatedUser, 
      message: 'Perfil actualizado correctamente' 
    };
  },
  
  changePassword: async (currentPassword, newPassword) => {
    try {
      console.log('🔐 Enviando solicitud de cambio de contraseña...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, message: 'No hay sesión activa.' };
      }
      
      const response = await api.post('/auth/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      
      console.log('📥 Respuesta del servidor:', response.data);
      
      if (response.data && response.data.success) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        return { 
          success: true, 
          message: response.data.message || 'Contraseña cambiada correctamente'
        };
      }
      
      return { 
        success: false, 
        message: response.data?.message || 'Error al cambiar contraseña' 
      };
    } catch (error) {
      console.error('❌ Error en changePassword:', error);
      
      let errorMessage = 'Error de conexión con el servidor';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data?.message || 'La nueva contraseña debe tener al menos 6 caracteres';
            break;
          case 401:
            errorMessage = 'Contraseña actual incorrecta';
            break;
          case 404:
            errorMessage = 'Endpoint no disponible. Contacta al administrador.';
            break;
          default:
            errorMessage = error.response.data?.message || 'Error al cambiar contraseña';
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },
};

// ================= ESTILOS =================
const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  border: "1px solid #E2E8F0",
  transition: "all .25s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
  },
}));

const StatCard = ({ icon: Icon, title, value, change, color, loading, onClick }) => (
  <StyledCard onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
    <CardContent>
      <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 50, height: 50, mb: 2 }}>
        <Icon />
      </Avatar>
      <Typography variant="h5" fontWeight={700}>
        {loading ? <Skeleton width={40} /> : value ?? 0}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
      {change && !loading && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{change}</Typography>
      )}
    </CardContent>
  </StyledCard>
);

const NavigationCard = ({ icon: Icon, title, description, onClick, color }) => (
  <StyledCard onClick={onClick} sx={{ cursor: "pointer", textAlign: "center" }}>
    <CardContent>
      <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, mx: "auto", mb: 1 }}>
        <Icon sx={{ fontSize: { xs: 24, sm: 28 } }} />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "0.9rem", sm: "1.1rem" } }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>{description}</Typography>
    </CardContent>
  </StyledCard>
);

const ScrollToTopFab = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <Fab color="primary" size="small" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000, display: show ? "flex" : "none" }}>
      <KeyboardArrowUpIcon />
    </Fab>
  );
};

// ============================================
// DIÁLOGO DE PERFIL
// ============================================
const PerfilDialog = ({ open, onClose, user, onProfileUpdate, showSnackbar }) => {
  const [formData, setFormData] = useState({ 
    nombre: '', 
    email: '', 
    cargo: '', 
    departamento: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFormData({
        nombre: user?.nombre || '',
        email: user?.email || '',
        cargo: user?.cargo || '',
        departamento: user?.departamento || ''
      });
      setErrors({});
    }
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre?.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.email?.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.updateProfile({
        nombre: formData.nombre,
        email: formData.email,
        cargo: formData.cargo,
        departamento: formData.departamento
      });
      
      if (result.success) {
        showSnackbar('Perfil actualizado correctamente', 'success');
        if (onProfileUpdate) onProfileUpdate(result.usuario);
        onClose();
      } else {
        showSnackbar(result.message || 'Error al actualizar perfil', 'error');
      }
    } catch (error) {
      showSnackbar('Error al actualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${alpha('#2563EB', 0.02)} 0%, ${alpha('#7C3AED', 0.02)} 100%)`
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ color: '#2563EB' }} />
          <Typography variant="h6">Editar Perfil</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Actualiza tu información personal
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Nombre completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={!!errors.nombre}
            helperText={errors.nombre}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#667eea' }} /></InputAdornment>
            }}
          />
          
          <TextField
            fullWidth
            label="Correo electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#667eea' }} /></InputAdornment>
            }}
          />
          
          <TextField
            fullWidth
            label="Cargo"
            name="cargo"
            value={formData.cargo}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: Administrador, Técnico, etc."
            InputProps={{
              startAdornment: <InputAdornment position="start"><WorkIcon sx={{ color: '#667eea' }} /></InputAdornment>
            }}
          />
          
          <TextField
            fullWidth
            label="Departamento"
            name="departamento"
            value={formData.departamento}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ej: TI, Logística, Ventas, etc."
            InputProps={{
              startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ color: '#667eea' }} /></InputAdornment>
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading} 
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================
// DIÁLOGO DE CAMBIO DE CONTRASEÑA
// ============================================
const CambiarPasswordDialog = ({ open, onClose, showSnackbar, onLogout }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result.success) {
        showSnackbar('¡Contraseña cambiada correctamente!', 'success');
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        onClose();
        
        setTimeout(() => {
          showSnackbar('Por favor, inicia sesión nuevamente con tu nueva contraseña', 'info');
          setTimeout(() => {
            if (onLogout) onLogout();
          }, 2000);
        }, 1000);
      } else {
        showSnackbar(result.message || 'Error al cambiar contraseña', 'error');
      }
    } catch (error) {
      console.error('Error en cambio de contraseña:', error);
      showSnackbar('Error al cambiar contraseña. Intenta nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        background: `linear-gradient(135deg, ${alpha('#2563EB', 0.02)} 0%, ${alpha('#7C3AED', 0.02)} 100%)`
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon sx={{ color: '#2563EB' }} />
          <Typography variant="h6">Cambiar Contraseña</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Ingresa tu contraseña actual y la nueva contraseña
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Contraseña actual"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handleChange}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            disabled={loading}
          />
          
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Nueva contraseña"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handleChange}
            error={!!errors.newPassword}
            helperText={errors.newPassword || "Mínimo 6 caracteres"}
            disabled={loading}
          />
          
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            label="Confirmar nueva contraseña"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={loading}
          />
          
          <Button
            variant="outlined"
            startIcon={showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={() => setShowPassword(!showPassword)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'} contraseñas
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================
// DIÁLOGO DE CONFIGURACIÓN
// ============================================
const ConfiguracionDialog = ({ open, onClose, darkMode, setDarkMode }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      background: `linear-gradient(135deg, ${alpha('#2563EB', 0.02)} 0%, ${alpha('#7C3AED', 0.02)} 100%)`
    }}>
      <Box display="flex" alignItems="center" gap={1}>
        <SettingsIcon sx={{ color: '#2563EB' }} />
        <Typography variant="h6">Configuración</Typography>
      </Box>
    </DialogTitle>
    <DialogContent dividers>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            {darkMode ? <DarkModeIcon sx={{ fontSize: 40 }} /> : <LightModeIcon sx={{ fontSize: 40 }} />}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {darkMode ? 'Modo Oscuro' : 'Modo Claro'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {darkMode 
                  ? 'Fondo oscuro para reducir la fatiga visual' 
                  : 'Fondo claro para mejor visibilidad en ambientes iluminados'}
              </Typography>
            </Box>
          </Box>
          <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        </Box>
      </Paper>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cerrar</Button>
    </DialogActions>
  </Dialog>
);

// ================= DASHBOARD PRINCIPAL =================
const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    totalProductos: 0, dadosDeBaja: 0, totalActivos: 0,
    disponibles: 0, asignados: 0, enMantencion: 0, enReparacion: 0, bajoStock: 0, valorTotal: 0,
  });
  const [statsPrestamos, setStatsPrestamos] = useState({ total: 0, activos: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openCambiarPassword, setOpenCambiarPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [productosCache, setProductosCache] = useState([]);
  const [bodegasCache, setBodegasCache] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const isMountedRef = useRef(true);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Productos", icon: <InventoryIcon />, path: "/productos" },
    { text: "Bodegas", icon: <WarehouseIcon />, path: "/bodegas" },
    { text: 'Colaboradores', icon: <PersonIcon />, path: '/colaboradores' },
    { text: "Asignaciones", icon: <AssignmentIcon />, path: "/asignacion" },
    { text: "Stock", icon: <Inventory2Icon />, path: "/stock" },
    { text: "Historial", icon: <HistoryIcon />, path: "/historial" },
  ];

  const showSnackbar = useCallback((message, severity = "success") => {
    if (isMountedRef.current) {
      setSnackbar({ open: true, message, severity });
    }
  }, []);

  const handleLogout = useCallback(() => { 
    authService.logout(); 
    navigate("/login"); 
  }, [navigate]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    showSnackbar("Generando reporte...", "info");
    try {
      const blob = await productosService.exportExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_inventario_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      showSnackbar("Reporte generado exitosamente", "success");
    } catch (error) {
      console.error("Error generando reporte:", error);
      showSnackbar("Error al generar el reporte", "error");
    } finally {
      setExporting(false);
    }
  }, [showSnackbar]);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError(false);
    setDataLoaded(false);

    try {
      const productos = await productosService.getProductos();
      if (!isMountedRef.current) return;
      setProductosCache(productos);
      
      const newStats = await productosService.getStats(productos);
      if (!isMountedRef.current) return;
      setStats(newStats);
      
      // Llamada segura a préstamos - SI FALLA NO ROMPE LA PÁGINA
      let prestamosStats = { total: 0, activos: 0 };
      try {
        prestamosStats = await prestamosService.getStatsPrestamos();
      } catch (prestamoError) {
        console.warn('Error obteniendo préstamos:', prestamoError);
      }
      if (!isMountedRef.current) return;
      setStatsPrestamos(prestamosStats);
      
      const bodegas = await bodegasService.getBodegas();
      if (!isMountedRef.current) return;
      setBodegasCache(bodegas);
      
      setDataLoaded(true);
      
      if (showRefresh && isMountedRef.current) {
        showSnackbar("Datos actualizados", "success");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      if (isMountedRef.current) {
        setApiError(true);
        setDataLoaded(true);
        showSnackbar("Error al cargar los datos", "error");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [showSnackbar]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm && searchTerm.trim()) {
        setSearching(true);
        try {
          const productos = await productosService.search(searchTerm, productosCache);
          const bodegas = bodegasCache.filter(b => 
            (b.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          );
          const productosConTipo = productos.map(p => ({ ...p, tipo: "producto" }));
          const bodegasConTipo = bodegas.map(b => ({ ...b, tipo: "bodega" }));
          setSearchResults([...productosConTipo, ...bodegasConTipo]);
        } catch (error) {
          console.error("Error en búsqueda:", error);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, productosCache, bodegasCache]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!loading && !refreshing && isMountedRef.current && dataLoaded) {
        fetchDashboardData(false);
      }
    }, 60000);
    return () => clearInterval(intervalo);
  }, [loading, refreshing, fetchDashboardData, dataLoaded]);

  // Error boundary para evitar que la app se rompa
  useEffect(() => {
    const handleError = (event) => {
      console.error('Error global capturado:', event.error);
      if (event.error?.message?.includes('removeChild') || event.error?.message?.includes('es_prestamo')) {
        console.warn('Error recuperable - reiniciando estado...');
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatsPrestamos({ total: 0, activos: 0 });
            setLoading(false);
            setDataLoaded(true);
          }
        }, 100);
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // INICIALIZACIÓN PRINCIPAL
  useEffect(() => {
    isMountedRef.current = true;
    
    const initializeUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate("/login");
          return;
        }
        
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            setUser(localUser);
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
        
        try {
          const response = await api.get('/auth/me');
          if (response.data && response.data.success) {
            const backendUser = response.data.usuario || response.data.user;
            if (backendUser) {
              const userData = {
                id: backendUser.id,
                nombre: backendUser.nombre || 'Usuario',
                usuario: backendUser.usuario || '',
                email: backendUser.email || '',
                cargo: backendUser.cargo || '',
                departamento: backendUser.departamento || '',
              };
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
            }
          }
        } catch (backendError) {
          console.warn('No se pudo sincronizar con backend');
        }
        
        await fetchDashboardData();
        
      } catch (error) {
        console.error('Error en inicialización:', error);
        if (!localStorage.getItem('token')) {
          navigate("/login");
        }
      }
    };
    
    initializeUser();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData, navigate]);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    showSnackbar('Perfil actualizado correctamente', 'success');
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#2563EB" },
      background: { default: darkMode ? "#0F172A" : "#F8FAFC", paper: darkMode ? "#1E293B" : "#FFFFFF" },
    },
    shape: { borderRadius: 14 },
  });

  // Mostrar pantalla de carga mientras se cargan los datos iniciales
  if (loading && !dataLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando datos...</Typography>
      </Box>
    );
  }

  const drawer = (
    <Drawer 
      variant={isMobile ? "temporary" : "persistent"} 
      open={drawerOpen} 
      onClose={() => setDrawerOpen(false)}
      sx={{ 
        width: drawerWidth, 
        flexShrink: 0, 
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: "border-box", 
          bgcolor: "background.paper" 
        } 
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>StockMaster</Typography>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton 
            key={item.path}
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {drawer}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <AppBar position="fixed" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "background.paper", color: "text.primary" }}>
            <Toolbar>
              <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
              <DashboardIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, display: { xs: "none", sm: "block" } }}>
                Dashboard
              </Typography>

              <Tooltip title="Buscar">
                <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Actualizar datos">
                <IconButton color="inherit" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
                  {refreshing ? <AutorenewIcon sx={{ animation: "spin 1s linear infinite" }} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  {user?.nombre?.charAt(0) || user?.usuario?.charAt(0) || "U"}
                </Avatar>
              </IconButton>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setOpenPerfil(true); setAnchorEl(null); }}>
                  <PersonIcon sx={{ mr: 1 }} />Mi Perfil
                </MenuItem>
                <MenuItem onClick={() => { setOpenCambiarPassword(true); setAnchorEl(null); }}>
                  <LockIcon sx={{ mr: 1 }} />Cambiar Contraseña
                </MenuItem>
                <MenuItem onClick={() => { setOpenConfig(true); setAnchorEl(null); }}>
                  <SettingsIcon sx={{ mr: 1 }} />Configuración
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />Salir
                </MenuItem>
              </Menu>

              <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Buscar</DialogTitle>
                <DialogContent>
                  <TextField
                    fullWidth
                    placeholder="Buscar productos, bodegas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ mb: 2 }}
                  />
                  {searching && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
                  {!searching && searchResults.length > 0 && (
                    <List>
                      {searchResults.map((result, idx) => {
                        const uniqueKey = `search-result-${result.tipo || 'item'}-${result.id || idx}-${result.nombre || result.descripcion || idx}`;
                        return (
                          <ListItemButton 
                            key={uniqueKey} 
                            onClick={() => {
                              if (result.tipo === 'producto') navigate('/productos');
                              else if (result.tipo === 'bodega') navigate('/bodegas');
                              setSearchOpen(false);
                            }}
                          >
                            <ListItemIcon>
                              {result.tipo === 'producto' && <InventoryIcon />}
                              {result.tipo === 'bodega' && <WarehouseIcon />}
                            </ListItemIcon>
                            <ListItemText 
                              primary={result.nombre || result.descripcion}
                              secondary={result.tipo === 'producto' ? `Stock: ${result.cantidad || 0}` : result.ubicacion}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  )}
                  {!searching && searchTerm && searchResults.length === 0 && (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No se encontraron resultados</Typography>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSearchOpen(false)}>Cerrar</Button>
                </DialogActions>
              </Dialog>
            </Toolbar>
          </AppBar>

          <Toolbar />
          
          <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }} action={
                <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)}>Reintentar</Button>
              }>
                Error de conexión con el servidor
              </Alert>
            )}

            <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 4, background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", color: "white" }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} gutterBottom>
                ¡Bienvenido, {user?.nombre || user?.usuario || "Usuario"}!
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {user?.cargo && (
                  <Chip label={`Cargo: ${user.cargo}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
                {user?.departamento && (
                  <Chip label={`Departamento: ${user.departamento}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
              </Stack>
              
              <Typography sx={{ opacity: 0.9, mb: 2 }}>
                ✉️ Email: {user?.email || 'No disponible'}
              </Typography>
              
              <Typography sx={{ opacity: 0.9, mb: 3 }}>
                {stats.totalProductos > 0 && `📦 Tienes ${stats.totalProductos} productos en inventario. `}
                {stats.asignados > 0 && `🎯 Hay ${stats.asignados} equipos asignados. `}
                {statsPrestamos.activos > 0 && `📋 Hay ${statsPrestamos.activos} préstamos activos.`}
              </Typography>
              
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Button 
                  variant="contained" 
                  startIcon={exporting ? <CircularProgress size={20} /> : <AssessmentIcon />} 
                  onClick={handleExportExcel}
                  disabled={exporting}
                  sx={{ textTransform: "none", bgcolor: "white", color: "#2563EB", fontWeight: 600 }}
                >
                  {exporting ? 'Generando...' : 'Reporte Excel'}
                </Button>
                <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate("/stock")} sx={{ textTransform: "none", borderColor: "white", color: "white", fontWeight: 600 }}>
                  Ver Stock
                </Button>
                <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate("/asignacion")} sx={{ textTransform: "none", borderColor: "white", color: "white", fontWeight: 600 }}>
                  Gestionar Préstamos
                </Button>
              </Box>
            </Paper>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={InventoryIcon} title="TOTAL PRODUCTOS" value={stats.totalProductos} change={`${stats.totalActivos} activos`} color="#2563EB" onClick={() => navigate("/productos")} loading={loading && !dataLoaded} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={CheckCircleIcon} title="DISPONIBLES" value={stats.disponibles} color="#16A34A" loading={loading && !dataLoaded} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={AssignmentIcon} title="ASIGNADOS" value={stats.asignados} color="#9333EA" onClick={() => navigate("/asignacion")} loading={loading && !dataLoaded} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={ReceiptIcon} title="PRÉSTAMOS" value={statsPrestamos.activos} change={`${statsPrestamos.total} totales`} color="#F59E0B" onClick={() => navigate("/asignacion")} loading={loading && !dataLoaded} />
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
              <Grid item xs={6} sm={6} md={3}>
                <NavigationCard icon={InventoryIcon} title="Productos" description="Gestiona inventario" onClick={() => navigate("/productos")} color="#2563EB" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <NavigationCard icon={WarehouseIcon} title="Bodegas" description="Administra ubicaciones" onClick={() => navigate("/bodegas")} color="#9333EA" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <NavigationCard icon={AssignmentIcon} title="Asignaciones" description="Controla equipos" onClick={() => navigate("/asignacion")} color="#16A34A" />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <NavigationCard icon={Inventory2Icon} title="Stock" description="Por marca/modelo" onClick={() => navigate("/stock")} color="#F59E0B" />
              </Grid>
            </Grid>
          </Container>

          <ScrollToTopFab />
          
          <PerfilDialog 
            open={openPerfil} 
            onClose={() => setOpenPerfil(false)} 
            user={user} 
            onProfileUpdate={handleProfileUpdate}
            showSnackbar={showSnackbar}
          />
          
          <CambiarPasswordDialog
            open={openCambiarPassword}
            onClose={() => setOpenCambiarPassword(false)}
            showSnackbar={showSnackbar}
            onLogout={handleLogout}
          />
          
          <ConfiguracionDialog 
            open={openConfig} 
            onClose={() => setOpenConfig(false)} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
          />
          
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={4000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              severity={snackbar.severity} 
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          <style>{`
            @keyframes spin { 
              from { transform: rotate(0deg); } 
              to { transform: rotate(360deg); } 
            }
          `}</style>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;