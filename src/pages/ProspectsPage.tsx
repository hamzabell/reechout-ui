import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mutate as globalMutate } from 'swr';
import { useProspects, useUpdateProspect } from '../hooks/useProspectsSWR';
import { useSWRMutation } from '../hooks/useSWRMutation';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useNeon } from '../providers/NeonProvider';
import { Prospect, ProspectStatus } from '../types';
import Button from '../components/Button';
import ModalWrapper from '../components/ModalWrapper';
import UpdateStatusModal from '../components/UpdateStatusModal';
import { post } from '../services/apiService';
import { parseCSV, validateProspects, generateCSVTemplate } from '../utils/csvParser';

const ProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirmDanger } = useConfirm();
  const { authState } = useNeon();
  
  // Fetch prospects using SWR
  const { prospects, isLoading, error, mutate: mutateProspects } = useProspects();
  
  // Mutation hooks
  const { trigger: updateProspect } = useUpdateProspect();
  const { trigger: deleteProspect } = useSWRMutation('/prospects-delete-prospect', 'DELETE', {
    invalidateQueries: ['/prospects-list-prospects']
  });

  // TODO: Re-enable when campaigns/advanced endpoint is fixed
  // const { campaigns = [] } = useCampaigns({ status: 'draft' });
  const campaigns: any[] = []; // Temporary: Using empty array until campaigns endpoint is fixed

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showAddToCampaignModal, setShowAddToCampaignModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [updatingStatusProspect, setUpdatingStatusProspect] = useState<Prospect | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Apply filters and search to prospects
  const filteredProspects = React.useMemo(() => {
    let filtered = [...prospects];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Apply search query (searches name, email, company, title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query) ||
        (p.title && p.title.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [prospects, filters.status, searchQuery]);

  // Calculate pagination based on filtered results
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProspects = filteredProspects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or prospects list changes significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredProspects.length, currentPage, totalPages]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, searchQuery]);

  // Prospect selection helpers
  const toggleProspectSelection = (prospectId: string) => {
    setSelectedProspects(prev =>
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const selectAllProspects = () => {
    setSelectedProspects(filteredProspects.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProspects([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be handled by filters in the future or can trigger a revalidation
    mutateProspects();
  };

  
  const handleEditProspectClick = (lead: Prospect) => {
    navigate(`/dashboard/prospects/${lead.id}/edit`);
  };

  const handleDeleteProspect = async (prospectId: string, leadName: string) => {
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    confirmDanger({
      title: 'Delete Prospect',
      message: `Are you sure you want to delete "${leadName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // 1. Optimistically remove from UI
          mutateProspects(
            (current: any) => ({
              ...current,
              prospects: current.prospects.filter((p: any) => p.id !== prospectId)
            }),
            false
          );
          
          // Also remove from selection if selected
          setSelectedProspects(prev => prev.filter(id => id !== prospectId));
          
          // 2. Make API call
          await deleteProspect({
            id: prospectId,
            userId: authState.user!.id
          });
          
          // 3. No revalidation needed (already removed)
          showToast('Prospect deleted successfully!', 'success');
        } catch (error: any) {
          showToast(error?.message || 'Failed to delete prospect', 'error');
          mutateProspects(); // Rollback
        }
      }
    });
  };

  
  const handleOpenStatusModal = (prospect: Prospect) => {
    setUpdatingStatusProspect(prospect);
    setShowUpdateStatusModal(true);
  };

  const handleUpdateStatus = async (newStatus: ProspectStatus) => {
    if (!updatingStatusProspect || !authState.user?.id) return;

    try {
      // 1. Create updated version
      const updatedProspect = {
        ...updatingStatusProspect,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      // 2. Optimistically update UI
      mutateProspects(
        (current: any) => ({
          ...current,
          prospects: current.prospects.map((p: any) =>
            p.id === updatingStatusProspect.id ? updatedProspect : p
          )
        }),
        false // CRITICAL: false prevents immediate revalidation
      );

      // 3. Close modal immediately (instant feedback)
      setShowUpdateStatusModal(false);
      setUpdatingStatusProspect(null);

      // 4. Make API call in background AND WAIT FOR IT TO COMPLETE
      await updateProspect({
        id: updatingStatusProspect.id,
        status: newStatus,
        userId: authState.user.id
      });

      // 5. ONLY REVALIDATE AFTER API CALL SUCCEEDS
      await mutateProspects();

      showToast(`Prospect status updated to ${newStatus}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update status', 'error');
      mutateProspects(); // Rollback optimistic update
    }
  };

  const handleCloseStatusModal = () => {
    setShowUpdateStatusModal(false);
    setUpdatingStatusProspect(null);
  };

  const handleAddToCampaign = async () => {
    if (!selectedCampaign) {
      showToast('Please select a campaign', 'warning');
      return;
    }

    if (selectedProspects.length === 0) {
      showToast('Please select prospects to add', 'warning');
      return;
    }

    try {
      // Check if sequence has AI personalization enabled
      const sequence = campaigns.find(c => c.id === selectedCampaign);
      const hasAIPersonalization = sequence?.settings?.personalizationLevel === 'ai-powered' ||
                                   sequence?.settings?.personalizationLevel === 'advanced';

      // Get prospects that need research (don't have research data yet)
      const prospectsNeedingResearch = hasAIPersonalization
        ? selectedProspects.filter(prospectId => {
            const prospect = prospects.find(p => p.id === prospectId);
            return !prospect?.researchData;
          })
        : [];

      // Add prospects to sequence
      const addPromises = selectedProspects.map(prospectId =>
        fetch(`/api/campaigns/${selectedCampaign}/prospects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospectIds: [prospectId] })
        })
      );

      await Promise.all(addPromises);

      // Trigger research for prospects without cached data if sequence has AI personalization
      if (hasAIPersonalization && prospectsNeedingResearch.length > 0) {
        showToast(
          `Added ${selectedProspects.length} prospects to sequence. Starting research for ${prospectsNeedingResearch.length} prospects without cached data...`,
          'info'
        );

        // Trigger research in background
        const researchPromises = prospectsNeedingResearch.map(async (prospectId) => {
          const prospect = prospects.find(p => p.id === prospectId);
          if (prospect) {
            try {
              await fetch('/api/ai/research-prospect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prospectId: prospect.id,
                  name: prospect.name,
                  company: prospect.company,
                  website: prospect.website,
                })
              });
            } catch (error) {
              console.error(`Research failed for prospect ${prospect.id}:`, error);
            }
          }
        });

        // Don't wait for research to complete - run in background
        Promise.allSettled(researchPromises).then(() => {
          showToast('Research completed for all prospects!', 'success');
        });
      } else {
        showToast(`Added ${selectedProspects.length} prospects to sequence successfully!`, 'success');
      }

      setShowAddToCampaignModal(false);
      setSelectedCampaign('');
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add prospects to campaign', 'error');
    }
  };

  const deleteSelectedProspects = async () => {
    if (selectedProspects.length === 0) {
      showToast('Please select prospects first', 'warning');
      return;
    }

    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    confirmDanger({
      title: 'Delete Selected Prospects',
      message: `Are you sure you want to delete ${selectedProspects.length} prospect(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          // Optimistically remove from UI
          mutateProspects(
            (current: any) => ({
              ...current,
              prospects: current.prospects.filter((p: any) => !selectedProspects.includes(p.id))
            }),
            false
          );
          
          const prospectsToDelete = [...selectedProspects];
          setSelectedProspects([]);
          
          // Make API calls for each prospect
          await Promise.all(
            prospectsToDelete.map(prospectId =>
              deleteProspect({
                id: prospectId,
                userId: authState.user!.id
              })
            )
          );
          
          showToast(`Deleted ${prospectsToDelete.length} prospects successfully!`, 'success');
        } catch (error: any) {
          showToast(error?.message || 'Failed to delete prospects', 'error');
          mutateProspects(); // Rollback
        }
      }
    });
  };

  
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // Read CSV file
      const text = await file.text();

      if (!text || text.trim() === '') {
        showToast('CSV file is empty', 'error');
        setShowCSVUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      let parsedProspects;
      try {
        parsedProspects = parseCSV(text);
      } catch (parseError) {
        console.error('CSV parsing error:', parseError);
        showToast('Failed to parse CSV file. Please check the file format.', 'error');
        setShowCSVUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (parsedProspects.length === 0) {
        showToast('No valid prospects found in CSV file', 'warning');
        setShowCSVUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Validate prospects on client side
      let validation;
      try {
        validation = validateProspects(parsedProspects);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        showToast('Error validating prospects. Please check your data format.', 'error');
        setShowCSVUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (validation.valid.length === 0) {
        showToast('No valid prospects found. Please check your CSV file for required fields (Name, Email, Company).', 'error');
        setShowCSVUpload(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Show warning for invalid records but continue with valid ones
      if (validation.invalid.length > 0) {
        showToast(`Found ${validation.invalid.length} invalid records that will be skipped. Continuing with ${validation.valid.length} valid prospects.`, 'warning');
      }

      // Close modal and show processing toast
      setShowCSVUpload(false);
      showToast(`Processing ${validation.valid.length} prospects...`, 'info');

      // 1. Create optimistic prospects with temp IDs (only for valid ones)
      const optimisticProspects = validation.valid.map((p, index) => ({
        id: `temp-import-${Date.now()}-${index}`,
        name: p.name,
        email: p.email,
        company: p.company,
        title: p.title || null,
        website: p.website || null,
        phoneNumber: p.phoneNumber || null,
        industry: p.industry || null,
        location: p.location || null,
        linkedinProfile: p.linkedinProfile || null,
        notes: p.notes || null,
        tags: p.tags || [],
        source: p.source || 'CSV Import',
        status: 'NEW' as ProspectStatus,
        isOptedOut: p.isOptedOut || false,
        createdBy: authState.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: {
          id: authState.user!.id,
          name: authState.user!.name,
          email: authState.user!.email
        },
        _count: { campaignProspects: 0 }
      }));

      // 2. Optimistically add all prospects to UI
      mutateProspects(
        (current: any) => ({
          ...current,
          prospects: [...optimisticProspects, ...(current?.prospects || [])]
        }),
        false
      );

      // 3. Upload prospects individually with real-time progress reporting
      const results = {
        imported: 0,
        duplicates: 0,
        errors: 0,
        total: validation.valid.length
      };

      let currentIndex = 0;

      for (const prospect of validation.valid) {
        try {
          currentIndex++;

          // Show progress update
          showToast(`Uploading prospect ${currentIndex} of ${validation.valid.length}...`, 'info');

          // Use the existing create prospect hook
          const createData = {
            ...prospect,
            userId: authState.user!.id
          };

          // Call the create prospect endpoint directly
          const response = await post('/prospects-create-prospect', createData);

          if (response.prospect) {
            results.imported++;
            // Update the global cache to replace temp prospect with real one
            await globalMutate(
              (key: any) => Array.isArray(key) && key[0] === '/prospects-list-prospects',
              (current: any) => {
                if (!current) return current;

                // Find and replace the temp prospect with the real one
                return {
                  ...current,
                  prospects: current.prospects.map((p: any) =>
                    p.name === prospect.name && p.email === prospect.email && p.id.startsWith('temp-import-')
                      ? { ...response.prospect, _count: p._count }
                      : p
                  )
                };
              },
              { revalidate: false }
            );
          }

        } catch (error: any) {
          console.error(`Error uploading prospect ${currentIndex}:`, error);

          // Check if it's a duplicate error
          if (error.status === 409 || error.message?.includes('already exists')) {
            results.duplicates++;
            // Remove the temp prospect from the UI
            await globalMutate(
              (key: any) => Array.isArray(key) && key[0] === '/prospects-list-prospects',
              (current: any) => {
                if (!current) return current;
                return {
                  ...current,
                  prospects: current.prospects.filter((p: any) =>
                    !(p.name === prospect.name && p.email === prospect.email && p.id.startsWith('temp-import-'))
                  )
                };
              },
              { revalidate: false }
            );
          } else {
            results.errors++;
            // Remove the temp prospect from the UI
            await globalMutate(
              (key: any) => Array.isArray(key) && key[0] === '/prospects-list-prospects',
              (current: any) => {
                if (!current) return current;
                return {
                  ...current,
                  prospects: current.prospects.filter((p: any) =>
                    !(p.name === prospect.name && p.email === prospect.email && p.id.startsWith('temp-import-'))
                  )
                };
              },
              { revalidate: false }
            );
          }
        }

        // Small delay between requests to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 4. Show final success message with detailed results
      let message = `Upload complete! `;
      if (results.imported > 0) message += `${results.imported} imported`;
      if (results.duplicates > 0) message += `${results.imported > 0 ? ', ' : ''}${results.duplicates} duplicates`;
      if (results.errors > 0) message += `${results.imported > 0 || results.duplicates > 0 ? ', ' : ''}${results.errors} errors`;

      showToast(message, results.errors === 0 ? 'success' : 'warning');
      
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
      // Rollback - remove temp prospects
      await globalMutate(
        (key) => Array.isArray(key) && key[0] === '/prospects-list-prospects',
        (current: any) => {
          if (!current) return current;
          return {
            ...current,
            prospects: current.prospects.filter(
              (p: any) => !p.id.startsWith('temp-import-')
            )
          };
        },
        { revalidate: false }
      );
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      if (prospects.length === 0) {
        showToast('No prospects to export', 'warning');
        return;
      }

      // Determine which prospects to export
      const prospectsToExport = selectedProspects.length > 0
        ? prospects.filter(p => selectedProspects.includes(p.id))
        : prospects;

      // CSV Headers
      const csvHeaders = [
        'Name',
        'Email',
        'Company',
        'Title',
        'Website',
        'Phone Number',
        'Industry',
        'Location',
        'LinkedIn Profile',
        'Status',
        'Tags',
        'Notes',
        'Source',
        'Created At',
        'Updated At'
      ];

      // Helper function to escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}`;
        }
        return stringValue;
      };

      // Convert prospects to CSV rows
      const csvRows = prospectsToExport.map(prospect => [
        escapeCSV(prospect.name),
        escapeCSV(prospect.email),
        escapeCSV(prospect.company),
        escapeCSV(prospect.title || ''),
        escapeCSV(prospect.website || ''),
        escapeCSV(prospect.phoneNumber || ''),
        escapeCSV(prospect.industry || ''),
        escapeCSV(prospect.location || ''),
        escapeCSV(prospect.linkedinProfile || ''),
        escapeCSV(prospect.status),
        escapeCSV(prospect.tags?.join(', ') || ''),
        escapeCSV(prospect.notes || ''),
        escapeCSV(prospect.source || ''),
        escapeCSV(new Date(prospect.createdAt).toLocaleString()),
        escapeCSV(new Date(prospect.updatedAt).toLocaleString())
      ].join(','));

      // Combine headers and rows
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = selectedProspects.length > 0
        ? `prospects_selected_${timestamp}.csv`
        : `prospects_all_${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const exportedCount = prospectsToExport.length;
      showToast(
        selectedProspects.length > 0
          ? `Exported ${exportedCount} selected prospect${exportedCount !== 1 ? 's' : ''} successfully!`
          : `Exported all ${exportedCount} prospects successfully!`,
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Export failed', 'error');
    }
  };

  const handleBulkStatusUpdate = async (status: 'CONTACTED' | 'REPLIED' | 'NOT_INTERESTED') => {
    if (selectedProspects.length === 0) {
      showToast('Please select prospects first', 'warning');
      return;
    }

    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    try {
      // Optimistically update all selected prospects
      mutateProspects(
        (current: any) => ({
          ...current,
          prospects: current.prospects.map((p: any) =>
            selectedProspects.includes(p.id)
              ? { ...p, status, updatedAt: new Date().toISOString() }
              : p
          )
        }),
        false
      );
      
      // Make API calls for each prospect
      await Promise.all(
        selectedProspects.map(prospectId =>
          updateProspect({
            id: prospectId,
            status,
            userId: authState.user!.id
          })
        )
      );
      
      // Silently revalidate
      await mutateProspects();
      
      showToast(`Updated ${selectedProspects.length} prospects to ${status}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Update failed', 'error');
      mutateProspects(); // Rollback
    }
  };


  const handleDownloadTemplateCSV = () => {
    // Generate CSV template using utility
    const csvContent = generateCSVTemplate();

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'prospects_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Template CSV downloaded successfully!', 'success');
  };

  

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-gray-100 text-gray-800';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800';
      case 'ENGAGED':
        return 'bg-purple-100 text-purple-800';
      case 'REPLIED':
        return 'bg-green-100 text-green-800';
      case 'INTERESTED':
        return 'bg-emerald-100 text-emerald-800';
      case 'NOT_INTERESTED':
        return 'bg-red-100 text-red-800';
      case 'OPTED_OUT':
        return 'bg-orange-100 text-orange-800';
      case 'CONVERTED':
        return 'bg-indigo-100 text-indigo-800';
      case 'BOUNCED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={handleDownloadTemplateCSV} className="btn-secondary">
          <i className="fas fa-file-csv mr-2" />
          Download Template CSV
        </button>
        <button onClick={() => navigate('/dashboard/prospects/add')} className="btn-primary">
          <i className="fas fa-plus mr-2" />
          Add Prospect
        </button>
      </div>

      {/* Actions Bar */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full text-sm"
              />
            </form>

            {/* Filters */}
            <div className="flex gap-3 items-center">
              <div className="relative">
                <select
                  value={filters.status || ''}
                  onChange={(e) => {
                    setFilters({ status: e.target.value || undefined });
                  }}
                  className="input-field pr-8"
                >
                  <option value="">All Status</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="ENGAGED">Engaged</option>
                  <option value="REPLIED">Replied</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                  <option value="OPTED_OUT">Opted Out</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="BOUNCED">Bounced</option>
                </select>
                {filters.status && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
              
              {(filters.status || searchQuery) && (
                <button
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900 underline"
                  title="Clear all filters"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowCSVUpload(true)} className="btn-secondary">
                <i className="fas fa-upload mr-2" />
                Import
              </button>
              <button onClick={handleExport} className="btn-secondary">
                <i className="fas fa-download mr-2" />
                Export
              </button>
              <button 
                onClick={() => {
                  if (selectedProspects.length > 0) {
                    setShowAddToCampaignModal(true);
                  } else {
                    showToast('Please select prospects to add to sequence', 'warning');
                  }
                }}
                disabled={selectedProspects.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-users mr-2" />
                Add to Sequence
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProspects.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between bg-slate-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-2xl">
              <span className="text-sm text-slate-700 font-medium">
                {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-3">
                <button onClick={deleteSelectedProspects} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  Delete Selected
                </button>
                <button onClick={clearSelection} className="btn-secondary text-sm px-4 py-2">
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

  
      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <ModalWrapper
          isOpen={showCSVUpload}
          onClose={() => setShowCSVUpload(false)}
          maxWidth="max-w-lg"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Import Prospects from CSV</h3>
              <button
                onClick={() => setShowCSVUpload(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500" />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">How it works:</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Upload a CSV file with prospect information</li>
                    <li>Duplicates are automatically detected and skipped</li>
                    <li>Invalid rows (missing required fields) are ignored</li>
                    <li>Import happens instantly with optimistic updates</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="mb-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
                <div className="mb-3">
                  <i className="fas fa-cloud-upload-alt text-gray-400 text-3xl mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Choose CSV file to upload
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Maximum file size: 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />
              </div>
            </div>

            {/* CSV Format Guide */}
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Required columns:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Name</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Email</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Company</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Optional columns:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Title</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Website</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Phone Number</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Industry</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Location</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">LinkedIn Profile</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Notes</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Tags</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Source</span>
                </div>
              </div>
            </div>

            {/* Download Template Link */}
            <div className="mb-4 text-center">
              <button
                onClick={() => {
                  handleDownloadTemplateCSV();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <i className="fas fa-download mr-2" />
                Download CSV Template
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCSVUpload(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Add to Campaign Modal */}
      {showAddToCampaignModal && (
        <ModalWrapper
          isOpen={showAddToCampaignModal}
          onClose={() => {
            setShowAddToCampaignModal(false);
            setSelectedCampaign('');
          }}
          maxWidth="max-w-md"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-text-primary">Add to Sequence</h3>
              <button
                onClick={() => {
                  setShowAddToCampaignModal(false);
                  setSelectedCampaign('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-500" />
              </button>
            </div>

            {/* Selected Prospects Info */}
            <div className="mb-4">
              <p className="text-sm text-text-secondary">
                Adding {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} to sequence
              </p>
            </div>

            {/* Sequence Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Select Sequence</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a sequence...</option>
                {campaigns.length === 0 ? (
                  <option value="" disabled>No sequences available</option>
                ) : (
                  campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))
                )}
              </select>
              {campaigns.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Create a sequence first to add prospects.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddToCampaignModal(false);
                  setSelectedCampaign('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToCampaign}
                disabled={!selectedCampaign || selectedProspects.length === 0}
                className="flex-1"
              >
                Add to Sequence
              </Button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Prospects Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-spinner fa-spin text-blue-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Loading prospects...</h3>
            <p className="text-slate-600">Please wait while we fetch your data</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-users text-slate-600 text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No prospects found</h3>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              Import prospects from a CSV file or add them manually to get started with your outreach campaigns.
            </p>
            <button onClick={() => setShowCSVUpload(true)} className="btn-primary">
              <i className="fas fa-upload mr-2" />
              Import Prospects
            </button>
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-filter text-amber-600 text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No matching prospects</h3>
            <p className="text-lg text-slate-600 mb-6 max-w-md mx-auto">
              No prospects match your current filters{searchQuery && ' or search query'}. Try adjusting your filters or search terms.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
                className="btn-secondary"
              >
                <i className="fas fa-times mr-2" />
                Clear Filters
              </button>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn-secondary"
                >
                  <i className="fas fa-search mr-2" />
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Select All Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedProspects.length === prospects.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllProspects();
                    } else {
                      clearSelection();
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Select All
                </span>
              </div>
              <span className="text-sm text-slate-600">
                {selectedProspects.length > 0 ? (
                  <span className="font-medium text-blue-600">
                    {selectedProspects.length} of {filteredProspects.length} selected
                  </span>
                ) : (
                  <span>
                    {filteredProspects.length} {filteredProspects.length !== prospects.length && `of ${prospects.length}`} prospect{filteredProspects.length !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
            </div>

            {/* Prospects Cards/Grid */}
            <div className="divide-y divide-slate-100">
              {paginatedProspects.map((lead) => (
                <div
                  key={lead.id}
                  className={`group transition-all duration-200 ${
                    selectedProspects.includes(lead.id) 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                      : 'hover:bg-slate-50 hover:border-l-4 hover:border-l-slate-300 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(lead.id)}
                          onChange={() => toggleProspectSelection(lead.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0 ring-2 ring-white">
                          {getInitials(lead.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-slate-900 truncate" title={lead.name}>
                              {lead.name}
                            </h3>
                            {lead.id.startsWith('temp-') && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <i className="fas fa-spinner fa-spin mr-1 text-xs" />
                                Saving
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5" title={lead.email}>
                              <i className="fas fa-envelope text-slate-400 text-xs" />
                              <span className="truncate max-w-[200px]">{lead.email}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Company & Title */}
                      <div className="hidden lg:flex flex-col items-start gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 w-full">
                          <i className="fas fa-building text-slate-400 text-xs flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900 truncate" title={lead.company}>
                            {lead.company}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <i className="fas fa-briefcase text-slate-400 text-xs flex-shrink-0" />
                          <span className="text-sm text-slate-600 truncate" title={lead.title || 'No title'}>
                            {lead.title || 'No title'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleOpenStatusModal(lead)}
                          disabled={lead.id.startsWith('temp-')}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            getStatusStyle(lead.status || 'NEW')
                          } ${lead.id.startsWith('temp-') ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                          title={lead.id.startsWith('temp-') ? 'Saving...' : 'Click to update status'}
                        >
                          {(lead.status || 'NEW').charAt(0).toUpperCase() + (lead.status || 'NEW').slice(1).toLowerCase().replace('_', ' ')}
                          {!lead.id.startsWith('temp-') && (
                            <i className="fas fa-chevron-down ml-1.5 text-xs opacity-60" />
                          )}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleEditProspectClick(lead)}
                          disabled={lead.id.startsWith('temp-')}
                          className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
                          title={lead.id.startsWith('temp-') ? 'Saving...' : 'Edit prospect'}
                        >
                          <i className="fas fa-edit text-sm" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProspect(lead.id, lead.name)}
                          disabled={lead.id.startsWith('temp-')}
                          className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
                          title={lead.id.startsWith('temp-') ? 'Saving...' : 'Delete prospect'}
                        >
                          <i className="fas fa-trash text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile-only additional info */}
                    <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-building text-slate-400 text-xs" />
                        <span className="text-slate-600">{lead.company}</span>
                      </div>
                      {lead.title && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-briefcase text-slate-400 text-xs" />
                          <span className="text-slate-600">{lead.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-slate-900">{Math.min(endIndex, filteredProspects.length)}</span> of{' '}
                  <span className="font-semibold text-slate-900">{filteredProspects.length}</span> prospect{filteredProspects.length !== 1 ? 's' : ''}
                  {filteredProspects.length !== prospects.length && (
                    <span className="text-slate-500"> (filtered from {prospects.length})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <i className="fas fa-angle-double-left" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <i className="fas fa-angle-left" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = page === 1 || 
                                      page === totalPages || 
                                      Math.abs(page - currentPage) <= 1;
                      
                      const showEllipsis = (page === 2 && currentPage > 3) || 
                                          (page === totalPages - 1 && currentPage < totalPages - 2);
                      
                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-slate-400">•••</span>;
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] px-3 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md ring-2 ring-blue-200'
                              : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile page indicator */}
                  <div className="sm:hidden px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <i className="fas fa-angle-right" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <i className="fas fa-angle-double-right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showUpdateStatusModal && updatingStatusProspect && (
        <UpdateStatusModal
          isOpen={showUpdateStatusModal}
          onClose={handleCloseStatusModal}
          onUpdateStatus={handleUpdateStatus}
          prospectName={updatingStatusProspect.name}
          currentStatus={updatingStatusProspect.status}
          loading={false}
        />
      )}

          </div>
  );
};

export default ProspectsPage;
