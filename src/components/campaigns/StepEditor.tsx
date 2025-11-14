import React, { useState, useEffect } from 'react';
import ModalWrapper from '../ModalWrapper';
import CustomEmailBodyEditor from '../rich-text/CustomEmailBodyEditor';
import {
  FiX,
  FiMail,
  FiCheckSquare,
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
    taskType: 'linkedin' | 'whatsapp' | 'call' | 'custom';
    customTitle?: string;
    linkedinDescription?: string;
    whatsappDescription?: string;
    callDescription?: string;
    customDescription?: string;
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
  allSteps?: CampaignStep[];
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
  allSteps = [],
}) => {
  const [editedStep, setEditedStep] = useState<CampaignStep>({ ...step });
  const [dayError, setDayError] = useState<string>('');

  // Update edited step when step prop changes (only when editing a different step)
  useEffect(() => {
    setEditedStep({ ...step });
  }, [step.id]);

  
  const handleSave = () => {
    // Validate day number
    const dayValidationErrors = [];

    // Check if day is valid based on whether it's Day 1
    if (editedStep.day === 1) {
      // Day 1 is always valid
    } else {
      // All other days must be >= 2
      if (editedStep.day < 2) {
        dayValidationErrors.push('Day must be 2 or higher for steps after the first day');
      }
    }

    // Check for duplicate days (excluding current step)
    const duplicateStep = allSteps.find(s => s.id !== editedStep.id && s.day === editedStep.day);
    if (duplicateStep) {
      dayValidationErrors.push(`Day ${editedStep.day} is already used by another step`);
    }

    if (dayValidationErrors.length > 0) {
      setDayError(dayValidationErrors[0]);
      return;
    }

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

      // Check if there's a task description based on task type
      const hasDescription = 
        (taskAction.taskType === 'linkedin' && taskAction.linkedinDescription) ||
        (taskAction.taskType === 'whatsapp' && taskAction.whatsappDescription) ||
        (taskAction.taskType === 'call' && taskAction.callDescription) ||
        (taskAction.taskType === 'custom' && taskAction.customDescription);

      if (!hasDescription) {
        validationErrors.push('Task must have a description');
      }

      // For custom tasks, also validate title
      if (taskAction.taskType === 'custom' && !taskAction.customTitle) {
        validationErrors.push('Custom task must have a title');
      }
    }

    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    // Log for debugging purposes
    console.log('Saving step with actions:', {
      day: editedStep.day,
      hasEmailAction: !!editedStep.emailAction,
      hasTaskAction: !!editedStep.taskAction,
      emailTemplate: editedStep.emailAction?.templateId ? 'Template' : 'Custom',
      taskType: 'custom',
      taskTitle: 'Task'
    });

    onSave(editedStep);
  };

  const updateStep = (updates: Partial<CampaignStep>) => {
    setEditedStep(prev => ({ ...prev, ...updates }));
    // Clear day error when day is updated
    if ('day' in updates) {
      setDayError('');
    }
  };

  const handleDayChange = (newDay: number) => {
    // Clear any previous error
    setDayError('');

    // Prevent changing Day 1 to other values and other days to 1
    const originalDay = step.day;
    if (originalDay === 1) {
      // Day 1 should always remain 1
      updateStep({ day: 1 });
    } else {
      // Other steps should never be 1
      const safeDay = newDay === 1 ? (originalDay || 2) : newDay;
      updateStep({ day: safeDay });
    }
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
            taskType: 'custom',
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
      taskType: 'custom',
      enableEmailNotification: true,
    });
  };

  const removeTaskAction = () => {
    updateStep({ taskAction: undefined });
  };

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
                  {editedStep.day}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Day {editedStep.day}
                  </h2>
                  <p className="text-sm text-gray-600">Configure actions and timing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  min={editedStep.day === 1 ? "1" : "2"}
                  value={editedStep.day || 1}
                  onChange={(e) => handleDayChange(parseInt(e.target.value) || (editedStep.day === 1 ? 1 : 2))}
                  disabled={editedStep.day === 1}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    editedStep.day === 1
                      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                      : dayError
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder={editedStep.day === 1 ? "Day 1 is fixed" : "Enter day number (2 or higher)"}
                />
                {dayError && (
                  <p className="text-xs text-red-600 mt-1">{dayError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {editedStep.day === 1
                    ? 'Day 1 is fixed and cannot be edited'
                    : `This step occurs on day ${editedStep.day || 2} relative to when the sequence starts. You can set any day number 2 or higher.`
                  }
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
                        <CustomEmailBodyEditor
                          value={editedStep.emailAction.customBody || ''}
                          onChange={(value) => updateEmailAction({ customBody: value })}
                          placeholder="Enter email content..."
                          height={150}
                          enableVariables={true}
                          availableVariables={['name', 'company', 'title', 'firstName', 'lastName']}
                        />
                      </div>
                    </>
                  )}

                  {editedStep.emailAction.template && (
                    <div className="bg-gray-50 rounded p-3 text-xs">
                      <p className="font-medium text-gray-700 mb-1">Template Preview</p>
                      <p className="text-gray-600 mb-1"><strong>Subject:</strong> {editedStep.emailAction.template.subject}</p>
                      <div className="text-gray-600">
                        <strong>Body:</strong>
                        <div
                          className="mt-1 p-2 bg-white border border-gray-200 rounded text-xs max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{
                            __html: editedStep.emailAction.template.body.length > 100
                              ? editedStep.emailAction.template.body.substring(0, 100) + '...'
                              : editedStep.emailAction.template.body
                          }}
                        />
                      </div>
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
                       value={editedStep.taskAction?.taskType || 'custom'}
                       onChange={(e) => updateTaskAction({ taskType: e.target.value as 'linkedin' | 'whatsapp' | 'call' | 'custom' })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                     >
                       <option value="linkedin">LinkedIn</option>
                       <option value="whatsapp">WhatsApp</option>
                       <option value="call">Call</option>
                       <option value="custom">Custom</option>
                     </select>
                   </div>

                   {editedStep.taskAction?.taskType === 'custom' && (
                     <div>
                       <label className="block text-xs font-medium text-gray-600 mb-1">
                         Custom Task Title *
                       </label>
                       <input
                         type="text"
                         value={editedStep.taskAction.customTitle || ''}
                         onChange={(e) => updateTaskAction({ customTitle: e.target.value })}
                         placeholder="Enter custom task title..."
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                       />
                     </div>
                   )}

                   <div>
                     <label className="block text-xs font-medium text-gray-600 mb-1">
                       {editedStep.taskAction?.taskType === 'custom' ? 'Task Description *' : `${editedStep.taskAction?.taskType?.charAt(0).toUpperCase() + editedStep.taskAction?.taskType?.slice(1)} Description *`}
                     </label>
                     <textarea
                       value={
                         editedStep.taskAction?.taskType === 'linkedin' ? (editedStep.taskAction.linkedinDescription || '') :
                         editedStep.taskAction?.taskType === 'whatsapp' ? (editedStep.taskAction.whatsappDescription || '') :
                         editedStep.taskAction?.taskType === 'call' ? (editedStep.taskAction.callDescription || '') :
                         (editedStep.taskAction?.customDescription || '')
                       }
                       onChange={(e) => {
                         const description = e.target.value;
                         if (editedStep.taskAction?.taskType === 'linkedin') {
                           updateTaskAction({ linkedinDescription: description });
                         } else if (editedStep.taskAction?.taskType === 'whatsapp') {
                           updateTaskAction({ whatsappDescription: description });
                         } else if (editedStep.taskAction?.taskType === 'call') {
                           updateTaskAction({ callDescription: description });
                         } else {
                           updateTaskAction({ customDescription: description });
                         }
                       }}
                       placeholder={`Describe the ${editedStep.taskAction?.taskType === 'custom' ? 'task' : editedStep.taskAction?.taskType} to be performed...`}
                       rows={3}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                     />
                   </div>

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

                  </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <div>
                  Day {editedStep.day}
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
                       Task: {
                         editedStep.taskAction.taskType === 'custom' ? (editedStep.taskAction.customTitle || 'Custom Task') :
                         editedStep.taskAction.taskType === 'linkedin' ? 'LinkedIn' :
                         editedStep.taskAction.taskType === 'whatsapp' ? 'WhatsApp' :
                         editedStep.taskAction.taskType === 'call' ? 'Call' :
                         'Task'
                       }
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
