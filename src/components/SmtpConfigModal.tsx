import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import { useToast } from '../hooks/useToast';
import Button from './Button';
import { api } from '../services/apiService';

interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName?: string;
  isActive: boolean;
}

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SmtpConfig) => Promise<void>;
  existingConfig?: SmtpConfig | null;
}

const SmtpConfigModal: React.FC<SmtpConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingConfig
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    fromEmail: '',
    fromName: '',
    isActive: true
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or existing config changes
  useEffect(() => {
    if (isOpen) {
      if (existingConfig) {
        setFormData({
          host: existingConfig.host,
          port: existingConfig.port,
          secure: existingConfig.secure,
          username: existingConfig.username,
          fromEmail: existingConfig.fromEmail,
          fromName: existingConfig.fromName || '',
          isActive: existingConfig.isActive
        });
      } else {
        // Default values for new config
        setFormData({
          host: '',
          port: 587,
          secure: false,
          username: '',
          fromEmail: '',
          fromName: '',
          isActive: true
        });
      }
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [isOpen, existingConfig]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Host validation
    if (!formData.host.trim()) {
      newErrors.host = 'SMTP host is required';
    }

    // Port validation
    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Password validation (required for new config or when testing)
    if (!existingConfig && !password.trim()) {
      newErrors.password = 'Password is required';
    }

    // From email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.fromEmail.trim()) {
      newErrors.fromEmail = 'From email is required';
    } else if (!emailRegex.test(formData.fromEmail)) {
      newErrors.fromEmail = 'Please enter a valid email address';
    }

    // Password confirmation validation
    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors below', 'error');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        // Only include password if it's provided (for updates it might be empty)
        ...(password && { password })
      });
      showToast('SMTP configuration saved successfully!', 'success');
      onClose();
    } catch (error: any) {
      console.error('Error saving SMTP config:', error);
      showToast(error.message || 'Failed to save SMTP configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.host.trim() || !formData.username.trim() || !password) {
      showToast('Host, username, and password are required to test connection', 'error');
      return;
    }

    setTesting(true);
    try {
      const response = await api.post('/smtp-config/test', {
        host: formData.host,
        port: formData.port,
        secure: formData.secure,
        username: formData.username,
        password: password
      });

      if (response.success) {
        showToast('SMTP connection test successful!', 'success');
      } else {
        showToast(response.message || 'SMTP connection test failed', 'error');
      }
    } catch (error: any) {
      console.error('Error testing SMTP connection:', error);
      showToast(error.message || 'SMTP connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof SmtpConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = field === 'secure' || field === 'isActive'
      ? target.checked
      : field === 'port'
        ? parseInt(e.target.value) || ''
        : e.target.value;

    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-envelope text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {existingConfig ? 'Edit SMTP Configuration' : 'Configure SMTP Settings'}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Set up your SMTP server to send emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="px-8 py-6 max-h-[65vh] overflow-y-auto">
          <div className="space-y-8">
            {/* Server Settings */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-server text-blue-600 text-sm"></i>
                </div>
                <h4 className="text-base font-semibold text-gray-900">Server Settings</h4>
              </div>
              <div className="space-y-4">
                {/* Host */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={handleInputChange('host')}
                    placeholder="smtp.gmail.com"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.host
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  />
                  {errors.host && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                      {errors.host}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={handleInputChange('port')}
                      min="1"
                      max="65535"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.port
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    />
                    {errors.port && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                        {errors.port}
                      </p>
                    )}
                  </div>

                  {/* Common Ports */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Select
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, port: 587, secure: false }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          formData.port === 587 && !formData.secure
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        587 (STARTTLS)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, port: 465, secure: true }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          formData.port === 465 && formData.secure
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        465 (SSL/TLS)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secure */}
                <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <input
                    type="checkbox"
                    id="secure"
                    checked={formData.secure}
                    onChange={handleInputChange('secure')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="secure" className="ml-3 text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Use SSL/TLS</span>
                    <span className="text-gray-500 block">Enable secure connection for email sending</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-key text-purple-600 text-sm"></i>
                </div>
                <h4 className="text-base font-semibold text-gray-900">Authentication</h4>
              </div>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    placeholder="your-email@gmail.com"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                      {existingConfig && (
                        <span className="text-xs text-gray-500 font-normal ml-1">
                          (leave empty to keep current)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Enter password"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    />
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password {password && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Confirm password"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${!password ? 'opacity-50' : ''}`}
                      disabled={!password}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-at text-green-600 text-sm"></i>
                </div>
                <h4 className="text-base font-semibold text-gray-900">Email Settings</h4>
              </div>
              <div className="space-y-4">
                {/* From Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={handleInputChange('fromEmail')}
                    placeholder="sender@yourcompany.com"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.fromEmail
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  />
                  {errors.fromEmail && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <i className="fas fa-exclamation-circle mr-1.5 text-xs"></i>
                      {errors.fromEmail}
                    </p>
                  )}
                </div>

                {/* From Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={handleInputChange('fromName')}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This name will appear in the "From" field of your emails
                  </p>
                </div>

                {/* Active */}
                <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange('isActive')}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="ml-3 text-sm text-gray-700 cursor-pointer">
                    <span className="font-medium">Enable this SMTP configuration</span>
                    <span className="text-gray-500 block">Send emails using this configuration</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Test Connection */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-plug text-blue-600 text-sm"></i>
                    </div>
                    <h5 className="text-base font-semibold text-gray-900">Test Connection</h5>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verify your SMTP settings before saving to ensure everything works correctly
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleTestConnection}
                  loading={testing}
                  disabled={!formData.host || !formData.username || !password}
                  icon={<i className="fas fa-paper-plane"></i>}
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              icon={<i className="fas fa-save"></i>}
            >
              {loading ? 'Saving...' : (existingConfig ? 'Update Configuration' : 'Save Configuration')}
            </Button>
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default SmtpConfigModal;