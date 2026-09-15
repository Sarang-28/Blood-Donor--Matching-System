import { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import VerifiedIcon from "@mui/icons-material/Verified";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import SecurityIcon from "@mui/icons-material/Security";
import StorageIcon from "@mui/icons-material/Storage";

import AdminSidebar from "../components/AdminSidebar";
import api from "../services/api";

const MotionCard = motion.create(Card);

function AdminDashboard() {
  const { view = "dashboard" } = useParams();

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Users & Donors view state
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Critical requests view state
  const [criticalReqs, setCriticalReqs] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats");
      setStatsData(res.data.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (roleOverride, searchOverride) => {
    try {
      setUsersLoading(true);
      const activeRole = roleOverride !== undefined ? roleOverride : userRoleFilter;
      const activeSearch = searchOverride !== undefined ? searchOverride : userSearch;

      const params = {};
      if (activeRole) params.role = activeRole;
      if (activeSearch) params.search = activeSearch;

      const res = await api.get("/admin/users", { params });
      setUsersList(res.data.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setFeedback({ type: "error", text: "Failed to load platform users." });
    } finally {
      setUsersLoading(false);
    }
  }, [userRoleFilter, userSearch]);

  const fetchCriticalRequests = useCallback(async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get("/admin/requests/critical");
      setCriticalReqs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch critical requests:", err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (view === "users") {
      fetchUsers(userRoleFilter, userSearch);
    } else if (view === "donors") {
      fetchUsers("donor", userSearch);
    } else if (view === "hospitals") {
      fetchUsers("hospital", userSearch);
    } else if (view === "blood-requests") {
      fetchCriticalRequests();
    }
  }, [view, fetchUsers, fetchCriticalRequests, userRoleFilter, userSearch]);

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

      fetchStats();
      if (view === "hospitals") fetchUsers("hospital", userSearch);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error("Verification error:", err);
      setFeedback({ type: "error", text: "Failed to update verification status." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      setActionLoading(user.id);
      const newStatus = !user.isActive;
      await api.post(`/admin/users/${user.id}/status`, { isActive: newStatus });

      setFeedback({
        type: "success",
        text: `User account ${newStatus ? "activated" : "suspended"} successfully.`,
      });

      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
      );
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Failed to toggle status:", err);
      setFeedback({ type: "error", text: "Failed to update user status." });
    } finally {
      setActionLoading(null);
    }
  };

  const summary = statsData?.summary || {
    totalUsers: 0,
    registeredDonors: 0,
    hospitals: 0,
    activeRequests: 0,
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
  const criticalRequests = statsData?.criticalBloodRequests || criticalReqs || [];
  const recentUsers = statsData?.recentlyRegisteredUsers || statsData?.recentUsers || [];

  // Helper title based on view
  const viewTitles = {
    dashboard: "System Administration Overview",
    users: "User Management",
    donors: "Registered Blood Donors Directory",
    hospitals: "Hospitals & Institutional Partners",
    "blood-requests": "Emergency Blood Requests Monitor",
    reports: "System Analytics & Performance Reports",
    settings: "System Settings & Configuration",
  };

  return (
    <Box sx={{ display: "flex", background: "#f0f2f5", minHeight: "100vh" }}>
      <AdminSidebar />

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, mt: { xs: 7, sm: 8 } }}>
        {/* Top Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography
            component={motion.h4}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            variant="h4"
            sx={{ fontWeight: "bold", color: "#1A1A2E" }}
          >
            {viewTitles[view] || "Admin Portal"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
              label="Super Admin Authority"
              color="primary"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: 2 }}>
            {feedback.text}
          </Alert>
        )}

        {/* 1. USERS OR DONORS VIEW */}
        {(view === "users" || view === "donors") && (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {view === "donors" ? "Registered Blood Donors" : "All Platform Accounts"}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  size="small"
                  placeholder="Search email or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchUsers(view === "donors" ? "donor" : userRoleFilter, userSearch);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {view === "users" && (
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="role-filter-label">Filter Role</InputLabel>
                    <Select
                      labelId="role-filter-label"
                      label="Filter Role"
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                        fetchUsers(e.target.value, userSearch);
                      }}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="donor">Donor</MenuItem>
                      <MenuItem value="patient">Patient</MenuItem>
                      <MenuItem value="hospital">Hospital</MenuItem>
                      <MenuItem value="blood_bank">Blood Bank</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchUsers(view === "donors" ? "donor" : userRoleFilter, userSearch)}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {usersLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : usersList.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                No accounts found matching the criteria.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#FAFAFA" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>User / Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Registered</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersList.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{u.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={u.role?.replace("_", " ")}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: "capitalize" }}
                            color={
                              u.role === "donor"
                                ? "error"
                                : u.role === "hospital"
                                ? "success"
                                : u.role === "admin"
                                ? "primary"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>{u.phone || "N/A"}</TableCell>
                        <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={u.isActive ? "Active" : "Suspended"}
                            size="small"
                            color={u.isActive ? "success" : "error"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          {u.role !== "admin" && (
                            <Button
                              size="small"
                              variant={u.isActive ? "outlined" : "contained"}
                              color={u.isActive ? "error" : "success"}
                              startIcon={u.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                              disabled={actionLoading === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              sx={{ textTransform: "none", fontSize: "0.75rem" }}
                            >
                              {u.isActive ? "Suspend" : "Activate"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* 2. HOSPITALS & VERIFICATIONS VIEW */}
        {view === "hospitals" && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Pending Institutional Verifications
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : pending.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No pending hospital or blood bank verifications at this time.
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
          </Grid>
        )}

        {/* 3. BLOOD REQUESTS MONITOR VIEW */}
        {view === "blood-requests" && (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Real-Time Emergency Blood Requests
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchCriticalRequests}
              >
                Refresh Feeds
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {requestsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
              </Box>
            ) : criticalRequests.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                No active critical emergency requests on the network.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {criticalRequests.map((req) => (
                  <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                    <Paper
                      sx={{
                        p: 2.5,
                        border: "1px solid rgba(211,47,47,0.2)",
                        bgcolor: "rgba(211,47,47,0.02)",
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Chip label={req.bloodGroup || req.blood_group} color="error" sx={{ fontWeight: 800 }} />
                        <Chip
                          label={req.urgency || "Emergency"}
                          size="small"
                          color={req.urgency === "Critical" ? "error" : "warning"}
                        />
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
                        {req.units} Unit(s) Required
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hospital: {req.hospital || "Medical Center"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Location: {req.location || "City Area"} | Contact: {req.phone || "Emergency Line"}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        )}

        {/* 4. REPORTS VIEW */}
        {view === "reports" && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Platform Health & Analytics Summary
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#E3F2FD", borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="h4" fontWeight="bold" color="#1976D2">
                        {summary.totalUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Total Accounts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#FFEBEE", borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="h4" fontWeight="bold" color="#E5384D">
                        {summary.registeredDonors}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Active Donors
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#E8F5E9", borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="h4" fontWeight="bold" color="#2E7D32">
                        {summary.hospitals}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Verified Hospitals
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box sx={{ p: 2, bgcolor: "#FFF3E0", borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="h4" fontWeight="bold" color="#F57C00">
                        {summary.activeRequests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Pending Requests
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    System Architecture Metrics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • <strong>Geospatial Matching Engine:</strong> PostgreSQL PostGIS (ST_DWithin, ST_DistanceSphere) active with GiST spatial indexing.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    • <strong>Authentication:</strong> JSON Web Tokens (HS256) with role-based multi-profile authorization.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    • <strong>Real-Time Alerts:</strong> Multi-channel dispatch via WebSockets, Firebase Cloud Messaging, and Twilio SMS.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* 5. SETTINGS VIEW */}
        {view === "settings" && (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              System Configuration & Security
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2.5, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Administrator Credential Policy
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Super Admin: <strong>admin@bloodmatch.org</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Security Level: Full Platform Management & Institutional Verification Authority
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Token Validity: 7 Days (Rotating Bearer Signature)
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2.5, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <StorageIcon color="success" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Database & Infrastructure
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Backend API: <code>{api.defaults.baseURL || '/api'}</code>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Spatial Engine: PostgreSQL + PostGIS (v3.3)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Connection Pool: Keepalive active (25s connect timeout, 60s idle)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* 6. DEFAULT OVERVIEW DASHBOARD */}
        {view === "dashboard" && (
          <>
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
                                <Chip label={req.bloodGroup || req.blood_group} color="error" size="small" sx={{ fontWeight: 800 }} />
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
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
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
          </>
        )}
      </Box>
    </Box>
  );
}

export default AdminDashboard;
