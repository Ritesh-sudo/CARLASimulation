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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Assignment as MissionIcon,
    Schedule as ScheduleIcon,
    SmartToy as RobotIcon,
    Map as MapIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Flag as FlagIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import { getMissionDetails } from '../redux/slices/missionsSlice';

// Mission status colors
const statusColors = {
    active: 'info',
    completed: 'success',
    failed: 'error',
    scheduled: 'warning',
    cancelled: 'default',
};

const MissionDetailPage = () => {
    const { missionId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const selectedMission = useSelector((state) => state.missions.selectedMission);
    const isLoading = useSelector((state) => state.missions.isLoading);
    const robots = useSelector((state) => state.robots.robots);

    useEffect(() => {
        if (missionId) {
            dispatch(getMissionDetails(missionId));
        }
    }, [dispatch, missionId]);

    const getAssignedRobot = () => {
        if (!selectedMission?.robotId) return null;
        return robots.find(robot => robot.id === selectedMission.robotId) || { id: selectedMission.robotId };
    };

    const assignedRobot = getAssignedRobot();

    // If loading or no mission found
    if (isLoading) {
        return <LinearProgress />;
    }

    if (!selectedMission) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary">
                    Mission not found
                </Typography>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/missions')}
                    sx={{ mt: 2 }}
                >
                    Back to Missions
                </Button>
            </Box>
        );
    }

    // Determine mission time display values
    const startTime = selectedMission.startTime
        ? new Date(selectedMission.startTime).toLocaleString()
        : 'Not started';

    const endTime = selectedMission.endTime
        ? new Date(selectedMission.endTime).toLocaleString()
        : selectedMission.estimatedEndTime
            ? `Estimated: ${new Date(selectedMission.estimatedEndTime).toLocaleString()}`
            : 'Not completed';

    const scheduledTime = selectedMission.scheduledTime
        ? new Date(selectedMission.scheduledTime).toLocaleString()
        : 'Not scheduled';

    // Generate checkpoint steps if available
    const checkpoints = selectedMission.checkpoints || [];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/missions')} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" component="h1">
                        {selectedMission.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {selectedMission.description}
                    </Typography>
                </Box>
                <Chip
                    label={selectedMission.status}
                    color={statusColors[selectedMission.status] || 'default'}
                    sx={{ ml: 2 }}
                />
                <Box sx={{ flexGrow: 1 }} />

                {selectedMission.status === 'active' && (
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<StopIcon />}
                        sx={{ ml: 1 }}
                    >
                        Stop Mission
                    </Button>
                )}

                {selectedMission.status === 'scheduled' && (
                    <Button
                        variant="contained"
                        startIcon={<StartIcon />}
                        sx={{ ml: 1 }}
                    >
                        Start Now
                    </Button>
                )}
            </Box>

            {/* Mission Progress */}
            {selectedMission.status === 'active' && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Mission Progress
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={selectedMission.progress || 0}
                                sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                            />
                            <Typography variant="h6" sx={{ ml: 2, minWidth: 45 }}>
                                {selectedMission.progress || 0}%
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Mission Details */}
            <Grid container spacing={3}>
                {/* Mission Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Mission Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Mission ID
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedMission.id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedMission.status}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Assigned Robot
                                    </Typography>
                                    {assignedRobot ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => navigate(`/robots/${assignedRobot.id}`)}
                                        >
                                            <RobotIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                {assignedRobot.name || assignedRobot.id}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body1">
                                            No robot assigned
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedMission.progress || 0}%
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Scheduled Time
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        <Typography variant="body1">
                                            {scheduledTime}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Start Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {startTime}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        End Time
                                    </Typography>
                                    <Typography variant="body1">
                                        {endTime}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Duration
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedMission.duration || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Mission Checkpoints */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Checkpoints
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {checkpoints.length > 0 ? (
                                <Stepper orientation="vertical">
                                    {checkpoints.map((checkpoint, index) => (
                                        <Step
                                            key={checkpoint.id || index}
                                            active={checkpoint.status === 'active'}
                                            completed={checkpoint.status === 'completed'}
                                        >
                                            <StepLabel
                                                optional={
                                                    <Typography variant="caption">
                                                        {checkpoint.time
                                                            ? new Date(checkpoint.time).toLocaleTimeString()
                                                            : ''}
                                                    </Typography>
                                                }
                                            >
                                                {checkpoint.name}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            ) : (
                                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No checkpoints defined for this mission.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Mission Route Map Placeholder */}
                {selectedMission.route && selectedMission.route.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mission Route
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Paper
                                    sx={{
                                        height: 300,
                                        bgcolor: 'grey.100',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <MapIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1">
                                            Mission route map will be displayed here.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<MapIcon />}
                                            sx={{ mt: 2 }}
                                            onClick={() => navigate('/map', {
                                                state: {
                                                    missionId: selectedMission.id
                                                }
                                            })}
                                        >
                                            View on Map
                                        </Button>
                                    </Box>
                                </Paper>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default MissionDetailPage; 