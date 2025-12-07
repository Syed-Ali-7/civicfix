import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from '../utils/api';

const TOKEN_KEY = '@civicfix/token';
const USER_KEY = '@civicfix/user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Failed to load auth state', error);
      } finally {
        setInitializing(false);
      }
    };

    bootstrapAsync();
  }, []);

  const persistSession = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);

    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, nextToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
    ]);
  };

  const clearSession = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    await persistSession(data.token, data.user);
    return data.user;
  };

  const register = async ({ name, email, password }) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    await persistSession(data.token, data.user);
    return data.user;
  };

  const logout = async () => {
    await clearSession();
  };

  const value = useMemo(
    () => ({ user, token, initializing, login, register, logout }),
    [user, token, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

