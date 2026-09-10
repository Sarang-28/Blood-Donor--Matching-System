import { Navigate, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleSelection from "./pages/RoleSelection";
import BloodRequests from "./pages/BloodRequests";
import Donors from "./pages/Donors";
import Profile from "./pages/Profile";
import Emergency from "./pages/Emergency";
import BloodBankDashboard from "./pages/BloodBankDashboard";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const APP_ROLES = ["donor", "hospital", "patient", "blood_bank", "ngo"];

function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/roles" element={<RoleSelection />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/emergency" element={<Emergency />} />

      {/* Admin Route with Protection */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<Navigate to="/roles" replace />} />

      {/* Blood Requests per Role */}
      {APP_ROLES.map((role) => (
        <Route
          key={`blood-requests-${role}`}
          path={`/blood-requests/${role}`}
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <BloodRequests role={role} />
              </>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Donors List per Role */}
      {["hospital", "patient", "blood_bank", "ngo"].map((role) => (
        <Route
          key={`donors-${role}`}
          path={`/donors/${role}`}
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Donors role={role} />
              </>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Dedicated Inventory Route for Blood Banks */}
      {["blood_bank", "ngo"].map((role) => (
        <Route
          key={`inventory-${role}`}
          path={`/inventory/${role}`}
          element={
            <ProtectedRoute allowedRoles={["blood_bank", "ngo", "admin"]}>
              <>
                <Navbar />
                <BloodBankDashboard role={role} />
              </>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Dashboard per Role */}
      {APP_ROLES.map((role) => (
        <Route
          key={`dashboard-${role}`}
          path={`/dashboard/${role}`}
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Dashboard role={role} />
              </>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Profile per Role */}
      {APP_ROLES.map((role) => (
        <Route
          key={`profile-${role}`}
          path={`/profile/${role}`}
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Profile role={role} />
              </>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;