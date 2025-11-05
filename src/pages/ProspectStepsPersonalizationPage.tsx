import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiX, FiEdit3, FiMail, FiLinkedin, FiPhone, FiCheckSquare, FiRefreshCw, FiCopy, FiHome, FiBriefcase } from 'react-icons/fi';
import CustomEmailBodyEditor from '../components/rich-text/CustomEmailBodyEditor';

interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
  industry?: string;
}

interface Step {
  id: number;
  name: string;
  type: 'email' | 'task' | 'linkedin' | 'call';
  aiPersonalizationEnabled: boolean;
  template?: {
    subject: string;
    body: string;
  };
  prospectContent?: {
    personalized: {
      subject: string;
      greeting: string;
      introduction: string;
      companyReference: string;
    };
    custom: {
      subject: string;
      body: string;
    };
    type: 'personalized' | 'custom' | 'template';
    lastUpdated: string;
  };
}

const ProspectStepsPersonalizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { prospectId } = useParams<{ prospectId: string }>();

  // Mock prospect data
  const [prospect] = useState<Prospect>({
    id: parseInt(prospectId || '1'),
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    company: 'TechCorp Industries',
    title: 'VP of Engineering',
    industry: 'Technology'
  });

  // Mock steps data - each step can have AI personalization enabled/disabled
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      name: 'Initial Outreach Email',
      type: 'email',
      aiPersonalizationEnabled: true,
      template: {
        subject: 'Quick question about your work at {{company}}',
        body: 'Hi {{name}},\\n\\nI hope this email finds you well. I wanted to reach out regarding your role as {{title}} at {{company}}.\\n\\nBest regards,\\nYour Name'
      },
      prospectContent: {
        personalized: {
          subject: 'Sarah, quick question about your engineering goals',
          greeting: 'Hi Sarah,',
          introduction: "I noticed your work at TechCorp and was impressed by your recent product launches.",
          companyReference: "Given TechCorp's focus on enterprise solutions, I think we could help streamline your development workflow."
        },
        custom: {
          subject: 'Custom: TechCorp collaboration opportunity',
          body: 'Hi Sarah, I wanted to reach out personally about...'
        },
        type: 'personalized',
        lastUpdated: '2024-01-15T10:30:00Z'
      }
    },
    {
      id: 2,
      name: 'Follow-up Email',
      type: 'email',
      aiPersonalizationEnabled: false,
      template: {
        subject: 'Following up on our conversation',
        body: 'Hi {{name}},\\n\\nJust wanted to follow up on our previous discussion.\\n\\nBest regards,\\nYour Name'
      },
      prospectContent: {
        personalized: {
          subject: '',
          greeting: '',
          introduction: '',
          companyReference: ''
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'template',
        lastUpdated: '2024-01-14T15:45:00Z'
      }
    },
    {
      id: 3,
      name: 'LinkedIn Connection',
      type: 'linkedin',
      aiPersonalizationEnabled: false,
      prospectContent: {
        personalized: {
          subject: '',
          greeting: '',
          introduction: '',
          companyReference: ''
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'template',
        lastUpdated: '2024-01-13T14:20:00Z'
      }
    },
    {
      id: 4,
      name: 'Phone Call',
      type: 'call',
      aiPersonalizationEnabled: false,
      prospectContent: {
        personalized: {
          subject: '',
          greeting: '',
          introduction: '',
          companyReference: ''
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'template',
        lastUpdated: '2024-01-12T16:30:00Z'
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);
  const [rejectComment, setRejectComment] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    subject: '',
    body: ''
  });

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter steps based on search
  const filteredSteps = steps.filter(step =>
    step.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    step.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return <FiMail className="w-4 h-4" />;
      case 'task': return <FiCheckSquare className="w-4 h-4" />;
      case 'linkedin': return <FiLinkedin className="w-4 h-4" />;
      case 'call': return <FiPhone className="w-4 h-4" />;
      default: return <FiMail className="w-4 h-4" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600 bg-blue-100';
      case 'task': return 'text-green-600 bg-green-100';
      case 'linkedin': return 'text-blue-700 bg-blue-100';
      case 'call': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleAIPersonalization = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, aiPersonalizationEnabled: !step.aiPersonalizationEnabled }
        : step
    ));
  };

  const openEditModal = (step: Step) => {
    setEditingStep(step);
    if (step.prospectContent) {
      if (step.prospectContent.type === 'personalized') {
        setEditForm({
          subject: step.prospectContent.personalized.subject,
          body: `${step.prospectContent.personalized.greeting}\n\n${step.prospectContent.personalized.introduction}\n\n${step.prospectContent.personalized.companyReference}`
        });
      } else if (step.prospectContent.type === 'custom') {
        setEditForm({
          subject: step.prospectContent.custom.subject,
          body: step.prospectContent.custom.body
        });
      }
    }
    setEditModalOpen(true);
  };

  const generateWithAI = async (stepId: number) => {
    if (!aiPrompt.trim() && !isGenerating) {
      setAiPrompt('Refine the existing email for better engagement');
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const step = steps.find(s => s.id === stepId);
      if (!step || !step.prospectContent) return;

      // Mock AI generation
      const newContent = {
        personalized: {
          subject: `Re: ${prospect.company} collaboration opportunity - Enhanced approach`,
          greeting: `Dear ${prospect.name},`,
          introduction: `I hope this email finds you well. I've been following ${prospect.company}'s impressive work in the ${prospect.industry || 'industry'} space and believe there could be valuable synergies between our companies.`,
          companyReference: `Given ${prospect.company}'s focus on ${prospect.industry || 'innovation'}, I think we could help streamline your workflow.`
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'personalized' as const,
        lastUpdated: new Date().toISOString()
      };

      setAiGeneratedContent(newContent);
      setEditingStep(step);
      setAiResultModalOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    if (editingStep && aiGeneratedContent) {
      setSteps(prev => prev.map(s => 
        s.id === editingStep.id 
          ? { ...s, prospectContent: { ...s.prospectContent, ...aiGeneratedContent } }
          : s
      ));
    }
    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setRejectComment('');
  };

  const handleRejectAI = () => {
    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setRejectComment('');
  };

  const handleRejectWithComment = () => {
    console.log('Rejected with comment:', rejectComment);
    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setRejectComment('');
  };

  const saveEdit = () => {
    if (!editingStep) return;

    const baseContent = editingStep.prospectContent || {
      personalized: {
        subject: '',
        greeting: '',
        introduction: '',
        companyReference: ''
      },
      custom: {
        subject: '',
        body: ''
      },
      type: 'personalized' as const,
      lastUpdated: new Date().toISOString()
    };

    const updatedContent = { ...baseContent };
    if (editingStep.prospectContent?.type === 'personalized') {
      const bodyParts = editForm.body.split('\n\n');
      updatedContent.personalized = {
        subject: editForm.subject,
        greeting: bodyParts[0] || '',
        introduction: bodyParts[1] || '',
        companyReference: bodyParts[2] || ''
      };
      updatedContent.type = 'personalized';
    } else {
      updatedContent.custom = {
        subject: editForm.subject,
        body: editForm.body
      };
      updatedContent.type = 'custom';
    }
    updatedContent.lastUpdated = new Date().toISOString();

    setSteps(prev => prev.map(s => 
      s.id === editingStep.id 
        ? { ...s, prospectContent: updatedContent }
        : s
    ));

    setEditModalOpen(false);
    setEditingStep(null);
  };

  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Personalization
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{prospect.name}</h1>
          <p className="text-gray-600 text-sm">{prospect.title} at {prospect.company}</p>
        </div>

        {/* Prospect Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <FiMail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">{prospect.email}</span>
            </div>
            <div className="flex items-center">
              <FiHome className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">{prospect.company}</span>
            </div>
            <div className="flex items-center">
              <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">{prospect.title}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search steps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {filteredSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Step Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>
                      {getStepIcon(step.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {step.type === 'email' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            step.aiPersonalizationEnabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {step.aiPersonalizationEnabled ? 'AI Personalization ON' : 'AI Personalization OFF'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {step.prospectContent?.type === 'personalized' && 'Personalized'}
                          {step.prospectContent?.type === 'custom' && 'Custom'}
                          {step.prospectContent?.type === 'template' && 'Template'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {step.prospectContent?.type !== 'template' && step.prospectContent && (
                      <span className="text-xs text-gray-400">
                        Updated {new Date(step.prospectContent.lastUpdated).toLocaleDateString()}
                      </span>
                    )}
                    <div className={`transform transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedStep === step.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 space-y-4">
                      {/* AI Personalization Control for Email Steps */}
                      {step.type === 'email' && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleAIPersonalization(step.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                step.aiPersonalizationEnabled ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  step.aiPersonalizationEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-sm font-medium text-gray-700">AI Personalization</span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {step.aiPersonalizationEnabled ? 'AI will personalize this email' : 'Using standard template'}
                          </div>
                        </div>
                      )}

                      {/* Current Email Content */}
                      {step.type === 'email' && step.prospectContent && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Email Content</h4>
                          
                          {step.prospectContent.type === 'personalized' && step.aiPersonalizationEnabled ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="space-y-3 text-sm">
                                <div>
                                  <span className="font-medium text-green-800">Subject:</span>
                                  <p className="text-green-700 mt-1">{step.prospectContent.personalized.subject}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-green-800">Body:</span>
                                  <div className="text-green-700 mt-1 whitespace-pre-wrap">
                                    {step.prospectContent.personalized.greeting}

                                    {step.prospectContent.personalized.introduction}

                                    {step.prospectContent.personalized.companyReference}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => openEditModal(step)}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                  <FiEdit3 className="w-3 h-3 inline mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => step.prospectContent && copyContent(
                                    `${step.prospectContent.personalized.subject}\n\n${step.prospectContent.personalized.greeting}\n\n${step.prospectContent.personalized.introduction}\n\n${step.prospectContent.personalized.companyReference}`
                                  )}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                  <FiCopy className="w-3 h-3 inline mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>
                          ) : step.prospectContent.type === 'custom' ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-blue-800">Subject:</span>
                                  <p className="text-blue-700">{step.prospectContent.custom.subject}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-800">Body:</span>
                                  <div className="text-blue-700">
                                    {step.prospectContent.custom.body ? (
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: step.prospectContent.custom.body }} 
                                        className="prose prose-sm max-w-none"
                                      />
                                    ) : 'No body set'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => openEditModal(step)}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  <FiEdit3 className="w-3 h-3 inline mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => step.prospectContent && copyContent(`${step.prospectContent.custom.subject}\n\n${step.prospectContent.custom.body}`)}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                  <FiCopy className="w-3 h-3 inline mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-600 mb-2">Using standard template</p>
                              <div className="text-sm text-gray-700">
                                <p><strong>Subject:</strong> {step.template?.subject}</p>
                                <p className="mt-1"><strong>Body:</strong></p>
                                <div className="whitespace-pre-wrap text-xs">{step.template?.body}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Controls */}
                      {step.type === 'email' && step.aiPersonalizationEnabled && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-purple-900 mb-3">AI Email Generation</h4>
                          
                          <div className="space-y-3">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Enter a prompt to refine the email (optional)... or just click regenerate to improve with AI"
                              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                              rows={3}
                            />
                            
                            <button
                              onClick={() => generateWithAI(step.id)}
                              disabled={isGenerating}
                              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                                isGenerating
                                  ? 'bg-purple-300 text-purple-700 cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FiRefreshCw className="w-3 h-3 mr-2" />
                                  {aiPrompt.trim() ? 'Generate with Prompt' : 'Regenerate'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Non-Email Step Info */}
                      {step.type !== 'email' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">
                            This is a {step.type} step. Email personalization is only available for email steps.
                            {step.type === 'task' && ' Configure task details and due dates.'}
                            {step.type === 'linkedin' && ' Set up LinkedIn connection requests and messages.'}
                            {step.type === 'call' && ' Schedule and prepare for phone calls.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Edit Modal */}
      {editModalOpen && editingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Email Content - {editingStep.name}
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                  <CustomEmailBodyEditor
                    value={editForm.body}
                    onChange={(content) => setEditForm({...editForm, body: content})}
                    placeholder="Enter the complete email content..."
                    height={200}
                    enableVariables={true}
                    availableVariables={['name', 'company', 'title', 'firstName', 'lastName']}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {aiResultModalOpen && aiGeneratedContent && editingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Generated Email - {editingStep.name}
                </h3>
                <button
                  onClick={() => setAiResultModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 mb-1">Subject</h4>
                    <p className="text-purple-800">{aiGeneratedContent.personalized.subject}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-900 mb-1">Body</h4>
                    <div className="text-purple-800 whitespace-pre-wrap">
                      {aiGeneratedContent.personalized.greeting}

{aiGeneratedContent.personalized.introduction}

{aiGeneratedContent.personalized.companyReference}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (optional) - Help us improve future results
                  </label>
                  <textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="What would you like to see improved in this email?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-3">
                <button
                  onClick={handleRejectAI}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleRejectWithComment}
                  disabled={!rejectComment.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    rejectComment.trim()
                      ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  Reject with Feedback
                </button>
              </div>
              <button
                onClick={handleAcceptAI}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Accept & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectStepsPersonalizationPage;
