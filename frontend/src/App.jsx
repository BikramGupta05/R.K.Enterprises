import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./routes/Login.jsx";
import Register from "./routes/Register.jsx";
import ForgotPassword from "./routes/ForgotPassword.jsx";
import ResetPassword from "./routes/ResetPassword.jsx";
import Profile from "./routes/Profile.jsx";
import Dashboard from "./routes/Dashboard.jsx";
import OAuthSuccess from "./routes/OAuthSuccess.jsx";
import Home from "./routes/Home.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import Items from "./routes/Items.jsx";
import Buyers from "./routes/Buyers";
import Purchase from "./routes/Purchase.jsx";
import PurchaseHistory from "./routes/PurchaseHistory.jsx";
import Sellers from "./routes/Sellers.jsx";
import Stock from "./routes/Stock.jsx";
import Selling from "./routes/Selling.jsx";
import SellingHistory from "./routes/SellingHistory.jsx";

function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyers"
          element={
            <ProtectedRoute>
              <Buyers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase"
          element={
            <ProtectedRoute>
              <Purchase />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-history"
          element={
            <ProtectedRoute>
              <PurchaseHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sellers"
          element={
            <ProtectedRoute>
              <Sellers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/selling"
          element={
            <ProtectedRoute>
              <Selling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/selling-history"
          element={
            <ProtectedRoute>
              <SellingHistory />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
