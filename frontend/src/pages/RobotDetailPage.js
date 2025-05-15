import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Button,
    Divider,
    Chip, // Assuming you might want status chips etc.
    Paper, // For better layout sections
    IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // For back button
// Import the correct thunk and selectors
import {
    fetchRobotDetails,
    selectSelectedRobot,
    selectRobotDetailsLoading,
    selectRobotDetailsError,
    clearSelectedRobot // Action to clear state on unmount
} from '../redux/slices/robotsSlice';

// Assuming status colors are defined elsewhere or define here
const statusColors = {
    online: 'success',
    offline: 'error',
    maintenance: 'warning',
    mission_active: 'info',
    idle: 'default',
    charging: 'secondary',
};

const RobotDetailPage = () => {
    const { robotId } = useParams(); // Get robotId from URL
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select the relevant state parts
    const robot = useSelector(selectSelectedRobot);
    const isLoading = useSelector(selectRobotDetailsLoading);
    const error = useSelector(selectRobotDetailsError);

    useEffect(() => {
        // Fetch details when component mounts or robotId changes
        if (robotId) {
            dispatch(fetchRobotDetails(robotId));
        }

        // Cleanup function to clear selected robot when component unmounts
        return () => {
            dispatch(clearSelectedRobot());
        };
    }, [dispatch, robotId]); // Dependency array includes dispatch and robotId

    const handleGoBack = () => {
        navigate('/robots'); // Navigate back to the list page
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading Robot Details...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
                    Back to Robots
                </Button>
                <Alert severity="error">
                    Error loading robot details: {typeof error === 'string' ? error : JSON.stringify(error)}
                </Alert>
            </Box>
        );
    }

    if (!robot) {
        // Handles the case where loading is finished but robot is still null (e.g., initial state or cleared)
        return (
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
                    Back to Robots
                </Button>
                <Alert severity="info">No robot details available.</Alert>
            </Box>
        );
    }

    // --- Display Robot Details ---
    return (
        <Box sx={{ p: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
                Back to Robots
            </Button>
            <Typography variant="h4" gutterBottom>
                Robot Details: {robot.name || robot.model || `ID: ${robot.robot_id}`}
            </Typography>

            <Card component={Paper} elevation={3}>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Basic Info Section */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Basic Information</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body1"><strong>ID:</strong> {robot.robot_id || 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Model:</strong> {robot.model || 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Version:</strong> {robot.version || 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Name:</strong> {robot.name || 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Organization ID:</strong> {robot.org_id || 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Created At:</strong> {robot.created_at ? new Date(robot.created_at).toLocaleString() : 'N/A'}</Typography>
                        </Grid>

                        {/* Status & Operational Info Section */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Status & Operation</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body1" sx={{ mr: 1 }}><strong>Status:</strong></Typography>
                                <Chip
                                    size="small"
                                    color={statusColors[robot.status] || 'default'}
                                    label={robot.status?.replace('_', ' ') || 'Unknown'}
                                />
                            </Box>
                            <Typography variant="body1"><strong>Active:</strong> {robot.is_active ? 'Yes' : 'No'}</Typography>
                            <Typography variant="body1"><strong>Battery:</strong> {robot.battery != null ? `${robot.battery}%` : 'N/A'}</Typography>
                            <Typography variant="body1"><strong>Location Zone:</strong> {robot.location?.zone || 'Unknown'}</Typography>
                            {/* Add more location details if available: robot.location?.x, robot.location?.y */}
                        </Grid>

                        {/* Add more sections as needed (e.g., Sensors, Mission History) */}

                    </Grid>
                </CardContent>
                {/* Add CardActions here if needed for buttons like Edit, Delete, Start/Stop Mission */}
            </Card>
        </Box>
    );
};

export default RobotDetailPage;