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
} from "@mui/material";
import { motion } from "framer-motion";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Sidebar from "../components/Sidebar";

function Profile({ role }) {
  const getProfileFields = () => {
    switch (role) {
      case "donor":
        return [
          { label: "Full Name", defaultValue: "Rahul Sharma" },
          { label: "Blood Group", defaultValue: "O+" },
          { label: "Age", defaultValue: "28" },
          { label: "Weight (kg)", defaultValue: "72" },
          { label: "Phone Number", defaultValue: "+91 9876543210" },
          { label: "Address", defaultValue: "Pimpri, Pune" },
        ];
      case "hospital":
        return [
          { label: "Hospital Name", defaultValue: "City Care Hospital" },
          { label: "License Number", defaultValue: "LIC-1029384" },
          { label: "Emergency Contact", defaultValue: "+91 8000123456" },
          { label: "Speciality", defaultValue: "General, Trauma" },
          { label: "Address", defaultValue: "Wakad, Pune" },
        ];
      case "patient":
        return [
          { label: "Full Name", defaultValue: "Ananya Desai" },
          { label: "Blood Group", defaultValue: "A-" },
          { label: "Medical Condition", defaultValue: "Anemia" },
          { label: "Attending Doctor", defaultValue: "Dr. Kulkarni" },
          { label: "Phone Number", defaultValue: "+91 9123456789" },
          { label: "Address", defaultValue: "Baner, Pune" },
        ];
      case "ngo":
        return [
          { label: "NGO Name", defaultValue: "LifeSavers India" },
          { label: "Registration No.", defaultValue: "REG-982347" },
          { label: "Coordinator Name", defaultValue: "Suresh Pillai" },
          { label: "Contact Number", defaultValue: "+91 9876500000" },
          { label: "Areas of Operation", defaultValue: "Pune, Mumbai" },
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
          My Profile
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Manage your personal information and account settings.
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                borderRadius: 3,
                boxShadow: "0 8px 24px rgba(17,12,46,0.06)",
                textAlign: "center",
                p: 3,
              }}
            >
              <CardContent>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "primary.main",
                  }}
                >
                  <AccountCircleIcon sx={{ fontSize: 80 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  {fields[0]?.defaultValue}
                </Typography>
                <Typography color="text.secondary" textTransform="capitalize" sx={{ mt: 0.5 }}>
                  {role} Account
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Button variant="outlined" fullWidth sx={{ mb: 1 }}>
                  Change Password
                </Button>
                <Button variant="text" color="error" fullWidth>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{
                borderRadius: 3,
                boxShadow: "0 8px 24px rgba(17,12,46,0.06)",
                p: 2,
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  Profile Information
                </Typography>

                <Grid container spacing={3}>
                  {fields.map((field, index) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <TextField
                        fullWidth
                        label={field.label}
                        defaultValue={field.defaultValue}
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                  <Button variant="contained" size="large">
                    Save Changes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Profile;
