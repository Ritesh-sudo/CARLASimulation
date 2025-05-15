import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    LinearProgress,
    Divider,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Notifications as AlertIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    SmartToy as RobotIcon,
    LocationOn as LocationIcon,
    Camera as CameraIcon,
} from '@mui/icons-material';
import { selectAlert, resolveAlert, updateAlert } from '../redux/slices/alertsSlice';

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

const AlertDetailPage = () => {
    const { alertId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const selectedAlert = useSelector((state) => state.alerts.selectedAlert);
    const isLoading = useSelector((state) => state.alerts.isLoading);

    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolution, setResolution] = useState('');

    useEffect(() => {
        if (alertId) {
            dispatch(selectAlert(alertId));
        }
    }, [dispatch, alertId]);

    const handleRefresh = () => {
        dispatch(selectAlert(alertId));
    };

    const handleOpenResolveDialog = () => {
        setResolveDialogOpen(true);
    };

    const handleCloseResolveDialog = () => {
        setResolveDialogOpen(false);
    };

    const handleResolveAlert = () => {
        dispatch(resolveAlert({ alertId, resolution }));
        setResolveDialogOpen(false);
    };

    const getAlertIcon = (priority) => {
        if (priority >= 4) return <WarningIcon sx={{ fontSize: 40 }} color="error" />;
        if (priority >= 2) return <AlertIcon sx={{ fontSize: 40 }} color="warning" />;
        return <InfoIcon sx={{ fontSize: 40 }} color="info" />;
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 5: return 'Emergency';
            case 4: return 'Critical';
            case 3: return 'High';
            case 2: return 'Medium';
            case 1: return 'Low';
            default: return 'Unknown';
        }
    };

    // If loading or no alert found
    if (isLoading) {
        return <LinearProgress />;
    }

    if (!selectedAlert) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary">
                    Alert not found
                </Typography>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/alerts')}
                    sx={{ mt: 2 }}
                >
                    Back to Alerts
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/alerts')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1">
                        {selectedAlert.title || 'Alert Details'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Chip
                            label={`Priority ${selectedAlert.priority}: ${getPriorityLabel(selectedAlert.priority)}`}
                            color={priorityColors[selectedAlert.priority] || 'default'}
                            size="small"
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            label={selectedAlert.status}
                            color={statusColors[selectedAlert.status] || 'default'}
                            size="small"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            {new Date(selectedAlert.createdAt).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    sx={{ mr: 1 }}
                >
                    Refresh
                </Button>
                {selectedAlert.status !== 'resolved' && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleOpenResolveDialog}
                    >
                        Resolve
                    </Button>
                )}
            </Box>

            {/* Alert Details */}
            <Grid container spacing={3}>
                {/* Main Information */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                                <Box sx={{ mt: 1, mr: 2 }}>
                                    {getAlertIcon(selectedAlert.priority)}
                                </Box>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Alert Description
                                    </Typography>
                                    <Typography variant="body1" paragraph>
                                        {selectedAlert.description}
                                    </Typography>

                                    {selectedAlert.details && (
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedAlert.details}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Robot Information */}
                            {selectedAlert.robotId && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Associated Robot
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            bgcolor: 'background.default',
                                            borderRadius: 1,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/robots/${selectedAlert.robotId}`)}
                                    >
                                        <RobotIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="body1">
                                            Robot ID: {selectedAlert.robotId}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* Location Information */}
                            {selectedAlert.location && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Location
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 1.5,
                                            bgcolor: 'background.default',
                                            borderRadius: 1
                                        }}
                                    >
                                        <LocationIcon color="error" sx={{ mr: 1 }} />
                                        <Box>
                                            <Typography variant="body1">
                                                {selectedAlert.location.zone || 'Unknown Zone'}
                                            </Typography>
                                            {selectedAlert.location.coordinates && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Lat: {selectedAlert.location.coordinates.lat},
                                                    Lng: {selectedAlert.location.coordinates.lng}
                                                </Typography>
                                            )}
                                        </Box>
                                        {selectedAlert.location.coordinates && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ ml: 'auto' }}
                                                onClick={() => navigate('/map', {
                                                    state: { alertLocation: selectedAlert.location.coordinates }
                                                })}
                                            >
                                                View on Map
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Status Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Alert ID
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedAlert.id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedAlert.status}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Created At
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedAlert.createdAt).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Updated At
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedAlert.updatedAt
                                            ? new Date(selectedAlert.updatedAt).toLocaleString()
                                            : 'N/A'}
                                    </Typography>
                                </Grid>

                                {selectedAlert.status === 'resolved' && (
                                    <>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Resolved At
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedAlert.resolvedAt
                                                    ? new Date(selectedAlert.resolvedAt).toLocaleString()
                                                    : 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Resolution
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedAlert.resolution || 'No resolution details provided.'}
                                            </Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Resolve Alert Dialog */}
            <Dialog open={resolveDialogOpen} onClose={handleCloseResolveDialog}>
                <DialogTitle>Resolve Alert</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Please provide details on how this alert was resolved.
                    </Typography>
                    <TextField
                        autoFocus
                        label="Resolution Details"
                        fullWidth
                        multiline
                        rows={4}
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseResolveDialog}>Cancel</Button>
                    <Button
                        onClick={handleResolveAlert}
                        variant="contained"
                        color="success"
                        disabled={!resolution.trim()}
                    >
                        Resolve Alert
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AlertDetailPage; 