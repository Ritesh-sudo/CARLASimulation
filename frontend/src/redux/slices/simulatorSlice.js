import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import simulatorService from '../../services/simulatorService';

export const connectSimulator = createAsyncThunk(
    'simulator/connect',
    async (config, { rejectWithValue }) => {
        try {
            const response = await simulatorService.connectToSimulator(config);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to connect to simulator');
        }
    }
);

export const disconnectSimulator = createAsyncThunk(
    'simulator/disconnect',
    async (connectionId, { rejectWithValue }) => {
        try {
            const response = await simulatorService.disconnectFromSimulator(connectionId);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to disconnect from simulator');
        }
    }
);

export const getSimulatorStatus = createAsyncThunk(
    'simulator/status',
    async (_, { rejectWithValue }) => {
        try {
            const response = await simulatorService.getSimulatorStatus();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get simulator status');
        }
    }
);

export const loadScenario = createAsyncThunk(
    'simulator/loadScenario',
    async (scenarioConfig, { rejectWithValue }) => {
        try {
            const response = await simulatorService.loadScenario(scenarioConfig);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load scenario');
        }
    }
);

export const fetchAvailableScenarios = createAsyncThunk(
    'simulator/fetchScenarios',
    async (_, { rejectWithValue }) => {
        try {
            const response = await simulatorService.getAvailableScenarios();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch available scenarios');
        }
    }
);

export const setEnvironment = createAsyncThunk(
    'simulator/setEnvironment',
    async (settings, { rejectWithValue }) => {
        try {
            const response = await simulatorService.setEnvironment(settings);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to set environment settings');
        }
    }
);

export const spawnRobot = createAsyncThunk(
    'simulator/spawnRobot',
    async (robotConfig, { rejectWithValue }) => {
        try {
            const response = await simulatorService.spawnRobot(robotConfig);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to spawn robot');
        }
    }
);

export const fetchSimulatorMetrics = createAsyncThunk(
    'simulator/fetchMetrics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await simulatorService.getSimulatorMetrics();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch simulator metrics');
        }
    }
);

const initialState = {
    isConnected: false,
    connectionDetails: null,
    status: null,
    activeScenario: null,
    availableScenarios: [],
    robotsInSimulation: [],
    environment: {
        weather: 'Clear',
        timeOfDay: 'Day'
    },
    metrics: null,
    isLoading: false,
    error: null,
};

const simulatorSlice = createSlice({
    name: 'simulator',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        updateRobotInSimulation: (state, action) => {
            const { robotId, updates } = action.payload;
            const index = state.robotsInSimulation.findIndex(r => r.robotId === robotId);
            if (index !== -1) {
                state.robotsInSimulation[index] = {
                    ...state.robotsInSimulation[index],
                    ...updates
                };
            }
        },
        removeRobotFromSimulation: (state, action) => {
            state.robotsInSimulation = state.robotsInSimulation.filter(
                robot => robot.robotId !== action.payload
            );
        }
    },
    extraReducers: (builder) => {
        builder
            // Connect simulator
            .addCase(connectSimulator.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(connectSimulator.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isConnected = true;
                state.connectionDetails = action.payload;
            })
            .addCase(connectSimulator.rejected, (state, action) => {
                state.isLoading = false;
                state.isConnected = false;
                state.error = action.payload;
            })

            // Disconnect simulator
            .addCase(disconnectSimulator.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(disconnectSimulator.fulfilled, (state) => {
                state.isLoading = false;
                state.isConnected = false;
                state.connectionDetails = null;
                state.status = null;
                state.activeScenario = null;
                state.robotsInSimulation = [];
                state.metrics = null;
            })
            .addCase(disconnectSimulator.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get simulator status
            .addCase(getSimulatorStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getSimulatorStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.status = action.payload;
                state.isConnected = action.payload.isConnected;
            })
            .addCase(getSimulatorStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Load scenario
            .addCase(loadScenario.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadScenario.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activeScenario = action.payload;
            })
            .addCase(loadScenario.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch available scenarios
            .addCase(fetchAvailableScenarios.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAvailableScenarios.fulfilled, (state, action) => {
                state.isLoading = false;
                state.availableScenarios = action.payload;
            })
            .addCase(fetchAvailableScenarios.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Set environment
            .addCase(setEnvironment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(setEnvironment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.environment = {
                    weather: action.payload.weather,
                    timeOfDay: action.payload.timeOfDay
                };
            })
            .addCase(setEnvironment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Spawn robot
            .addCase(spawnRobot.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(spawnRobot.fulfilled, (state, action) => {
                state.isLoading = false;
                state.robotsInSimulation.push(action.payload);
            })
            .addCase(spawnRobot.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch simulator metrics
            .addCase(fetchSimulatorMetrics.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSimulatorMetrics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.metrics = action.payload;
            })
            .addCase(fetchSimulatorMetrics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, updateRobotInSimulation, removeRobotFromSimulation } = simulatorSlice.actions;
export default simulatorSlice.reducer; 