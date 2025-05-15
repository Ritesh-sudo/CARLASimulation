import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import alertService from '../../services/alertService';

export const fetchAlerts = createAsyncThunk(
    'alerts/fetchAlerts',
    async (filters, { rejectWithValue }) => {
        try {
            const response = await alertService.getAlerts(filters);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
        }
    }
);

export const createAlert = createAsyncThunk(
    'alerts/createAlert',
    async (alertData, { rejectWithValue }) => {
        try {
            const response = await alertService.createAlert(alertData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create alert');
        }
    }
);

export const updateAlert = createAsyncThunk(
    'alerts/updateAlert',
    async ({ alertId, updateData }, { rejectWithValue }) => {
        try {
            const response = await alertService.updateAlert(alertId, updateData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update alert');
        }
    }
);

export const resolveAlert = createAsyncThunk(
    'alerts/resolveAlert',
    async ({ alertId, resolution }, { rejectWithValue }) => {
        try {
            const response = await alertService.resolveAlert(alertId, resolution);
            return { alertId, ...response };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to resolve alert');
        }
    }
);

const initialState = {
    alerts: [],
    activeAlerts: 0,
    selectedAlert: null,
    isLoading: false,
    error: null,
};

const alertsSlice = createSlice({
    name: 'alerts',
    initialState,
    reducers: {
        selectAlert: (state, action) => {
            state.selectedAlert = action.payload;
        },
        receiveNewAlert: (state, action) => {
            state.alerts.unshift(action.payload);
            state.activeAlerts += 1;
        },
        clearAlertError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAlerts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAlerts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.alerts = action.payload.alerts;
                state.activeAlerts = action.payload.alerts.filter(alert => alert.status !== 'resolved').length;
            })
            .addCase(fetchAlerts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createAlert.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAlert.fulfilled, (state, action) => {
                state.isLoading = false;
                state.alerts.unshift(action.payload);
                state.activeAlerts += 1;
            })
            .addCase(createAlert.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(updateAlert.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateAlert.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
                if (index !== -1) {
                    state.alerts[index] = action.payload;
                }
                if (state.selectedAlert?.id === action.payload.id) {
                    state.selectedAlert = action.payload;
                }
            })
            .addCase(updateAlert.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(resolveAlert.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resolveAlert.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.alerts.findIndex(alert => alert.id === action.payload.alertId);
                if (index !== -1) {
                    state.alerts[index].status = 'resolved';
                    state.alerts[index].resolution = action.payload.resolution;
                    state.alerts[index].resolvedAt = action.payload.resolvedAt;
                    state.activeAlerts -= 1;
                }
                if (state.selectedAlert?.id === action.payload.alertId) {
                    state.selectedAlert = {
                        ...state.selectedAlert,
                        status: 'resolved',
                        resolution: action.payload.resolution,
                        resolvedAt: action.payload.resolvedAt,
                    };
                }
            })
            .addCase(resolveAlert.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { selectAlert, receiveNewAlert, clearAlertError } = alertsSlice.actions;
export default alertsSlice.reducer; 