import React, { useEffect, useState } from 'react';
import { Box, Paper, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../context/SocketContext';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red icon for donor
const donorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const LiveTrackerMap = ({ matchId, hospitalLat, hospitalLng }) => {
  const socket = useSocket();
  const [donorLocation, setDonorLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Waiting for donor to start sharing location...');

  useEffect(() => {
    if (!socket || !matchId) return;

    socket.emit('join_tracking_room', { matchId, role: 'requester' });

    socket.on('donor_location_updated', (data) => {
      setDonorLocation({ lat: data.latitude, lng: data.longitude });
      setStatusMessage('Live tracking active. Donor location updated recently.');
    });

    return () => {
      socket.off('donor_location_updated');
      socket.emit('leave_tracking_room', { matchId });
    };
  }, [socket, matchId]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {donorLocation ? (
        <Alert severity="success" sx={{ mb: 2 }}>{statusMessage}</Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>{statusMessage}</Alert>
      )}
      
      <Paper elevation={3} sx={{ height: 400, width: '100%', overflow: 'hidden', position: 'relative' }}>
        <MapContainer 
          center={hospitalLat ? [hospitalLat, hospitalLng] : [18.5204, 73.8567]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {hospitalLat && hospitalLng && (
            <Marker position={[hospitalLat, hospitalLng]}>
              <Popup>Destination (Hospital / Patient)</Popup>
            </Marker>
          )}

          {donorLocation && (
            <>
              <Marker position={[donorLocation.lat, donorLocation.lng]} icon={donorIcon}>
                <Popup>Donor's Live Location</Popup>
              </Marker>
              <RecenterAutomatically lat={donorLocation.lat} lng={donorLocation.lng} />
            </>
          )}
        </MapContainer>
      </Paper>
    </Box>
  );
};

export default LiveTrackerMap;
