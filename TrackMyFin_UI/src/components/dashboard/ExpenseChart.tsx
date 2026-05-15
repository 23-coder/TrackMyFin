import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '../ui/Card';
import { Select } from '../ui/FormElements';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface ExpenseData {
  month: string;
  amount: number;
  budget?: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
  [key: string]: any; // Add index signature for recharts compatibility
}

interface ExpenseChartProps {
  monthlyData: ExpenseData[];
  categoryData: CategoryExpense[];
  loading?: boolean;
}

const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

const ExpenseChart: React.FC<ExpenseChartProps> = ({ 
  monthlyData, 
  categoryData, 
  loading = false 
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'ytd'>('6m');

  if (loading) {
    return (
      <Card title="Monthly Expenses" subtitle="Track your spending patterns">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  const totalExpenses = monthlyData.reduce((sum, data) => sum + data.amount, 0);
  const avgMonthlyExpense = totalExpenses / Math.max(monthlyData.length, 1);
  const lastMonthExpense = monthlyData[monthlyData.length - 1]?.amount || 0;
  const previousMonthExpense = monthlyData[monthlyData.length - 2]?.amount || 0;
  const monthlyChange = previousMonthExpense ? 
    ((lastMonthExpense - previousMonthExpense) / previousMonthExpense) * 100 : 0;

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
  ];

  const timeRangeOptions = [
    { value: '6m', label: 'Last 6 Months' },
    { value: '12m', label: 'Last 12 Months' },
    { value: 'ytd', label: 'Year to Date' },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `₹${value.toLocaleString('en-IN')}`,
                  'Expenses'
                ]}
              />
              <Bar dataKey="amount" fill="#EF4444" />
              {monthlyData.some(d => d.budget) && (
                <Bar dataKey="budget" fill="#94A3B8" opacity={0.6} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `₹${value.toLocaleString('en-IN')}`,
                  'Expenses'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
              />
              {monthlyData.some(d => d.budget) && (
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#94A3B8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#94A3B8', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }: any) => 
                    `${category} ${((percent as number) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString('en-IN')}`,
                    'Amount'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Expense Breakdown
              </h4>
              {categoryData.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ 
                        backgroundColor: category.color || COLORS[index % COLORS.length] 
                      }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {category.category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{category.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card 
      title="Monthly Expenses" 
      subtitle={`Average: ₹${avgMonthlyExpense.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`}
      action={
        <div className="flex items-center space-x-2">
          {monthlyChange !== 0 && (
            <div className={`flex items-center text-sm ${
              monthlyChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {monthlyChange > 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(monthlyChange).toFixed(1)}%
            </div>
          )}
          <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Select
          options={chartTypeOptions}
          value={chartType}
          onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie')}
          className="w-full sm:w-auto"
        />
        <Select
          options={timeRangeOptions}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '6m' | '12m' | 'ytd')}
          className="w-full sm:w-auto"
        />
      </div>
      
      {monthlyData.length === 0 && categoryData.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start adding transactions to see your spending patterns
          </p>
        </div>
      ) : (
        renderChart()
      )}
    </Card>
  );
};

export { ExpenseChart };
export type { ExpenseData, CategoryExpense };