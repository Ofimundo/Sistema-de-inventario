// src/pages/MantencionPage.jsx - MÓDULO DE MANTENCIONES ACTUALIZADO
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Autocomplete,
  LinearProgress,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  CssBaseline,
  ThemeProvider,
  createTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Inventory2 as Inventory2Icon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ChevronLeft as ChevronLeftIcon,
  Build as BuildIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  BuildCircle as BuildCircleIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Autorenew as AutorenewIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Event as EventIcon
} from "@mui/icons-material";
import { productosService } from "../services/productos";
import { colaboradorService } from "../services/colaboradorService";
import authService from "../services/auth";
import theme from "../theme";

const drawerWidth = 260;

// Helper para formatear fechas en tabla sin desfase por zona horaria (UTC vs Local)
const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  const str = String(dateVal);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${dd}/${mm}/${yyyy}`;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-CL", { timeZone: "UTC" });
};

// Helper para prellenar <input type="date"> (YYYY-MM-DD) sin desfase
const formatInputDate = (dateVal) => {
  if (!dateVal) return "";
  const str = String(dateVal);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

// Helper para obtener YYYY-MM-DD de HOY según la zona horaria local del navegador
const getTodayInputDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MantencionPage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isMountedRef = useRef(true);

  // User & Layout States
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Data states
  const [mantenciones, setMantenciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tecnicos, setTecnicos] = useState(["Cesar Caruz Carrasco", "Margarita Arraño Aranda"]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabEstado, setTabEstado] = useState(0); // 0: Todos, 1: En Progreso, 2: Completadas

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Notification Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Dialog States: Nueva Mantención
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [tipo, setTipo] = useState("SEMESTRAL");
  const [fechaInicio, setFechaInicio] = useState(getTodayInputDate());
  const [fechaTermino, setFechaTermino] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [hora, setHora] = useState("09:00");
  const [responsable, setResponsable] = useState("Cesar Caruz Carrasco");
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("");
  const [marcarCompletadaDirecta, setMarcarCompletadaDirecta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dialog States: Finalizar Mantención
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);
  const [selectedMantencion, setSelectedMantencion] = useState(null);
  const [fechaFinFinalizar, setFechaFinFinalizar] = useState(getTodayInputDate());

  // Dialog States: Historial del Equipo
  const [openHistorialDialog, setOpenHistorialDialog] = useState(false);
  const [historialProducto, setHistorialProducto] = useState(null);
  const [historialMantencionesEquipo, setHistorialMantencionesEquipo] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  // Dialog States: Editar Mantención
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingMantencion, setEditingMantencion] = useState(null);
  const [editFechaInicio, setEditFechaInicio] = useState("");
  const [editFechaTermino, setEditFechaTermino] = useState("");
  const [editResponsable, setEditResponsable] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCosto, setEditCosto] = useState("");
  const [editTipo, setEditTipo] = useState("RUTINA");
  const [editCompletada, setEditCompletada] = useState(false);

  // Dialog States: Confirmar Eliminación
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Sidebar Menu Items matching Dashboard exactly
  const menuItems = [
    { text: "Panel", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Productos", icon: <InventoryIcon />, path: "/productos" },
    { text: "Bodegas", icon: <WarehouseIcon />, path: "/bodegas" },
    { text: "Colaboradores", icon: <PersonIcon />, path: "/colaboradores" },
    { text: "Asignaciones", icon: <AssignmentIcon />, path: "/asignacion" },
    { text: "Mantención", icon: <BuildIcon />, path: "/mantenciones" },
    { text: "Anexos", icon: <DescriptionIcon />, path: "/anexos" },
    { text: "Existencias", icon: <Inventory2Icon />, path: "/stock" },
    { text: "Historial", icon: <HistoryIcon />, path: "/historial" },
  ];

  const showSnackbar = useCallback((message, severity = "success") => {
    if (isMountedRef.current) {
      setSnackbar({ open: true, message, severity });
    }
  }, []);

  // Load Logged User
  useEffect(() => {
    try {
      const u = authService.getCurrentUser();
      if (u) setUser(u);
    } catch (e) {
      console.warn("User load error:", e);
    }
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [mRes, pRes, cRes] = await Promise.all([
        productosService.getAllMantenciones(),
        productosService.getProductos(),
        colaboradorService.getColaboradores().catch(() => [])
      ]);
      if (isMountedRef.current) {
        const mantencionesList = Array.isArray(mRes)
          ? mRes
          : (mRes && Array.isArray(mRes.data) ? mRes.data : []);

        const productosList = Array.isArray(pRes)
          ? pRes
          : (pRes && Array.isArray(pRes.data) ? pRes.data : []);

        const cList = Array.isArray(cRes)
          ? cRes
          : (cRes && Array.isArray(cRes.data) ? cRes.data : []);

        // Función para identificar únicamente equipos Notebooks / Laptops / Portátiles
        const isNotebook = (p) => {
          if (!p) return false;
          const str = `${p.nombre || ''} ${p.descripcion || ''} ${p.categoria_nombre || ''} ${p.tipo || ''} ${p.modelo || ''}`.toLowerCase();
          return str.includes('notebook') || str.includes('laptop') || str.includes('portatil') || str.includes('portátil');
        };

        const notebooksOnly = productosList.filter(isNotebook);

        setMantenciones(mantencionesList);
        setProductos(notebooksOnly);

        // Filtrar estrictamente los 2 técnicos autorizados para mantenciones (Cesar Caruz Carrasco y Margarita Arraño Aranda)
        const tecnicosFiltrados = [];
        if (Array.isArray(cList) && cList.length > 0) {
          const encontrados = cList.filter(c => {
            const full = `${c.nombre || ""} ${c.apellido || ""}`.trim().toLowerCase();
            const isCesarCaruz = full.includes("caruz");
            const isMargaritaArrano = full.includes("margarita") || full.includes("arraño");
            return (isCesarCaruz || isMargaritaArrano) && !full.includes("retamal");
          });

          encontrados.forEach(c => {
            const rawName = `${c.nombre || ""} ${c.apellido || ""}`.trim();
            if (rawName) {
              const formattedName = rawName
                .split(" ")
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");
              if (!tecnicosFiltrados.includes(formattedName)) {
                tecnicosFiltrados.push(formattedName);
              }
            }
          });
        }

        const finalTecnicos = tecnicosFiltrados.length > 0
          ? tecnicosFiltrados
          : ["Cesar Caruz Carrasco", "Margarita Arraño Aranda"];

        setTecnicos(finalTecnicos);
        setResponsable(prev => (finalTecnicos.includes(prev) ? prev : finalTecnicos[0]));

        if (isRefresh) showSnackbar("Datos actualizados correctamente", "success");
      }
    } catch (error) {
      console.error("Error al cargar mantenciones o productos:", error);
      showSnackbar("Error al cargar la información", "error");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [showSnackbar]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Submit Nueva Mantención
  const handleCreateMantencion = async (e) => {
    e.preventDefault();
    if (!selectedProducto) {
      showSnackbar("Debe seleccionar un producto o equipo", "warning");
      return;
    }
    if (!responsable.trim()) {
      showSnackbar("Debe ingresar el responsable técnico", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        producto_id: selectedProducto.id,
        tipo: "RUTINA",
        fecha_inicio: fechaInicio,
        fecha_fin: marcarCompletadaDirecta ? fechaTermino : null,
        hora,
        responsable: responsable.trim(),
        descripcion: descripcion.trim() ? `[Mantención Semestral] ${descripcion.trim()}` : "Mantención Semestral",
        costo: costo ? parseFloat(costo) : 0
      };

      const res = await productosService.iniciarMantencion(payload);
      if (res && res.success) {
        showSnackbar("Mantención registrada correctamente", "success");
        setOpenNewDialog(false);
        resetForm();
        setTabEstado(0); // Mostrar todas para ver el nuevo registro
        setPage(0);
        loadData();
      } else {
        showSnackbar(res?.message || "No se pudo registrar la mantención", "error");
      }
    } catch (error) {
      console.error("Error creando mantención:", error);
      showSnackbar("Error: " + (error.message || "Error al conectar con el servidor"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProducto(null);
    setTipo("SEMESTRAL");
    setFechaInicio(getTodayInputDate());
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setFechaTermino(`${yyyy}-${mm}-${dd}`);
    setHora("09:00");
    setResponsable(tecnicos[0] || "Cesar Caruz Carrasco");
    setDescripcion("");
    setCosto("");
    setMarcarCompletadaDirecta(false);
  };

  // Abrir Historial del Equipo
  const handleOpenHistorial = async (rowOrProduct) => {
    const prodId = rowOrProduct.producto_id || rowOrProduct.id;
    const prodNombre = rowOrProduct.producto_nombre || rowOrProduct.nombre || `Producto #${prodId}`;
    const prodMarca = rowOrProduct.producto_marca || rowOrProduct.marca || "";
    const prodModelo = rowOrProduct.producto_modelo || rowOrProduct.modelo || "";
    const prodSerie = rowOrProduct.producto_numero_serie || rowOrProduct.numero_serie || "S/S";

    setHistorialProducto({
      id: prodId,
      nombre: prodNombre,
      marca: prodMarca,
      modelo: prodModelo,
      numero_serie: prodSerie
    });
    setOpenHistorialDialog(true);
    setLoadingHistorial(true);

    try {
      const list = await productosService.getHistorialMantenciones(prodId);
      setHistorialMantencionesEquipo(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error cargando historial del equipo:", error);
      showSnackbar("Error al obtener el historial del equipo", "error");
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Finalizar Mantención
  const handleOpenFinalizar = (mantencion) => {
    setSelectedMantencion(mantencion);
    setFechaFinFinalizar(getTodayInputDate());
    setOpenFinalizarDialog(true);
  };

  const handleConfirmFinalizar = async () => {
    if (!selectedMantencion) return;
    setSubmitting(true);
    try {
      const res = await productosService.finalizarMantencion({
        id: selectedMantencion.id,
        fecha_fin: fechaFinFinalizar
      });
      if (res && res.success) {
        showSnackbar("Mantención finalizada con éxito", "success");
        setOpenFinalizarDialog(false);
        setSelectedMantencion(null);
        loadData();
      } else {
        showSnackbar(res?.message || "Error al finalizar mantención", "error");
      }
    } catch (error) {
      console.error("Error finalizando mantención:", error);
      showSnackbar("Error al finalizar mantención", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Diálogo Editar Mantención
  const handleOpenEdit = (mantencion) => {
    setEditingMantencion(mantencion);
    setEditTipo(mantencion.tipo || "RUTINA");
    setEditFechaInicio(formatInputDate(mantencion.fecha_inicio) || getTodayInputDate());
    setEditFechaTermino(formatInputDate(mantencion.fecha_fin));
    setEditResponsable(mantencion.responsable || tecnicos[0] || "Cesar Caruz Carrasco");
    setEditDescripcion(mantencion.descripcion || "");
    setEditCosto(mantencion.costo !== undefined && mantencion.costo !== null ? String(mantencion.costo) : "");
    const todayStr = getTodayInputDate();
    const finStr = formatInputDate(mantencion.fecha_fin);
    setEditCompletada(Boolean(finStr && finStr <= todayStr));
    setOpenEditDialog(true);
  };

  // Confirmar Edición de Mantención
  const handleConfirmEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingMantencion) return;
    if (!editResponsable.trim()) {
      showSnackbar("Debe ingresar el responsable técnico", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingMantencion.id,
        tipo: editTipo,
        fecha_inicio: editFechaInicio,
        fecha_fin: editCompletada ? (editFechaTermino || new Date().toISOString().split("T")[0]) : null,
        responsable: editResponsable.trim(),
        descripcion: editDescripcion.trim(),
        costo: editCosto ? parseFloat(editCosto) : 0
      };

      const res = await productosService.updateMantencion(payload);
      if (res && res.success) {
        showSnackbar("Mantención actualizada correctamente", "success");
        setOpenEditDialog(false);
        setEditingMantencion(null);
        loadData();
      } else {
        showSnackbar(res?.message || "Error al actualizar mantención", "error");
      }
    } catch (error) {
      console.error("Error actualizando mantención:", error);
      showSnackbar("Error al actualizar la mantención", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Confirmación de Eliminación
  const handleOpenDelete = (id) => {
    setDeleteTargetId(id);
    setOpenDeleteDialog(true);
  };

  // Confirmar Eliminación
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSubmitting(true);
    try {
      const res = await productosService.deleteMantencion(deleteTargetId);
      if (res && res.success) {
        showSnackbar("Registro de mantención eliminado", "info");
        setOpenDeleteDialog(false);
        setDeleteTargetId(null);
        loadData();
      } else {
        showSnackbar(res?.message || "Error al eliminar mantención", "error");
      }
    } catch (error) {
      console.error("Error eliminando mantención:", error);
      showSnackbar("Error al eliminar el registro", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats & Next Maintenance (6 months rule)
  const todayStr = getTodayInputDate();
  const totalRegistros = mantenciones.length;
  const enProgreso = mantenciones.filter(m => !m.fecha_fin || formatInputDate(m.fecha_fin) > todayStr);
  const completadas = mantenciones.filter(m => m.fecha_fin && formatInputDate(m.fecha_fin) <= todayStr);

  const getProximaMantencionDate = () => {
    if (!Array.isArray(mantenciones) || mantenciones.length === 0) {
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      return future;
    }
    const validTimes = mantenciones
      .map((m) => {
        const fStr = formatInputDate(m.fecha_fin || m.fecha_inicio);
        return fStr ? new Date(`${fStr}T12:00:00Z`).getTime() : NaN;
      })
      .filter((t) => !isNaN(t));

    if (validTimes.length === 0) {
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      return future;
    }

    const latestDateMs = Math.max(...validTimes);
    const nextDate = new Date(latestDateMs);
    if (isNaN(nextDate.getTime())) {
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      return future;
    }
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  };

  const proximaMantencion = getProximaMantencionDate();
  const proximaMantencionStr =
    proximaMantencion && !isNaN(proximaMantencion.getTime())
      ? proximaMantencion.toLocaleDateString("es-CL", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC"
        })
      : "No programada";

  // Filter mantenciones list (únicamente equipos Notebooks / Laptops / Portátiles)
  const filteredMantenciones = mantenciones.filter((m) => {
    const finStr = formatInputDate(m.fecha_fin);
    const isEnProgreso = !finStr || finStr > todayStr;
    if (tabEstado === 1 && !isEnProgreso) return false;
    if (tabEstado === 2 && isEnProgreso) return false;

    // Verificar si la mantención corresponde a un Notebook
    const prodNombre = (m.producto_nombre || "").toLowerCase();
    const prodDesc = (m.producto_descripcion || "").toLowerCase();
    const prodTipo = (m.producto_tipo || "").toLowerCase();
    const prodModelo = (m.producto_modelo || "").toLowerCase();

    const esNotebook = prodNombre.includes("notebook") || prodNombre.includes("laptop") || prodNombre.includes("portatil") || prodNombre.includes("portátil") ||
                       prodDesc.includes("notebook") || prodDesc.includes("laptop") || prodDesc.includes("portatil") || prodDesc.includes("portátil") ||
                       prodTipo.includes("notebook") || prodTipo.includes("laptop") ||
                       prodModelo.includes("notebook") || prodModelo.includes("thinkpad") || prodModelo.includes("v14") || prodModelo.includes("latitude");

    if (!esNotebook && m.producto_nombre) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const prodSerie = (m.producto_numero_serie || "").toLowerCase();
    const prodMarca = (m.producto_marca || "").toLowerCase();
    const resp = (m.responsable || "").toLowerCase();
    const colab = (m.colaborador_nombre ? `${m.colaborador_nombre} ${m.colaborador_apellido}` : "").toLowerCase();

    return prodNombre.includes(term) || prodSerie.includes(term) || prodMarca.includes(term) || resp.includes(term) || colab.includes(term);
  });

  // Sidebar Drawer component matching Dashboard
  const drawer = (
    <Drawer 
      variant={isMobile ? "temporary" : "persistent"} 
      open={drawerOpen} 
      onClose={() => setDrawerOpen(false)}
      sx={{ 
        width: drawerOpen ? drawerWidth : 0, 
        flexShrink: 0, 
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        transition: (theme) => theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: "border-box", 
          bgcolor: "background.paper",
          borderRight: "1px solid #E2E8F0"
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
        {menuItems.map((item) => {
          const isSelected = window.location.pathname === item.path || item.path === "/mantenciones";
          return (
            <ListItemButton 
              key={item.path}
              onClick={() => { 
                navigate(item.path); 
                if (isMobile) setDrawerOpen(false); 
              }}
              selected={isSelected}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        {drawer}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Top AppBar matching Dashboard */}
          <AppBar 
            position="fixed" 
            elevation={1} 
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "background.paper", color: "text.primary" }}
          >
            <Toolbar>
              <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
              <BuildIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, display: { xs: "none", sm: "block" } }}>
                Módulo de Mantenciones
              </Typography>

              <Tooltip title="Buscar">
                <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
                  <SearchIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Actualizar datos">
                <IconButton color="inherit" onClick={() => loadData(true)} disabled={refreshing}>
                  {refreshing ? <AutorenewIcon sx={{ animation: "spin 1s linear infinite" }} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  {user?.nombre?.charAt(0) || user?.usuario?.charAt(0) || "U"}
                </Avatar>
              </IconButton>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => setAnchorEl(null)}>
                  <PersonIcon sx={{ mr: 1 }} />Mi Perfil
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)}>
                  <LockIcon sx={{ mr: 1 }} />Cambiar Contraseña
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)}>
                  <SettingsIcon sx={{ mr: 1 }} />Configuración
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />Salir
                </MenuItem>
              </Menu>

              {/* Global Search Dialog */}
              <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Buscar Mantenciones</DialogTitle>
                <DialogContent>
                  <TextField
                    fullWidth
                    placeholder="Buscar por equipo, serie, marca..."
                    value={globalSearchTerm}
                    onChange={(e) => {
                      setGlobalSearchTerm(e.target.value);
                      setSearchTerm(e.target.value);
                    }}
                    sx={{ mt: 1 }}
                    autoFocus
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setSearchOpen(false)}>Cerrar</Button>
                </DialogActions>
              </Dialog>
            </Toolbar>
          </AppBar>

          {/* Main Content Area */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              minWidth: 0, 
              mt: 8, 
              pb: 6,
              transition: (theme) => theme.transitions.create(["margin", "width"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <Container maxWidth={false} sx={{ mx: 0, px: { xs: 2, sm: 3, md: 4 } }}>

              {/* Top Banner Card matching Dashboard blue welcome card */}
              <Card 
                sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  mb: 4, 
                  borderRadius: "24px", 
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                  color: "white", 
                  boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.3)",
                  overflow: "visible" 
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: "rgba(255, 255, 255, 0.2)", width: 56, height: 56 }}>
                        <BuildIcon sx={{ fontSize: 32, color: "white" }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "white" }}>
                          Control de Mantenciones
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.95, color: "white", mt: 0.5 }}>
                          Programación y registro periódico cada 6 meses para equipos de colaboradores.
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mt: 2 }}>
                      <Chip 
                        label={`Técnico: ${user?.nombre || "Sistema"}`} 
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }} 
                      />
                      <Chip 
                        label="Ciclo Semestral Activo" 
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600 }} 
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
                    <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1.5} alignItems={{ md: "flex-end" }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon sx={{ color: "#1D4ED8 !important", fontSize: "1.3rem" }} />}
                        onClick={() => setOpenNewDialog(true)}
                        sx={{
                          background: "#FFFFFF !important",
                          backgroundColor: "#FFFFFF !important",
                          color: "#1D4ED8 !important",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          px: 3,
                          py: 1.2,
                          borderRadius: "20px",
                          textTransform: "none",
                          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
                          border: "1px solid #FFFFFF",
                          "&.MuiButton-root": {
                            background: "#FFFFFF !important",
                            backgroundColor: "#FFFFFF !important",
                            color: "#1D4ED8 !important",
                          },
                          "&:hover": {
                            background: "#F8FAFC !important",
                            backgroundColor: "#F8FAFC !important",
                            color: "#1E40AF !important",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 22px rgba(0, 0, 0, 0.3)"
                          }
                        }}
                      >
                        Registrar Mantención
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>

              {/* Banner de Próxima Mantención (Regla de 6 Meses) */}
              <Card 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: "20px", 
                  border: "1px solid #E2E8F0", 
                  bgcolor: "#FFFFFF" 
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "#2563EB", color: "white", width: 52, height: 52 }}>
                        <CalendarTodayIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          PROGRAMACIÓN SEMESTRAL DE MANTENCIONES
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1D4ED8", mt: 0.5 }}>
                          Próxima Mantención General: {proximaMantencionStr}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          Las mantenciones de los colaboradores se realizan cada 6 meses.
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>

              {/* Metric Cards Grid matching Dashboard exact structure */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A" }}>
                          {totalRegistros}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", mt: 0.5 }}>
                          Registros totales
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha("#2563EB", 0.1), color: "#2563EB", width: 48, height: 48 }}>
                        <BuildCircleIcon />
                      </Avatar>
                    </Stack>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#F59E0B" }}>
                          {enProgreso.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", mt: 0.5 }}>
                          En Progreso
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha("#F59E0B", 0.1), color: "#F59E0B", width: 48, height: 48 }}>
                        <AccessTimeIcon />
                      </Avatar>
                    </Stack>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#10B981" }}>
                          {completadas.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", mt: 0.5 }}>
                          Completadas
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha("#10B981", 0.1), color: "#10B981", width: 48, height: 48 }}>
                        <CheckCircleIcon />
                      </Avatar>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>

              {/* Main Table Paper matching Dashboard & Bodegas */}
              <Card elevation={0} sx={{ p: 3, borderRadius: "20px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Tabs value={tabEstado} onChange={(e, val) => setTabEstado(val)} indicatorColor="primary" textColor="primary">
                      <Tab label={`Todas (${totalRegistros})`} sx={{ textTransform: "none", fontWeight: 700 }} />
                      <Tab label={`En Progreso (${enProgreso.length})`} sx={{ textTransform: "none", fontWeight: 700 }} />
                      <Tab label={`Completadas (${completadas.length})`} sx={{ textTransform: "none", fontWeight: 700 }} />
                    </Tabs>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar por producto, marca, serie, técnico o colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                      sx={{ bgcolor: "#F8FAFC" }}
                    />
                  </Grid>
                </Grid>

                {loading ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress />
                    <Typography color="textSecondary" sx={{ mt: 2 }}>
                      Cargando mantenimientos...
                    </Typography>
                  </Box>
                ) : filteredMantenciones.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <BuildCircleIcon sx={{ fontSize: 60, color: "#CBD5E1", mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                      No se encontraron mantenciones
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Regístrese una nueva mantención haciendo clic en el botón superior.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Equipo / Producto</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Colaborador Asignado</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Fecha Inicio</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Fecha Término</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Responsable</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMantenciones
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => {
                              const isDone = Boolean(row.fecha_fin && new Date(row.fecha_fin) <= new Date());
                              return (
                                <TableRow key={row.id} hover>
                                  <TableCell>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                                      {row.producto_nombre || `Producto #${row.producto_id}`}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {row.producto_marca} {row.producto_modelo ? `- ${row.producto_modelo}` : ""} | S/N: {row.producto_numero_serie || "S/S"}
                                    </Typography>
                                  </TableCell>

                                  <TableCell>
                                    {row.colaborador_nombre ? (
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: alpha("#2563EB", 0.1), color: "#2563EB" }}>
                                          {typeof row.colaborador_nombre === "string" ? row.colaborador_nombre.charAt(0).toUpperCase() : "C"}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {row.colaborador_nombre}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            {row.colaborador_cargo || "Colaborador"}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    ) : (
                                      <Chip label="En Bodega / Sin Asignar" size="small" variant="outlined" />
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <Chip
                                      label={row.tipo === "SEMESTRAL" ? "SEMESTRAL" : (row.tipo || "SEMESTRAL")}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: alpha("#3B82F6", 0.1),
                                        color: "#3B82F6"
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell>
                                    <Typography variant="body2">
                                      {formatDate(row.fecha_inicio)}
                                    </Typography>
                                  </TableCell>

                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDone ? "#10B981" : "#F59E0B" }}>
                                      {row.fecha_fin ? formatDate(row.fecha_fin) : "En curso"}
                                    </Typography>
                                  </TableCell>

                                  <TableCell>
                                    <Typography variant="body2">{row.responsable || "No especificado"}</Typography>
                                  </TableCell>

                                  <TableCell>
                                    <Chip
                                      icon={isDone ? <CheckCircleIcon /> : <AccessTimeIcon />}
                                      label={isDone ? "COMPLETADA" : "EN PROGRESO"}
                                      color={isDone ? "success" : "warning"}
                                      size="small"
                                      sx={{ fontWeight: 700 }}
                                    />
                                  </TableCell>

                                  <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                      {!isDone && (
                                        <Button
                                          variant="contained"
                                          color="success"
                                          size="small"
                                          startIcon={<CheckIcon />}
                                          onClick={() => handleOpenFinalizar(row)}
                                          sx={{
                                            fontWeight: 700,
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            fontSize: "0.8rem",
                                            py: 0.5,
                                            px: 1.5,
                                            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                                          }}
                                        >
                                          Marcar Completada
                                        </Button>
                                      )}

                                      <Tooltip title="Editar Mantención">
                                        <IconButton
                                          size="small"
                                          color="info"
                                          onClick={() => handleOpenEdit(row)}
                                          sx={{
                                            bgcolor: alpha("#3B82F6", 0.1),
                                            color: "#3B82F6",
                                            "&:hover": { bgcolor: alpha("#3B82F6", 0.2) }
                                          }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Ver Historial de Mantenciones del Equipo">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleOpenHistorial(row)}
                                          sx={{
                                            bgcolor: alpha("#2563EB", 0.1),
                                            color: "#2563EB",
                                            "&:hover": { bgcolor: alpha("#2563EB", 0.2) }
                                          }}
                                        >
                                          <HistoryIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Eliminar Registro">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleOpenDelete(row.id)}
                                          sx={{ bgcolor: alpha("#EF4444", 0.1), color: "#EF4444" }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={filteredMantenciones.length}
                      page={page}
                      onPageChange={(e, p) => setPage(p)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      labelRowsPerPage="Filas por página:"
                    />
                  </>
                )}
              </Card>

            </Container>
          </Box>
        </Box>
      </Box>

      {/* DIÁLOGO: NUEVA MANTENCIÓN */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "primary.main", color: "white" }}>
          Registrar Nueva Mantención
        </DialogTitle>
        <form onSubmit={handleCreateMantencion}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                  1. SELECCIONAR EQUIPO O PRODUCTO *
                </Typography>
                <Autocomplete
                  options={productos}
                  getOptionLabel={(option) =>
                    `${option.nombre} ${option.marca ? `(${option.marca}` : ""}${option.modelo ? ` - ${option.modelo})` : ")"}${
                      option.numero_serie ? ` - S/N: ${option.numero_serie}` : ""
                    }`
                  }
                  value={selectedProducto}
                  onChange={(e, newValue) => setSelectedProducto(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar Producto por Nombre, Marca, Modelo o Número de Serie"
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {selectedProducto && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary">PRODUCTO</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedProducto.nombre}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {selectedProducto.marca} {selectedProducto.modelo} | S/N: {selectedProducto.numero_serie || "S/S"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="textSecondary">ESTADO ACTUAL / COLABORADOR</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                          {selectedProducto.colaborador_asignado
                            ? `Asignado a: ${selectedProducto.colaborador_asignado.nombre} ${selectedProducto.colaborador_asignado.apellido || ""}`.trim()
                            : "En Bodega (Disponible)"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                  2. DATOS DE LA MANTENCIÓN
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Mantención *"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  helperText="Tipo único: Mantención Semestral (Cada 6 Meses)"
                >
                  <MenuItem value="SEMESTRAL">Mantención Semestral</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Técnico / Responsable *"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  required
                  helperText="Seleccione el técnico asignado a la mantención"
                >
                  {tecnicos.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Inicio *"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Término Estimada *"
                  value={fechaTermino}
                  onChange={(e) => setFechaTermino(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora de la Mantención *"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción / Observaciones"
                  placeholder="Detalles de la revisión realizada..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Costo ($ CLP)"
                  placeholder="0"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: "10px" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={marcarCompletadaDirecta}
                        onChange={(e) => setMarcarCompletadaDirecta(e.target.checked)}
                        color="success"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Marcar esta mantención como completada inmediatamente</Typography>}
                  />
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenNewDialog(false)} color="inherit" sx={{ textTransform: "none" }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ fontWeight: 700, px: 3 }}
            >
              {submitting ? "Guardando..." : "Guardar Mantención"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIÁLOGO: FINALIZAR MANTENCIÓN */}
      <Dialog open={openFinalizarDialog} onClose={() => setOpenFinalizarDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Finalizar Mantención</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Confirmar la finalización de la mantención para el equipo{" "}
            <strong>{selectedMantencion?.producto_nombre}</strong>.
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="Fecha Real de Término"
            value={fechaFinFinalizar}
            onChange={(e) => setFechaFinFinalizar(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenFinalizarDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmFinalizar}
            variant="contained"
            color="success"
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            Finalizar Mantención
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO: HISTORIAL DE MANTENCIONES DEL EQUIPO */}
      <Dialog open={openHistorialDialog} onClose={() => setOpenHistorialDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#1E3A8A", color: "white" }}>
          Historial de Mantenciones del Equipo
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {historialProducto && (
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                {historialProducto.nombre}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {historialProducto.marca} {historialProducto.modelo ? `- ${historialProducto.modelo}` : ""} | Número de Serie: <strong>{historialProducto.numero_serie}</strong>
              </Typography>
            </Paper>
          )}

          {loadingHistorial ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Cargando historial del equipo...
              </Typography>
            </Box>
          ) : historialMantencionesEquipo.length === 0 ? (
            <Alert severity="info">
              Este equipo no registra mantenciones anteriores finalizadas.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Término Real</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Técnico Responsable</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Costo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialMantencionesEquipo.map((h) => {
                    const completada = Boolean(h.fecha_fin && new Date(h.fecha_fin) <= new Date());
                    return (
                      <TableRow key={h.id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>#{h.id}</Typography></TableCell>
                        <TableCell><Chip label="SEMESTRAL" size="small" sx={{ fontWeight: 700, bgcolor: alpha("#3B82F6", 0.1), color: "#3B82F6" }} /></TableCell>
                        <TableCell>{formatDate(h.fecha_inicio)}</TableCell>
                        <TableCell>{h.fecha_fin ? formatDate(h.fecha_fin) : "En curso"}</TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{h.responsable}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="textSecondary">{h.descripcion || "Sin detalles"}</Typography></TableCell>
                        <TableCell>${(h.costo || 0).toLocaleString("es-CL")}</TableCell>
                        <TableCell>
                          <Chip
                            icon={completada ? <CheckCircleIcon /> : <AccessTimeIcon />}
                            label={completada ? "COMPLETADA" : "EN PROGRESO"}
                            color={completada ? "success" : "warning"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenHistorialDialog(false)} variant="contained" sx={{ fontWeight: 700 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIÁLOGO: EDITAR MANTENCIÓN */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: "1px solid #E2E8F0", pb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: alpha("#3B82F6", 0.1), color: "#3B82F6" }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Editar Registro de Mantención</Typography>
              <Typography variant="caption" color="textSecondary">
                Modificar información de la mantención para {editingMantencion?.producto_nombre || `Producto #${editingMantencion?.producto_id}`}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleConfirmEdit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Inicio"
                    type="date"
                    value={editFechaInicio}
                    onChange={(e) => setEditFechaInicio(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={tecnicos}
                    value={editResponsable}
                    onChange={(event, newValue) => setEditResponsable(newValue || "")}
                    freeSolo
                    renderInput={(params) => (
                      <TextField {...params} label="Responsable Técnico" required />
                    )}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Costo ($)"
                    type="number"
                    value={editCosto}
                    onChange={(e) => setEditCosto(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editCompletada}
                        onChange={(e) => {
                          setEditCompletada(e.target.checked);
                          if (e.target.checked && !editFechaTermino) {
                            setEditFechaTermino(new Date().toISOString().split("T")[0]);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label="Marcar como Completada"
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>

              {editCompletada && (
                <TextField
                  fullWidth
                  label="Fecha de Término"
                  type="date"
                  value={editFechaTermino}
                  onChange={(e) => setEditFechaTermino(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción / Observaciones"
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                placeholder="Detalles de la mantención o repuestos aplicados..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ fontWeight: 700 }}
            >
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAR ELIMINACIÓN */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: "#EF4444", color: "white" }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: "#1F2937", fontWeight: 500 }}>
            ¿Está seguro de que desea eliminar este registro de mantención?
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default MantencionPage;
