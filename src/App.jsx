import { Navigate, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleSelection from "./pages/RoleSelection";
import BloodRequests from "./pages/BloodRequests";
import Donors from "./pages/Donors";
import Profile from "./pages/Profile";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/roles" element={<RoleSelection />} />
      
      {/* Admin Routes */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="/dashboard" element={<Navigate to="/roles" replace />} />
      {["donor", "hospital", "patient", "ngo"].map((role) => (
        <Route
          key={`blood-requests-${role}`}
          path={`/blood-requests/${role}`}
          element={
            <>
              <Navbar />
              <BloodRequests role={role} />
            </>
          }
        />
      ))}

      {["hospital", "patient", "ngo"].map((role) => (
        <Route
          key={`donors-${role}`}
          path={`/donors/${role}`}
          element={
            <>
              <Navbar />
              <Donors role={role} />
            </>
          }
        />
      ))}

      {["donor", "hospital", "patient", "ngo"].map((role) => (
        <Route
          key={`dashboard-${role}`}
          path={`/dashboard/${role}`}
          element={
            <>
              <Navbar />
              <Dashboard role={role} />
            </>
          }
        />
      ))}

      {["donor", "hospital", "patient", "ngo"].map((role) => (
        <Route
          key={`profile-${role}`}
          path={`/profile/${role}`}
          element={
            <>
              <Navbar />
              <Profile role={role} />
            </>
          }
        />
      ))}
    </Routes>
  );
}

export default App;