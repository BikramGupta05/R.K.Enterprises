import { Navigate, Route, Routes, useParams } from "react-router-dom";

import Login from "./routes/Login.jsx";
import Register from "./routes/Register.jsx";
import ForgotPassword from "./routes/ForgotPassword.jsx";
import ResetPassword from "./routes/ResetPassword.jsx";
import OAuthSuccess from "./routes/OAuthSuccess.jsx";

import Dashboard, { DashboardOverview } from "./routes/Dashboard.jsx";

import Profile from "./routes/Profile.jsx";

import Buyers from "./routes/Buyers.jsx";
import Items from "./routes/Items.jsx";
import Sellers from "./routes/Sellers.jsx";

import Purchase from "./routes/Purchase.jsx";
import Selling from "./routes/Selling.jsx";

import PurchaseHistory from "./routes/PurchaseHistory.jsx";
import SellingHistory from "./routes/SellingHistory.jsx";

import Stock from "./routes/Stock.jsx";
import Expenditure from "./routes/Expenditure.jsx";

import Khatabook from "./routes/Khatabook.jsx";
import KhatabookSeller from "./routes/KhatabookSeller.jsx";
import MoneyDue from "./routes/MoneyDue.jsx";
import MoneyDueBuyer from "./routes/MoneyDueBuyer.jsx";

import { useAuth } from "./contexts/AuthContext.jsx";

/* =========================================================
   PROTECTED ROUTE

   Authentication method is NOT changed.

   The existing AuthContext remains responsible for:
   accessToken
   loading
   login
   logout
========================================================= */

function ProtectedRoute({ children }) {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   LEGACY KHATABOOK SELLER REDIRECT

   Keeps old links working while the application is
   migrated completely to /dashboard.
========================================================= */

function LegacyKhatabookSellerRedirect() {
  const { sellerId } = useParams();

  return <Navigate to={`/dashboard/khatabook/${sellerId}`} replace />;
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        {/* ===================================================
            AUTHENTICATION ROUTES

            These are intentionally unchanged.
        =================================================== */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* ===================================================
            PERMANENT DASHBOARD SHELL

            Dashboard never disappears while navigating
            between application sections.

            Child routes render inside <Outlet />.
        =================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* -----------------------------------------------
              DASHBOARD HOME
          ------------------------------------------------ */}

          <Route index element={<DashboardOverview />} />

          {/* -----------------------------------------------
              MANAGEMENT
          ------------------------------------------------ */}

          <Route path="buyers" element={<Buyers />} />

          <Route path="items" element={<Items />} />

          <Route path="sellers" element={<Sellers />} />

          {/* -----------------------------------------------
              TRANSACTIONS
          ------------------------------------------------ */}

          <Route path="purchase" element={<Purchase />} />

          <Route path="purchase/:purchaseId/edit" element={<Purchase />} />

          <Route path="selling" element={<Selling />} />

          {/* -----------------------------------------------
              HISTORY
          ------------------------------------------------ */}

          <Route path="purchase-history" element={<PurchaseHistory />} />

          <Route path="selling-history" element={<SellingHistory />} />

          {/* -----------------------------------------------
              BUSINESS
          ------------------------------------------------ */}

          <Route path="stock" element={<Stock />} />

          <Route path="expenditure" element={<Expenditure />} />

          <Route path="khatabook" element={<Khatabook />} />

          <Route path="khatabook/:sellerId" element={<KhatabookSeller />} />

          <Route path="money-due" element={<MoneyDue />} />

          <Route path="money-due/:buyerId" element={<MoneyDueBuyer />} />

          {/* -----------------------------------------------
              ACCOUNT
          ------------------------------------------------ */}

          <Route path="profile" element={<Profile />} />
        </Route>

        {/* ===================================================
            LEGACY ROUTES

            These redirects are intentionally kept for now.

            They allow old links/bookmarks to continue working.

            We will audit and clean these in Step 14.
        =================================================== */}

        <Route
          path="/profile"
          element={<Navigate to="/dashboard/profile" replace />}
        />

        <Route
          path="/buyers"
          element={<Navigate to="/dashboard/buyers" replace />}
        />

        <Route
          path="/items"
          element={<Navigate to="/dashboard/items" replace />}
        />

        <Route
          path="/sellers"
          element={<Navigate to="/dashboard/sellers" replace />}
        />

        <Route
          path="/purchase"
          element={<Navigate to="/dashboard/purchase" replace />}
        />

        <Route
          path="/purchase-history"
          element={<Navigate to="/dashboard/purchase-history" replace />}
        />

        <Route
          path="/selling"
          element={<Navigate to="/dashboard/selling" replace />}
        />

        <Route
          path="/selling-history"
          element={<Navigate to="/dashboard/selling-history" replace />}
        />

        <Route
          path="/stock"
          element={<Navigate to="/dashboard/stock" replace />}
        />

        <Route
          path="/expenditure"
          element={<Navigate to="/dashboard/expenditure" replace />}
        />

        <Route
          path="/khatabook"
          element={<Navigate to="/dashboard/khatabook" replace />}
        />

        <Route
          path="/khatabook/:sellerId"
          element={<LegacyKhatabookSellerRedirect />}
        />

        <Route
          path="/money-due"
          element={<Navigate to="/dashboard/money-due" replace />}
        />

        <Route
          path="/money-due/:buyerId"
          element={<Navigate to="/dashboard/money-due" replace />}
        />

        {/* ===================================================
            ROOT

            There is NO Home page anymore.

            Dashboard is the permanent application home.
        =================================================== */}

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ===================================================
            UNKNOWN ROUTES
        =================================================== */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
