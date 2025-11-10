import React, { useState } from 'react';
import { FiCalendar, FiClock, FiGlobe, FiSave, FiX } from 'react-icons/fi';
import ModalWrapper from '../ModalWrapper';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useScheduleCampaign } from '../../hooks/useCampaigns';

interface CampaignSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    name: string;
  };
}

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
  { value: 'America/Vancouver', label: 'Pacific Time - Vancouver' },
  { value: 'America/Mexico_City', label: 'Central Time - Mexico City' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time - Berlin' },
  { value: 'Europe/Rome', label: 'Central European Time - Rome' },
  { value: 'Europe/Madrid', label: 'Central European Time - Madrid' },
  { value: 'Europe/Amsterdam', label: 'Central European Time - Amsterdam' },
  { value: 'Europe/Stockholm', label: 'Central European Time - Stockholm' },
  { value: 'Europe/Moscow', label: 'Moscow Time' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time - Melbourne' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
];

const CampaignScheduler: React.FC<CampaignSchedulerProps> = ({ 
  isOpen, 
  onClose, 
  campaign 
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const scheduleCampaign = useScheduleCampaign();

  // Form state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      setScheduledTime('09:00');
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    }

    if (!scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    }

    if (!timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    
    // Check if scheduled date/time is in the future
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      newErrors.scheduledDateTime = 'Scheduled date and time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast('You must be logged in to schedule a campaign', 'error');
      return;
    }

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      await scheduleCampaign.trigger({
        sequenceId: campaign.id,
        scheduledDate: scheduledDateTime.toISOString(),
        timezone,
        userId: user.id || user.neonId,
        sendTime: scheduledTime
      });

      showToast('Campaign scheduled successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to schedule campaign', 'error');
      console.error('Schedule campaign error:', error);
    }
  };

  const formatLocalTime = () => {
    if (!scheduledDate || !scheduledTime) return '';
    
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      return scheduledDateTime.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return '';
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="bg-white rounded-3xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl">
              <FiCalendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Schedule Campaign
              </h2>
              <p className="text-sm text-gray-600 mt-1">Set when your campaign will start</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-200"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pt-4 space-y-5">
          {/* Campaign Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-200 rounded-xl mt-0.5">
                <FiCalendar className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                <p className="text-sm text-gray-700 mt-1">Configure when this campaign should start reaching prospects</p>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                <FiCalendar className="w-4 h-4 mr-2 text-blue-600" />
                Start Date & Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      if (errors.scheduledDate) {
                        setErrors(prev => ({ ...prev, scheduledDate: '' }));
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      errors.scheduledDate ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.scheduledDate && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.scheduledDate}</p>
                  )}
                </div>

                <div>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => {
                      setScheduledTime(e.target.value);
                      if (errors.scheduledTime) {
                        setErrors(prev => ({ ...prev, scheduledTime: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      errors.scheduledTime ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.scheduledTime && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.scheduledTime}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errors.scheduledDateTime && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full mt-0.5">
                  <FiX className="w-3 h-3 text-red-600" />
                </div>
                <p className="text-sm text-red-700 font-medium">{errors.scheduledDateTime}</p>
              </div>
            </div>
          )}

          {/* Timezone */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
              <FiGlobe className="w-4 h-4 mr-2 text-blue-600" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                if (errors.timezone) {
                  setErrors(prev => ({ ...prev, timezone: '' }));
                }
              }}
              className={`w-full px-4 py-3 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none bg-white ${
                errors.timezone ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <option value="">Select timezone</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.timezone}</p>
            )}
          </div>

          {/* Local Time Preview */}
          {scheduledDate && scheduledTime && timezone && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-200 rounded-xl mt-0.5">
                  <FiClock className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-1">Local Time Preview</h4>
                  <p className="text-sm text-green-700">{formatLocalTime()}</p>
                </div>
              </div>
            </div>
          )}

          
          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleCampaign.isMutating}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {scheduleCampaign.isMutating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" />
                  Schedule Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default CampaignScheduler;