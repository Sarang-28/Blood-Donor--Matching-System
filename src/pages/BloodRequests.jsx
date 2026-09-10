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
} from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

function BloodRequests({ role }) {
  const requests = [
    {
      bloodGroup: "O+",
      hospital: "City Care Hospital",
      location: "Pimpri, Pune",
      units: "2 Units",
      urgency: "Urgent",
    },
    {
      bloodGroup: "B+",
      hospital: "LifeLine Hospital",
      location: "Wakad, Pune",
      units: "1 Unit",
      urgency: "Normal",
    },
    {
      bloodGroup: "A-",
      hospital: "Ruby Hospital",
      location: "Pune",
      units: "3 Units",
      urgency: "Urgent",
    },
  ];

  const [filterGroup, setFilterGroup] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const filteredRequests = requests.filter((req) => {
    return (
      (filterGroup === "" || req.bloodGroup === filterGroup) &&
      (filterUrgency === "" || req.urgency === filterUrgency) &&
      (searchLocation === "" || req.location.toLowerCase().includes(searchLocation.toLowerCase()))
    );
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
        Blood Requests
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View and manage emergency blood requests.
      </Typography>

      <Card sx={{ mb: 4, p: 2, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <Grid container spacing={2}>
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
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Urgency"
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Location"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              size="small"
              placeholder="Search by area..."
            />
          </Grid>
        </Grid>
      </Card>

      {filteredRequests.map((request, index) => (
        <Card
          key={index}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: "0 8px 24px rgba(17,12,46,0.06)",
            borderLeft: `6px solid ${request.urgency === "Urgent" ? "#E5384D" : "#F57C00"}`
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
            <Box sx={{ textAlign: "center", minWidth: 80 }}>
              <BloodtypeIcon sx={{ fontSize: 48, color: request.urgency === "Urgent" ? "error.main" : "warning.main" }} />
              <Typography variant="h6" fontWeight="bold">{request.bloodGroup}</Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Required: {request.units}
              </Typography>

              <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <LocalHospitalIcon sx={{ fontSize: 18 }} />
                {request.hospital}
              </Typography>
              <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 18 }} />
                {request.location}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <Chip
                icon={<AccessTimeIcon />}
                label={request.urgency}
                color={request.urgency === "Urgent" ? "error" : "warning"}
                variant="outlined"
              />
              <Button variant="contained" color="primary">
                Fulfill Request
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
      
      {filteredRequests.length === 0 && (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          No requests found matching your filters.
        </Typography>
      )}
    </Box>
    </Box>
  );
}

export default BloodRequests;