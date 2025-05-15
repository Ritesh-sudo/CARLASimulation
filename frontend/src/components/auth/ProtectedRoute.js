import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute; 