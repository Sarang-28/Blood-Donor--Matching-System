import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";

import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationMenu from "./NotificationMenu";

const drawerWidth = 240;

function Navbar() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const effectiveRole = role || user?.role || "";
  const formattedRole = effectiveRole ? effectiveRole.replace("_", " ").toUpperCase() : "";
  const displayName = profile?.full_name || profile?.hospital_name || profile?.blood_bank_name || user?.email?.split('@')[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
        color: "#222",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo */}
        <Typography
          component={motion.div}
          whileHover={{ scale: 1.04 }}
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "default",
          }}
        >
          <motion.span
            className="floaty"
            style={{ display: "inline-block" }}
          >
            🩸
          </motion.span>
          BloodConnect
        </Typography>

        {/* Search */}
        <Box
          component={motion.div}
          whileFocus={{ scale: 1.01 }}
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "#f4f4f4",
            px: 2,
            py: 0.5,
            borderRadius: 3,
            width: 300,
            border: "1.5px solid transparent",
            transition: "border-color 0.25s ease, background-color 0.25s ease",
            "&:focus-within": {
              borderColor: "primary.main",
              bgcolor: "#fff",
            },
          }}
        >
          <SearchIcon color="action" />
          <InputBase
            placeholder="Search..."
            sx={{ ml: 1, flex: 1 }}
          />
        </Box>

        {/* Right Side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          {/* Switch Role Button */}
          <Tooltip title="Switch between Donor, Patient, etc.">
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={() => navigate("/roles")}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                color: "text.primary",
                borderColor: "rgba(0,0,0,0.18)",
                display: { xs: "none", sm: "inline-flex" },
                px: 1.5,
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: "rgba(229, 56, 77, 0.05)",
                },
              }}
            >
              Switch Role
            </Button>
          </Tooltip>

          {/* Notification Bell Menu */}
          <NotificationMenu />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(229, 56, 77, 0.35)",
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </Avatar>
            </motion.div>
            <Box>
              <Typography fontWeight="bold" sx={{ lineHeight: 1.2 }}>{displayName}</Typography>
              {formattedRole && (
                <Typography variant="caption" color="text.secondary">
                  {formattedRole}
                </Typography>
              )}
            </Box>
          </Box>

          <Tooltip title="Sign Out">
            <IconButton
              onClick={() => {
                logout();
                navigate("/");
              }}
              color="error"
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
