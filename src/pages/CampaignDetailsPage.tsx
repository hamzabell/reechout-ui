import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlus,
  FiUser,
  FiAlertCircle,
  FiList,
  FiInfo,
  FiSave,
  FiCalendar,
} from 'react-icons/fi';

import StepEditor from '../components/campaigns/StepEditor';
import StepCard from '../components/campaigns/StepCard';
import CampaignControl from '../components/campaigns/CampaignControl';
import CampaignScheduler from '../components/campaigns/CampaignScheduler';
import ModalWrapper from '../components/ModalWrapper';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { useSequenceDetails, useUpdateCampaign, useCreateSequence } from '../hooks/useCampaigns';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'overview' | 'steps' | 'prospects' | 'settings';

interface CampaignStep {
  id: string;
  stepNumber: number;
  day: number;
  name?: string;
  description?: string;
  emailAction?: {
    id: string;
    templateId?: string;
    customSubject?: string;
    customBody?: string;
    enablePersonalization: boolean;
    template?: {
      id: string;
      name: string;
      subject: string;
      body: string;
    };
  };
  taskAction?: {
    id: string;
    taskType: 'linkedin' | 'whatsapp' | 'call' | 'other';
    otherTitle?: string;
    linkedinDescription?: string;
    whatsappDescription?: string;
    callDescription?: string;
    enableEmailNotification: boolean;
  };
}

interface CampaignProspect {
  id: string;
  status: string;
  prospect: {
    id: string;
    name: string;
    email: string;
    company?: string;
    title?: string;
    location?: string;
    industry?: string;
    notes?: string;
  };
  personalizedEmails: Array<{
    id: string;
    subject: string;
    body: string;
    status: string;
    stepEmailAction: {
      step: {
        step: {
          stepNumber: number;
          name?: string;
        };
      };
    };
  }>;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'draft' | 'sending' | 'paused' | 'completed';
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  steps: CampaignStep[];
  prospects: CampaignProspect[];
}

const SequenceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // View modes
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  // Hooks for modals and notifications
  const { confirmDanger } = useConfirm();
  const { showToast } = useToast();

  // Mutation hooks
  const updateCampaign = useUpdateCampaign(id || '');
  const createSequence = useCreateSequence();

  // Fetch sequence details from API
  const { campaign: apiCampaign, isLoading: apiLoading, error: apiError } = useSequenceDetails(id || null);

  // State for saving and local edits
  const [isSaving, setIsSaving] = useState(false);
  const [localCampaign, setLocalCampaign] = useState<Campaign | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<{name?: string}>({});

  // Use API data directly, or local data if we have unsaved changes
  const campaign = localCampaign || apiCampaign;
  const isLoading = apiLoading;
  const error = apiError instanceof Error ? apiError.message : apiError ? String(apiError) : null;
  
  // Check if this is a new campaign (default values)
  const isNewCampaign = apiCampaign?.name === 'New Campaign' && !apiCampaign.description && apiCampaign.steps.length === 0;

  // Validate form
  const validateForm = (): boolean => {
    const errors: {name?: string} = {};
    
    if (!campaign?.name || campaign.name.trim() === '') {
      errors.name = 'Campaign name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save campaign function
  const saveCampaign = async () => {
    if (!campaign) return;
    
    // Validate form before saving
    if (!validateForm()) {
      showToast('Please fix the errors before saving', 'error');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isNewCampaign) {
        // Create new sequence
        await createSequence.trigger({
          name: campaign.name,
          description: campaign.description,
          steps: campaign.steps,
          prospects: campaign.prospects,
        });
        showToast('Campaign created successfully', 'success');
        // Clear local campaign to sync with API data
        setLocalCampaign(null);
        setHasChanges(false);
      } else {
        // Update existing campaign - only send changed fields
        const updateData: any = {
          userId: user?.id || user?.neonId,
          sequenceId: campaign.id
        };
        
        if (localCampaign) {
          if (localCampaign.name !== apiCampaign?.name) {
            updateData.name = localCampaign.name;
          }
          if (localCampaign.description !== apiCampaign?.description) {
            updateData.description = localCampaign.description;
          }
        }
        
        // Only update if there are actual changes to name/description
        if (Object.keys(updateData).length > 2) { // > 2 because userId and sequenceId are always included
          await updateCampaign.trigger(updateData);
          showToast('Campaign updated successfully', 'success');
          setLocalCampaign(null);
          setHasChanges(false);
        }
      }
    } catch (err) {
      showToast('Failed to save campaign', 'error');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Track changes
  useEffect(() => {
    if (localCampaign && apiCampaign) {
      const hasNameChanged = localCampaign.name !== apiCampaign.name;
      const hasDescriptionChanged = localCampaign.description !== apiCampaign.description;
      setHasChanges(hasNameChanged || hasDescriptionChanged);
    } else {
      setHasChanges(false);
    }
  }, [localCampaign, apiCampaign]);

  // Mock email templates for frontend demo
  const mockEmailTemplates = [
    { id: '1', name: 'Initial Outreach', subject: 'Introduction and Value Proposition', body: 'Hi {{name}}, welcome to our platform!' },
    { id: '2', name: 'Follow-up', subject: 'Following up on our conversation', body: 'Hi {{name}}, let me show you some features.' },
    { id: '3', name: 'Final Follow-up', subject: 'Final follow-up', body: 'Hi {{name}}, just checking in one last time.' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Error: {error || 'Unknown error occurred'}</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Campaign not found</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Campaigns
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                {campaign.description && (
                  <p className="text-gray-600 mt-1">{campaign.description}</p>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <CampaignControl 
                campaign={campaign}
                onScheduleClick={() => setShowSchedulerModal(true)}
              />
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['overview', 'steps', 'prospects', 'settings'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    viewMode === mode
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Steps</h3>
                <FiList className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{campaign.steps.length}</p>
              <p className="text-sm text-gray-500">Campaign steps</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Prospects</h3>
                <FiUser className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{campaign.prospects.length}</p>
              <p className="text-sm text-gray-500">Active prospects</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
                <FiAlertCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900">{campaign.status}</p>
              <p className="text-sm text-gray-500">Campaign status</p>
            </div>
          </div>
        )}

        {viewMode === 'steps' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Steps</h2>
              <button
                onClick={() => {
                  setEditingStep(null);
                  setShowStepModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="w-4 h-4" />
                Add Step
              </button>
            </div>
            
            {campaign.steps.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h3>
                <p className="text-gray-500 mb-4">Create your first campaign step to get started</p>
                <button
                  onClick={() => {
                    setEditingStep(null);
                    setShowStepModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  Add First Step
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaign.steps.map((step: CampaignStep, index: number) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    onEdit={() => {
                      setEditingStep(step);
                      setShowStepModal(true);
                    }}
                    onDelete={async () => {
                      const confirmed = await confirmDanger({
                        message: 'Are you sure you want to delete this step?',
                        onConfirm: () => {}
                      });
                      if (confirmed) {
                        setLocalCampaign(prev => prev ? {
                          ...prev,
                          steps: prev.steps.filter(s => s.id !== step.id)
                        } : null);
                        showToast('Step deleted successfully', 'success');
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'prospects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Prospects</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FiPlus className="w-4 h-4" />
                Add Prospects
              </button>
            </div>
            
            {campaign.prospects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects yet</h3>
                <p className="text-gray-500 mb-4">Add prospects to your campaign to start outreach</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto">
                  <FiPlus className="w-4 h-4" />
                  Add First Prospect
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prospect
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaign.prospects.map((prospect: CampaignProspect) => (
                        <tr key={prospect.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{prospect.prospect.name}</div>
                              <div className="text-sm text-gray-500">{prospect.prospect.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prospect.prospect.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              prospect.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              prospect.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {prospect.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>
              <button
                onClick={saveCampaign}
                disabled={isSaving || (!hasChanges && !isNewCampaign)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isSaving || (!hasChanges && !isNewCampaign)
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : hasChanges || isNewCampaign
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    {isNewCampaign ? 'Create Campaign' : hasChanges ? 'Save Changes' : 'No Changes'}
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={localCampaign?.name || campaign.name}
                    onChange={(e) => {
                      setLocalCampaign(prev => prev ? { ...prev, name: e.target.value } : { ...campaign, name: e.target.value });
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter campaign name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={(localCampaign?.description ?? campaign.description) || ''}
                    onChange={(e) => setLocalCampaign(prev => prev ? { ...prev, description: e.target.value } : { ...campaign, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter campaign description (optional)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Optional: Add a description to help you remember the purpose of this campaign.
                  </p>
                </div>
              </div>
            </div>

            {isNewCampaign && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">New Campaign</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This is a new campaign. Fill in the details above and click "Create Campaign" to save it to the system.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isNewCampaign && hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900">Unsaved Changes</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have unsaved changes. Click "Save Changes" to update your campaign.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Editor Modal */}
      <ModalWrapper isOpen={showStepModal} onClose={() => setShowStepModal(false)}>
        {editingStep ? (
          <StepEditor
            step={editingStep}
            isOpen={showStepModal}
            onClose={() => setShowStepModal(false)}
            availableTemplates={mockEmailTemplates}
            onSave={(stepData) => {
              // Update existing step
              setLocalCampaign(prev => prev ? {
                ...prev,
                steps: prev.steps.map(s => s.id === editingStep.id ? { ...s, ...stepData } : s)
              } : null);
              showToast('Step updated successfully', 'success');
              setShowStepModal(false);
              setEditingStep(null);
            }}
          />
        ) : (
          <StepEditor
            step={{
              id: 'new',
              stepNumber: campaign.steps.length + 1,
              day: campaign.steps.length + 1,
              name: '',
              description: ''
            }}
            isOpen={showStepModal}
            onClose={() => setShowStepModal(false)}
            availableTemplates={mockEmailTemplates}
            onSave={(stepData) => {
              // Add new step
              const newStep: CampaignStep = {
                ...stepData,
                id: Date.now().toString(),
                stepNumber: campaign.steps.length + 1,
                day: campaign.steps.length + 1
              };
              setLocalCampaign(prev => prev ? {
                ...prev,
                steps: [...prev.steps, newStep]
              } : null);
              showToast('Step added successfully', 'success');
              setShowStepModal(false);
              setEditingStep(null);
            }}
          />
        )}
      </ModalWrapper>

      {/* Campaign Scheduler Modal */}
      <CampaignScheduler
        isOpen={showSchedulerModal}
        onClose={() => setShowSchedulerModal(false)}
        campaign={{
          id: campaign.id,
          name: campaign.name
        }}
      />
    </div>
  );
};

export default SequenceDetailsPage;
