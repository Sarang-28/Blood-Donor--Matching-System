import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import RequestCard from "../components/RequestCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCIES = ["Normal", "Urgent", "Critical"];

function BloodRequests({ role }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "O+",
    unitsRequired: 1,
    urgency: "Urgent",
    hospitalName: profile?.hospital_name || profile?.blood_bank_name || "City General Hospital",
    locationName: profile?.address || "Pune, Maharashtra",
    contactPhone: profile?.emergency_contact || profile?.contact_number || "",
    notes: "",
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/blood-requests");
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Failed to load blood requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/blood-requests", {
        ...formData,
        role: role || "patient",
        unitsRequired: parseInt(formData.unitsRequired, 10),
      });

      const newReq = res.data.data?.request || res.data.data;
      setRequests((prev) => [newReq, ...prev]);
      setDialogOpen(false);
      setAlertMsg({ type: "success", text: "Emergency blood request posted successfully!" });
      setTimeout(() => setAlertMsg(null), 4000);
    } catch (err) {
      console.error("Failed to create request:", err);
      setAlertMsg({ type: "error", text: err.response?.data?.message || "Failed to post request." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const bg = req.bloodGroup || req.blood_group || "";
    const urg = req.urgency || "";
    const loc = req.locationName || req.location_name || req.location || "";

    return (
      (filterGroup === "" || bg === filterGroup) &&
      (filterUrgency === "" || urg === filterUrgency) &&
      (searchLocation === "" || loc.toLowerCase().includes(searchLocation.toLowerCase()))
    );
  });

  return (
    <Box sx={{ display: "flex", background: "#F6F7FB", minHeight: "100vh" }}>
      <Sidebar role={role} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: { xs: 7, sm: 8 },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography
            component={motion.h4}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="h4"
            sx={{ fontWeight: "bold" }}
          >
            Blood Requests
          </Typography>

          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Post Request
          </Button>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          View and manage emergency blood requests across the region.
        </Typography>

        {alertMsg && (
          <Alert severity={alertMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
            {alertMsg.text}
          </Alert>
        )}

        {/* Filter Controls */}
        <Card sx={{ mb: 4, p: 2.5, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Filter by Blood Group"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <MenuItem value="">All Blood Groups</MenuItem>
                {BLOOD_GROUPS.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Filter by Urgency"
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
              >
                <MenuItem value="">All Urgencies</MenuItem>
                {URGENCIES.map((urg) => (
                  <MenuItem key={urg} value={urg}>
                    {urg}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search by Location / Area"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="e.g. Pune, Pimpri"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Request Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress color="error" />
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No matching blood requests found for the selected filters.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredRequests.map((req) => (
              <Grid size={{ xs: 12, md: 6 }} key={req.id || Math.random()}>
                <RequestCard request={req} userRole={role} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Post Request Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Raise Emergency Blood Request</DialogTitle>
          <form onSubmit={handleCreateRequest}>
            <DialogContent>
              <TextField
                fullWidth
                label="Patient Name"
                margin="normal"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    margin="normal"
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
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Units Required"
                    margin="normal"
                    required
                    inputProps={{ min: 1 }}
                    value={formData.unitsRequired}
                    onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Urgency"
                    margin="normal"
                    required
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
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
                    label="Emergency Phone"
                    margin="normal"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Hospital / Clinic Name"
                margin="normal"
                required
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
              />

              <TextField
                fullWidth
                label="Location / Area"
                margin="normal"
                required
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={submitting}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : "Submit Request"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}

export default BloodRequests;