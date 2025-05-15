import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Switch,
    FormControlLabel,
    Button,
    Divider,
    TextField,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    InputAdornment,
    IconButton,
    Select,
    MenuItem,
    Tabs,
    Tab,
} from '@mui/material';
import {
    DarkMode as DarkModeIcon,
    Notifications as NotificationsIcon,
    Language as LanguageIcon,
    Security as SecurityIcon,
    Save as SaveIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Person as PersonIcon,
    Map as MapIcon,
    Storage as StorageIcon,
} from '@mui/icons-material';
import { toggleDarkMode } from '../redux/slices/uiSlice';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const SettingsPage = () => {
    const dispatch = useDispatch();
    const isDarkMode = useSelector((state) => state.ui.isDarkMode);
    const user = useSelector((state) => state.auth.user);

    const [tabValue, setTabValue] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    // Form states
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        pushNotifications: true,
        soundAlerts: true,
        criticalAlertsOnly: false,
    });

    const [mapSettings, setMapSettings] = useState({
        defaultZoom: 15,
        defaultMapType: 'street',
        showRobotPaths: true,
        showGeofences: true,
        showPOIs: true,
    });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleProfileFormChange = (event) => {
        setProfileForm({
            ...profileForm,
            [event.target.name]: event.target.value,
        });
    };

    const handlePasswordFormChange = (event) => {
        setPasswordForm({
            ...passwordForm,
            [event.target.name]: event.target.value,
        });
    };

    const handleSaveProfile = () => {
        // Logic to save profile
        setShowNotification(true);
    };

    const handleChangePassword = () => {
        // Logic to change password
        setShowNotification(true);
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    const handleNotificationSettingChange = (setting) => (event) => {
        setNotificationSettings({
            ...notificationSettings,
            [setting]: event.target.checked,
        });
    };

    const handleMapSettingChange = (setting) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setMapSettings({
            ...mapSettings,
            [setting]: value,
        });
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            <Card sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="settings tabs"
                >
                    <Tab icon={<PersonIcon />} label="Profile" />
                    <Tab icon={<SecurityIcon />} label="Security" />
                    <Tab icon={<NotificationsIcon />} label="Notifications" />
                    <Tab icon={<MapIcon />} label="Map Settings" />
                    <Tab icon={<DarkModeIcon />} label="Appearance" />
                </Tabs>

                {/* Profile Settings */}
                <TabPanel value={tabValue} index={0}>
                    <Typography variant="h6" gutterBottom>
                        Profile Information
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="firstName"
                                label="First Name"
                                value={profileForm.firstName}
                                onChange={handleProfileFormChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="lastName"
                                label="Last Name"
                                value={profileForm.lastName}
                                onChange={handleProfileFormChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="username"
                                label="Username"
                                value={profileForm.username}
                                onChange={handleProfileFormChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                value={profileForm.email}
                                onChange={handleProfileFormChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveProfile}
                            >
                                Save Changes
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Security Settings */}
                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Change Password
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                name="currentPassword"
                                label="Current Password"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordFormChange}
                                fullWidth
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="newPassword"
                                label="New Password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={handlePasswordFormChange}
                                fullWidth
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="confirmPassword"
                                label="Confirm New Password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordFormChange}
                                fullWidth
                                error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
                                helperText={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== '' ? 'Passwords do not match' : ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleChangePassword}
                                disabled={
                                    !passwordForm.currentPassword ||
                                    !passwordForm.newPassword ||
                                    !passwordForm.confirmPassword ||
                                    passwordForm.newPassword !== passwordForm.confirmPassword
                                }
                            >
                                Change Password
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Notification Settings */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Notification Preferences
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <NotificationsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Email Alerts" />
                            <Switch
                                edge="end"
                                checked={notificationSettings.emailAlerts}
                                onChange={handleNotificationSettingChange('emailAlerts')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <NotificationsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Push Notifications" />
                            <Switch
                                edge="end"
                                checked={notificationSettings.pushNotifications}
                                onChange={handleNotificationSettingChange('pushNotifications')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <NotificationsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Sound Alerts" />
                            <Switch
                                edge="end"
                                checked={notificationSettings.soundAlerts}
                                onChange={handleNotificationSettingChange('soundAlerts')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <NotificationsIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary="Critical Alerts Only"
                                secondary="Only receive alerts for high priority events (Priority 3+)"
                            />
                            <Switch
                                edge="end"
                                checked={notificationSettings.criticalAlertsOnly}
                                onChange={handleNotificationSettingChange('criticalAlertsOnly')}
                            />
                        </ListItem>
                    </List>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => setShowNotification(true)}
                        >
                            Save Notification Settings
                        </Button>
                    </Box>
                </TabPanel>

                {/* Map Settings */}
                <TabPanel value={tabValue} index={3}>
                    <Typography variant="h6" gutterBottom>
                        Map Display Preferences
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Default Zoom Level"
                                type="number"
                                value={mapSettings.defaultZoom}
                                onChange={handleMapSettingChange('defaultZoom')}
                                InputProps={{ inputProps: { min: 1, max: 20 } }}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Default Map Type"
                                value={mapSettings.defaultMapType}
                                onChange={handleMapSettingChange('defaultMapType')}
                                fullWidth
                            >
                                <MenuItem value="street">Street</MenuItem>
                                <MenuItem value="satellite">Satellite</MenuItem>
                                <MenuItem value="terrain">Terrain</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={mapSettings.showRobotPaths}
                                        onChange={handleMapSettingChange('showRobotPaths')}
                                    />
                                }
                                label="Show Robot Paths"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={mapSettings.showGeofences}
                                        onChange={handleMapSettingChange('showGeofences')}
                                    />
                                }
                                label="Show Geofences"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={mapSettings.showPOIs}
                                        onChange={handleMapSettingChange('showPOIs')}
                                    />
                                }
                                label="Show Points of Interest"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => setShowNotification(true)}
                            >
                                Save Map Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Appearance Settings */}
                <TabPanel value={tabValue} index={4}>
                    <Typography variant="h6" gutterBottom>
                        Theme and Display
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <DarkModeIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary="Dark Mode"
                                secondary="Toggle between light and dark theme"
                            />
                            <Switch
                                edge="end"
                                checked={isDarkMode}
                                onChange={() => dispatch(toggleDarkMode())}
                            />
                        </ListItem>
                    </List>
                </TabPanel>
            </Card>

            <Snackbar
                open={showNotification}
                autoHideDuration={6000}
                onClose={() => setShowNotification(false)}
            >
                <Alert onClose={() => setShowNotification(false)} severity="success">
                    Settings updated successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SettingsPage; 