import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../api/auth.js';

function Profile() {
  const { logout, accessToken } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await api.get('/profile');
        setUser(profileResponse.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load profile');
      }
    };

    if (accessToken) {
      fetchProfile();
    } else {
      setUser(null);
      setError('');
    }
  }, [accessToken]);

  return (
    <AuthLayout
      title="Your account"
      secondaryAction={
        <>
          <span>Want to explore more?</span>{' '}
          <Link className="font-semibold text-slate-900 hover:text-slate-700" to="/">
            Home
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        {user ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Name</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Role</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-600">Loading profile…</div>
        )}
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}

export default Profile;
