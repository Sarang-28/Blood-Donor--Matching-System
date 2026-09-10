import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import RequestCard from '../components/RequestCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = ['Normal', 'Urgent', 'Critical'];

export default function HospitalDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // New Request Form
  const [newRequest, setNewRequest] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    urgency: 'Urgent',
    locationName: profile?.address || 'Pune, Maharashtra',
    contactPhone: profile?.emergency_contact || '',
    notes: '',
  });

  const fetchHospitalRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/blood-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load hospital requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...newRequest,
        hospitalName: profile?.hospital_name || 'City Hospital',
        unitsRequired: parseInt(newRequest.unitsRequired, 10),
      };

      const res = await api.post('/blood-requests', payload);
      const created = res.data.data?.request || res.data.data;

      setRequests((prev) => [created, ...prev]);
      setDialogOpen(false);
      setAlertMsg({ type: 'success', text: 'Emergency blood request published! Matching engine alerted nearby donors.' });
      setTimeout(() => setAlertMsg(null), 5000);

      // Reset form
      setNewRequest({
        patientName: '',
        bloodGroup: 'O+',
        unitsRequired: 1,
        urgency: 'Urgent',
        locationName: profile?.address || 'Pune, Maharashtra',
        contactPhone: profile?.emergency_contact || '',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to create request:', err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit blood request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', background: '#F6F7FB', minHeight: '100vh' }}>
      <Sidebar role="hospital" />

      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            component={motion.h4}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="h4"
            sx={{ fontWeight: 'bold' }}
          >
            Hospital Blood Operations
          </Typography>

          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 700, px: 2.5, py: 1 }}
          >
            Create Emergency Request
          </Button>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Publish urgent requirements and receive hyperlocal donor matches instantaneously.
        </Typography>

        {alertMsg && (
          <Alert severity={alertMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
            {alertMsg.text}
          </Alert>
        )}

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Requests"
              value={requests.length}
              icon={<LocalHospitalIcon sx={{ fontSize: 28 }} />}
              subtitle="Hospital queue"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Critical Urgency"
              value={requests.filter((r) => r.urgency === 'Critical').length}
              color="error.main"
              icon={<WarningIcon sx={{ fontSize: 28, color: '#D32F2F' }} />}
              subtitle="Immediate response"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Potential Donors"
              value="42"
              icon={<PeopleAltIcon sx={{ fontSize: 28 }} />}
              subtitle="Within 15km perimeter"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Verification Status"
              value="Verified"
              icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#2E7D32' }} />}
              subtitle="Accredited Facility"
            />
          </Grid>
        </Grid>

        {/* Active Requests List */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Active Blood Requests
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="error" />
          </Box>
        ) : requests.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No active blood requests. Click "Create Emergency Request" to post one.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {requests.map((req) => (
              <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                <RequestCard request={req} userRole="hospital" />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Request Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Post Urgent Blood Request</DialogTitle>
          <form onSubmit={handleCreateRequest}>
            <DialogContent>
              <TextField
                fullWidth
                label="Patient Name"
                margin="normal"
                required
                value={newRequest.patientName}
                onChange={(e) => setNewRequest({ ...newRequest, patientName: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    margin="normal"
                    required
                    value={newRequest.bloodGroup}
                    onChange={(e) => setNewRequest({ ...newRequest, bloodGroup: e.target.value })}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <MenuItem key={bg} value={bg}>
                        {bg}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Units Required"
                    margin="normal"
                    required
                    inputProps={{ min: 1 }}
                    value={newRequest.unitsRequired}
                    onChange={(e) => setNewRequest({ ...newRequest, unitsRequired: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Urgency Level"
                    margin="normal"
                    required
                    value={newRequest.urgency}
                    onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                  >
                    {URGENCIES.map((u) => (
                      <MenuItem key={u} value={u}>
                        {u}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    margin="normal"
                    required
                    value={newRequest.contactPhone}
                    onChange={(e) => setNewRequest({ ...newRequest, contactPhone: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Location / Area"
                margin="normal"
                required
                value={newRequest.locationName}
                onChange={(e) => setNewRequest({ ...newRequest, locationName: e.target.value })}
              />

              <TextField
                fullWidth
                label="Medical Notes / Instructions (Optional)"
                margin="normal"
                multiline
                rows={2}
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={submitting}
                sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                {submitting ? <CircularProgress size={22} color="inherit" /> : 'Broadcast Emergency'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}
