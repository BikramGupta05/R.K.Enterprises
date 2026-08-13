import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/auth.js";

function DashboardHome() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile");

        setUser(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard.");
      }
    };

    fetchProfile();
  }, []);

  const sections = [
    {
      title: "Buyers",
      description: "Manage buyers and shops",
      path: "/dashboard/buyers",
    },
    {
      title: "Items",
      description: "Manage your item catalogue",
      path: "/dashboard/items",
    },
    {
      title: "Sellers",
      description: "Manage sellers and suppliers",
      path: "/dashboard/sellers",
    },
    {
      title: "Purchase",
      description: "Create a new purchase",
      path: "/dashboard/purchase",
    },
    {
      title: "Selling",
      description: "Create a new sale",
      path: "/dashboard/selling",
    },
    {
      title: "Stock",
      description: "View current stock",
      path: "/dashboard/stock",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}

      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

          <p className="mt-1 text-xs text-slate-500">
            Manage your business from one place.
          </p>
        </div>

        {user?.name && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Account
            </p>

            <p className="text-sm font-semibold text-slate-700">{user.name}</p>
          </div>
        )}
      </div>

      {/* Error */}

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Quick Access */}

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Quick Access
          </h2>

          <span className="text-[10px] text-slate-400">
            {sections.length} modules
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden border border-slate-300 bg-slate-300 sm:grid-cols-3 lg:grid-cols-6">
          {sections.map((section) => (
            <button
              key={section.path}
              type="button"
              onClick={() => navigate(section.path)}
              className="group min-w-0 bg-white p-3 text-left transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {section.title}
                </h3>

                <span className="text-sm text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700">
                  →
                </span>
              </div>

              <p className="mt-1 truncate text-[10px] text-slate-500">
                {section.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Other Modules */}

      <div className="border border-slate-300 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Other Modules
          </h2>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/purchase-history")}
            className="p-3 text-left transition hover:bg-slate-50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Purchase History
            </p>

            <p className="mt-1 text-xs text-slate-600">View purchase records</p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/selling-history")}
            className="p-3 text-left transition hover:bg-slate-50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Selling History
            </p>

            <p className="mt-1 text-xs text-slate-600">View sales records</p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/expenditure")}
            className="p-3 text-left transition hover:bg-slate-50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Expenditure
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Track business expenses
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/khatabook")}
            className="p-3 text-left transition hover:bg-slate-50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Khatabook
            </p>

            <p className="mt-1 text-xs text-slate-600">Track balances</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
