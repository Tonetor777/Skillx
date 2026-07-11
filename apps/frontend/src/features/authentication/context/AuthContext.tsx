import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../../shared/types';
import { getStoredTokens, setStoredTokens, clearStoredTokens, apiClient } from '../../../shared/api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read tokens on initial load
    const loadUser = async () => {
      try {
        const stored = getStoredTokens();
        if (stored.access && stored.user) {
          const currentUser = await apiClient.get('/accounts/me/');
          setStoredTokens(stored.access, stored.refresh || '', currentUser);
          setUser(currentUser);
        }
      } catch {
        clearStoredTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Setup unauthorized event listener
    const handleUnauthorized = () => {
      setUser(null);
      clearStoredTokens();
    };

    window.addEventListener('skilix-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('skilix-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/token/', { email, password });
      const loggedUser = response.user;
      setStoredTokens(response.access, response.refresh, loggedUser);
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const stored = getStoredTokens();
    try {
      if (stored.refresh) {
        await apiClient.post('/auth/logout/', { refresh: stored.refresh });
      }
    } finally {
      clearStoredTokens();
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    const stored = getStoredTokens();
    if (stored.access && stored.refresh) {
      setStoredTokens(stored.access, stored.refresh, updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
