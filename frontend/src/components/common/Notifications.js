import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert, Box } from '@mui/material';
import { removeNotification } from '../../redux/slices/uiSlice';

const Notifications = () => {
    const dispatch = useDispatch();
    const notifications = useSelector((state) => state.ui.notifications);

    const handleClose = (id) => {
        dispatch(removeNotification(id));
    };

    // Auto-remove notifications after their duration
    useEffect(() => {
        notifications.forEach((notification) => {
            if (notification.duration) {
                const timer = setTimeout(() => {
                    dispatch(removeNotification(notification.id));
                }, notification.duration);

                return () => clearTimeout(timer);
            }
        });
    }, [notifications, dispatch]);

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 2000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            {notifications.map((notification) => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{ position: 'relative', mt: 1 }}
                >
                    <Alert
                        severity={notification.type || 'info'}
                        variant="filled"
                        onClose={() => handleClose(notification.id)}
                        sx={{ width: '100%', boxShadow: 3 }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </Box>
    );
};

export default Notifications; 