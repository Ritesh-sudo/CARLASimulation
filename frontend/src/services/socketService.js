import { io } from 'socket.io-client';
import store from '../redux/store';
import {
    updateRobotLocation,
    updateRobotStatus,
    updateVideoStream,
    updateSensorData,
} from '../redux/slices/robotsSlice';
import { receiveNewAlert } from '../redux/slices/alertsSlice';
import { updateMissionProgress, updateMissionStatus } from '../redux/slices/missionsSlice';
import { addNotification } from '../redux/slices/uiSlice';

let socket;

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const setupSocketConnection = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found for socket connection');
        return;
    }

    if (socket) {
        socket.disconnect();
    }

    // Connect with auth token
    socket = io(SOCKET_URL, {
        auth: {
            token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        store.dispatch(
            addNotification({
                type: 'error',
                message: 'Real-time connection error. Trying to reconnect...',
            })
        );
    });

    // Robot updates
    socket.on('robot:location', (data) => {
        store.dispatch(updateRobotLocation(data));
    });

    socket.on('robot:status', (data) => {
        store.dispatch(updateRobotStatus(data));

        // Add notification for important status changes
        if (data.status === 'error' || data.status === 'maintenance_required') {
            store.dispatch(
                addNotification({
                    type: 'warning',
                    message: `Robot ${data.robotId} status: ${data.status}`,
                    duration: 5000,
                })
            );
        }
    });

    socket.on('robot:video', (data) => {
        store.dispatch(updateVideoStream(data));
    });

    socket.on('robot:sensor', (data) => {
        store.dispatch(updateSensorData(data));
    });

    // Alert events
    socket.on('alert:new', (data) => {
        store.dispatch(receiveNewAlert(data));

        // Add notification for new alerts
        const severity = data.priority > 3 ? 'error' : data.priority > 1 ? 'warning' : 'info';
        store.dispatch(
            addNotification({
                type: severity,
                message: `New alert: ${data.description}`,
                duration: 7000,
            })
        );
    });

    // Mission updates
    socket.on('mission:progress', (data) => {
        store.dispatch(updateMissionProgress(data));
    });

    socket.on('mission:status', (data) => {
        store.dispatch(updateMissionStatus(data));

        // Add notification for mission completion
        if (data.status === 'completed') {
            store.dispatch(
                addNotification({
                    type: 'success',
                    message: `Mission ${data.missionId} completed successfully`,
                    duration: 5000,
                })
            );
        } else if (data.status === 'failed') {
            store.dispatch(
                addNotification({
                    type: 'error',
                    message: `Mission ${data.missionId} failed: ${data.reason || 'Unknown error'}`,
                    duration: 7000,
                })
            );
        }
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};

export const getSocketInstance = () => {
    return socket;
};

export const emitEvent = (event, data) => {
    if (socket && socket.connected) {
        socket.emit(event, data);
    } else {
        console.error('Socket not connected, cannot emit event:', event);
    }
};

export default {
    setupSocketConnection,
    disconnectSocket,
    getSocketInstance,
    emitEvent,
}; 