import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StopIcon from '@mui/icons-material/Stop';
import { useSocket } from '../context/SocketContext';

const LiveLocationBroadcaster = ({ matchId }) => {
  const socket = useSocket();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopBroadcasting();
    };
  }, []);

  const startBroadcasting = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if (!socket) {
      setError('Connection error. Please try again later.');
      return;
    }

    setIsBroadcasting(true);
    setError(null);

    // Join the tracking room as donor
    socket.emit('join_tracking_room', { matchId, role: 'donor' });

    // Watch position
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('location_update', { matchId, latitude, longitude });
      },
      (err) => {
        console.error('Error getting location:', err);
        setError('Failed to get your location. Please check permissions.');
        stopBroadcasting();
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    setWatchId(id);
  };

  const stopBroadcasting = () => {
    setIsBroadcasting(false);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (socket) {
      socket.emit('leave_tracking_room', { matchId });
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9' }}>
      <Typography variant="h6" gutterBottom>
        Live Location Tracking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Share your live location so the hospital can prepare for your arrival.
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!isBroadcasting ? (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<LocationOnIcon />}
          onClick={startBroadcasting}
          fullWidth
        >
          Start Sharing Live Location
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography variant="body1" color="primary">Broadcasting Location...</Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<StopIcon />}
            onClick={stopBroadcasting}
            fullWidth
          >
            Stop Sharing
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default LiveLocationBroadcaster;
