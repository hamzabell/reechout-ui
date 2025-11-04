import React, { useState } from 'react';

interface SequencesSidebarProps {
  selectedFolder: string;
  selectedFilter: string;
  searchTerm: string;
  onFolderChange: (folder: string) => void;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
  campaignsCount: number;
}

const SequencesSidebar: React.FC<SequencesSidebarProps> = ({
  selectedFolder,
  selectedFilter,
  searchTerm,
  onFolderChange,
  onFilterChange,
  onSearchChange,
  campaignsCount,
}) => {
  const folders = [
    { id: 'all', name: 'All Campaigns', icon: 'fas fa-inbox', count: campaignsCount },
    { id: 'active', name: 'Active', icon: 'fas fa-play-circle', count: null },
    { id: 'draft', name: 'Drafts', icon: 'fas fa-file-alt', count: null },
    { id: 'scheduled', name: 'Scheduled', icon: 'fas fa-clock', count: null },
    { id: 'completed', name: 'Completed', icon: 'fas fa-check-circle', count: null },
    { id: 'paused', name: 'Paused', icon: 'fas fa-pause-circle', count: null },
  ];

  const quickFilters = [
    { id: 'all', label: 'All' },
    { id: 'high-performing', label: 'High Performing' },
    { id: 'needs-attention', label: 'Needs Attention' },
    { id: 'recent', label: 'Recent' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col hidden lg:block">
      {/* Search */}
      <div className="p-4 border-b border-slate-200">
        <input
          type="text"
          placeholder="Search sequences..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field text-sm"
        />
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Folders
          </h3>
          <nav className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <i className={`${folder.icon} mr-3 text-gray-400 w-4`} />
                  {folder.name}
                </div>
                {folder.count !== null && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Filters */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Filters
          </h3>
          <div className="space-y-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedFilter === filter.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <i className="fas fa-plus mr-2" />
            New Sequence
          </button>
        </div>
      </div>
    </div>
  );
};

export default SequencesSidebar;