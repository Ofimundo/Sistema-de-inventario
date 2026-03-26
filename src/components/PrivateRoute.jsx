// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();
    
    console.log('🔐 Verificando autenticación en ruta privada:', isAuthenticated);
    
    if (!isAuthenticated) {
        // Si no está autenticado, redirigir al login
        return <Navigate to="/login" replace />;
    }
    
    // Si está autenticado, mostrar el componente hijo
    return children;
};

export default PrivateRoute;