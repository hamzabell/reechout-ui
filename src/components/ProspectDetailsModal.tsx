import React, { useState } from 'react';
import { FiX, FiUser, FiBriefcase, FiMapPin, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi';

interface CampaignProspect {
  id: string;
  status: string;
  pausedAt?: string;
  prospect: {
    id: string;
    name: string;
    email: string;
    company?: string;
    title?: string;
    location?: string;
    industry?: string;
    notes?: string;
    researchData?: any;
  };
  personalizedEmails: Array<{
    id: string;
    subject: string;
    body: string;
    status: string;
  }>;
}

interface ProspectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: CampaignProspect | null;
  onPauseProspect?: (prospectId: string) => Promise<void>;
  onResumeProspect?: (prospectId: string) => Promise<void>;
  onDeleteProspect?: (prospectId: string, prospectName: string) => Promise<void>;
  isUpdating?: boolean;
}

const ProspectDetailsModal: React.FC<ProspectDetailsModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onPauseProspect,
  onResumeProspect,
  onDeleteProspect,
  isUpdating = false
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !prospect) return null;

  const handlePauseResume = async () => {
    if (!prospect.prospect?.id) return;
    
    if (prospect.pausedAt) {
      await onResumeProspect?.(prospect.prospect.id);
    } else {
      await onPauseProspect?.(prospect.prospect.id);
    }
  };

  const handleDelete = async () => {
    if (!prospect.prospect?.id) return;
    
    setIsDeleting(true);
    try {
      await onDeleteProspect?.(prospect.prospect.id, prospect.prospect.name);
      // Close modal immediately after triggering delete
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-gray-100 text-gray-800';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800';
      case 'ENGAGED': return 'bg-green-100 text-green-800';
      case 'REPLIED': return 'bg-purple-100 text-purple-800';
      case 'INTERESTED': return 'bg-yellow-100 text-yellow-800';
      case 'CONVERTED': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Prospect Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Prospect Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{prospect.prospect.name}</h3>
                    <p className="text-sm text-gray-500">{prospect.prospect.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prospect.pausedAt ? 'bg-orange-100 text-orange-800' :
                    prospect.status === 'ENDED' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {prospect.pausedAt ? 'Paused' :
                     prospect.status === 'ENDED' ? 'Ended' :
                     'Running'}
                  </span>
                </div>
              </div>

              {/* Prospect Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {prospect.prospect.company && (
                  <div className="flex items-center space-x-2">
                    <FiBriefcase className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-sm font-medium text-gray-900">{prospect.prospect.company}</p>
                    </div>
                  </div>
                )}
                
                {prospect.prospect.title && (
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Title</p>
                      <p className="text-sm font-medium text-gray-900">{prospect.prospect.title}</p>
                    </div>
                  </div>
                )}
                
                {prospect.prospect.location && (
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">{prospect.prospect.location}</p>
                    </div>
                  </div>
                )}
                
                {prospect.prospect.industry && (
                  <div className="flex items-center space-x-2">
                    <FiBriefcase className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Industry</p>
                      <p className="text-sm font-medium text-gray-900">{prospect.prospect.industry}</p>
                    </div>
                  </div>
                )}
              </div>

              {prospect.prospect.notes && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{prospect.prospect.notes}</p>
                </div>
              )}
            </div>

            {/* Research Brief */}
            {prospect.prospect.researchData && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Research Brief</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {prospect.prospect.researchData.companyOverview && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Company Overview</p>
                      <p className="text-sm text-blue-700">{prospect.prospect.researchData.companyOverview}</p>
                    </div>
                  )}
                  
                  {prospect.prospect.researchData.keyInsights && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Key Insights</p>
                      <ul className="text-sm text-blue-700 list-disc list-inside">
                        {prospect.prospect.researchData.keyInsights.map((insight: string, index: number) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {prospect.prospect.researchData.recentActivity && (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Recent Activity</p>
                      <p className="text-sm text-blue-700">{prospect.prospect.researchData.recentActivity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Activity */}
            {prospect.personalizedEmails && prospect.personalizedEmails.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Email Activity</h4>
                <div className="space-y-2">
                  {prospect.personalizedEmails.slice(0, 3).map((email) => (
                    <div key={email.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{email.subject}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          email.status === 'sent' ? 'bg-green-100 text-green-800' :
                          email.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {email.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{email.body}</p>
                    </div>
                  ))}
                  {prospect.personalizedEmails.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{prospect.personalizedEmails.length - 3} more emails
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              {(onPauseProspect || onResumeProspect) && (
                <button
                  onClick={handlePauseResume}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {prospect.pausedAt ? (
                    <>
                      <FiPlay className="w-4 h-4" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <FiPause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {onDeleteProspect && (
              <button
                onClick={handleDelete}
                disabled={isDeleting || isUpdating}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Remove from Campaign'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectDetailsModal;