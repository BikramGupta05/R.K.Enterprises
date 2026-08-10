import { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api/auth.js';

const AuthContext = createContext(null);
let refreshRequestPromise = null;

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSessionToken = (token) => {
    setAccessToken(token);
    setAuthToken(token);
  };

  const refreshToken = async () => {
    if (refreshRequestPromise) {
      return refreshRequestPromise;
    }

    refreshRequestPromise = (async () => {
      try {
        const response = await api.post('/auth/refresh-token');
        setSessionToken(response.data.accessToken);
        return response.data.accessToken;
      } catch (error) {
        setSessionToken(null);
        return null;
      } finally {
        refreshRequestPromise = null;
      }
    })();

    return refreshRequestPromise;
  };

  useEffect(() => {
    refreshToken().finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setSessionToken(response.data.accessToken);
    return response.data;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    setSessionToken(response.data.accessToken);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setSessionToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
