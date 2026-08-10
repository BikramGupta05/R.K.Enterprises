import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";

function Home() {
  const { accessToken } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Navbar />

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-300/30 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Secure access for modern teams
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Welcome to XYZ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Experience a secure authentication experience with email login,
            Google OAuth, password recovery, and protected dashboards.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {accessToken ? (
              <Link
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                to="/dashboard"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  to="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  to="/register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
