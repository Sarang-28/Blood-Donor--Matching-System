import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

import AdminSidebar from "../components/AdminSidebar";

const MotionCard = motion.create(Card);

function AdminDashboard() {
  const stats = [
    {
      title: "Registered Users",
      value: "12,540",
      icon: <PeopleIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #1976D2, #63A4FF)",
    },
    {
      title: "Registered Donors",
      value: "8,420",
      icon: <FavoriteIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #E5384D, #FF6B6B)",
    },
    {
      title: "Hospitals",
      value: "128",
      icon: <LocalHospitalIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #2E7D32, #81C784)",
    },
    {
      title: "Active Requests",
      value: "34",
      icon: <NotificationsActiveIcon sx={{ fontSize: 40, color: "#fff" }} />,
      color: "linear-gradient(135deg, #F57C00, #FFB74D)",
    },
  ];

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
            System Overview
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              Super Admin
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {stats.map((item, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
              <MotionCard
                elevation={0}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(17,12,46,0.12)" }}
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  cursor: "default",
                }}
              >
                <CardContent sx={{ display: "flex", alignItems: "center", p: 3 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
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
                      {item.value}
                    </Typography>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Recent Registrations / Verifications */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Pending Verifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center", fontStyle: "italic" }}>
                [Placeholder: List of Hospitals/NGOs awaiting admin approval]
              </Typography>
            </Paper>
          </Grid>

          {/* Emergency Requests */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Critical Blood Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center", fontStyle: "italic" }}>
                [Placeholder: List of ongoing emergency blood requests]
              </Typography>
            </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Recently Registered Users
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center", fontStyle: "italic" }}>
                [Placeholder: Feed of new users joining the platform]
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Recent Blood Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center", fontStyle: "italic" }}>
                [Placeholder: Feed of recent non-emergency requests]
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
