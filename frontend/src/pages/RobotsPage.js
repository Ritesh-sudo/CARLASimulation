import React, { useEffect, useState, useMemo } from 'react'; // Removed useDispatch, useSelector; Added useMemo
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
    Divider,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    // FilterList as FilterIcon, // Removed if not used
    SmartToy as RobotIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
// Removed Redux imports for robotsSlice
// import { openModal } from '../redux/slices/uiSlice'; // Keep if needed for modals

// Define API URL directly or get from config/env
const API_BASE_URL = 'http://localhost:8000';
const ROBOTS_ENDPOINT = `${API_BASE_URL}/robot/get_robots`;

// Robot status colors (keep as is)
const statusColors = {
    online: 'success',
    offline: 'error',
    maintenance: 'warning',
    mission_active: 'info',
    idle: 'default',
    charging: 'secondary',
};

const RobotsPage = () => {
    // Removed Redux dispatch
    const navigate = useNavigate();

    // --- Local State Management ---
    const [robots, setRobots] = useState([]); // Local state for robots list
    const [isLoading, setIsLoading] = useState(false); // Local loading state
    const [error, setError] = useState(null); // Local error state
    // --- End Local State ---

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    // const [isCreateFormOpen, setIsCreateFormOpen] = useState(false); // Keep if using local modal state
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

    // --- Direct Fetch Function (adapted from test.js) ---
    const fetchRobotsData = async () => {
        console.log(`Attempting to fetch data from: ${ROBOTS_ENDPOINT}`);
        setIsLoading(true); // Set loading true
        setError(null); // Clear previous errors
        setFeedback({ open: false, message: '', severity: 'info' }); // Clear feedback

        try {
            // Use native fetch or import 'node-fetch' if in Node.js environment outside browser
            const response = await fetch(ROBOTS_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                let errorDetail = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail += ` - ${errorData.detail || JSON.stringify(errorData)}`;
                } catch (jsonError) {
                    errorDetail += ` - ${response.statusText}`;
                }
                throw new Error(errorDetail);
            }

            const fetchedRobots = await response.json();

            // Ensure fetched data is an array
            if (Array.isArray(fetchedRobots)) {
                setRobots(fetchedRobots); // Update local state
                console.log(`Successfully fetched ${fetchedRobots.length} robots.`);
            } else {
                console.error("Fetched data is not an array:", fetchedRobots);
                setRobots([]); // Set to empty array if data is invalid
                throw new Error("Received invalid data format from server.");
            }

        } catch (fetchError) {
            console.error('\nError fetching robots data:', fetchError.message);
            setError(fetchError.message); // Update local error state
            setRobots([]); // Clear robots on error
            setFeedback({ open: true, message: `Error: ${fetchError.message}`, severity: 'error' });
        } finally {
            setIsLoading(false); // Set loading false regardless of outcome
        }
    };
    // --- End Fetch Function ---

    useEffect(() => {
        // Fetch robots when the component mounts
        fetchRobotsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means run once on mount

    const handleRefresh = () => {
        fetchRobotsData(); // Call the direct fetch function
        setFeedback({ open: true, message: 'Refreshing robot list...', severity: 'info' });
    };

    // --- Keep your existing handlers (adjust if they used Redux dispatch) ---
    const handleStartMission = (robotId) => {
        // If using Redux modal:
        // dispatch(openModal({ modalType: 'START_MISSION', modalData: { robotId } }));
        console.log(`Start mission for robot ${robotId}`);
        // Add direct API call logic here if needed
    };

    const handleStopMission = (robotId) => {
        console.log(`Stop mission for robot ${robotId}`);
        // Add direct API call logic here if needed
    };

    const handleAddNewRobot = () => {
        // If using Redux modal:
        // dispatch(openModal({ modalType: 'ADD_ROBOT' }));
        // Or handle local modal state:
        // setIsCreateFormOpen(true);
        console.log("Add new robot clicked"); // Placeholder
    };

    // Handler for successful robot creation (if using a form component)
    const handleCreateSuccess = (newRobot) => {
        fetchRobotsData(); // Refresh list after adding
        setFeedback({ open: true, message: `Robot ${newRobot.model || newRobot.robot_id} created!`, severity: 'success' });
        // setIsCreateFormOpen(false); // Close the form if using local state
    };

    // Close handler for Snackbar
    const handleCloseFeedback = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setFeedback({ ...feedback, open: false });
    };

    // --- Refined Filtering Logic (uses local 'robots' state) ---
    const filteredRobots = useMemo(() => { // Changed React.useMemo to useMemo
        if (!Array.isArray(robots)) {
            return [];
        }
        return robots.filter((robot) => {
            if (!robot) return false;
            const robotIdStr = robot.robot_id ? String(robot.robot_id) : '';
            const robotModelStr = robot.model ? String(robot.model) : '';
            const robotNameStr = robot.name ? String(robot.name) : '';
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch =
                robotIdStr.includes(searchTerm) ||
                robotModelStr.toLowerCase().includes(searchTermLower) ||
                robotNameStr.toLowerCase().includes(searchTermLower);
            const matchesStatus = statusFilter === 'all' || robot.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [robots, searchTerm, statusFilter]);


    return (
        <Box>
            {/* Header and Add Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Robots
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNewRobot}
                >
                    Add Robot
                </Button>
            </Box>

            {/* Search and Filters Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search by ID, Model, Name..."
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
                                    <MenuItem value="online">Online</MenuItem>
                                    <MenuItem value="offline">Offline</MenuItem>
                                    <MenuItem value="maintenance">Maintenance</MenuItem>
                                    <MenuItem value="mission_active">Mission Active</MenuItem>
                                    <MenuItem value="idle">Idle</MenuItem>
                                    <MenuItem value="charging">Charging</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={handleRefresh}
                                disabled={isLoading} // Use local isLoading state
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Loading Indicator (uses local isLoading state) */}
            {isLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Error Display (uses local error state) */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error loading robots: {typeof error === 'string' ? error : JSON.stringify(error)}
                </Alert>
            )}

            {/* Robots List Grid (uses local isLoading, error, and filteredRobots) */}
            {!isLoading && !error && (
                <Grid container spacing={3}>
                    {filteredRobots.map((robot) => (
                        <Grid item xs={12} md={6} lg={4} key={robot.robot_id || robot.id}>
                            <Card>
                                <CardContent>
                                    {/* Card Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <RobotIcon color="primary" sx={{ fontSize: 30, mr: 1 }} />
                                            <Typography variant="h6" component="div">
                                                {robot.name || robot.model || `Robot ${robot.robot_id}`}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            color={statusColors[robot.status] || 'default'}
                                            label={robot.status?.replace('_', ' ') || 'Unknown'}
                                        />
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    {/* Card Body */}
                                    <Box sx={{ mb: 2 }}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">ID</Typography><Typography variant="body1">{robot.robot_id || 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Model</Typography><Typography variant="body1">{robot.model || 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Version</Typography><Typography variant="body1">{robot.version || 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Org ID</Typography><Typography variant="body1">{robot.org_id || 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Location</Typography><Typography variant="body1">{robot.location?.zone || 'Unknown'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Battery</Typography><Typography variant="body1">{robot.battery != null ? `${robot.battery}%` : 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Created</Typography><Typography variant="body1" sx={{ fontSize: '0.8rem' }}>{robot.created_at ? new Date(robot.created_at).toLocaleString() : 'N/A'}</Typography></Grid>
                                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Active</Typography><Typography variant="body1">{robot.is_active ? 'Yes' : 'No'}</Typography></Grid>
                                        </Grid>
                                    </Box>
                                    {/* Card Actions */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                        <Box>
                                            {robot.status !== 'mission_active' ? (
                                                <Tooltip title="Start Mission">
                                                    <span>
                                                        <Button size="small" startIcon={<StartIcon />} onClick={() => handleStartMission(robot.robot_id)} disabled={robot.status === 'offline' || robot.status === 'maintenance'}>Start</Button>
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Stop Mission">
                                                    <Button size="small" color="error" startIcon={<StopIcon />} onClick={() => handleStopMission(robot.robot_id)}>Stop</Button>
                                                </Tooltip>
                                            )}
                                        </Box>
                                        <Button size="small" onClick={() => navigate(`/robots/${robot.robot_id}`)}>View Details</Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {/* No Robots Found Message */}
                    {!isLoading && filteredRobots.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="text.secondary">No robots found</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {robots.length > 0 ? 'Try adjusting your search or filter criteria.' : 'There are no robots in the system yet. Add a new robot to get started.'}
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Snackbar for feedback */}
            <Snackbar
                open={feedback.open}
                autoHideDuration={4000}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>

            {/* Render the Create Robot Form/Modal if using local state */}
            {/* ... */}
        </Box>
    );
};

export default RobotsPage;