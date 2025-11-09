import React, { useState } from 'react';
import { Campaign } from '../../types';

interface SequenceCardProps {
  campaign: Campaign;
  onView: (sequence: Campaign) => void;
  onEdit: (sequence: Campaign) => void;
  onDelete: (sequenceId: string) => void;
  onPauseResume: (sequence: Campaign) => void;
  onDuplicate: (sequence: Campaign) => void;
  onApprove: (sequence: Campaign) => void;
  onSchedule: (sequence: Campaign) => void;
}

const CampaignCard: React.FC<SequenceCardProps> = ({
  campaign,
  onView,
  onEdit,
  onDelete,
  onPauseResume,
  onDuplicate,
  onApprove,
  onSchedule,
}) => {
  const [showActions, setShowActions] = useState(false);

  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'fas fa-file-alt';
      case 'pending_approval': return 'fas fa-clock';
      case 'approved': return 'fas fa-check-circle';
      case 'rejected': return 'fas fa-times-circle';
      case 'scheduled': return 'fas fa-calendar';
      case 'sending': return 'fas fa-paper-plane';
      case 'paused': return 'fas fa-pause-circle';
      case 'completed': return 'fas fa-check-double';
      default: return 'fas fa-question-circle';
    }
  };

  const getOpenRate = () => {
    if (campaign.sent === 0) return 0;
    return ((campaign.opens / campaign.sent) * 100).toFixed(1);
  };

  const getPerformanceLevel = () => {
    const replyRate = campaign.replyRate;
    if (replyRate >= 20) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (replyRate >= 15) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (replyRate >= 10) return { level: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="card card-hover group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {campaign.name}
              {/* Show saving indicator for optimistic items */}
              {campaign.id.startsWith('temp-') && (
                <span className="ml-2 text-xs text-primary font-normal">
                  (Saving...)
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
              {campaign.description || 'No description provided'}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="btn-icon text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-ellipsis-v" />
            </button>

            {/* Dropdown Actions */}
            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-2">
                <button
                  onClick={() => { onEdit(campaign); setShowActions(false); }}
                  disabled={campaign.id.startsWith('temp-')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={campaign.id.startsWith('temp-') ? 'Saving...' : 'Edit'}
                >
                  <i className="fas fa-edit mr-3 text-slate-400" />
                  Edit
                </button>
                
                {(campaign.status === 'sending' || campaign.status === 'paused') && (
                  <button
                    onClick={() => { onPauseResume(campaign); setShowActions(false); }}
                    disabled={campaign.id.startsWith('temp-')}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={campaign.id.startsWith('temp-') ? 'Saving...' : campaign.status === 'paused' ? 'Resume' : 'Pause'}
                  >
                    <i className={`fas fa-${campaign.status === 'paused' ? 'play' : 'pause'} mr-3 text-orange-500`} />
                    {campaign.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button
                  onClick={() => { onDuplicate(campaign); setShowActions(false); }}
                  disabled={campaign.id.startsWith('temp-')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={campaign.id.startsWith('temp-') ? 'Saving...' : 'Duplicate'}
                >
                  <i className="fas fa-copy mr-3 text-slate-400" />
                  Duplicate
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { onDelete(campaign.id); setShowActions(false); }}
                  disabled={campaign.id.startsWith('temp-')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={campaign.id.startsWith('temp-') ? 'Saving...' : 'Delete'}
                >
                  <i className="fas fa-trash mr-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={`status-badge ${campaign.status}`}>
            <i className={`${getStatusIcon(campaign.status)} mr-1.5`} />
            {campaign.status.replace('_', ' ').charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          <span className="text-sm text-slate-500">
            {campaign.prospects.length} prospects
          </span>
        </div>
      </div>

      {/* Performance Metrics - Reduced from 3 to 2 cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            <div className="text-3xl font-bold text-slate-900 mb-1">{campaign.sent}</div>
            <div className="text-sm text-slate-600 font-medium">Emails Sent</div>
            <div className="text-xs text-slate-500 mt-1">to {campaign.prospects.length} prospects</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{campaign.replyRate}%</div>
            <div className="text-sm text-emerald-600 font-medium">Reply Rate</div>
            <div className="text-xs text-slate-500 mt-1">{getOpenRate()}% open rate</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${performance.bg} ${performance.color}`}>
          <i className="fas fa-chart-line mr-2" />
          {performance.level} Performance
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            {campaign.status === 'scheduled' && campaign.scheduledDate && (
              <div className="text-sm text-blue-600 font-medium">
                <i className="fas fa-clock mr-1" />
                {new Date(campaign.scheduledDate).toLocaleDateString()}
              </div>
            )}
            {(campaign.status === 'sending' || campaign.status === 'completed') && campaign.startDate && (
              <div className="text-sm text-emerald-600 font-medium">
                <i className="fas fa-play mr-1" />
                {new Date(campaign.startDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
