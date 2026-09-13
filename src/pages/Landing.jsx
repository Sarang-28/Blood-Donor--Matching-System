import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Icons
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import BoltIcon from "@mui/icons-material/Bolt";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import InventoryIcon from "@mui/icons-material/Inventory";
import LoginIcon from "@mui/icons-material/Login";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

// Blood Compatibility Matrix
const BLOOD_COMPATIBILITY = {
  "O-": {
    give: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    receive: ["O-"],
    rarity: "Universal Red Cell Donor • 7% of population",
    urgent: true,
    tag: "Highest Emergency Demand",
    fillPercent: 88,
  },
  "O+": {
    give: ["O+", "A+", "B+", "AB+"],
    receive: ["O-", "O+"],
    rarity: "Most Common Blood Type • 37% of population",
    urgent: false,
    tag: "High Volume Utility",
    fillPercent: 70,
  },
  "A-": {
    give: ["A-", "A+", "AB-", "AB+"],
    receive: ["O-", "A-"],
    rarity: "Rare Type • 6% of population",
    urgent: true,
    tag: "Critical for Platelet Units",
    fillPercent: 82,
  },
  "A+": {
    give: ["A+", "AB+"],
    receive: ["O-", "O+", "A-", "A+"],
    rarity: "Second Most Common • 34% of population",
    urgent: false,
    tag: "High Clinical Need",
    fillPercent: 65,
  },
  "B-": {
    give: ["B-", "B+", "AB-", "AB+"],
    receive: ["O-", "B-"],
    rarity: "Very Rare • 2% of population",
    urgent: true,
    tag: "Extremely Scarce Inventory",
    fillPercent: 92,
  },
  "B+": {
    give: ["B+", "AB+"],
    receive: ["O-", "O+", "B-", "B+"],
    rarity: "Frequent Need • 9% of population",
    urgent: false,
    tag: "Essential Trauma Stock",
    fillPercent: 75,
  },
  "AB-": {
    give: ["AB-", "AB+"],
    receive: ["O-", "A-", "B-", "AB-"],
    rarity: "Rarest Blood Type • <1% of population",
    urgent: true,
    tag: "Universal Plasma Donor",
    fillPercent: 95,
  },
  "AB+": {
    give: ["AB+"],
    receive: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    rarity: "Universal Recipient • 4% of population",
    urgent: false,
    tag: "Can Receive Any Blood Type",
    fillPercent: 55,
  },
};

const LIVE_FEEDS = [
  {
    group: "O-",
    units: "2 Units Required",
    hospital: "Apollo Multispecialty Hospital",
    dist: "1.8 km away",
    urgency: "Critical",
    timeAgo: "Requested 2 mins ago",
  },
  {
    group: "B+",
    units: "3 Units Required",
    hospital: "Ruby Hall Emergency Clinic",
    dist: "3.4 km away",
    urgency: "Urgent",
    timeAgo: "Requested 5 mins ago",
  },
  {
    group: "A-",
    units: "1 Unit Required",
    hospital: "Sancheti Orthopedic Trauma",
    dist: "2.1 km away",
    urgency: "Critical",
    timeAgo: "Requested 9 mins ago",
  },
  {
    group: "O+",
    units: "4 Units Required",
    hospital: "KEM Hospital Blood Bank",
    dist: "4.2 km away",
    urgency: "Active",
    timeAgo: "Requested 14 mins ago",
  },
];

function Landing() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedBlood, setSelectedBlood] = useState("B+");
  const [hoveredPortal, setHoveredPortal] = useState(null);

  const activeCompat = BLOOD_COMPATIBILITY[selectedBlood];

  return (
    <Box
      sx={{
        bgcolor: "#070A13",
        color: "#F1F5F9",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Dynamic Ambient Background Glows */}
      <Box
        sx={{
          position: "fixed",
          top: -200,
          left: "20%",
          width: 650,
          height: 650,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(229,56,77,0.18) 0%, rgba(229,56,77,0) 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "fixed",
          top: "45%",
          right: -150,
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 70%)",
          filter: "blur(110px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* 1. STICKY GLASS NAVBAR */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
          bgcolor: "rgba(7, 10, 19, 0.8)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          px: { xs: 2, md: 6 },
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Brand Logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, #E5384D, #FF4359)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(229, 56, 77, 0.45)",
                }}
              >
                <FavoriteIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                  Blood<span style={{ color: "#E5384D" }}>Match</span>
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", letterSpacing: "1px" }}>
                  HYPERLOCAL NETWORK
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation Links */}
            {!isMobile && (
              <Stack direction="row" spacing={4} sx={{ alignItems: "center" }}>
                <Typography
                  component="a"
                  href="#compatibility"
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    transition: "0.2s",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  Compatibility Engine
                </Typography>
                <Typography
                  component="a"
                  href="#how-it-works"
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    transition: "0.2s",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  How It Works
                </Typography>
                <Typography
                  component="a"
                  href="#portals"
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    transition: "0.2s",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  Tailored Portals
                </Typography>
                <Typography
                  component="a"
                  href="#live-feeds"
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    transition: "0.2s",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  Live Requests
                </Typography>
              </Stack>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                component={Link}
                to="/emergency"
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #E5384D, #B71C1C)",
                  color: "#fff",
                  fontWeight: 700,
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1,
                  borderRadius: 3,
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  textTransform: "none",
                  boxShadow: "0 0 20px rgba(229,56,77,0.5)",
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(229, 56, 77, 0.7)" },
                    "70%": { boxShadow: "0 0 0 12px rgba(229, 56, 77, 0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(229, 56, 77, 0)" },
                  },
                }}
                startIcon={<NotificationsActiveIcon />}
              >
                Emergency SOS
              </Button>

              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.05)",
                  },
                }}
                startIcon={<LoginIcon />}
              >
                Sign In
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* HERO SECTION */}
      <Box sx={{ position: "relative", zIndex: 1, pt: { xs: 7, md: 10 }, pb: { xs: 7, md: 12 } }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            {/* Left Column: Headlines & Call to Actions */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                {/* Micro badge */}
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 0.8,
                    borderRadius: 10,
                    bgcolor: "rgba(229, 56, 77, 0.12)",
                    border: "1px solid rgba(229, 56, 77, 0.3)",
                    mb: 3,
                  }}
                >
                  <BoltIcon sx={{ color: "#E5384D", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "#FF6B81", fontWeight: 700, letterSpacing: "0.5px" }}>
                    POSTGIS SPATIAL ENGINE • SUB-SECOND PRECISION
                  </Typography>
                </Box>

                {/* Main Hero Title */}
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.2rem" },
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: "-1.5px",
                    mb: 3,
                  }}
                >
                  Minutes Matter. <br />
                  <span
                    style={{
                      background: "linear-gradient(90deg, #E5384D 0%, #FF6B81 50%, #FFA8B5 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Blood Matching
                  </span>{" "}
                  <br />
                  at Speed of Light.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "rgba(255, 255, 255, 0.75)",
                    fontSize: { xs: "1rem", md: "1.15rem" },
                    lineHeight: 1.6,
                    maxWidth: 540,
                    mb: 4,
                  }}
                >
                  Connecting emergency trauma centers with verified nearby blood donors, patients, and certified blood banks
                  in real-time within a <strong>10km hyperlocal radius</strong>.
                </Typography>

                {/* CTA Buttons */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 5 }}>
                  <Button
                    component={Link}
                    to="/emergency"
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.8,
                      px: 4,
                      borderRadius: 3,
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      textTransform: "none",
                      background: "linear-gradient(135deg, #E5384D, #FF4359)",
                      boxShadow: "0 15px 35px rgba(229, 56, 77, 0.4)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #D02B40, #E5384D)",
                        boxShadow: "0 20px 40px rgba(229, 56, 77, 0.5)",
                      },
                    }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Request Blood Urgently
                  </Button>

                  <Button
                    component={Link}
                    to="/register?role=donor"
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.8,
                      px: 3.5,
                      borderRadius: 3,
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#fff",
                      borderColor: "rgba(255, 255, 255, 0.25)",
                      backdropFilter: "blur(12px)",
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      "&:hover": {
                        borderColor: "#E5384D",
                        bgcolor: "rgba(229, 56, 77, 0.08)",
                      },
                    }}
                    startIcon={<FavoriteIcon sx={{ color: "#E5384D" }} />}
                  >
                    Register as Hero Donor
                  </Button>
                </Stack>

                {/* Telemetry Chips */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Typography variant="h5" fontWeight={800} color="#FF6B81">
                        3.4 min
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.65)">
                        Average Match Time
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Typography variant="h5" fontWeight={800} color="#4ADE80">
                        99.4%
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.65)">
                        Fulfillment Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <Typography variant="h5" fontWeight={800} color="#60A5FA">
                        10 km
                      </Typography>
                      <Typography variant="caption" color="rgba(255,255,255,0.65)">
                        Hyperlocal Radius
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </motion.div>
            </Grid>

            {/* Right Column: Animated Hyperlocal Spatial Radar */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 360, sm: 460, md: 520 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Concentric Radar Rings */}
                {[1, 2, 3, 4].map((ring) => (
                  <Box
                    key={ring}
                    sx={{
                      position: "absolute",
                      width: ring * 115,
                      height: ring * 115,
                      borderRadius: "50%",
                      border: "1px solid rgba(229, 56, 77, 0.15)",
                      pointerEvents: "none",
                    }}
                  />
                ))}

                {/* Radar Sweep Rotating Beam */}
                <Box
                  component={motion.div}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  sx={{
                    position: "absolute",
                    width: 440,
                    height: 440,
                    borderRadius: "50%",
                    background: "conic-gradient(from 0deg at 50% 50%, rgba(229, 56, 77, 0.25) 0deg, transparent 60deg, transparent 360deg)",
                    pointerEvents: "none",
                  }}
                />

                {/* Center Core: Emergency Trauma Center */}
                <Box
                  component={motion.div}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  sx={{
                    zIndex: 5,
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #E5384D, #8B0000)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 45px rgba(229,56,77,0.8)",
                    border: "3px solid #fff",
                  }}
                >
                  <LocalHospitalIcon sx={{ color: "#fff", fontSize: 32 }} />
                  <Typography variant="caption" sx={{ color: "#fff", fontSize: "0.6rem", fontWeight: 800, mt: 0.2 }}>
                    SOS CORE
                  </Typography>
                </Box>

                {/* Satellite Nodes */}
                {/* Node 1: Hero Donor */}
                <Box
                  component={motion.div}
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  sx={{
                    position: "absolute",
                    top: "14%",
                    left: "20%",
                    zIndex: 6,
                    p: 1.5,
                    borderRadius: 3,
                    backdropFilter: "blur(15px)",
                    bgcolor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(229, 56, 77, 0.5)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#E5384D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FavoriteIcon sx={{ color: "#fff", fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, display: "block" }}>
                      Donor Verified (O-)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#4ADE80", fontSize: "0.65rem" }}>
                      ● 1.2 km • Standby Active
                    </Typography>
                  </Box>
                </Box>

                {/* Node 2: Certified Blood Bank */}
                <Box
                  component={motion.div}
                  animate={{ y: [8, -8, 8] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  sx={{
                    position: "absolute",
                    bottom: "16%",
                    right: "15%",
                    zIndex: 6,
                    p: 1.5,
                    borderRadius: 3,
                    backdropFilter: "blur(15px)",
                    bgcolor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BloodtypeIcon sx={{ color: "#fff", fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, display: "block" }}>
                      Red Cross Reserve
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#60A5FA", fontSize: "0.65rem" }}>
                      ● 2.8 km • 14 Units In Stock
                    </Typography>
                  </Box>
                </Box>

                {/* Node 3: Ambulance Route */}
                <Box
                  component={motion.div}
                  animate={{ x: [-6, 6, -6] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  sx={{
                    position: "absolute",
                    top: "22%",
                    right: "10%",
                    zIndex: 6,
                    p: 1.2,
                    borderRadius: 3,
                    backdropFilter: "blur(15px)",
                    bgcolor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(74, 222, 128, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <LocationOnIcon sx={{ color: "#4ADE80", fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>
                    ETA: 6 mins
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. INTERACTIVE COMPATIBILITY ENGINE */}
      <Box
        id="compatibility"
        sx={{
          py: 12,
          bgcolor: "rgba(10, 15, 29, 0.6)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip
              label="INTERACTIVE COMPATIBILITY ENGINE"
              color="error"
              size="small"
              sx={{ fontWeight: 800, mb: 1.5, letterSpacing: 1 }}
            />
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-1px", mb: 2 }}>
              Know Your Match in Seconds
            </Typography>
            <Typography variant="body1" color="#94A3B8" maxWidth={600} mx="auto">
              Select your blood type to instantly discover your universal donor compatibility, emergency recipient network, and rarity profile.
            </Typography>
          </Box>

          {/* Blood Type Selector Pill Row with Glowing Indicator & Hover Glows */}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2, mb: 6 }}>
            {Object.keys(BLOOD_COMPATIBILITY).map((type) => {
              const isSelected = selectedBlood === type;
              return (
                <Box key={type} sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  <Button
                    variant={isSelected ? "contained" : "outlined"}
                    onClick={() => setSelectedBlood(type)}
                    sx={{
                      minWidth: 76,
                      height: 54,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: "1.15rem",
                      transition: "all 0.25s ease-in-out",
                      bgcolor: isSelected ? "#E5384D" : "rgba(255,255,255,0.03)",
                      color: isSelected ? "#fff" : "#E2E8F0",
                      borderColor: isSelected ? "#E5384D" : "rgba(255,255,255,0.12)",
                      boxShadow: isSelected ? "0 10px 25px rgba(229,56,77,0.45)" : "none",
                      "&:hover": {
                        bgcolor: isSelected ? "#D02B40" : "rgba(229, 56, 77, 0.08)",
                        borderColor: "rgba(229, 56, 77, 0.5)",
                        boxShadow: "0 6px 20px rgba(229, 56, 77, 0.2)",
                      },
                    }}
                  >
                    {type}
                  </Button>

                  {/* Active Glowing Dot / Pulse */}
                  {isSelected && (
                    <Box
                      component={motion.div}
                      layoutId="active-pill-dot"
                      sx={{
                        position: "absolute",
                        bottom: -10,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#FF4359",
                        boxShadow: "0 0 12px 2px #FF4359",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Dynamic Compatibility Visualizer with Animated Blood Bag / Liquid Fill */}
          <AnimatePresence mode="wait">
            <Paper
              key={selectedBlood}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                bgcolor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(229, 56, 77, 0.3)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              }}
            >
              <Grid container spacing={3} alignItems="center">
                {/* Left: Blood Drop / Bag Silhouette with Liquid Wave Animation */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {/* Animated Blood Bag Silhouette */}
                    <Box
                      sx={{
                        width: 88,
                        height: 108,
                        borderRadius: "36px 36px 44px 44px",
                        border: "3px solid rgba(255, 255, 255, 0.2)",
                        position: "relative",
                        overflow: "hidden",
                        bgcolor: "rgba(255, 255, 255, 0.03)",
                        boxShadow: "0 8px 30px rgba(229, 56, 77, 0.35)",
                        flexShrink: 0,
                      }}
                    >
                      {/* Top Hanger Loop */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 4,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 14,
                          height: 6,
                          borderRadius: 2,
                          border: "2px solid rgba(255,255,255,0.4)",
                          zIndex: 4,
                        }}
                      />

                      {/* Liquid Fill Level Animation */}
                      <Box
                        component={motion.div}
                        initial={{ height: "0%" }}
                        animate={{ height: `${activeCompat.fillPercent}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(180deg, #FF4359 0%, #B71C1C 100%)",
                          boxShadow: "inset 0 4px 10px rgba(255, 255, 255, 0.3)",
                        }}
                      />

                      {/* Liquid Wave Ripple Indicator */}
                      <Box
                        component={motion.div}
                        animate={{ x: [-10, 10, -10] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        sx={{
                          position: "absolute",
                          bottom: `${activeCompat.fillPercent - 4}%`,
                          left: -20,
                          right: -20,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "rgba(255, 255, 255, 0.3)",
                          filter: "blur(2px)",
                        }}
                      />

                      {/* Blood Group Label Floating Over Liquid */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 3,
                        }}
                      >
                        <Typography variant="h5" fontWeight={900} sx={{ color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}>
                          {selectedBlood}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Sub-Info with Enhanced Contrast & Sharpness */}
                    <Box>
                      <Chip
                        label={activeCompat.tag}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          bgcolor: "rgba(229, 56, 77, 0.2)",
                          color: "#FF6B81",
                          border: "1px solid rgba(229, 56, 77, 0.4)",
                        }}
                      />
                      {/* Fixed "Ghost" Text with high-contrast #CBD5E1 */}
                      <Typography variant="body2" sx={{ color: "#CBD5E1", fontWeight: 600, fontSize: "0.95rem" }}>
                        {activeCompat.rarity}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                        Hyperlocal Match Priority: <strong style={{ color: "#4ADE80" }}>Sub-second verified</strong>
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Match Flow Arrow Indicator (Visual Bridge) */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(74, 222, 128, 0.25)",
                      position: "relative",
                      transition: "0.3s",
                      "&:hover": { borderColor: "#4ADE80" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <ArrowRightAltIcon sx={{ color: "#4ADE80", fontSize: 24 }} />
                      <Typography variant="subtitle2" sx={{ color: "#4ADE80", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Can Donate Blood To
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                      {activeCompat.give.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          sx={{
                            bgcolor: "rgba(74, 222, 128, 0.16)",
                            color: "#4ADE80",
                            fontWeight: 800,
                            border: "1px solid rgba(74, 222, 128, 0.3)",
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                {/* Right: You Can Receive From */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(96, 165, 250, 0.25)",
                      position: "relative",
                      transition: "0.3s",
                      "&:hover": { borderColor: "#60A5FA" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <ArrowRightAltIcon sx={{ color: "#60A5FA", fontSize: 24, transform: "rotate(180deg)" }} />
                      <Typography variant="subtitle2" sx={{ color: "#60A5FA", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Can Receive Blood From
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                      {activeCompat.receive.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          sx={{
                            bgcolor: "rgba(96, 165, 250, 0.16)",
                            color: "#60A5FA",
                            fontWeight: 800,
                            border: "1px solid rgba(96, 165, 250, 0.3)",
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </AnimatePresence>
        </Container>
      </Box>

      {/* 3. HOW LIVES ARE SAVED (WITH CONNECTING PULSE PIPELINE & HIGH CONTRAST) */}
      <Box id="how-it-works" sx={{ py: 14, position: "relative" }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 9 }}>
            <Chip label="THE HYPERLOCAL ENGINE" color="primary" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-1px", mb: 2, color: "#FFFFFF" }}>
              How Lives Are Saved in Under 15 Minutes
            </Typography>
            <Typography variant="body1" sx={{ color: "#94A3B8" }} maxWidth={640} mx="auto">
              Our automated spatial algorithms replace slow, manual phone trees with instant geospatial broadcasts.
            </Typography>
          </Box>

          {/* Horizontal Illuminated Progress Line (Desktop) */}
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              position: "relative",
              height: 4,
              bgcolor: "rgba(255, 255, 255, 0.08)",
              top: 52,
              mx: 10,
              zIndex: 1,
            }}
          >
            {/* Animated Signal Moving Across Timeline */}
            <Box
              component={motion.div}
              animate={{ left: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              sx={{
                position: "absolute",
                top: -6,
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: "#E5384D",
                boxShadow: "0 0 16px 4px #FF4359",
              }}
            />
          </Box>

          <Grid container spacing={3} sx={{ position: "relative", zIndex: 2 }}>
            {[
              {
                step: "01",
                telemetry: "T+ 0.0s",
                icon: <NotificationsActiveIcon sx={{ fontSize: 32, color: "#E5384D" }} />,
                title: "Emergency Broadcast",
                desc: "A physician or patient fires an SOS specifying required units, blood group, and exact GPS coordinates.",
              },
              {
                step: "02",
                telemetry: "T+ 0.8s",
                icon: <LocationOnIcon sx={{ fontSize: 32, color: "#6366F1" }} />,
                title: "PostGIS Geo-Fencing",
                desc: "The PostgreSQL engine performs sub-second spatial queries to locate active verified donors within 10 km.",
              },
              {
                step: "03",
                telemetry: "T+ 4.2s",
                icon: <BoltIcon sx={{ fontSize: 32, color: "#F59E0B" }} />,
                title: "Multi-Channel Alerts",
                desc: "Immediate simultaneous alert dispatch across Web push notifications, Twilio SMS, and WhatsApp.",
              },
              {
                step: "04",
                telemetry: "T+ 12.5m",
                icon: <CheckCircleIcon sx={{ fontSize: 32, color: "#10B981" }} />,
                title: "Verified Transfusion",
                desc: "Turn-by-turn navigation leads the donor to the hospital, confirmed via digital OTP handoff.",
              },
            ].map((item) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={item.title}>
                <Paper
                  component={motion.div}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  sx={{
                    p: 4,
                    height: "100%",
                    borderRadius: 3.5,
                    bgcolor: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      borderColor: "rgba(229,56,77,0.5)",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
                    },
                  }}
                >
                  {/* Step Number in Legible Opacity */}
                  <Typography
                    variant="h2"
                    fontWeight={900}
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 15,
                      color: "rgba(255,255,255,0.12)",
                      fontSize: "4.2rem",
                      userSelect: "none",
                    }}
                  >
                    {item.step}
                  </Typography>

                  {/* Micro-Telemetry Badge (Top Right) */}
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 1.5,
                      bgcolor: "rgba(229, 56, 77, 0.15)",
                      border: "1px solid rgba(229, 56, 77, 0.3)",
                      mb: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#FF6B81", fontWeight: 800, fontFamily: "monospace" }}>
                      {item.telemetry}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>{item.icon}</Box>

                  {/* High Contrast Crisp Card Title */}
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#FFFFFF", mb: 1.5 }}>
                    {item.title}
                  </Typography>

                  {/* High Contrast Slate-400 Description */}
                  <Typography variant="body2" sx={{ color: "#94A3B8", lineHeight: 1.6 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. TAILORED PORTALS (INTERACTIVE SPOTLIGHT HOVER & DYNAMIC CTAS) */}
      <Box id="portals" sx={{ py: 12, bgcolor: "rgba(10, 15, 29, 0.4)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Chip label="UNIFIED HEALTH ECOSYSTEM" color="success" size="small" sx={{ fontWeight: 800, mb: 1.5 }} />
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-1px", mb: 2, color: "#FFFFFF" }}>
              Tailored Portals for Every Participant
            </Typography>
            <Typography variant="body1" sx={{ color: "#94A3B8" }} maxWidth={620} mx="auto">
              Whether you are an everyday hero donor, emergency physician, blood bank manager, or family member, we provide tailored tools.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                id: "donor",
                title: "Hero Donors",
                icon: <FavoriteIcon sx={{ color: "#E5384D" }} />,
                accentColor: "#E5384D",
                accentGlow: "rgba(229, 56, 77, 0.25)",
                desc: "Receive emergency alerts in your neighborhood, view donation certificates, track recovery periods, and save lives on your schedule.",
                ctaText: "Join as Hero Donor",
                link: "/register?role=donor",
              },
              {
                id: "hospital",
                title: "Hospitals & Trauma",
                icon: <LocalHospitalIcon sx={{ color: "#10B981" }} />,
                accentColor: "#10B981",
                accentGlow: "rgba(16, 185, 129, 0.25)",
                desc: "Broadcast critical multi-unit emergency requests, track incoming donors in real time, and verify blood certifications instantly.",
                ctaText: "Onboard Hospital",
                link: "/register?role=hospital",
              },
              {
                id: "blood_bank",
                title: "Blood Banks & NGOs",
                icon: <InventoryIcon sx={{ color: "#6366F1" }} />,
                accentColor: "#6366F1",
                accentGlow: "rgba(99, 102, 241, 0.25)",
                desc: "Manage cold-chain inventories, automate expiry alerts for platelets and plasma, and exchange stock with regional banks seamlessly.",
                ctaText: "Connect Facility",
                link: "/register?role=blood_bank",
              },
              {
                id: "patient",
                title: "Patients & Families",
                icon: <Diversity1Icon sx={{ color: "#F59E0B" }} />,
                accentColor: "#F59E0B",
                accentGlow: "rgba(245, 158, 11, 0.25)",
                desc: "Skip bureaucratic waitlists. Post urgent requests, chat directly with matched donors, and receive blood without delay.",
                ctaText: "Patient Account",
                link: "/register?role=patient",
              },
            ].map((portal) => {
              const isHovered = hoveredPortal === portal.id;
              return (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={portal.id}>
                  <Card
                    onMouseEnter={() => setHoveredPortal(portal.id)}
                    onMouseLeave={() => setHoveredPortal(null)}
                    sx={{
                      bgcolor: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid",
                      borderColor: isHovered ? portal.accentColor : "rgba(255,255,255,0.08)",
                      borderRadius: 3.5,
                      p: 2.5,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.35s ease",
                      boxShadow: isHovered ? `0 15px 35px ${portal.accentGlow}` : "none",
                      backgroundImage: isHovered
                        ? `radial-gradient(circle at 50% 0%, ${portal.accentGlow} 0%, rgba(15, 23, 42, 0.75) 70%)`
                        : "none",
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          bgcolor: `${portal.accentColor}22`,
                          border: `1px solid ${portal.accentColor}44`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2.5,
                        }}
                      >
                        {portal.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#FFFFFF", mb: 1.5 }}>
                        {portal.title}
                      </Typography>
                      {/* Fixed Missing Card Text with #A1A1AA / #CBD5E1 */}
                      <Typography variant="body2" sx={{ color: "#A1A1AA", lineHeight: 1.6, mb: 2 }}>
                        {portal.desc}
                      </Typography>
                    </CardContent>

                    {/* Dynamic CTA Button: Fills with Brand Color on Hover */}
                    <Button
                      component={Link}
                      to={portal.link}
                      variant={isHovered ? "contained" : "outlined"}
                      fullWidth
                      sx={{
                        borderRadius: 2.5,
                        py: 1.2,
                        fontWeight: 700,
                        textTransform: "none",
                        fontSize: "0.95rem",
                        transition: "all 0.25s ease-in-out",
                        bgcolor: isHovered ? portal.accentColor : "transparent",
                        color: isHovered ? "#fff" : portal.accentColor,
                        borderColor: portal.accentColor,
                        "&:hover": {
                          bgcolor: portal.accentColor,
                          color: "#fff",
                        },
                      }}
                    >
                      {portal.ctaText}
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* 5. LIVE EMERGENCY REQUESTS TICKER & SAFETY SECTION */}
      <Box id="live-feeds" sx={{ py: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5, flexWrap: "wrap", gap: 2 }}>
            <Box>
              {/* Blinking Live Telemetry Ping */}
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#10B981",
                    boxShadow: "0 0 10px #10B981",
                    animation: "livePing 1.5s infinite",
                    "@keyframes livePing": {
                      "0%": { opacity: 0.4 },
                      "50%": { opacity: 1 },
                      "100%": { opacity: 0.4 },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "#4ADE80", fontWeight: 800, letterSpacing: 0.5 }}>
                  14 REQUESTS LIVE NOW • WEBSOCKET ACTIVE
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#FFFFFF" }}>
                Live Network Blood Requests
              </Typography>
            </Box>

            <Button
              component={Link}
              to="/emergency"
              variant="contained"
              color="error"
              startIcon={<NotificationsActiveIcon />}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2.5,
                px: 3,
                py: 1.2,
                boxShadow: "0 8px 20px rgba(229,56,77,0.35)",
              }}
            >
              Post Emergency Request
            </Button>
          </Box>

          <Grid container spacing={3}>
            {LIVE_FEEDS.map((feed, idx) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3.5,
                    bgcolor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(229,56,77,0.25)",
                    transition: "0.25s",
                    "&:hover": {
                      borderColor: "rgba(229,56,77,0.6)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Chip label={feed.group} color="error" sx={{ fontWeight: 900, fontSize: "1.05rem" }} />
                    <Chip
                      label={feed.urgency}
                      size="small"
                      sx={{
                        bgcolor: feed.urgency === "Critical" ? "rgba(229,56,77,0.2)" : "rgba(245,158,11,0.2)",
                        color: feed.urgency === "Critical" ? "#FF6B81" : "#F59E0B",
                        fontWeight: 800,
                      }}
                    />
                  </Box>

                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#FFFFFF", mb: 1 }}>
                    {feed.units}
                  </Typography>

                  {/* Prominent Hospital & Distance Pill Styling */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "rgba(30, 41, 59, 0.85)",
                      border: "1px solid rgba(71, 85, 105, 0.6)",
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#F1F5F9", fontWeight: 700 }}>
                      🏥 {feed.hospital}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#60A5FA", fontWeight: 700, mt: 0.5, display: "block" }}>
                      📍 {feed.dist} • Hyperlocal Radar
                    </Typography>
                  </Box>

                  {/* Dynamic Micro-Tag */}
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block" }}>
                    ⏱️ {feed.timeAgo}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ELEVATED FROSTED GLASS SAFETY GUIDELINES BANNER */}
      <Box sx={{ py: 12, bgcolor: "rgba(10, 15, 29, 0.5)" }}>
        <Container maxWidth="lg">
          <Paper
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: 4.5,
              bgcolor: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
              <HealthAndSafetyIcon sx={{ color: "#4ADE80", fontSize: 44 }} />
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#FFFFFF" }}>
                  Donor Health & Safety Standards
                </Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                  Certified regulatory benchmarks for safe, hygienic blood matching
                </Typography>
              </Box>
            </Box>

            {/* 4 Clean Large Stat Metrics */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#FF6B81", mb: 0.5 }}>
                    18–65
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#FFFFFF" }}>
                    Years Age Limit
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                    Verified via Government Photo ID.
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#4ADE80", mb: 0.5 }}>
                    45+
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#FFFFFF" }}>
                    kg Minimum Weight
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                    Ensures donor hemodynamic safety.
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#60A5FA", mb: 0.5 }}>
                    90
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#FFFFFF" }}>
                    Days Interval
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                    Full recovery cycle between donations.
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: "#FBBF24", mb: 0.5 }}>
                    Zero
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#FFFFFF" }}>
                    GPS Exposure
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                    Home location is private; meeting at certified facilities only.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* 6. FINAL CALL TO ACTION BANNER (CRISP WHITE TITLE & AMBIENT GLOW) */}
      <Box sx={{ py: 12, position: "relative" }}>
        {/* Soft Red Ambient Glow Behind the Card */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(229,56,77,0.3) 0%, rgba(229,56,77,0) 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="md">
          <Paper
            sx={{
              p: { xs: 4, md: 7 },
              borderRadius: 5,
              background: "linear-gradient(135deg, rgba(229,56,77,0.2) 0%, rgba(99,102,241,0.15) 100%)",
              border: "1px solid rgba(229,56,77,0.45)",
              backdropFilter: "blur(20px)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Crisp Bold White Title */}
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: "-1px", mb: 2, color: "#FFFFFF" }}>
              Ready to Save Lives?
            </Typography>

            {/* Clear Subtitle in #CBD5E1 */}
            <Typography variant="body1" sx={{ color: "#CBD5E1", fontSize: "1.1rem" }} maxWidth={540} mx="auto" mb={4}>
              Join thousands of heroes already on the Hyperlocal Blood Donor Matching network. Setup takes under 2 minutes.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  background: "#E5384D",
                  fontWeight: 800,
                  px: 4,
                  py: 1.6,
                  borderRadius: 3,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  boxShadow: "0 10px 25px rgba(229,56,77,0.4)",
                  "&:hover": { background: "#D02B40" },
                }}
              >
                Create Free Account
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontWeight: 700,
                  px: 4,
                  py: 1.6,
                  borderRadius: 3,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  backdropFilter: "blur(10px)",
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                Access Dashboard
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* 7. COMPREHENSIVE FOOTER WITH LIVE SYSTEM HEALTH PILL */}
      <Box
        component="footer"
        sx={{
          py: 8,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(4, 7, 14, 0.95)",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: "#E5384D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FavoriteIcon sx={{ color: "#fff", fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={800}>
                  BloodMatch
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "#94A3B8" }} lineHeight={1.6} maxWidth={320}>
                Next-generation geospatial blood donor matching network delivering sub-second matches and 24/7 life-saving logistics.
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: "#FFFFFF" }}>
                Navigation
              </Typography>
              <Stack spacing={1}>
                <Typography component={Link} to="/" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Home</Typography>
                <Typography component={Link} to="/emergency" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Emergency SOS</Typography>
                <Typography component={Link} to="/roles" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Role Selector</Typography>
                <Typography component={Link} to="/admin-login" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Admin Portal</Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: "#FFFFFF" }}>
                Get Started
              </Typography>
              <Stack spacing={1}>
                <Typography component={Link} to="/register?role=donor" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Register as Donor</Typography>
                <Typography component={Link} to="/register?role=hospital" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Register Hospital</Typography>
                <Typography component={Link} to="/register?role=patient" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Register Patient</Typography>
                <Typography component={Link} to="/login" sx={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>Sign In</Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: "#FFFFFF" }}>
                Emergency Contacts
              </Typography>
              <Typography variant="body2" color="#FF6B81" fontWeight={700}>
                24/7 Helpline: 108 / 102
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 1 }}>
                Direct integration with regional trauma response networks and certified red cross facilities.
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.08)" }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              © 2026 Hyperlocal Blood Donor Matching Network. All rights reserved.
            </Typography>

            {/* Live System Health Pill (Bottom Right) */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.6,
                borderRadius: 10,
                bgcolor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "#10B981",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
              <Typography variant="caption" sx={{ color: "#4ADE80", fontWeight: 700, fontFamily: "monospace" }}>
                All Systems Operational · PostGIS Engine v3.4 Active
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Landing;
