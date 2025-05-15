import { configureStore } from '@reduxjs/toolkit';
// import chartsReducer from './slices/chartsSlice'; // Temporarily commented out
import authReducer from './slices/authSlice';
import robotsReducer from './slices/robotsSlice';
import alertsReducer from './slices/alertsSlice';
import missionsReducer from './slices/missionsSlice';
import uiReducer from './slices/uiSlice';
import simulatorReducer from './slices/simulatorSlice';
// Import other reducers...

const store = configureStore({
    reducer: {
        auth: authReducer,
        robots: robotsReducer,
        alerts: alertsReducer,
        missions: missionsReducer,
        ui: uiReducer,
        simulator: simulatorReducer,
        // charts: chartsReducer, // Temporarily commented out
        // Add other reducers...
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;