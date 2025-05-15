import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '80vh',
                textAlign: 'center',
                p: 3,
            }}
        >
            <Paper
                sx={{
                    p: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 500,
                }}
                elevation={3}
            >
                <Typography variant="h1" component="h1" sx={{ mb: 2, fontSize: '5rem', fontWeight: 'bold' }}>
                    404
                </Typography>
                <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
                    Page Not Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    size="large"
                >
                    Back to Dashboard
                </Button>
            </Paper>
        </Box>
    );
};

export default NotFoundPage; 