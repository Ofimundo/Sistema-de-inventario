// src/pages/Dashboard.jsx - VERSIÓN CON API REAL (Opción 4)
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  CircularProgress,
  Switch,
  Fab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
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
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  Autorenew as AutorenewIcon,
  Error as ErrorIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Inventory2 as Inventory2Icon,
  BarChart as BarChartIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import api from "../services/api";

const drawerWidth = 260;

// ============================================
// MAPA DE ESTADOS
// ============================================
const ESTADO_TEXTO = {
  1: 'DISPONIBLE',
  2: 'ASIGNADO',
  3: 'EN MANTENCIÓN',
  4: 'EN REPARACIÓN',
  5: 'NO DISPONIBLE',
  6: 'BAJA'
};

// ============================================
// SERVICIOS
// ============================================
const productosService = {
  getProductos: async () => {
    try {
      const response = await api.get("/productos");
      let productos = response.data?.data || response.data || [];
      if (!Array.isArray(productos)) productos = [];
      
      console.log(`✅ ${productos.length} productos cargados`);
      
      return productos.map(p => ({
        ...p,
        id_estado_equipo: Number(p.id_estado_equipo) || 1,
        estado_texto: ESTADO_TEXTO[Number(p.id_estado_equipo)] || 'DESCONOCIDO',
        cantidad: p.cantidad || 1
      }));
    } catch (error) {
      console.error("Error fetching productos:", error);
      return [];
    }
  },
  
  getStats: async () => {
    try {
      const productos = await productosService.getProductos();
      const productosArray = Array.isArray(productos) ? productos : [];
      
      const estadosBaja = [5, 6];
      const productosActivos = productosArray.filter(p => !estadosBaja.includes(p.id_estado_equipo));
      const productosDadosDeBaja = productosArray.filter(p => estadosBaja.includes(p.id_estado_equipo));
      
      const disponibles = productosActivos.filter(p => p.id_estado_equipo === 1).length;
      const asignados = productosActivos.filter(p => p.id_estado_equipo === 2).length;
      const enMantencion = productosActivos.filter(p => p.id_estado_equipo === 3).length;
      const enReparacion = productosActivos.filter(p => p.id_estado_equipo === 4).length;
      const bajoStock = productosActivos.filter(p => (p.cantidad || 1) < 5).length;
      const valorTotal = productosActivos.reduce((sum, p) => sum + ((p.precio || 0) * (p.cantidad || 1)), 0);
      
      return {
        totalProductos: productosArray.length,
        dadosDeBaja: productosDadosDeBaja.length,
        totalActivos: productosActivos.length,
        disponibles,
        asignados,
        enMantencion,
        enReparacion,
        bajoStock,
        valorTotal,
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        totalProductos: 0, dadosDeBaja: 0, totalActivos: 0,
        disponibles: 0, asignados: 0, enMantencion: 0, enReparacion: 0, bajoStock: 0, valorTotal: 0,
      };
    }
  },
  
  search: async (term) => {
    try {
      const productos = await productosService.getProductos();
      const productosArray = Array.isArray(productos) ? productos : [];
      const lowerTerm = term.toLowerCase();
      return productosArray.filter(p => 
        (p.nombre?.toLowerCase() || '').includes(lowerTerm) ||
        (p.codigo?.toLowerCase() || '').includes(lowerTerm) ||
        (p.marca?.toLowerCase() || '').includes(lowerTerm) ||
        (p.numero_serie?.toLowerCase() || '').includes(lowerTerm)
      );
    } catch (error) {
      console.error("Error searching productos:", error);
      return [];
    }
  },
  
  exportExcel: async () => {
    try {
      const token = localStorage.getItem('token');
      const exportUrl = `${api.defaults.baseURL}/export/productos`;
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
  },
  
  search: async (term) => {
    try {
      const bodegas = await bodegasService.getBodegas();
      const bodegasArray = Array.isArray(bodegas) ? bodegas : [];
      const lowerTerm = term.toLowerCase();
      return bodegasArray.filter(b => (b.nombre?.toLowerCase() || '').includes(lowerTerm));
    } catch (error) {
      console.error("Error searching bodegas:", error);
      return [];
    }
  },
};

// Servicio de préstamos - Usando el mismo endpoint que AsignacionPage
const prestamosService = {
  // Obtener préstamos activos desde el API (mismo endpoint que usa AsignacionPage)
  getPrestamosActivos: async () => {
    try {
      console.log('📤 Obteniendo préstamos desde /asignaciones/activas...');
      const response = await api.get('/asignaciones/activas');
      let asignaciones = response.data?.data || response.data || [];
      if (!Array.isArray(asignaciones)) asignaciones = [];
      
      // Filtrar solo préstamos (es_prestamo = true o 1)
      const prestamos = asignaciones.filter(a => a.es_prestamo === true || a.es_prestamo === 1);
      console.log(`✅ ${prestamos.length} préstamos encontrados`);
      return prestamos;
    } catch (error) {
      console.error("Error obteniendo préstamos:", error);
      return [];
    }
  },
  
  // Obtener estadísticas de préstamos
  getStatsPrestamos: async () => {
    try {
      const prestamos = await prestamosService.getPrestamosActivos();
      const activos = prestamos.filter(p => !p.fecha_devolucion).length;
      return { 
        total: prestamos.length, 
        activos: activos 
      };
    } catch (error) {
      console.error("Error obteniendo stats de préstamos:", error);
      return { total: 0, activos: 0 };
    }
  }
};

const authService = {
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
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

const StatCard = ({ icon: Icon, title, value, change, color, loading, onClick }) => {
  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? "pointer" : "default" }}>
      <CardContent>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 50, height: 50, mb: 2 }}>
          <Icon />
        </Avatar>
        <Typography variant="h5" fontWeight={700}>
          {loading ? <Skeleton width={40} /> : value !== undefined ? value : 0}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
        {change && !loading && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{change}</Typography>
        )}
        {loading && <Skeleton width="60%" sx={{ mt: 0.5 }} />}
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

// Diálogos
const PerfilDialog = ({ open, onClose, user, onProfileUpdate, showSnackbar }) => {
  const [formData, setFormData] = useState({ nombre: '', email: '', rut: '', cargo: '', departamento: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        rut: user.rut || '',
        cargo: user.cargo || '',
        departamento: user.departamento || ''
      });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSnackbar('Perfil actualizado', 'success');
      onClose();
    }, 500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mi Perfil</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Nombre Completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} disabled={loading} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={loading} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="RUT" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} disabled={loading} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} disabled={loading} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Departamento" value={formData.departamento} onChange={(e) => setFormData({ ...formData, departamento: e.target.value })} disabled={loading} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const ConfiguracionDialog = ({ open, onClose, darkMode, setDarkMode }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configuración</DialogTitle>
      <DialogContent dividers>
        <List>
          <ListItem>
            <ListItemIcon>{darkMode ? <DarkModeIcon /> : <LightModeIcon />}</ListItemIcon>
            <ListItemText primary="Modo Oscuro" secondary="Activar tema oscuro" />
            <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

// ================= DASHBOARD PRINCIPAL =================
const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
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
  const [darkMode, setDarkMode] = useState(false);
  const [apiError, setApiError] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Productos", icon: <InventoryIcon />, path: "/productos" },
    { text: "Bodegas", icon: <WarehouseIcon />, path: "/bodegas" },
    { text: 'Colaboradores', icon: <PersonIcon />, path: '/colaboradores' },
    { text: "Asignaciones", icon: <AssignmentIcon />, path: "/asignacion" },
    { text: "Stock por Marca/Modelo", icon: <Inventory2Icon />, path: "/stock" },
    { text: "Historial", icon: <HistoryIcon />, path: "/historial" },
  ];

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Función para cargar préstamos desde el API (mismo endpoint que AsignacionPage)
  const cargarPrestamos = useCallback(async () => {
    try {
      const prestamosStats = await prestamosService.getStatsPrestamos();
      setStatsPrestamos(prestamosStats);
      console.log("📊 Estadísticas de préstamos:", prestamosStats);
      return prestamosStats;
    } catch (error) {
      console.error("Error cargando préstamos:", error);
      setStatsPrestamos({ total: 0, activos: 0 });
      return { total: 0, activos: 0 };
    }
  }, []);

  // Función principal de carga de datos
  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError(false);

    try {
      console.log('🔄 Cargando datos del dashboard...');
      
      // Cargar estadísticas de productos
      const statsData = await productosService.getStats();
      setStats(statsData);
      
      // Cargar estadísticas de préstamos desde el API (mismo endpoint que AsignacionPage)
      await cargarPrestamos();
      
      console.log("📊 Datos cargados:", { statsData });
      
      if (showRefresh) showSnackbar("Datos actualizados", "success");
    } catch (error) {
      console.error("Error cargando datos:", error);
      setApiError(true);
      showSnackbar("Error al cargar los datos", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showSnackbar, cargarPrestamos]);

  // Búsqueda
  const handleSearch = async (term) => {
    if (!term.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const [productos, bodegas] = await Promise.all([
        productosService.search(term),
        bodegasService.search(term),
      ]);
      setSearchResults([
        ...(productos || []).map((p) => ({ ...p, tipo: "producto" })),
        ...(bodegas || []).map((b) => ({ ...b, tipo: "bodega" })),
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
      console.error("Error generando reporte:", error);
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

  // Auto-refresh cada 30 segundos para mantener datos actualizados
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!loading && !refreshing) {
        console.log('🔄 Auto-refresh de datos...');
        cargarPrestamos(); // Solo recargar préstamos, no todo
      }
    }, 30000);
    return () => clearInterval(intervalo);
  }, [loading, refreshing, cargarPrestamos]);

  // Cargar datos iniciales
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { 
      navigate("/login"); 
      return; 
    }
    setUser(currentUser);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: "#2563EB" },
      background: { default: darkMode ? "#0F172A" : "#F8FAFC", paper: darkMode ? "#1E293B" : "#FFFFFF" },
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

              {/* Diálogo de búsqueda */}
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
                      {searchResults.map((result, idx) => (
                        <ListItemButton key={idx} onClick={() => {
                          if (result.tipo === 'producto') navigate('/productos');
                          else if (result.tipo === 'bodega') navigate('/bodegas');
                          setSearchOpen(false);
                        }}>
                          <ListItemIcon>
                            {result.tipo === 'producto' && <InventoryIcon />}
                            {result.tipo === 'bodega' && <WarehouseIcon />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={result.nombre || result.descripcion}
                            secondary={result.tipo === 'producto' ? `Stock: ${result.cantidad || 0}` : result.ubicacion}
                          />
                        </ListItemButton>
                      ))}
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

            {/* Tarjeta de bienvenida */}
            <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 4, background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)", color: "white" }}>
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800} gutterBottom>
                ¡Bienvenido, {user?.nombre || user?.usuario || "Usuario"}!
              </Typography>
              <Typography sx={{ opacity: 0.9, mb: 3 }}>
                {!loading && stats.totalProductos > 0 && `📦 Tienes ${stats.totalProductos} productos en inventario. `}
                {!loading && stats.asignados > 0 && `🎯 Hay ${stats.asignados} equipos asignados. `}
                {!loading && statsPrestamos.activos > 0 && `📋 Hay ${statsPrestamos.activos} préstamos activos.`}
                {!loading && stats.totalProductos === 0 && `Cargando datos del inventario...`}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Button variant="contained" startIcon={<AssessmentIcon />} onClick={handleGenerarReporte} sx={{ textTransform: "none", bgcolor: "white", color: "#2563EB", fontWeight: 600 }}>
                  Reporte Excel
                </Button>
                <Button variant="outlined" startIcon={<BarChartIcon />} onClick={() => navigate("/stock")} sx={{ textTransform: "none", borderColor: "white", color: "white", fontWeight: 600 }}>
                  Ver Stock
                </Button>
                <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={() => navigate("/asignacion")} sx={{ textTransform: "none", borderColor: "white", color: "white", fontWeight: 600 }}>
                  Gestionar Préstamos
                </Button>
              </Box>
            </Paper>

            {/* Stats Grid - 4 tarjetas (TOTAL, DISPONIBLES, ASIGNADOS, PRÉSTAMOS) */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={InventoryIcon} title="TOTAL PRODUCTOS" value={stats.totalProductos} change={`${stats.totalActivos} activos`} color="#2563EB" onClick={() => navigate("/productos")} loading={loading} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={CheckCircleIcon} title="DISPONIBLES" value={stats.disponibles} color="#16A34A" loading={loading} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={AssignmentIcon} title="ASIGNADOS" value={stats.asignados} color="#9333EA" onClick={() => navigate("/asignacion")} loading={loading} />
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard icon={ReceiptIcon} title="PRÉSTAMOS" value={statsPrestamos.activos} change={`${statsPrestamos.total} totales`} color="#F59E0B" onClick={() => navigate("/asignacion")} loading={loading} />
              </Grid>
            </Grid>

            {/* Tarjetas de Navegación */}
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
          
          <PerfilDialog open={openPerfil} onClose={() => setOpenPerfil(false)} user={user} onProfileUpdate={handleProfileUpdate} showSnackbar={showSnackbar} />
          <ConfiguracionDialog open={openConfig} onClose={() => setOpenConfig(false)} darkMode={darkMode} setDarkMode={setDarkMode} />
          
          <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
          </Snackbar>

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;