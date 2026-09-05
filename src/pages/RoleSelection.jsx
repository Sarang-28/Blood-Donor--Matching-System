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
  { title: "Donor", icon: "🩸", path: "/dashboard/donor" },
  { title: "Hospital", icon: "🏥", path: "/dashboard/hospital" },
  { title: "Patient", icon: "🧑‍⚕️", path: "/dashboard/patient" },
  { title: "NGO", icon: "🤝", path: "/dashboard/ngo" },
];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F6F7FB",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{ textAlign: "center", fontWeight: "bold", mb: 5 }}
        >
          Select Your Role
        </Typography>

        <Grid container spacing={3}>
          {roles.map((role, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={role.title}>
              <MotionCard
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  boxShadow: "0 8px 24px rgba(17,12,46,0.08)",
                  "&:hover": {
                    boxShadow: "0 20px 40px rgba(229, 56, 77, 0.2)",
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(role.path)}>
                  <CardContent
                    sx={{
                      textAlign: "center",
                      py: 5,
                    }}
                  >
                    <Typography
                      component={motion.div}
                      whileHover={{ scale: 1.2, rotate: 8 }}
                      variant="h2"
                    >
                      {role.icon}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", mt: 2 }}
                    >
                      {role.title}
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
