import {TextField,MenuItem} from '@mui/material';
import {useAuth} from '../context/AuthContext';
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
  const {user}=useAuth();
  const [ngos,setNgos]=useState([]);
  const [ngoId,setNgoId]=useState('');
  const [urgency,setUrgency]=useState('Urgent');
  useEffect(()=>{if(open)api.get('/ngos').then(r=>setNgos(r.data.data)).catch(()=>{});},[open]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reviewing,setReviewing]=useState(null);
  const [reviewMessage,setReviewMessage]=useState(null);
  const [activeTrackingMatchId, setActiveTrackingMatchId] = useState(null);

  const fetchMatches = async (showLoading = false) => {
    try {
      if(showLoading) setLoading(true);
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

  useEffect(() => {
    if (open && requestId) {
      fetchMatches(true);
    } else {
      setData(null);
      setActiveTrackingMatchId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId]);

  useEffect(() => {
    if (!open || !requestId) return;
    const timer = setInterval(fetchMatches, 15000);
    return () => clearInterval(timer);
  }, [open, requestId]);


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
        {reviewMessage && <Alert severity={reviewMessage.type} sx={{mb:2}}>{reviewMessage.text}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="error" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Box>
            {data.request.requester_user_id === user?.id && ['active','matching'].includes(data.request.status) && <Box sx={{mb:2}}>
              <TextField select label="Urgency" value={urgency} onChange={e=>setUrgency(e.target.value)}>{['Normal','Urgent','Critical'].map(u=><MenuItem key={u} value={u}>{u}</MenuItem>)}</TextField>
              <Button onClick={async()=>{try{await api.patch(`/blood-requests/${requestId}`,{urgency});fetchMatches();}catch(e){setError(e.response?.data?.message||'Update failed.');}}}>Update urgency</Button>
              <Button color="error" onClick={async()=>{try{await api.patch(`/blood-requests/${requestId}/status`,{status:'cancelled'});fetchMatches();}catch(e){setError(e.response?.data?.message||'Cancellation failed.');}}}>Cancel request</Button>
              <TextField select fullWidth sx={{mt:2}} label="Assign an NGO" value={ngoId} onChange={e=>setNgoId(e.target.value)}><MenuItem value="">Select a verified NGO</MenuItem>{ngos.map(n=><MenuItem key={n.id} value={n.id}>{n.ngo_name}</MenuItem>)}</TextField>
              <Button disabled={!ngoId} onClick={async()=>{try{await api.post(`/blood-requests/${requestId}/assign-ngo`,{ngoId});setNgoId('');}catch(e){setError(e.response?.data?.message||'Assignment failed.');}}}>Assign coordination</Button>
            </Box>}
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
                      {match.matchStatus === 'accepted' && <Typography variant="body2">Your decision: {match.requesterDecision}</Typography>}
                      {match.matchStatus === 'accepted' && match.requesterDecision === 'pending' && data.request.requester_user_id === user?.id && ['active','matching'].includes(data.request.status) && (
                        <Box sx={{mt:1}}>
                          <Typography variant="caption" display="block">Approving shares the patient name, request contact number and destination with this donor.</Typography>
                          {['approved','rejected'].map(decision=><Button key={decision} disabled={Boolean(reviewing)} color={decision==='approved'?'success':'error'} onClick={async()=>{
                            setReviewing(match.matchId);setReviewMessage(null);
                            try {const response=await api.patch(`/matches/${match.matchId}/review`,{decision});setReviewMessage({type:'success',text:response.data.message});await fetchMatches();}
                            catch(e){setReviewMessage({type:'error',text:e.response?.data?.message||'Could not review donor.'});}
                            finally{setReviewing(null);}
                          }}>{decision==='approved'?'Approve & share contact':'Reject donor'}</Button>)}
                        </Box>
                      )}
                      {match.matchStatus === 'accepted' && match.requesterDecision === 'approved' && (
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
                      <LiveTrackerMap matchId={match.matchId} hospitalLat={data.request.latitude} hospitalLng={data.request.longitude} />
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
