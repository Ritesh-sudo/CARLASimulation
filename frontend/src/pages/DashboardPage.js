import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Button,
    Chip,
    LinearProgress,
    Divider,
    IconButton,
} from '@mui/material';
import {
    SmartToy as RobotIcon,
    Warning as WarningIcon,
    Notifications as AlertIcon,
    Assignment as MissionIcon,
    Map as MapIcon,
    Battery90 as BatteryIcon,
    Thermostat as TemperatureIcon,
    MoreVert as MoreIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { fetchRobots } from '../redux/slices/robotsSlice';
import { fetchAlerts } from '../redux/slices/alertsSlice';
import { fetchMissions } from '../redux/slices/missionsSlice';

// Robot status colors
const statusColors = {
    online: 'success',
    offline: 'error',
    maintenance: 'warning',
    mission_active: 'info',
    idle: 'default',
    charging: 'secondary',
};

const DashboardPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const robots = useSelector((state) => state.robots.robots);
    const alerts = useSelector((state) => state.alerts.alerts);
    const activeAlerts = useSelector((state) => state.alerts.activeAlerts);
    const missionStats = useSelector((state) => state.missions.missionStats);
    const isLoading = useSelector((state) =>
        state.robots.isLoading || state.alerts.isLoading || state.missions.isLoading
    );

    useEffect(() => {
        dispatch(fetchRobots());
        dispatch(fetchAlerts({ limit: 5 }));
        dispatch(fetchMissions({ limit: 5 }));
    }, [dispatch]);

    // Calculate robot status counts
    const totalRobots = robots.length;
    const onlineRobots = robots.filter(robot => robot.status === 'online' || robot.status === 'mission_active').length;
    const offlineRobots = robots.filter(robot => robot.status === 'offline').length;
    const maintenanceRobots = robots.filter(robot => robot.status === 'maintenance').length;
    const chargingRobots = robots.filter(robot => robot.status === 'charging').length;

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>

            {isLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Status Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                        Total Robots
                                    </Typography>
                                    <Typography variant="h4">{totalRobots}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <RobotIcon />
                                </Avatar>
                            </Box>
                            <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                                <Chip
                                    size="small"
                                    color="success"
                                    label={`${onlineRobots} Online`}
                                />
                                {offlineRobots > 0 && (
                                    <Chip
                                        size="small"
                                        color="error"
                                        label={`${offlineRobots} Offline`}
                                    />
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                        Active Alerts
                                    </Typography>
                                    <Typography variant="h4">{activeAlerts}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'error.main' }}>
                                    <WarningIcon />
                                </Avatar>
                            </Box>
                            <Button
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate('/alerts')}
                                sx={{ mt: 2 }}
                            >
                                View Alerts
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                        Active Missions
                                    </Typography>
                                    <Typography variant="h4">{missionStats.active}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'info.main' }}>
                                    <MissionIcon />
                                </Avatar>
                            </Box>
                            <Button
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate('/missions')}
                                sx={{ mt: 2 }}
                            >
                                View Missions
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                                        Robots in Maintenance
                                    </Typography>
                                    <Typography variant="h4">{maintenanceRobots}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                    <TemperatureIcon />
                                </Avatar>
                            </Box>
                            <Button
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate('/robots?filter=maintenance')}
                                sx={{ mt: 2 }}
                            >
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Robot Fleet and Alerts */}
            <Grid container spacing={3}>
                {/* Robot Fleet */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Robot Fleet Status
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/robots')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {robots.slice(0, 5).map((robot) => (
                                <Box key={robot.id}>
                                    <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
                                        <Avatar
                                            sx={{ bgcolor: 'primary.light', mr: 2 }}
                                            variant="rounded"
                                        >
                                            <RobotIcon />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1">{robot.name}</Typography>
                                                <Chip
                                                    size="small"
                                                    color={statusColors[robot.status] || 'default'}
                                                    label={robot.status?.replace('_', ' ')}
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <BatteryIcon sx={{ color: 'success.main', fontSize: '1rem', mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {robot.battery || 'N/A'}%
                                                </Typography>
                                                <MapIcon sx={{ color: 'info.main', fontSize: '1rem', ml: 2, mr: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {robot.location?.zone || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/robots/${robot.id}`)}
                                        >
                                            <MoreIcon />
                                        </IconButton>
                                    </Box>
                                    <Divider />
                                </Box>
                            ))}

                            {robots.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No robots found in the system.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Alerts */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Recent Alerts
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/alerts')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {alerts.slice(0, 5).map((alert) => (
                                <Box key={alert.id} onClick={() => navigate(`/alerts/${alert.id}`)} sx={{ cursor: 'pointer' }}>
                                    <Box sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: alert.priority > 3 ? 'error.main' :
                                                    alert.priority > 1 ? 'warning.main' : 'info.main',
                                                mr: 2,
                                            }}
                                        >
                                            <AlertIcon />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle2" noWrap>{alert.title || 'Alert'}</Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {alert.description}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(alert.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            color={alert.status === 'resolved' ? 'success' : 'error'}
                                            label={alert.status}
                                        />
                                    </Box>
                                    <Divider />
                                </Box>
                            ))}

                            {alerts.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No recent alerts.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage; 