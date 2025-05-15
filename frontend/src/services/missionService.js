import { axiosInstance } from './authService';

const missionService = {
    // Get missions with optional filters
    getMissions: async (filters = {}) => {
        // Mock implementation until backend is ready
        console.log('Fetching missions with filters:', filters);

        // Mock data
        const mockMissions = [
            {
                id: 'm1',
                name: 'Regular Patrol',
                description: 'Standard patrol of Building A perimeter',
                status: 'active',
                robotId: 'r1',
                progress: 45,
                startTime: new Date(Date.now() - 1800000).toISOString(),
                estimatedEndTime: new Date(Date.now() + 1800000).toISOString(),
                route: [
                    { lat: 37.7749, lng: -122.4194 },
                    { lat: 37.7750, lng: -122.4180 },
                    { lat: 37.7735, lng: -122.4180 },
                    { lat: 37.7735, lng: -122.4194 }
                ]
            },
            {
                id: 'm2',
                name: 'Security Check',
                description: 'Verify all access points in Building B',
                status: 'scheduled',
                robotId: 'r2',
                progress: 0,
                scheduledTime: new Date(Date.now() + 3600000).toISOString(),
                estimatedEndTime: new Date(Date.now() + 7200000).toISOString()
            },
            {
                id: 'm3',
                name: 'Incident Investigation',
                description: 'Investigate reported movement in zone C-4',
                status: 'completed',
                robotId: 'r3',
                progress: 100,
                startTime: new Date(Date.now() - 86400000).toISOString(),
                endTime: new Date(Date.now() - 82800000).toISOString()
            }
        ];

        return { missions: mockMissions };

        // Uncomment when backend is ready
        // const response = await axiosInstance.get('/missions', { params: filters });
        // return response.data;
    },

    // Create mission
    createMission: async (missionData) => {
        // Mock implementation
        console.log('Creating mission with data:', missionData);

        const mockMission = {
            id: `m${Date.now()}`,
            ...missionData,
            status: 'scheduled',
            progress: 0,
            createdAt: new Date().toISOString()
        };

        return mockMission;

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/missions', missionData);
        // return response.data;
    },

    // Update mission
    updateMission: async (missionId, updateData) => {
        // Mock implementation
        console.log(`Updating mission ${missionId} with data:`, updateData);

        const mockUpdatedMission = {
            id: missionId,
            name: 'Updated Mission',
            description: 'This mission has been updated.',
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        return mockUpdatedMission;

        // Uncomment when backend is ready
        // const response = await axiosInstance.put(`/missions/${missionId}`, updateData);
        // return response.data;
    },

    // Delete mission
    deleteMission: async (missionId) => {
        // Mock implementation
        console.log(`Deleting mission ${missionId}`);

        // Uncomment when backend is ready
        // await axiosInstance.delete(`/missions/${missionId}`);
        return;
    },

    // Get mission by ID
    getMissionById: async (missionId) => {
        // Mock implementation
        console.log(`Fetching mission with ID: ${missionId}`);

        const mockMission = {
            id: missionId,
            name: 'Building Security Check',
            description: 'Complete security scan of Building A',
            status: 'active',
            robotId: 'r1',
            progress: 60,
            startTime: new Date(Date.now() - 3600000).toISOString(),
            estimatedEndTime: new Date(Date.now() + 1800000).toISOString(),
            route: [
                { lat: 37.7749, lng: -122.4194 },
                { lat: 37.7750, lng: -122.4180 },
                { lat: 37.7735, lng: -122.4180 },
                { lat: 37.7735, lng: -122.4194 }
            ],
            checkpoints: [
                { id: 'cp1', name: 'Front Entrance', status: 'completed' },
                { id: 'cp2', name: 'East Wing', status: 'completed' },
                { id: 'cp3', name: 'North Wing', status: 'active' },
                { id: 'cp4', name: 'Parking Garage', status: 'pending' }
            ]
        };

        return mockMission;

        // Uncomment when backend is ready
        // const response = await axiosInstance.get(`/missions/${missionId}`);
        // return response.data;
    }
};

export default missionService; 