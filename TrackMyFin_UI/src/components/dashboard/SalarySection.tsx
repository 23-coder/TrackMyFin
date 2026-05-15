import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button, Input } from '../ui/FormElements';
import { DollarSign, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Salary {
  id: string;
  amount: number;
  date: string;
  description: string; // Required by backend
}

interface AddSalaryFormProps {
  onSubmit: (salary: Omit<Salary, 'id'>) => Promise<void>;
  loading?: boolean;
}

const AddSalaryForm: React.FC<AddSalaryFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Please enter a description';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim(), // Always send description as required string
      });
      
      // Reset form on success
      setFormData({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to add salary:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card 
      title="Add Salary" 
      subtitle="Record your salary or income"
      action={
        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount in rupees"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
          />
          
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
          />
        </div>
        
        <Input
          label="Description"
          placeholder="e.g., Monthly salary, Bonus, Freelance project"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          required
        />
        
        <Button 
          type="submit" 
          variant="success" 
          loading={loading}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Salary
        </Button>
      </form>
    </Card>
  );
};

interface SalaryListProps {
  salaries: Salary[];
  loading?: boolean;
  onDelete?: (id: string) => Promise<void>;
}

const SalaryList: React.FC<SalaryListProps> = ({ salaries, loading = false, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete salary:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const totalSalary = salaries.reduce((sum, salary) => sum + salary.amount, 0);

  return (
    <Card 
      title="Recent Salaries" 
      subtitle={`Total: ₹${totalSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
    >
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {!loading && salaries.length === 0 && (
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No salary records found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Add your first salary entry above
          </p>
        </div>
      )}
      
      {!loading && salaries.length > 0 && (
        <div className="space-y-3">
          {salaries.map((salary) => (
            <div
              key={salary.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{salary.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(salary.date), 'MMM dd, yyyy')}
                    {salary.description && (
                      <>
                        <span className="mx-1">•</span>
                        {salary.description}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(salary.id)}
                  loading={deletingId === salary.id}
                >
                  Delete
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export { AddSalaryForm, SalaryList };
export type { Salary };