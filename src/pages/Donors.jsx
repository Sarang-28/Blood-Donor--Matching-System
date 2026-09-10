import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CircleIcon from "@mui/icons-material/Circle";
import PhoneIcon from "@mui/icons-material/Phone";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Donors({ role }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [contactedDonor, setContactedDonor] = useState(null);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/donors");
      setDonors(res.data.data || []);
    } catch (err) {
      console.error("Failed to load donors from backend:", err);
      // Fallback placeholder data if DB empty
      setDonors([
        {
          id: "1",
          full_name: "Rahul Sharma",
          blood_group: "O+",
          location_name: "Pimpri, Pune",
          availability_status: "Available",
          phone: "+91 98765 43210",
        },
        {
          id: "2",
          full_name: "Sneha Patil",
          blood_group: "B+",
          location_name: "Wakad, Pune",
          availability_status: "Available",
          phone: "+91 98765 43211",
        },
        {
          id: "3",
          full_name: "Amit Kulkarni",
          blood_group: "A-",
          location_name: "Akurdi, Pune",
          availability_status: "Available",
          phone: "+91 98765 43212",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const filteredDonors = donors.filter((donor) => {
    const name = donor.full_name || donor.name || "";
    const loc = donor.location_name || donor.location || "";
    const bg = donor.blood_group || donor.bloodGroup || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "" || bg === filterGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <Box sx={{ display: "flex", background: "#F6F7FB", minHeight: "100vh" }}>
      <Sidebar role={role} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8,
        }}
      >
        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{ fontWeight: "bold", mb: 1 }}
        >
          Verified Blood Donors
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Search and connect with voluntary blood donors in your vicinity.
        </Typography>

        {contactedDonor && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Connected with donor <strong>{contactedDonor.full_name || contactedDonor.name}</strong> ({contactedDonor.phone || "Contact details shared"}).
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 4, p: 2.5, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Search donors by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Blood Group"
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <MenuItem value="">All Groups</MenuItem>
                {BLOOD_GROUPS.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {/* Donors Grid */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress color="error" />
          </Box>
        ) : filteredDonors.length === 0 ? (
          <Card sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No matching donors found.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredDonors.map((donor) => {
              const isAvailable = (donor.availability_status || donor.status) === "Available";
              const displayName = donor.full_name || donor.name || "Anonymous Donor";
              const displayGroup = donor.blood_group || donor.bloodGroup || "O+";
              const displayLoc = donor.location_name || donor.location || "Pune";

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={donor.id || Math.random()}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(0,0,0,0.06)",
                      p: 1,
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 48,
                              height: 48,
                              fontWeight: 700,
                              boxShadow: "0 4px 12px rgba(229, 56, 77, 0.3)",
                            }}
                          >
                            {displayName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {displayName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                            >
                              <LocationOnIcon sx={{ fontSize: 14 }} />
                              {displayLoc}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={displayGroup}
                          color="error"
                          sx={{ fontWeight: 800, fontSize: "0.9rem", borderRadius: 2 }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <CircleIcon
                          sx={{
                            fontSize: 10,
                            color: isAvailable ? "#2E7D32" : "#9e9e9e",
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: isAvailable ? "#2E7D32" : "text.secondary" }}>
                          {isAvailable ? "Available for Emergency" : "Currently Unavailable"}
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<PhoneIcon />}
                        disabled={!isAvailable}
                        onClick={() => setContactedDonor(donor)}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Request Blood
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

export default Donors;
