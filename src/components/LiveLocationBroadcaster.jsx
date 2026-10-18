import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StopIcon from '@mui/icons-material/Stop';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const LiveLocationBroadcaster = ({ matchId }) => {
  const socket = useSocket();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const watchId = useRef(null);
  const lastSentTime = useRef(0);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (socket?.connected) socket.emit('leave_tracking_room', { matchId });
      api.delete(`/matches/${matchId}/live-location`).catch(() => {});
    };
  }, [socket, matchId]);

  const sendLocationUpdate = async (latitude, longitude) => {
    const now = Date.now();
    // Throttle to once every 4 seconds
    if (now - lastSentTime.current < 4000) return;
    lastSentTime.current = now;

    // Send via socket if available
    if (socket?.connected) {
      socket.emit('location_update', { matchId, latitude, longitude });
    }

    // Also update via REST API (ensures tracking works on Vercel and serverless environments)
    try {
      await api.post(`/matches/${matchId}/live-location`, { latitude, longitude });
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.warn('Live location update notice:', err.response?.data?.message || err.message);
    }
  };

  const startBroadcasting = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setError(null);
    setIsBroadcasting(true);

    if (socket?.connected) {
      socket.emit('join_tracking_room', { matchId });
    }

    // 1. Fetch initial position immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (err) => {
        console.error('Initial location error:', err);
        if (err.code === 1) {
          setError('Location permission was denied. Please allow location access in your browser.');
        } else {
          setError('Could not get current location. Please check your GPS / device settings.');
        }
        stopBroadcasting();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // 2. Watch position continuously as donor moves
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (err) => {
        console.error('Watch location error:', err);
        if (err.code === 1) {
          setError('Location access was denied. Please allow location permissions in your browser.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    watchId.current = id;
  };

  const stopBroadcasting = () => {
    setIsBroadcasting(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (socket?.connected) {
      socket.emit('leave_tracking_room', { matchId });
    }
    api.delete(`/matches/${matchId}/live-location`).catch(() => {});
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f9f9f9' }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
        Live Location Tracking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Share your live location so the hospital and requester can see your arrival in real time.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      {!isBroadcasting ? (
        <Button
          variant="contained"
          color="primary"
          startIcon={<LocationOnIcon />}
          onClick={startBroadcasting}
          fullWidth
          sx={{ borderRadius: 2, py: 1, textTransform: 'none', fontWeight: 600 }}
        >
          Start Sharing Live Location
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} color="success" />
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
              📍 Live location sharing active {lastUpdate ? `(Last update: ${lastUpdate})` : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopBroadcasting}
            fullWidth
            sx={{ borderRadius: 2, py: 0.8, textTransform: 'none', fontWeight: 600 }}
          >
            Stop Sharing Location
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default LiveLocationBroadcaster;
