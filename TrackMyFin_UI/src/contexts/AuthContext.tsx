import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService, tokenService, AuthResponse, ApiError, LoginRequest, RegisterRequest } from '../services/apiService';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currency: string;
  setCurrency: (currency: string) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<string>(() => {
    // Initialize from localStorage
    return localStorage.getItem('userCurrency') || 'USD';
  });

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = () => {
      const token = tokenService.getToken();
      
      if (token && tokenService.isTokenValid()) {
        // If we have a valid token, we can extract user info from it
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userCurrency = localStorage.getItem('userCurrency') || payload.currency || 'USD';
          setUser({
            email: payload.email || payload.sub,
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            currency: userCurrency,
          });
          setCurrencyState(userCurrency);
          setIsAuthenticated(true);
        } catch {
          // If token is invalid, remove it
          tokenService.removeToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = (response: AuthResponse) => {
    // Store the JWT token
    tokenService.setToken(response.token);
    
    // Set user data
    const userCurrency = response.currency || 'USD';
    localStorage.setItem('userCurrency', userCurrency);
    
    const userData: User = {
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      currency: userCurrency,
    };
    setUser(userData);
    setCurrencyState(userCurrency);
    setIsAuthenticated(true);
    setError(null);
  };

  const handleAuthError = (error: ApiError) => {
    let errorMessage = error.message;
    
    // Handle validation errors
    if (error.errors) {
      const validationErrors = Object.values(error.errors).flat();
      errorMessage = validationErrors.join(', ');
    }
    
    setError(errorMessage);
    setIsAuthenticated(false);
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(credentials);
      handleAuthSuccess(response);
    } catch (error) {
      handleAuthError(error as ApiError);
      throw error; // Re-throw so components can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.register(userData);
      handleAuthSuccess(response);
    } catch (error) {
      handleAuthError(error as ApiError);
      throw error; // Re-throw so components can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenService.removeToken();
    localStorage.removeItem('userCurrency');
    setUser(null);
    setIsAuthenticated(false);
    setCurrencyState('USD');
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('userCurrency', newCurrency);
    if (user) {
      setUser({ ...user, currency: newCurrency });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    currency,
    setCurrency,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};