import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiSquare,
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
  FiInfo,
  FiX,
  FiZap,
} from 'react-icons/fi';
import StepEditor from '../components/campaigns/StepEditor';

import StepCard from '../components/campaigns/StepCard';
import ModalWrapper from '../components/ModalWrapper';
import { useConfirm } from '../hooks/useConfirm';
import { useAlert } from '../hooks/useAlert';

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
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'prospects' | 'settings'>('overview');
  const [editingStep, setEditingStep] = useState<CampaignStep | null>(null);
  const [isStepEditorOpen, setIsStepEditorOpen] = useState(false);
  
  const [showProspectSelectionModal, setShowProspectSelectionModal] = useState(false);
  const [selectedProspectsToAdd, setSelectedProspectsToAdd] = useState<string[]>([]);
  
  // State for schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('UTC');
  
  // Check if this is a newly created blank sequence
  const isNewSequence = id?.startsWith('seq_') || false;

  // Scroll to top when navigating to this page (especially for campaign details)
  useEffect(() => {
    // Multiple attempts to scroll to top for this specific page
    const scrollToTop = () => {
      // Try to find and scroll the main content area
      const mainContent = document.querySelector('.flex-1.overflow-auto') as HTMLElement;
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
      
      // Also scroll window to top
      window.scrollTo(0, 0);
      
      // Try any other scrollable elements
      const scrollableElements = document.querySelectorAll('[class*="overflow"], [class*="scroll"]');
      scrollableElements.forEach((el: any) => {
        if (el && typeof el.scrollTop === 'number') {
          el.scrollTop = 0;
        }
      });
    };

    // Immediate scroll
    scrollToTop();
    
    // Multiple retries to ensure it works
    const timeouts = [10, 50, 100, 200, 500];
    timeouts.forEach((delay) => {
      setTimeout(scrollToTop, delay);
    });
  }, [location.pathname, location.key]); // Add location.key to catch back/forward navigation

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

  // Mock available prospects for selection
  const availableProspects = [
    {
      id: 'prospect_a1',
      name: 'Sarah Johnson',
      email: 'sarah.j@techstart.io',
      company: 'TechStart Inc.',
      title: 'VP of Engineering',
      location: 'San Francisco, CA',
      industry: 'Technology',
      status: 'NEW'
    },
    {
      id: 'prospect_a2',
      name: 'Michael Chen',
      email: 'm.chen@innovatecorp.com',
      company: 'InnovateCorp',
      title: 'CTO',
      location: 'New York, NY',
      industry: 'Technology',
      status: 'NEW'
    },
    {
      id: 'prospect_a3',
      name: 'Emma Williams',
      email: 'emma.w@designhub.co',
      company: 'Design Hub',
      title: 'Creative Director',
      location: 'Los Angeles, CA',
      industry: 'Design',
      status: 'CONTACTED'
    },
    {
      id: 'prospect_a4',
      name: 'David Martinez',
      email: 'david.m@fintech.pro',
      company: 'FinTech Pro',
      title: 'CEO',
      location: 'Austin, TX',
      industry: 'Finance',
      status: 'NEW'
    },
    {
      id: 'prospect_a5',
      name: 'Lisa Anderson',
      email: 'lisa.a@healthplus.com',
      company: 'HealthPlus',
      title: 'Product Manager',
      location: 'Boston, MA',
      industry: 'Healthcare',
      status: 'REPLIED'
    },
    {
      id: 'prospect_a6',
      name: 'James Wilson',
      email: 'j.wilson@retailnow.net',
      company: 'RetailNow',
      title: 'Marketing Director',
      location: 'Chicago, IL',
      industry: 'Retail',
      status: 'NEW'
    }
  ];

  const [isLoading] = useState(false);
  const [error] = useState(null);
  
  // Hooks for modals
  const { confirmWarning, confirmDanger } = useConfirm();
  const { showSuccess, showError, showWarning, showInfo } = useAlert();

  const handleCampaignAction = (action: 'start' | 'pause' | 'restart' | 'stop' | 'schedule' | 'end') => {
    console.log(`Sequence action: ${action}`, { sequenceId: id, scheduleMode, scheduledDate });
    
    if (action === 'start') {
      // Update campaign status to ACTIVE
      setCampaign(prev => ({ ...prev, status: 'ACTIVE' }));
      showSuccess(`Campaign "${campaign.name}" started successfully! 🚀`);
    } else if (action === 'pause') {
      // Update campaign status to PAUSED
      setCampaign(prev => ({ ...prev, status: 'PAUSED' }));
      showSuccess(`Campaign "${campaign.name}" paused successfully! ⏸️`);
    } else if (action === 'restart') {
      // Update campaign status to ACTIVE
      setCampaign(prev => ({ ...prev, status: 'ACTIVE' }));
      showSuccess(`Campaign "${campaign.name}" resumed successfully! ▶️`);
    } else if (action === 'end') {
      // Update campaign status to COMPLETED
      setCampaign(prev => ({ ...prev, status: 'COMPLETED' }));
      showSuccess(`Campaign "${campaign.name}" ended successfully! 🔴`);
    } else if (action === 'schedule') {
      if (scheduleMode === 'scheduled' && !scheduledDate) {
        showWarning('Please select a date to schedule the campaign.');
        return;
      }
      const scheduleText = scheduleMode === 'now' 
        ? 'immediately' 
        : `on ${new Date(scheduledDate).toLocaleDateString()}`;
      showInfo(`Sequence "${campaign.name}" scheduled to start ${scheduleText} (frontend demo)`);
    } else {
      showInfo(`Sequence "${campaign.name}" ${action} action triggered (frontend demo)`);
    }
  };

  const handleRemoveProspect = (campaignProspectId: string) => {
    console.log('Removing prospect:', campaignProspectId);
    // Frontend-only: just log the action
    showInfo('Prospect removed (frontend demo)');
  };

  // Step management functions (frontend-only for now)
  const handleEditStep = (step: CampaignStep) => {
    setEditingStep(step);
    setIsStepEditorOpen(true);
  };

  const handleSaveStep = (updatedStep: CampaignStep) => {
    console.log('Saving step:', updatedStep);
    // Frontend-only: just log the changes
    showSuccess(`Step "${updatedStep.name || updatedStep.stepNumber}" saved (frontend demo)`);
    setEditingStep(null);
    setIsStepEditorOpen(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!campaign) return;

    confirmDanger({
      title: 'Delete Step',
      message: 'Are you sure you want to delete this step? This action cannot be undone.',
      onConfirm: () => {
        console.log('Deleting step:', stepId);
        // Frontend-only: just log the action
        showSuccess('Step deleted (frontend demo)');
      }
    });
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

  const handleMoveStepUp = (stepId: string) => {
    if (!campaign) return;
    
    const stepIndex = campaign.steps.findIndex(s => s.id === stepId);
    if (stepIndex <= 0) return; // Can't move up if already at top

    // Update step order in frontend demo
    const newSteps = [...campaign.steps];
    [newSteps[stepIndex - 1], newSteps[stepIndex]] = [newSteps[stepIndex], newSteps[stepIndex - 1]];
    
    // Update step numbers
    const updatedSteps = newSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setCampaign(prev => ({ ...prev, steps: updatedSteps }));
    showSuccess('Step moved up successfully!');
  };

  const handleMoveStepDown = (stepId: string) => {
    if (!campaign) return;
    
    const stepIndex = campaign.steps.findIndex(s => s.id === stepId);
    if (stepIndex >= campaign.steps.length - 1) return; // Can't move down if already at bottom

    // Update step order in frontend demo
    const newSteps = [...campaign.steps];
    [newSteps[stepIndex], newSteps[stepIndex + 1]] = [newSteps[stepIndex + 1], newSteps[stepIndex]];
    
    // Update step numbers
    const updatedSteps = newSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setCampaign(prev => ({ ...prev, steps: updatedSteps }));
    showSuccess('Step moved down successfully!');
  };

  

  
  const handleAddProspects = () => {
    if (!campaign) return;

    // Open prospect selection modal
    setShowProspectSelectionModal(true);
    setSelectedProspectsToAdd([]);
  };

  const handleProspectSelection = (prospectId: string) => {
    setSelectedProspectsToAdd(prev =>
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const handleAddSelectedProspects = () => {
    if (selectedProspectsToAdd.length === 0) {
      showWarning('Please select at least one prospect to add.');
      return;
    }

    const prospectsToAdd = availableProspects.filter(prospect =>
      selectedProspectsToAdd.includes(prospect.id)
    );

    // Update the campaign with new prospects
    setCampaign(prev => ({
      ...prev,
      campaignProspects: [
        ...(prev.campaignProspects || []),
        ...prospectsToAdd.map(prospect => ({
          id: `cp_${prospect.id}`,
          status: 'PENDING',
          prospect: {
            id: prospect.id,
            name: prospect.name,
            email: prospect.email,
            company: prospect.company,
            title: prospect.title,
            location: prospect.location,
            industry: prospect.industry,
            notes: '',
          },
          personalizedEmails: []
        }))
      ],
      statistics: {
        ...prev.statistics,
        totalProspects: prev.statistics.totalProspects + prospectsToAdd.length
      }
    }));

    // Close modal and show success message
    setShowProspectSelectionModal(false);
    setSelectedProspectsToAdd([]);
    showSuccess(`Added ${prospectsToAdd.length} prospects to the sequence successfully!`);
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
      className="sequence-editor"
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
                <>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-4 py-2 bg-white border-2 border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <FiCalendar className="w-4 h-4" />
                    <span>Schedule</span>
                  </button>
                  <button
                    onClick={() => handleCampaignAction('start')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <FiPlay className="w-4 h-4" />
                    <span>Start Now</span>
                  </button>
                </>
              )}
              {campaign.status === 'ACTIVE' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCampaignAction('pause')}
                    className="px-4 py-2 bg-white border-2 border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <FiPause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={() => handleCampaignAction('end')}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <FiSquare className="w-4 h-4" />
                    <span>End</span>
                  </button>
                </div>
              )}
              {campaign.status === 'PAUSED' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCampaignAction('restart')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => handleCampaignAction('end')}
                    className="px-4 py-2 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <FiSquare className="w-4 h-4" />
                    <span>End</span>
                  </button>
                </div>
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
                  onClick={() => {
                    console.log('Tab clicked:', tab.id);
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
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
          
          <div className="p-6 bg-white min-h-[400px]">
  
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Campaign Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Campaign Timeline */}
                  <div className="analytics-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Campaign Timeline</h3>
                    <div className="space-y-3">
                      <div className="timeline-item">
                        <div className="timeline-dot bg-blue-500"></div>
                        <div className="timeline-content">
                          <p className="text-sm font-medium text-slate-900">Created</p>
                          <p className="text-xs text-slate-500">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {campaign.startedAt && (
                        <div className="timeline-item">
                          <div className="timeline-dot bg-emerald-500"></div>
                          <div className="timeline-content">
                            <p className="text-sm font-medium text-slate-900">Started</p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.startedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {campaign.pausedAt && (
                        <div className="timeline-item">
                          <div className="timeline-dot bg-amber-500"></div>
                          <div className="timeline-content">
                            <p className="text-sm font-medium text-slate-900">Paused</p>
                            <p className="text-xs text-slate-500">
                              {new Date(campaign.pausedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {campaign.completedAt && (
                        <div className="timeline-item">
                          <div className="timeline-dot bg-blue-500"></div>
                          <div className="timeline-content">
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
                  <div className="analytics-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Progress Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Active Prospects</span>
                          <span className="text-sm font-medium text-slate-900">
                            {campaign.statistics.activeProspects}/{campaign.statistics.totalProspects}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-emerald-500"
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
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-blue-500"
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
              </div>
            )}

            {activeTab === 'steps' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Campaign Steps</h2>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">
                      Configure and manage the steps in your campaign sequence
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
                      <div key={step.id}>
                        <StepCard
                          step={step}
                          onEdit={() => handleEditStep(step)}
                          onDelete={() => handleDeleteStep(step.id)}
                          onMoveUp={() => handleMoveStepUp(step.id)}
                          onMoveDown={() => handleMoveStepDown(step.id)}
                          isReorderable={campaign.status === 'DRAFT'}
                          showActions={campaign.status === 'DRAFT'}
                          isFirst={index === 0}
                          isLast={index === campaign.steps.length - 1}
                          campaignId={campaign.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="step-empty-state">
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
                  </div>
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
              </div>
            )}

            {activeTab === 'prospects' && (
              <div>
                {/* Header with Add Prospect Button */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Campaign Prospects</h2>
                      <p className="text-slate-600 mt-1">Manage prospects in this campaign sequence</p>
                    </div>
                    <button
                      onClick={handleAddProspects}
                      className="btn-primary flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Prospect
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Prospects</p>
                          <p className="text-2xl font-bold text-blue-900">{campaign.campaignProspects.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Active</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {campaign.campaignProspects.filter(cp => cp.status === 'ACTIVE').length}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <FiPlay className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-amber-600 font-medium">Pending</p>
                          <p className="text-2xl font-bold text-amber-900">
                            {campaign.campaignProspects.filter(cp => cp.status === 'PENDING').length}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FiClock className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Completed</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {campaign.campaignProspects.filter(cp => cp.status === 'COMPLETED').length}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FiCheckSquare className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prospects List */}
                {campaign.campaignProspects.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FiUser className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No prospects yet</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Start by adding prospects to your campaign sequence to begin your outreach.
                    </p>
                    <button
                      onClick={handleAddProspects}
                      className="btn-primary inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Your First Prospect
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaign.campaignProspects.map((cp: CampaignProspect, index: number) => (
                      <div
                        key={cp.id}
                        className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                                {cp.prospect.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold text-slate-900 text-lg">{cp.prospect.name}</h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                    cp.status === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : cp.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                                      : cp.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {cp.status === 'ACTIVE' && <FiPlay className="w-3 h-3 inline mr-1" />}
                                    {cp.status === 'PENDING' && <FiClock className="w-3 h-3 inline mr-1" />}
                                    {cp.status === 'COMPLETED' && <FiCheckSquare className="w-3 h-3 inline mr-1" />}
                                    {cp.status}
                                  </span>
                                </div>
                                <p className="text-slate-600 font-medium">{cp.prospect.email}</p>
                                {(cp.prospect.title || cp.prospect.company) && (
                                  <p className="text-sm text-slate-500 mt-1">
                                    {cp.prospect.title && `${cp.prospect.title}`}
                                    {cp.prospect.title && cp.prospect.company && ' at '}
                                    {cp.prospect.company && `${cp.prospect.company}`}
                                  </p>
                                )}
                              </div>
                            </div>

                            {cp.personalizedEmails.length > 0 && (
                              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-xs text-slate-600 font-medium mb-2">Personalized Emails Progress:</p>
                                <div className="flex flex-wrap gap-2">
                                  {cp.personalizedEmails.map((email: any) => (
                                    <span
                                      key={email.id}
                                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                        email.status === 'SENT'
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                          : email.status === 'DRAFT'
                                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      Step {email.stepEmailAction.step.stepNumber}: {email.status}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => navigate(`/dashboard/campaigns/${campaign.id}/prospects/${cp.prospect.id}/steps`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Configure prospect personalization"
                            >
                              <FiZap className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveProspect(cp.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from campaign"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Campaign Settings</h2>
                    <p className="text-slate-600">Configure your campaign basic information</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="btn-secondary">
                      Cancel Changes
                    </button>
                    <button className="btn-primary">
                      Save Settings
                    </button>
                  </div>
                </div>

                {/* Basic Information Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 w-full"
                >
                  <div className="px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FiMail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
                        <p className="text-slate-600">Configure campaign name and description</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Campaign Name
                        </label>
                        <input
                          type="text"
                          value={campaign.name}
                          onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter campaign name..."
                          className="w-full px-5 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 hover:bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Description
                        </label>
                        <textarea
                          value={campaign.description || ''}
                          onChange={(e) => setCampaign(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your campaign objectives and what it aims to achieve..."
                          rows={4}
                          className="w-full px-5 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all duration-200 hover:border-slate-300 hover:bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Status Bar */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <FiInfo className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-700">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              campaign.status === 'DRAFT' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              campaign.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              campaign.status === 'PAUSED' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiCalendar className="w-4 h-4" />
                          <span>Created: {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
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
              confirmDanger({
                title: 'Delete Step',
                message: 'Are you sure you want to delete this step? This action cannot be undone.',
                onConfirm: () => {
                  handleDeleteStep(editingStep.id);
                  setIsStepEditorOpen(false);
                  setEditingStep(null);
                }
              });
            }}
            availableTemplates={mockEmailTemplates}
            isFirst={editingStep.stepNumber === 1}
            isLast={campaign ? editingStep.stepNumber === campaign.steps.length : false}
          />
        )}

        

        {/* Prospect Selection Modal */}
        <ModalWrapper
          isOpen={showProspectSelectionModal}
          onClose={() => {
            setShowProspectSelectionModal(false);
            setSelectedProspectsToAdd([]);
          }}
          maxWidth="max-w-4xl"
        >
          <div className="bg-white rounded-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Select Prospects</h3>
                  <p className="text-sm text-slate-600 mt-1">Choose prospects to add to this campaign</p>
                </div>
                <button
                  onClick={() => {
                    setShowProspectSelectionModal(false);
                    setSelectedProspectsToAdd([]);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {availableProspects.length === 0 ? (
                <div className="text-center py-12">
                  <FiUser className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">No available prospects</h4>
                  <p className="text-slate-600">There are no prospects available to add to this campaign.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700 font-medium">
                        {selectedProspectsToAdd.length} prospect{selectedProspectsToAdd.length !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProspectsToAdd(availableProspects.map(p => p.id))}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedProspectsToAdd([])}
                          className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prospects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableProspects.map((prospect) => (
                      <div
                        key={prospect.id}
                        onClick={() => handleProspectSelection(prospect.id)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedProspectsToAdd.includes(prospect.id)
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {prospect.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-slate-900 truncate">{prospect.name}</h5>
                              <input
                                type="checkbox"
                                checked={selectedProspectsToAdd.includes(prospect.id)}
                                onChange={() => handleProspectSelection(prospect.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{prospect.email}</p>
                            <p className="text-sm text-slate-600 mb-1">
                              {prospect.title} at {prospect.company}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                prospect.status === 'NEW'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : prospect.status === 'CONTACTED'
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  : prospect.status === 'REPLIED'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {prospect.status}
                              </span>
                              <span className="text-xs text-slate-500">{prospect.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedProspectsToAdd.length > 0 && (
                    <span>Ready to add {selectedProspectsToAdd.length} prospect{selectedProspectsToAdd.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProspectSelectionModal(false);
                      setSelectedProspectsToAdd([]);
                    }}
                    className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSelectedProspects}
                    disabled={selectedProspectsToAdd.length === 0}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Add Selected Prospects
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalWrapper>

        {/* Schedule Modal */}
        <ModalWrapper
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduledDate('');
            setScheduledTime('');
            setTimezone('UTC');
          }}
          maxWidth="max-w-md"
        >
          <div className="bg-white rounded-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Schedule Campaign</h3>
                  <p className="text-sm text-slate-600 mt-1">Choose when to start your campaign</p>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduledDate('');
                    setScheduledTime('');
                    setTimezone('UTC');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schedule Date
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schedule Time
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">🇺🇸 Eastern Time (ET)</option>
                    <option value="America/Chicago">🇺🇸 Central Time (CT)</option>
                    <option value="America/Denver">🇺🇸 Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">🇺🇸 Pacific Time (PT)</option>
                    <option value="Europe/London">🇬🇧 London (GMT)</option>
                    <option value="Europe/Paris">🇫🇷 Paris (CET)</option>
                    <option value="Asia/Tokyo">🇯🇵 Tokyo (JST)</option>
                    <option value="Australia/Sydney">🇦🇺 Sydney (AEDT)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduledDate('');
                    setScheduledTime('');
                    setTimezone('UTC');
                  }}
                  className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!scheduledDate || !scheduledTime) {
                      showWarning('Please select both date and time for scheduled campaigns.');
                      return;
                    }
                    
                    const scheduleText = `on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} ${timezone}`;
                    
                    showSuccess(`Campaign "${campaign.name}" scheduled to start ${scheduleText} (frontend demo)`);
                    setShowScheduleModal(false);
                    setScheduledDate('');
                    setScheduledTime('');
                    setTimezone('UTC');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Schedule Campaign
                </button>
              </div>
            </div>
          </div>
        </ModalWrapper>
      </motion.div>
  );
};

export default SequenceDetailsPage;