import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';

interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'paused';
  prospectsCount?: number;
}

interface AddToSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToSequence: (sequenceId: string) => void;
  selectedProspects: string[];
  loading?: boolean;
}

const AddToSequenceModal: React.FC<AddToSequenceModalProps> = ({
  isOpen,
  onClose,
  onAddToSequence,
  selectedProspects,
  loading = false
}) => {
  const [selectedSequence, setSelectedSequence] = useState<string>('');

  // Mock sequences data
  const sequences: Sequence[] = [
    {
      id: '1',
      name: 'Welcome Campaign',
      description: 'Initial onboarding sequence for new prospects',
      status: 'active',
      prospectsCount: 24
    },
    {
      id: '2',
      name: 'Product Demo Follow-up',
      description: 'Follow-up sequence after product demonstrations',
      status: 'active',
      prospectsCount: 15
    },
    {
      id: '3',
      name: 'Enterprise Sales Pipeline',
      description: 'Extended sales cycle for enterprise clients',
      status: 'active',
      prospectsCount: 8
    },
    {
      id: '4',
      name: 'Re-engagement Campaign',
      description: 'Re-engage inactive prospects',
      status: 'draft',
      prospectsCount: 0
    },
    {
      id: '5',
      name: 'Newsletter Sequence',
      description: 'Monthly newsletter and updates',
      status: 'paused',
      prospectsCount: 45
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSequence) {
      onAddToSequence(selectedSequence);
    }
  };

  const handleCancel = () => {
    setSelectedSequence('');
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleCancel} className="max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-paper-plane text-purple-600"></i>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Add to Sequence</h3>
              <p className="text-sm text-gray-500">
                {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sequence
              </label>
              <div className="space-y-2">
                {sequences.map((sequence) => (
                  <label
                    key={sequence.id}
                    className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="sequence"
                      value={sequence.id}
                      checked={selectedSequence === sequence.id}
                      onChange={(e) => setSelectedSequence(e.target.value)}
                      className="mt-1 mr-3"
                      disabled={loading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{sequence.name}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sequence.status)}`}>
                          {sequence.status}
                        </span>
                      </div>
                      {sequence.description && (
                        <p className="text-sm text-gray-500 mt-1">{sequence.description}</p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-gray-400">
                        <i className="fas fa-users mr-1"></i>
                        {sequence.prospectsCount || 0} prospects
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedSequence && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-info-circle text-blue-400"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>{selectedProspects.length}</strong> prospect{selectedProspects.length !== 1 ? 's' : ''} will be added to the selected sequence and will start receiving emails based on the sequence configuration.
                    </p>
                  </div>
                </div>
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
                disabled={loading || !selectedSequence}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Adding...
                  </span>
                ) : (
                  'Add to Sequence'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default AddToSequenceModal;
