import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';
import Navbar from '../components/Navbar';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Emergency() {
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 2,
    urgency: 'Critical',
    hospitalName: 'Emergency Clinic',
    locationName: 'Pune, Maharashtra',
    contactPhone: '',
    notes: 'URGENT SOS: Critical patient in emergency room.',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setResult(null);
      const res = await api.post('/blood-requests', formData);
      setResult({
        type: 'success',
        text: `Emergency broadcast active! Hyperlocal matching identified donors in the vicinity.`,
      });
    } catch (err) {
      setResult({
        type: 'error',
        text: err.response?.data?.message || 'Emergency broadcast failed. Please contact hospitals directly.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff5f5' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 14, pb: 6 }}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 50px rgba(211, 47, 47, 0.15)',
            border: '2px solid #D32F2F',
            p: 2,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                  Critical SOS Blood Request
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trigger instant SMS and push notifications to all compatible donors within 30km.
                </Typography>
              </Box>
            </Box>

            {result && (
              <Alert severity={result.type} sx={{ mb: 3, borderRadius: 2 }}>
                {result.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Hospital Name"
                    required
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    required
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <MenuItem key={bg} value={bg}>
                        {bg}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Units Needed"
                    required
                    inputProps={{ min: 1 }}
                    value={formData.unitsRequired}
                    onChange={(e) => setFormData({ ...formData, unitsRequired: parseInt(e.target.value, 10) || 1 })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Urgent Contact Phone"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Location / Landmark"
                    required
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Critical Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="error"
                size="large"
                disabled={loading}
                startIcon={<SendIcon />}
                sx={{
                  mt: 3,
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(211, 47, 47, 0.4)',
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'BROADCAST EMERGENCY SOS'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
