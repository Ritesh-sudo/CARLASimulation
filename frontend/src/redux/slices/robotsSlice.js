import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the base URL for your FastAPI backend
// You might want to move this to a config file or .env variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Assuming FastAPI runs on 8000

// Async thunk for fetching robots
export const fetchRobots = createAsyncThunk(
    'robots/fetchRobots',
    async (_, { rejectWithValue }) => {
        try {
            // Use the correct endpoint path relative to the base URL
            const response = await axios.get(`${API_BASE_URL}/robot/get_robots`);
            console.log("Fetched Robots Data:", response.data); // Add logging
            return response.data; // The backend returns a list of robots
        } catch (error) {
            console.error("Error fetching robots:", error.response?.data || error.message); // Log error details
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch robots');
        }
    }
);

// --- NEW: Thunk to fetch details for a single robot ---
export const fetchRobotDetails = createAsyncThunk(
    'robots/fetchRobotDetails',
    async (robotId, { rejectWithValue }) => {
        if (!robotId) {
            return rejectWithValue('Robot ID is required');
        }
        try {
            // Change the endpoint path if needed (e.g., /robot/get_robot/)
            const response = await axios.get(`${API_BASE_URL}/robot/get_robot/${robotId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching details for robot ${robotId}:`, error.response?.data || error.message);
            return rejectWithValue(
                error.response?.data?.detail ||
                `Failed to fetch details for robot ${robotId}`
            );
        }
    }
);

// --- Example Thunks for Start/Stop (if you implement them) ---
export const startRobotMission = createAsyncThunk(
    'robots/startMission',
    async (robotId, { rejectWithValue }) => {
        try {
            // Use axios directly
            const response = await axios.post(`${API_BASE_URL}/robot/${robotId}/start_mission`);
            return response.data; // Or handle response as needed
        } catch (error) {
            console.error(`Error starting mission for robot ${robotId}:`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.detail || 'Failed to start mission');
        }
    }
);

export const stopRobotMission = createAsyncThunk(
    'robots/stopMission',
    async (robotId, { rejectWithValue }) => {
        try {
            // Use axios directly
            const response = await axios.post(`${API_BASE_URL}/robot/${robotId}/stop_mission`);
            return response.data; // Or handle response as needed
        } catch (error) {
            console.error(`Error stopping mission for robot ${robotId}:`, error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.detail || 'Failed to stop mission');
        }
    }
);
// --- End Example Thunks ---

const initialState = {
    robots: [],
    selectedRobot: null,
    isLoading: false,
    isLoadingDetails: false, // Loading state for details
    error: null,
    errorDetails: null, // Error for details
    videoStreams: {},
    sensorData: {},
};

const robotsSlice = createSlice({
    name: 'robots',
    initialState,
    reducers: {
        selectRobot: (state, action) => {
            state.selectedRobot = action.payload;
        },
        updateRobotLocation: (state, action) => {
            const { robotId, location } = action.payload;
            const robot = state.robots.find(r => r.id === robotId);
            if (robot) {
                robot.location = location;
            }
        },
        updateRobotStatus: (state, action) => {
            const { robotId, status } = action.payload;
            const robot = state.robots.find(r => r.id === robotId);
            if (robot) {
                robot.status = status;
            }
        },
        updateVideoStream: (state, action) => {
            const { robotId, streamUrl } = action.payload;
            state.videoStreams[robotId] = streamUrl;
        },
        updateSensorData: (state, action) => {
            const { robotId, data } = action.payload;
            state.sensorData[robotId] = {
                ...state.sensorData[robotId],
                ...data,
                timestamp: new Date().toISOString(),
            };
        },
        clearRobotError: (state) => {
            state.error = null;
        },
        // Optional: Clear selected robot when leaving detail page
        clearSelectedRobot: (state) => {
            state.selectedRobot = null;
            state.errorDetails = null;
        },
        // Optional: Clear list error
        clearRobotsError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRobots.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchRobots.fulfilled, (state, action) => {
                state.isLoading = false;
                // Ensure the payload is an array, default to empty array if not
                state.robots = Array.isArray(action.payload) ? action.payload : [];
                state.error = null;
            })
            .addCase(fetchRobots.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.robots = []; // Clear robots on error
            })
            .addCase(fetchRobotDetails.pending, (state) => {
                state.isLoadingDetails = true;
                state.errorDetails = null;
                state.selectedRobot = null; // Clear previous details while loading
            })
            .addCase(fetchRobotDetails.fulfilled, (state, action) => {
                state.isLoadingDetails = false;
                state.selectedRobot = action.payload; // Store fetched details
            })
            .addCase(fetchRobotDetails.rejected, (state, action) => {
                state.isLoadingDetails = false;
                state.errorDetails = action.payload;
                state.selectedRobot = null;
            })
            .addCase(startRobotMission.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(startRobotMission.fulfilled, (state, action) => {
                state.isLoading = false;
                const { robotId } = action.meta.arg;
                const robot = state.robots.find(r => r.id === robotId);
                if (robot) {
                    robot.status = 'mission_active';
                    robot.currentMission = action.payload.missionId;
                }
            })
            .addCase(startRobotMission.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(stopRobotMission.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(stopRobotMission.fulfilled, (state, action) => {
                state.isLoading = false;
                const { robotId } = action.payload;
                const robot = state.robots.find(r => r.id === robotId);
                if (robot) {
                    robot.status = 'idle';
                    robot.currentMission = null;
                }
            })
            .addCase(stopRobotMission.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    selectRobot,
    updateRobotLocation,
    updateRobotStatus,
    updateVideoStream,
    updateSensorData,
    clearRobotError,
    clearSelectedRobot,
    clearRobotsError,
} = robotsSlice.actions;

export default robotsSlice.reducer;

// Define selectors (optional but good practice)
export const selectAllRobots = (state) => state.robots.robots;
export const selectRobotsLoading = (state) => state.robots.isLoading;
export const selectRobotsError = (state) => state.robots.error;
// --- NEW Selectors ---
export const selectSelectedRobot = (state) => state.robots.selectedRobot;
export const selectRobotDetailsLoading = (state) => state.robots.isLoadingDetails;
export const selectRobotDetailsError = (state) => state.robots.errorDetails;