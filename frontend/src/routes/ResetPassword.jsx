import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import api from '../api/auth.js';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incomingToken = query.get('token') || '';
    const incomingEmail = query.get('email') || '';
    setToken(incomingToken);
    setEmail(incomingEmail);
  }, [query]);

  const hasToken = Boolean(token);

  const validatePassword = (pw) => {
    // At least 8 chars, one number, one lowercase, one uppercase, one special char
    const strongRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongRe.test(pw);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasToken) {
      setError('The reset link is invalid or missing.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, email, password });
      setMessage('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      secondaryAction={
        <>
          <span>Back to</span>{' '}
          <Link className="font-semibold text-slate-900 hover:text-slate-700" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      {!hasToken ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          The password reset token is missing or invalid. Please use the link sent to your email. If you do not have a valid link, request a new reset email.
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {message && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
