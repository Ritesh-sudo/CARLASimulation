import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Grid, Typography, Card, CardContent, Button, CircularProgress,
    FormControl, InputLabel, MenuItem, Select, Divider, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Tabs, Tab, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, Slider
} from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudIcon from '@mui/icons-material/Cloud';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import AddIcon from '@mui/icons-material/Add';

import {
    connectSimulator,
    disconnectSimulator,
    getSimulatorStatus,
    loadScenario,
    fetchAvailableScenarios,
    setEnvironment,
    spawnRobot,
    fetchSimulatorMetrics,
    removeRobotFromSimulation
} from '../redux/slices/simulatorSlice';
import { openModal } from '../redux/slices/uiSlice';
import mongodbService from '../services/mongodbService';

const SimulatorPage = () => {
    const dispatch = useDispatch();
    const {
        isConnected,
        connectionDetails,
        status,
        activeScenario,
        availableScenarios,
        robotsInSimulation,
        environment,
        metrics,
        isLoading,
        error
    } = useSelector(state => state.simulator);

    const [tabValue, setTabValue] = useState(0);
    const [selectedScenario, setSelectedScenario] = useState('');
    const [weatherSetting, setWeatherSetting] = useState(environment?.weather || 'Clear');
    const [timeSetting, setTimeSetting] = useState(environment?.timeOfDay || 'Day');
    const [robotName, setRobotName] = useState('');
    const [robotType, setRobotType] = useState('Patrol');
    const [openConnectionDialog, setOpenConnectionDialog] = useState(false);
    const [simulatorAddress, setSimulatorAddress] = useState('localhost');
    const [simulatorPort, setSimulatorPort] = useState('2000');
    const [environmentDialogOpen, setEnvironmentDialogOpen] = useState(false);
    const [dbData, setDbData] = useState([]);
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    const [dbError, setDbError] = useState(null);
    const [chartData, setChartData] = useState([]);

    // Refresh data on component mount
    useEffect(() => {
        if (isConnected) {
            dispatch(getSimulatorStatus());
            dispatch(fetchAvailableScenarios());
            dispatch(fetchSimulatorMetrics());
        }
    }, [dispatch, isConnected]);

    // Set up interval to refresh metrics
    useEffect(() => {
        let intervalId;
        if (isConnected) {
            intervalId = setInterval(() => {
                dispatch(fetchSimulatorMetrics());
                dispatch(getSimulatorStatus());
            }, 5000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [dispatch, isConnected]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleConnect = () => {
        const config = {
            address: simulatorAddress,
            port: parseInt(simulatorPort)
        };
        dispatch(connectSimulator(config));
        setOpenConnectionDialog(false);
    };

    const handleDisconnect = () => {
        if (connectionDetails) {
            dispatch(disconnectSimulator(connectionDetails.connectionId));
        }
    };

    const handleRefresh = () => {
        dispatch(getSimulatorStatus());
        dispatch(fetchAvailableScenarios());
        dispatch(fetchSimulatorMetrics());
    };

    const handleLoadScenario = () => {
        if (selectedScenario) {
            dispatch(loadScenario({ scenarioId: selectedScenario }));
        }
    };

    const handleEnvironmentChange = () => {
        dispatch(setEnvironment({
            weather: weatherSetting,
            timeOfDay: timeSetting
        }));
        setEnvironmentDialogOpen(false);
    };

    const handleRobotSpawn = () => {
        if (robotName && robotType) {
            dispatch(spawnRobot({
                name: robotName,
                type: robotType,
                position: { x: 0, y: 0, z: 0 }
            }));
            setRobotName('');
        }
    };

    const handleRemoveRobot = (robotId) => {
        dispatch(removeRobotFromSimulation(robotId));
    };

    const handleViewRobotDetails = (robot) => {
        dispatch(openModal({
            modalType: 'SIMULATOR_ROBOT',
            modalData: { robot }
        }));
    };

    const processDataForCharts = (data) => {
        return data.map(item => ({
            timestamp: new Date(item.script_timestamp * 1000).toLocaleTimeString(),
            speed: item.speed_kmh || 0,
            x: item.location?.x || 0,
            y: item.location?.y || 0,
            z: item.location?.z || 0,
            throttle: item.control?.throttle || 0,
            steer: item.control?.steer || 0,
            brake: item.control?.brake || 0,
            pitch: item.rotation?.pitch || 0,
            yaw: item.rotation?.yaw || 0,
            roll: item.rotation?.roll || 0
        }));
    };

    const fetchDatabaseData = async () => {
        setIsLoadingDb(true);
        setDbError(null);
        try {
            const response = await fetch('http://localhost:3001/api/security-bot-data');
            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data received:', data);

            if (!data || data.length === 0) {
                throw new Error('No data available');
            }

            setDbData(data);
            setChartData(processDataForCharts(data));
        } catch (error) {
            console.error('Error fetching data:', error);
            setDbError(error.message);
        } finally {
            setIsLoadingDb(false);
        }
    };

    const renderConnectionStatus = () => (
        <Card sx={{ mb: 2, backgroundColor: isConnected ? '#e8f5e9' : '#ffebee' }}>
            <CardContent>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h6">
                            Simulator Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
                        </Typography>
                        {isConnected && connectionDetails && (
                            <Typography variant="body2">
                                Connected to {connectionDetails.address}:{connectionDetails.port}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item>
                        {isConnected ? (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDisconnect}
                                disabled={isLoading}
                            >
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setOpenConnectionDialog(true)}
                                disabled={isLoading}
                            >
                                Connect
                            </Button>
                        )}
                        <IconButton onClick={handleRefresh} disabled={!isConnected || isLoading}>
                            <RefreshIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    const renderScenarioPanel = () => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Scenarios
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth disabled={!isConnected || isLoading}>
                            <InputLabel>Select Scenario</InputLabel>
                            <Select
                                value={selectedScenario}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                label="Select Scenario"
                            >
                                {availableScenarios.map((scenario) => (
                                    <MenuItem key={scenario.id} value={scenario.id}>
                                        {scenario.name} - {scenario.difficulty}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleLoadScenario}
                            disabled={!isConnected || !selectedScenario || isLoading}
                            fullWidth
                        >
                            Load Scenario
                        </Button>
                    </Grid>
                </Grid>

                {activeScenario && (
                    <Box mt={2}>
                        <Typography variant="subtitle1">
                            Active Scenario: {activeScenario.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {activeScenario.description}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );

    const renderEnvironmentPanel = () => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h6">
                            Environment Settings
                        </Typography>
                        <Typography variant="body2">
                            Weather: {environment.weather}, Time: {environment.timeOfDay}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={() => setEnvironmentDialogOpen(true)}
                            disabled={!isConnected || isLoading}
                        >
                            Configure
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    const renderRobotControls = () => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Robot Controls
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            label="Robot Name"
                            value={robotName}
                            onChange={(e) => setRobotName(e.target.value)}
                            disabled={!isConnected || isLoading}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth disabled={!isConnected || isLoading}>
                            <InputLabel>Robot Type</InputLabel>
                            <Select
                                value={robotType}
                                onChange={(e) => setRobotType(e.target.value)}
                                label="Robot Type"
                            >
                                <MenuItem value="Patrol">Patrol</MenuItem>
                                <MenuItem value="Security">Security</MenuItem>
                                <MenuItem value="Surveillance">Surveillance</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleRobotSpawn}
                            disabled={!isConnected || !robotName || isLoading || !activeScenario}
                            fullWidth
                        >
                            Spawn Robot
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    const renderRobotsInSimulation = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Robots in Simulation
                </Typography>
                {robotsInSimulation.length === 0 ? (
                    <Typography color="textSecondary">
                        No robots deployed in the simulation.
                    </Typography>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {robotsInSimulation.map((robot) => (
                                    <TableRow
                                        key={robot.robotId}
                                        hover
                                        onClick={() => handleViewRobotDetails(robot)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>{robot.robotId}</TableCell>
                                        <TableCell>{robot.name}</TableCell>
                                        <TableCell>{robot.type}</TableCell>
                                        <TableCell>{robot.status}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveRobot(robot.robotId);
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewRobotDetails(robot);
                                                }}
                                            >
                                                <SpeedIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );

    const renderMetricsPanel = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Simulator Metrics
                </Typography>
                {metrics ? (
                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2">CPU Usage</Typography>
                            <Typography variant="h5">{metrics.cpuUsage}%</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2">GPU Usage</Typography>
                            <Typography variant="h5">{metrics.gpuUsage}%</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2">Memory Usage</Typography>
                            <Typography variant="h5">{metrics.memoryUsage} MB</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="subtitle2">FPS</Typography>
                            <Typography variant="h5">{metrics.fps}</Typography>
                        </Grid>
                    </Grid>
                ) : (
                    <Typography color="textSecondary">
                        No metrics available.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    const renderSpeedChart = () => (
        <Grid item xs={12}>
            <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Speed (km/h)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            label={{ value: 'Time', position: 'bottom' }}
                        />
                        <YAxis
                            label={{
                                value: 'Speed (km/h)',
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="speed"
                            stroke="#2196f3"
                            name="Speed"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Grid>
    );

    const renderLocationChart = () => (
        <Grid item xs={12}>
            <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Location (X, Y, Z)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            label={{ value: 'Time', position: 'bottom' }}
                        />
                        <YAxis
                            label={{
                                value: 'Position',
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="x" stroke="#8884d8" name="X Position" dot={false} />
                        <Line type="monotone" dataKey="y" stroke="#82ca9d" name="Y Position" dot={false} />
                        <Line type="monotone" dataKey="z" stroke="#ffc658" name="Z Position" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Grid>
    );

    const renderRotationChart = () => (
        <Grid item xs={12}>
            <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Rotation (Pitch, Yaw, Roll)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            label={{ value: 'Time', position: 'bottom' }}
                        />
                        <YAxis
                            label={{
                                value: 'Degrees',
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pitch" stroke="#8884d8" name="Pitch" dot={false} />
                        <Line type="monotone" dataKey="yaw" stroke="#82ca9d" name="Yaw" dot={false} />
                        <Line type="monotone" dataKey="roll" stroke="#ffc658" name="Roll" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Grid>
    );

    const renderControlsChart = () => (
        <Grid item xs={12}>
            <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Controls (Throttle, Steer, Brake)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            label={{ value: 'Time', position: 'bottom' }}
                        />
                        <YAxis
                            label={{
                                value: 'Value',
                                angle: -90,
                                position: 'insideLeft'
                            }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="throttle" stroke="#8884d8" name="Throttle" dot={false} />
                        <Line type="monotone" dataKey="steer" stroke="#82ca9d" name="Steer" dot={false} />
                        <Line type="monotone" dataKey="brake" stroke="#ffc658" name="Brake" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Grid>
    );

    const renderCharts = () => (
        <Box sx={{ mt: 2 }}>
            {chartData.length > 0 && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Performance Metrics
                    </Typography>
                    <Grid container>
                        {renderSpeedChart()}
                        {renderLocationChart()}
                        {renderRotationChart()}
                        {renderControlsChart()}
                    </Grid>
                </>
            )}
        </Box>
    );

    // Main content for simulator controls tab
    const controlsContent = (
        <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
                {renderScenarioPanel()}
                {renderEnvironmentPanel()}
                {renderRobotControls()}
            </Grid>
            <Grid item xs={12} md={5}>
                {renderRobotsInSimulation()}
            </Grid>
        </Grid>
    );

    // Main content for metrics tab
    const metricsContent = (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                {renderMetricsPanel()}
            </Grid>
        </Grid>
    );

    // Modify the existing renderDatabasePanel to include charts
    const renderDatabasePanel = () => (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Database Content
            </Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={fetchDatabaseData}
                disabled={isLoadingDb}
                startIcon={isLoadingDb ? <CircularProgress size={20} /> : null}
                sx={{ mb: 2 }}
            >
                Load Database Data
            </Button>

            {dbError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {dbError}
                </Alert>
            )}

            {isLoadingDb && (
                <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress />
                </Box>
            )}

            {dbData.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Total Records: {dbData.length}
                    </Typography>

                    {renderCharts()}
                </Box>
            )}
        </Box>
    );

    // Connection Dialog
    const connectionDialog = (
        <Dialog open={openConnectionDialog} onClose={() => setOpenConnectionDialog(false)}>
            <DialogTitle>Connect to Simulator</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Simulator Address"
                            value={simulatorAddress}
                            onChange={(e) => setSimulatorAddress(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Port"
                            value={simulatorPort}
                            onChange={(e) => setSimulatorPort(e.target.value)}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenConnectionDialog(false)}>Cancel</Button>
                <Button onClick={handleConnect} color="primary" variant="contained">
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Environment Configuration Dialog
    const environmentDialog = (
        <Dialog open={environmentDialogOpen} onClose={() => setEnvironmentDialogOpen(false)}>
            <DialogTitle>Configure Environment</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Typography gutterBottom>Weather</Typography>
                        <FormControl fullWidth>
                            <Select
                                value={weatherSetting}
                                onChange={(e) => setWeatherSetting(e.target.value)}
                            >
                                <MenuItem value="Clear">Clear</MenuItem>
                                <MenuItem value="Cloudy">Cloudy</MenuItem>
                                <MenuItem value="Rain">Rain</MenuItem>
                                <MenuItem value="Storm">Storm</MenuItem>
                                <MenuItem value="Fog">Fog</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography gutterBottom>Time of Day</Typography>
                        <FormControl fullWidth>
                            <Select
                                value={timeSetting}
                                onChange={(e) => setTimeSetting(e.target.value)}
                            >
                                <MenuItem value="Day">Day</MenuItem>
                                <MenuItem value="Night">Night</MenuItem>
                                <MenuItem value="Sunset">Sunset</MenuItem>
                                <MenuItem value="Dawn">Dawn</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEnvironmentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEnvironmentChange} color="primary" variant="contained">
                    Apply Changes
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderSimulationTab = () => (
        <Box sx={{ width: '100%', height: 'calc(100vh - 250px)', mt: 2 }}>
            <iframe
                src="http://localhost:6080/vnc.html?autoconnect=true&resize=remote&view_only=0"
                style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5'
                }}
                allow="fullscreen; clipboard-read; clipboard-write"
                title="CARLA Simulator"
            />
        </Box>
    );

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <Box sx={{ p: 3, width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
                <Typography variant="h4" gutterBottom>
                    Carla Simulator Control
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {isLoading && (
                    <Box display="flex" justifyContent="center" mb={2}>
                        <CircularProgress />
                    </Box>
                )}

                {renderConnectionStatus()}

                {isConnected && (
                    <>
                        <Box sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            mb: 2,
                            width: '100%'
                        }}>
                            <Tabs value={tabValue} onChange={handleTabChange}>
                                <Tab label="Simulation" />
                                <Tab label="Simulator Control" />
                                <Tab label="Charts" />
                            </Tabs>
                        </Box>

                        <Box sx={{ width: '100%' }}>
                            {tabValue === 0 && renderSimulationTab()}
                            {tabValue === 1 && controlsContent}
                            {tabValue === 2 && renderDatabasePanel()}
                        </Box>
                    </>
                )}

                {connectionDialog}
                {environmentDialog}
            </Box>
        </Box>
    );
};

export default SimulatorPage; 