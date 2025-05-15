import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    FormControlLabel,
    Switch,
    Button,
    ButtonGroup,
    Chip,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider,
} from '@mui/material';
import {
    Layers as LayersIcon,
    SmartToy as RobotIcon,
    Close as CloseIcon,
    MyLocation as LocationIcon,
    Route as RouteIcon,
    Fence as FenceIcon,
    Map as MapIcon,
    Satellite as SatelliteIcon,
    Terrain as TerrainIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { fetchRobots } from '../redux/slices/robotsSlice';
import {
    updateMapSettings,
    setMapCenter,
    setMapZoom,
    toggleMapLayer,
    setMapType
} from '../redux/slices/uiSlice';

// Workaround for Leaflet marker icons in webpack
// For a real app, you'd use proper image handling with webpack
// and store your own custom marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Create custom robot icon
const robotIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2301/2301658.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

// Component to handle map re-centering
const MapCenterControl = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);

    return null;
};

const MapPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const robots = useSelector((state) => state.robots.robots);
    const mapSettings = useSelector((state) => state.ui.mapSettings);
    const isLoading = useSelector((state) => state.robots.isLoading);

    const [isLayersDrawerOpen, setLayersDrawerOpen] = useState(false);
    const [selectedRobot, setSelectedRobot] = useState(null);

    useEffect(() => {
        dispatch(fetchRobots());
        // Schedule regular updates every 10 seconds
        const interval = setInterval(() => {
            dispatch(fetchRobots());
        }, 10000);

        return () => clearInterval(interval);
    }, [dispatch]);

    const handleRobotClick = (robot) => {
        setSelectedRobot(robot);
        dispatch(setMapCenter({
            lat: robot.location?.latitude || mapSettings.center.lat,
            lng: robot.location?.longitude || mapSettings.center.lng
        }));
    };

    const handleMapTypeChange = (type) => {
        dispatch(setMapType(type));
    };

    const toggleLayersDrawer = () => {
        setLayersDrawerOpen(!isLayersDrawerOpen);
    };

    const handleLayerToggle = (layer) => (event) => {
        dispatch(toggleMapLayer({
            layer,
            visible: event.target.checked
        }));
    };

    // Generate map paths for robots on missions
    const robotPaths = robots
        .filter(robot => robot.status === 'mission_active' && robot.currentMission?.waypoints)
        .map(robot => {
            const waypoints = robot.currentMission.waypoints.map(wp => [wp.latitude, wp.longitude]);
            return {
                robotId: robot.id,
                positions: waypoints,
                color: '#1976d2'
            };
        });

    // Define geofenced areas (this would come from the backend in a real app)
    const geofences = [
        { id: 1, name: 'Secure Area', center: [37.7749, -122.4194], radius: 200, color: '#ff0000' },
        { id: 2, name: 'Patrol Zone', center: [37.7739, -122.4184], radius: 300, color: '#00ff00' }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Fleet Map
                </Typography>
                <Box>
                    <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
                        <Button
                            onClick={() => handleMapTypeChange('street')}
                            variant={mapSettings.mapType === 'street' ? 'contained' : 'outlined'}
                        >
                            <MapIcon sx={{ mr: 1 }} />
                            Street
                        </Button>
                        <Button
                            onClick={() => handleMapTypeChange('satellite')}
                            variant={mapSettings.mapType === 'satellite' ? 'contained' : 'outlined'}
                        >
                            <SatelliteIcon sx={{ mr: 1 }} />
                            Satellite
                        </Button>
                        <Button
                            onClick={() => handleMapTypeChange('terrain')}
                            variant={mapSettings.mapType === 'terrain' ? 'contained' : 'outlined'}
                        >
                            <TerrainIcon sx={{ mr: 1 }} />
                            Terrain
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant="outlined"
                        onClick={toggleLayersDrawer}
                        startIcon={<LayersIcon />}
                    >
                        Layers
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Map Container */}
                <Grid item xs={12} md={9}>
                    <Card sx={{ height: 600 }}>
                        <CardContent sx={{ height: '100%', p: 0, '&:last-child': { pb: 0 } }}>
                            <MapContainer
                                center={[mapSettings.center.lat, mapSettings.center.lng]}
                                zoom={mapSettings.zoomLevel}
                                style={{ height: '100%', width: '100%' }}
                            >
                                {/* TileLayer based on map type */}
                                {mapSettings.mapType === 'street' && (
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                )}
                                {mapSettings.mapType === 'satellite' && (
                                    <TileLayer
                                        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    />
                                )}
                                {mapSettings.mapType === 'terrain' && (
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    />
                                )}

                                {/* Robot markers */}
                                {robots.map((robot) => (
                                    robot.location?.latitude && robot.location?.longitude ? (
                                        <Marker
                                            key={robot.id}
                                            position={[robot.location.latitude, robot.location.longitude]}
                                            icon={robotIcon}
                                            eventHandlers={{
                                                click: () => handleRobotClick(robot),
                                            }}
                                        >
                                            <Popup>
                                                <Typography variant="subtitle1">{robot.name}</Typography>
                                                <Typography variant="body2">
                                                    Status: {robot.status?.replace('_', ' ')}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Battery: {robot.battery || 'N/A'}%
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => navigate(`/robots/${robot.id}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </Box>
                                            </Popup>
                                        </Marker>
                                    ) : null
                                ))}

                                {/* Robot paths */}
                                {mapSettings.showRobotPaths && robotPaths.map((path) => (
                                    <Polyline
                                        key={path.robotId}
                                        positions={path.positions}
                                        color={path.color}
                                        weight={3}
                                        dashArray="5, 10"
                                    />
                                ))}

                                {/* Geofences */}
                                {mapSettings.showGeofences && geofences.map((fence) => (
                                    <Circle
                                        key={fence.id}
                                        center={fence.center}
                                        radius={fence.radius}
                                        pathOptions={{
                                            color: fence.color,
                                            fillColor: fence.color,
                                            fillOpacity: 0.2
                                        }}
                                    >
                                        <Popup>
                                            <Typography variant="subtitle1">{fence.name}</Typography>
                                            <Typography variant="body2">
                                                Radius: {fence.radius}m
                                            </Typography>
                                        </Popup>
                                    </Circle>
                                ))}

                                {/* Map center control */}
                                <MapCenterControl center={[mapSettings.center.lat, mapSettings.center.lng]} />
                            </MapContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Robot List */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ height: 600, overflow: 'auto' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Robots
                            </Typography>
                            <List sx={{ pt: 0 }}>
                                {robots.map((robot) => (
                                    <ListItem
                                        key={robot.id}
                                        button
                                        selected={selectedRobot?.id === robot.id}
                                        onClick={() => handleRobotClick(robot)}
                                        secondaryAction={
                                            <Chip
                                                label={robot.status?.replace('_', ' ')}
                                                size="small"
                                                color={
                                                    robot.status === 'online' || robot.status === 'mission_active'
                                                        ? 'success'
                                                        : robot.status === 'offline'
                                                            ? 'error'
                                                            : 'default'
                                                }
                                            />
                                        }
                                    >
                                        <ListItemIcon>
                                            <RobotIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={robot.name}
                                            secondary={`Battery: ${robot.battery || 'N/A'}%`}
                                        />
                                    </ListItem>
                                ))}
                                {robots.length === 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary="No robots available"
                                            secondary="Add robots to view them on the map"
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Layers Drawer */}
            <Drawer
                anchor="right"
                open={isLayersDrawerOpen}
                onClose={toggleLayersDrawer}
            >
                <Box sx={{ width: 300, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Map Layers
                        </Typography>
                        <IconButton onClick={toggleLayersDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <RouteIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="Robot Paths" secondary="Show active mission paths" />
                            <Switch
                                edge="end"
                                checked={mapSettings.showRobotPaths}
                                onChange={handleLayerToggle('robotPaths')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <FenceIcon color="warning" />
                            </ListItemIcon>
                            <ListItemText primary="Geofences" secondary="Show restricted areas" />
                            <Switch
                                edge="end"
                                checked={mapSettings.showGeofences}
                                onChange={handleLayerToggle('geofences')}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <LocationIcon color="error" />
                            </ListItemIcon>
                            <ListItemText primary="Points of Interest" secondary="Show important locations" />
                            <Switch
                                edge="end"
                                checked={mapSettings.showPOIs}
                                onChange={handleLayerToggle('pois')}
                            />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </Box>
    );
};

export default MapPage; 