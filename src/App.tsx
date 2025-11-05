import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthOperations } from './hooks/useAuthSWR';
import { useToast } from './hooks/useToast';
import { SWRProvider } from './components/SWRProvider';
import { ModalProvider } from './providers/ModalProvider';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import SequencesPage from './pages/CampaignsPage';
import ProspectsPage from './pages/ProspectsPage';
import AddProspectPage from './pages/AddProspectPage';
import TemplatesPage from './pages/TemplatesPage';
import TasksPage from './pages/TasksPage';
import SequenceDetailsPage from './pages/CampaignDetailsPage';
import CampaignEmailPersonalizationPage from './pages/CampaignEmailPersonalizationPage';
import ProspectStepsPersonalizationPage from './pages/ProspectStepsPersonalizationPage';
import StepPersonalizationPage from './pages/StepPersonalizationPage';
import StepProspectsPage from './pages/StepProspectsPage';
import ProspectPersonalizer from './components/personalization/ProspectPersonalizer';
import ProspectEditPage from './pages/ProspectEditPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const { isAuthenticated, loading } = useAuthOperations();
  const { toast, hideToast } = useToast();

  if (loading) {
    return (
      <div className="screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4" />
          <p className="text-text-secondary">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <SWRProvider>
      <ModalProvider>
        <Router>
          <ScrollToTop>
            <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } 
          />
          
          {/* Test Routes */}

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="campaigns" element={<SequencesPage />} />
            <Route path="prospects" element={<ProspectsPage />} />
            <Route path="prospects/add" element={<AddProspectPage />} />
            <Route path="prospects/:prospectId/edit" element={<ProspectEditPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="campaigns/:id" element={<SequenceDetailsPage />} />
            <Route path="campaigns/:id/personalize/:stepNumber" element={<CampaignEmailPersonalizationPage />} />
            <Route path="campaigns/:id/personalize/:stepNumber/prospect/:prospectId" element={<ProspectPersonalizer />} />            <Route path="campaigns/:campaignId/prospects/:prospectId/edit" element={<ProspectEditPage />} />
            <Route path="campaigns/:id/prospects/:prospectId/steps" element={<ProspectStepsPersonalizationPage />} />
            <Route path="campaigns/:id/steps/:stepNumber/personalize" element={<StepPersonalizationPage />} />
            <Route path="campaigns/:id/steps/:stepId/prospects" element={<StepProspectsPage />} />            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast */}
            <Toast toast={toast} onClose={hideToast} />
          </div>
        </ScrollToTop>
      </Router>
      </ModalProvider>
    </SWRProvider>
  );
}

export default App;
