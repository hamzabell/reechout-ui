import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Campaign } from '../types';
// import EmailApprovalDashboard from '../components/EmailApprovalDashboard';
// import CampaignScheduler from '../components/CampaignScheduler';
// import CampaignAnalyticsComponent from '../components/CampaignAnalytics';
import Button from '../components/Button';
import { generateBlankSequenceId } from '../services/campaignUtils';
import CampaignCard from '../components/sequences/CampaignCard';
import SequencesStatsBar from '../components/sequences/SequencesStatsBar';
import { useAlert } from '../hooks/useAlert';
import { useConfirm } from '../hooks/useConfirm';

type ViewMode = 'overview' | 'create' | 'approval' | 'schedule' | 'details';

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Welcome Series',
    description: 'Onboarding sequence for new subscribers',
    status: 'sending',
    sent: 245,
    opens: 186,
    replies: 42,
    replyRate: 17.1,
    prospects: ['prospect_1', 'prospect_2', 'prospect_3', 'prospect_4', 'prospect_5'],
    templateId: 'template_1',
    settings: {
      sendImmediately: false,
      scheduledDate: '2024-01-15T10:00:00Z',
      dailyLimit: 50,
      sendTime: '09:00',
      timezone: 'America/New_York',
      enableFollowUps: true,
      followUpDelay: 3,
      trackOpens: true,
      trackClicks: true,
      personalizationLevel: 'ai-powered',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    createdBy: 'user_1',
    startDate: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Product Launch',
    description: 'Announcing our latest features',
    status: 'scheduled',
    sent: 0,
    opens: 0,
    replies: 0,
    replyRate: 0,
    prospects: ['prospect_6', 'prospect_7', 'prospect_8'],
    templateId: 'template_2',
    settings: {
      sendImmediately: false,
      scheduledDate: '2024-01-20T14:30:00Z',
      dailyLimit: 100,
      sendTime: '10:00',
      timezone: 'America/New_York',
      enableFollowUps: true,
      followUpDelay: 2,
      trackOpens: true,
      trackClicks: true,
      personalizationLevel: 'advanced',
    },
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:30:00Z',
    createdBy: 'user_1',
    scheduledDate: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    name: 'Re-engagement Sequence',
    description: 'Bring back inactive users',
    status: 'completed',
    sent: 512,
    opens: 298,
    replies: 87,
    replyRate: 17.0,
    prospects: ['prospect_9', 'prospect_10', 'prospect_11', 'prospect_12'],
    templateId: 'template_3',
    settings: {
      sendImmediately: true,
      dailyLimit: 75,
      sendTime: '11:00',
      timezone: 'America/New_York',
      enableFollowUps: false,
      trackOpens: true,
      trackClicks: true,
      personalizationLevel: 'basic',
    },
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    createdBy: 'user_1',
    startDate: '2024-01-10T09:15:00Z',
    completedDate: '2024-01-12T16:45:00Z',
  },
  {
    id: '4',
    name: 'Newsletter January',
    description: 'Monthly newsletter and updates',
    status: 'draft',
    sent: 0,
    opens: 0,
    replies: 0,
    replyRate: 0,
    prospects: ['prospect_13', 'prospect_14', 'prospect_15'],
    templateId: 'template_4',
    settings: {
      sendImmediately: false,
      scheduledDate: '2024-01-25T11:20:00Z',
      dailyLimit: 200,
      sendTime: '09:30',
      timezone: 'America/New_York',
      enableFollowUps: false,
      trackOpens: true,
      trackClicks: true,
      personalizationLevel: 'basic',
    },
    createdAt: '2024-01-13T11:20:00Z',
    updatedAt: '2024-01-13T11:20:00Z',
    createdBy: 'user_1',
  },
  {
    id: '5',
    name: 'Holiday Promotion',
    description: 'Special offers for the holiday season',
    status: 'paused',
    sent: 128,
    opens: 94,
    replies: 21,
    replyRate: 16.4,
    prospects: ['prospect_16', 'prospect_17', 'prospect_18', 'prospect_19'],
    templateId: 'template_5',
    settings: {
      sendImmediately: true,
      dailyLimit: 60,
      sendTime: '14:00',
      timezone: 'America/New_York',
      enableFollowUps: true,
      followUpDelay: 5,
      trackOpens: true,
      trackClicks: true,
      personalizationLevel: 'advanced',
    },
    createdAt: '2024-01-08T16:00:00Z',
    updatedAt: '2024-01-11T13:30:00Z',
    createdBy: 'user_1',
    startDate: '2024-01-08T16:00:00Z',
  },
];

const SequencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Hooks for modals
  const { showSuccess } = useAlert();
  const { confirmWarning } = useConfirm();

  // Use mock data instead of API calls
  const sequences = mockCampaigns;
  const selectedSequence = sequences.find(s => s.id === selectedSequenceId) || null;

  // Filter sequences based on search term
  const filteredSequences = useMemo(() => {
    let filtered = [...sequences];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sequence =>
        sequence.name.toLowerCase().includes(searchLower) ||
        (sequence.description && sequence.description.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [sequences, searchTerm]);

  const handleCreateSequence = () => {
    const newSequenceId = generateBlankSequenceId();
    navigate(`/dashboard/campaigns/${newSequenceId}`);
  };

  const handleSelectSequence = useCallback((sequence: Campaign) => {
    setSelectedSequenceId(sequence.id);
  }, []);

  const handleDeleteSequence = useCallback((sequenceId: string) => {
    confirmWarning({
      title: 'Delete Sequence',
      message: 'Are you sure you want to delete this sequence? This is a demo version - no actual data will be deleted.',
      onConfirm: () => {
        showSuccess('Sequence deleted successfully (demo mode)');
        if (selectedSequenceId === sequenceId) {
          setSelectedSequenceId(null);
          setViewMode('overview');
        }
      }
    });
  }, [selectedSequenceId, confirmWarning, showSuccess]);

  const handleDuplicateSequence = useCallback((sequence: Campaign) => {
    const newName = window.prompt('Enter a name for the duplicated sequence:', `${sequence.name} (Copy)`);
    if (newName) {
      // Frontend-only - just show a success message
      showSuccess('Sequence duplicated successfully (demo mode)');
    }
  }, [showSuccess]);

  const handlePauseResumeSequence = useCallback((sequence: Campaign) => {
    // Frontend-only - just show an info message
    if (sequence.status === 'paused') {
      showSuccess('Sequence resumed (demo mode)');
    } else {
      showSuccess('Sequence paused (demo mode)');
    }
  }, [showSuccess]);


  const getSequenceStats = () => {
    const total = sequences.length;
    const active = sequences.filter(s => s.status === 'sending' || s.status === 'scheduled').length;
    const completed = sequences.filter(s => s.status === 'completed').length;
    const totalSent = sequences.reduce((sum, s) => sum + s.sent, 0);
    const avgReplyRate = sequences.length > 0
      ? (sequences.reduce((sum, s) => sum + s.replyRate, 0) / sequences.length).toFixed(1)
      : '0';
    const avgOpenRate = sequences.length > 0
      ? (sequences.reduce((sum, s) => {
          const openRate = s.sent > 0 ? (s.opens / s.sent) * 100 : 0;
          return sum + openRate;
        }, 0) / sequences.length).toFixed(1)
      : '0';

    return { total, active, completed, totalSent, avgReplyRate, avgOpenRate };
  };

  // No loading or error states needed for frontend-only version

  // Render different views based on viewMode
  if (viewMode === 'approval' && selectedSequence) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => setViewMode('overview')}
              className="text-primary hover:text-primary/80 mb-2"
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to Sequences
            </button>
            <h2 className="text-2xl font-bold text-text-primary">
              Email Approval - {selectedSequence.name}
            </h2>
            <p className="text-text-secondary">Review and approve generated emails</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={() => setViewMode('schedule')}
            >
              <i className="fas fa-calendar mr-2" />
              Schedule Approved
            </Button>
          </div>
        </div>

        {/* <EmailApprovalDashboard
          sequenceId={selectedSequence.id}
          onApproveAll={(approvedEmails) => {
            setViewMode('schedule');
          }}
          onSchedule={(scheduledEmails) => {
            setViewMode('overview');
          }}
        /> */}
      </div>
    );
  }

  if (viewMode === 'schedule' && selectedSequence) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => setViewMode('overview')}
              className="text-primary hover:text-primary/80 mb-2"
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to Sequences
            </button>
            <h2 className="text-2xl font-bold text-text-primary">
              Schedule Sequence - {selectedSequence.name}
            </h2>
            <p className="text-text-secondary">Configure email delivery settings</p>
          </div>
        </div>

        {/* <SequenceScheduler
          sequence={selectedSequence}
          emails={sequenceEmails}
          onSchedule={(scheduledEmails) => {
            setViewMode('overview');
            showToast('Sequence scheduled successfully!', 'success');
          }}
          onSend={(sentEmails) => {
            setViewMode('overview');
            showToast('Sequence started successfully!', 'success');
          }}
        /> */}
      </div>
    );
  }

  
  // Main overview view with landing page inspired design
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Search sequences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-64"
          />
        </div>
        <button onClick={handleCreateSequence} className="btn-primary">
          <i className="fas fa-plus mr-2" />
          Create Sequence
        </button>
      </div>

      {/* Stats Bar */}
      <SequencesStatsBar
        totalSequences={getSequenceStats().total}
        activeSequences={getSequenceStats().active}
        completedSequences={getSequenceStats().completed}
        totalEmailsSent={getSequenceStats().totalSent}
        averageReplyRate={getSequenceStats().avgReplyRate}
        averageOpenRate={getSequenceStats().avgOpenRate}
      />

      {/* Sequence Grid */}
      {filteredSequences.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-bullhorn text-blue-600 text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            {searchTerm ? 'No sequences found' : 'No sequences yet'}
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search terms or browse all sequences'
              : 'Create your first sequence to start sending personalized emails to your prospects'
            }
          </p>
          {!searchTerm && (
            <button onClick={handleCreateSequence} className="btn-primary">
              <i className="fas fa-plus mr-2" />
              Create Your First Sequence
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSequences.map((sequence) => (
            <CampaignCard
              key={sequence.id}
              campaign={sequence}
              onView={(sequence) => navigate(`/dashboard/campaigns/${sequence.id}`)}
              onEdit={(sequence) => navigate(`/dashboard/campaigns/${sequence.id}`)}
              onDelete={handleDeleteSequence}
              onPauseResume={handlePauseResumeSequence}
              onDuplicate={handleDuplicateSequence}
              onApprove={(sequence) => {
                handleSelectSequence(sequence);
                setViewMode('approval');
              }}
              onSchedule={(sequence) => {
                handleSelectSequence(sequence);
                setViewMode('schedule');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SequencesPage;
