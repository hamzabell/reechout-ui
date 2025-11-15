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
  FiMail,
} from 'react-icons/fi';

import StepEditor from '../components/campaigns/StepEditor';
import StepCard from '../components/campaigns/StepCard';
import CampaignControl from '../components/campaigns/CampaignControl';
import CampaignScheduler from '../components/campaigns/CampaignScheduler';
import ModalWrapper from '../components/ModalWrapper';
import AddProspectsToCampaignModal from '../components/AddProspectsToCampaignModal';
import ProspectDetailsModal from '../components/ProspectDetailsModal';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { useSequenceDetails, useUpdateCampaign, useCreateSequence, useAddProspectsToCampaign, useRemoveProspectFromCampaign, usePauseProspect, useResumeProspect, useCreateSequenceStep, useUpdateSequenceStep, useDeleteSequenceStep } from '../hooks/useCampaigns';
import { useAuth } from '../hooks/useAuth';
import { useTemplates } from '../hooks/useTemplates';

type ViewMode = 'overview' | 'steps' | 'prospects' | 'settings';

interface CampaignStep {
  id: string;
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
    taskType: 'linkedin' | 'whatsapp' | 'call' | 'custom';
    customTitle?: string;
    linkedinDescription?: string;
    whatsappDescription?: string;
    callDescription?: string;
    customDescription?: string;
    enableEmailNotification: boolean;
  };
}

interface CampaignProspect {
  id: string;
  status: string;
  pausedAt?: string;
  prospect: {
    id: string;
    name: string;
    email: string;
    company?: string;
    title?: string;
    location?: string;
    industry?: string;
    notes?: string;
    researchData?: any;
  };
  personalizedEmails: Array<{
    id: string;
    subject: string;
    body: string;
    status: string;
    stepEmailAction: {
      step: {
        step: {
          day: number;
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

  // Fetch email templates
  const { templates, isLoading: templatesLoading, error: templatesError } = useTemplates();

  // View modes
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null); // Force recompile
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showAddProspectsModal, setShowAddProspectsModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<CampaignProspect | null>(null);
  const [showProspectDetailsModal, setShowProspectDetailsModal] = useState(false);
  const [removingProspectIds, setRemovingProspectIds] = useState<Set<string>>(new Set());

  // Hooks for modals and notifications
  const { confirmDanger } = useConfirm();
  const { showToast } = useToast();

  // Mutation hooks
  const updateCampaign = useUpdateCampaign(id || '');
  const createSequence = useCreateSequence();
  const addProspectsToCampaign = useAddProspectsToCampaign(id || '');
  const removeProspectFromCampaign = useRemoveProspectFromCampaign(id || '');
  const pauseProspect = usePauseProspect(id || '');
  const resumeProspect = useResumeProspect(id || '');

  // Step management hooks
  const createSequenceStep = useCreateSequenceStep();
  const updateSequenceStep = useUpdateSequenceStep();
  const deleteSequenceStep = useDeleteSequenceStep();

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

  // Handle adding prospects to campaign
  const handleAddProspects = async (prospectIds: string[]) => {
    if (!id || !user?.id) return;

    try {
      await addProspectsToCampaign.trigger({
        campaignId: id,
        prospectIds,
        userId: user.id || user.neonUserId
      });
      showToast('Prospects added successfully', 'success');
    } catch (error) {
      console.error('Error adding prospects:', error);
      showToast('Failed to add prospects', 'error');
    }
  };

  // Handle removing prospect from campaign
  const handleRemoveProspect = async (prospectId: string, prospectName: string) => {
    if (!id || !user?.id) return;

    const confirmed = await confirmDanger({
      message: `Are you sure you want to remove ${prospectName} from this campaign?`,
      onConfirm: async () => {
        // Add to removing set to show loading state for this specific prospect
        setRemovingProspectIds(prev => new Set(prev).add(prospectId));

        try {
          await removeProspectFromCampaign.trigger({
            campaignId: id,
            prospectId,
            userId: user.id || user.neonUserId
          });
          showToast('Prospect removed successfully', 'success');
        } catch (error) {
          console.error('Error removing prospect:', error);
          showToast('Failed to remove prospect', 'error');
          // Error will be automatically rolled back by the optimistic mutation
        } finally {
          // Remove from removing set after operation completes
          setRemovingProspectIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(prospectId);
            return newSet;
          });
        }
      }
    });
  };

  // Handle viewing prospect details
  const handleViewProspect = (prospect: CampaignProspect) => {
    setSelectedProspect(prospect);
    setShowProspectDetailsModal(true);
  };

  
  // Handle pausing prospect
  const handlePauseProspect = async (prospectId: string) => {
    if (!id || !user?.id) return;

    try {
      await pauseProspect.trigger({
        campaignId: id,
        prospectId,
        userId: user.id || user.neonUserId,
        action: 'pause'
      });
      showToast('Prospect paused successfully', 'success');
      setShowProspectDetailsModal(false);
    } catch (error) {
      console.error('Error pausing prospect:', error);
      showToast('Failed to pause prospect', 'error');
    }
  };

  // Handle resuming prospect
  const handleResumeProspect = async (prospectId: string) => {
    if (!id || !user?.id) return;

    try {
      await resumeProspect.trigger({
        campaignId: id,
        prospectId,
        userId: user.id || user.neonUserId,
        action: 'resume'
      });
      showToast('Prospect resumed successfully', 'success');
      setShowProspectDetailsModal(false);
    } catch (error) {
      console.error('Error resuming prospect:', error);
      showToast('Failed to resume prospect', 'error');
    }
  };

  // Get existing prospect IDs for the modal
  const existingProspectIds = campaign?.prospects
    .filter((p: CampaignProspect) => p?.prospect?.id)
    .map((p: CampaignProspect) => p.prospect.id) || [];

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
      } else if (localCampaign && hasChanges) {
        // For existing campaigns, use optimistic updates
        const updateData: any = {
          userId: user?.id || user?.neonUserId,
          sequenceId: campaign.id
        };

        // Prepare the optimistic update data (only campaign fields)
        const optimisticUpdateData: Partial<Campaign> = {};

        // Only include fields that actually changed
        if (localCampaign.name !== apiCampaign?.name) {
          updateData.name = localCampaign.name;
          optimisticUpdateData.name = localCampaign.name;
        }
        if (localCampaign.description !== apiCampaign?.description) {
          updateData.description = localCampaign.description;
          optimisticUpdateData.description = localCampaign.description;
        }

        // Use the optimistic mutation hook for instant updates
        await updateCampaign.trigger(updateData);
        showToast('Campaign updated successfully', 'success');

        // Clear local state immediately after successful trigger
        // The optimistic update will handle the UI update
        setLocalCampaign(null);
        setHasChanges(false);
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

  // Prevent modal from reopening while saving step
  useEffect(() => {
    if (isSavingStep && showStepModal) {
      setShowStepModal(false);
    }
  }, [isSavingStep, showStepModal]);

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
                <h3 className="text-lg font-medium text-gray-900">Days</h3>
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
                {campaign.steps
                  .slice()
                  .sort((a: CampaignStep, b: CampaignStep) => a.day - b.day)
                  .map((step: CampaignStep, index: number) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={index}
                    onEdit={() => {
                      setEditingStep(step);
                      setShowStepModal(true);
                    }}
                    onDelete={async () => {
                      const confirmed = await confirmDanger({
                        message: 'Are you sure you want to delete this step?',
                        onConfirm: async () => {
                          try {
                            await deleteSequenceStep.trigger({
                              sequenceId: id,
                              stepId: step.id,
                              userId: user?.id || user?.neonUserId || ''
                            });
                            showToast('Step deleted successfully', 'success');
                          } catch (error) {
                            console.error('Error deleting step:', error);
                            // Display more specific error message if available
                            const errorMessage = (error as any)?.message || (error as any)?.error || 'Failed to delete step';
                            showToast(errorMessage, 'error');
                          }
                        }
                      });
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
              <h2 className="text-xl font-semibold text-gray-900">
                Campaign Prospects ({campaign.prospects?.length || 0})
              </h2>
              <button
                onClick={() => setShowAddProspectsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="w-4 h-4" />
                Add Prospects
              </button>
            </div>

            {!campaign.prospects || campaign.prospects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects yet</h3>
                <p className="text-gray-500 mb-4">Add prospects to your campaign to start outreach</p>
                <button
                  onClick={() => setShowAddProspectsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
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
                          Campaign Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emails
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaign.prospects && campaign.prospects.length > 0 && campaign.prospects
                        .filter((cp: CampaignProspect) => cp?.prospect?.id)
                        .map((campaignProspect: CampaignProspect) => (
                        <tr key={campaignProspect.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {campaignProspect.prospect?.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {campaignProspect.prospect?.email || 'No email'}
                              </div>
                              {campaignProspect.prospect?.title && (
                                <div className="text-xs text-gray-400">
                                  {campaignProspect.prospect.title}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaignProspect.prospect?.company || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaignProspect.pausedAt ? 'bg-orange-100 text-orange-800' :
                              campaignProspect.status === 'ENDED' ? 'bg-gray-100 text-gray-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {campaignProspect.pausedAt ? 'Paused' :
                               campaignProspect.status === 'ENDED' ? 'Ended' :
                               'Running'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {campaignProspect.personalizedEmails?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewProspect(campaignProspect)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleRemoveProspect(
                                campaignProspect.prospect?.id || '',
                                campaignProspect.prospect?.name || 'Unknown'
                              )}
                              className="text-red-600 hover:text-red-900"
                              disabled={removingProspectIds.has(campaignProspect.prospect?.id || '')}
                            >
                              {removingProspectIds.has(campaignProspect.prospect?.id || '') ? 'Removing...' : 'Remove'}
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
                      const value = e.target.value;
                      // Always update local state for smooth typing
                      setLocalCampaign(prev => prev ? { ...prev, name: value } : { ...campaign, name: value });
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
                    onChange={(e) => {
                      const value = e.target.value;
                      // Always update local state for smooth typing
                      setLocalCampaign(prev => prev ? { ...prev, description: value } : { ...campaign, description: value });
                    }}
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
        {templatesLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email templates...</p>
          </div>
        ) : templatesError ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load email templates</p>
            <p className="text-gray-500 text-sm mb-4">Please try refreshing the page</p>
            <button
              onClick={() => setShowStepModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <FiMail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No email templates found</p>
            <p className="text-gray-500 text-sm mb-6">Create email templates first to use them in your campaign steps</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/templates')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Templates
              </button>
              <button
                onClick={() => setShowStepModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : editingStep ? (
          <StepEditor
            step={editingStep}
            isOpen={showStepModal}
            onClose={() => setShowStepModal(false)}
            availableTemplates={templates}
            allSteps={campaign.steps}
            onSave={async (stepData) => {
              // Prevent modal from reopening during save operation
              setIsSavingStep(true);
              
              // Close modal immediately for optimistic UI
              setShowStepModal(false);

              try {
                // Update existing step via API with optimistic updates
                await updateSequenceStep.trigger({
                  sequenceId: id,
                  stepId: editingStep.id,
                  userId: user?.id || user?.neonUserId || '',
                  stepData
                });
                showToast('Step updated successfully', 'success');
                setEditingStep(null); // Clear editing step only on success
              } catch (error) {
                console.error('Error updating step:', error);
                // Display specific backend error message if available
                const errorMessage = (error as any)?.message || (error as any)?.error?.message || 'Failed to update step';
                showToast(errorMessage, 'error');
                
                // Keep the editing step data so user can retry if they want, but DO NOT reopen the modal
                // The user can manually click the edit button again to fix the issue
                setEditingStep({ ...editingStep, ...stepData });
              } finally {
                // Reset saving flag after operation completes
                setTimeout(() => setIsSavingStep(false), 100);
              }
            }}
          />
        ) : (
          <StepEditor
            step={{
              id: 'new',
              day: Math.max(...campaign.steps.map((s: CampaignStep) => s.day), 0) + 1,
              name: '',
              description: ''
            }}
            isOpen={showStepModal}
            onClose={() => setShowStepModal(false)}
            availableTemplates={templates}
            allSteps={campaign.steps}
            onSave={async (stepData) => {
              // Close modal immediately for optimistic UI
              setShowStepModal(false);
              setEditingStep(null);

              try {
                // Create new step via API
                await createSequenceStep.trigger({
                  sequenceId: id,
                  userId: user?.id || user?.neonUserId || '',
                  stepData: {
                    ...stepData
                  }
                });
                showToast('Step added successfully', 'success');
              } catch (error) {
                console.error('Error creating step:', error);
                // Handle step creation error
                // Reopen modal if creation fails
                setShowStepModal(true);
                const { id: _id, day: _day, ...cleanStepData } = stepData;
                setEditingStep({
                  ...cleanStepData,
                  id: 'new',
                  day: Math.max(...campaign.steps.map((s: CampaignStep) => s.day), 0) + 1
                });
                // Display specific backend error message if available
                const errorMessage = (error as any)?.message || (error as any)?.error?.message || 'Failed to create step';
                showToast(errorMessage, 'error');
              }
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

      {/* Add Prospects to Campaign Modal */}
      <AddProspectsToCampaignModal
        isOpen={showAddProspectsModal}
        onClose={() => setShowAddProspectsModal(false)}
        onAddProspects={handleAddProspects}
        campaignId={campaign.id}
        existingProspectIds={existingProspectIds}
        loading={addProspectsToCampaign.isMutating}
      />

      {/* Prospect Details Modal */}
      <ProspectDetailsModal
        isOpen={showProspectDetailsModal}
        onClose={() => setShowProspectDetailsModal(false)}
        prospect={selectedProspect}
        onPauseProspect={handlePauseProspect}
        onResumeProspect={handleResumeProspect}
        onDeleteProspect={handleRemoveProspect}
        isUpdating={pauseProspect.isMutating || resumeProspect.isMutating || removingProspectIds.has(selectedProspect?.prospect?.id || '')}
      />

          </div>
  );
};

export default SequenceDetailsPage;
