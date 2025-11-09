import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';

interface DuplicateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  campaignName: string;
}

const DuplicateCampaignModal: React.FC<DuplicateCampaignModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  campaignName
}) => {
  const [name, setName] = useState(`${campaignName} (Copy)`);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleConfirm();
    }
  };

  // Reset name when modal opens with different campaign
  React.useEffect(() => {
    if (isOpen) {
      setName(`${campaignName} (Copy)`);
    }
  }, [isOpen, campaignName]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
          <i className="fas fa-copy text-blue-600 text-xl" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Duplicate Campaign
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Create a copy of <strong>{campaignName}</strong>. You can rename it before duplicating.
          </p>
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name
          </label>
          <input
            id="campaign-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter campaign name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Duplicate
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DuplicateCampaignModal;