import { axiosInstance } from './authService';

const simulatorService = {
    // Connect to Carla simulator
    connectToSimulator: async (config = {}) => {
        // Mock implementation until backend is ready
        console.log('Connecting to Carla simulator with config:', config);

        // Mock success response
        return {
            connected: true,
            simulatorVersion: '0.9.13',
            host: config.host || 'localhost',
            port: config.port || 2000,
            connectionId: `carla-${Date.now()}`,
            status: 'Connected successfully'
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/simulator/connect', config);
        // return response.data;
    },

    // Disconnect from simulator
    disconnectFromSimulator: async (connectionId) => {
        // Mock implementation
        console.log(`Disconnecting from simulator: ${connectionId}`);

        return {
            success: true,
            message: 'Disconnected successfully'
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post(`/simulator/disconnect/${connectionId}`);
        // return response.data;
    },

    // Get simulator status
    getSimulatorStatus: async () => {
        // Mock implementation
        return {
            isConnected: true,
            simulatorVersion: '0.9.13',
            activeScenario: 'Urban City',
            weather: 'Clear',
            timeOfDay: 'Day',
            robotsLoaded: 3,
            fps: 60
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.get('/simulator/status');
        // return response.data;
    },

    // Load scenario
    loadScenario: async (scenarioConfig) => {
        // Mock implementation
        console.log('Loading scenario:', scenarioConfig);

        return {
            success: true,
            scenarioId: `scenario-${Date.now()}`,
            name: scenarioConfig.name,
            loaded: true,
            message: `Scenario ${scenarioConfig.name} loaded successfully`
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/simulator/load-scenario', scenarioConfig);
        // return response.data;
    },

    // Get available scenarios
    getAvailableScenarios: async () => {
        // Mock implementation
        return [
            {
                id: 'urban-city',
                name: 'Urban City',
                description: 'Dense urban environment with multi-story buildings and traffic',
                thumbnail: 'urban_thumbnail.jpg',
                difficulty: 'Medium'
            },
            {
                id: 'highway',
                name: 'Highway',
                description: 'High-speed highway environment with multiple lanes',
                thumbnail: 'highway_thumbnail.jpg',
                difficulty: 'Hard'
            },
            {
                id: 'parking-lot',
                name: 'Parking Lot',
                description: 'Large parking area with parked vehicles and pedestrians',
                thumbnail: 'parking_thumbnail.jpg',
                difficulty: 'Easy'
            },
            {
                id: 'suburban',
                name: 'Suburban Area',
                description: 'Residential area with houses and low traffic',
                thumbnail: 'suburban_thumbnail.jpg',
                difficulty: 'Easy'
            },
            {
                id: 'warehouse',
                name: 'Warehouse District',
                description: 'Industrial zone with warehouses and loading areas',
                thumbnail: 'warehouse_thumbnail.jpg',
                difficulty: 'Medium'
            }
        ];

        // Uncomment when backend is ready
        // const response = await axiosInstance.get('/simulator/available-scenarios');
        // return response.data;
    },

    // Set weather and time of day
    setEnvironment: async (settings) => {
        // Mock implementation
        console.log('Setting environment:', settings);

        return {
            success: true,
            weather: settings.weather,
            timeOfDay: settings.timeOfDay,
            message: 'Environment settings applied'
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/simulator/environment', settings);
        // return response.data;
    },

    // Spawn robot in simulator
    spawnRobot: async (robotConfig) => {
        // Mock implementation
        console.log('Spawning robot with config:', robotConfig);

        return {
            success: true,
            robotId: `sim-robot-${Date.now()}`,
            type: robotConfig.type,
            position: robotConfig.position || { x: 0, y: 0, z: 0 },
            message: `Robot ${robotConfig.type} spawned successfully`
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/simulator/spawn-robot', robotConfig);
        // return response.data;
    },

    // Get simulator metrics
    getSimulatorMetrics: async () => {
        // Mock implementation
        return {
            fps: Math.floor(55 + Math.random() * 10),
            memoryUsage: Math.floor(2000 + Math.random() * 500),
            cpuUsage: Math.floor(30 + Math.random() * 20),
            activeObjects: Math.floor(100 + Math.random() * 50),
            collisions: Math.floor(Math.random() * 5),
            timestamp: new Date().toISOString()
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.get('/simulator/metrics');
        // return response.data;
    }
};

export default simulatorService; 