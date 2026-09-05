import { Navigate, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleSelection from "./pages/RoleSelection";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/roles" element={<RoleSelection />} />
      <Route path="/dashboard" element={<Navigate to="/roles" replace />} />

      <Route
        path="/dashboard/donor"
        element={
          <>
            <Navbar />
            <Dashboard role="donor" />
          </>
        }
      />

      <Route
        path="/dashboard/hospital"
        element={
          <>
            <Navbar />
            <Dashboard role="hospital" />
          </>
        }
      />

      <Route
        path="/dashboard/patient"
        element={
          <>
            <Navbar />
            <Dashboard role="patient" />
          </>
        }
      />

      <Route
        path="/dashboard/ngo"
        element={
          <>
            <Navbar />
            <Dashboard role="ngo" />
          </>
        }
      />
    </Routes>
  );
}

export default App;