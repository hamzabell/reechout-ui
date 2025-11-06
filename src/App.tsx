import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useNeon } from "./providers/NeonProvider";
import { useToast } from "./hooks/useToast";
import { ToastProvider } from "./hooks/useToast";
import { SWRProvider } from "./components/SWRProvider";
import { ModalProvider } from "./providers/ModalProvider";
import { NeonProvider } from "./providers/NeonProvider";

import StackAuthHandler from "./pages/StackAuthHandler";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import EmailConfirmationPage from "./pages/EmailConfirmationPage";
import SignupConfirmationPage from "./pages/SignupConfirmationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardLayout from "./components/DashboardLayout";
import OverviewPage from "./pages/OverviewPage";
import SequencesPage from "./pages/CampaignsPage";
import ProspectsPage from "./pages/ProspectsPage";
import AddProspectPage from "./pages/AddProspectPage";
import TemplatesPage from "./pages/TemplatesPage";
import TasksPage from "./pages/TasksPage";
import SequenceDetailsPage from "./pages/CampaignDetailsPage";
import CampaignEmailPersonalizationPage from "./pages/CampaignEmailPersonalizationPage";
import ErrorBoundary from "./components/ErrorBoundary";
import ProspectStepsPersonalizationPage from "./pages/ProspectStepsPersonalizationPage";
import StepPersonalizationPage from "./pages/StepPersonalizationPage";
import StepProspectsPage from "./pages/StepProspectsPage";
import ProspectPersonalizer from "./components/personalization/ProspectPersonalizer";
import ProspectEditPage from "./pages/ProspectEditPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import ScrollToTop from "./components/ScrollToTop";

function AppContent() {
  const { authState } = useNeon();
  const { toast, hideToast } = useToast();
  const { isAuthenticated, loading } = authState;

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
    <Router>
      <ScrollToTop>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LandingPage />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route path="/confirm-email" element={<EmailConfirmationPage />} />
            <Route
              path="/signup-confirmation"
              element={<SignupConfirmationPage />}
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Stack Auth Handler Routes */}
            <Route
              path="/handler/email-verification"
              element={<StackAuthHandler />}
            />
            <Route
              path="/handler/password-reset"
              element={<StackAuthHandler />}
            />
            <Route path="/handler/*" element={<StackAuthHandler />} />

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
              <Route
                path="prospects/:prospectId/edit"
                element={<ProspectEditPage />}
              />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="campaigns/:id" element={<SequenceDetailsPage />} />
              <Route
                path="campaigns/:id/personalize/:stepNumber"
                element={<CampaignEmailPersonalizationPage />}
              />
              <Route
                path="campaigns/:id/personalize/:stepNumber/prospect/:prospectId"
                element={<ProspectPersonalizer />}
              />
              <Route
                path="campaigns/:campaignId/prospects/:prospectId/edit"
                element={<ProspectEditPage />}
              />
              <Route
                path="campaigns/:id/prospects/:prospectId/steps"
                element={<ProspectStepsPersonalizationPage />}
              />
              <Route
                path="campaigns/:id/steps/:stepNumber/personalize"
                element={<StepPersonalizationPage />}
              />
              <Route
                path="campaigns/:id/steps/:stepId/prospects"
                element={<StepProspectsPage />}
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Toast */}
          <Toast toast={toast} onClose={hideToast} />
        </div>
      </ScrollToTop>
    </Router>
  );
}

const App: React.FC = () => {
  return (
    <ToastProvider>
      <NeonProvider>
        <SWRProvider>
          <ModalProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </ModalProvider>
        </SWRProvider>
      </NeonProvider>
    </ToastProvider>
  );
};

export default App;
