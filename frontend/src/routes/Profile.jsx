import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/auth.js";

function Profile() {
  const navigate = useNavigate();
  const { logout, accessToken } = useAuth();

  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await api.get("/profile");
        setUser(profileResponse.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load profile");
      }
    };

    if (accessToken) {
      fetchProfile();
    } else {
      setUser(null);
      setError("");
    }
  }, [accessToken]);

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1100px]">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Profile
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            View your account information and manage your session.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            PROFILE CARD
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">
              Account Information
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Your information associated with this account.
            </p>
          </div>

          {user ? (
            <div className="divide-y divide-slate-100">
              {/* Name */}

              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {user.name || "—"}
                </p>
              </div>

              {/* Email */}

              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </p>

                <p className="break-all text-sm font-semibold text-slate-900">
                  {user.email || "—"}
                </p>
              </div>

              {/* Role */}

              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {user.role || "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-xs text-slate-500">
              Loading profile...
            </div>
          )}
        </div>

        {/* =====================================================
            SESSION ACTION
        ===================================================== */}

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sign out</h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Sign out of your current account on this device.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-9 rounded-md bg-rose-600 px-4 text-xs font-semibold text-white transition hover:bg-rose-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
