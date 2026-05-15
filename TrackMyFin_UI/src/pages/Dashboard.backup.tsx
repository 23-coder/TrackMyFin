import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { StatCard } from '../components/ui/Card';
import { ConnectionStatus } from '../components/ui/ConnectionStatus';
import { AddSalaryForm, SalaryList, Salary } from '../components/dashboard/SalarySection';
import { ExpenseChart, ExpenseData, CategoryExpense } from '../components/dashboard/ExpenseChart';
import { CategoriesList, Category as DashboardCategory, CategoryFormData } from '../components/dashboard/CategoriesSection';
import { apiService } from '../services/apiService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  AlertCircle,
  RefreshCw 
} from 'lucide-react';

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    dashboardStats, 
    categories, 
    salaries, 
    transactions,
    isLoading, 
    isRefreshing,
    refreshDashboard,
    refreshCategories,
    refreshSalaries 
  } = useData();
  
  // Local state for additional dashboard data
  const [localSalaries, setLocalSalaries] = useState<Salary[]>([]);
  const [localCategories, setLocalCategories] = useState<DashboardCategory[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [categoryExpenseData, setCategoryExpenseData] = useState<CategoryExpense[]>([]);
  
  // Loading states for additional data
  const [loading, setLoading] = useState({
    expenses: true,
  });
  
  const [error, setError] = useState<string | null>(null);

  // Sync with global data context
  useEffect(() => {
    if (salaries) {
      setLocalSalaries(salaries);
    }
  }, [salaries]);

  useEffect(() => {
    if (categories) {
      // Transform global categories to local format with color property
      const categoriesWithColor = categories.map(cat => ({
        ...cat,
        color: '#3B82F6', // Default blue color
        icon: '📁' // Default icon
      }));
      setLocalCategories(categoriesWithColor);
    }
  }, [categories]);

  // Process expense data from transactions instead of separate API call
  useEffect(() => {
    if (transactions && categories) {
      processExpenseData(transactions, categories);
    }
  }, [transactions, categories]);

  const processExpenseData = (transactionData: any[], categoryData: any[]) => {
    try {
      setLoading(prev => ({ ...prev, expenses: true }));
      console.log('🔄 Processing expense data from transactions...');
      console.log('📊 Transaction data:', transactionData);
      console.log('🏷️ Category data:', categoryData);
      
      // Filter expense transactions
      const expenseTransactions = transactionData.filter(t => 
        t.type && t.type.toUpperCase() === 'EXPENSE'
      );
      console.log('� Expense transactions:', expenseTransactions);
      
      // Generate monthly data for last 6 months
      const monthlyData = generateMonthlyExpenseData(expenseTransactions);
      console.log('📈 Generated monthly data:', monthlyData);
      
      // Generate category data
      const categoryExpenseData = generateCategoryExpenseData(expenseTransactions, categoryData);
      console.log('🏷️ Generated category data:', categoryExpenseData);
      
      setExpenseData(monthlyData);
      setCategoryExpenseData(categoryExpenseData);
    } catch (error) {
      console.error('❌ Failed to process expense data:', error);
      setError('Failed to process expense data');
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  const generateMonthlyExpenseData = (expenseTransactions: any[]) => {
    const monthlyMap = new Map();
    const now = new Date();
    
    // Initialize last 6 months with zero values
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap.set(monthKey, { month: monthKey, amount: 0 });
    }
    
    console.log('📅 Generated month keys:', Array.from(monthlyMap.keys()));
    
    // Populate with actual expense data
    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      console.log(`💰 Processing transaction: ${transaction.description}, Date: ${transaction.date}, Month: ${monthKey}, Amount: ${transaction.amount}`);
      
      if (monthlyMap.has(monthKey)) {
        const existing = monthlyMap.get(monthKey);
        existing.amount += Number(transaction.amount) || 0;
        console.log(`✅ Added ₹${transaction.amount} to ${monthKey}, new total: ₹${existing.amount}`);
      } else {
        console.log(`⚠️ Month ${monthKey} not in range, skipping`);
      }
    });
    
    const result = Array.from(monthlyMap.values());
    console.log('📊 Final monthly expense data:', result);
    return result;
  };

  const generateCategoryExpenseData = (expenseTransactions: any[], categoryData: any[]) => {
    const categoryMap = new Map();
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    
    expenseTransactions.forEach(transaction => {
      const category = categoryData.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || transaction.categoryName || 'Uncategorized';
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, 0);
      }
      categoryMap.set(categoryName, categoryMap.get(categoryName) + (Number(transaction.amount) || 0));
    });
    
    let colorIndex = 0;
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      color: colors[colorIndex++ % colors.length]
    }));
  };

  // Optimistic update handlers
  const handleAddSalary = async (salaryData: Omit<Salary, 'id'>) => {
    try {
      const newSalary = await apiService.addSalary(salaryData);
      setLocalSalaries(prev => [newSalary, ...prev]);
      await refreshDashboard(); // Refresh stats
      await refreshSalaries(); // Refresh global salaries
    } catch (error) {
      console.error('Failed to add salary:', error);
    }
  };

  const handleDeleteSalary = async (id: string) => {
    try {
      // Optimistic update
      setLocalSalaries(prev => prev.filter(s => s.id !== id));
      
      await apiService.deleteSalary(id);
      await refreshDashboard(); // Refresh stats
      await refreshSalaries(); // Refresh global salaries
    } catch (error) {
      console.error('Failed to delete salary:', error);
      // Revert optimistic update by refreshing
      await refreshSalaries();
    }
  };

  // Category handlers
  const handleAddCategory = async (categoryData: CategoryFormData) => {
    try {
      // Extract only the data needed for the API
      const apiData = {
        name: categoryData.name,
        description: categoryData.description,
        type: categoryData.type
      };
      
      const newCategory = await apiService.addCategory(apiData);
      // Add UI properties for local display
      const categoryWithUIProps = { 
        ...newCategory, 
        color: categoryData.color || '#3B82F6',
        icon: categoryData.icon || '📁'
      };
      setLocalCategories(prev => [categoryWithUIProps, ...prev]);
      await refreshCategories(); // Refresh global categories
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleEditCategory = async (id: number, categoryData: CategoryFormData) => {
    try {
      // Extract only the data needed for the API
      const apiData = {
        name: categoryData.name,
        description: categoryData.description,
        type: categoryData.type
      };
      
      const updatedCategory = await apiService.updateCategory(id, apiData);
      const categoryWithUIProps = { 
        ...updatedCategory, 
        color: categoryData.color || '#3B82F6',
        icon: categoryData.icon || '📁'
      };
      setLocalCategories(prev => prev.map(c => c.id === id ? categoryWithUIProps : c));
      await refreshCategories(); // Refresh global categories
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      // Optimistic update
      setLocalCategories(prev => prev.filter(c => c.id !== id));
      
      await apiService.deleteCategory(id);
      await refreshCategories(); // Refresh global categories
    } catch (error) {
      console.error('Failed to delete category:', error);
      // Revert optimistic update by refreshing
      await refreshCategories();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Dashboard
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Here's your financial overview  
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            value={`₹${dashboardStats?.totalBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
            icon={<DollarSign className="h-6 w-6" />}
            iconColor="green"
          />
          
          <StatCard
            title="Monthly Income"
            value={`₹${dashboardStats?.monthlyIncome?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
            icon={<TrendingUp className="h-6 w-6" />}
            iconColor="blue"
          />
          
          <StatCard
            title="Monthly Expenses"
            value={`₹${dashboardStats?.monthlyExpenses?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
            icon={<TrendingDown className="h-6 w-6" />}
            iconColor="red"
          />
          
          <StatCard
            title="Savings Rate"
            value={`${dashboardStats?.savingsRate?.toFixed(1) || '0.0'}%`}
            icon={<BarChart3 className="h-6 w-6" />}
            iconColor="purple"
          />
        </div>

        {/* Main Dashboard Sections */}
        <div className="space-y-8">
          {/* Salary and Expense Chart Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
              <AddSalaryForm 
                onSubmit={handleAddSalary}
                loading={isLoading}
              />
              <SalaryList 
                salaries={localSalaries}
                loading={isLoading}
                onDelete={handleDeleteSalary}
              />
            </div>
            
            <ExpenseChart
              monthlyData={expenseData}
              categoryData={categoryExpenseData}
              loading={loading.expenses}
            />
          </div>

          {/* Categories Section */}
          <div className="grid grid-cols-1 gap-8">
            <CategoriesList
              categories={localCategories}
              loading={isLoading}
              onAdd={handleAddCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;