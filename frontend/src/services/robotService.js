import { axiosInstance } from './authService';

const robotService = {
    // Get all robots
    getAllRobots: async (filters = {}) => {
        const response = await axiosInstance.get('/robot/list', { params: filters });
        return response.data;
    },

    // Get robot by ID
    getRobotById: async (robotId) => {
        const response = await axiosInstance.get(`/robot/${robotId}`);
        return response.data;
    },

    // Start a robot mission
    startMission: async (robotId, missionData) => {
        const response = await axiosInstance.post(`/robot/${robotId}/start`, missionData);
        return response.data;
    },

    // Stop an active robot mission
    stopMission: async (robotId) => {
        const response = await axiosInstance.post(`/robot/${robotId}/stop`);
        return response.data;
    },

    // Get robot status
    getRobotStatus: async (robotId) => {
        const response = await axiosInstance.get(`/robot/${robotId}/status`);
        return response.data;
    },

    // Get robot location history
    getLocationHistory: async (robotId, timeFrame) => {
        const response = await axiosInstance.get(`/robot/${robotId}/location-history`, {
            params: timeFrame,
        });
        return response.data;
    },

    // Get robot video stream
    getVideoStream: async (robotId) => {
        const response = await axiosInstance.get(`/robot/${robotId}/video-stream`);
        return response.data;
    },

    // Get robot sensor data
    getSensorData: async (robotId, sensorType, timeFrame) => {
        const response = await axiosInstance.get(`/robot/${robotId}/sensor-data`, {
            params: { sensorType, ...timeFrame },
        });
        return response.data;
    },

    // Update robot settings
    updateSettings: async (robotId, settings) => {
        const response = await axiosInstance.put(`/robot/${robotId}/settings`, settings);
        return response.data;
    },

    // Get robot configuration
    getConfiguration: async (robotId) => {
        const response = await axiosInstance.get(`/robot/${robotId}/configuration`);
        return response.data;
    },

    // Update robot configuration
    updateConfiguration: async (robotId, config) => {
        const response = await axiosInstance.put(`/robot/${robotId}/configuration`, config);
        return response.data;
    },

    // Send command to robot
    sendCommand: async (robotId, command) => {
        const response = await axiosInstance.post(`/robot/${robotId}/command`, command);
        return response.data;
    },

    // Get robot maintenance info
    getMaintenanceInfo: async (robotId) => {
        const response = await axiosInstance.get(`/robot/${robotId}/maintenance`);
        return response.data;
    },

    // Schedule robot maintenance
    scheduleMaintenance: async (robotId, maintenanceData) => {
        const response = await axiosInstance.post(`/robot/${robotId}/maintenance`, maintenanceData);
        return response.data;
    },
};

export default robotService; 