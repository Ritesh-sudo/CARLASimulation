import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Layout components
import AppHeader from './components/layout/AppHeader';
import Sidebar from './components/layout/Sidebar';
import Notifications from './components/common/Notifications';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ModalManager from './components/common/ModalManager';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RobotsPage from './pages/RobotsPage';
import RobotDetailPage from './pages/RobotDetailPage';
import MissionsPage from './pages/MissionsPage';
import MissionDetailPage from './pages/MissionDetailPage';
import AlertsPage from './pages/AlertsPage';
import AlertDetailPage from './pages/AlertDetailPage';
import MapPage from './pages/MapPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import SimulatorPage from './pages/SimulatorPage';

// Redux actions
import { checkAuth } from './redux/slices/authSlice';
import { toggleSidebar } from './redux/slices/uiSlice';

// Real-time connection
import { setupSocketConnection } from './services/socketService';

const App = () => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            setupSocketConnection();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            dispatch(toggleSidebar());
        }
    }, [isMobile, isSidebarOpen, dispatch]);

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {isAuthenticated && <Sidebar />}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    bgcolor: theme.palette.background.default,
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(isAuthenticated && {
                        marginLeft: isMobile ? 0 : isSidebarOpen ? '240px' : '64px',
                    }),
                }}
            >
                {isAuthenticated && <AppHeader />}
                <Box
                    sx={{
                        flexGrow: 1,
                        p: isAuthenticated ? 3 : 0,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        minHeight: '100%',
                        backgroundColor: theme.palette.background.default
                    }}
                >
                    <Box sx={{
                        width: '100%',
                        maxWidth: '1600px',
                        margin: '0 auto'
                    }}>
                        <Routes>
                            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />

                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/robots" element={<RobotsPage />} />
                                <Route path="/robots/:robotId" element={<RobotDetailPage />} />
                                <Route path="/missions" element={<MissionsPage />} />
                                <Route path="/missions/:missionId" element={<MissionDetailPage />} />
                                <Route path="/alerts" element={<AlertsPage />} />
                                <Route path="/alerts/:alertId" element={<AlertDetailPage />} />
                                <Route path="/map" element={<MapPage />} />
                                <Route path="/simulator" element={<SimulatorPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Box>
                </Box>
            </Box>
            <Notifications />
            <ModalManager />
        </Box>
    );
};

export default App; 