import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DeleteAccount from "./pages/DeleteAccount";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./api/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}