import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiEdit3, FiMail, FiRefreshCw, FiCopy, FiCheck, FiX, FiChevronDown } from 'react-icons/fi';
import CustomEmailBodyEditor from '../components/rich-text/CustomEmailBodyEditor';

interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
}

interface StepContent {
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

const StepPersonalizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { day } = useParams<{ day: string }>();

  // Mock prospects data
  const [prospects] = useState<Prospect[]>([
    { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', company: 'TechCorp Industries', title: 'VP of Engineering' },
    { id: 2, name: 'Michael Chen', email: 'm.chen@innovate.io', company: 'Innovate Solutions', title: 'CTO' },
    { id: 3, name: 'Emily Davis', email: 'emily.davis@financepro.com', company: 'FinancePro LLC', title: 'CFO' },
    { id: 4, name: 'Alex Thompson', email: 'alex.thompson@healthsys.org', company: 'Healthcare Systems', title: 'Director of Operations' },
  ]);

  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [aiPersonalizationEnabled, setAIPersonalizationEnabled] = useState(true);
  const [stepContent, setStepContent] = useState<StepContent>({
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
    lastUpdated: new Date().toISOString()
  });

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<StepContent | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    subject: '',
    body: ''
  });

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addProspect = (prospectId: number) => {
    if (!selectedProspects.includes(prospectId)) {
      setSelectedProspects([...selectedProspects, prospectId]);
    }
    setDropdownOpen(false);
  };

  const removeProspect = (prospectId: number) => {
    setSelectedProspects(selectedProspects.filter(id => id !== prospectId));
  };

  const getAvailableProspects = () => {
    return prospects.filter(prospect => !selectedProspects.includes(prospect.id));
  };

  const openEditModal = () => {
    if (stepContent.type === 'personalized') {
      setEditForm({
        subject: stepContent.personalized.subject,
        body: `${stepContent.personalized.greeting}\n\n${stepContent.personalized.introduction}\n\n${stepContent.personalized.companyReference}`
      });
    } else if (stepContent.type === 'custom') {
      setEditForm({
        subject: stepContent.custom.subject,
        body: stepContent.custom.body
      });
    } else if (stepContent.type === 'template') {
      setEditForm({
        subject: 'Quick question about {{company}}',
        body: 'Hi {{name}},\n\nI hope this email finds you well. I wanted to reach out regarding your role.\n\nBest regards,\nYour Name'
      });
    }
    setEditModalOpen(true);
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim() && !isGenerating) {
      setAiPrompt('Generate a personalized email for this step');
    }
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI generation
      const newContent: StepContent = {
        personalized: {
          subject: `Re: Collaboration opportunity - Personalized approach`,
          greeting: 'Dear [Prospect Name],',
          introduction: 'I hope this email finds you well. I wanted to reach out regarding potential opportunities for collaboration between our companies.',
          companyReference: 'Given your company\'s focus on innovation, I believe we could create significant value together.'
        },
        custom: {
          subject: '',
          body: ''
        },
        type: 'personalized',
        lastUpdated: new Date().toISOString()
      };

      setAiGeneratedContent(newContent);
      setAiResultModalOpen(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    if (aiGeneratedContent) {
      setStepContent(aiGeneratedContent);
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
    const updatedContent = { ...stepContent };
    if (stepContent.type === 'personalized') {
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

    setStepContent(updatedContent);
    setEditModalOpen(false);
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
            Back to Campaign
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Step {day} Personalization</h1>
              <p className="text-gray-600 text-sm">Configure email personalization for this step</p>
            </div>
            
            {/* Campaign Settings Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FiMail className="w-3 h-3 mr-1" />
                Email Step
              </div>
            </div>
          </div>
        </div>

        {/* Step Configuration Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Step Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg text-blue-600 bg-blue-100">
                  <FiMail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Step {day} - Email Outreach</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      aiPersonalizationEnabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {aiPersonalizationEnabled ? 'AI Personalization ON' : 'AI Personalization OFF'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {stepContent.type === 'personalized' && 'Personalized'}
                      {stepContent.type === 'custom' && 'Custom'}
                      {stepContent.type === 'template' && 'Template'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          <div className="p-4 space-y-4">
            {/* AI Personalization Control */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAIPersonalizationEnabled(!aiPersonalizationEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiPersonalizationEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiPersonalizationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">AI Personalization</span>
              </div>
              
              <div className="text-xs text-gray-500">
                {aiPersonalizationEnabled ? 'AI will personalize this email' : 'Using standard template'}
              </div>
            </div>

            {/* Prospect Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Select Prospects</h4>
              
              <div className="relative" ref={dropdownRef}>
                {/* Dropdown Input */}
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {/* Selected Pills */}
                  <div className="flex flex-wrap gap-2 min-h-[24px] items-center">
                    {selectedProspects.length === 0 ? (
                      <span className="text-gray-500 text-sm">Select prospects...</span>
                    ) : (
                      selectedProspects.map((prospectId) => {
                        const prospect = prospects.find(p => p.id === prospectId);
                        return prospect ? (
                          <div
                            key={prospect.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <span>{prospect.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProspect(prospect.id);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                  
                  {/* Dropdown Arrow */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {getAvailableProspects().length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          All prospects have been selected
                        </div>
                      ) : (
                        getAvailableProspects().map((prospect) => (
                          <button
                            key={prospect.id}
                            onClick={() => addProspect(prospect.id)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{prospect.name}</div>
                              <div className="text-xs text-gray-500">{prospect.company} • {prospect.title}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selection Count */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-blue-700">
                  {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} selected
                </span>
                {selectedProspects.length > 0 && (
                  <button
                    onClick={() => setSelectedProspects([])}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Current Email Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Current Email Content</h4>
              
              {stepContent.type === 'personalized' && aiPersonalizationEnabled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-green-800">Subject:</span>
                      <p className="text-green-700 mt-1">{stepContent.personalized.subject || 'No subject set'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Body:</span>
                      <div className="text-green-700 mt-1 whitespace-pre-wrap">
                        {stepContent.personalized.greeting || '[Greeting]'}
                        
                        {stepContent.personalized.introduction || '[Introduction]'}
                        
                        {stepContent.personalized.companyReference || '[Company Reference]'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={openEditModal}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <FiEdit3 className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => copyContent(
                        `${stepContent.personalized.subject}\n\n${stepContent.personalized.greeting}\n\n${stepContent.personalized.introduction}\n\n${stepContent.personalized.companyReference}`
                      )}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <FiCopy className="w-3 h-3 inline mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
              ) : stepContent.type === 'custom' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Subject:</span>
                      <p className="text-blue-700">{stepContent.custom.subject || 'No subject set'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">Body:</span>
                      <div className="text-blue-700">
                        {stepContent.custom.body ? (
                          <div 
                            dangerouslySetInnerHTML={{ __html: stepContent.custom.body }} 
                            className="prose prose-sm max-w-none"
                          />
                        ) : 'No body set'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={openEditModal}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <FiEdit3 className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => copyContent(`${stepContent.custom.subject}\n\n${stepContent.custom.body}`)}
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
                    <p><strong>Subject:</strong> Quick question about {'{{company}}'}</p>
                    <p className="mt-1"><strong>Body:</strong></p>
                    <div className="whitespace-pre-wrap text-xs">Hi {'{{name}}'},\n\nI hope this email finds you well. I wanted to reach out regarding your role.\n\nBest regards,\nYour Name</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={openEditModal}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <FiEdit3 className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => copyContent('Quick question about {{company}}\n\nHi {{name}},\n\nI hope this email finds you well. I wanted to reach out regarding your role.\n\nBest regards,\nYour Name')}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <FiCopy className="w-3 h-3 inline mr-1" />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Controls */}
            {aiPersonalizationEnabled && (
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
                    onClick={generateWithAI}
                    disabled={isGenerating || selectedProspects.length === 0}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                      isGenerating || selectedProspects.length === 0
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
                        {aiPrompt.trim() ? 'Generate with Prompt' : 'Generate Personalization'}
                      </>
                    )}
                  </button>
                  {selectedProspects.length === 0 && (
                    <p className="text-xs text-purple-600">Please select at least one prospect to generate personalization</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save personalization logic here
                  navigate(-1);
                }}
                disabled={selectedProspects.length === 0}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  selectedProspects.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <FiCheck className="w-4 h-4 mr-2" />
                Apply to {selectedProspects.length} Prospect{selectedProspects.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Email Content - Step {day}
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
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
      {aiResultModalOpen && aiGeneratedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Generated Email - Step {day}
                </h3>
                <button
                  onClick={() => setAiResultModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
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

export default StepPersonalizationPage;
