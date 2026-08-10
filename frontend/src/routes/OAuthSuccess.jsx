import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

function OAuthSuccess() {
  const { refreshToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const completeAuthentication = async () => {
      try {
        const token = await refreshToken();
        if (token) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setError('Unable to complete Google sign-in. Redirecting to login...');
      } catch (err) {
        console.error('OAuth refresh error', err);
        setError('Unable to complete Google sign-in. Redirecting to login...');
      }

      setTimeout(() => navigate('/login', { replace: true }), 3500);
    };

    if (location.search.includes('auth=google')) {
      completeAuthentication();
    } else {
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, refreshToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <h1 className="text-2xl font-semibold text-slate-900">Completing sign in...</h1>
        <p className="mt-4 text-slate-600">Please wait while we finalize your Google sign-in.</p>
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}

export default OAuthSuccess;
