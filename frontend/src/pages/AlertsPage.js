import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    Chip,
    IconButton,
    LinearProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Notifications as AlertIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    MoreVert as MoreIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { fetchAlerts } from '../redux/slices/alertsSlice';
import { openModal } from '../redux/slices/uiSlice';

// Alert priority colors
const priorityColors = {
    1: 'info',
    2: 'info',
    3: 'warning',
    4: 'error',
    5: 'error',
};

// Alert status colors
const statusColors = {
    active: 'error',
    pending: 'warning',
    resolved: 'success',
};

const AlertsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const alerts = useSelector((state) => state.alerts.alerts);
    const isLoading = useSelector((state) => state.alerts.isLoading);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    useEffect(() => {
        dispatch(fetchAlerts());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchAlerts());
    };

    const handleAlertClick = (alertId) => {
        navigate(`/alerts/${alertId}`);
    };

    const handleViewDetails = (alertId, event) => {
        event.stopPropagation();
        navigate(`/alerts/${alertId}`);
    };

    // Filter alerts based on search term, status, and priority
    const filteredAlerts = alerts.filter((alert) => {
        const matchesSearch =
            alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (alert.id && alert.id.toString().includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || alert.priority.toString() === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Get alert icon based on priority
    const getAlertIcon = (priority) => {
        if (priority >= 4) return <WarningIcon color="error" />;
        if (priority >= 2) return <AlertIcon color="warning" />;
        return <InfoIcon color="info" />;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Alerts
                </Typography>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </Box>

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search alerts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel id="status-filter-label">Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    id="status-filter"
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel id="priority-filter-label">Priority</InputLabel>
                                <Select
                                    labelId="priority-filter-label"
                                    id="priority-filter"
                                    value={priorityFilter}
                                    label="Priority"
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Priorities</MenuItem>
                                    <MenuItem value="1">Low (1)</MenuItem>
                                    <MenuItem value="2">Medium (2)</MenuItem>
                                    <MenuItem value="3">High (3)</MenuItem>
                                    <MenuItem value="4">Critical (4)</MenuItem>
                                    <MenuItem value="5">Emergency (5)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {isLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Alerts List */}
            <Card>
                <List>
                    {filteredAlerts.map((alert) => (
                        <React.Fragment key={alert.id}>
                            <ListItem
                                button
                                onClick={() => handleAlertClick(alert.id)}
                                sx={{
                                    py: 2,
                                    bgcolor: alert.status === 'active' ? 'rgba(211, 47, 47, 0.04)' : 'inherit'
                                }}
                            >
                                <ListItemIcon>
                                    {getAlertIcon(alert.priority)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="subtitle1">
                                                {alert.title || 'Alert'}
                                            </Typography>
                                            <Chip
                                                label={`Priority ${alert.priority}`}
                                                size="small"
                                                color={priorityColors[alert.priority] || 'default'}
                                                sx={{ ml: 1 }}
                                            />
                                            <Chip
                                                label={alert.status}
                                                size="small"
                                                color={statusColors[alert.status] || 'default'}
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {alert.description}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {new Date(alert.createdAt).toLocaleString()}
                                                {alert.robotId && ` • Robot ID: ${alert.robotId}`}
                                                {alert.location?.zone && ` • Location: ${alert.location.zone}`}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={(e) => handleViewDetails(alert.id, e)}
                                    >
                                        View Details
                                    </Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}

                    {filteredAlerts.length === 0 && (
                        <ListItem sx={{ py: 4 }}>
                            <ListItemText
                                primary={
                                    <Typography variant="h6" align="center" color="text.secondary">
                                        No alerts found
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="body2" align="center" color="text.secondary">
                                        {alerts.length > 0
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'There are no alerts in the system at this time.'}
                                    </Typography>
                                }
                                sx={{ textAlign: 'center' }}
                            />
                        </ListItem>
                    )}
                </List>
            </Card>

            {/* Statistics Summary */}
            {alerts.length > 0 && (
                <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {filteredAlerts.length} of {alerts.length} alerts
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default AlertsPage; 