import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MotionCard = motion.create(Card);

function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Donor",
      icon: "🩸",
      image: "/role_images/donor.jpg",
      path: "/dashboard/donor",
    },
    {
      title: "Hospital",
      icon: "🏥",
      image: "/role_images/hospital.jpg",
      path: "/dashboard/hospital",
    },
    {
      title: "Patient",
      icon: "🧑",
      image: "/role_images/patient.jpg",
      path: "/dashboard/patient",
    },
    {
      title: "NGO",
      icon: "🤝",
      image: "/role_images/ngo.jpg",
      path: "/dashboard/ngo",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F6F7FB",
        display: "flex",
        alignItems: "center",
        py: 5,
      }}
    >
      <Container maxWidth="md">
        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            mb: 5,
          }}
        >
          Select Your Role
        </Typography>

        <Grid container spacing={3}>
          {roles.map((role, index) => (
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
                  height: 250,
                  borderRadius: 4,
                  overflow: "hidden",
                  position: "relative",
                  backgroundImage: `url(${role.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: "0 8px 24px rgba(17,12,46,0.12)",

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
                      "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 100%)",
                  }}
                />

                <CardActionArea
                  onClick={() => navigate(role.path)}
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
                      }}
                    >
                      Continue as {role.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default RoleSelection;