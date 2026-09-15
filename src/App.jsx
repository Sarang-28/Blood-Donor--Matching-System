import { useEffect } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { requestFirebaseNotificationPermission, onMessageListener } from "./config/firebase";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
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
  const location = useLocation();

  useEffect(() => {
    // Only request permission if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      requestFirebaseNotificationPermission();
    }
  }, [location.pathname]); // Re-check when route changes

  useEffect(() => {
    const handlePushNotification = async () => {
      try {
        const payload = await onMessageListener();
        if (payload && payload.notification) {
          // Display push notification using browser's native API if in foreground
          // or you could use a toast library here.
          new Notification(payload.notification.title, {
            body: payload.notification.body,
          });
        }
        handlePushNotification(); // Call recursively to listen for the next message
      } catch (err) {
        console.error('Failed to listen to FCM messages', err);
      }
    };
    handlePushNotification();
  }, []);

  return (
    <Routes>
      {/* Public Landing & Authentication Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
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
      <Route
        path="/admin/:view"
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