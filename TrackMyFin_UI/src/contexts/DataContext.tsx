import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Data states
  dashboardStats: DashboardStats | null;
  transactions: Transaction[] | null;
  categories: Category[] | null;
  salaries: Salary[] | null;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Connection state
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // Methods
  refreshData: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshSalaries: () => Promise<void>;
  
  // Auto-refresh controls
  enableAutoRefresh: () => void;
  disableAutoRefresh: () => void;
  isAutoRefreshEnabled: boolean;
}

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName?: string;
  date: string;
}

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
}

interface Salary {
  id: string;
  amount: number;
  description: string;
  date: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [salaries, setSalaries] = useState<Salary[] | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Auto-refresh state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Health check function
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const connected = response.ok;
      setIsConnected(connected);
      return connected;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  }, []);

  // Individual data refresh functions
  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const stats = await apiService.getDashboardStats();
      setDashboardStats(stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh dashboard stats:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const refreshTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const transactionData = await apiService.getTransactions();
      setTransactions(transactionData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const refreshCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const categoryData = await apiService.getCategories();
      setCategories(categoryData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh categories:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const refreshSalaries = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const salaryData = await apiService.getSalaries();
      setSalaries(salaryData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh salaries:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated || authLoading) return;
    
    setIsRefreshing(true);
    
    try {
      // Check connection first
      const connected = await checkConnection();
      if (!connected) {
        setIsConnected(false);
        return;
      }

      // Refresh all data in parallel
      await Promise.allSettled([
        refreshDashboard(),
        refreshTransactions(),
        refreshCategories(),
        refreshSalaries()
      ]);
      
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setIsConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, authLoading, checkConnection, refreshDashboard, refreshTransactions, refreshCategories, refreshSalaries]);

  // Auto-refresh controls
  const enableAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(true);
  }, []);

  const disableAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(false);
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [refreshInterval]);

  // Initial data load
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setIsLoading(true);
      refreshData().finally(() => setIsLoading(false));
    }
  }, [isAuthenticated, authLoading, refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (isAutoRefreshEnabled && isAuthenticated && !authLoading) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
      
      setRefreshInterval(interval);
      
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    }
  }, [isAutoRefreshEnabled, isAuthenticated, authLoading, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const value: DataContextType = {
    // Data states
    dashboardStats,
    transactions,
    categories,
    salaries,
    
    // Loading states
    isLoading,
    isRefreshing,
    
    // Connection state
    isConnected,
    lastUpdate,
    
    // Methods
    refreshData,
    refreshDashboard,
    refreshTransactions,
    refreshCategories,
    refreshSalaries,
    
    // Auto-refresh controls
    enableAutoRefresh,
    disableAutoRefresh,
    isAutoRefreshEnabled,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};