import React, { useState } from 'react';

interface SequencesMobileHeaderProps {
  searchTerm: string;
  selectedFolder: string;
  onSearchChange: (search: string) => void;
  onFolderChange: (folder: string) => void;
  onCreateSequence: () => void;
  campaignsCount: number;
}

const SequencesMobileHeader: React.FC<SequencesMobileHeaderProps> = ({
  searchTerm,
  selectedFolder,
  onSearchChange,
  onFolderChange,
  onCreateSequence,
  campaignsCount,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const folders = [
    { id: 'all', name: 'All Sequences', count: campaignsCount },
    { id: 'active', name: 'Active', count: null },
    { id: 'draft', name: 'Drafts', count: null },
    { id: 'scheduled', name: 'Scheduled', count: null },
    { id: 'completed', name: 'Completed', count: null },
    { id: 'paused', name: 'Paused', count: null },
  ];

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
      {/* Mobile Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Sequences</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <i className="fas fa-filter" />
            </button>
            <button
              onClick={onCreateSequence}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
            >
              <i className="fas fa-plus" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search sequences..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Mobile Filters */}
      {showMobileMenu && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    onFolderChange(folder.id);
                    setShowMobileMenu(false);
                  }}
                  className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                    selectedFolder === folder.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {folder.name}
                  {folder.count !== null && (
                    <span className="ml-1 text-xs opacity-75">({folder.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequencesMobileHeader;