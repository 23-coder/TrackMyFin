import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  BarChart3,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1'
];

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
}

interface Salary {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface ExpenseByCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface AnalyticsStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyAvgIncome: number;
  monthlyAvgExpenses: number;
  expenseCategories: number;
}

const Analytics: React.FC = () => {
  useDocumentTitle('Analytics');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    transactions: dataTransactions, 
    categories: dataCategories, 
    salaries: dataSalaries 
  } = useData();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseByCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    monthlyAvgIncome: 0,
    monthlyAvgExpenses: 0,
    expenseCategories: 0
  });
  
  const { error } = useToast();

  const processExpenseByCategory = useCallback((transactions: Transaction[], categories: Category[]) => {
    // Handle both uppercase and lowercase transaction types
    const expenseTransactions = transactions.filter(t => t.type.toUpperCase() === 'EXPENSE');
    const categoryTotals = new Map<string, number>();
    
    expenseTransactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      const categoryName = category?.name || transaction.categoryName || 'Unknown';
      
      categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + transaction.amount);
    });

    const totalExpenses = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);
    
    const expenseData: ExpenseByCategory[] = Array.from(categoryTotals.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    setExpenseByCategory(expenseData);
  }, []);

  const processMonthlyData = useCallback((transactions: Transaction[], salaries: Salary[]) => {
    const monthlyTotals = new Map<string, { income: number; expenses: number }>();
    
    // Process transactions
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const monthData = monthlyTotals.get(monthKey)!;
      const amount = Number(transaction.amount) || 0; // Ensure it's a number
      
      // Handle both uppercase and lowercase transaction types
      const transactionType = transaction.type.toUpperCase();
      
      if (transactionType === 'INCOME') {
        monthData.income += amount;
      } else if (transactionType === 'EXPENSE') {
        monthData.expenses += amount;
      }
    });

    // Process salaries (add to income)
    salaries.forEach(salary => {
      const date = new Date(salary.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const monthData = monthlyTotals.get(monthKey)!;
      const amount = Number(salary.amount) || 0; // Ensure it's a number
      monthData.income += amount; // Add salary to income
    });

    const monthlyDataArray: MonthlyData[] = Array.from(monthlyTotals.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        return {
          month: monthName,
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses
        };
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months

    setMonthlyData(monthlyDataArray);
  }, []);

  const calculateStats = useCallback((transactions: Transaction[], salaries: Salary[]) => {
    // Handle both uppercase and lowercase transaction types
    const transactionIncome = transactions.filter(t => t.type.toUpperCase() === 'INCOME').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const salaryIncome = salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalIncome = transactionIncome + salaryIncome;
    
    const expenses = transactions.filter(t => t.type.toUpperCase() === 'EXPENSE').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expenseCategories = new Set(transactions.filter(t => t.type.toUpperCase() === 'EXPENSE').map(t => t.categoryId)).size;
    const months = monthlyData.length || 1;
    
    setStats({
      totalIncome: totalIncome,
      totalExpenses: expenses,
      netBalance: totalIncome - expenses,
      monthlyAvgIncome: totalIncome / months,
      monthlyAvgExpenses: expenses / months,
      expenseCategories
    });
  }, [monthlyData.length]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData, salariesData] = await Promise.all([
        apiService.getTransactions(),
        apiService.getCategories(),
        apiService.getSalaries()
      ]);
      
      // Process data for charts
      processExpenseByCategory(transactionsData, categoriesData);
      processMonthlyData(transactionsData, salariesData || []);
      calculateStats(transactionsData, salariesData || []);
      
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      error('Failed to load analytics data', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [error, processExpenseByCategory, processMonthlyData, calculateStats]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadAnalyticsData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, loadAnalyticsData]);

  // Update local state when DataContext data changes
  useEffect(() => {
    if (dataTransactions && dataCategories) {
      // Reprocess data when transactions or salaries change
      processExpenseByCategory(dataTransactions, dataCategories);
      processMonthlyData(dataTransactions, dataSalaries || []);
      calculateStats(dataTransactions, dataSalaries || []);
    }
  }, [dataTransactions, dataCategories, dataSalaries, processExpenseByCategory, processMonthlyData, calculateStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            {`Amount: ${formatCurrency(data.value)}`}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {`${data.percentage.toFixed(1)}% of total expenses`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Checking authentication status
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please login to access analytics.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive analysis of your financial data
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className={`h-8 w-8 ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
                  <p className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netBalance)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PieChartIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense Categories</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.expenseCategories}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Expense Breakdown Pie Chart */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <PieChartIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Expense Breakdown by Category
                </h2>
              </div>
              
              {expenseByCategory.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByCategory as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => `${name} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No expense data available
                </div>
              )}
            </div>
          </Card>

          {/* Monthly Trends Line Chart */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Monthly Income vs Expenses
                </h2>
              </div>
              
              {monthlyData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData as any}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={isDark ? '#374151' : '#E5E7EB'} 
                      />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDark ? '#9CA3AF' : '#6B7280'}
                      />
                      <YAxis 
                        stroke={isDark ? '#9CA3AF' : '#6B7280'}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No monthly data available
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Monthly Bar Chart */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Monthly Financial Overview
              </h2>
            </div>
            
            {monthlyData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData as any}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={isDark ? '#374151' : '#E5E7EB'} 
                    />
                    <XAxis 
                      dataKey="month" 
                      stroke={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                    <YAxis 
                      stroke={isDark ? '#9CA3AF' : '#6B7280'}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                    <Bar dataKey="net" fill="#3B82F6" name="Net Balance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available for chart
              </div>
            )}
          </div>
        </Card>

        {/* Category Breakdown Table */}
        {expenseByCategory.length > 0 && (
          <Card className="mt-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Category Breakdown Details
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenseByCategory.map((category, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded mr-3"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrencyDetailed(category.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {category.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;