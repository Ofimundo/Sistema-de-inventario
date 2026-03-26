// src/pages/Dashboard.jsx - VERSIÓN MODIFICADA CON STOCK

import React, { useState, useEffect, useCallback } from "react";
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
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  Badge,
  Tooltip,
  Drawer,
  useMediaQuery,
  Snackbar,
  Alert,
  Skeleton,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Switch,
  Fab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
  Tab,
  Tabs,
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
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  Handyman as HandymanIcon,
  Autorenew as AutorenewIcon,
  Error as ErrorIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  DeleteSweep as DeleteSweepIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Inventory2 as Inventory2Icon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import axios from "axios";

const drawerWidth = 260;

// Configuración de axios
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicio de autenticación
const authService = {
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  },
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      if (response.data && response.data.success) {
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true, user: updatedUser, message: response.data.message };
      }
      return { success: false, message: response.data?.message || 'Error al actualizar perfil' };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Error al conectar con el servidor' 
      };
    }
  },
  cambiarContraseña: async (contraseñaActual, nuevaContraseña) => {
    try {
      const response = await api.post('/auth/change-password', {
        password_actual: contraseñaActual,
        password_nueva: nuevaContraseña
      });
      
      if (response.data && response.data.success) {
        return { success: true, message: response.data.message || 'Contraseña actualizada exitosamente' };
      } else {
        return { 
          success: false, 
          message: response.data?.message || 'Error al cambiar contraseña' 
        };
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Error al conectar con el servidor' 
      };
    }
  },
};

// Servicio de productos - CORREGIDO para excluir productos dados de baja
const productosService = {
  getProductos: async () => {
    try {
      const response = await api.get("/productos");
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("Error fetching productos:", error);
      throw error;
    }
  },
  
  getStats: async () => {
    try {
      const productos = await productosService.getProductos();
      const productosArray = Array.isArray(productos) ? productos : [];
      
      // Definir estados que indican producto dado de baja
      const estadosBaja = ['NO DISPONIBLE', 'BAJA', 'DONADO'];
      
      // Filtrar productos activos (excluir dados de baja)
      const productosActivos = productosArray.filter(p => !estadosBaja.includes(p.estado));
      const productosDadosDeBaja = productosArray.filter(p => estadosBaja.includes(p.estado));
      
      console.log("📊 Estadísticas:", {
        totalProductos: productosArray.length,
        activos: productosActivos.length,
        dadosDeBaja: productosDadosDeBaja.length,
        disponibles: productosActivos.filter(p => p.estado === 'DISPONIBLE').length,
        asignados: productosActivos.filter(p => p.estado === 'ASIGNADO').length
      });
      
      return {
        // Totales (incluye todos los productos)
        totalProductos: productosArray.length,
        dadosDeBaja: productosDadosDeBaja.length,
        
        // Estadísticas de productos activos (excluye dados de baja)
        totalActivos: productosActivos.length,
        totalUnidades: productosActivos.reduce((sum, p) => sum + (p.stock || p.cantidad || 0), 0),
        disponibles: productosActivos.filter(p => p.estado === 'DISPONIBLE').length,
        asignados: productosActivos.filter(p => p.estado === 'ASIGNADO').length,
        enMantencion: productosActivos.filter(p => p.estado === 'EN MANTENCIÓN').length,
        enReparacion: productosActivos.filter(p => p.estado === 'EN REPARACIÓN').length,
        bajoStock: productosActivos.filter(p => (p.stock || p.cantidad || 0) < 5).length,
        valorTotal: productosActivos.reduce((sum, p) => sum + ((p.precio || 0) * (p.stock || p.cantidad || 0)), 0),
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      throw error;
    }
  },
  
  getProductosCriticos: async () => {
    try {
      const productos = await productosService.getProductos();
      const productosArray = Array.isArray(productos) ? productos : [];
      const estadosBaja = ['NO DISPONIBLE', 'BAJA', 'DONADO'];
      // Solo productos activos con stock bajo
      return productosArray.filter(p => 
        (p.stock || p.cantidad || 0) < 5 && 
        !estadosBaja.includes(p.estado)
      );
    } catch (error) {
      console.error("Error fetching productos criticos:", error);
      return [];
    }
  },
  
  search: async (term) => {
    try {
      const productos = await productosService.getProductos();
      const productosArray = Array.isArray(productos) ? productos : [];
      return productosArray.filter(p => 
        (p.nombre?.toLowerCase() || '').includes(term.toLowerCase()) ||
        (p.codigo?.toLowerCase() || '').includes(term.toLowerCase()) ||
        (p.marca?.toLowerCase() || '').includes(term.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching productos:", error);
      return [];
    }
  },
  
  exportExcel: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/export/productos', {
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
};

// Servicio de bodegas
const bodegasService = {
  getBodegas: async () => {
    try {
      const response = await api.get("/bodegas");
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("Error fetching bodegas:", error);
      return [];
    }
  },
  
  search: async (term) => {
    try {
      const bodegas = await bodegasService.getBodegas();
      const bodegasArray = Array.isArray(bodegas) ? bodegas : [];
      return bodegasArray.filter(b => 
        (b.nombre?.toLowerCase() || '').includes(term.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching bodegas:", error);
      return [];
    }
  },
};

// Servicio de historial
const historialService = {
  getUltimosMovimientos: async (limit = 5) => {
    try {
      const response = await api.get("/historial");
      const historial = response.data.data || response.data || [];
      const historialArray = Array.isArray(historial) ? historial : [];
      return historialArray.slice(0, limit);
    } catch (error) {
      console.error("Error fetching historial:", error);
      return [];
    }
  },
  
  search: async (term) => {
    try {
      const response = await api.get("/historial");
      const historial = response.data.data || response.data || [];
      const historialArray = Array.isArray(historial) ? historial : [];
      return historialArray.filter(h => 
        (h.descripcion?.toLowerCase() || '').includes(term.toLowerCase()) ||
        (h.usuario?.toLowerCase() || '').includes(term.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching historial:", error);
      return [];
    }
  },
};

/* ================= ESTILOS ================= */
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

const StatCard = ({ icon: Icon, title, value, change, color, loading, onClick }) => {
  if (loading) {
    return (
      <StyledCard>
        <CardContent>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" height={32} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </StyledCard>
    );
  }

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
      <CardContent>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 50, height: 50, mb: 2 }}>
          <Icon />
        </Avatar>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
        {change && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{change}</Typography>
        )}
      </CardContent>
    </StyledCard>
  );
};

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

const NotificacionItem = styled(ListItem)(({ theme, leida }) => ({
  backgroundColor: leida ? "transparent" : alpha(theme.palette.warning.main, 0.05),
  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
}));

// ScrollToTop
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

// Componente para el diálogo de cambio de contraseña
const CambiarContrasenaDialog = ({ open, onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.cambiarContraseña(currentPassword, newPassword);
      
      if (result.success) {
        setSuccess(result.message || 'Contraseña actualizada exitosamente');
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1500);
      } else {
        setError(result.message || 'Error al cambiar contraseña');
      }
    } catch (error) {
      setError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="primary" />
          <Typography variant="h6">Cambiar Contraseña</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Contraseña Actual"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Nueva Contraseña"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            helperText="Mínimo 6 caracteres"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirmar Nueva Contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <AutorenewIcon sx={{ animation: "spin 1s linear infinite" }} /> : <SaveIcon />}
        >
          {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PerfilDialog = ({ open, onClose, user, onProfileUpdate, showSnackbar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    usuario: '',
    rut: '',
    cargo: '',
    departamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        usuario: user.usuario || '',
        rut: user.rut || '',
        cargo: user.cargo || '',
        departamento: user.departamento || ''
      });
      setError('');
    }
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre?.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.email?.trim()) {
      setError('El email es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.updateUserProfile({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        rut: formData.rut?.trim() || '',
        cargo: formData.cargo?.trim() || '',
        departamento: formData.departamento?.trim() || ''
      });

      if (result.success) {
        onProfileUpdate(result.user);
        showSnackbar('Perfil actualizado exitosamente', 'success');
        onClose();
      } else {
        setError(result.message || 'Error al actualizar perfil');
      }
    } catch (error) {
      setError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Mi Perfil</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Usuario"
              name="usuario"
              value={formData.usuario}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="El nombre de usuario no se puede modificar"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="RUT"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              disabled={loading}
              placeholder="12.345.678-9"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <AutorenewIcon sx={{ animation: "spin 1s linear infinite" }} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente de Configuración con pestañas
const ConfiguracionDialog = ({ open, onClose, darkMode, setDarkMode, notificacionesHabilitadas, setNotificacionesHabilitadas, saveConfigNotificaciones, showSnackbar, handleRefreshNotificaciones }) => {
  const [tabValue, setTabValue] = useState(0);
  const [openCambiarContrasena, setOpenCambiarContrasena] = useState(false);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Configuración</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={tabValue} onChange={handleChangeTab} sx={{ mb: 3 }}>
            <Tab label="General" />
            <Tab label="Seguridad" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <List>
                <ListItem>
                  <ListItemIcon>{darkMode ? <DarkModeIcon /> : <LightModeIcon />}</ListItemIcon>
                  <ListItemText 
                    primary="Modo Oscuro" 
                    secondary="Activar tema oscuro para toda la aplicación" 
                  />
                  <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemIcon>
                    {notificacionesHabilitadas ? <NotificationsActiveIcon color="primary" /> : <NotificationsOffIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Notificaciones" 
                    secondary={notificacionesHabilitadas 
                      ? "Recibirás alertas de stock crítico" 
                      : "Notificaciones desactivadas"} 
                  />
                  <Switch 
                    checked={notificacionesHabilitadas} 
                    onChange={(e) => {
                      const nuevoEstado = e.target.checked;
                      setNotificacionesHabilitadas(nuevoEstado);
                      saveConfigNotificaciones(nuevoEstado);
                      showSnackbar(
                        nuevoEstado ? "Notificaciones activadas" : "Notificaciones desactivadas", 
                        "success"
                      );
                      if (nuevoEstado) {
                        setTimeout(() => handleRefreshNotificaciones(true), 500);
                      }
                    }} 
                    color="primary"
                  />
                </ListItem>
              </List>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cambiar Contraseña" 
                    secondary="Actualiza tu contraseña de acceso al sistema" 
                  />
                  <Button 
                    variant="outlined" 
                    onClick={() => setOpenCambiarContrasena(true)}
                    startIcon={<LockIcon />}
                  >
                    Cambiar
                  </Button>
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <CambiarContrasenaDialog 
        open={openCambiarContrasena}
        onClose={() => setOpenCambiarContrasena(false)}
        onSuccess={() => {
          showSnackbar('Contraseña actualizada exitosamente', 'success');
        }}
      />
    </>
  );
};

/* ================= DASHBOARD ================= */
const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  // Estados
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificacionesAnchor, setNotificacionesAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [stats, setStats] = useState({
    totalProductos: 0,
    dadosDeBaja: 0,
    totalActivos: 0,
    totalUnidades: 0,
    disponibles: 0,
    asignados: 0,
    enMantencion: 0,
    enReparacion: 0,
    bajoStock: 0,
    valorTotal: 0,
    movimientosRecientes: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Estados para notificaciones
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [notificacionesHabilitadas, setNotificacionesHabilitadas] = useState(true);
  
  const [apiError, setApiError] = useState(false);

  // Menú items - AGREGADO STOCK
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Productos", icon: <InventoryIcon />, path: "/productos" },
    { text: "Bodegas", icon: <WarehouseIcon />, path: "/bodegas" },
    { text: 'Colaboradores', icon: <PersonIcon />, path: '/colaboradores' },
    { text: "Asignaciones", icon: <AssignmentIcon />, path: "/asignacion" },
    { text: "Stock por Marca/Modelo", icon: <Inventory2Icon />, path: "/stock" }, // NUEVO
    { text: "Historial", icon: <HistoryIcon />, path: "/historial" },
  ];

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ============ FUNCIONES DE NOTIFICACIONES ============
  
  const loadConfigNotificaciones = useCallback(() => {
    try {
      const stored = localStorage.getItem("dashboard_notificaciones_habilitadas");
      if (stored !== null) {
        const habilitadas = stored === "true";
        setNotificacionesHabilitadas(habilitadas);
        return habilitadas;
      }
    } catch (error) {
      console.error("Error loading notificaciones config:", error);
    }
    return true;
  }, []);

  const saveConfigNotificaciones = useCallback((habilitadas) => {
    try {
      localStorage.setItem("dashboard_notificaciones_habilitadas", habilitadas.toString());
    } catch (error) {
      console.error("Error saving notificaciones config:", error);
    }
  }, []);

  const loadNotificacionesFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem("dashboard_notificaciones");
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotificaciones(parsed);
        setNotificacionesNoLeidas(parsed.filter((n) => !n.leida).length);
        return parsed;
      }
    } catch (error) {
      console.error("Error loading notificaciones:", error);
    }
    return [];
  }, []);

  const saveNotificacionesToStorage = useCallback((notis) => {
    try {
      localStorage.setItem("dashboard_notificaciones", JSON.stringify(notis));
    } catch (error) {
      console.error("Error saving notificaciones:", error);
    }
  }, []);

  const generarNotificacionesStock = useCallback((productosCriticos) => {
    if (!productosCriticos?.length) return [];
    return productosCriticos.map((item) => ({
      id: `stock-${item.id}-${Date.now()}`,
      tipo: "stock_critico",
      titulo: "⚠️ Stock Crítico",
      mensaje: `${item.nombre} tiene solo ${item.stock || item.cantidad || 0} unidades disponibles`,
      fecha: new Date().toISOString(),
      leida: false,
      producto_id: item.id,
      icono: "warning",
      prioridad: "alta",
    }));
  }, []);

  const handleMarcarComoLeida = useCallback((id) => {
    setNotificaciones((prev) => {
      const nuevas = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
      saveNotificacionesToStorage(nuevas);
      return nuevas;
    });
    setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1));
    showSnackbar("Notificación marcada como leída", "success");
  }, [saveNotificacionesToStorage, showSnackbar]);

  const handleMarcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => {
      const nuevas = prev.map((n) => ({ ...n, leida: true }));
      saveNotificacionesToStorage(nuevas);
      return nuevas;
    });
    setNotificacionesNoLeidas(0);
    showSnackbar("Todas las notificaciones marcadas como leídas", "success");
  }, [saveNotificacionesToStorage, showSnackbar]);

  const handleEliminarNotificacion = useCallback((id) => {
    setNotificaciones((prev) => {
      const nuevas = prev.filter((n) => n.id !== id);
      const noLeidasRestantes = nuevas.filter((n) => !n.leida).length;
      setNotificacionesNoLeidas(noLeidasRestantes);
      saveNotificacionesToStorage(nuevas);
      return nuevas;
    });
    showSnackbar("Notificación eliminada", "success");
  }, [saveNotificacionesToStorage, showSnackbar]);

  const handleEliminarTodasNotificaciones = useCallback(() => {
    setNotificaciones([]);
    setNotificacionesNoLeidas(0);
    localStorage.removeItem("dashboard_notificaciones");
    showSnackbar("Todas las notificaciones eliminadas", "success");
  }, [showSnackbar]);

  const handleRefreshNotificaciones = useCallback(async (silent = false) => {
    if (!notificacionesHabilitadas) {
      if (!silent) showSnackbar("Las notificaciones están desactivadas", "warning");
      return;
    }

    if (!silent) showSnackbar("Actualizando notificaciones...", "info");
    
    try {
      const productosCriticos = await productosService.getProductosCriticos();
      const nuevasNotificaciones = generarNotificacionesStock(productosCriticos);

      if (nuevasNotificaciones.length > 0) {
        const notisExistentes = loadNotificacionesFromStorage();
        
        const notisCombinadas = [...notisExistentes];
        nuevasNotificaciones.forEach(nueva => {
          const existe = notisExistentes.some(
            n => n.producto_id === nueva.producto_id && 
                 n.tipo === nueva.tipo &&
                 new Date(n.fecha) > new Date(Date.now() - 24*60*60*1000)
          );
          if (!existe) notisCombinadas.unshift(nueva);
        });
        
        const notisFinales = notisCombinadas.slice(0, 50);
        saveNotificacionesToStorage(notisFinales);
        setNotificaciones(notisFinales);
        setNotificacionesNoLeidas(notisFinales.filter((n) => !n.leida).length);
        
        if (!silent) {
          showSnackbar(`${nuevasNotificaciones.length} nuevas notificaciones`, "success");
        }
      } else {
        if (!silent) showSnackbar("No hay nuevas notificaciones", "info");
      }
      
    } catch (error) {
      console.error("Error actualizando notificaciones:", error);
      if (!silent) showSnackbar("Error al actualizar notificaciones", "error");
    }
  }, [showSnackbar, loadNotificacionesFromStorage, saveNotificacionesToStorage, 
      generarNotificacionesStock, notificacionesHabilitadas]);

  // ============ FUNCIONES DE DATOS ============
  
  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    setApiError(false);

    try {
      const [statsData, movimientos] = await Promise.all([
        productosService.getStats().catch(() => null),
        historialService.getUltimosMovimientos(5),
      ]);

      if (statsData) {
        console.log("📊 Datos de estadísticas recibidos:", statsData);
        setStats({ ...statsData, movimientosRecientes: movimientos || [] });
      }

      if (notificacionesHabilitadas) {
        await handleRefreshNotificaciones(true);
      }

      if (showRefresh) showSnackbar("Datos actualizados", "success");
    } catch (error) {
      console.error("Error general:", error);
      setApiError(true);
      showSnackbar("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showSnackbar, handleRefreshNotificaciones, notificacionesHabilitadas]);

  const handleSearch = async (term) => {
    if (!term.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const [productos, bodegas, movimientos] = await Promise.all([
        productosService.search(term).catch(() => []),
        bodegasService.search(term).catch(() => []),
        historialService.search(term).catch(() => []),
      ]);

      setSearchResults([
        ...(productos || []).map((p) => ({ ...p, tipo: "producto" })),
        ...(bodegas || []).map((b) => ({ ...b, tipo: "bodega" })),
        ...(movimientos || []).map((m) => ({ ...m, tipo: "movimiento" })),
      ]);
    } catch (error) {
      console.error("Error en búsqueda:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerarReporte = useCallback(async () => {
    try {
      showSnackbar("Generando reporte...", "info");
      const blob = await productosService.exportExcel();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      showSnackbar("Reporte generado exitosamente", "success");
    } catch (error) {
      showSnackbar("Error al generar reporte", "error");
    }
  }, [showSnackbar]);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) handleSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-refresh cada 5 minutos para notificaciones
  useEffect(() => {
    if (!notificacionesHabilitadas) return;

    const intervaloMs = 5 * 60 * 1000;
    const intervalo = setInterval(() => {
      handleRefreshNotificaciones(true);
    }, intervaloMs);

    return () => clearInterval(intervalo);
  }, [notificacionesHabilitadas, handleRefreshNotificaciones]);

  // Auto-refresh cada 5 minutos para datos del dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Cargar datos iniciales
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { 
      navigate("/login"); 
      return; 
    }

    setUser(currentUser);
    console.log("👤 Usuario cargado:", currentUser);

    // Cargar configuración de notificaciones
    loadConfigNotificaciones();
    
    // Cargar notificaciones existentes
    loadNotificacionesFromStorage();
    
    // Cargar datos del dashboard
    fetchDashboardData();
  }, [navigate, loadConfigNotificaciones, loadNotificacionesFromStorage, fetchDashboardData]);

  // Responsive drawer
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#2563EB" },
      background: { default: darkMode ? "#0F172A" : "#F8FAFC", paper: darkMode ? "#1E293B" : "#FFFFFF" },
      text: { primary: darkMode ? "#F1F5F9" : "#0F172A", secondary: darkMode ? "#94A3B8" : "#475569" },
    },
    shape: { borderRadius: 14 },
  });

  const handleLogout = () => { 
    authService.logout(); 
    navigate("/login"); 
  };

  const drawer = (
    <Drawer variant={isMobile ? "temporary" : "persistent"} open={drawerOpen} onClose={() => setDrawerOpen(false)}
      sx={{ width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", bgcolor: "background.paper" } }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>StockMaster</Typography>
        {isMobile && <IconButton onClick={() => setDrawerOpen(false)}><ChevronLeftIcon /></IconButton>}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItemButton key={item.text} onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
            selected={window.location.pathname === item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );

  const notificacionesPopover = (
    <Popover open={Boolean(notificacionesAnchor)} anchorEl={notificacionesAnchor} onClose={() => setNotificacionesAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      PaperProps={{ sx: { width: 400, maxHeight: 500, borderRadius: 2 } }}>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {notificacionesHabilitadas ? (
            <NotificationsActiveIcon color="primary" />
          ) : (
            <NotificationsOffIcon color="error" />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {notificacionesHabilitadas ? "Notificaciones" : "Notificaciones desactivadas"}
          </Typography>
          {!notificacionesHabilitadas && (
            <Chip
              size="small"
              label="OFF"
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {notificacionesHabilitadas && (
            <>
              <Tooltip title="Actualizar">
                <IconButton size="small" onClick={() => handleRefreshNotificaciones(false)}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {notificacionesNoLeidas > 0 && (
                <Tooltip title="Marcar todas como leídas">
                  <IconButton size="small" onClick={handleMarcarTodasLeidas}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {notificaciones.length > 0 && (
                <Tooltip title="Eliminar todas">
                  <IconButton size="small" onClick={handleEliminarTodasNotificaciones}>
                    <DeleteSweepIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </Box>
      {notificacionesHabilitadas ? (
        <>
          <List sx={{ p: 0, maxHeight: 400, overflow: "auto" }}>
            {notificaciones.length > 0 ? (
              notificaciones.map((notif) => (
                <NotificacionItem key={notif.id} leida={notif.leida}
                  secondaryAction={
                    <Box>
                      {!notif.leida && (
                        <Tooltip title="Marcar como leída">
                          <IconButton size="small" onClick={() => handleMarcarComoLeida(notif.id)}>
                            <CheckIcon sx={{ fontSize: 16, color: "success.main" }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleEliminarNotificacion(notif.id)}>
                          <CloseIcon sx={{ fontSize: 16, color: "error.main" }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: notif.prioridad === "alta" ? alpha("#f56565", 0.1) : alpha("#4299e1", 0.1),
                      color: notif.prioridad === "alta" ? "#f56565" : "#4299e1"
                    }}>
                      {notif.icono === "warning" ? <WarningIcon /> : <NotificationsIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Typography variant="body2" fontWeight={notif.leida ? 400 : 600}>
                        {notif.titulo}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {notif.mensaje}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(notif.fecha).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </NotificacionItem>
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <NotificationsOffIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No hay notificaciones
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Las notificaciones aparecerán aquí cuando haya stock crítico
                </Typography>
              </Box>
            )}
          </List>
        </>
      ) : (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <NotificationsOffIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Notificaciones desactivadas
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Actívalas desde Configuración para recibir alertas de stock crítico
          </Typography>
        </Box>
      )}
    </Popover>
  );

  const searchDialog = (
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Buscar en el sistema</DialogTitle>
      <DialogContent>
        <TextField 
          autoFocus 
          fullWidth 
          placeholder="Buscar productos, bodegas, movimientos..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: searching && <InputAdornment position="end"><AutorenewIcon sx={{ animation: "spin 1s linear infinite" }} /></InputAdornment>
          }}
          sx={{ mt: 1 }}
        />
        {searchResults.length > 0 ? (
          <List sx={{ mt: 2 }}>
            {searchResults.map((r) => (
              <ListItemButton 
                key={`${r.tipo}-${r.id}`} 
                onClick={() => { 
                  if (r.tipo === "producto") navigate(`/productos`);
                  else if (r.tipo === "bodega") navigate(`/bodegas`);
                  else if (r.tipo === "movimiento") navigate(`/historial`);
                  setSearchOpen(false);
                }}
              >
                <ListItemIcon>
                  {r.tipo === "producto" ? <InventoryIcon /> : 
                   r.tipo === "bodega" ? <WarehouseIcon /> : 
                   <HistoryIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary={r.nombre || r.producto_nombre || "Sin nombre"} 
                  secondary={`${r.tipo} - ${r.descripcion || ""}`}
                />
              </ListItemButton>
            ))}
          </List>
        ) : searchTerm && !searching ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography color="text.secondary">No se encontraron resultados</Typography>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  if (!user) return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><Typography>Cargando...</Typography></Box>;

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
              
              <Tooltip title={notificacionesHabilitadas ? "Notificaciones" : "Notificaciones desactivadas"}>
                <IconButton color="inherit" onClick={(e) => setNotificacionesAnchor(e.currentTarget)}>
                  <Badge 
                    badgeContent={notificacionesHabilitadas ? notificacionesNoLeidas : 0} 
                    color="error"
                  >
                    {notificacionesHabilitadas ? <NotificationsIcon /> : <NotificationsOffIcon />}
                  </Badge>
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
                  <PersonIcon sx={{ mr: 1 }} />Perfil
                </MenuItem>
                <MenuItem onClick={() => { setOpenConfig(true); setAnchorEl(null); }}>
                  <SettingsIcon sx={{ mr: 1 }} />Configuración
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />Salir
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          <Toolbar id="back-to-top" />
          
          <Container maxWidth={false} sx={{ mt: 3, mb: 4, px: { xs: 2, sm: 3 } }}>
            {apiError && (
              <Alert severity="error" sx={{ mb: 3 }} action={
                <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)}>
                  Reintentar
                </Button>
              }>
                Error de conexión con el servidor
              </Alert>
            )}

            {/* Tarjeta de bienvenida */}
            <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 4, background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", color: "white" }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} gutterBottom>
                ¡Bienvenido, {user?.nombre || user?.usuario}!
              </Typography>
              
              <Typography sx={{ opacity: 0.9, mb: 3 }}>
                {!apiError && stats.dadosDeBaja > 0 && (
                  <span>📦 Hay {stats.dadosDeBaja} productos dados de baja. </span>
                )}
                {!apiError && stats.bajoStock > 0 && (
                  <span>⚠️ Hay {stats.bajoStock} productos con stock crítico. </span>
                )}
                {!apiError && stats.asignados > 0 && (
                  <span>Actualmente hay {stats.asignados} equipos asignados.</span>
                )}
                {!apiError && stats.bajoStock === 0 && stats.asignados === 0 && stats.dadosDeBaja === 0 && (
                  <span>Todo está en orden con tu inventario.</span>
                )}
              </Typography>
              
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Button 
                  variant="contained" 
                  startIcon={<AssessmentIcon />} 
                  onClick={handleGenerarReporte}
                  sx={{ 
                    textTransform: "none", 
                    bgcolor: "white", 
                    color: "#2563EB", 
                    fontWeight: 600, 
                    "&:hover": { bgcolor: "#f1f5f9" } 
                  }}
                >
                  Reporte Diario
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<BarChartIcon />} 
                  onClick={() => navigate("/stock")}
                  sx={{ 
                    textTransform: "none", 
                    borderColor: "white", 
                    color: "white", 
                    fontWeight: 600, 
                    "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" } 
                  }}
                >
                  Ver Stock por Marca/Modelo
                </Button>
              </Box>
            </Paper>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Stats Cards - 8 cards */}
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={InventoryIcon} 
                    title="TOTAL PRODUCTOS" 
                    value={stats.totalProductos} 
                    change={`${stats.totalActivos} activos, ${stats.dadosDeBaja} de baja`} 
                    color="#2563EB" 
                    onClick={() => navigate("/productos")} 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={CheckCircleIcon} 
                    title="DISPONIBLES" 
                    value={stats.disponibles} 
                    change={`${stats.totalUnidades} unidades`} 
                    color="#16A34A" 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={AssignmentIcon} 
                    title="ASIGNADOS" 
                    value={stats.asignados} 
                    change={stats.totalActivos > 0 ? `${((stats.asignados / stats.totalActivos) * 100).toFixed(0)}%` : "0%"} 
                    color="#9333EA" 
                    onClick={() => navigate("/asignacion")} 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={BuildIcon} 
                    title="EN MANTENCIÓN" 
                    value={stats.enMantencion} 
                    color="#4299e1" 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={HandymanIcon} 
                    title="EN REPARACIÓN" 
                    value={stats.enReparacion} 
                    color="#9f7aea" 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={DeleteIcon} 
                    title="DADOS DE BAJA" 
                    value={stats.dadosDeBaja} 
                    color="#DC2626" 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={WarningIcon} 
                    title="STOCK CRÍTICO" 
                    value={stats.bajoStock} 
                    color="#F59E0B" 
                    onClick={() => navigate("/productos?stock=critico")} 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                {!loading ? (
                  <StatCard 
                    icon={TrendingUpIcon} 
                    title="VALOR TOTAL" 
                    value={`$${stats.valorTotal?.toLocaleString("es-CL")}`} 
                    color="#9f7aea" 
                  />
                ) : (
                  <Skeleton height={140} sx={{ borderRadius: 2 }} />
                )}
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2, mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <NavigationCard 
                  icon={InventoryIcon} 
                  title="Productos" 
                  description="Gestiona tu inventario" 
                  onClick={() => navigate("/productos")} 
                  color="#2563EB" 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NavigationCard 
                  icon={WarehouseIcon} 
                  title="Bodegas" 
                  description="Administra ubicaciones" 
                  onClick={() => navigate("/bodegas")} 
                  color="#9333EA" 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NavigationCard 
                  icon={AssignmentIcon} 
                  title="Asignaciones" 
                  description="Controla equipos" 
                  onClick={() => navigate("/asignacion")} 
                  color="#16A34A" 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <NavigationCard 
                  icon={Inventory2Icon} 
                  title="Stock" 
                  description="Stock por marca/modelo" 
                  onClick={() => navigate("/stock")} 
                  color="#F59E0B" 
                />
              </Grid>
            </Grid>

            {stats.movimientosRecientes?.length > 0 && !loading && !apiError && (
              <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Movimientos Recientes</Typography>
                  <Button size="small" onClick={() => navigate("/historial")}>Ver todo</Button>
                </Box>
                <List>
                  {stats.movimientosRecientes.slice(0, 3).map((mov, index) => (
                    <React.Fragment key={mov.id || index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: alpha("#667eea", 0.1), color: "#667eea" }}>
                            {mov.tipo_movimiento === "ASIGNACION" ? <AssignmentIcon /> : <AutorenewIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={mov.producto_nombre || mov.descripcion} 
                          secondary={`${mov.tipo_movimiento || "MOVIMIENTO"} - ${mov.usuario || mov.usuario_responsable || "Sistema"}`} 
                        />
                        <Typography variant="caption" color="textSecondary">
                          {mov.fecha ? new Date(mov.fecha).toLocaleDateString() : 
                           mov.fecha_movimiento ? new Date(mov.fecha_movimiento).toLocaleDateString() : ""}
                        </Typography>
                      </ListItem>
                      {index < 2 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </Container>

          <ScrollToTopFab />
          {notificacionesPopover}
          {searchDialog}

          <PerfilDialog
            open={openPerfil}
            onClose={() => setOpenPerfil(false)}
            user={user}
            onProfileUpdate={handleProfileUpdate}
            showSnackbar={showSnackbar}
          />

          <ConfiguracionDialog 
            open={openConfig}
            onClose={() => setOpenConfig(false)}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            notificacionesHabilitadas={notificacionesHabilitadas}
            setNotificacionesHabilitadas={setNotificacionesHabilitadas}
            saveConfigNotificaciones={saveConfigNotificaciones}
            showSnackbar={showSnackbar}
            handleRefreshNotificaciones={handleRefreshNotificaciones}
          />

          <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
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