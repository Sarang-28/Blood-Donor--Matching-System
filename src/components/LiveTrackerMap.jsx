import React, { useEffect, useState } from 'react';
import { Box, Paper, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useSocket } from '../context/SocketContext';

import { mapSettings, validPoint, directionsUrl } from '../config/maps';

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
    setDonorLocation(null);
    if (!socket || !matchId) return;

    socket.emit('join_tracking_room', { matchId, role: 'requester' });

    socket.on('donor_location_updated', (data) => {
      if (data.matchId !== matchId || !validPoint(data.latitude,data.longitude)) return;
      setDonorLocation({ lat: data.latitude, lng: data.longitude });
      setStatusMessage('Live tracking active. Donor location updated recently.');
    });

    return () => {
      socket.off('donor_location_updated');
      socket.emit('leave_tracking_room', { matchId });
    };
  }, [socket, matchId]);

  if (!validPoint(hospitalLat, hospitalLng)) return <Alert severity="warning">Destination coordinates are unavailable.</Alert>;
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {donorLocation ? (
        <Alert severity="success" sx={{ mb: 2 }}>{statusMessage}</Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>{statusMessage}</Alert>
      )}

      <Paper elevation={3} sx={{ height: 400, width: '100%', overflow: 'hidden', position: 'relative' }}>
        <MapContainer
          center={[Number(hospitalLat), Number(hospitalLng)]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution={mapSettings.attribution}
            url={mapSettings.tileUrl}
          />

          {validPoint(hospitalLat, hospitalLng) && (
            <Marker position={[hospitalLat, hospitalLng]}>
              <Popup><a href={directionsUrl(hospitalLat,hospitalLng)} target="_blank" rel="noopener noreferrer">Directions to destination</a></Popup>
            </Marker>
          )}

          {donorLocation && (
            <>
              <Marker position={[donorLocation.lat, donorLocation.lng]}>
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
