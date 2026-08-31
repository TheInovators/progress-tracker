import { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const enter = async (path, payload) => {
    const { token, user: account } = await api(path, { method: 'POST', body: payload });
    setToken(token);
    setUser(account);
    return account;
  };

  const value = {
    user,
    loading,
    setUser,
    login: (payload) => enter('/auth/login', payload),
    register: (payload) => enter('/auth/register', payload),
    logout: () => {
      clearToken();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
