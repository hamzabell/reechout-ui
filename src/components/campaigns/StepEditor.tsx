import React, { useState } from 'react';
import ModalWrapper from '../ModalWrapper';
import {
  FiX,
  FiMail,
  FiCheckSquare,
  FiClock,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiCalendar,
} from 'react-icons/fi';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

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
    template?: EmailTemplate;
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

interface StepEditorProps {
  step: CampaignStep;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStep: CampaignStep) => void;
  onDelete?: () => void;
  availableTemplates: EmailTemplate[];
  isFirst?: boolean;
  isLast?: boolean;
}

const StepEditor: React.FC<StepEditorProps> = ({
  step,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableTemplates,
  isFirst,
  isLast,
}) => {
  const [editedStep, setEditedStep] = useState<CampaignStep>({ ...step });

  const handleSave = () => {
    // Validate actions before saving
    const validationErrors = [];

    // Validate email action if it exists
    if (editedStep.emailAction) {
      if (!editedStep.emailAction.templateId && (!editedStep.emailAction.customSubject || !editedStep.emailAction.customBody)) {
        validationErrors.push('Email action must have either a template selected or both custom subject and body filled');
      }
    }

    // Validate task action if it exists
    if (editedStep.taskAction) {
      const taskAction = editedStep.taskAction;

      // Check if there's a description for the selected task type
      const hasDescription =
        (taskAction.taskType === 'linkedin' && taskAction.linkedinDescription) ||
        (taskAction.taskType === 'whatsapp' && taskAction.whatsappDescription) ||
        (taskAction.taskType === 'call' && taskAction.callDescription) ||
        (taskAction.taskType === 'other' && taskAction.otherDescription);

      if (!hasDescription) {
        validationErrors.push('Task must have a description for the selected task type');
      }

      // If task type is 'other', check if there's a title
      if (taskAction.taskType === 'other' && !taskAction.otherTitle) {
        validationErrors.push('Custom task type must have a title');
      }
    }

    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    // Log for debugging purposes
    console.log('Saving step with actions:', {
      stepNumber: editedStep.stepNumber,
      day: editedStep.day,
      hasEmailAction: !!editedStep.emailAction,
      hasTaskAction: !!editedStep.taskAction,
      emailTemplate: editedStep.emailAction?.templateId ? 'Template' : 'Custom',
      taskType: editedStep.taskAction?.taskType,
      taskTitle: editedStep.taskAction?.otherTitle || editedStep.taskAction?.taskType
    });

    onSave(editedStep);
    onClose();
  };

  const updateStep = (updates: Partial<CampaignStep>) => {
    setEditedStep(prev => ({ ...prev, ...updates }));
  };

  const updateEmailAction = (updates: Partial<CampaignStep['emailAction']>) => {
    setEditedStep(prev => ({
      ...prev,
      emailAction: prev.emailAction
        ? { ...prev.emailAction, ...updates }
        : {
            id: `email_${Date.now()}`,
            enablePersonalization: true,
            customSubject: '',
            customBody: '',
            ...updates
          }
    }));
  };

  const updateTaskAction = (updates: Partial<CampaignStep['taskAction']>) => {
    setEditedStep(prev => ({
      ...prev,
      taskAction: prev.taskAction
        ? { ...prev.taskAction, ...updates }
        : {
            id: `task_${Date.now()}`,
            taskType: 'linkedin',
            enableEmailNotification: true,
            ...updates
          }
    }));
  };

  const addEmailAction = () => {
    updateEmailAction({
      id: `email_${Date.now()}`,
      enablePersonalization: true,
      customSubject: '',
      customBody: '',
    });
  };

  const removeEmailAction = () => {
    updateStep({ emailAction: undefined });
  };

  const addTaskAction = () => {
    updateTaskAction({
      id: `task_${Date.now()}`,
      taskType: 'linkedin',
      enableEmailNotification: true,
    });
  };

  const removeTaskAction = () => {
    updateStep({ taskAction: undefined });
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {editedStep.stepNumber}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Step {editedStep.stepNumber}
                  </h2>
                  <p className="text-sm text-gray-600">Configure actions and timing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete step"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Day Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-600" />
                Day Configuration
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Day *
                </label>
                <input
                  type="number"
                  min="1"
                  value={editedStep.day || 1}
                  onChange={(e) => updateStep({ day: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter day number..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  This step occurs on day {editedStep.day || 1} relative to when the sequence starts
                </p>
              </div>
            </div>

            {/* Email Action Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FiMail className="w-4 h-4 text-gray-600" />
                    Email Action
                    {editedStep.emailAction && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full ml-2">
                        Active
                      </span>
                    )}
                  </h3>
                  {!editedStep.emailAction ? (
                    <button
                      onClick={addEmailAction}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs flex items-center gap-1"
                    >
                      <FiPlus className="w-3 h-3" />
                      Add Email
                    </button>
                  ) : (
                    <button
                      onClick={removeEmailAction}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-xs flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {editedStep.emailAction && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email Template
                    </label>
                    <select
                      value={editedStep.emailAction.templateId || ''}
                      onChange={(e) => {
                        const template = availableTemplates.find(t => t.id === e.target.value);
                        updateEmailAction({
                          templateId: e.target.value || undefined,
                          customSubject: template ? undefined : editedStep.emailAction?.customSubject,
                          customBody: template ? undefined : editedStep.emailAction?.customBody,
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Custom Email</option>
                      {availableTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editedStep.emailAction.templateId && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={editedStep.emailAction.customSubject || ''}
                          onChange={(e) => updateEmailAction({ customSubject: e.target.value })}
                          placeholder="Enter email subject..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Email Body
                        </label>
                        <textarea
                          value={editedStep.emailAction.customBody || ''}
                          onChange={(e) => updateEmailAction({ customBody: e.target.value })}
                          placeholder="Enter email content..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        />
                      </div>
                    </>
                  )}

                  {editedStep.emailAction.template && (
                    <div className="bg-gray-50 rounded p-3 text-xs">
                      <p className="font-medium text-gray-700 mb-1">Template Preview</p>
                      <p className="text-gray-600 mb-1"><strong>Subject:</strong> {editedStep.emailAction.template.subject}</p>
                      <p className="text-gray-600"><strong>Body:</strong> {editedStep.emailAction.template.body.substring(0, 100)}...</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedStep.emailAction.enablePersonalization}
                        onChange={(e) => updateEmailAction({ enablePersonalization: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-xs font-medium text-gray-700">Enable AI Personalization</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      AI will personalize email content for each prospect based on their profile
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Task Action Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FiCheckSquare className="w-4 h-4 text-gray-600" />
                    Task Action
                    {editedStep.taskAction && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full ml-2">
                        Active
                      </span>
                    )}
                  </h3>
                  {!editedStep.taskAction ? (
                    <button
                      onClick={addTaskAction}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs flex items-center gap-1"
                    >
                      <FiPlus className="w-3 h-3" />
                      Add Task
                    </button>
                  ) : (
                    <button
                      onClick={removeTaskAction}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-xs flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {editedStep.taskAction && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Task Type *
                    </label>
                    <select
                      value={editedStep.taskAction.taskType || 'linkedin'}
                      onChange={(e) => updateTaskAction({ taskType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="linkedin">LinkedIn</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="call">Call</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* LinkedIn Task Description */}
                  {editedStep.taskAction.taskType === 'linkedin' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        LinkedIn Task Description *
                      </label>
                      <textarea
                        value={editedStep.taskAction.linkedinDescription || ''}
                        onChange={(e) => updateTaskAction({ linkedinDescription: e.target.value })}
                        placeholder="Describe the LinkedIn task to be performed..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </div>
                  )}

                  {/* WhatsApp Task Description */}
                  {editedStep.taskAction.taskType === 'whatsapp' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        WhatsApp Task Description *
                      </label>
                      <textarea
                        value={editedStep.taskAction.whatsappDescription || ''}
                        onChange={(e) => updateTaskAction({ whatsappDescription: e.target.value })}
                        placeholder="Describe the WhatsApp task to be performed..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </div>
                  )}

                  {/* Call Task Description */}
                  {editedStep.taskAction.taskType === 'call' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Call Task Description *
                      </label>
                      <textarea
                        value={editedStep.taskAction.callDescription || ''}
                        onChange={(e) => updateTaskAction({ callDescription: e.target.value })}
                        placeholder="Describe the call task to be performed..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </div>
                  )}

                  {/* Other Task Type */}
                  {editedStep.taskAction.taskType === 'other' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Custom Task Title *
                        </label>
                        <input
                          type="text"
                          value={editedStep.taskAction.otherTitle || ''}
                          onChange={(e) => updateTaskAction({ otherTitle: e.target.value })}
                          placeholder="Enter custom task title..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Custom Task Description *
                        </label>
                        <textarea
                          value={editedStep.taskAction.otherDescription || ''}
                          onChange={(e) => updateTaskAction({ otherDescription: e.target.value })}
                          placeholder="Describe the custom task to be performed..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="bg-green-50 rounded p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedStep.taskAction.enableEmailNotification}
                        onChange={(e) => updateTaskAction({ enableEmailNotification: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 text-sm"
                      />
                      <span className="text-xs font-medium text-gray-700">Send Email Notification</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      Send an email notification when this task is created
                    </p>
                  </div>

                  {/* Task Summary */}
                  <div className="bg-gray-50 rounded p-3 text-xs">
                    <p className="font-medium text-gray-700 mb-1">Task Summary</p>
                    <p className="text-gray-600">
                      <strong>Type:</strong> {editedStep.taskAction.taskType.charAt(0).toUpperCase() + editedStep.taskAction.taskType.slice(1)}
                    </p>
                    {editedStep.taskAction.taskType === 'other' && editedStep.taskAction.otherTitle && (
                      <p className="text-gray-600">
                        <strong>Title:</strong> {editedStep.taskAction.otherTitle}
                      </p>
                    )}
                    {editedStep.taskAction.taskType === 'linkedin' && editedStep.taskAction.linkedinDescription && (
                      <p className="text-gray-600 mt-1">
                        <strong>Description:</strong> {editedStep.taskAction.linkedinDescription.substring(0, 100)}{editedStep.taskAction.linkedinDescription.length > 100 ? '...' : ''}
                      </p>
                    )}
                    {editedStep.taskAction.taskType === 'whatsapp' && editedStep.taskAction.whatsappDescription && (
                      <p className="text-gray-600 mt-1">
                        <strong>Description:</strong> {editedStep.taskAction.whatsappDescription.substring(0, 100)}{editedStep.taskAction.whatsappDescription.length > 100 ? '...' : ''}
                      </p>
                    )}
                    {editedStep.taskAction.taskType === 'call' && editedStep.taskAction.callDescription && (
                      <p className="text-gray-600 mt-1">
                        <strong>Description:</strong> {editedStep.taskAction.callDescription.substring(0, 100)}{editedStep.taskAction.callDescription.length > 100 ? '...' : ''}
                      </p>
                    )}
                    {editedStep.taskAction.taskType === 'other' && editedStep.taskAction.otherDescription && (
                      <p className="text-gray-600 mt-1">
                        <strong>Description:</strong> {editedStep.taskAction.otherDescription.substring(0, 100)}{editedStep.taskAction.otherDescription.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div>
                  Step {editedStep.stepNumber}
                  {isFirst && <span className="ml-2 text-blue-600">(First step)</span>}
                  {isLast && <span className="ml-2 text-blue-600">(Last step)</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {editedStep.emailAction && (
                    <span className="inline-flex items-center gap-1 mr-3">
                      <FiMail className="w-3 h-3" />
                      Email: {editedStep.emailAction.templateId ? 'Template' : 'Custom'}
                    </span>
                  )}
                  {editedStep.taskAction && (
                    <span className="inline-flex items-center gap-1">
                      <FiCheckSquare className="w-3 h-3" />
                      Task: {editedStep.taskAction.taskType.charAt(0).toUpperCase() + editedStep.taskAction.taskType.slice(1)}
                      {editedStep.taskAction.taskType === 'other' && editedStep.taskAction.otherTitle && ` - ${editedStep.taskAction.otherTitle}`}
                    </span>
                  )}
                  {!editedStep.emailAction && !editedStep.taskAction && (
                    <span className="text-gray-400">No actions configured</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
    </ModalWrapper>
  );
};

export default StepEditor;