import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { useToast } from '../hooks/useToast';
import { useModalWithAutoId } from '../providers/ModalProvider';
import { EmailTemplate } from '../types';
import Button from '../components/Button';
import ModalWrapper from '../components/ModalWrapper';

const TemplatesPage: React.FC = () => {
  const { generateTemplate, analyzeEmail, loading } = useAI();
  const { showToast } = useToast();
  const { openModal, closeModal } = useModalWithAutoId();

  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Initial Outreach',
      subject: 'Following up on {{company}}',
      body: `Hi {{firstName}},

I noticed {{company}} is doing amazing work in {{industry}}. 

{{research}}

I thought you might be interested in learning how we've helped similar companies achieve their goals.

Would you be open to a brief conversation next week?

Best regards,
{{senderName}}`,
      variables: ['firstName', 'company', 'industry', 'research', 'senderName']
    },
    {
      id: '2',
      name: 'Follow Up',
      subject: 'Re: {{previousSubject}}',
      body: `Hi {{firstName}},

Just wanted to follow up on my previous email about {{previousTopic}}.

{{personalizedFollowUp}}

Would you have 15 minutes to discuss this further?

Best regards,
{{senderName}}`,
      variables: ['firstName', 'previousSubject', 'previousTopic', 'personalizedFollowUp', 'senderName']
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
  });

  // Create Template Modal Component
  const CreateTemplateModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const handleCreateTemplate = () => {
      if (!templateForm.name || !templateForm.subject || !templateForm.body) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      const variables = extractVariables(templateForm.subject + ' ' + templateForm.body);
      
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        ...templateForm,
        variables,
      };

      if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...newTemplate, id: editingTemplate.id } : t));
        showToast('Template updated successfully!', 'success');
      } else {
        setTemplates(prev => [...prev, newTemplate]);
        showToast('Template created successfully!', 'success');
      }

      onClose();
      setEditingTemplate(null);
      setTemplateForm({ name: '', subject: '', body: '' });
    };

    return (
      <ModalWrapper
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingTemplate(null);
          setTemplateForm({ name: '', subject: '', body: '' });
        }}
        maxWidth="max-w-2xl"
      >
        <div className="bg-surface rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Initial Outreach"
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Following up on {{company}}"
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Body
              </label>
              <textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your email template here. Use {{variable}} for personalization."
                rows={10}
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Detected Variables */}
            {extractVariables(templateForm.subject + ' ' + templateForm.body).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Detected Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractVariables(templateForm.subject + ' ' + templateForm.body).map((variable, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleCreateTemplate}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                setEditingTemplate(null);
                setTemplateForm({ name: '', subject: '', body: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalWrapper>
    );
  };

  // AI Generate Modal Component
  const AIGenerateModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const handleAIGenerate = async () => {
      if (!aiPrompt.trim()) {
        showToast('Please enter a prompt for AI generation', 'error');
        return;
      }

      try {
        const generatedTemplate = await generateTemplate(aiPrompt);
        setTemplateForm({
          name: 'AI Generated Template',
          subject: 'AI Personalized Subject',
          body: generatedTemplate,
        });
        onClose();
        openModal(CreateTemplateModal);
        setAiPrompt('');
        showToast('Template generated successfully!', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to generate template', 'error');
      }
    };

    return (
      <ModalWrapper
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setAiPrompt('');
        }}
        maxWidth="max-w-md"
      >
        <div className="bg-surface rounded-xl p-6 max-w-md w-full border border-border">
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Generate Template with AI
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Describe your template
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Create a friendly outreach email for SaaS companies that mentions their recent funding round and asks for a demo meeting."
              rows={4}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAIGenerate} loading={loading}>
              Generate
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                setAiPrompt('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalWrapper>
    );
  };

  // Handler functions
  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    openModal(CreateTemplateModal);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast('Template deleted successfully!', 'success');
    }
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
    };
    setTemplates(prev => [...prev, newTemplate]);
    showToast('Template duplicated successfully!', 'success');
  };

  // Handler functions
  const openCreateModal = () => {
    openModal(CreateTemplateModal);
  };

  const openAIGenerateModal = () => {
    openModal(AIGenerateModal);
  };

  const handleAnalyzeTemplate = async (template: EmailTemplate) => {
    try {
      const analysis = await analyzeEmail(template.subject, template.body);
      
      let message = `Template Analysis:\n\n`;
      message += `Overall Score: ${analysis.analysis.overallScore}/10\n`;
      message += `Readability Score: ${analysis.analysis.readabilityScore}/10\n`;
      message += `Personalization Score: ${analysis.analysis.personalizationScore}/10\n\n`;

      if (analysis.analysis.strengths.length > 0) {
        message += `Strengths:\n${analysis.analysis.strengths.map((s: any) => `• ${s}`).join('\n')}\n\n`;
      }

      if (analysis.analysis.suggestions.length > 0) {
        message += `Suggestions:\n${analysis.analysis.suggestions.map((s: any) => `• ${s}`).join('\n')}`;
      }

      showToast(message, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Analysis failed', 'error');
    }
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  return (
    <div className="animate-fade-in">

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={openCreateModal}
          icon={<i className="fas fa-plus" />}
        >
          New Template
        </Button>
        <Button
          variant="secondary"
          onClick={openAIGenerateModal}
          icon={<i className="fas fa-robot" />}
        >
          Generate with AI
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-surface rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
            {/* Template Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">{template.name}</h3>
                <p className="text-sm text-text-secondary truncate">{template.subject}</p>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn-icon"
                  onClick={() => handleEditTemplate(template)}
                  title="Edit"
                >
                  <i className="fas fa-edit" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDuplicateTemplate(template)}
                  title="Duplicate"
                >
                  <i className="fas fa-copy" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDeleteTemplate(template.id)}
                  title="Delete"
                >
                  <i className="fas fa-trash text-error" />
                </button>
              </div>
            </div>

            {/* Template Preview */}
            <div className="mb-4">
              <div className="bg-bg-secondary rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-sm text-text-secondary line-clamp-4">
                  {template.body.substring(0, 150)}...
                </p>
              </div>
            </div>

            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, index) => (
                    <span
                      key={index}
                      className="inline-flex px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleAnalyzeTemplate(template)}
                loading={loading}
                icon={<i className="fas fa-chart-line" />}
              >
                Analyze
              </Button>
              <Button
                size="small"
                icon={<i className="fas fa-paper-plane" />}
              >
                Use Template
              </Button>
            </div>
          </div>
        ))}

        {/* Add New Template Card */}
        <div
          className="bg-surface rounded-xl p-6 border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer group"
          onClick={openCreateModal}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <i className="fas fa-plus text-primary text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Create New Template</h3>
            <p className="text-text-secondary">Build a template with AI personalization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
