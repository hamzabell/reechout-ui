import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiSquare,
  FiEdit,
  FiPlus,
  FiMail,
  FiCheckSquare,
  FiUser,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiTrash2,
  FiList,
    FiTarget,
  FiSettings,
} from 'react-icons/fi';
import StepEditor from '../components/campaigns/StepEditor';
import StepReorder from '../components/campaigns/StepReorder';
import StepCard from '../components/campaigns/StepCard';

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
    otherDescription?: string;
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
        stepNumber: number;
        name?: string;
      };
    };
  }>;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  sendTime?: string;
  timezone?: string;
  dailyLimit?: number;
  steps: CampaignStep[];
  campaignProspects: CampaignProspect[];
  statistics: {
    totalSteps: number;
    emailSteps: number;
    taskSteps: number;
    totalProspects: number;
    activeProspects: number;
    completedProspects: number;
  };
}

const SequenceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'prospects' | 'basic-info' | 'settings'>('overview');
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [isStepEditorOpen, setIsStepEditorOpen] = useState(false);
  const [isStepReorderOpen, setIsStepReorderOpen] = useState(false);
  
  // Check if this is a newly created blank sequence
  const isNewSequence = id?.startsWith('seq_') || false;

  // Mock campaign data for frontend demo
  const [campaign, setCampaign] = useState<Campaign>({
    id: id || '1',
    name: isNewSequence ? 'New Sequence' : 'Welcome Series Sequence',
    description: isNewSequence ? 'Add a description for your sequence' : 'Onboarding sequence for new subscribers with personalized emails and follow-up tasks.',
    status: 'DRAFT',
    createdAt: isNewSequence ? new Date().toISOString() : '2024-01-15T10:00:00Z',
    startedAt: undefined,
    pausedAt: undefined,
    completedAt: undefined,
    steps: isNewSequence ? [] : [
      {
        id: 'step_1',
        stepNumber: 1,
        day: 1,
        name: 'Welcome Email',
        description: 'Send a warm welcome email with basic product information',
        emailAction: {
          id: 'email_1',
          templateId: '1',
          customSubject: undefined,
          customBody: undefined,
          enablePersonalization: true,
          template: {
            id: '1',
            name: 'Initial Outreach',
            subject: 'Welcome to our platform!',
            body: 'Hi {{name}}, welcome to our platform! We\'re excited to have you on board.'
          }
        }
      },
      {
        id: 'step_2',
        stepNumber: 2,
        day: 3,
        name: 'Feature Introduction',
        description: 'Introduce key features and benefits',
        emailAction: {
          id: 'email_2',
          templateId: '2',
          customSubject: undefined,
          customBody: undefined,
          enablePersonalization: true,
          template: {
            id: '2',
            name: 'Follow-up',
            subject: 'Discover our key features',
            body: 'Hi {{name}}, now that you\'re settled in, let us show you some powerful features.'
          }
        }
      },
      {
        id: 'step_3',
        stepNumber: 3,
        day: 5,
        name: 'LinkedIn Follow-up',
        description: 'Create a LinkedIn connection task',
        taskAction: {
          id: 'task_1',
          taskType: 'linkedin',
          linkedinDescription: 'Send a personalized LinkedIn connection request with a follow-up message about their specific pain points',
          enableEmailNotification: true
        }
      }
    ],
    campaignProspects: isNewSequence ? [] : [
      {
        id: 'cp_1',
        status: 'ACTIVE',
        prospect: {
          id: 'prospect_1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          title: 'CEO',
          location: 'San Francisco, CA',
          industry: 'Technology',
          notes: 'Key decision maker, interested in automation solutions'
        },
        personalizedEmails: [
          {
            id: 'pe_1',
            subject: 'Welcome to our platform!',
            body: 'Hi John Doe, welcome to Tech Corp! We\'re excited to have you on board and wanted to personally reach out to help you get started.',
            status: 'SENT',
            stepEmailAction: {
              step: {
                stepNumber: 1,
                name: 'Welcome Email'
              }
            }
          },
          {
            id: 'pe_2',
            subject: 'Discover features tailored for CEOs',
            body: 'Hi John Doe, now that you\'re settled in, let us show you some powerful features that would be perfect for a CEO at Tech Corp.',
            status: 'DRAFT',
            stepEmailAction: {
              step: {
                stepNumber: 2,
                name: 'Feature Introduction'
              }
            }
          }
        ]
      },
      {
        id: 'cp_2',
        status: 'PENDING',
        prospect: {
          id: 'prospect_2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Design Inc',
          title: 'Designer',
          location: 'New York, NY',
          industry: 'Design',
          notes: 'Creative professional, focused on user experience'
        },
        personalizedEmails: [
          {
            id: 'pe_3',
            subject: 'Welcome to our platform!',
            body: 'Hi Jane Smith, welcome to Design Inc! We\'re excited to have you on board and wanted to personally reach out to help you get started.',
            status: 'DRAFT',
            stepEmailAction: {
              step: {
                stepNumber: 1,
                name: 'Welcome Email'
              }
            }
          }
        ]
      }
    ],
    statistics: isNewSequence ? {
      totalSteps: 0,
      emailSteps: 0,
      taskSteps: 0,
      totalProspects: 0,
      activeProspects: 0,
      completedProspects: 0
    } : {
      totalSteps: 3,
      emailSteps: 2,
      taskSteps: 1,
      totalProspects: 2,
      activeProspects: 1,
      completedProspects: 0
    }
  });

  // Mock email templates for frontend demo
  const mockEmailTemplates = [
    { id: '1', name: 'Initial Outreach', subject: 'Introduction and Value Proposition', body: 'Hi {{name}}, welcome to our platform!' },
    { id: '2', name: 'Follow-up', subject: 'Following up on our conversation', body: 'Hi {{name}}, let me show you some features.' },
    { id: '3', name: 'Final Follow-up', subject: 'Final follow-up', body: 'Hi {{name}}, just checking in one last time.' },
  ];

  const [isLoading] = useState(false);
  const [error] = useState(null);

  const handleCampaignAction = (action: 'start' | 'pause' | 'restart' | 'stop') => {
    console.log(`Sequence action: ${action}`, { sequenceId: id });
    // Frontend-only: just log the action
    alert(`Sequence "${campaign.name}" ${action} action triggered (frontend demo)`);
  };

  const handleRemoveProspect = (campaignProspectId: string) => {
    console.log('Removing prospect:', campaignProspectId);
    // Frontend-only: just log the action
    alert('Prospect removed (frontend demo)');
  };

  // Step management functions (frontend-only for now)
  const handleEditStep = (step: CampaignStep) => {
    setEditingStep(step);
    setIsStepEditorOpen(true);
  };

  const handleSaveStep = (updatedStep: CampaignStep) => {
    console.log('Saving step:', updatedStep);
    // Frontend-only: just log the changes
    alert(`Step "${updatedStep.name || updatedStep.stepNumber}" saved (frontend demo)`);
    setEditingStep(null);
    setIsStepEditorOpen(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!campaign) return;

    if (window.confirm('Are you sure you want to delete this step?')) {
      console.log('Deleting step:', stepId);
      // Frontend-only: just log the action
      alert('Step deleted (frontend demo)');
    }
  };

  const handleAddStep = () => {
    if (!campaign) return;

    const newStep: CampaignStep = {
      id: `step_${Date.now()}`,
      stepNumber: campaign.steps.length + 1,
      day: campaign.steps.length + 2, // Default to next available day
      name: `Step ${campaign.steps.length + 1}`,
    };

    setEditingStep(newStep);
    setIsStepEditorOpen(true);
  };

  const handleReorderSteps = () => {
    setIsStepReorderOpen(true);
  };

  const handleSaveReorder = (reorderedSteps: CampaignStep[]) => {
    console.log('Saving reordered steps:', reorderedSteps);
    // Frontend-only: just log the changes
    alert(`Steps reordered (frontend demo)`);
    setIsStepReorderOpen(false);
  };

  
  const handleAddProspects = () => {
    if (!campaign) return;

    // Demo functionality: Add mock prospects to the sequence
    const mockProspectsToAdd = [
      {
        id: `prospect_${Date.now()}_1`,
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Inc.',
        title: 'Engineering Manager',
        status: 'ACTIVE',
      },
      {
        id: `prospect_${Date.now()}_2`,
        name: 'Emily Davis',
        email: 'emily.davis@innovate.co',
        company: 'Innovate & Co',
        title: 'Product Director',
        status: 'PENDING',
      },
      {
        id: `prospect_${Date.now()}_3`,
        name: 'Robert Wilson',
        email: 'robert.wilson@startup.io',
        company: 'Startup.io',
        title: 'CEO',
        status: 'ACTIVE',
      }
    ];

    // Update the campaign with new prospects
    setCampaign(prev => ({
      ...prev,
      campaignProspects: [
        ...(prev.campaignProspects || []),
        ...mockProspectsToAdd.map(prospect => ({
          id: `cp_${prospect.id}`,
          status: prospect.status,
          prospect: prospect,
          personalizedEmails: []
        }))
      ]
    }));

    // Show success message
    alert(`Added ${mockProspectsToAdd.length} prospects to the sequence successfully!`);
  };

  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <FiPlay className="w-4 h-4" />;
      case 'PAUSED':
        return <FiPause className="w-4 h-4" />;
      case 'COMPLETED':
        return <FiCheckSquare className="w-4 h-4" />;
      case 'CANCELLED':
        return <FiSquare className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="animate-spin text-2xl text-gray-400 mr-3" />
        <span className="text-gray-500">Loading sequence...</span>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load sequence</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-bg"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white border-b border-slate-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/campaigns')}
                className="btn-icon text-slate-600 hover:text-slate-900"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                {campaign.description && (
                  <p className="text-slate-600 mt-1">{campaign.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`status ${campaign.status.toLowerCase()}`}>
                {getStatusIcon(campaign.status)}
                {campaign.status}
              </span>
              
              {campaign.status === 'DRAFT' && (
                <button
                  onClick={() => handleCampaignAction('start')}
                  className="btn-primary"
                >
                  <FiPlay className="w-4 h-4" />
                  Start
                </button>
              )}
              {campaign.status === 'ACTIVE' && (
                <button
                  onClick={() => handleCampaignAction('pause')}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
                >
                  <FiPause className="w-4 h-4" />
                  Pause
                </button>
              )}
              {campaign.status === 'PAUSED' && (
                <button
                  onClick={() => handleCampaignAction('restart')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Statistics */}
      <motion.div variants={itemVariants} className="px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-slate-500">
                {campaign.statistics.emailSteps} email, {campaign.statistics.taskSteps} tasks
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{campaign.statistics.totalSteps}</h3>
            <p className="text-slate-600 mt-1">Total Steps</p>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FiUser className="w-6 h-6 text-emerald-600" />
              </div>
              <span className={`text-sm stat-change ${campaign.statistics.activeProspects > 0 ? 'positive' : ''}`}>
                {campaign.statistics.totalProspects > 0 ? 
                  `${Math.round((campaign.statistics.activeProspects / campaign.statistics.totalProspects) * 100)}% active` : 
                  'No prospects'
                }
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{campaign.statistics.totalProspects}</h3>
            <p className="text-slate-600 mt-1">Total Prospects</p>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiTarget className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-slate-500">
                {campaign.statistics.completedProspects} completed
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{campaign.statistics.activeProspects}</h3>
            <p className="text-slate-600 mt-1">Active Prospects</p>
          </div>
        </div>
      </motion.div>

      {/* Simplified Tabs */}
      <motion.div variants={itemVariants} className="px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200">
            <div className="flex">
              {[
                { id: 'steps', label: 'Steps', icon: FiMail, count: campaign.steps.length },
                { id: 'prospects', label: 'Prospects', icon: FiUser, count: campaign.campaignProspects.length },
                { id: 'overview', label: 'Analytics', icon: FiList, count: null },
                { id: 'settings', label: 'Settings', icon: FiSettings, count: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== null && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Campaign Timeline */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Campaign Timeline</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Created</p>
                          <p className="text-xs text-slate-500">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {campaign.startedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Started</p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {campaign.pausedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Paused</p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.pausedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {campaign.completedAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Completed</p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Progress Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Active Prospects</span>
                          <span className="text-sm font-medium text-slate-900">
                            {campaign.statistics.activeProspects}/{campaign.statistics.totalProspects}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${campaign.statistics.totalProspects > 0
                                ? (campaign.statistics.activeProspects / campaign.statistics.totalProspects) * 100
                                : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Completed</span>
                          <span className="text-sm font-medium text-slate-900">
                            {campaign.statistics.completedProspects}/{campaign.statistics.totalProspects}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${campaign.statistics.totalProspects > 0
                                ? (campaign.statistics.completedProspects / campaign.statistics.totalProspects) * 100
                                : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'steps' && (
              <motion.div variants={itemVariants}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Campaign Steps</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Configure and manage the steps in your campaign sequence
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {campaign.steps.length > 0 && (
                      <button
                        onClick={handleReorderSteps}
                        className="btn-secondary"
                      >
                        <FiList className="w-4 h-4" />
                        Reorder
                      </button>
                    )}
                    <button
                      onClick={handleAddStep}
                      className="btn-primary"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Step
                    </button>
                  </div>
                </div>

                {campaign.steps.length > 0 ? (
                  <div className="space-y-4">
                    {campaign.steps.map((step: CampaignStep, index: number) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <StepCard
                          step={step}
                          onEdit={() => handleEditStep(step)}
                          onDelete={() => handleDeleteStep(step.id)}
                          showActions={campaign.status === 'DRAFT'}
                          campaignId={campaign.id}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center text-center"
                  >
                    <FiCalendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Steps Yet</h3>
                    <p className="text-slate-600 mb-6">
                      Start building your campaign by adding your first step.
                    </p>
                    <button
                      onClick={handleAddStep}
                      className="btn-primary mx-auto"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add First Step
                    </button>
                  </motion.div>
                )}

                {campaign.status !== 'DRAFT' && campaign.steps.length > 0 && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Campaign Status Notice</p>
                        <p className="text-sm text-amber-700 mt-1">
                          This campaign is currently {campaign.status.toLowerCase()}.
                          Step editing is limited when campaigns are active.
                          Pause the campaign to make changes to steps.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'prospects' && (
              <motion.div variants={itemVariants}>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Campaign Prospects</h3>
                  <button
                    onClick={handleAddProspects}
                    className="btn-primary"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Prospect
                  </button>
                </div>
                
                <div className="space-y-1">
                  {campaign.campaignProspects.map((cp: CampaignProspect) => (
                    <div key={cp.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-slate-900">{cp.prospect.name}</h4>
                            <span className={`status-badge ${cp.status.toLowerCase()}`}>
                              {cp.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{cp.prospect.email}</p>
                          {(cp.prospect.company || cp.prospect.title) && (
                            <p className="text-sm text-slate-500">
                              {cp.prospect.title && `${cp.prospect.title}`}
                              {cp.prospect.title && cp.prospect.company && ' at '}
                              {cp.prospect.company && `${cp.prospect.company}`}
                            </p>
                          )}

                          {cp.personalizedEmails.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-slate-500 mb-2">Personalized Emails:</p>
                              <div className="flex flex-wrap gap-2">
                                {cp.personalizedEmails.map((email: any) => (
                                  <span
                                    key={email.id}
                                    className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs"
                                  >
                                    Step {email.stepEmailAction.step.stepNumber}: {email.status}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {cp.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleRemoveProspect(cp.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from campaign"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div variants={itemVariants}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sequence Name
                      </label>
                      <input
                        type="text"
                        value={campaign.name}
                        onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter sequence name..."
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={campaign.status}
                        onChange={(e) => setCampaign(prev => ({ ...prev, status: e.target.value as any }))}
                        className="input-field"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAUSED">Paused</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={campaign.description || ''}
                      onChange={(e) => setCampaign(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your sequence objectives and what it aims to achieve..."
                      rows={3}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Send Time
                      </label>
                      <div className="relative">
                        <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="time"
                          value={campaign.sendTime || '09:00'}
                          onChange={(e) => setCampaign(prev => ({ ...prev, sendTime: e.target.value }))}
                          className="input-field pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Daily Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={campaign.dailyLimit || 50}
                        onChange={(e) => setCampaign(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) || 50 }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={campaign.timezone || 'America/New_York'}
                      onChange={(e) => setCampaign(prev => ({ ...prev, timezone: e.target.value }))}
                      className="input-field"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FiSettings className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Delivery Settings</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          These settings control when and how many emails are sent per day.
                          Sequences will respect the daily limit and send at the specified time in the chosen timezone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

        {/* Step Editor Modal */}
        {editingStep && (
          <StepEditor
            step={editingStep}
            isOpen={isStepEditorOpen}
            onClose={() => {
              setIsStepEditorOpen(false);
              setEditingStep(null);
            }}
            onSave={handleSaveStep}
            onDelete={() => {
              if (editingStep && window.confirm('Are you sure you want to delete this step?')) {
                handleDeleteStep(editingStep.id);
                setIsStepEditorOpen(false);
                setEditingStep(null);
              }
            }}
            availableTemplates={mockEmailTemplates}
            isFirst={editingStep.stepNumber === 1}
            isLast={campaign ? editingStep.stepNumber === campaign.steps.length : false}
          />
        )}

        {/* Step Reorder Modal */}
        <StepReorder
          steps={campaign?.steps || []}
          isOpen={isStepReorderOpen}
          onClose={() => setIsStepReorderOpen(false)}
          onSaveReorder={handleSaveReorder}
          onAddStep={handleAddStep}
          onEditStep={handleEditStep}
          onDeleteStep={handleDeleteStep}
        />
      </motion.div>
  );
};

export default SequenceDetailsPage;