import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { useToast } from '../hooks/useToast';
import { useModalWithAutoId } from '../providers/ModalProvider';
import { useNeon } from '../providers/NeonProvider';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useDuplicateTemplate } from '../hooks/useTemplates';
import { EmailTemplate } from '../types';
import Button from '../components/Button';
import ModalWrapper from '../components/ModalWrapper';
import ConfirmModal from '../components/ConfirmModal';
import CustomEmailBodyEditor from '../components/rich-text/CustomEmailBodyEditor';

const TemplatesPage: React.FC = () => {
  const { generateTemplate, analyzeEmail, loading } = useAI();
  const { showToast } = useToast();
  const { openModal } = useModalWithAutoId();
  const { authState } = useNeon();
  
  // Fetch templates using SWR
  const { templates, isLoading: templatesLoading, error: templatesError, mutate: mutateTemplates } = useTemplates(authState.user?.id);
  
  // Mutation hooks
  const { trigger: createTemplate, isMutating: isCreating } = useCreateTemplate();
  const { trigger: updateTemplate, isMutating: isUpdating } = useUpdateTemplate();
  const { trigger: deleteTemplate } = useDeleteTemplate();
  const { trigger: duplicateTemplate } = useDuplicateTemplate();

  const [aiPrompt, setAiPrompt] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Create Template Modal Component
  const CreateTemplateModal: React.FC<{ isOpen: boolean; onClose: () => void; template?: EmailTemplate; initialData?: { name: string; subject: string; body: string } }> = ({ isOpen, onClose, template, initialData }) => {
    const [localForm, setLocalForm] = useState({
      name: template?.name || initialData?.name || '',
      subject: template?.subject || initialData?.subject || '',
      body: template?.body || initialData?.body || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateTemplate = async () => {
      if (!localForm.name || !localForm.subject || !localForm.body) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (!authState.user?.id) {
        showToast('User not authenticated', 'error');
        return;
      }

      const variables = extractVariables(localForm.subject + ' ' + localForm.body);

      setIsSubmitting(true);
      try {
        if (template) {
          // Update existing template - optimistic update
          const updatedTemplate = {
            ...template,
            name: localForm.name,
            subject: localForm.subject,
            body: localForm.body,
            variables,
            updatedAt: new Date().toISOString()
          };
          
          // Optimistically update the UI
          mutateTemplates(
            (current: any) => ({
              ...current,
              templates: current.templates.map((t: any) => 
                t.id === template.id ? updatedTemplate : t
              )
            }),
            false
          );
          
          // Close modal immediately after optimistic update
          onClose();
          
          await updateTemplate({
            templateId: template.id,
            name: localForm.name,
            subject: localForm.subject,
            body: localForm.body,
            variables,
            userId: authState.user.id
          });
          
          // Silently revalidate to get the real server data
          await mutateTemplates();
          
          showToast('Template updated successfully!', 'success');
        } else {
          // Create new template - optimistic update
          const newTemplate = {
            id: `temp-${Date.now()}`,
            name: localForm.name,
            subject: localForm.subject,
            body: localForm.body,
            variables,
            createdBy: authState.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            creator: {
              id: authState.user.id,
              name: authState.user.name,
              email: authState.user.email
            },
            _count: { stepEmailActions: 0 }
          };
          
          // Optimistically add to UI
          mutateTemplates(
            (current: any) => ({
              ...current,
              templates: [newTemplate, ...(current?.templates || [])]
            }),
            false
          );
          
          // Close modal immediately after optimistic update
          onClose();
          
          await createTemplate({
            name: localForm.name,
            subject: localForm.subject,
            body: localForm.body,
            variables,
            userId: authState.user.id
          });
          
          // Silently revalidate to replace temp ID with real ID from server
          await mutateTemplates();
          
          showToast('Template created successfully!', 'success');
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to save template', 'error');
        // Revalidate on error to restore correct state
        mutateTemplates();
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-2xl"
      >
        <div className="bg-surface rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={localForm.name}
                onChange={(e) => setLocalForm(prev => ({ ...prev, name: e.target.value }))}
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
                value={localForm.subject}
                onChange={(e) => setLocalForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Following up on {{company}}"
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Body
              </label>
              <CustomEmailBodyEditor
                value={localForm.body}
                onChange={(value) => setLocalForm(prev => ({ ...prev, body: value }))}
                placeholder="Write your email template here. Use {{variable}} for personalization."
                height={250}
                enableVariables={true}
                availableVariables={extractVariables(localForm.subject + ' ' + localForm.body)}
              />
            </div>

            {/* Detected Variables */}
            {extractVariables(localForm.subject + ' ' + localForm.body).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Detected Variables
                </label>
                <div className="flex flex-wrap gap-2">
                  {extractVariables(localForm.subject + ' ' + localForm.body).map((variable, index) => (
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
            <Button onClick={handleCreateTemplate} loading={isSubmitting} disabled={isSubmitting}>
              {template ? 'Update Template' : 'Create Template'}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
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
        onClose();
        openModal(CreateTemplateModal, {
          initialData: {
            name: 'AI Generated Template',
            subject: 'AI Personalized Subject',
            body: generatedTemplate,
          }
        });
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
    openModal(CreateTemplateModal, { template });
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // Optimistically remove from UI
      mutateTemplates(
        (current: any) => ({
          ...current,
          templates: current.templates.filter((t: any) => t.id !== id)
        }),
        false
      );
      
      await deleteTemplate({
        templateId: id,
        userId: authState.user.id
      });
      
      // No need to revalidate on delete since item is already removed
      showToast('Template deleted successfully!', 'success');
    } catch (error: any) {
      const message = error?.message || 'Failed to delete template';
      showToast(message, 'error');
      // Revalidate on error to restore the template
      mutateTemplates();
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // Create optimistic duplicate
      const duplicatedTemplate = {
        ...template,
        id: `temp-dup-${Date.now()}`,
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically add to UI
      mutateTemplates(
        (current: any) => ({
          ...current,
          templates: [duplicatedTemplate, ...(current?.templates || [])]
        }),
        false
      );
      
      await duplicateTemplate({
        templateId: template.id,
        userId: authState.user.id
      });
      
      // Silently revalidate to replace temp ID with real ID from server
      await mutateTemplates();
      
      showToast('Template duplicated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to duplicate template', 'error');
      // Revalidate on error to remove the optimistic duplicate
      mutateTemplates();
    }
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
      {/* Loading State */}
      {templatesLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">
            <i className="fas fa-spinner fa-spin mr-2" />
            Loading templates...
          </div>
        </div>
      )}

      {/* Error State */}
      {templatesError && (
        <div className="bg-error/10 border border-error text-error rounded-lg p-4 mb-6">
          <i className="fas fa-exclamation-triangle mr-2" />
          Failed to load templates. Please try again.
        </div>
      )}

      {/* Content */}
      {!templatesLoading && !templatesError && (
        <>
          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={openCreateModal}
              icon={<i className="fas fa-plus" />}
            >
              New Template
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-text-secondary">
                  <i className="fas fa-inbox text-4xl mb-4" />
                  <p className="text-lg">No templates yet</p>
                  <p className="text-sm mt-2">Create your first template to get started</p>
                </div>
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-surface rounded-xl p-6 border border-border hover:shadow-lg transition-shadow">
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        {template.name}
                        {template.id.startsWith('temp-') && (
                          <span className="ml-2 text-xs text-primary font-normal">(Saving...)</span>
                        )}
                      </h3>
                      <p className="text-sm text-text-secondary truncate">{template.subject}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditTemplate(template)}
                        disabled={template.id.startsWith('temp-')}
                        title={template.id.startsWith('temp-') ? 'Saving...' : 'Edit'}
                        style={{ opacity: template.id.startsWith('temp-') ? 0.5 : 1, cursor: template.id.startsWith('temp-') ? 'not-allowed' : 'pointer' }}
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDuplicateTemplate(template)}
                        disabled={template.id.startsWith('temp-')}
                        title={template.id.startsWith('temp-') ? 'Saving...' : 'Duplicate'}
                        style={{ opacity: template.id.startsWith('temp-') ? 0.5 : 1, cursor: template.id.startsWith('temp-') ? 'not-allowed' : 'pointer' }}
                      >
                        <i className="fas fa-copy" />
                      </button>
                    <button
                      className="btn-icon"
                      onClick={() => setTemplateToDelete(template.id)}
                      disabled={template.id.startsWith('temp-')}
                      title={template.id.startsWith('temp-') ? 'Saving...' : 'Delete'}
                      style={{ opacity: template.id.startsWith('temp-') ? 0.5 : 1, cursor: template.id.startsWith('temp-') ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="fas fa-trash text-error" />
                    </button>
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="mb-4">
                    <div className="bg-bg-secondary rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-text-secondary line-clamp-4">
                        {template.body.replace(/<[^>]*>/g, '').substring(0, 150)}{template.body.length > 150 ? '...' : ''}
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
                </div>
            ))
          )}
        </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={templateToDelete !== null}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => {
          if (templateToDelete) {
            handleDeleteTemplate(templateToDelete);
            setTemplateToDelete(null);
          }
        }}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TemplatesPage;
