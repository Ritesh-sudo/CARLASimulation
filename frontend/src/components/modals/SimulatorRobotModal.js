import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    Box,
    Button,
    Typography,
    Grid,
    Tabs,
    Tab,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { updateRobotInSimulation } from '../../redux/slices/simulatorSlice';
import { closeModal } from '../../redux/slices/uiSlice';

const SimulatorRobotModal = ({ robot }) => {
    const dispatch = useDispatch();
    const [tabValue, setTabValue] = useState(0);
    const [speed, setSpeed] = useState(robot?.parameters?.speed || 30);
    const [behaviorMode, setBehaviorMode] = useState(robot?.parameters?.behavior || 'Normal');

    if (!robot) {
        return (
            <Box>
                <Typography>No robot data available</Typography>
                <Button variant="contained" onClick={() => dispatch(closeModal())}>
                    Close
                </Button>
            </Box>
        );
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSpeedChange = (event, newValue) => {
        setSpeed(newValue);
    };

    const handleBehaviorChange = (event) => {
        setBehaviorMode(event.target.value);
    };

    const handleApplyChanges = () => {
        dispatch(updateRobotInSimulation({
            robotId: robot.robotId,
            updates: {
                parameters: {
                    ...robot.parameters,
                    speed,
                    behavior: behaviorMode
                }
            }
        }));
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 800, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Robot {robot.name} - {robot.type}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="robot simulator tabs">
                    <Tab label="Status" />
                    <Tab label="Parameters" />
                    <Tab label="Sensors" />
                </Tabs>
            </Box>

            {/* Status Panel */}
            {tabValue === 0 && (
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Basic Information
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>{robot.robotId}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Type</TableCell>
                                            <TableCell>{robot.type}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell>{robot.status}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Position</TableCell>
                                            <TableCell>
                                                X: {robot.position?.x.toFixed(2)},
                                                Y: {robot.position?.y.toFixed(2)},
                                                Z: {robot.position?.z.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Health Status
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Battery Level
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={robot.health?.batteryLevel || 0}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: '#f5f5f5',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: robot.health?.batteryLevel > 20 ? '#4caf50' : '#f44336',
                                        }
                                    }}
                                />
                                <Typography variant="body2" align="right">
                                    {robot.health?.batteryLevel || 0}%
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    CPU Usage
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={robot.health?.cpuUsage || 0}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Typography variant="body2" align="right">
                                    {robot.health?.cpuUsage || 0}%
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" gutterBottom>
                                    Memory Usage
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={robot.health?.memoryUsage || 0}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                                <Typography variant="body2" align="right">
                                    {robot.health?.memoryUsage || 0}%
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Parameters Panel */}
            {tabValue === 1 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Robot Parameters
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="body2" gutterBottom>
                                Speed
                            </Typography>
                            <Box sx={{ px: 2 }}>
                                <Slider
                                    value={speed}
                                    onChange={handleSpeedChange}
                                    aria-label="Robot Speed"
                                    valueLabelDisplay="auto"
                                    step={5}
                                    marks
                                    min={0}
                                    max={100}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Behavior Mode</InputLabel>
                                <Select
                                    value={behaviorMode}
                                    onChange={handleBehaviorChange}
                                    label="Behavior Mode"
                                >
                                    <MenuItem value="Normal">Normal</MenuItem>
                                    <MenuItem value="Aggressive">Aggressive</MenuItem>
                                    <MenuItem value="Cautious">Cautious</MenuItem>
                                    <MenuItem value="Stealth">Stealth</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={handleApplyChanges}
                                fullWidth
                            >
                                Apply Changes
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Sensors Panel */}
            {tabValue === 2 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Sensor Readings
                    </Typography>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sensor</TableCell>
                                    <TableCell>Value</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>LIDAR</TableCell>
                                    <TableCell>{robot.sensors?.lidar?.range || 'N/A'} m</TableCell>
                                    <TableCell>{robot.sensors?.lidar?.status || 'Unknown'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Camera</TableCell>
                                    <TableCell>{robot.sensors?.camera?.resolution || 'N/A'}</TableCell>
                                    <TableCell>{robot.sensors?.camera?.status || 'Unknown'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>GPS</TableCell>
                                    <TableCell>{robot.sensors?.gps?.accuracy || 'N/A'} m</TableCell>
                                    <TableCell>{robot.sensors?.gps?.status || 'Unknown'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>IMU</TableCell>
                                    <TableCell>{robot.sensors?.imu?.orientation || 'N/A'}</TableCell>
                                    <TableCell>{robot.sensors?.imu?.status || 'Unknown'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Ultrasonic</TableCell>
                                    <TableCell>{robot.sensors?.ultrasonic?.range || 'N/A'} cm</TableCell>
                                    <TableCell>{robot.sensors?.ultrasonic?.status || 'Unknown'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="error" onClick={() => dispatch(closeModal())}>
                    Close
                </Button>
            </Box>
        </Box>
    );
};

export default SimulatorRobotModal; 