// frontend/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout & wrappers
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";

// Auth context & route guards
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/Guards";

// Resident pages
import Dashboard from "./pages/Dashboard";
import SpecialRequestForm from "./pages/SpecialRequestForm";
import RecyclableSubmissionForm from "./pages/RecyclableSubmissionForm";
import History from "./pages/History";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin pages
import AdminPanel from "./pages/AdminPanel";
import AdminRequestsQueue from "./pages/AdminRequestsQueue";
import AdminCapacity from "./pages/AdminCapacity";
import AdminReports from "./pages/AdminReports";

// Fallback
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Navbar />
          <main className="container">
            <Routes>
              {/* Auth-free routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected resident routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/special"
                element={
                  <ProtectedRoute>
                    <SpecialRequestForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recycle"
                element={
                  <ProtectedRoute>
                    <RecyclableSubmissionForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rewards"
                element={
                  <ProtectedRoute>
                    <Rewards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/queue"
                element={
                  <AdminRoute>
                    <AdminRequestsQueue />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/capacity"
                element={
                  <AdminRoute>
                    <AdminCapacity />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <AdminReports />
                  </AdminRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
