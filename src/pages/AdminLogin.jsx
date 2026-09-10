import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  InputAdornment,
  Button,
  IconButton,
} from "@mui/material";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your admin email/username and password.");
      return;
    }

    try {
      setLoading(true);
      await adminLogin({ email: username.trim(), password });
      navigate("/admin");
    } catch (err) {
      console.error("Admin login failed:", err);
      const msg = err.response?.data?.message || err.message;
      setError(msg || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A1A2E, #16213E, #0F3460)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
            p: 3,
            boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
            background: "#ffffff",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <AdminPanelSettingsIcon
                sx={{ fontSize: 60, color: "#0F3460" }}
                component={motion.svg}
                whileHover={{ scale: 1.1, rotate: 5 }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{ textAlign: "center", fontWeight: "bold", color: "#1A1A2E" }}
            >
              Admin Portal
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", mb: 4 }}
            >
              Secure System Management Access
            </Typography>

            {error && (
              <Alert
                severity="error"
                component={motion.div}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                margin="normal"
                label="Admin Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <AdminPanelSettingsIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                type={showPassword ? "text" : "password"}
                label="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #1A1A2E, #0F3460)",
                  textTransform: "none",
                  boxShadow: "0 8px 16px rgba(15, 52, 96, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(90deg, #16213E, #1A1A2E)",
                  },
                }}
              >
                Access System
              </Button>
            </Box>

            <Typography sx={{ textAlign: "center", mt: 2, fontSize: "0.95rem" }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "#0F3460",
                  fontWeight: "500",
                }}
              >
                ← Back to User Login
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default AdminLogin;
