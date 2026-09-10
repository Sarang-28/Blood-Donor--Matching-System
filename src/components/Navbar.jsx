import {
  AppBar,
  Avatar,
  Badge,
  Box,
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
import { useParams, useNavigate } from "react-router-dom";

const drawerWidth = 240;

function Navbar() {
  const { role } = useParams();
  const navigate = useNavigate();
  const formattedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <IconButton>
            <Badge
              badgeContent={3}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  animation: "pulseBadge 1.8s ease-in-out infinite",
                },
                "@keyframes pulseBadge": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.2)" },
                },
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(229, 56, 77, 0.35)",
                }}
              >
                S
              </Avatar>
            </motion.div>
            <Box>
              <Typography fontWeight="bold" sx={{ lineHeight: 1.2 }}>Sarang</Typography>
              {formattedRole && (
                <Typography variant="caption" color="text.secondary">
                  {formattedRole}
                </Typography>
              )}
            </Box>
          </Box>

          <Tooltip title="Logout">
            <IconButton onClick={() => navigate("/")} color="error">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
