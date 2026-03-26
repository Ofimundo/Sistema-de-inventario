// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/auth';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
        // Si no está autenticado, redirigir al login
        return <Navigate to="/login" replace />;
    }
    
    // Si está autenticado, mostrar el componente hijo
    return children;
};

export default ProtectedRoute;