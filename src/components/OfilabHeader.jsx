import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button } from '@mui/material';
import { Home as HomeIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const OfilabHeader = ({ title = 'Sistema de Inventario', onRefresh, refreshing = false, showHome = true, extraActions }) => {
    const navigate = useNavigate();

    return (
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', color: '#111827', borderBottom: '1px solid #E5E7EB' }}>
            <Toolbar>
                {showHome && (
                    <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1.5 }}>
                        <HomeIcon sx={{ color: '#7C3AED' }} />
                    </IconButton>
                )}
                <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    <img 
                        src="/Logo_transparente.png" 
                        alt="OFILAB Logo" 
                        style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
                    />
                    <Box sx={{ display: { xs: 'none', sm: 'block' }, borderLeft: '1px solid #E5E7EB', pl: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            OFILAB Tech Systems
                        </Typography>
                    </Box>
                </Box>
                {extraActions}
                {onRefresh && (
                    <IconButton color="inherit" onClick={onRefresh} disabled={refreshing}>
                        <RefreshIcon sx={{ color: '#7C3AED' }} />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default OfilabHeader;
