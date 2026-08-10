import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function Navbar() {
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-4">
        <Link
          className="text-lg font-semibold text-slate-900"
          to={accessToken ? "/dashboard" : "/"}
        >
          XYZ
        </Link>
        {accessToken && (
          <Link
            className="text-sm text-slate-600 hover:text-slate-900"
            to="/profile"
          >
            Profile
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Link
          className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          to="/"
        >
          Home
        </Link>
        {accessToken ? (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        ) : (
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            to="/login"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
