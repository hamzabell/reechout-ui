import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ModalWrapper from '../ModalWrapper';
import {
  FiMenu,
  FiArrowUp,
  FiArrowDown,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiMail,
  FiCheckSquare,
  FiX,
} from 'react-icons/fi';

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

interface StepReorderProps {
  steps: CampaignStep[];
  isOpen: boolean;
  onClose: () => void;
  onSaveReorder: (reorderedSteps: CampaignStep[]) => void;
  onAddStep: () => void;
  onEditStep: (step: CampaignStep) => void;
  onDeleteStep: (stepId: string) => void;
}

const StepReorder: React.FC<StepReorderProps> = ({
  steps,
  isOpen,
  onClose,
  onSaveReorder,
  onAddStep,
  onEditStep,
  onDeleteStep,
}) => {
  const [reorderedSteps, setReorderedSteps] = useState<CampaignStep[]>(steps);
  const [draggedStep, setDraggedStep] = useState<CampaignStep | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  React.useEffect(() => {
    setReorderedSteps(steps);
  }, [steps]);

  const handleDragStart = (step: CampaignStep) => {
    setDraggedStep(step);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedStep) return;

    const draggedIndex = reorderedSteps.findIndex(s => s.id === draggedStep.id);
    if (draggedIndex === dropIndex) return;

    const newSteps = [...reorderedSteps];
    newSteps.splice(draggedIndex, 1);
    newSteps.splice(dropIndex, 0, draggedStep);

    // Update step numbers
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1,
    }));

    setReorderedSteps(updatedSteps);
    setDraggedStep(null);
  };

  const handleDragEnd = () => {
    setDraggedStep(null);
    setDragOverIndex(null);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...reorderedSteps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];

    const updatedSteps = newSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setReorderedSteps(updatedSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === reorderedSteps.length - 1) return;
    const newSteps = [...reorderedSteps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];

    const updatedSteps = newSteps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setReorderedSteps(updatedSteps);
  };

  const handleSave = () => {
    onSaveReorder(reorderedSteps);
    onClose();
  };

  const hasChanges = JSON.stringify(steps) !== JSON.stringify(reorderedSteps);

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reorder Campaign Steps</h2>
                <p className="text-sm text-gray-600 mt-1">Drag and drop or use arrows to reorder steps</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onAddStep}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Step
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            <div className="space-y-3">
              {reorderedSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white border rounded-lg transition-all ${
                    dragOverIndex === index ? 'border-blue-400 shadow-lg' : 'border-gray-200'
                  } ${draggedStep?.id === step.id ? 'opacity-50' : ''}`}
                >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(step)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className="p-4 cursor-move hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing">
                        <FiMenu className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Step Number */}
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {step.stepNumber}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {step.name || `Step ${step.stepNumber}`}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          Day {step.day}
                          {step.emailAction && (
                            <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                              <FiMail className="w-3 h-3" />
                              Email
                            </span>
                          )}
                          {step.taskAction && (
                            <span className="ml-2 inline-flex items-center gap-1 text-purple-600">
                              <FiCheckSquare className="w-3 h-3" />
                              Task
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStepUp(index)}
                          disabled={index === 0}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <FiArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveStepDown(index)}
                          disabled={index === reorderedSteps.length - 1}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <FiArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditStep(step)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit step"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteStep(step.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete step"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Description */}
                    {step.description && (
                      <p className="mt-2 text-sm text-gray-600 ml-11 line-clamp-2">
                        {step.description}
                      </p>
                    )}

                    {/* Action Details */}
                    <div className="mt-2 ml-11 flex flex-wrap gap-2">
                      {step.emailAction && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          <FiMail className="w-3 h-3" />
                          {step.emailAction.template
                            ? step.emailAction.template.name
                            : 'Custom Email'
                          }
                          {step.emailAction.enablePersonalization && (
                            <span className="ml-1 bg-green-200 px-1 rounded">AI</span>
                          )}
                        </div>
                      )}
                      {step.taskAction && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          <FiCheckSquare className="w-3 h-3" />
                          {step.taskAction.taskType.charAt(0).toUpperCase() + step.taskAction.taskType.slice(1)}
                          {step.taskAction.taskType === 'other' && step.taskAction.otherTitle && ` - ${step.taskAction.otherTitle}`}
                          {step.taskAction.enableEmailNotification && (
                            <span className="ml-1 bg-purple-200 px-1 rounded">Email</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {reorderedSteps.length === 0 && (
                <div className="text-center py-12">
                  <FiMenu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Steps Yet</h3>
                  <p className="text-gray-600 mb-6">Add your first step to get started with the campaign.</p>
                  <button
                    onClick={onAddStep}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add First Step
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {reorderedSteps.length} step{reorderedSteps.length !== 1 ? 's' : ''}
                {hasChanges && (
                  <span className="ml-2 text-blue-600 font-medium">
                    (Changes made)
                  </span>
                )}
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
                  disabled={!hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Order
                </button>
              </div>
            </div>
          </div>
    </ModalWrapper>
  );
};

export default StepReorder;