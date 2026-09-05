import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonalInjuryIcon from "@mui/icons-material/PersonalInjury";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

import LoginButton from "../components/LoginButton";

const ROLES = [
  {
    value: "donor",
    label: "Donor",
    icon: <FavoriteIcon />,
  },
  {
    value: "hospital",
    label: "Hospital",
    icon: <LocalHospitalIcon />,
  },
  {
    value: "patient",
    label: "Patient",
    icon: <PersonalInjuryIcon />,
  },
  {
    value: "ngo",
    label: "NGO",
    icon: <VolunteerActivismIcon />,
  },
];

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    if (!role) {
      setError("Please select a role to continue.");
      return;
    }

    setError("");
    navigate("/");
  };

  return (
    <Box
      className="animated-gradient-bg"
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(120deg, #D32F2F, #FF6B6B, #E5384D, #B71C1C)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          component={motion.div}
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          elevation={8}
          sx={{
            borderRadius: 4,
            p: 2,
            boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
          }}
        >
          <CardContent>
            <Typography
              variant="h4"
              color="primary"
              gutterBottom
              sx={{
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Register
            </Typography>

            <Typography
              sx={{
                textAlign: "center",
                color: "text.secondary",
                mb: 3,
              }}
            >
              Create your account
            </Typography>

            {error && (
              <Alert
                severity="error"
                component={motion.div}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}

            {/* ROLE SELECTION */}
            <Typography
              sx={{
                mb: 1,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              I am registering as a...
            </Typography>

            <ToggleButtonGroup
              exclusive
              fullWidth
              value={role}
              onChange={(e, value) => {
                if (value) {
                  setRole(value);
                  setError("");
                }
              }}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.5,
                mb: 3,
              }}
            >
              {ROLES.map((r) => (
                <ToggleButton
                  key={r.value}
                  value={r.value}
                  component={motion.button}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  sx={{
                    flexDirection: "column",
                    gap: 0.5,
                    py: 1.5,
                    borderRadius: 3,
                    border: "1.5px solid",
                    borderColor: "divider",
                    textTransform: "none",
                    fontWeight: 600,
                    transition: "all 0.25s ease",

                    "&.Mui-selected": {
                      borderColor: "primary.main",
                      color: "primary.main",
                      bgcolor: "rgba(229, 56, 77, 0.08)",
                    },

                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(229, 56, 77, 0.12)",
                    },
                  }}
                >
                  {r.icon}
                  {r.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {/* FORM APPEARS AFTER ROLE SELECTION */}
            {role && (
              <Box
                component={motion.form}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleRegister}
              >
                {/* COMMON FIELDS */}

                <TextField
                  fullWidth
                  label={
                    role === "hospital" || role === "ngo"
                      ? "Organization Name"
                      : "Full Name"
                  }
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  margin="normal"
                  required
                />

                {/* DONOR FIELDS */}

                {role === "donor" && (
                  <>
                    <TextField
                      fullWidth
                      select
                      label="Blood Group"
                      margin="normal"
                      defaultValue=""
                      required
                    >
                      {[
                        "A+",
                        "A-",
                        "B+",
                        "B-",
                        "AB+",
                        "AB-",
                        "O+",
                        "O-",
                      ].map((group) => (
                        <MenuItem key={group} value={group}>
                          {group}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
  fullWidth
  type="date"
  label="Last Donation Date"
  margin="normal"
  required
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
/>

                    <TextField
                      fullWidth
                      label="Current Location"
                      placeholder="Enter your city / area"
                      margin="normal"
                      required
                    />
                  </>
                )}

                {/* PATIENT FIELDS */}

                {role === "patient" && (
                  <>
                    <TextField
                      fullWidth
                      label="Current Location"
                      placeholder="Enter your city / area"
                      margin="normal"
                      required
                    />

                    <TextField
                      fullWidth
                      label="Emergency Contact"
                      type="tel"
                      margin="normal"
                    />
                  </>
                )}

                {/* HOSPITAL FIELDS */}

                {role === "hospital" && (
                  <>
                    <TextField
                      fullWidth
                      label="Hospital Address"
                      multiline
                      rows={2}
                      margin="normal"
                      required
                    />

                    <TextField
                      fullWidth
                      label="Hospital Registration Number"
                      margin="normal"
                      required
                    />
                  </>
                )}

                {/* NGO FIELDS */}

                {role === "ngo" && (
                  <>
                    <TextField
                      fullWidth
                      label="NGO Address"
                      multiline
                      rows={2}
                      margin="normal"
                      required
                    />

                    <TextField
                      fullWidth
                      label="NGO Registration Number"
                      margin="normal"
                      required
                    />
                  </>
                )}

                <LoginButton type="submit">
                  Register
                </LoginButton>
              </Box>
            )}

            {!role && (
              <Typography
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  mt: 2,
                  fontSize: "0.9rem",
                }}
              >
                Select your role above to continue
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Register;