import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiX, FiCheck, FiEdit3, FiMail, FiToggleLeft, FiToggleRight, FiRefreshCw } from 'react-icons/fi';

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
}

interface ProspectStepContent {
  prospectId: number;
  stepId: number;
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
}

const StepProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { stepId } = useParams<{ stepId: string }>();

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'personalized' | 'ai' | 'standard'>('all');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    subject: '',
    body: ''
  });

  // Mock step data
  const [step] = useState<Step>({
    id: parseInt(stepId || '1'),
    name: 'Initial Email',
    type: 'email',
    aiPersonalizationEnabled: true,
    template: {
      subject: 'Introduction to {{company}}',
      body: 'Hi {{name}},\\n\\nI hope this email finds you well. I wanted to reach out regarding...\\n\\nBest regards,\\nYour Name'
    }
  });

  // Mock prospects data
  const [prospects] = useState<Prospect[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      company: 'TechCorp Industries',
      title: 'VP of Engineering',
      industry: 'Technology'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'm.chen@innovate.io',
      company: 'Innovate Solutions',
      title: 'CTO',
      industry: 'Software'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@startup.com',
      company: 'StartupXYZ',
      title: 'Product Manager',
      industry: 'Technology'
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'd.kim@enterprise.com',
      company: 'Enterprise Corp',
      title: 'Director of Operations',
      industry: 'Manufacturing'
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      email: 'lisa.t@consulting.com',
      company: 'Consulting Firm',
      title: 'Senior Consultant',
      industry: 'Consulting'
    },
    {
      id: 6,
      name: 'James Wilson',
      email: 'j.wilson@finance.com',
      company: 'FinanceHub',
      title: 'CFO',
      industry: 'Finance'
    }
  ]);

  // Mock prospect step content
  const [prospectContents, setProspectContents] = useState<ProspectStepContent[]>([
    {
      prospectId: 1,
      stepId: 1,
      personalized: {
        subject: 'Re: TechCorp Industries collaboration opportunity',
        greeting: 'Dear Sarah,',
        introduction: "I hope this email finds you well. I've been following TechCorp's impressive work in enterprise solutions and believe there could be valuable synergies between our companies.",
        companyReference: "Given TechCorp's focus on enterprise solutions, I think we could help streamline your development workflow."
      },
      custom: {
        subject: 'Custom: TechCorp collaboration opportunity',
        body: 'Hi Sarah, I wanted to reach out personally about...'
      },
      type: 'personalized',
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      prospectId: 2,
      stepId: 1,
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
    },
    {
      prospectId: 3,
      stepId: 1,
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
  ]);

  // Filter prospects based on search
  const filteredProspects = useMemo(() => {
    let filtered = prospects.filter(prospect =>
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus !== 'all') {
      filtered = filtered.filter(prospect => {
        const content = prospectContents.find(c => c.prospectId === prospect.id && c.stepId === step.id);
        if (filterStatus === 'personalized') {
          return content?.type === 'personalized';
        } else if (filterStatus === 'ai') {
          return content?.type === 'personalized' && step.aiPersonalizationEnabled;
        } else if (filterStatus === 'standard') {
          return content?.type === 'template' || !content;
        }
        return true;
      });
    }

    return filtered;
  }, [prospects, searchTerm, filterStatus, prospectContents, step.id, step.aiPersonalizationEnabled]);

  // Get stats
  const stats = {
    total: prospects.length,
    personalized: prospects.filter(p => {
      const content = prospectContents.find(c => c.prospectId === p.id && c.stepId === step.id);
      return content?.type === 'personalized';
    }).length,
    aiEnabled: prospects.filter(p => {
      const content = prospectContents.find(c => c.prospectId === p.id && c.stepId === step.id);
      return content?.type === 'personalized' && step.aiPersonalizationEnabled;
    }).length,
    standard: prospects.filter(p => {
      const content = prospectContents.find(c => c.prospectId === p.id && c.stepId === step.id);
      return content?.type === 'template' || !content;
    }).length
  };

  const getProspectContent = (prospectId: number) => {
    return prospectContents.find(c => c.prospectId === prospectId && c.stepId === step.id);
  };

  const toggleAIPersonalization = (prospectId: number) => {
    const content = getProspectContent(prospectId);
    if (!content) return;

    const newType = content.type === 'personalized' ? 'template' : 'personalized';
    
    setProspectContents(prev => prev.map(c => 
      (c.prospectId === prospectId && c.stepId === step.id)
        ? { ...c, type: newType, lastUpdated: new Date().toISOString() }
        : c
    ));
  };

  const openEditModal = (prospect: Prospect) => {
    setEditingProspect(prospect);
    const content = getProspectContent(prospect.id);
    if (content) {
      if (content.type === 'personalized') {
        setEditForm({
          subject: content.personalized.subject,
          body: `${content.personalized.greeting}\n\n${content.personalized.introduction}\n\n${content.personalized.companyReference}`
        });
      } else if (content.type === 'custom') {
        setEditForm({
          subject: content.custom.subject,
          body: content.custom.body
        });
      }
    }
    setEditModalOpen(true);
  };

  const generateWithAI = async (prospectId: number) => {
    if (!aiPrompt.trim() && !isGenerating) {
      setAiPrompt('Refine the existing email for better engagement');
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const prospect = prospects.find(p => p.id === prospectId);
      if (!prospect) return;

      // Mock AI generation
      const newContent = {
        personalized: {
          subject: `Re: ${prospect.company} collaboration opportunity - Enhanced approach`,
          greeting: `Dear ${prospect.name},`,
          introduction: `I hope this email finds you well. I've been following ${prospect.company}'s impressive work in the ${prospect.industry || 'industry'} space and believe there could be valuable synergies between our companies. Our AI-driven solutions have helped similar organizations achieve significant improvements in operational efficiency.`,
          companyReference: `Given ${prospect.company}'s focus on ${prospect.industry || 'innovation'}, I think we could help streamline your workflow and enhance your competitive advantage in the market.`
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'personalized' as const,
        lastUpdated: new Date().toISOString()
      };

      setAiGeneratedContent(newContent);
      setEditingProspect(prospect);
      setAiResultModalOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    if (!aiGeneratedContent || !editingProspect) return;

    const updatedContent = {
      ...aiGeneratedContent,
      prospectId: editingProspect.id,
      stepId: step.id
    };

    setProspectContents(prev => {
      const existing = prev.find(c => c.prospectId === editingProspect.id && c.stepId === step.id);
      if (existing) {
        return prev.map(c => 
          (c.prospectId === editingProspect.id && c.stepId === step.id) ? updatedContent : c
        );
      } else {
        return [...prev, updatedContent];
      }
    });

    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setEditingProspect(null);
    setAiPrompt('');
  };

  const handleRejectAI = () => {
    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setAiPrompt('');
  };

  const handleRejectWithComment = () => {
    console.log('Rejected with comment:', rejectComment);
    setAiResultModalOpen(false);
    setAiGeneratedContent(null);
    setRejectComment('');
    setAiPrompt('');
  };

  const saveEdit = () => {
    if (!editingProspect) return;

    const existingContent = getProspectContent(editingProspect.id);
    const baseContent = existingContent || {
      prospectId: editingProspect.id,
      stepId: step.id,
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
      type: 'template' as const,
      lastUpdated: new Date().toISOString()
    };

    const updatedContent = { ...baseContent };
    if (existingContent?.type === 'personalized') {
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

    setProspectContents(prev => {
      const existing = prev.find(c => c.prospectId === editingProspect.id && c.stepId === step.id);
      if (existing) {
        return prev.map(c => 
          (c.prospectId === editingProspect.id && c.stepId === step.id) ? updatedContent : c
        );
      } else {
        return [...prev, updatedContent];
      }
    });

    setEditModalOpen(false);
    setEditingProspect(null);
  };

  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Steps
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{step.name} - Prospect Configuration</h1>
              <p className="text-gray-600 text-sm">
                Configure email personalization for this step across all prospects
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FiMail className="w-3 h-3 mr-1" />
                {step.type}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                step.aiPersonalizationEnabled 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {step.aiPersonalizationEnabled ? (
                  <>
                    <FiToggleRight className="w-3 h-3 mr-1" />
                    AI Enabled
                  </>
                ) : (
                  <>
                    <FiToggleLeft className="w-3 h-3 mr-1" />
                    AI Disabled
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Configuration Progress</h2>
            <span className="text-xs text-gray-500">{stats.total} prospects</span>
          </div>
          
          {/* Progress stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{stats.personalized}</div>
              <div className="text-xs text-gray-600">Personalized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-purple-600">{stats.aiEnabled}</div>
              <div className="text-xs text-gray-600">AI Enhanced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-600">{stats.standard}</div>
              <div className="text-xs text-gray-600">Template Only</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search prospects..."
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

            {/* Quick Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              
              <button
                onClick={() => setFilterStatus('personalized')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'personalized'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personalized ({stats.personalized})
              </button>
              
              <button
                onClick={() => setFilterStatus('ai')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ai'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                AI Enhanced ({stats.aiEnabled})
              </button>
              
              <button
                onClick={() => setFilterStatus('standard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'standard'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Template Only ({stats.standard})
              </button>
            </div>
          </div>
        </div>

        {/* Prospects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProspects.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FiSearch className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No prospects found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProspects.map((prospect) => {
              const content = getProspectContent(prospect.id);
              const isPersonalized = content?.type === 'personalized';
              
              return (
                <motion.div
                  key={prospect.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
                          {isPersonalized && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              <FiCheck className="w-3 h-3 mr-0.5" />
                              Personalized
                            </span>
                          )}
                          {isPersonalized && step.aiPersonalizationEnabled && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{prospect.title}</p>
                        <p className="text-sm text-gray-500">{prospect.company}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <FiMail className="w-3 h-3 mr-1" />
                      {prospect.email}
                    </div>

                    {/* Current Email Content */}
                    {content && content.type !== 'template' && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Email Content</h4>
                        
                        {content.type === 'personalized' ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-green-800">Subject:</span>
                                <p className="text-green-700 mt-1">{content.personalized.subject}</p>
                              </div>
                              <div>
                                <span className="font-medium text-green-800">Body:</span>
                                <div className="text-green-700 mt-1 whitespace-pre-wrap text-xs">
                                  {content.personalized.greeting}

{content.personalized.introduction}

{content.personalized.companyReference}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-blue-800">Subject:</span>
                                <p className="text-blue-700">{content.custom.subject}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-800">Body:</span>
                                <p className="text-blue-700 whitespace-pre-wrap text-xs">{content.custom.body}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Controls */}
                    <div className="space-y-3">
                      {/* AI Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleAIPersonalization(prospect.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isPersonalized ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isPersonalized ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            AI Personalization
                          </span>
                        </div>
                        
                        {isPersonalized && (
                          <button
                            onClick={() => openEditModal(prospect)}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            <FiEdit3 className="w-3 h-3 inline mr-1" />
                            Edit
                          </button>
                        )}
                      </div>

                      {/* AI Generation */}
                      {isPersonalized && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-purple-900 mb-2">AI Generation</h4>
                          
                          <div className="space-y-2">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Enter a prompt to refine the email (optional)..."
                              className="w-full px-2 py-1.5 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs resize-none"
                              rows={2}
                            />
                            
                            <button
                              onClick={() => generateWithAI(prospect.id)}
                              disabled={isGenerating}
                              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full justify-center ${
                                isGenerating
                                  ? 'bg-purple-300 text-purple-700 cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              {isGenerating ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FiRefreshCw className="w-3 h-3 mr-1" />
                                  Generate
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Edit Modal */}
        {editModalOpen && editingProspect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Email Content - {editingProspect.name}
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
                    <textarea
                      value={editForm.body}
                      onChange={(e) => setEditForm({...editForm, body: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={8}
                      placeholder="Enter the complete email content..."
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
        {aiResultModalOpen && aiGeneratedContent && editingProspect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI Generated Email - {editingProspect.name}
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
      </motion.div>
    </div>
  );
};

export default StepProspectsPage;
