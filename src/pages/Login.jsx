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
} from "@mui/material";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";

import LoginButton from "../components/LoginButton";

const DUMMY_USERNAME = "admin";
const DUMMY_PASSWORD = "123";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === DUMMY_USERNAME && password === DUMMY_PASSWORD) {
      setError("");
      navigate("/roles");
    } else {
      setError("Invalid username or password.");
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
              component={motion.div}
              className="floaty"
              variant="h3"
              color="primary"
              sx={{ textAlign: "center" }}
            >
              🩸
            </Typography>

            <Typography
              variant="h4"
              color="primary"
              sx={{ textAlign: "center", fontWeight: "bold" }}
            >
              Hyperlocal Emergency
            </Typography>

            <Typography
              variant="h5"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: "bold" }}
            >
              Blood Donor Matching
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", mb: 4 }}
            >
              Every Drop Counts • Every Second Matters
            </Typography>

            {error && (
              <Alert
                severity="error"
                component={motion.div}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                margin="normal"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="primary" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <LoginButton type="submit" />
            </Box>
            <Typography sx={{ textAlign: "center", mt: 3 }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  textDecoration: "none",
                  color: "#D32F2F",
                  fontWeight: "bold",
                }}
              >
                Register
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;
