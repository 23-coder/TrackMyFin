import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button, Input } from '../components/ui/FormElements';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Folder,
  Tag,
  AlertCircle,
  Save,
  X
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE';
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
}

const Categories: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    type: 'EXPENSE',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      let errorMessage = 'Cannot connect to server';
      let errorDetails = 'Please ensure the backend is running on http://localhost:8080';
      
      if (err.status === 401) {
        errorMessage = 'Authentication required';
        errorDetails = 'Please login to access categories';
      }
      
      error(errorMessage, errorDetails);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    // Only try to load categories if authentication is complete and user is authenticated
    if (!authLoading && isAuthenticated) {
      loadCategories();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false); // Stop loading if user is not authenticated
    }
  }, [isAuthenticated, authLoading, loadCategories]);

  // Form handling functions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'EXPENSE',
    });
    setFormErrors({});
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
    });
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setFormLoading(true);
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
      };
      
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, categoryData);
        success('Category updated', 'Category updated successfully');
      } else {
        await apiService.addCategory(categoryData);
        success('Category created', 'Category created successfully');
      }
      
      await loadCategories();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      error('Failed to save category', err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setDeletingId(id);
      await apiService.deleteCategory(id);
      success('Category deleted', 'Category deleted successfully');
      await loadCategories();
    } catch (err: any) {
      error('Failed to delete category', err.message || 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Please login to access categories.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your expense and income categories
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No categories found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? 'No categories match your search' : 'Create your first category to get started'}
              </p>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.type === 'INCOME' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {category.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(category)}
                            disabled={deletingId === category.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            loading={deletingId === category.id}
                            disabled={deletingId === category.id}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? "Edit Category" : "Add Category"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
                required
                error={formErrors.name}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter category description (optional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'INCOME' | 'EXPENSE'})}
                required
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                type="button"
                disabled={formLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={formLoading}
                disabled={formLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Categories;