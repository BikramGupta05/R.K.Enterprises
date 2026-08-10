import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/auth.js";
import Navbar from "../components/Navbar.jsx";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/profile");

        setStats(response.data.user);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load dashboard data.",
        );
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        {/* ---------------- Dashboard Header ---------------- */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>

          <p className="mt-2 text-slate-600">
            A secure authenticated area for your account.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {stats ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* Name */}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                  Name
                </p>

                <p className="mt-3 text-xl font-semibold text-slate-900">
                  {stats.name}
                </p>
              </div>

              {/* Email */}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                  Email
                </p>

                <p className="mt-3 break-all text-xl font-semibold text-slate-900">
                  {stats.email}
                </p>
              </div>

              {/* Role */}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                  Role
                </p>

                <p className="mt-3 text-xl font-semibold capitalize text-slate-900">
                  {stats.role}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              Loading dashboard data…
            </div>
          )}
        </div>

        {/* ---------------- Management Section ---------------- */}

        <div>
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">
            Management
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* ---------------- Buyer ---------------- */}

            <button
              type="button"
              onClick={() => navigate("/buyers")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Buyers</h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage your buyer and shop details.
              </p>
            </button>

            {/* ---------------- Items ---------------- */}

            <button
              type="button"
              onClick={() => navigate("/items")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Item List
                </h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage the items in your personal item list.
              </p>
            </button>

            {/* ---------------- Purchase ---------------- */}

            <button
              type="button"
              onClick={() => navigate("/purchase")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Purchase
                </h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create a new purchase from your buyers.
              </p>
            </button>

            {/* ---------------- Purchase History ---------------- */}

            <button
              type="button"
              onClick={() => navigate("/purchase-history")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Purchase History
                </h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                View previous purchases and their details.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/sellers")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Sellers
                </h3>

                <span className="text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage your sellers and suppliers.
              </p>
            </button>
            <div
              onClick={() => navigate("/stock")}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-8 shadow transition hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold">In Stock</h2>

              <p className="mt-3 text-slate-500">
                View your currently available stock.
              </p>
            </div>
            <div
              onClick={() => navigate("/selling")}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-8 shadow transition hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold">Selling</h2>

              <p className="mt-3 text-slate-500">
                Sell items from your available stock.
              </p>
            </div>
            <div
              onClick={() => navigate("/selling-history")}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-8 shadow transition hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold">Selling History</h2>

              <p className="mt-3 text-slate-500">View your previous sales.</p>
            </div>
            <div
              onClick={() => navigate("/expenditure")}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                Expenditure
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Track and analyse your business expenses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
