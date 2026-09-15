import { useState, useEffect } from "react";
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
  CircularProgress,
  Button,
} from "@mui/material";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PersonalInjuryIcon from "@mui/icons-material/PersonalInjury";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";

import LoginButton from "../components/LoginButton";
import { useAuth } from "../context/AuthContext";

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
    value: "blood_bank",
    label: "Blood Bank",
    icon: <BloodtypeIcon />,
  },
];

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, register, selectRole } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialRoleParam = queryParams.get("role") || location.state?.role || "";

  const [role, setRole] = useState(initialRoleParam);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    organizationName: "",
    email: user?.email || "",
    password: "",
    phone: user?.phone || "",
    bloodGroup: profile?.blood_group || "O+",
    lastDonationDate: "",
    location: profile?.location_name || profile?.address || "Pune, Maharashtra",
    // Hospital
    hospitalAddress: "",
    hospitalRegistrationNumber: "",
    emergencyContact: "",
    // Patient
    patientAddress: profile?.location_name || profile?.address || "Pune, Maharashtra",
    medicalCondition: "",
    // Blood Bank
    bloodBankAddress: "",
    licenseNumber: "",
    directorName: "",
    operatingHours: "24/7",
  });

  useEffect(() => {
    if (initialRoleParam) {
      setRole(initialRoleParam);
    }
  }, [initialRoleParam]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        fullName: prev.fullName || profile?.full_name || "",
        bloodGroup: prev.bloodGroup || profile?.blood_group || "O+",
      }));
    }
  }, [user, profile]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!role) {
      setError("Please select a role to continue.");
      return;
    }

    if (!formData.email || (!user && !formData.password) || !formData.phone) {
      setError("Please fill in all mandatory account credentials.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        role,
      };

      await register(payload);

      if (user) {
        if (selectRole) {
          selectRole(role);
        }
        navigate("/roles", {
          state: {
            successMessage: `Successfully added ${role.replace("_", " ").toUpperCase()} profile to your account! You can now switch between roles anytime.`,
          },
        });
      } else {
        navigate("/login", {
          state: {
            successMessage: "Registration successful! Please sign in with your email and password.",
            registeredEmail: formData.email,
          },
        });
      }
    } catch (err) {
      console.error("Registration failed:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;
      setError(msg || "Registration failed. Please review your details and try again.");
    } finally {
      setLoading(false);
    }
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
        py: 6,
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
              Join the Emergency Blood Donor Network
            </Typography>

            {user && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Adding Role Profile to Your Account
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Signed in as <strong>{user.email}</strong>. Setting up a new role profile here will link it to your existing account so you can easily switch between roles.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/roles")}
                    sx={{ textTransform: "none", p: 0, fontWeight: 600 }}
                  >
                    Back to Role Selection
                  </Button>
                </Box>
              </Alert>
            )}

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
              {user ? "Select the role profile you want to add:" : "I am registering as a..."}
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
                {/* COMMON ACCOUNT FIELDS */}
                <TextField
                  fullWidth
                  label={
                    role === "hospital" || role === "blood_bank"
                      ? "Institution / Organization Name"
                      : "Full Name"
                  }
                  margin="normal"
                  required
                  value={
                    role === "hospital" || role === "blood_bank"
                      ? formData.organizationName
                      : formData.fullName
                  }
                  onChange={
                    role === "hospital" || role === "blood_bank"
                      ? handleChange("organizationName")
                      : handleChange("fullName")
                  }
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  margin="normal"
                  required
                  disabled={Boolean(user)}
                  value={formData.email}
                  onChange={handleChange("email")}
                  helperText={user ? "Linked to your current account" : ""}
                />

                <TextField
                  fullWidth
                  type="password"
                  label={user ? "Account Password (Optional)" : "Password"}
                  helperText={
                    user
                      ? "Optional: You are logged in, so your existing password is automatically preserved."
                      : "Minimum 6 characters"
                  }
                  margin="normal"
                  required={!user}
                  value={formData.password}
                  onChange={handleChange("password")}
                />

                <TextField
                  fullWidth
                  label="Contact Phone Number"
                  type="tel"
                  margin="normal"
                  required
                  value={formData.phone}
                  onChange={handleChange("phone")}
                />

                {/* DONOR FIELDS */}
                {role === "donor" && (
                  <>
                    <TextField
                      fullWidth
                      select
                      label="Blood Group"
                      margin="normal"
                      value={formData.bloodGroup}
                      onChange={handleChange("bloodGroup")}
                      required
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (group) => (
                          <MenuItem key={group} value={group}>
                            {group}
                          </MenuItem>
                        )
                      )}
                    </TextField>

                    <TextField
                      fullWidth
                      type="date"
                      label="Last Donation Date (if any)"
                      margin="normal"
                      value={formData.lastDonationDate}
                      onChange={handleChange("lastDonationDate")}
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Current Location / Area"
                      placeholder="e.g. Pimpri, Pune"
                      margin="normal"
                      required
                      value={formData.location}
                      onChange={handleChange("location")}
                    />
                  </>
                )}

                {/* PATIENT FIELDS */}
                {role === "patient" && (
                  <>
                    <TextField
                      fullWidth
                      select
                      label="Blood Group Needed / Patient Blood Group"
                      margin="normal"
                      value={formData.bloodGroup}
                      onChange={handleChange("bloodGroup")}
                      required
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (group) => (
                          <MenuItem key={group} value={group}>
                            {group}
                          </MenuItem>
                        )
                      )}
                    </TextField>

                    <TextField
                      fullWidth
                      label="Residential Address / Location"
                      placeholder="e.g. Pune, Maharashtra"
                      margin="normal"
                      required
                      value={formData.patientAddress}
                      onChange={handleChange("patientAddress")}
                    />

                    <TextField
                      fullWidth
                      label="Medical Condition / Reason for Blood Need"
                      placeholder="e.g. Surgery, Dengue, Emergency Care"
                      margin="normal"
                      value={formData.medicalCondition}
                      onChange={handleChange("medicalCondition")}
                    />

                    <TextField
                      fullWidth
                      label="Emergency Contact Phone"
                      type="tel"
                      margin="normal"
                      value={formData.emergencyContact}
                      onChange={handleChange("emergencyContact")}
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
                      value={formData.hospitalAddress}
                      onChange={handleChange("hospitalAddress")}
                    />

                    <TextField
                      fullWidth
                      label="Hospital License / Registration Number"
                      margin="normal"
                      required
                      value={formData.hospitalRegistrationNumber}
                      onChange={handleChange("hospitalRegistrationNumber")}
                    />
                  </>
                )}

                {/* BLOOD BANK FIELDS */}
                {role === "blood_bank" && (
                  <>
                    <TextField
                      fullWidth
                      label="Blood Bank Facility Address"
                      multiline
                      rows={2}
                      margin="normal"
                      required
                      value={formData.bloodBankAddress}
                      onChange={handleChange("bloodBankAddress")}
                    />

                    <TextField
                      fullWidth
                      label="Blood Bank Registration / License No"
                      margin="normal"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange("licenseNumber")}
                    />

                    <TextField
                      fullWidth
                      label="Director / Medical Officer In-Charge"
                      margin="normal"
                      value={formData.directorName}
                      onChange={handleChange("directorName")}
                    />

                    <TextField
                      fullWidth
                      label="Operating Hours"
                      placeholder="e.g. 24/7 or 8 AM - 8 PM"
                      margin="normal"
                      value={formData.operatingHours}
                      onChange={handleChange("operatingHours")}
                    />
                  </>
                )}

                <Box sx={{ mt: 3 }}>
                  <LoginButton type="submit" disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
                  </LoginButton>
                </Box>
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

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Already registered?{" "}
                <Link to="/" style={{ color: "#D32F2F", fontWeight: 600, textDecoration: "none" }}>
                  Log In
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Register;