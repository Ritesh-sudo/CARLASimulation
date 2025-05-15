import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

export const login = createAsyncThunk(
    'auth/login',
    async ({ username, password }, { rejectWithValue }) => {
        try {
            const response = await authService.login(username, password);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    await authService.logout();
});

export const checkAuth = createAsyncThunk('auth/check', async () => {
    const response = await authService.checkAuth();
    return response;
});

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
            })
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 