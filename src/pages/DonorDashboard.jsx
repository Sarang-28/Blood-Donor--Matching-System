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
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DonorDashboard() {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(profile?.availability_status === 'Available');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get('/blood-requests');
        setRequests(res.data.data || []);
      } catch (err) {
        console.error('Failed to load emergency blood requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleToggleAvailability = async (e) => {
    const nextStatus = e.target.checked ? 'Available' : 'Unavailable';
    try {
      await api.put('/donors/profile/me', { availabilityStatus: nextStatus });
      setIsAvailable(e.target.checked);
      setActionMsg({ type: 'success', text: `Availability status updated to ${nextStatus}.` });
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update availability:', err);
      setActionMsg({ type: 'error', text: 'Failed to update availability status.' });
    }
  };

  const handleRespond = (req) => {
    setActionMsg({
      type: 'info',
      text: `Thank you! Your donation offer for ${req.blood_group || req.bloodGroup} at ${req.hospital_name || req.hospital} has been notified to the hospital.`,
    });
  };

  return (
    <Box sx={{ display: 'flex', background: '#F6F7FB', minHeight: '100vh' }}>
      <Sidebar role="donor" />

      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
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
              value="Eligible"
              icon={<EventAvailableIcon sx={{ fontSize: 28, color: '#2E7D32' }} />}
              subtitle="90 days interval clear"
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
              <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                <RequestCard request={req} onRespond={handleRespond} userRole="donor" />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
