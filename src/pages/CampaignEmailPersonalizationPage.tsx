import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiRefreshCw,
  FiMail,
  FiUser,
  FiZap,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiAlertCircle,
  FiDownload,
  FiGrid,
  FiList,
} from 'react-icons/fi';

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

interface CampaignStep {
  id: string;
  stepNumber: number;
  delayDays: number;
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

const CampaignEmailPersonalizationPage: React.FC = () => {
  const { id, stepNumber } = useParams<{ id: string; stepNumber: string }>();
  const navigate = useNavigate();
  const [selectedProspectId, setSelectedProspectId] = useState<string>('');
  const [editingEmail, setEditingEmail] = useState<{ subject: string; body: string }>({
    subject: '',
    body: '',
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [selectedStep, setSelectedStep] = useState<CampaignStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock campaign data - in real app, this would be fetched from API
  useEffect(() => {
    const mockCampaign: Campaign = {
      id: id || '1',
      name: 'Welcome Series Campaign',
      description: 'Onboarding campaign for new subscribers with personalized emails and follow-up tasks.',
      status: 'DRAFT',
      createdAt: '2024-01-15T10:00:00Z',
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          delayDays: 0,
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
          delayDays: 2,
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
        }
      ],
      campaignProspects: [
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
          personalizedEmails: []
        },
        {
          id: 'cp_3',
          status: 'PENDING',
          prospect: {
            id: 'prospect_3',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            company: 'StartupXYZ',
            title: 'CTO',
            location: 'Austin, TX',
            industry: 'Technology',
            notes: 'Technical founder, looking for scalable solutions'
          },
          personalizedEmails: []
        }
      ],
      statistics: {
        totalSteps: 2,
        emailSteps: 2,
        taskSteps: 0,
        totalProspects: 3,
        activeProspects: 1,
        completedProspects: 0
      }
    };

    setCampaign(mockCampaign);

    // Set selected step based on URL parameter
    const step = mockCampaign.steps.find(s => s.stepNumber === parseInt(stepNumber || '1'));
    setSelectedStep(step || mockCampaign.steps[0]);

    // Set first prospect as default
    if (mockCampaign.campaignProspects.length > 0) {
      setSelectedProspectId(mockCampaign.campaignProspects[0].id);
    }

    setIsLoading(false);
  }, [id, stepNumber]);

  const selectedProspect = campaign?.campaignProspects.find(p => p.id === selectedProspectId);
  const currentPersonalizedEmail = selectedProspect?.personalizedEmails.find(
    email => email.stepEmailAction.step.stepNumber === selectedStep?.stepNumber
  );

  useEffect(() => {
    if (currentPersonalizedEmail) {
      setEditingEmail({
        subject: currentPersonalizedEmail.subject,
        body: currentPersonalizedEmail.body || '',
      });
    } else if (selectedStep?.emailAction?.template) {
      // Generate initial personalized email using template
      const personalizedSubject = personalizeContent(selectedStep.emailAction.template.subject, selectedProspect?.prospect);
      const personalizedBody = personalizeContent(selectedStep.emailAction.template.body, selectedProspect?.prospect);
      setEditingEmail({
        subject: personalizedSubject,
        body: personalizedBody,
      });
    }
  }, [selectedProspectId, currentPersonalizedEmail, selectedStep, selectedProspect?.prospect]);

  const personalizeContent = (content: string, prospect?: CampaignProspect['prospect']) => {
    if (!prospect) return content;

    return content
      .replace(/\{\{name\}\}/g, prospect.name || 'there')
      .replace(/\{\{company\}\}/g, prospect.company || 'your company')
      .replace(/\{\{title\}\}/g, prospect.title || 'your role')
      .replace(/\{\{email\}\}/g, prospect.email || 'your email')
      .replace(/\{\{industry\}\}/g, prospect.industry || 'your industry');
  };

  const handleRegenerateAI = async () => {
    if (!selectedProspect || !selectedStep) return;

    setIsRegenerating(true);

    // Simulate AI regeneration with user prompt
    setTimeout(() => {
      let newSubject = `Personalized: ${selectedStep.emailAction?.customSubject || selectedStep.emailAction?.template?.subject || 'Reaching out'}`;
      let newBody = `Hi ${selectedProspect.prospect.name},\n\nI hope this email finds you well. As ${selectedProspect.prospect.title || 'a professional'} at ${selectedProspect.prospect.company || 'your company'}, I thought you might be interested in our solutions.\n\n${selectedStep.emailAction?.customBody || selectedStep.emailAction?.template?.body || 'I\'d love to connect and learn more about your needs.'}\n\nBest regards,\nYour Name`;

      // Apply user's AI prompt if provided
      if (aiPrompt.trim()) {
        const promptInstructions = aiPrompt.toLowerCase();

        if (promptInstructions.includes('more casual') || promptInstructions.includes('friendly')) {
          newSubject = `Hey ${selectedProspect.prospect.name}! Quick question about ${selectedProspect.prospect.company}`;
          newBody = `Hey ${selectedProspect.prospect.name},\n\nHope you're having a great week! I noticed you're the ${selectedProspect.prospect.title} at ${selectedProspect.prospect.company} and had a quick thought I wanted to share.\n\n${aiPrompt.includes('specific') ? aiPrompt : 'Based on your role, I think you might find our platform really helpful for streamlining your workflow.'}\n\nWould love to chat for 15 minutes next week if you're open to it!\n\nCheers,\nYour Name`;
        } else if (promptInstructions.includes('formal') || promptInstructions.includes('professional')) {
          newSubject = `Regarding ${selectedProspect.prospect.company}: Strategic Partnership Opportunity`;
          newBody = `Dear ${selectedProspect.prospect.name},\n\nI hope this message finds you well. I am reaching out to you in your capacity as ${selectedProspect.prospect.title} at ${selectedProspect.prospect.company}.\n\n${aiPrompt.includes('specific') ? aiPrompt : 'After researching your company\'s current initiatives, I believe there may be a compelling alignment between our solutions and your organizational objectives.'}\n\nI would appreciate the opportunity to discuss this further at your convenience.\n\nSincerely,\nYour Name`;
        } else {
          newSubject = `Personalized for ${selectedProspect.prospect.name} at ${selectedProspect.prospect.company}`;
          newBody = `Hi ${selectedProspect.prospect.name},\n\nI hope you're having a productive week. I'm reaching out because I understand that as ${selectedProspect.prospect.title} at ${selectedProspect.prospect.company}, you're likely focused on ${selectedProspect.prospect.industry === 'Technology' ? 'innovation and efficiency' : 'growth and optimization'}.\n\n${aiPrompt.trim()}\n\n${selectedStep.emailAction?.customBody || selectedStep.emailAction?.template?.body || 'I believe our solution could be particularly valuable for your team.'}\n\nWould you be open to a brief conversation to explore this further?\n\nBest regards,\nYour Name`;
        }
      }

      setEditingEmail({
        subject: newSubject,
        body: newBody,
      });

      setIsRegenerating(false);
    }, 2500);
  };

  const handleSave = () => {
    if (!selectedProspectId) return;
    console.log('Saving personalized email:', { prospectId: selectedProspectId, emailData: editingEmail });
    // In real app, this would save to API
    alert('Personalized email saved successfully!');
  };

  const copyToClipboard = () => {
    const fullEmail = `Subject: ${editingEmail.subject}\n\n${editingEmail.body}`;
    navigator.clipboard.writeText(fullEmail);
    alert('Email copied to clipboard!');
  };

  const handleStepChange = (step: CampaignStep) => {
    setSelectedStep(step);
    navigate(`/dashboard/campaigns/${id}/personalize/${step.stepNumber}`);
  };

  const handleSaveAllEmails = () => {
    console.log('Saving all personalized emails for step:', selectedStep?.stepNumber);
    alert('All personalized emails saved successfully!');
  };

  const handleExportEmails = () => {
    console.log('Exporting personalized emails...');
    alert('Emails exported successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="animate-spin text-2xl text-gray-400 mr-3" />
        <span className="text-gray-500">Loading campaign...</span>
      </div>
    );
  }

  if (!campaign || !selectedStep) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load campaign or step</p>
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
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/dashboard/campaigns/${id}`}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email Personalization</h1>
                <p className="text-gray-600 mt-1">
                  Campaign: {campaign.name} • {selectedStep.name || `Step ${selectedStep.stepNumber}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleSaveAllEmails}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                Save All Emails
              </button>
              <button
                onClick={handleExportEmails}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Step Selector */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Select Step:</span>
            <div className="flex gap-2">
              {campaign.steps.filter(step => step.emailAction).map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(step)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedStep.id === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Step {step.stepNumber}: {step.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prospects Section */}
          <div className="lg:col-span-1">
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Prospects</h2>
                <p className="text-sm text-gray-600">
                  {campaign.campaignProspects.length} prospects • Select to personalize email
                </p>
              </div>
              <div className={`p-6 ${viewMode === 'grid' ? '' : 'space-y-4'}`}>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {campaign.campaignProspects.map((prospect) => {
                      const hasPersonalizedEmail = prospect.personalizedEmails.some(
                        email => email.stepEmailAction.step.stepNumber === selectedStep.stepNumber
                      );

                      return (
                        <motion.div
                          key={prospect.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProspectId(prospect.id)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedProspectId === prospect.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              selectedProspectId === prospect.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <FiUser className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {prospect.prospect.name}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {prospect.prospect.email}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {prospect.prospect.title && `${prospect.prospect.title} at ${prospect.prospect.company}`}
                              </p>
                            </div>
                          </div>
                          {hasPersonalizedEmail && (
                            <div className="flex items-center gap-1 mt-3">
                              <FiZap className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Personalized</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaign.campaignProspects.map((prospect) => {
                      const hasPersonalizedEmail = prospect.personalizedEmails.some(
                        email => email.stepEmailAction.step.stepNumber === selectedStep.stepNumber
                      );

                      return (
                        <motion.div
                          key={prospect.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedProspectId(prospect.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedProspectId === prospect.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedProspectId === prospect.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <FiUser className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {prospect.prospect.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {prospect.prospect.title && `${prospect.prospect.title} at ${prospect.prospect.company}`}
                                </p>
                              </div>
                            </div>
                            {hasPersonalizedEmail && (
                              <FiZap className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Email Editor Section */}
          <div className="lg:col-span-2">
            {selectedProspect ? (
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Prospect Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                        {selectedProspect.prospect.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedProspect.prospect.name}
                        </h2>
                        <p className="text-gray-600">
                          {selectedProspect.prospect.title && `${selectedProspect.prospect.title} at `}
                          {selectedProspect.prospect.company}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {selectedProspect.prospect.email && (
                            <span className="flex items-center gap-1">
                              <FiMail className="w-3 h-3" />
                              {selectedProspect.prospect.email}
                            </span>
                          )}
                          {selectedProspect.prospect.industry && (
                            <span>Industry: {selectedProspect.prospect.industry}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          showPreview
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {showPreview ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        {showPreview ? 'Edit Mode' : 'Preview Mode'}
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy email"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Enhancement Section */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiZap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3">AI Enhancement Instructions</h3>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Optional: Provide specific instructions for AI regeneration (e.g., 'Make it more casual and friendly', 'Focus on cost savings', 'Keep it under 100 words', 'Emphasize ROI', 'Make it more formal and professional')..."
                        rows={4}
                        className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm resize-none"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-purple-700 max-w-md">
                          Give the AI specific feedback to regenerate the email according to your preferences
                        </p>
                        <div className="flex items-center gap-3 ml-4">
                          <button
                            onClick={() => setAiPrompt('')}
                            className="px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-md transition-colors min-w-[60px]"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleRegenerateAI}
                            disabled={isRegenerating}
                            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center shadow-sm hover:shadow-md"
                          >
                            {isRegenerating ? (
                              <>
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <FiZap className="w-4 h-4" />
                                {aiPrompt.trim() ? 'AI Regenerate (Custom)' : 'AI Regenerate'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={editingEmail.subject}
                        onChange={(e) => setEditingEmail(prev => ({ ...prev, subject: e.target.value }))}
                        disabled={!showPreview}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-lg"
                        placeholder="Enter email subject..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Email Body
                      </label>
                      <textarea
                        value={editingEmail.body}
                        onChange={(e) => setEditingEmail(prev => ({ ...prev, body: e.target.value }))}
                        disabled={!showPreview}
                        rows={15}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                        placeholder="Compose your personalized email..."
                      />
                    </div>

                    {/* AI Personalization Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FiZap className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900">AI Personalization Active</h4>
                          <p className="text-sm text-green-700 mt-1">
                            This email has been personalized using AI based on the prospect's information.
                            Variables like {'{{name}}'}, {'{{company}}'}, and {'{{title}}'} have been replaced with actual data.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={!showPreview}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <FiSave className="w-4 h-4" />
                        Save Email for {selectedProspect.prospect.name}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">No Prospect Selected</h2>
                <p className="text-gray-600 mb-6">
                  Select a prospect from the left panel to view and personalize their email
                </p>
                <div className="max-w-md mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Each prospect can receive a uniquely personalized email based on their profile information and your AI instructions.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CampaignEmailPersonalizationPage;