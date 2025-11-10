import React from 'react';
import { FiPlay, FiPause, FiSquare, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { 
  useStartCampaign, 
  usePauseCampaign, 
  useResumeCampaign, 
  useStopCampaign 
} from '../../hooks/useCampaigns';

interface CampaignControlProps {
  campaign: {
    id: string;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'draft' | 'sending' | 'paused' | 'completed';
    name: string;
    startedAt?: string;
    pausedAt?: string;
    completedAt?: string;
  };
  onScheduleClick?: () => void;
  disabled?: boolean;
}

const CampaignControl: React.FC<CampaignControlProps> = ({ 
  campaign, 
  onScheduleClick,
  disabled = false 
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirmDanger } = useConfirm();

  // Campaign control hooks
  const startCampaign = useStartCampaign(campaign.id);
  const pauseCampaign = usePauseCampaign(campaign.id);
  const resumeCampaign = useResumeCampaign(campaign.id);
  const stopCampaign = useStopCampaign(campaign.id);

  const handleStart = async () => {
    if (!user) {
      showToast('You must be logged in to start a campaign', 'error');
      return;
    }

    try {
      await startCampaign.trigger({
        sequenceId: campaign.id,
        action: 'start',
        userId: user.id || user.neonId
      });
      showToast('Campaign started successfully', 'success');
    } catch (error) {
      showToast('Failed to start campaign', 'error');
      console.error('Start campaign error:', error);
    }
  };

  const handlePause = async () => {
    if (!user) {
      showToast('You must be logged in to pause a campaign', 'error');
      return;
    }

    try {
      await pauseCampaign.trigger({
        sequenceId: campaign.id,
        action: 'pause',
        userId: user.id || user.neonId
      });
      showToast('Campaign paused successfully', 'success');
    } catch (error) {
      showToast('Failed to pause campaign', 'error');
      console.error('Pause campaign error:', error);
    }
  };

  const handleResume = async () => {
    if (!user) {
      showToast('You must be logged in to resume a campaign', 'error');
      return;
    }

    try {
      await resumeCampaign.trigger({
        sequenceId: campaign.id,
        action: 'resume',
        userId: user.id || user.neonId
      });
      showToast('Campaign resumed successfully', 'success');
    } catch (error) {
      showToast('Failed to resume campaign', 'error');
      console.error('Resume campaign error:', error);
    }
  };

  const handleStop = async () => {
    if (!user) {
      showToast('You must be logged in to stop a campaign', 'error');
      return;
    }

    const confirmed = await confirmDanger({
      message: 'Are you sure you want to stop this campaign? This action cannot be undone.',
      onConfirm: () => {}
    });

    if (!confirmed) return;

    try {
      await stopCampaign.trigger({
        sequenceId: campaign.id,
        action: 'stop',
        userId: user.id || user.neonId
      });
      showToast('Campaign stopped successfully', 'success');
    } catch (error) {
      showToast('Failed to stop campaign', 'error');
      console.error('Stop campaign error:', error);
    }
  };

  const isProcessing = startCampaign.isMutating || 
                      pauseCampaign.isMutating || 
                      resumeCampaign.isMutating || 
                      stopCampaign.isMutating;

  const getStatusInfo = () => {
    switch (campaign.status) {
      case 'DRAFT':
      case 'draft':
        return {
          color: 'gray',
          text: 'Draft',
          description: 'Campaign has not started yet'
        };
      case 'ACTIVE':
      case 'sending':
        return {
          color: 'green',
          text: 'Active',
          description: campaign.startedAt ? `Started ${new Date(campaign.startedAt).toLocaleDateString()}` : 'Campaign is running'
        };
      case 'PAUSED':
      case 'paused':
        return {
          color: 'yellow',
          text: 'Paused',
          description: campaign.pausedAt ? `Paused ${new Date(campaign.pausedAt).toLocaleDateString()}` : 'Campaign is paused'
        };
      case 'COMPLETED':
      case 'completed':
        return {
          color: 'blue',
          text: 'Completed',
          description: campaign.completedAt ? `Completed ${new Date(campaign.completedAt).toLocaleDateString()}` : 'Campaign has finished'
        };
      case 'CANCELLED':
        return {
          color: 'red',
          text: 'Cancelled',
          description: 'Campaign was cancelled'
        };
      default:
        return {
          color: 'gray',
          text: campaign.status,
          description: 'Unknown status'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
          statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
          statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {statusInfo.text}
        </div>
        <div className="text-sm text-gray-500">
          {statusInfo.description}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {(campaign.status === 'DRAFT' || campaign.status === 'draft') && (
          <>
            <button
              onClick={handleStart}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting...
                </>
              ) : (
                <>
                  <FiPlay className="w-4 h-4" />
                  Start Campaign
                </>
              )}
            </button>
            {onScheduleClick && (
              <button
                onClick={onScheduleClick}
                disabled={disabled || isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiCalendar className="w-4 h-4" />
                Schedule
              </button>
            )}
          </>
        )}

        {(campaign.status === 'ACTIVE' || campaign.status === 'sending') && (
          <>
            <button
              onClick={handlePause}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Pausing...
                </>
              ) : (
                <>
                  <FiPause className="w-4 h-4" />
                  Pause
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Stopping...
                </>
              ) : (
                <>
                  <FiSquare className="w-4 h-4" />
                  Stop
                </>
              )}
            </button>
          </>
        )}

        {(campaign.status === 'PAUSED' || campaign.status === 'paused') && (
          <>
            <button
              onClick={handleResume}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resuming...
                </>
              ) : (
                <>
                  <FiPlay className="w-4 h-4" />
                  Resume
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              disabled={disabled || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Stopping...
                </>
              ) : (
                <>
                  <FiSquare className="w-4 h-4" />
                  Stop
                </>
              )}
            </button>
          </>
        )}

        {(campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED' || campaign.status === 'completed') && (
          <div className="text-sm text-gray-500 italic">
            Campaign has ended
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignControl;