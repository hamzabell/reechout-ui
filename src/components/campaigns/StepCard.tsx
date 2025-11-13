import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiMail,
  FiCheckSquare,
  FiEdit3,
  FiClock,
  FiSettings,
  FiZap,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiLoader,
} from 'react-icons/fi';

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
    template?: {
      id: string;
      name: string;
      subject: string;
      body: string;
    };
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

interface StepCardProps {
  step: CampaignStep;
  index?: number; // Sequential position in the sorted steps array
  onEdit: () => void;
  onDelete?: () => void;
  onPersonalize?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isReorderable?: boolean;
  showActions?: boolean;
  className?: string;
  campaignId?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isDeleting?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  onEdit,
  onDelete,
  onPersonalize,
  onMoveUp,
  onMoveDown,
  isReorderable = false,
  showActions = true,
  className = '',
  campaignId,
  isFirst = false,
  isLast = false,
  isDeleting = false,
}) => {
  const navigate = useNavigate();
  const hasActions = step.emailAction || step.taskAction;

  const generateStepDescription = () => {
    const actions = [];

    if (step.emailAction) {
      actions.push(step.emailAction.template?.name || "Send email");
    }

    if (step.taskAction) {
      actions.push("Follow up with a task");
    }

    if (actions.length === 0) {
      return null;
    }

    return actions.join(" → ");
  };

  const stepDescription = generateStepDescription();

  const handleDelete = () => {
    if (onDelete && typeof onDelete === 'function') {
      onDelete();
    } else {
      console.warn('StepCard: onDelete prop is not provided or not a function');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isDeleting ? 0.6 : 1,
        y: 0,
        scale: isDeleting ? 0.98 : 1
      }}
      transition={{ duration: 0.2 }}
      className={`card card-hover ${isDeleting ? 'border-red-200 bg-red-50/30' : ''} ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Day Number/Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              {index !== undefined ? index + 1 : step.day}
            </div>
          </div>

          {/* Day Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.name && !step.name.startsWith('Day ') ? step.name : `Day ${step.day}`}
                </h3>
                {stepDescription && (
                  <p className="text-sm text-slate-600 mt-0.5">{stepDescription}</p>
                )}
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-1 ml-4">
                  {/* Reorder controls */}
                  {isReorderable && (
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="btn-icon text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move day up"
                      >
                        <FiChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="btn-icon text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move day down"
                      >
                        <FiChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={onEdit}
                    className="btn-icon text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    title="Edit day"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  {step.emailAction?.enablePersonalization && (
                    <button
                      onClick={() => {
                        if (onPersonalize) {
                          onPersonalize();
                        } else if (campaignId) {
                          navigate(`/dashboard/campaigns/${campaignId}/steps/${step.day}/personalize`);
                        }
                      }}
                      className="btn-icon text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                      title="Configure day personalization"
                    >
                      <FiZap className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`btn-icon transition-all duration-200 ${
                        isDeleting
                          ? 'text-red-400 bg-red-50 cursor-not-allowed'
                          : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={isDeleting ? 'Deleting day...' : 'Delete day'}
                    >
                      {isDeleting ? (
                        <FiLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

      
            {/* Actions Summary */}
            {hasActions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {step.emailAction && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm">
                    <FiMail className="w-3.5 h-3.5" />
                    {step.emailAction.template?.name || 'Email'}
                  </span>
                )}
                {step.taskAction && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-sm">
                    <FiCheckSquare className="w-3.5 h-3.5" />
                    {step.taskAction.taskType.charAt(0).toUpperCase() + step.taskAction.taskType.slice(1)}
                    {step.taskAction.taskType === 'custom' && step.taskAction.customTitle && `: ${step.taskAction.customTitle}`}
                  </span>
                )}
              </div>
            )}

            {/* No Actions State */}
            {!hasActions && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <FiSettings className="w-4 h-4" />
                  <p className="text-sm">No actions configured</p>
                </div>
              </div>
            )}
          </div>

  
        </div>
      </div>
    </motion.div>
  );
};

export default StepCard;
