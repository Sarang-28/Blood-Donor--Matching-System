import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { motion } from "framer-motion";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../services/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Profile({ role }) {
  const { user, profile, updateProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Common / Donor
    fullName: "",
    bloodGroup: "O+",
    age: "",
    weightKg: "",
    locationName: "",
    emergencyReady: true,
    // Patient
    medicalCondition: "",
    attendingDoctor: "",
    emergencyContact: "",
    // Hospital
    hospitalName: "",
    licenseNumber: "",
    speciality: "",
    // Blood Bank
    bloodBankName: "",
    directorName: "",
    operatingHours: "24/7",
    phone: "",
  });

  // Fetch fresh profile details from the backend on load or when role changes
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentProfile = async () => {
      try {
        setLoading(true);
        setError("");

        let endpoint = "";
        if (role === "donor") endpoint = "/donors/profile";
        else if (role === "patient") endpoint = "/patients/profile";
        else if (role === "hospital") endpoint = "/hospitals/profile";
        else if (role === "blood_bank" || role === "ngo") endpoint = "/blood-banks/profile/me";

        if (endpoint) {
          const res = await api.get(endpoint);
          if (isMounted && res.data?.data) {
            const d = res.data.data;
            setFormData({
              fullName: d.full_name || d.hospital_name || d.blood_bank_name || d.ngo_name || "",
              bloodGroup: d.blood_group || "O+",
              age: d.age !== null && d.age !== undefined ? d.age.toString() : "",
              weightKg: d.weight_kg !== null && d.weight_kg !== undefined ? d.weight_kg.toString() : "",
              locationName: d.location_name || d.address || "",
              emergencyReady: d.emergency_ready !== undefined ? Boolean(d.emergency_ready) : true,
              medicalCondition: d.medical_condition || "",
              attendingDoctor: d.attending_doctor || "",
              emergencyContact: d.emergency_contact || "",
              hospitalName: d.hospital_name || "",
              licenseNumber: d.license_number || d.registration_number || "",
              speciality: d.speciality || "",
              bloodBankName: d.blood_bank_name || "",
              directorName: d.director_name || d.coordinator_name || "",
              operatingHours: d.operating_hours || "24/7",
              phone: user?.phone || d.phone || d.contact_number || "",
            });

            if (updateProfile) {
              updateProfile(d);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote profile, falling back to cached session:", err);
        if (isMounted && profile) {
          setFormData({
            fullName: profile.full_name || profile.hospital_name || profile.blood_bank_name || "",
            bloodGroup: profile.blood_group || "O+",
            age: profile.age !== null && profile.age !== undefined ? profile.age.toString() : "",
            weightKg: profile.weight_kg !== null && profile.weight_kg !== undefined ? profile.weight_kg.toString() : "",
            locationName: profile.location_name || profile.address || "",
            emergencyReady: profile.emergency_ready !== undefined ? Boolean(profile.emergency_ready) : true,
            medicalCondition: profile.medical_condition || "",
            attendingDoctor: profile.attending_doctor || "",
            emergencyContact: profile.emergency_contact || "",
            hospitalName: profile.hospital_name || "",
            licenseNumber: profile.license_number || "",
            speciality: profile.speciality || "",
            bloodBankName: profile.blood_bank_name || "",
            directorName: profile.director_name || "",
            operatingHours: profile.operating_hours || "24/7",
            phone: user?.phone || "",
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCurrentProfile();
    return () => {
      isMounted = false;
    };
  }, [role]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.checked }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    setError("");
    setSaved(false);

    // Client-side validations
    if (role === "donor") {
      if (formData.age) {
        const parsedAge = parseInt(formData.age, 10);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
          setError("Donor age must be between 18 and 65 years.");
          return;
        }
      }
      if (formData.weightKg) {
        const parsedWeight = parseFloat(formData.weightKg);
        if (isNaN(parsedWeight) || parsedWeight < 45.0) {
          setError("Donor weight must be at least 45 kg to be eligible for blood donation.");
          return;
        }
      }
    }

    try {
      setSaving(true);
      let res;

      if (role === "donor") {
        res = await api.put("/donors/profile", {
          fullName: formData.fullName,
          bloodGroup: formData.bloodGroup,
          age: formData.age ? parseInt(formData.age, 10) : null,
          weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
          locationName: formData.locationName,
          emergencyReady: formData.emergencyReady,
        });
      } else if (role === "patient") {
        res = await api.put("/patients/profile", {
          fullName: formData.fullName,
          bloodGroup: formData.bloodGroup,
          medicalCondition: formData.medicalCondition,
          attendingDoctor: formData.attendingDoctor,
          address: formData.locationName,
          emergencyContact: formData.emergencyContact,
        });
      } else if (role === "hospital") {
        res = await api.put("/hospitals/profile", {
          hospitalName: formData.hospitalName || formData.fullName,
          licenseNumber: formData.licenseNumber,
          speciality: formData.speciality,
          address: formData.locationName,
          emergencyContact: formData.emergencyContact,
        });
      } else if (role === "blood_bank" || role === "ngo") {
        res = await api.put("/blood-banks/profile/me", {
          bloodBankName: formData.bloodBankName || formData.fullName,
          licenseNumber: formData.licenseNumber,
          directorName: formData.directorName,
          contactNumber: formData.phone,
          operatingHours: formData.operatingHours,
          address: formData.locationName,
        });
      }

      if (res?.data?.data) {
        const updated = res.data.data;
        if (updateProfile) {
          updateProfile(updated);
        }
        setFormData((prev) => ({
          ...prev,
          age: updated.age !== null && updated.age !== undefined ? updated.age.toString() : prev.age,
          weightKg: updated.weight_kg !== null && updated.weight_kg !== undefined ? updated.weight_kg.toString() : prev.weightKg,
          fullName: updated.full_name || updated.hospital_name || updated.blood_bank_name || prev.fullName,
          bloodGroup: updated.blood_group || prev.bloodGroup,
          locationName: updated.location_name || updated.address || prev.locationName,
          emergencyReady: updated.emergency_ready !== undefined ? Boolean(updated.emergency_ready) : prev.emergencyReady,
        }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(msg || "Failed to update profile. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", background: "#F6F7FB", minHeight: "100vh" }}>
      <Sidebar role={role} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: { xs: 7, sm: 8 },
        }}
      >
        <Typography
          component={motion.h4}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="h4"
          sx={{ fontWeight: "bold", mb: 1 }}
        >
          Profile Settings
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Manage your personal details, physical eligibility, and contact information.
        </Typography>

        {saved && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            Profile updated successfully! Your details have been permanently saved.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Avatar & Summary Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, borderRadius: 3, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                  boxShadow: "0 4px 14px rgba(229, 56, 77, 0.35)",
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 70 }} />
              </Avatar>

              <Typography variant="h6" fontWeight="bold">
                {formData.fullName || user?.email || "Account User"}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize", mb: 1 }}>
                Role: {role?.replace("_", " ")}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {user?.email}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: "left", px: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Registered Phone:</strong> {user?.phone || "Not set"}
                </Typography>
                {role === "donor" && (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      <strong>Blood Group:</strong> {formData.bloodGroup}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      <strong>Current Age:</strong> {formData.age ? `${formData.age} yrs` : "Not specified"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      <strong>Weight:</strong> {formData.weightKg ? `${formData.weightKg} kg` : "Not specified"}
                    </Typography>
                  </>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Details Form Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Edit Account Information
                </Typography>
                {loading && <CircularProgress size={20} />}
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSave}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Account Email"
                      value={user?.email || ""}
                      disabled
                      helperText="Account email cannot be changed"
                    />
                  </Grid>

                  {/* DONOR SPECIFIC FIELDS */}
                  {role === "donor" && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={formData.fullName}
                          onChange={handleChange("fullName")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Blood Group"
                          value={formData.bloodGroup}
                          onChange={handleChange("bloodGroup")}
                          required
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <MenuItem key={bg} value={bg}>
                              {bg}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Age (18 - 65)"
                          value={formData.age}
                          onChange={handleChange("age")}
                          inputProps={{ min: 18, max: 65 }}
                          required
                          helperText="Eligibility criteria: 18 to 65 years"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Weight in kg (Min 45 kg)"
                          value={formData.weightKg}
                          onChange={handleChange("weightKg")}
                          inputProps={{ min: 45, step: "0.5" }}
                          required
                          helperText="Minimum donor weight is 45.0 kg"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Location / Area / City"
                          value={formData.locationName}
                          onChange={handleChange("locationName")}
                          placeholder="e.g. Pimpri, Pune"
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.emergencyReady}
                              onChange={handleSwitchChange("emergencyReady")}
                              color="error"
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={600}>
                              Emergency Ready (Receive urgent broadcast notifications for critical needs)
                            </Typography>
                          }
                        />
                      </Grid>
                    </>
                  )}

                  {/* PATIENT SPECIFIC FIELDS */}
                  {role === "patient" && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Patient Full Name"
                          value={formData.fullName}
                          onChange={handleChange("fullName")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          select
                          label="Blood Group Needed"
                          value={formData.bloodGroup}
                          onChange={handleChange("bloodGroup")}
                          required
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <MenuItem key={bg} value={bg}>
                              {bg}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Attending Doctor"
                          value={formData.attendingDoctor}
                          onChange={handleChange("attendingDoctor")}
                          placeholder="e.g. Dr. Kulkarni"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Emergency Contact Phone"
                          value={formData.emergencyContact}
                          onChange={handleChange("emergencyContact")}
                          placeholder="e.g. +91 9876543210"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Medical Condition / Reason"
                          value={formData.medicalCondition}
                          onChange={handleChange("medicalCondition")}
                          placeholder="e.g. Surgery, Dengue, Thalassemia"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Address / Hospital Location"
                          value={formData.locationName}
                          onChange={handleChange("locationName")}
                          required
                        />
                      </Grid>
                    </>
                  )}

                  {/* HOSPITAL SPECIFIC FIELDS */}
                  {role === "hospital" && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Hospital Name"
                          value={formData.hospitalName || formData.fullName}
                          onChange={handleChange("hospitalName")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="License / Registration No."
                          value={formData.licenseNumber}
                          onChange={handleChange("licenseNumber")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Speciality"
                          value={formData.speciality}
                          onChange={handleChange("speciality")}
                          placeholder="e.g. General, Trauma, Oncology"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Emergency Contact Number"
                          value={formData.emergencyContact}
                          onChange={handleChange("emergencyContact")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Hospital Address"
                          value={formData.locationName}
                          onChange={handleChange("locationName")}
                          required
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </>
                  )}

                  {/* BLOOD BANK / NGO SPECIFIC FIELDS */}
                  {(role === "blood_bank" || role === "ngo") && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Facility / Blood Bank Name"
                          value={formData.bloodBankName || formData.fullName}
                          onChange={handleChange("bloodBankName")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="License Number"
                          value={formData.licenseNumber}
                          onChange={handleChange("licenseNumber")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Director / In-Charge Name"
                          value={formData.directorName}
                          onChange={handleChange("directorName")}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Operating Hours"
                          value={formData.operatingHours}
                          onChange={handleChange("operatingHours")}
                          placeholder="e.g. 24/7 or 8 AM - 8 PM"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Facility Address"
                          value={formData.locationName}
                          onChange={handleChange("locationName")}
                          required
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Box sx={{ mt: 4, textAlign: "right" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    disabled={saving}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 4, py: 1 }}
                  >
                    {saving ? <CircularProgress size={22} color="inherit" /> : "Save Profile Changes"}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Profile;
