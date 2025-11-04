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

interface StepCardProps {
  step: CampaignStep;
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
}

const StepCard: React.FC<StepCardProps> = ({
  step,
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
}) => {
  const navigate = useNavigate();
  const getDayText = () => {
    return `Day ${step.day}`;
  };

  const hasActions = step.emailAction || step.taskAction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card card-hover ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Step Number/Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              {step.stepNumber}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.name || `Step ${step.stepNumber}`}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FiClock className="w-4 h-4" />
                    <span>{getDayText()}</span>
                  </div>
                  {hasActions && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Configured</span>
                    </div>
                  )}
                </div>
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
                        title="Move step up"
                      >
                        <FiChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="btn-icon text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move step down"
                      >
                        <FiChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={onEdit}
                    className="btn-icon text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    title="Edit step"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  {step.emailAction?.enablePersonalization && (
                    <button
                      onClick={() => {
                        if (onPersonalize) {
                          onPersonalize();
                        } else if (campaignId) {
                          navigate(`/dashboard/campaigns/${campaignId}/steps/${step.stepNumber}/personalize`);
                        }
                      }}
                      className="btn-icon text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                      title="Configure step personalization"
                    >
                      <FiZap className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="btn-icon text-slate-600 hover:text-red-600 hover:bg-red-50"
                      title="Delete step"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {step.description && (
              <p className="text-slate-700 mb-4 leading-relaxed">{step.description}</p>
            )}

            {/* Actions Summary */}
            {hasActions && (
              <div className="flex flex-wrap gap-2">
                {step.emailAction && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                    <FiMail className="w-3.5 h-3.5" />
                    {step.emailAction.template?.name || 'Email'}
                  </span>
                )}
                {step.taskAction && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                    <FiCheckSquare className="w-3.5 h-3.5" />
                    {step.taskAction.taskType.charAt(0).toUpperCase() + step.taskAction.taskType.slice(1)}
                    {step.taskAction.taskType === 'other' && step.taskAction.otherTitle && ` - ${step.taskAction.otherTitle}`}
                  </span>
                )}
              </div>
            )}

            {/* No Actions State */}
            {!hasActions && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <FiSettings className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">No Actions Configured</p>
                    <p className="text-xs text-slate-500">Add email or task actions to this step</p>
                  </div>
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