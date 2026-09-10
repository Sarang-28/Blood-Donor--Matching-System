
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import { motion } from "framer-motion";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonIcon from "@mui/icons-material/Person";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 240;

function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { text: "Dashboard", pathId: "dashboard", icon: <DashboardIcon /> },

    ...(role === "donor"
      ? [
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
        { text: "Hospitals", pathId: "hospitals", icon: <LocalHospitalIcon /> },
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
        { text: "Hospitals", pathId: "hospitals", icon: <LocalHospitalIcon /> },
      ]
      : []),

    ...(role === "ngo"
      ? [
        { text: "Donors", pathId: "donors", icon: <FavoriteIcon /> },
        { text: "Blood Requests", pathId: "blood-requests", icon: <BloodtypeIcon /> },
        { text: "Hospitals", pathId: "hospitals", icon: <LocalHospitalIcon /> },
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
    </Drawer>
  );
}

export default Sidebar;
