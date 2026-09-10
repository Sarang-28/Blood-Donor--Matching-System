import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
} from "@mui/material";
import { motion } from "framer-motion";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Profile({ role }) {
  const { user, profile } = useAuth();
  const [saved, setSaved] = useState(false);

  const getProfileFields = () => {
    switch (role) {
      case "donor":
        return [
          { label: "Full Name", defaultValue: profile?.full_name || "Registered Donor" },
          { label: "Blood Group", defaultValue: profile?.blood_group || "O+" },
          { label: "Age", defaultValue: profile?.age ? profile.age.toString() : "26" },
          { label: "Weight (kg)", defaultValue: profile?.weight_kg ? profile.weight_kg.toString() : "68" },
          { label: "Phone Number", defaultValue: user?.phone || "+91 9876543210" },
          { label: "Address", defaultValue: profile?.location_name || "Pimpri, Pune" },
        ];
      case "hospital":
        return [
          { label: "Hospital Name", defaultValue: profile?.hospital_name || "City Care Hospital" },
          { label: "License Number", defaultValue: profile?.license_number || "LIC-1029384" },
          { label: "Emergency Contact", defaultValue: profile?.emergency_contact || user?.phone || "+91 8000123456" },
          { label: "Speciality", defaultValue: profile?.speciality || "General, Trauma" },
          { label: "Address", defaultValue: profile?.address || "Wakad, Pune" },
        ];
      case "patient":
        return [
          { label: "Full Name", defaultValue: profile?.full_name || "Patient" },
          { label: "Blood Group", defaultValue: profile?.blood_group || "A-" },
          { label: "Medical Condition", defaultValue: profile?.medical_condition || "Under Observation" },
          { label: "Attending Doctor", defaultValue: profile?.attending_doctor || "Dr. Kulkarni" },
          { label: "Phone Number", defaultValue: user?.phone || "+91 9123456789" },
          { label: "Address", defaultValue: profile?.address || "Baner, Pune" },
        ];
      case "blood_bank":
      case "ngo":
        return [
          { label: "Blood Bank Name", defaultValue: profile?.blood_bank_name || "Regional Blood Bank" },
          { label: "Registration / License No.", defaultValue: profile?.license_number || "BB-982347" },
          { label: "Director / In-Charge", defaultValue: profile?.director_name || "Chief Medical Officer" },
          { label: "Contact Number", defaultValue: profile?.contact_number || user?.phone || "+91 9876500000" },
          { label: "Operating Hours", defaultValue: profile?.operating_hours || "24/7" },
          { label: "Facility Address", defaultValue: profile?.address || "Pune, Maharashtra" },
        ];
      default:
        return [];
    }
  };

  const fields = getProfileFields();

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
          Profile Settings
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Manage your contact credentials and institutional details.
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Profile updated successfully.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Avatar & Summary Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, borderRadius: 3, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                  boxShadow: "0 4px 14px rgba(229, 56, 77, 0.35)",
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 70 }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {user?.email || "Account User"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize", mb: 2 }}>
                Role: {role?.replace("_", " ")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Registered on the Hyperlocal Blood Donor Network
              </Typography>
            </Card>
          </Grid>

          {/* Details Form Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Account Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Account Email"
                    value={user?.email || "user@bloodconnect.org"}
                    disabled
                  />
                </Grid>

                {fields.map((field) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={field.label}>
                    <TextField
                      fullWidth
                      label={field.label}
                      defaultValue={field.defaultValue}
                    />
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, textAlign: "right" }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  }}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}
                >
                  Save Profile Changes
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Profile;
