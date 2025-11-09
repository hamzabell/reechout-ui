import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNeon } from '../providers/NeonProvider';
import { useToast } from '../hooks/useToast';
import Button from '../components/Button';

interface UserSettings {
  name: string;
  email: string;
  company: string;
  title: string;
  emailNotifications: boolean;
  connectedEmail?: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { updateUserProfile } = useNeon();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    title: user?.title || '',
    emailNotifications: true,
  });

  

  const [connectingEmail, setConnectingEmail] = useState(false);

  // Sync settings with current user data (important for optimistic updates)
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        company: user.company || prev.company,
        title: user.title || prev.title,
      }));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      showToast('User not authenticated', 'error');
      return;
    }

    setSaving(true);
    try {
      // Optimistic update: show immediate feedback
      showToast('Updating profile...', 'info');
      
      // Call the API with optimistic updates built into the provider
      await updateUserProfile({
        name: settings.name,
        company: settings.company,
        title: settings.title,
      });
      
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectEmail = async () => {
    setConnectingEmail(true);
    try {
      // Simulate email connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockEmail = `user${Math.floor(Math.random() * 1000)}@gmail.com`;
      setSettings({ ...settings, connectedEmail: mockEmail });
      showToast(`Successfully connected ${mockEmail}!`, 'success');
    } catch (error) {
      showToast('Failed to connect email account', 'error');
    } finally {
      setConnectingEmail(false);
    }
  };

  const handleDisconnectEmail = async () => {
    setSaving(true);
    try {
      // Simulate email disconnection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings({ ...settings, connectedEmail: undefined });
      showToast('Email account disconnected successfully', 'success');
    } catch (error) {
      showToast('Failed to disconnect email account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', label: 'Security', icon: 'fas fa-shield-alt' },
  ];

  return (
    <div className="fade-in">

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-surface rounded-xl border border-border p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 mb-1
                  ${activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }
                `}
              >
                <i className={`${tab.icon} w-5`} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Profile Information</h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      readOnly
                      disabled
                      className="w-full px-4 py-2 bg-bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed opacity-60"
                      title="Email address cannot be changed"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Email address is managed by your authentication provider
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={settings.company}
                      onChange={(e) => setSettings({ ...settings, company: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    loading={saving}
                  >
                    Save Profile
                  </Button>
                </div>
              </div>

              {/* Email Account Connection */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-6">Email Account Connection</h3>
                
                {settings.connectedEmail ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white"></i>
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">Connected Email</div>
                          <div className="text-sm text-text-secondary">{settings.connectedEmail}</div>
                          <div className="text-xs text-success mt-1">Account verified and ready to send emails</div>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleDisconnectEmail}
                        loading={saving}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center">
                          <i className="fas fa-envelope text-white"></i>
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">No Email Connected</div>
                          <div className="text-sm text-text-secondary">Connect your email account to send campaigns</div>
                          <div className="text-xs text-warning mt-1">Required to send email campaigns</div>
                        </div>
                      </div>
                      <Button
                        onClick={handleConnectEmail}
                        loading={connectingEmail}
                      >
                        {connectingEmail ? 'Connecting...' : 'Connect Email'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Notification Settings</h3>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-text-primary">Email Notifications</div>
                      <div className="text-sm text-text-secondary">Receive notifications via email</div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      showToast('Notification settings saved successfully!', 'success');
                    }}
                    loading={saving}
                  >
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Account Actions</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
                    <div>
                      <div className="font-medium text-text-primary">Export Data</div>
                      <div className="text-sm text-text-secondary">Download all your data</div>
                    </div>
                    <Button variant="secondary">
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-error/10 border border-error/20 rounded-lg">
                    <div>
                      <div className="font-medium text-error">Delete Account</div>
                      <div className="text-sm text-text-secondary">Permanently delete your account and data</div>
                    </div>
                    <Button variant="danger">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
