import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
  { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
  { text: "Donors", icon: <FavoriteIcon />, path: "/admin/donors" },
  { text: "Hospitals", icon: <LocalHospitalIcon />, path: "/admin/hospitals" },
  { text: "Blood Requests", icon: <BloodtypeIcon />, path: "/admin/blood-requests" },
  { text: "Reports", icon: <AssessmentIcon />, path: "/admin/reports" },
  { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
];

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "#1A1A2E",
          color: "#fff",
          borderRight: "none",
        },
      }}
    >
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}
        >
          <span style={{ fontSize: "1.5rem" }}>🛡️</span> Admin Portal
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}>
          System Management
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ px: 2, pt: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          // Exact match for /admin to not incorrectly highlight on other routes
          const isActive =
            item.path === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                  },
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                  },
                  ...(isActive && {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderLeft: "4px solid #fff",
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      fontWeight: isActive ? "bold" : "medium",
                      color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <List sx={{ px: 2, pb: 3 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              "&:hover": {
                bgcolor: "rgba(229, 56, 77, 0.1)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#E5384D", minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{
                primary: {
                  color: "#E5384D",
                  fontWeight: "bold",
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}

export default AdminSidebar;
