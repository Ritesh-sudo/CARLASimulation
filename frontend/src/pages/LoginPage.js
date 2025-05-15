import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Security as SecurityIcon,
} from '@mui/icons-material';
import { login, clearError } from '../redux/slices/authSlice';

const LoginPage = () => {
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector((state) => state.auth);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ username, password }));
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                padding: 2,
            }}
        >
            <Card
                sx={{
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: (theme) => theme.shadows[10],
                }}
            >
                <CardContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 4,
                    }}
                >
                    <SecurityIcon
                        color="primary"
                        sx={{ fontSize: 48, mb: 2 }}
                    />

                    <Typography variant="h4" component="h1" gutterBottom>
                        Robot Patrol
                    </Typography>

                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        Sign in to your account
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mt: 2, width: '100%' }}
                            onClose={() => dispatch(clearError())}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                        <TextField
                            label="Username"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage; 