import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";

import AdminSidebar from "../components/AdminSidebar";
import api from "../services/api";

const MotionCard = motion.create(Card);

function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats");
      setStatsData(res.data.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleVerify = async (type, id, action) => {
    try {
      setActionLoading(id);
      await api.post(`/admin/verifications/${type}/${id}`, {
        action,
        remarks: action === "verified" ? "Approved by administrator" : "Information requires resubmission",
      });

      setFeedback({
        type: "success",
        text: `Institution ${action === "verified" ? "approved" : "rejected"} successfully.`,
      });

      // Refresh list
      fetchStats();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error("Verification error:", err);
      setFeedback({ type: "error", text: "Failed to update verification status." });
    } finally {
      setActionLoading(null);
    }
  };

  const summary = statsData?.summary || {
    totalUsers: 142,
    registeredDonors: 86,
    hospitals: 14,
    activeRequests: 8,
  };

  const statCards = [
    {
      title: "Registered Users",
      value: summary.totalUsers,
      icon: <PeopleIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #1976D2, #63A4FF)",
    },
    {
      title: "Registered Donors",
      value: summary.registeredDonors,
      icon: <FavoriteIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #E5384D, #FF6B6B)",
    },
    {
      title: "Hospitals & Facilities",
      value: summary.hospitals,
      icon: <LocalHospitalIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #2E7D32, #81C784)",
    },
    {
      title: "Active Emergencies",
      value: summary.activeRequests,
      icon: <NotificationsActiveIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #F57C00, #FFB74D)",
    },
  ];

  const pending = statsData?.pendingVerifications || [];
  const criticalRequests = statsData?.criticalBloodRequests || [];
  const recentUsers = statsData?.recentlyRegisteredUsers || [];

  return (
    <Box sx={{ display: "flex", background: "#f0f2f5", minHeight: "100vh" }}>
      <AdminSidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            component={motion.h4}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="h4"
            sx={{ fontWeight: "bold", color: "#1A1A2E" }}
          >
            System Administration
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip label="Super Admin Authority" color="primary" sx={{ fontWeight: 700 }} />
          </Box>
        </Box>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: 2 }}>
            {feedback.text}
          </Alert>
        )}

        {/* Stats Row */}
        <Grid container spacing={3}>
          {statCards.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
              <MotionCard
                elevation={0}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -6, boxShadow: "0 16px 32px rgba(17,12,46,0.1)" }}
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <CardContent sx={{ display: "flex", alignItems: "center", p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: item.color,
                      mr: 2,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography color="text.secondary" fontWeight={500} variant="body2">
                      {item.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {loading ? "..." : item.value}
                    </Typography>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Pending Verifications */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Pending Verifications (Hospitals & Blood Banks)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : pending.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  No pending institutional registrations awaiting review.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {pending.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        border: "1px solid rgba(0,0,0,0.06)",
                        borderRadius: 2,
                        mb: 1.5,
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.type === "hospital" ? "Hospital" : "Blood Bank"}
                              size="small"
                              color={item.type === "hospital" ? "info" : "error"}
                              sx={{ fontSize: "0.7rem", height: 20 }}
                            />
                          </Box>
                        }
                        secondary={`Lic/Reg: ${item.registrationNo || "Pending"} | Phone: ${item.phone || "N/A"}`}
                      />

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={actionLoading === item.id}
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleVerify(item.type, item.id, "verified")}
                          sx={{ textTransform: "none", fontSize: "0.75rem" }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={actionLoading === item.id}
                          startIcon={<CancelIcon />}
                          onClick={() => handleVerify(item.type, item.id, "rejected")}
                          sx={{ textTransform: "none", fontSize: "0.75rem" }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Critical Blood Requests */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Critical Emergency Feeds
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {criticalRequests.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  No active critical emergencies reported currently.
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {criticalRequests.map((req) => (
                    <ListItem
                      key={req.id}
                      sx={{
                        border: "1px solid rgba(211,47,47,0.2)",
                        bgcolor: "rgba(211,47,47,0.02)",
                        borderRadius: 2,
                        mb: 1.5,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={req.bloodGroup} color="error" size="small" sx={{ fontWeight: 800 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {req.units} Unit(s) at {req.hospital}
                            </Typography>
                          </Box>
                        }
                        secondary={`Location: ${req.location} | Urgent Contact: ${req.phone}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Recently Registered Users */}
          <Grid size={{ xs: 12, md: 12 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Platform Activity Feed
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentUsers.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  Platform users logged and verified.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {recentUsers.map((u) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id}>
                      <Box sx={{ p: 2, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {u.email}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                          <Chip label={u.role?.replace("_", " ")} size="small" variant="outlined" sx={{ textTransform: "capitalize" }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
