// src/App.jsx - VERSIÓN COMPLETA CORREGIDA (SIN CÓDIGO DE BACKEND)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { 
    CircularProgress, 
    Box, 
    Typography, 
    Button 
} from '@mui/material';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import authService from './services/auth';

// Importaciones normales (no lazy para rutas principales)
import Login from './pages/Login';
import Register from './pages/Register';
import RecoverPassword from './pages/RecoverPassword';
import ChecklistAsignacionPage from './pages/ChecklistAsignacionPage';

// Lazy load para mejorar rendimiento
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Productos = lazy(() => import('./pages/Productos'));
const Bodegas = lazy(() => import('./pages/Bodegas'));
const HistorialPage = lazy(() => import('./pages/HistorialPage'));
const AsignacionPage = lazy(() => import('./pages/AsignacionPage'));
const ColaboradoresPage = lazy(() => import('./pages/ColaboradoresPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const AnexosPage = lazy(() => import('./pages/AnexosPage'));
const MantencionPage = lazy(() => import('./pages/MantencionPage'));
const PublicQRInfoPage = lazy(() => import('./pages/PublicQRInfoPage'));

// Componente para mostrar mientras carga
const LoadingScreen = () => (
    <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f5f5f5'
    }}>
        <CircularProgress size={60} thickness={4} />
    </Box>
);

// Componente para la página 404
const NotFoundPage = () => {
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            bgcolor: '#f5f5f5'
        }}>
            <Typography variant="h1" color="primary" sx={{ fontSize: '8rem', fontWeight: 700 }}>
                404
            </Typography>
            <Typography variant="h5" color="textSecondary" gutterBottom>
                Página no encontrada
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                La página que estás buscando no existe o ha sido movida.
            </Typography>
            <Button 
                variant="contained" 
                component="a"
                href="/"
                sx={{ 
                    mt: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                }}
            >
                Volver al inicio
            </Button>
        </Box>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                    {/* ============================================ */}
                    {/* RUTAS PÚBLICAS - NO REQUIEREN AUTENTICACIÓN */}
                    {/* ============================================ */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/recover-password" element={<RecoverPassword />} />
                    <Route path="/recover-password/:token" element={<RecoverPassword />} />
                    <Route path="/qr-info" element={<PublicQRInfoPage />} />
                    
                    {/* ============================================ */}
                    {/* RUTAS PROTEGIDAS - REQUIEREN AUTENTICACIÓN */}
                    {/* ============================================ */}
                    
                    {/* Dashboard */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Gestión de Productos */}
                    <Route 
                        path="/productos" 
                        element={
                            <PrivateRoute>
                                <Productos />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Gestión de Bodegas */}
                    <Route 
                        path="/bodegas" 
                        element={
                            <PrivateRoute>
                                <Bodegas />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Gestión de Colaboradores */}
                    <Route 
                        path="/colaboradores" 
                        element={
                            <PrivateRoute>
                                <ColaboradoresPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Historial completo */}
                    <Route 
                        path="/historial" 
                        element={
                            <PrivateRoute>
                                <HistorialPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Asignación de productos */}
                    <Route 
                        path="/asignacion" 
                        element={
                            <PrivateRoute>
                                <AsignacionPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Checklist de entrega de equipos */}
                    <Route 
                        path="/checklist" 
                        element={
                            <PrivateRoute>
                                <ChecklistAsignacionPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* Stock por Marca y Modelo */}
                    <Route 
                        path="/stock" 
                        element={
                            <PrivateRoute>
                                <StockPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* ANEXOS DE CONTRATO */}
                    <Route 
                        path="/anexos" 
                        element={
                            <PrivateRoute>
                                <AnexosPage />
                            </PrivateRoute>
                        } 
                    />

                    {/* MANTENCIONES */}
                    <Route 
                        path="/mantenciones" 
                        element={
                            <PrivateRoute>
                                <MantencionPage />
                            </PrivateRoute>
                        } 
                    />
                    
                    {/* ============================================ */}
                    {/* REDIRECCIONES */}
                    {/* ============================================ */}
                    
                    {/* Redirección por defecto */}
                    <Route 
                        path="/" 
                        element={
                            authService.isAuthenticated() 
                                ? <Navigate to="/dashboard" replace /> 
                                : <Navigate to="/login" replace />
                        } 
                    />
                    
                    {/* Ruta 404 */}
                    <Route path="/404" element={<NotFoundPage />} />
                    
                    {/* Ruta comodín */}
                    <Route 
                        path="*" 
                        element={<Navigate to="/404" replace />}
                    />
                </Routes>
            </Suspense>
        </Router>
    </ErrorBoundary>
    );
}

export default App;