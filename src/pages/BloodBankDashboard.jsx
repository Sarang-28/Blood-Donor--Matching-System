import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodBankDashboard({ role = 'blood_bank' }) {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Manual adjustment dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [unitInput, setUnitInput] = useState(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [invRes, reqRes] = await Promise.all([
        api.get('/blood-banks/inventory/me'),
        api.get('/blood-requests'),
      ]);

      setInventory(invRes.data.data || []);
      setRequests(reqRes.data.data || []);
    } catch (err) {
      console.error('Failed to load blood bank data:', err);
      // Initialize with default 0 if backend table empty
      setInventory(
        BLOOD_GROUPS.map((bg) => ({ bloodGroup: bg, units: 0 }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUnitChange = async (group, newUnits) => {
    if (newUnits < 0) return;
    try {
      setUpdatingGroup(group);
      await api.put('/blood-banks/inventory/me', {
        bloodGroup: group,
        unitsAvailable: newUnits,
      });

      setInventory((prev) =>
        prev.map((item) =>
          item.bloodGroup === group ? { ...item, units: newUnits } : item
        )
      );
      setFeedback({ type: 'success', text: `Updated ${group} stock to ${newUnits} units.` });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to update inventory:', err);
      setFeedback({ type: 'error', text: 'Could not update inventory on server.' });
    } finally {
      setUpdatingGroup(null);
    }
  };

  const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
  const criticalCount = requests.filter((r) => r.urgency === 'Critical').length;

  return (
    <Box sx={{ display: 'flex', background: '#F6F7FB', minHeight: '100vh' }}>
      <Sidebar role={role} />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, mt: { xs: 7, sm: 8 } }}>
        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{ fontWeight: 'bold', mb: 1 }}
        >
          Blood Bank Inventory & Dispatch Center
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Maintain emergency blood supplies and coordinate real-time hospital fulfillment.
        </Typography>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: 2 }}>
            {feedback.text}
          </Alert>
        )}

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Units Available"
              value={totalUnits}
              icon={<BloodtypeIcon sx={{ fontSize: 28 }} />}
              subtitle="Across all 8 blood groups"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Critical Requests"
              value={criticalCount}
              color="error.main"
              icon={<WarningAmberIcon sx={{ fontSize: 28, color: '#D32F2F' }} />}
              subtitle="Requiring immediate dispatch"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Area Requests"
              value={requests.length}
              icon={<LocalHospitalIcon sx={{ fontSize: 28 }} />}
              subtitle="Hospitals & patients"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Operational Status"
              value="Active"
              icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#2E7D32' }} />}
              subtitle="24/7 Verified Emergency Center"
            />
          </Grid>
        </Grid>

        {/* Blood Inventory Grid */}
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.04)', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Blood Stock Levels
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Increment or decrement units as blood is received or dispatched.
              </Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="error" />
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {inventory.map((item) => {
                const isLow = (item.units || 0) < 3;
                const isUpdating = updatingGroup === item.bloodGroup;

                return (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.bloodGroup}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: 'center',
                        bgcolor: isLow ? 'rgba(211, 47, 47, 0.04)' : '#fafafa',
                        border: '1.5px solid',
                        borderColor: isLow ? 'rgba(211, 47, 47, 0.3)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 800,
                            color: 'error.main',
                            bgcolor: 'rgba(211, 47, 47, 0.1)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                          }}
                        >
                          {item.bloodGroup}
                        </Typography>
                        {isLow ? (
                          <Chip label="Low Stock" size="small" color="error" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip label="Sufficient" size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        )}
                      </Box>

                      <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: 'text.primary' }}>
                        {item.units || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Units Available
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          disabled={isUpdating || (item.units || 0) <= 0}
                          onClick={() => handleUnitChange(item.bloodGroup, (item.units || 0) - 1)}
                          sx={{ bgcolor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)' }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={isUpdating}
                          onClick={() => {
                            setSelectedGroup(item.bloodGroup);
                            setUnitInput(item.units || 0);
                            setDialogOpen(true);
                          }}
                          sx={{ textTransform: 'none', px: 1, fontSize: '0.75rem', borderRadius: 2 }}
                        >
                          Set
                        </Button>
                        <IconButton
                          size="small"
                          disabled={isUpdating}
                          onClick={() => handleUnitChange(item.bloodGroup, (item.units || 0) + 1)}
                          sx={{ bgcolor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: 'error.main' }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Card>

        {/* Set Stock Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Update {selectedGroup} Stock
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the exact count of available {selectedGroup} units in the facility.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              type="number"
              label="Units in Stock"
              value={unitInput}
              onChange={(e) => setUnitInput(parseInt(e.target.value, 10) || 0)}
              inputProps={{ min: 0 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleUnitChange(selectedGroup, unitInput);
                setDialogOpen(false);
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Save Stock Level
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
