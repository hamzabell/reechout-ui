import React, { useState, useEffect, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import { useProspects } from '../hooks/useProspectsSWR';
import { FiSearch, FiUsers, FiCheck, FiX } from 'react-icons/fi';

interface AddProspectsToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProspects: (prospectIds: string[]) => Promise<void>;
  campaignId: string;
  existingProspectIds: string[];
  loading?: boolean;
}

const AddProspectsToCampaignModal: React.FC<AddProspectsToCampaignModalProps> = ({
  isOpen,
  onClose,
  onAddProspects,
  campaignId,
  existingProspectIds,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all prospects
  const { prospects, isLoading, error } = useProspects({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100
  });

  // Filter out prospects already in campaign
  const availableProspects = useMemo(() => {
    return prospects.filter(prospect => !existingProspectIds.includes(prospect.id));
  }, [prospects, existingProspectIds]);

  // Handle prospect selection
  const handleProspectToggle = (prospectId: string) => {
    setSelectedProspectIds(prev => 
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProspectIds.length === availableProspects.length) {
      setSelectedProspectIds([]);
    } else {
      setSelectedProspectIds(availableProspects.map(p => p.id));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProspectIds.length > 0) {
      await onAddProspects(selectedProspectIds);
      setSelectedProspectIds([]);
      setSearchTerm('');
      onClose();
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProspectIds([]);
      setSearchTerm('');
      setStatusFilter('all');
    }
  }, [isOpen]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'engaged': return 'bg-green-100 text-green-800';
      case 'replied': return 'bg-purple-100 text-purple-800';
      case 'interested': return 'bg-yellow-100 text-yellow-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Add Prospects to Campaign</h3>
                <p className="text-sm text-gray-500">
                  Select prospects to add to this campaign
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search prospects by name, email, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="ENGAGED">Engaged</option>
                <option value="REPLIED">Replied</option>
                <option value="INTERESTED">Interested</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="CONVERTED">Converted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {/* Select All */}
            {availableProspects.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProspectIds.length === availableProspects.length}
                    onChange={handleSelectAll}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({selectedProspectIds.length} of {availableProspects.length} selected)
                  </span>
                </label>
              </div>
            )}

            {/* Prospects List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Loading prospects...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error loading prospects: {error}</p>
                </div>
              ) : availableProspects.length === 0 ? (
                <div className="text-center py-8">
                  <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No available prospects</h3>
                  <p className="text-gray-500">
                    {prospects.length > 0 
                      ? 'All prospects are already in this campaign'
                      : 'No prospects found. Try adjusting your search or filters.'
                    }
                  </p>
                </div>
              ) : (
                availableProspects.map((prospect) => (
                  <label
                    key={prospect.id}
                    className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProspectIds.includes(prospect.id)}
                      onChange={() => handleProspectToggle(prospect.id)}
                      className="mt-1 mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {prospect.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {prospect.email}
                          </p>
                          {prospect.company && (
                            <p className="text-xs text-gray-400 truncate">
                              {prospect.company}
                              {prospect.title && ` • ${prospect.title}`}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(prospect.status)}`}>
                          {prospect.status}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Selected Prospects Summary */}
            {selectedProspectIds.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>{selectedProspectIds.length}</strong> prospect{selectedProspectIds.length !== 1 ? 's' : ''} selected to be added to the campaign.
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
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedProspectIds.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding...
                  </span>
                ) : (
                  `Add ${selectedProspectIds.length} Prospect${selectedProspectIds.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default AddProspectsToCampaignModal;