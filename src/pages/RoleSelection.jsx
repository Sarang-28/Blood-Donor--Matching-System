import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import LogoutIcon from "@mui/icons-material/Logout";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAuth } from "../context/AuthContext";

const MotionCard = motion.create(Card);

function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, selectRole, logout } = useAuth();

  const roles = [
    {
      title: "Donor",
      roleKey: "donor",
      icon: "🩸",
      image: "/role_images/donor.jpg",
      path: "/dashboard/donor",
      desc: "Volunteer to donate blood, respond to urgent emergency requests, and save lives.",
    },
    {
      title: "Patient",
      roleKey: "patient",
      icon: "🧑",
      image: "/role_images/patient.jpg",
      path: "/dashboard/patient",
      desc: "Create blood requests, track real-time matches, and connect with nearby donors.",
    },
    {
      title: "Hospital",
      roleKey: "hospital",
      icon: "🏥",
      image: "/role_images/hospital.jpg",
      path: "/dashboard/hospital",
      desc: "Broadcast emergency requests, verify donations, and coordinate patient care.",
    },
    {
      title: "Blood Bank",
      roleKey: "blood_bank",
      icon: "🧪",
      image: "/role_images/hospital.jpg",
      path: "/dashboard/blood_bank",
      desc: "Track real-time blood stock inventory across all 8 blood groups.",
    },
  ];

  const handleRoleSelect = (role) => {
    const hasProfile = Boolean(
      user?.availableRoles?.includes(role.roleKey) ||
      user?.role === role.roleKey
    );
    if (hasProfile) {
      if (selectRole) {
        selectRole(role.roleKey);
      }
      navigate(role.path);
    } else {
      navigate(`/register?role=${role.roleKey}`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F6F7FB",
        display: "flex",
        alignItems: "center",
        py: 6,
      }}
    >
      <Container maxWidth="md">
        {user && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Signed in as: <strong style={{ color: "#222" }}>{user.email}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
                Primary registered role: {user.role?.replace("_", " ").toUpperCase()}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color="error"
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
        )}

        {location.state?.successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {location.state.successMessage}
          </Alert>
        )}

        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            mb: 1,
          }}
        >
          Select Your Active Role
        </Typography>

        <Typography
          sx={{
            textAlign: "center",
            color: "text.secondary",
            mb: 5,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          Choose how you want to interact right now. You can log in as a <strong>Donor</strong> to help someone, or as a <strong>Patient</strong> to request blood, and switch anytime.
        </Typography>

        <Grid container spacing={3}>
          {roles.map((role, index) => {
            const hasProfile = Boolean(
              user?.availableRoles?.includes(role.roleKey) ||
              user?.role === role.roleKey
            );

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={role.title}>
                <MotionCard
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.98 }}
                  elevation={0}
                  sx={{
                    height: 270,
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                    backgroundImage: `url(${role.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0 8px 24px rgba(17,12,46,0.12)",
                    border: hasProfile ? "2.5px solid #2E7D32" : "1.5px dashed rgba(255,255,255,0.5)",

                    "&:hover": {
                      boxShadow: "0 20px 40px rgba(229, 56, 77, 0.25)",
                    },

                    "&:hover .role-image": {
                      transform: "scale(1.06)",
                    },
                  }}
                >
                  {/* Image zoom */}
                  <Box
                    className="role-image"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${role.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transition: "transform 0.5s ease",
                    }}
                  />

                  {/* Dark gradient overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.2) 100%)",
                    }}
                  />

                  <CardActionArea
                    onClick={() => handleRoleSelect(role)}
                    sx={{
                      height: "100%",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <CardContent
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "flex-start",
                        p: 3,
                      }}
                    >
                      {hasProfile ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: "1rem !important", color: "#fff !important" }} />}
                          label="Profile Active"
                          size="small"
                          sx={{
                            bgcolor: "#2E7D32",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            mb: 1,
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<AddCircleIcon sx={{ fontSize: "1rem !important", color: "#fff !important" }} />}
                          label="+ Set Up Role Profile"
                          size="small"
                          sx={{
                            bgcolor: "rgba(229, 56, 77, 0.95)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            mb: 1,
                          }}
                        />
                      )}

                      <Typography
                        component={motion.div}
                        whileHover={{
                          scale: 1.15,
                          rotate: 8,
                        }}
                        sx={{
                          fontSize: "2rem",
                          mb: 0.5,
                        }}
                      >
                        {role.icon}
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: "bold",
                          color: "#fff",
                          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        }}
                      >
                        {role.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.85)",
                          mt: 0.5,
                          fontSize: "0.85rem",
                        }}
                      >
                        {role.desc}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: hasProfile ? "#81C784" : "#FFCDD2",
                          fontWeight: 700,
                          mt: 1,
                          display: "inline-block",
                        }}
                      >
                        {hasProfile ? "Click to switch role →" : "Click to add profile & activate role →"}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </MotionCard>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

export default RoleSelection;