import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TabType } from '../types';

const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = React.useMemo(() => [
    { id: 'overview' as TabType, label: 'Overview', icon: 'fas fa-dashboard' },
    { id: 'campaigns' as TabType, label: 'Sequences', icon: 'fas fa-bullhorn' },
    { id: 'prospects' as TabType, label: 'Prospects', icon: 'fas fa-users' },
    { id: 'templates' as TabType, label: 'Templates', icon: 'fas fa-file-alt' },
    { id: 'tasks' as TabType, label: 'Tasks', icon: 'fas fa-check-square' },
    { id: 'settings' as TabType, label: 'Settings', icon: 'fas fa-cog' },
  ], []);

  React.useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && tabs.find(tab => tab.id === path)) {
      setActiveTab(path as TabType);
    }
  }, [location.pathname, tabs]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="screen bg-bg-secondary flex">
      {/* Sidebar */}
      <nav className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border/50 transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="ReechOut" className="w-12 h-12 object-contain" />
              <h2 className="text-2xl font-bold text-text-primary">Reechout</h2>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-left transition-all duration-200 group
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:border-border'
                    }
                  `}
                >
                  <i className={`${tab.icon} w-5 text-lg group-hover:scale-110 transition-transform duration-200`} />
                  <span className="font-semibold text-base">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/50 bg-gradient-to-b from-surface to-gray-50/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 px-5 py-4 text-base font-semibold rounded-xl transition-all duration-200 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-sm hover:shadow-md text-gray-700"
            >
              <i className="fas fa-sign-out-alt" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        {/* Top Navigation */}
        <header className="fixed top-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-b border-border/50 px-8 py-5 z-30 shadow-sm lg:left-72">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-3 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <i className="fas fa-bars text-text-primary text-lg" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary capitalize">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  {activeTab === 'overview' && 'Monitor your sequence performance and key metrics'}
                  {activeTab === 'campaigns' && 'Manage and track your email sequences'}
                  {activeTab === 'prospects' && 'View and manage your prospect lists'}
                  {activeTab === 'templates' && 'Create and manage email templates'}
                  {activeTab === 'tasks' && 'Track and complete your sequence tasks'}
                  {activeTab === 'settings' && 'Manage your account and preferences'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {/* User Profile */}
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-semibold shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden md:block">
                  <div className="font-semibold text-text-primary text-base">{user?.name || 'User'}</div>
                  <div className="text-sm text-text-secondary/80">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 pt-32 bg-bg-secondary">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
