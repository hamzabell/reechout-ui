import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Campaign } from '../types';
// import EmailApprovalDashboard from '../components/EmailApprovalDashboard';
// import CampaignScheduler from '../components/CampaignScheduler';
// import CampaignAnalyticsComponent from '../components/CampaignAnalytics';
import Button from '../components/Button';
import { generateBlankSequenceId } from '../services/campaignUtils';
import CampaignCard from '../components/sequences/CampaignCard';
import SequencesStatsBar from '../components/sequences/SequencesStatsBar';
import DuplicateCampaignModal from '../components/DuplicateCampaignModal';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useCampaigns, useDeleteCampaign, useDuplicateCampaign, useCreateSequence } from '../hooks/useCampaigns';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'overview' | 'create' | 'approval' | 'schedule' | 'details';



const SequencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [campaignToDuplicate, setCampaignToDuplicate] = useState<Campaign | null>(null);
  
  // Hooks for toasts
  const { showToast } = useToast();
  const { confirmWarning } = useConfirm();
  const { user } = useAuth();

  // Fetch campaigns using real API
  const { campaigns, total, isLoading, error, mutate: mutateCampaigns } = useCampaigns({
    search: searchTerm,
    limit: 50,
    offset: 0
  });

  // Mutation hooks
  const { trigger: deleteCampaign } = useDeleteCampaign();
  const { trigger: duplicateCampaign } = useDuplicateCampaign();
  const { trigger: createSequence, isMutating } = useCreateSequence();

  const sequences = campaigns;
  const selectedSequence = sequences.find(s => s.id === selectedSequenceId) || null;

  // Sequences are already filtered by the API
  const filteredSequences = sequences;

  // Refresh campaigns list when component mounts or user returns to this page
  useEffect(() => {
    // Force a refresh to ensure we have the latest data
    mutateCampaigns();
  }, [mutateCampaigns]);

  const handleCreateSequence = async () => {
    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // Create optimistic placeholder for immediate UI feedback
      const tempSequenceId = `temp-${Date.now()}`;
      const optimisticSequence = {
        id: tempSequenceId,
        name: 'New Sequence',
        description: '',
        status: 'draft',
        sent: 0,
        opens: 0,
        replies: 0,
        replyRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalProspects: 0,
        openRate: 0,
        clickRate: 0,
        deliveredRate: 0,
        prospects: []
      };

      // Optimistically add to UI
      mutateCampaigns(
        (current: any) => {
          if (!current || !current.campaigns) return current;
          return {
            ...current,
            campaigns: [optimisticSequence, ...current.campaigns],
            total: current.total + 1
          };
        },
        false // Don't revalidate yet
      );

      // Create the sequence via API
      const result = await createSequence({
        userId: user.id,
        sequenceData: {} // Use default empty sequence data
      });

      if (result?.sequenceId) {
        // Navigate to the newly created sequence
        navigate(`/dashboard/campaigns/${result.sequenceId}`);
        showToast('New sequence created successfully!', 'success');
        
        // Force refresh the campaigns list to replace temp with real data
        setTimeout(() => {
          mutateCampaigns();
        }, 100);
      } else {
        throw new Error('Failed to create sequence - no ID returned');
      }
    } catch (error: any) {
      console.error('Error creating sequence:', error);
      showToast(error?.message || 'Failed to create sequence', 'error');
      
      // Rollback optimistic update and revalidate
      mutateCampaigns();
      
      // Fallback: generate a UUID and navigate anyway (for offline/demo mode)
      const newSequenceId = generateBlankSequenceId();
      navigate(`/dashboard/campaigns/${newSequenceId}`);
    }
  };

  const handleSelectSequence = useCallback((sequence: Campaign) => {
    setSelectedSequenceId(sequence.id);
  }, []);

  const handleDeleteSequence = useCallback(async (sequenceId: string) => {
    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    confirmWarning({
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
      onConfirm: async () => {
        try {
          // 1. Optimistically remove from UI
          mutateCampaigns(
            (current: any) => {
              if (!current || !current.campaigns) return current;
              return {
                ...current,
                campaigns: current.campaigns.filter((c: Campaign) => c.id !== sequenceId)
              };
            },
            false // CRITICAL: false prevents immediate revalidation
          );
          
          // 2. Make API call in background
          await deleteCampaign({
            campaignId: sequenceId,
            userId: user.id
          });
          
          // 3. Silently revalidate to ensure consistency
          mutateCampaigns();
          
          // 4. Show success notification
          showToast('Campaign deleted successfully!', 'success');
          
          // 5. Clear selection if this was the selected sequence
          if (selectedSequenceId === sequenceId) {
            setSelectedSequenceId(null);
            setViewMode('overview');
          }
          
        } catch (error: any) {
          // 5. Show error and revalidate to rollback optimistic update
          showToast(error?.message || 'Failed to delete campaign', 'error');
          mutateCampaigns(); // Rollback by revalidating
        }
      }
    });
  }, [user, selectedSequenceId, confirmWarning, showToast, deleteCampaign, mutateCampaigns]);

  const handleDuplicateSequence = useCallback(async (sequence: Campaign) => {
    if (!user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    // Open the duplicate modal instead of using browser alert
    setCampaignToDuplicate(sequence);
    setDuplicateModalOpen(true);
  }, [user, showToast]);

  const handleDuplicateConfirm = useCallback(async (name: string) => {
    if (!user?.id || !campaignToDuplicate) return;

    try {
      // 1. Create optimistic duplicate with temp ID
      const optimisticCampaign = {
        ...campaignToDuplicate,
        id: `temp-dup-${Date.now()}`,
        name: name,
        status: 'draft',
        sent: 0,
        opens: 0,
        replies: 0,
        replyRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalProspects: campaignToDuplicate.prospects?.length || 0,
        openRate: 0,
        clickRate: 0,
        deliveredRate: 0
      };
      
      // 2. Optimistically add to UI (false = don't revalidate)
      mutateCampaigns(
        (current: any) => {
          if (!current) {
            return {
              campaigns: [optimisticCampaign],
              total: 1,
              hasMore: false
            };
          }
          return {
            ...current,
            campaigns: [optimisticCampaign, ...(current?.campaigns || [])]
          };
        },
        false // CRITICAL: false prevents immediate revalidation
      );
      
      // 3. Close modal immediately
      setDuplicateModalOpen(false);
      setCampaignToDuplicate(null);
      
      // 4. Make API call in background
      await duplicateCampaign({
        campaignId: campaignToDuplicate.id,
        userId: user.id,
        name: name
      });
      
      console.log('Duplicate API call completed successfully');
      
      // 5. Silently revalidate to replace temp ID with real ID
      await mutateCampaigns();
      
      // 6. Show success notification
      showToast('Campaign duplicated successfully!', 'success');
      
    } catch (error: any) {
      // 7. Show error and revalidate to rollback optimistic update
      console.error('Campaign duplication error:', error);
      showToast(error?.message || 'Failed to duplicate campaign', 'error');
      mutateCampaigns(); // Rollback by revalidating
    }
  }, [user, campaignToDuplicate, showToast, duplicateCampaign, mutateCampaigns]);

  const handlePauseResumeSequence = useCallback((sequence: Campaign) => {
    // Frontend-only - just show an info message
    if (sequence.status === 'paused') {
      showToast('Sequence resumed (demo mode)', 'success');
    } else {
      showToast('Sequence paused (demo mode)', 'success');
    }
  }, [showToast]);


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

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              placeholder="Search sequences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
          </div>
          <Button 
            onClick={handleCreateSequence} 
            loading={isMutating}
            icon={<i className="fas fa-plus" />}
          >
            Create Sequence
          </Button>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-text-secondary">Loading sequences...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              placeholder="Search sequences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
          </div>
          <Button 
            onClick={handleCreateSequence} 
            loading={isMutating}
            icon={<i className="fas fa-plus" />}
          >
            Create Sequence
          </Button>
        </div>
        
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Error Loading Sequences
          </h3>
          <p className="text-text-secondary mb-6">
            {typeof error === 'string' ? error : error?.message || 'Failed to load your sequences. Please try again.'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            icon={<i className="fas fa-redo" />}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
        <Button 
          onClick={handleCreateSequence} 
          loading={isMutating}
          icon={<i className="fas fa-plus" />}
        >
          Create Sequence
        </Button>
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
            <Button 
              onClick={handleCreateSequence} 
              loading={isMutating}
              icon={<i className="fas fa-plus" />}
            >
              Create Your First Sequence
            </Button>
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
      
      {/* Duplicate Campaign Modal */}
      {campaignToDuplicate && (
        <DuplicateCampaignModal
          isOpen={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setCampaignToDuplicate(null);
          }}
          onConfirm={handleDuplicateConfirm}
          campaignName={campaignToDuplicate.name}
        />
      )}
    </div>
  );
};

export default SequencesPage;
