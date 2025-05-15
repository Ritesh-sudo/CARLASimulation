import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    InputAdornment,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    Chip,
    IconButton,
    LinearProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Assignment as MissionIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { fetchMissions, deleteMission } from '../redux/slices/missionsSlice';
import { openModal } from '../redux/slices/uiSlice';

// Mission status colors
const statusColors = {
    active: 'info',
    completed: 'success',
    failed: 'error',
    scheduled: 'warning',
    cancelled: 'default',
};

const MissionsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const missions = useSelector((state) => state.missions.missions);
    const isLoading = useSelector((state) => state.missions.isLoading);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        dispatch(fetchMissions());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchMissions());
    };

    const handleCreateMission = () => {
        dispatch(
            openModal({
                modalType: 'CREATE_MISSION',
            })
        );
    };

    const handleDeleteMission = (missionId) => {
        if (window.confirm('Are you sure you want to delete this mission?')) {
            dispatch(deleteMission(missionId));
        }
    };

    // Filter missions based on search term and status
    const filteredMissions = missions.filter((mission) => {
        const matchesSearch =
            mission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (mission.id && mission.id.toString().includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Missions
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateMission}
                >
                    Create Mission
                </Button>
            </Box>

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search missions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel id="status-filter-label">Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    id="status-filter"
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <FilterIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="scheduled">Scheduled</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                startIcon={<RefreshIcon />}
                                onClick={handleRefresh}
                                disabled={isLoading}
                            >
                                Refresh
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {isLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Missions Table */}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Robot</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>End Time</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMissions.map((mission) => (
                            <TableRow
                                key={mission.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                hover
                                onClick={() => navigate(`/missions/${mission.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <TableCell component="th" scope="row">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <MissionIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="body1">
                                                {mission.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {mission.description && mission.description.length > 50
                                                    ? `${mission.description.substring(0, 50)}...`
                                                    : mission.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={mission.status}
                                        color={statusColors[mission.status] || 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{mission.robotId || 'N/A'}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={mission.progress || 0}
                                            sx={{ width: 100, mr: 1 }}
                                        />
                                        <Typography variant="body2">
                                            {mission.progress || 0}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {mission.startTime
                                        ? new Date(mission.startTime).toLocaleString()
                                        : mission.scheduledTime
                                            ? new Date(mission.scheduledTime).toLocaleString()
                                            : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {mission.endTime
                                        ? new Date(mission.endTime).toLocaleString()
                                        : mission.estimatedEndTime
                                            ? new Date(mission.estimatedEndTime).toLocaleString()
                                            : 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(
                                                openModal({
                                                    modalType: 'EDIT_MISSION',
                                                    modalData: { missionId: mission.id }
                                                })
                                            );
                                        }}
                                        size="small"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMission(mission.id);
                                        }}
                                        size="small"
                                        color="error"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}

                        {filteredMissions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No missions found
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {missions.length > 0
                                            ? 'Try adjusting your search or filter criteria.'
                                            : 'There are no missions in the system yet. Create a new mission to get started.'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MissionsPage; 