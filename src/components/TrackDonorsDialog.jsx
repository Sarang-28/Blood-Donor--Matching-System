import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import api from '../services/api';
import LiveTrackerMap from './LiveTrackerMap';

export default function TrackDonorsDialog({ open, onClose, requestId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTrackingMatchId, setActiveTrackingMatchId] = useState(null);

  useEffect(() => {
    if (open && requestId) {
      fetchMatches();
    } else {
      setData(null);
      setActiveTrackingMatchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/blood-requests/${requestId}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load matches for this request.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'declined': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Matching Donors & Live Tracking
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#F6F7FB' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="error" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Showing {data.matches.length} nearby matched donors
            </Typography>

            {data.matches.map((match) => (
              <Card key={match.matchId} sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{match.donorName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Blood Group: <strong>{match.donorBloodGroup}</strong> | Distance: {match.distanceKm} km
                      </Typography>
                      {match.donorPhone && (
                        <Typography variant="body2" color="text.secondary">
                          Contact: {match.donorPhone}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={match.matchStatus.toUpperCase()} 
                        color={getStatusColor(match.matchStatus)}
                        size="small"
                        sx={{ mb: 1, fontWeight: 700 }}
                      />
                      <br/>
                      {match.matchStatus === 'accepted' && (
                        <Button 
                          variant={activeTrackingMatchId === match.matchId ? 'contained' : 'outlined'}
                          color="primary"
                          size="small"
                          onClick={() => setActiveTrackingMatchId(
                            activeTrackingMatchId === match.matchId ? null : match.matchId
                          )}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {activeTrackingMatchId === match.matchId ? 'Hide Tracker' : 'Live Track Donor'}
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {activeTrackingMatchId === match.matchId && (
                    <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                      <LiveTrackerMap matchId={match.matchId} initialCenter={[data.request.latitude, data.request.longitude]} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}

            {data.matches.length === 0 && (
              <Alert severity="info">
                No matching donors found nearby yet. The matching engine will notify eligible donors automatically.
              </Alert>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
