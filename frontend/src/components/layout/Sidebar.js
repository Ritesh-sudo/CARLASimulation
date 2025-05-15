import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    Tooltip,
    Avatar,
    Typography,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    SmartToy as RobotIcon,
    Map as MapIcon,
    Notifications as AlertIcon,
    Assignment as MissionIcon,
    Settings as SettingsIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Security as SecurityIcon,
    ExitToApp as LogoutIcon,
    SportsEsports as SimulatorIcon,
} from '@mui/icons-material';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen);
    const user = useSelector((state) => state.auth.user);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Robots', icon: <RobotIcon />, path: '/robots' },
        { text: 'Missions', icon: <MissionIcon />, path: '/missions' },
        { text: 'Map', icon: <MapIcon />, path: '/map' },
        { text: 'Alerts', icon: <AlertIcon />, path: '/alerts' },
        { text: 'Simulator', icon: <SimulatorIcon />, path: '/simulator' },
    ];

    const secondaryMenuItems = [
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const drawerWidth = 240;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: isSidebarOpen ? drawerWidth : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isSidebarOpen ? drawerWidth : 64,
                    boxSizing: 'border-box',
                    transition: (theme) =>
                        theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    overflowX: 'hidden',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSidebarOpen ? 'space-between' : 'center',
                        padding: 2,
                    }}
                >
                    {isSidebarOpen && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SecurityIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" noWrap>
                                Robot Patrol
                            </Typography>
                        </Box>
                    )}
                    <IconButton onClick={() => dispatch(toggleSidebar())}>
                        {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </Box>

                <Divider />

                {/* User Profile */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: isSidebarOpen ? 'row' : 'column',
                        alignItems: 'center',
                        padding: 2,
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                            mb: isSidebarOpen ? 0 : 1,
                        }}
                    >
                        {user?.username.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    {isSidebarOpen && (
                        <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle1">{user?.username || 'User'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {user?.role || 'Staff'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Divider />

                {/* Main Menu */}
                <List sx={{ flexGrow: 1 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={isActive(item.path)}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                                    px: 2.5,
                                }}
                            >
                                <Tooltip title={!isSidebarOpen ? item.text : ''} placement="right">
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: isSidebarOpen ? 3 : 'auto',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </Tooltip>
                                {isSidebarOpen && <ListItemText primary={item.text} />}
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Divider />

                {/* Secondary Menu */}
                <List>
                    {secondaryMenuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={isActive(item.path)}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: isSidebarOpen ? 'initial' : 'center',
                                    px: 2.5,
                                }}
                            >
                                <Tooltip title={!isSidebarOpen ? item.text : ''} placement="right">
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: isSidebarOpen ? 3 : 'auto',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                </Tooltip>
                                {isSidebarOpen && <ListItemText primary={item.text} />}
                            </ListItemButton>
                        </ListItem>
                    ))}

                    {/* Logout */}
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{
                                minHeight: 48,
                                justifyContent: isSidebarOpen ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <Tooltip title={!isSidebarOpen ? 'Logout' : ''} placement="right">
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: isSidebarOpen ? 3 : 'auto',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <LogoutIcon />
                                </ListItemIcon>
                            </Tooltip>
                            {isSidebarOpen && <ListItemText primary="Logout" />}
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar; 