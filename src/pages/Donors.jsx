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
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CircleIcon from "@mui/icons-material/Circle";
import { useState } from "react";

import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";

function Donors({ role }) {
  const donors = [
    {
      name: "Rahul Sharma",
      bloodGroup: "O+",
      location: "Pimpri, Pune",
      status: "Available",
    },
    {
      name: "Sneha Patil",
      bloodGroup: "B+",
      location: "Wakad, Pune",
      status: "Available",
    },
    {
      name: "Amit Kulkarni",
      bloodGroup: "A-",
      location: "Akurdi, Pune",
      status: "Available",
    },
    {
      name: "Priya Joshi",
      bloodGroup: "AB+",
      location: "Baner, Pune",
      status: "Unavailable",
    },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "" || donor.bloodGroup === filterGroup;
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
          Available Donors
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Find nearby blood donors and connect with them during emergencies.
        </Typography>

        <Card sx={{ mb: 4, p: 2, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }
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
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                  <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {filteredDonors.map((donor, index) => (
          <Card
            key={donor.name}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            sx={{
              mb: 2,
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(17,12,46,0.06)",
              position: "relative",
              overflow: "visible",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "primary.main",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {donor.name.charAt(0)}
                </Avatar>
                <CircleIcon
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    fontSize: 18,
                    color: donor.status === "Available" ? "#4caf50" : "#9e9e9e",
                    bgcolor: "#fff",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {donor.name}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
                >
                  <LocationOnIcon sx={{ fontSize: 18 }} />
                  {donor.location}
                </Typography>
              </Box>

              <Chip
                icon={<FavoriteIcon />}
                label={donor.bloodGroup}
                color="error"
                sx={{
                  fontWeight: "bold",
                  px: 1,
                  fontSize: "1rem",
                  height: 36,
                  borderRadius: 2
                }}
              />

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, minWidth: 120 }}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color={donor.status === "Available" ? "success.main" : "text.secondary"}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CircleIcon sx={{ fontSize: 10 }} />
                  {donor.status}
                </Typography>

                <Button
                  variant="contained"
                  disabled={donor.status !== "Available"}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  Contact
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}

        {filteredDonors.length === 0 && (
          <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
            No donors found matching your criteria.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default Donors;
