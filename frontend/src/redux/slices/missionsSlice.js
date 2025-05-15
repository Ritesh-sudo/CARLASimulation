import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import missionService from '../../services/missionService';

export const fetchMissions = createAsyncThunk(
    'missions/fetchMissions',
    async (filters, { rejectWithValue }) => {
        try {
            const response = await missionService.getMissions(filters);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch missions');
        }
    }
);

export const createMission = createAsyncThunk(
    'missions/createMission',
    async (missionData, { rejectWithValue }) => {
        try {
            const response = await missionService.createMission(missionData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create mission');
        }
    }
);

export const updateMission = createAsyncThunk(
    'missions/updateMission',
    async ({ missionId, updateData }, { rejectWithValue }) => {
        try {
            const response = await missionService.updateMission(missionId, updateData);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update mission');
        }
    }
);

export const deleteMission = createAsyncThunk(
    'missions/deleteMission',
    async (missionId, { rejectWithValue }) => {
        try {
            await missionService.deleteMission(missionId);
            return missionId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete mission');
        }
    }
);

export const getMissionDetails = createAsyncThunk(
    'missions/getMissionDetails',
    async (missionId, { rejectWithValue }) => {
        try {
            const response = await missionService.getMissionById(missionId);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch mission details');
        }
    }
);

const initialState = {
    missions: [],
    selectedMission: null,
    isLoading: false,
    error: null,
    missionStats: {
        total: 0,
        completed: 0,
        scheduled: 0,
        active: 0,
    },
};

const missionsSlice = createSlice({
    name: 'missions',
    initialState,
    reducers: {
        selectMission: (state, action) => {
            state.selectedMission = action.payload;
        },
        updateMissionProgress: (state, action) => {
            const { missionId, progress } = action.payload;
            const mission = state.missions.find(m => m.id === missionId);
            if (mission) {
                mission.progress = progress;
            }
            if (state.selectedMission?.id === missionId) {
                state.selectedMission.progress = progress;
            }
        },
        updateMissionStatus: (state, action) => {
            const { missionId, status } = action.payload;
            const mission = state.missions.find(m => m.id === missionId);

            // Update mission status
            if (mission) {
                // Decrement old status count
                if (mission.status === 'active') state.missionStats.active -= 1;
                else if (mission.status === 'completed') state.missionStats.completed -= 1;
                else if (mission.status === 'scheduled') state.missionStats.scheduled -= 1;

                // Update status
                mission.status = status;

                // Increment new status count
                if (status === 'active') state.missionStats.active += 1;
                else if (status === 'completed') state.missionStats.completed += 1;
                else if (status === 'scheduled') state.missionStats.scheduled += 1;
            }

            // Update selected mission if it's the one being modified
            if (state.selectedMission?.id === missionId) {
                state.selectedMission.status = status;
            }
        },
        clearMissionError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMissions.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMissions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.missions = action.payload.missions;

                // Calculate mission stats
                state.missionStats.total = action.payload.missions.length;
                state.missionStats.completed = action.payload.missions.filter(m => m.status === 'completed').length;
                state.missionStats.active = action.payload.missions.filter(m => m.status === 'active').length;
                state.missionStats.scheduled = action.payload.missions.filter(m => m.status === 'scheduled').length;
            })
            .addCase(fetchMissions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(createMission.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createMission.fulfilled, (state, action) => {
                state.isLoading = false;
                state.missions.unshift(action.payload);
                state.missionStats.total += 1;
                state.missionStats.scheduled += 1;
            })
            .addCase(createMission.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(updateMission.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateMission.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.missions.findIndex(mission => mission.id === action.payload.id);
                if (index !== -1) {
                    state.missions[index] = action.payload;
                }
                if (state.selectedMission?.id === action.payload.id) {
                    state.selectedMission = action.payload;
                }
            })
            .addCase(updateMission.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(deleteMission.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteMission.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.missions.findIndex(mission => mission.id === action.payload);

                if (index !== -1) {
                    const mission = state.missions[index];

                    // Update stats
                    state.missionStats.total -= 1;
                    if (mission.status === 'active') state.missionStats.active -= 1;
                    else if (mission.status === 'completed') state.missionStats.completed -= 1;
                    else if (mission.status === 'scheduled') state.missionStats.scheduled -= 1;

                    // Remove mission
                    state.missions.splice(index, 1);
                }

                if (state.selectedMission?.id === action.payload) {
                    state.selectedMission = null;
                }
            })
            .addCase(deleteMission.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(getMissionDetails.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getMissionDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedMission = action.payload;
            })
            .addCase(getMissionDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const {
    selectMission,
    updateMissionProgress,
    updateMissionStatus,
    clearMissionError,
} = missionsSlice.actions;

export default missionsSlice.reducer; 