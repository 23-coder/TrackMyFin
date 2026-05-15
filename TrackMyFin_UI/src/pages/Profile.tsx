import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button, Input } from '../components/ui/FormElements';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit3, 
  Save, 
  X,
  UserCircle,
  Key
} from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  bio?: string;
}

interface ProfileFormData extends ProfileData {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bio: ''
  });
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load profile data from API
  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading profile data from API...');
      const profileResponse = await apiService.getProfile();
      console.log('📋 Profile API response:', profileResponse);
      
      const loadedData = {
        firstName: profileResponse.firstName || '',
        lastName: profileResponse.lastName || '',
        email: profileResponse.email || '',
        phone: profileResponse.phone || '',
        address: profileResponse.address || '',
        dateOfBirth: profileResponse.dateOfBirth || '',
        bio: profileResponse.bio || ''
      };
      
      console.log('📝 Processed profile data:', loadedData);
      
      setProfileData(loadedData);
      setFormData({ 
        ...loadedData, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
    } catch (error) {
      console.error('❌ Failed to load profile data:', error);
      // Fallback to user context data if API fails
      if (user) {
        console.log('🔄 Using fallback user context data:', user);
        const fallbackData = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: '',
          address: '',
          dateOfBirth: '',
          bio: ''
        };
        console.log('📝 Fallback profile data:', fallbackData);
        setProfileData(fallbackData);
        setFormData({ ...fallbackData, currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize profile data from API or user context
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, loadProfileData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (isChangingPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Prepare profile update data
      const profileUpdateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        bio: formData.bio?.trim() || undefined
      };
      
      // If changing password, include password data
      if (isChangingPassword) {
        await apiService.updateProfile({
          ...profileUpdateData,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      } else {
        await apiService.updateProfile(profileUpdateData);
      }
      
      // Reload profile data from API to get the latest data
      await loadProfileData();
      
      setIsEditing(false);
      setIsChangingPassword(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      success('Profile updated successfully');
      
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      error('Failed to update profile', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ...profileData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
    setIsChangingPassword(false);
    setFormErrors({});
  };

  const handleEdit = () => {
    // Ensure form data is synced with current profile data when starting edit
    console.log('✏️ Starting edit mode');
    console.log('📋 Current profile data:', profileData);
    const editFormData = {
      ...profileData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    console.log('📝 Setting form data to:', editFormData);
    setFormData(editFormData);
    setIsEditing(true);
    setFormErrors({});
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Not Logged In
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to view your profile
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your personal information and account settings
            </p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card title="Profile Picture">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-2xl font-semibold mb-4">
                  {profileData.firstName?.[0]?.toUpperCase()}{profileData.lastName?.[0]?.toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profileData.firstName} {profileData.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
              </div>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    First Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      error={formErrors.firstName}
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.firstName || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="h-4 w-4 inline mr-2" />
                    Last Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      error={formErrors.lastName}
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.lastName || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      error={formErrors.email}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.email || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      error={formErrors.phone}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.phone || 'Not set'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter address"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.address || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {formatDate(profileData.dateOfBirth || '')}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white py-2">
                      {profileData.bio || 'No bio added yet'}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Password Section */}
            {isEditing && (
              <Card title="Security Settings">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Change Password
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update your account password
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Key className="h-4 w-4" />
                      <span>{isChangingPassword ? 'Cancel' : 'Change Password'}</span>
                    </Button>
                  </div>

                  {isChangingPassword && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          value={formData.currentPassword || ''}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          error={formErrors.currentPassword}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={formData.newPassword || ''}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          error={formErrors.newPassword}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <Input
                          type="password"
                          value={formData.confirmPassword || ''}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          error={formErrors.confirmPassword}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;