import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { ProspectStatus } from '../types';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (newStatus: ProspectStatus) => void;
  prospectName: string;
  currentStatus: ProspectStatus;
  loading?: boolean;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  onUpdateStatus,
  prospectName,
  currentStatus,
  loading = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ProspectStatus>(currentStatus);

  const statusOptions: { value: ProspectStatus; label: string; description: string }[] = [
    { value: 'NEW', label: 'New', description: 'Newly added prospect, not yet contacted.' },
    { value: 'CONTACTED', label: 'Contacted', description: 'Initial contact has been made with the prospect.' },
    { value: 'ENGAGED', label: 'Engaged', description: 'Prospect is actively engaged in conversations.' },
    { value: 'REPLIED', label: 'Replied', description: 'Prospect has replied to our outreach.' },
    { value: 'INTERESTED', label: 'Interested', description: 'Prospect has shown clear interest in our offering.' },
    { value: 'NOT_INTERESTED', label: 'Not Interested', description: 'Prospect has indicated they are not interested.' },
    { value: 'OPTED_OUT', label: 'Opted Out', description: 'Prospect has opted out of communications.' },
    { value: 'CONVERTED', label: 'Converted', description: 'Prospect has become a customer.' },
    { value: 'BOUNCED', label: 'Bounced', description: 'Email delivery failed and bounced back.' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(selectedStatus);
  };

  const handleCancel = () => {
    setSelectedStatus(currentStatus);
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleCancel} className="max-w-md">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-sync-alt text-blue-600"></i>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Update Status</h3>
              <p className="text-sm text-gray-500">{prospectName}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Select New Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ProspectStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Description */}
            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
              {statusOptions.find(opt => opt.value === selectedStatus)?.description}
            </div>

            {/* Current Status Indicator */}
            {selectedStatus !== currentStatus && (
              <div className="mt-3 text-xs text-gray-500">
                Current status: {statusOptions.find(opt => opt.value === currentStatus)?.label}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedStatus === currentStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Updating...
                  </span>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default UpdateStatusModal;
