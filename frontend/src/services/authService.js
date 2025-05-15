import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include token in all requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    // Login user
    login: async (username, password) => {
        // Mock implementation for demonstration
        console.log('Mock login with:', { username, password });

        // For testing purposes, simulate a successful login with any credentials
        const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
        const mockUser = {
            id: '1',
            username: username,
            email: `${username}@example.com`,
            firstName: 'Demo',
            lastName: 'User',
            role: 'admin'
        };

        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));

        return {
            token: mockToken,
            user: mockUser
        };

        // Uncomment when backend is ready
        // const response = await axiosInstance.post('/login', { username, password });
        // if (response.data.token) {
        //     localStorage.setItem('token', response.data.token);
        // }
        // return response.data;
    },

    // Logout user
    logout: async () => {
        // Mock implementation
        console.log('Mock logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Uncomment when backend is ready
        // try {
        //     await axiosInstance.post('/logout');
        // } catch (error) {
        //     console.error('Logout error:', error);
        // } finally {
        //     localStorage.removeItem('token');
        // }
    },

    // Check if user is authenticated
    checkAuth: async () => {
        // Mock implementation
        console.log('Mock auth check');
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (token && user) {
            return { user };
        }

        // If no token or user, simulate an authentication failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Not authenticated');

        // Uncomment when backend is ready
        // try {
        //     const response = await axiosInstance.get('/check-auth');
        //     return response.data;
        // } catch (error) {
        //     localStorage.removeItem('token');
        //     throw error;
        // }
    },

    // Register new user (admin only)
    register: async (userData) => {
        const response = await axiosInstance.post('/user/create', userData);
        return response.data;
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        const response = await axiosInstance.put(`/user/${userId}`, profileData);
        return response.data;
    },

    // Change password
    changePassword: async (userId, passwordData) => {
        const response = await axiosInstance.put(`/user/${userId}/password`, passwordData);
        return response.data;
    },

    // Get user list (admin only)
    getUsers: async (filters = {}) => {
        const response = await axiosInstance.get('/user/list', { params: filters });
        return response.data;
    },
};

export default authService;
export { axiosInstance }; 