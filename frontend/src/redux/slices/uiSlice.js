import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isSidebarOpen: true,
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    notifications: [],
    activeTab: 'dashboard',
    modalState: {
        isOpen: false,
        modalType: null,
        modalData: null,
    },
    mapSettings: {
        zoomLevel: 15,
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        mapType: 'street',
        showRobotPaths: true,
        showGeofences: true,
        showPOIs: true,
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
        },
        toggleDarkMode: (state) => {
            state.isDarkMode = !state.isDarkMode;
            localStorage.setItem('darkMode', state.isDarkMode);
        },
        setActiveTab: (state, action) => {
            state.activeTab = action.payload;
        },
        addNotification: (state, action) => {
            state.notifications.push({
                id: new Date().getTime(),
                ...action.payload,
            });
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== action.payload
            );
        },
        clearAllNotifications: (state) => {
            state.notifications = [];
        },
        openModal: (state, action) => {
            state.modalState = {
                isOpen: true,
                modalType: action.payload.modalType,
                modalData: action.payload.modalData || null,
            };
        },
        closeModal: (state) => {
            state.modalState = {
                isOpen: false,
                modalType: null,
                modalData: null,
            };
        },
        updateMapSettings: (state, action) => {
            state.mapSettings = {
                ...state.mapSettings,
                ...action.payload,
            };
        },
        setMapCenter: (state, action) => {
            state.mapSettings.center = action.payload;
        },
        setMapZoom: (state, action) => {
            state.mapSettings.zoomLevel = action.payload;
        },
        toggleMapLayer: (state, action) => {
            const { layer, visible } = action.payload;
            if (layer === 'robotPaths') {
                state.mapSettings.showRobotPaths = visible;
            } else if (layer === 'geofences') {
                state.mapSettings.showGeofences = visible;
            } else if (layer === 'pois') {
                state.mapSettings.showPOIs = visible;
            }
        },
        setMapType: (state, action) => {
            state.mapSettings.mapType = action.payload;
        },
    },
});

export const {
    toggleSidebar,
    toggleDarkMode,
    setActiveTab,
    addNotification,
    removeNotification,
    clearAllNotifications,
    openModal,
    closeModal,
    updateMapSettings,
    setMapCenter,
    setMapZoom,
    toggleMapLayer,
    setMapType,
} = uiSlice.actions;

export default uiSlice.reducer; 