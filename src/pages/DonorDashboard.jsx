import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import RequestCard from '../components/RequestCard';
import LiveLocationBroadcaster from '../components/LiveLocationBroadcaster';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { directionsUrl } from '../config/maps';

export default function DonorDashboard() {
  const { profile, user } = useAuth();
  const [donorProfile,setDonorProfile]=useState(profile);
  const [history,setHistory]=useState([]);
  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(profile?.availability_status === 'Available');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch personal match alerts instead of all public requests
        const [res,p,h] = await Promise.all([api.get('/matches/my-alerts'),api.get('/donors/profile'),api.get('/donors/history')]);
        setDonorProfile(p.data.data);setIsAvailable(p.data.data.availability_status==='Available');setHistory(h.data.data);
        setRequests(res.data.data || []);
      } catch (err) {
        setActionMsg({type:'error',text:'Could not load donor requests. Please retry.'});
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
    const timer=setInterval(fetchRequests,15000);
    return ()=>clearInterval(timer);
  }, []);

  const handleToggleAvailability = async (e) => {
    const nextStatus = e.target.checked ? 'Available' : 'Unavailable';
    try {
      await api.patch('/donors/availability', { status: nextStatus });
      setIsAvailable(e.target.checked);
      setActionMsg({ type: 'success', text: `Availability status updated to ${nextStatus}.` });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update availability:', err);
      setActionMsg({ type: 'error', text: 'Failed to update availability status.' });
    }
  };

  const handleRespond = async (req) => {
    try {
      const res = await api.patch(`/matches/${req.matchId}/respond`, { response: 'accepted' });
      const { otpCode } = res.data.data;

      // Update local state to hide or mark the match as accepted
      setRequests(requests.map(r => r.matchId === req.matchId ? { ...r, matchStatus: 'accepted', requesterDecision: 'pending', otpCode } : r));

      setActionMsg({
        type: 'success',
        text: `Offer sent. Waiting for requester approval. Save your hospital confirmation code: ${otpCode}.`,
      });
    } catch (err) {
      console.error('Failed to respond to match:', err);
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to respond to the match.',
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', background: '#F6F7FB', minHeight: '100vh' }}>
      <Sidebar role="donor" />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, mt: { xs: 7, sm: 8 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            component={motion.h4}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="h4"
            sx={{ fontWeight: 'bold' }}
          >
            Donor Portal
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={isAvailable}
                onChange={handleToggleAvailability}
                color="error"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {isAvailable ? '🟢 Ready to Donate' : '⚪ Unavailable'}
              </Typography>
            }
          />
        </Box>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Track urgent blood matching requests and manage your voluntary donation profile.
        </Typography>

        {actionMsg && (
          <Alert severity={actionMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
            {actionMsg.text}
          </Alert>
        )}

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Your Blood Group"
              value={profile?.blood_group || 'O+'}
              icon={<BloodtypeIcon sx={{ fontSize: 28 }} />}
              subtitle="Registered group"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Nearby Requests"
              value={requests.length}
              icon={<FavoriteIcon sx={{ fontSize: 28 }} />}
              subtitle="Within your area"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Donation Cooldown"
              value={donorProfile?.eligible ? 'Interval clear' : 'Not eligible'}
              icon={<EventAvailableIcon sx={{ fontSize: 28, color: '#2E7D32' }} />}
              subtitle="Final eligibility requires clinical assessment"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Donations"
              value={profile?.total_donations || 0}
              icon={<VerifiedUserIcon sx={{ fontSize: 28 }} />}
              subtitle="Lives impacted"
            />
          </Grid>
        </Grid>

        <Typography variant="h6">Verified donation history</Typography>
        {history.length ? history.map(d=><Typography key={d.id}>{new Date(d.donation_date).toLocaleDateString()} · {d.hospital_name} · {d.units_donated} unit(s)</Typography>) : <Typography>No verified donations yet.</Typography>}
        {/* Emergency Requests Section */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Nearby Emergency Requests
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="error" />
          </Box>
        ) : requests.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No emergency requests currently active in your area.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid size={{ xs: 12, md: 6 }} key={req.matchId}>
                <RequestCard
                   request={req}
                   onRespond={req.matchStatus === 'notified' ? handleRespond : null}
                   userRole="donor"
                />
                {req.matchStatus === 'notified' && <Button onClick={async()=>{try{await api.patch(`/matches/${req.matchId}/respond`,{response:'declined'});setRequests(rows=>rows.map(r=>r.matchId===req.matchId?{...r,matchStatus:'declined'}:r));}catch(e){setActionMsg({type:'error',text:e.response?.data?.message||'Could not decline.'});}}}>Decline invitation</Button>}
                {req.matchStatus === 'accepted' && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity={req.requesterDecision==='approved'?'success':'info'} sx={{ mb: 2 }}>
                      {req.requesterDecision==='approved'?'Your offer has been approved.':req.requesterDecision==='rejected'?'The requester did not select your offer.':'The requester has been notified. Waiting for approval before sharing contact details.'}
                    </Alert>
                    {req.contactDetails && <Card sx={{p:2,mb:2}}>
                      <Typography variant="h6">Approved contact details</Typography>
                      <Typography>Patient: {req.contactDetails.patientName}</Typography>
                      <Typography>Destination: {req.contactDetails.hospitalName} — {req.contactDetails.locationName}</Typography>
                      <Button component="a" href={`tel:${req.contactDetails.contactPhone}`}>Call {req.contactDetails.contactPhone}</Button>
                      <Button component="a" href={directionsUrl(req.contactDetails.latitude,req.contactDetails.longitude)} target="_blank" rel="noopener noreferrer">Directions to destination</Button>
                      <LiveLocationBroadcaster matchId={req.matchId} />
                    </Card>}
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
