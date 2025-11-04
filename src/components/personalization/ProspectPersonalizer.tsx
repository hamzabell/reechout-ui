import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSave, FiMail, FiUser, FiHome, FiBriefcase, FiInfo, FiSettings, FiLinkedin, FiPhone, FiCheckSquare, FiZap } from 'react-icons/fi';
import AIEmailGenerator from './AIEmailGenerator';

interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
  currentStatus: 'personalized' | 'custom' | 'standard';
  personalizedContent?: {
    subject: string;
    greeting: string;
    introduction: string;
    companyReference: string;
  };
  customContent?: {
    subject: string;
    body: string;
  };
}

interface Step {
  id: number;
  name: string;
  type: 'email' | 'task' | 'linkedin' | 'call';
  personalizationEnabled: boolean; // Only relevant for email steps
  template?: {
    subject: string;
    body: string;
  };
}

const ProspectPersonalizer: React.FC = () => {
  const navigate = useNavigate();
  const { prospectId, stepNumber } = useParams<{ prospectId: string; stepNumber: string }>();

  // Mock step data - in real app, this would come from API
  // Personalization is only available for email steps
  const [step] = useState<Step>({
    id: parseInt(stepNumber || '2'),
    name: 'Initial Outreach Email',
    type: 'email', // Only email steps can have personalization
    personalizationEnabled: true, // This specific step is email type and has personalization enabled
    template: {
      subject: 'Quick question about your work at {{company}}',
      body: 'Hi {{name}},\n\nI hope this email finds you well. I wanted to reach out regarding your role as {{title}} at {{company}}.\n\nBest regards,\nYour Name'
    }
  });

  // Mock prospect data - in real app, this would come from API
  const [prospect] = useState<Prospect>({
    id: parseInt(prospectId || '1'),
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    company: 'TechCorp Industries',
    title: 'VP of Engineering',
    currentStatus: 'standard', // Current status for this specific step
    personalizedContent: undefined,
    customContent: undefined
  });

  const [formData, setFormData] = useState({
    // Personalization fields (only available for email steps with personalization enabled)
    subject: '',
    greeting: '',
    introduction: '',
    companyReference: '',
    
    // Custom email fields (always available for email steps)
    customSubject: '',
    customBody: '',
    
    // Toggle between personalization and custom email
    useCustomEmail: false,
    
    // Whether to use standard template
    useStandardTemplate: false
  });

  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data based on step configuration and prospect's current status
  useEffect(() => {
    if (prospect.currentStatus === 'personalized' && prospect.personalizedContent && step.type === 'email') {
      // Load existing personalization (only for email steps)
      setFormData({
        subject: prospect.personalizedContent.subject,
        greeting: prospect.personalizedContent.greeting,
        introduction: prospect.personalizedContent.introduction,
        companyReference: prospect.personalizedContent.companyReference,
        customSubject: '',
        customBody: '',
        useCustomEmail: false,
        useStandardTemplate: false
      });
    } else if (prospect.currentStatus === 'custom' && prospect.customContent && step.type === 'email') {
      // Load existing custom email (only for email steps)
      setFormData({
        subject: '',
        greeting: '',
        introduction: '',
        companyReference: '',
        customSubject: prospect.customContent.subject,
        customBody: prospect.customContent.body,
        useCustomEmail: true,
        useStandardTemplate: false
      });
    } else {
      // Default state - use standard template (only for email steps)
      setFormData({
        subject: step.type === 'email' && step.personalizationEnabled ? step.template?.subject.replace('{{company}}', prospect.company) || '' : '',
        greeting: step.type === 'email' && step.personalizationEnabled ? `Hi ${prospect.name},` : '',
        introduction: '',
        companyReference: '',
        customSubject: '',
        customBody: '',
        useCustomEmail: step.type === 'email' && !step.personalizationEnabled,
        useStandardTemplate: step.type === 'email'
      });
    }
  }, [step, prospect]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAIGenerate = (generatedContent: { subject: string; body: string }) => {
    // Populate the form with AI-generated content
    if (step.personalizationEnabled && !formData.useCustomEmail) {
      // Use for personalization
      const lines = generatedContent.body.split('\n');
      const greeting = lines[0] || '';
      const introduction = lines.slice(1, -3).join('\n').trim();
      const companyReference = lines.slice(-3).join('\n').trim();

      setFormData(prev => ({
        ...prev,
        subject: generatedContent.subject,
        greeting,
        introduction,
        companyReference,
        useStandardTemplate: false
      }));
    } else {
      // Use for custom email
      setFormData(prev => ({
        ...prev,
        customSubject: generatedContent.subject,
        customBody: generatedContent.body,
        useCustomEmail: true,
        useStandardTemplate: false
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call to save the configuration
    setTimeout(() => {
      setIsSaving(false);
      navigate('/dashboard/campaigns/2/personalize/2');
    }, 1000);
  };

  const handleBack = () => {
    navigate('/dashboard/campaigns/2/personalize/2');
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <FiMail className="w-5 h-5" />;
      case 'task':
        return <FiCheckSquare className="w-5 h-5" />;
      case 'linkedin':
        return <FiLinkedin className="w-5 h-5" />;
      case 'call':
        return <FiPhone className="w-5 h-5" />;
      default:
        return <FiMail className="w-5 h-5" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-600 bg-blue-100';
      case 'task':
        return 'text-green-600 bg-green-100';
      case 'linkedin':
        return 'text-blue-700 bg-blue-100';
      case 'call':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Non-email steps should show appropriate interface
  if (step.type !== 'email') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {step.name}
            </h1>
            <p className="text-gray-600 text-sm">
              Configure {step.type} action for {prospect.name}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className={`w-12 h-12 ${getStepColor(step.type)} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {getStepIcon(step.type)}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step
            </h3>
            <p className="text-gray-600 mb-6">
              This is a {step.type} step, which doesn't support email personalization.
              {step.type === 'task' && ` Tasks are action items that need to be completed for ${prospect.name}.`}
              {step.type === 'linkedin' && ` LinkedIn actions involve connecting or messaging ${prospect.name} on LinkedIn.`}
              {step.type === 'call' && ` This step involves scheduling or conducting a phone call with ${prospect.name}.`}
            </p>

            {/* Step-specific configuration */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h4 className="font-medium text-gray-900 mb-3">Step Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prospect:</span>
                  <span className="font-medium">{prospect.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{prospect.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{prospect.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{prospect.email}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              {step.type === 'task' && (
                <button
                  onClick={() => {
                    // TODO: Configure task for this prospect
                    console.log('Configure task for prospect:', prospect.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Configure Task
                </button>
              )}
              {step.type === 'linkedin' && (
                <button
                  onClick={() => {
                    // TODO: Configure LinkedIn action for this prospect
                    console.log('Configure LinkedIn action for prospect:', prospect.id);
                  }}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Configure LinkedIn Action
                </button>
              )}
              {step.type === 'call' && (
                <button
                  onClick={() => {
                    // TODO: Configure call for this prospect
                    console.log('Configure call for prospect:', prospect.id);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Configure Call
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Email Customization
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Customize Email for {prospect.name}
              </h1>
              <p className="text-gray-600 text-sm">
                Step: {step.name} ({step.type})
              </p>
            </div>
            
            {/* Step Configuration Badge */}
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStepColor(step.type)}`}>
                {getStepIcon(step.type)}
                <span className="ml-1">{step.type.charAt(0).toUpperCase() + step.type.slice(1)}</span>
              </div>
              {step.type === 'email' && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  step.personalizationEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <FiSettings className="w-3 h-3 mr-1" />
                  {step.personalizationEnabled ? 'Personalization ON' : 'Personalization OFF'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step Configuration Info */}
        <div className={`rounded-xl border p-4 mb-6 ${
          step.personalizationEnabled 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <FiInfo className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
              step.personalizationEnabled ? 'text-green-600' : 'text-blue-600'
            }`} />
            <div>
              <h3 className={`text-sm font-medium mb-1 ${
                step.personalizationEnabled ? 'text-green-900' : 'text-blue-900'
              }`}>
                {step.personalizationEnabled ? 'Personalization Enabled for This Email Step' : 'Standard Template for This Email Step'}
              </h3>
              <p className={`text-sm ${
                step.personalizationEnabled ? 'text-green-700' : 'text-blue-700'
              }`}>
                {step.personalizationEnabled 
                  ? 'This step supports personalization using variables. You can also create completely custom emails or use AI generation.'
                  : 'This step uses standard templates. You can create custom emails or use AI generation for specific prospects.'
                }
              </p>
              <p className={`text-xs mt-1 ${
                step.personalizationEnabled ? 'text-green-600' : 'text-blue-600'
              }`}>
                <strong>Important:</strong> Email personalization is only available for email-type steps.
              </p>
            </div>
          </div>
        </div>

        {/* Prospect Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Prospect Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center text-sm">
              <FiUser className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium text-gray-900">{prospect.name}</span>
            </div>
            <div className="flex items-center text-sm">
              <FiMail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{prospect.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <FiBriefcase className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{prospect.title}</span>
            </div>
            <div className="flex items-center text-sm">
              <FiHome className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-600">{prospect.company}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
            <button
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <FiZap className="w-4 h-4 mr-1.5" />
              AI Generate
            </button>
          </div>
          
          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Email Type for This Prospect:
            </label>
            <div className="space-y-2">
              {step.personalizationEnabled && (
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="emailType"
                    checked={!formData.useCustomEmail && !formData.useStandardTemplate}
                    onChange={() => handleInputChange('useCustomEmail', false)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Use Personalization</span>
                    <p className="text-sm text-gray-500">Personalize using variables like {'{name}'}, {'{company}'}, {'{title}'}</p>
                  </div>
                </label>
              )}
              
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="emailType"
                  checked={formData.useCustomEmail}
                  onChange={() => handleInputChange('useCustomEmail', true)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900">Create Custom Email</span>
                  <p className="text-sm text-gray-500">Write a completely custom email for this prospect</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="emailType"
                  checked={formData.useStandardTemplate}
                  onChange={() => handleInputChange('useStandardTemplate', true)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900">Use Standard Template</span>
                  <p className="text-sm text-gray-500">Use the default template for this step</p>
                </div>
              </label>
            </div>
          </div>

          {/* Personalization Form */}
          {step.personalizationEnabled && !formData.useCustomEmail && !formData.useStandardTemplate && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Personalization Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="e.g., {'{name}'}, quick question about {'{company}'}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Greeting
                </label>
                <input
                  type="text"
                  value={formData.greeting}
                  onChange={(e) => handleInputChange('greeting', e.target.value)}
                  placeholder="e.g., Hi {'{name}'},"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personalized Introduction
                </label>
                <textarea
                  value={formData.introduction}
                  onChange={(e) => handleInputChange('introduction', e.target.value)}
                  placeholder="Add personalized opening... (use {'{name}'}, {'{company}'}, {'{title}'} as variables)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Reference
                </label>
                <textarea
                  value={formData.companyReference}
                  onChange={(e) => handleInputChange('companyReference', e.target.value)}
                  placeholder="Mention something specific about their company..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Custom Email Form */}
          {formData.useCustomEmail && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Custom Email Content</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.customSubject}
                  onChange={(e) => handleInputChange('customSubject', e.target.value)}
                  placeholder="Enter custom subject line..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body
                </label>
                <textarea
                  value={formData.customBody}
                  onChange={(e) => handleInputChange('customBody', e.target.value)}
                  placeholder="Write your custom email content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Standard Template Preview */}
          {formData.useStandardTemplate && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900">Standard Template Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm space-y-2">
                  <p><strong>Subject:</strong> {step.template?.subject || 'No subject'}</p>
                  <div className="whitespace-pre-wrap">{step.template?.body || 'No body'}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Variables will be automatically replaced: {'{name}'} → {prospect.name}, {'{title}'} → {prospect.title}, {'{company}'} → {prospect.company}
              </p>
            </div>
          )}

          {/* Preview Section */}
          {!formData.useStandardTemplate && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Email Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm space-y-2">
                  <p><strong>Subject:</strong> {
                    formData.useCustomEmail 
                      ? (formData.customSubject || 'No subject')
                      : (formData.subject || 'No subject')
                  }</p>
                  <p>{
                    formData.useCustomEmail 
                      ? (formData.customBody || 'Email body will appear here...')
                      : `${formData.greeting || 'Greeting'}\n\n${formData.introduction || 'Personalized introduction will appear here...'}\n\n${formData.companyReference || ''}`
                  }</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isSaving
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Generator Modal */}
        {showAIGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full">
              <AIEmailGenerator
                prospect={prospect}
                onGenerate={handleAIGenerate}
                onClose={() => setShowAIGenerator(false)}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProspectPersonalizer;
