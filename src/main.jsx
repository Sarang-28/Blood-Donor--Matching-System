import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import CssBaseline from "@mui/material/CssBaseline";

import { AuthProvider } from "./context/AuthContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeContextProvider>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);