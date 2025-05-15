import { axiosInstance } from './authService';

const alertService = {
    // Get alerts with optional filters
    getAlerts: async (filters = {}) => {
        // Mock implementation until backend is ready
        console.log('Fetching alerts with filters:', filters);

        // Mock data
        const mockAlerts = [
            {
                id: 'a1',
                title: 'Unauthorized Access',
                description: 'Unauthorized access detected in Building C.',
                priority: 4,
                status: 'active',
                createdAt: new Date().toISOString(),
                robotId: 'r1'
            },
            {
                id: 'a2',
                title: 'Low Battery',
                description: 'Robot B2 battery level critical (10%).',
                priority: 3,
                status: 'active',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                robotId: 'r2'
            },
            {
                id: 'a3',
                title: 'Maintenance Required',
                description: 'Routine maintenance due for Robot A1.',
                priority: 2,
                status: 'resolved',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                robotId: 'r1',
                resolvedAt: new Date(Date.now() - 43200000).toISOString()
            }
        ];

        return { alerts: mockAlerts };

        // Uncomment when backend is ready
        // const response = await axiosInstance.get('/alerts', { params: filters });
        // return response.data;
    },

    // Create alert
    createAlert: async (alertData) => {
        // Mock implementation
        console.log('Creating alert with data:', alertData);

        const mockAlert = {
            id: `a${Date.now()}`,
            ...alertData,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        return mockAlert;

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/alerts', alertData);
        // return response.data;
    },

    // Update alert
    updateAlert: async (alertId, updateData) => {
        // Mock implementation
        console.log(`Updating alert ${alertId} with data:`, updateData);

        const mockUpdatedAlert = {
            id: alertId,
            title: 'Updated Alert',
            description: 'This alert has been updated.',
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        return mockUpdatedAlert;

        // Uncomment when backend is ready
        // const response = await axiosInstance.put(`/alerts/${alertId}`, updateData);
        // return response.data;
    },

    // Resolve alert
    resolveAlert: async (alertId, resolution) => {
        // Mock implementation
        console.log(`Resolving alert ${alertId} with resolution:`, resolution);

        return {
            alertId,
            resolution,
            resolvedAt: new Date().toISOString()
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post(`/alerts/${alertId}/resolve`, { resolution });
        // return response.data;
    },

    // Get alert by ID
    getAlertById: async (alertId) => {
        // Mock implementation
        console.log(`Fetching alert with ID: ${alertId}`);

        const mockAlert = {
            id: alertId,
            title: 'Suspicious Activity',
            description: 'Motion detected in restricted area.',
            priority: 4,
            status: 'active',
            createdAt: new Date().toISOString(),
            robotId: 'r1',
            location: {
                zone: 'Building A, Floor 2',
                coordinates: { lat: 37.7749, lng: -122.4194 }
            }
        };

        return mockAlert;

        // Uncomment when backend is ready
        // const response = await axiosInstance.get(`/alerts/${alertId}`);
        // return response.data;
    }
};

export default alertService; 