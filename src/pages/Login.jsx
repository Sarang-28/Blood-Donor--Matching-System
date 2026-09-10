import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Favorite,
  AdminPanelSettings,
  ArrowForward,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const { user } = await login({ email: username.trim(), password });
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate(`/dashboard/${user.role}`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      const serverMsg = err.response?.data?.message || err.message;
      setError(serverMsg || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #fff5f6 0%, #f7f8fc 50%, #eef1f8 100%)",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Card
          elevation={0}
          sx={{
            minHeight: { xs: "auto", md: 650 },
            borderRadius: 5,
            overflow: "hidden",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            boxSizing: "border-box",
            boxShadow: "0 25px 70px rgba(25, 25, 50, 0.12)",
            border: "1px solid rgba(255,255,255,0.8)",
          }}
        >
          {/* LEFT SIDE */}
          <Box
            sx={{
              flex: { xs: "none", md: "0 0 52%" },
              width: { xs: "100%", md: "52%" },
              minHeight: { xs: 320, md: 650 },
              position: "relative",
              backgroundImage: 'url("/role_images/blood donation.jpg")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "flex-end",
              p: { xs: 4, md: 6 },
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {/* Image overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(120,0,20,0.82) 100%)",
              }}
            />

            

            {/* Left content */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              sx={{
                position: "relative",
                zIndex: 2,
                color: "#fff",
                maxWidth: 500,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 2,
                  opacity: 0.9,
                }}
              >
                HYPERLOCAL EMERGENCY
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mt: 1,
                  lineHeight: 1.1,
                  fontSize: { xs: "2rem", md: "3rem" },
                }}
              >
                Blood Donor
                <br />
                Matching
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  opacity: 0.9,
                  maxWidth: 430,
                }}
              >
                Connecting people who need blood with nearby donors when
                every second matters.
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 35,
                    height: 3,
                    borderRadius: 5,
                    background: "#fff",
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Every Drop Counts
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* RIGHT SIDE */}
          <Box
            sx={{
              flex: { xs: "none", md: "1 1 48%" },
              width: { xs: "100%", md: "48%" },
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 4, md: 7 },
              background: "#fff",
              boxSizing: "border-box",
            }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              sx={{
                width: "100%",
                maxWidth: 430,
              }}
            >
              {/* Logo */}
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: 3,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 35%, rgba(120,0,20,0.78) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                  boxShadow: "0 10px 25px rgba(229,56,77,0.25)",
                }}
              >
                <Favorite sx={{ color: "#fff", fontSize: 30 }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#171717",
                }}
              >
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  mt: 1,
                  mb: 4,
                }}
              >
                Sign in to continue to your account
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLogin}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: "0.9rem",
                  }}
                >
                  Email / Username
                </Typography>

                <TextField
                  fullWidth
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  sx={{
                    mb: 2.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      background: "#FAFAFC",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "#E5384D" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: "0.9rem",
                  }}
                >
                  Password
                </Typography>

                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      background: "#FAFAFC",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: "#E5384D" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  endIcon={<ArrowForward />}
                  sx={{
                    py: 1.7,
                    borderRadius: 2.5,
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "none",
                    background:
                      "linear-gradient(135deg, #E5384D, #F04B60)",
                    boxShadow:
                      "0 10px 25px rgba(229,56,77,0.25)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #D92F44, #E5384D)",
                      boxShadow:
                        "0 14px 30px rgba(229,56,77,0.32)",
                    },
                  }}
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Login"}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  OR
                </Typography>
              </Divider>

              {/* Register */}
              <Typography
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                Don't have an account?{" "}
                <Box
                  component={Link}
                  to="/register"
                  sx={{
                    color: "#E5384D",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Create Account
                </Box>
              </Typography>

              {/* Admin */}
              <Button
                fullWidth
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate("/admin-login")}
                sx={{
                  mt: 2.5,
                  py: 1.2,
                  borderRadius: 2,
                  color: "#555",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    background: "#F6F7FB",
                    color: "#222",
                  },
                }}
              >
                Login as Administrator
              </Button>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;