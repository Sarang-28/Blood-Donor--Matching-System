
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: "Dashboard", pathId: "dashboard", icon: <DashboardIcon /> },

    ...(role === "donor"
      ? [
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
      ]
      : []),

    ...(role === "hospital"
      ? [
        { text: "Donors", pathId: "donors", icon: <FavoriteIcon /> },
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
      ]
      : []),

    ...(role === "patient"
      ? [
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
        { text: "Donors", pathId: "donors", icon: <FavoriteIcon /> },
      ]
      : []),

    ...(role === "blood_bank" || role === "ngo"
      ? [
        { text: "Inventory", pathId: "inventory", icon: <BloodtypeIcon /> },
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
        { text: "Donors", pathId: "donors", icon: <FavoriteIcon /> },
      ]
      : []),

    { text: "Profile", pathId: "profile", icon: <PersonIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />

      <Box sx={{ px: 2, pt: 1, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", letterSpacing: 1, fontWeight: 600 }}
        >
          MENU
        </Typography>
      </Box>

      <List sx={{ px: 0 }}>
        {menuItems.map((item, index) => {
          const isSelected = location.pathname.includes(item.pathId);
          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(`/${item.pathId}/${role}`);
                }}
                sx={{ position: "relative", overflow: "hidden" }}
              >
                {isSelected && (
                  <Box
                    component={motion.div}
                    layoutId="sidebar-active-bar"
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 4,
                      borderRadius: 4,
                      bgcolor: "primary.main",
                    }}
                  />
                )}

                <ListItemIcon
                  sx={{
                    color: isSelected ? "primary.main" : "text.secondary",
                    transition: "color 0.25s ease, transform 0.25s ease",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "text.primary" : "text.secondary",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </motion.div>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        {user && (
          <Box sx={{ mb: 1.5, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Logged in as
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </Typography>
            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600, textTransform: "uppercase" }}>
              Role: {user.role?.replace("_", " ")}
            </Typography>
          </Box>
        )}
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<SwapHorizIcon />}
          onClick={() => navigate("/roles")}
          sx={{ mb: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Switch Role
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={() => {
            logout();
            navigate("/");
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
