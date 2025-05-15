import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Tooltip,
    Avatar,
    Divider,
    Button,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    AccountCircle,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Search as SearchIcon,
    MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toggleDarkMode } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';

const AppHeader = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isDarkMode = useSelector((state) => state.ui.isDarkMode);
    const user = useSelector((state) => state.auth.user);
    const alerts = useSelector((state) => state.alerts.alerts);
    const activeAlerts = useSelector((state) => state.alerts.activeAlerts);

    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
    const isNotificationsMenuOpen = Boolean(notificationsAnchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        handleMobileMenuClose();
    };

    const handleNotificationsMenuOpen = (event) => {
        setNotificationsAnchorEl(event.currentTarget);
    };

    const handleNotificationsMenuClose = () => {
        setNotificationsAnchorEl(null);
    };

    const handleMobileMenuOpen = (event) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const handleLogout = () => {
        handleMenuClose();
        dispatch(logout());
        navigate('/login');
    };

    const handleViewAllAlerts = () => {
        handleNotificationsMenuClose();
        navigate('/alerts');
    };

    const handleViewAlert = (alertId) => {
        handleNotificationsMenuClose();
        navigate(`/alerts/${alertId}`);
    };

    const menuId = 'primary-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            id={menuId}
            keepMounted
            open={isMenuOpen}
            onClose={handleMenuClose}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1">{user?.username || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {user?.email || 'user@example.com'}
                </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
    );

    const notificationsMenuId = 'primary-notifications-menu';
    const renderNotificationsMenu = (
        <Menu
            anchorEl={notificationsAnchorEl}
            id={notificationsMenuId}
            keepMounted
            open={isNotificationsMenuOpen}
            onClose={handleNotificationsMenuClose}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                style: {
                    maxHeight: 400,
                    width: '300px',
                },
            }}
        >
            <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1">Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                    {activeAlerts} active alerts
                </Typography>
            </Box>
            <Divider />
            {alerts && alerts.length > 0 ? (
                <>
                    {alerts.slice(0, 5).map((alert) => (
                        <MenuItem key={alert.id} onClick={() => handleViewAlert(alert.id)}>
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body1" noWrap>
                                        {alert.title || 'Alert'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(alert.createdAt).toLocaleTimeString()}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    {alert.description}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                    <Divider />
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                        <Button onClick={handleViewAllAlerts} size="small">
                            View All Alerts
                        </Button>
                    </Box>
                </>
            ) : (
                <MenuItem disabled>
                    <Typography variant="body2">No recent alerts</Typography>
                </MenuItem>
            )}
        </Menu>
    );

    const mobileMenuId = 'primary-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            id={mobileMenuId}
            keepMounted
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <MenuItem onClick={handleNotificationsMenuOpen}>
                <IconButton size="large" color="inherit">
                    <Badge badgeContent={activeAlerts} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <p>Notifications</p>
            </MenuItem>
            <MenuItem>
                <IconButton size="large" color="inherit" onClick={() => dispatch(toggleDarkMode())}>
                    {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
                <p>Theme</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton size="large" color="inherit">
                    <AccountCircle />
                </IconButton>
                <p>Profile</p>
            </MenuItem>
        </Menu>
    );

    return (
        <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            <Toolbar>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                    <Tooltip title="Search">
                        <IconButton size="large" color="inherit">
                            <SearchIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Theme">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isDarkMode}
                                    onChange={() => dispatch(toggleDarkMode())}
                                    color="primary"
                                />
                            }
                            label={isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
                            sx={{ mx: 1 }}
                        />
                    </Tooltip>
                    <Tooltip title="Notifications">
                        <IconButton
                            size="large"
                            color="inherit"
                            onClick={handleNotificationsMenuOpen}
                            aria-controls={notificationsMenuId}
                        >
                            <Badge badgeContent={activeAlerts} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Account">
                        <IconButton
                            size="large"
                            edge="end"
                            onClick={handleProfileMenuOpen}
                            color="inherit"
                            aria-controls={menuId}
                            sx={{ ml: 1 }}
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {user?.username.charAt(0).toUpperCase() || 'U'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                    <IconButton
                        size="large"
                        aria-controls={mobileMenuId}
                        onClick={handleMobileMenuOpen}
                        color="inherit"
                    >
                        <MoreIcon />
                    </IconButton>
                </Box>
            </Toolbar>
            {renderMobileMenu}
            {renderMenu}
            {renderNotificationsMenu}
        </AppBar>
    );
};

export default AppHeader; 