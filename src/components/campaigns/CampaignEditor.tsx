import React, { useState } from 'react';
import ModalWrapper from '../ModalWrapper';
import {
  FiX,
  FiSave,
  FiTrash2,
  FiTarget,
  FiClock,
  FiSettings,
  FiPlus,
  FiSearch,
  FiUserPlus,
  FiEdit3,
  FiUsers,
} from 'react-icons/fi';

interface CampaignStep {
  id: string;
  stepNumber: number;
  delayDays: number;
  delayHours?: number;
  name?: string;
  description?: string;
  emailAction?: {
    id: string;
    templateId?: string;
    customSubject?: string;
    customBody?: string;
    enablePersonalization: boolean;
    template?: {
      id: string;
      name: string;
      subject: string;
      body: string;
    };
  };
  taskAction?: {
    id: string;
    taskTitle: string;
    taskDescription?: string;
    enableEmailNotification: boolean;
  };
}

interface CampaignProspect {
  id: string;
  status: string;
  prospect: {
    id: string;
    name: string;
    email: string;
    company?: string;
    title?: string;
  };
  personalizedEmails: Array<{
    id: string;
    subject: string;
    status: string;
    stepEmailAction: {
      step: {
        stepNumber: number;
        name?: string;
      };
    };
  }>;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  sendTime?: string;
  timezone?: string;
  dailyLimit?: number;
  steps?: CampaignStep[];
  campaignProspects?: CampaignProspect[];
  statistics?: {
    totalSteps: number;
    emailSteps: number;
    taskSteps: number;
    totalProspects: number;
    activeProspects: number;
    completedProspects: number;
  };
}

interface CampaignEditorProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCampaign: Campaign) => void;
  onDelete?: () => void;
  onAddProspects?: () => void;
}

const CampaignEditor: React.FC<CampaignEditorProps> = ({
  campaign,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onAddProspects,
}) => {
  const [editedCampaign, setEditedCampaign] = useState<Campaign>({ ...campaign });
  const [activeTab, setActiveTab] = useState<'basic' | 'settings' | 'prospects'>('basic');

  const handleSave = () => {
    onSave(editedCampaign);
    onClose();
  };

  const updateCampaign = (updates: Partial<Campaign>) => {
    setEditedCampaign(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Sequence</h2>
                <p className="text-sm text-gray-600 mt-1">Update sequence details and settings</p>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && campaign.status === 'DRAFT' && (
                  <button
                    onClick={onDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete sequence"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'basic', label: 'Basic Info', icon: FiTarget },
              { id: 'settings', label: 'Settings', icon: FiSettings },
              { id: 'prospects', label: 'Prospects', icon: FiUserPlus },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sequence Name
                  </label>
                  <input
                    type="text"
                    value={editedCampaign.name}
                    onChange={(e) => updateCampaign({ name: e.target.value })}
                    placeholder="Enter sequence name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editedCampaign.description || ''}
                    onChange={(e) => updateCampaign({ description: e.target.value })}
                    placeholder="Describe your sequence objectives and what it aims to achieve..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editedCampaign.status}
                    onChange={(e) => updateCampaign({ status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Campaign Timeline Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sequence Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {new Date(editedCampaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {editedCampaign.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="text-gray-900">
                          {new Date(editedCampaign.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {editedCampaign.pausedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paused:</span>
                        <span className="text-gray-900">
                          {new Date(editedCampaign.pausedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {editedCampaign.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-gray-900">
                          {new Date(editedCampaign.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send Time
                    </label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="time"
                        value={editedCampaign.sendTime || '09:00'}
                        onChange={(e) => updateCampaign({ sendTime: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editedCampaign.dailyLimit || 50}
                      onChange={(e) => updateCampaign({ dailyLimit: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={editedCampaign.timezone || 'America/New_York'}
                    onChange={(e) => updateCampaign({ timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiSettings className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Delivery Settings</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        These settings control when and how many emails are sent per day.
                        Sequences will respect the daily limit and send at the specified time in the chosen timezone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {activeTab === 'prospects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sequence Prospects</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage prospects for this sequence
                    </p>
                  </div>
                  <button
                    onClick={onAddProspects}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Prospects
                  </button>
                </div>

                {/* Prospects Search and Filter */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search prospects by name, email, or company..."
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Mock Prospects List */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Current Prospects</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[
                      {
                        id: 'prospect_1',
                        name: 'Sarah Johnson',
                        email: 'sarah.johnson@techcorp.com',
                        company: 'TechCorp Inc.',
                        title: 'Marketing Director',
                        status: 'ACTIVE'
                      },
                      {
                        id: 'prospect_2',
                        name: 'Michael Chen',
                        email: 'michael.chen@innovate.co',
                        company: 'Innovate & Co',
                        title: 'CEO',
                        status: 'PENDING'
                      }
                    ].map((prospect) => (
                      <div key={prospect.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium text-gray-900">{prospect.name}</h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                prospect.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {prospect.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{prospect.email}</p>
                            <p className="text-sm text-gray-500">
                              {prospect.title} at {prospect.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiUsers className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Prospect Management</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Add prospects to your sequence and track their engagement.
                        You can import prospects from CSV, add them manually, or sync from your CRM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Sequence ID: {editedCampaign.id}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
    </ModalWrapper>
  );
};

export default CampaignEditor;