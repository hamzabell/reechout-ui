import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProspects } from '../hooks/useProspects';
import { useCampaigns } from '../hooks/useCampaigns';
import { useToast } from '../hooks/useToast';
import { Prospect } from '../types';
import Button from '../components/Button';
import ModalWrapper from '../components/ModalWrapper';

const ProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    prospects,
    loading,
    searchQuery,
    selectedProspects,
    filters,
    searchProspects,
    bulkUpdateStatus,
    deleteSelectedProspects,
    uploadCSV,
    exportProspects,
    updateProspect,
    deleteProspect,
    setSearchQuery,
    setFilters,
    toggleProspectSelection,
    selectAllProspects,
    clearSelection,
  } = useProspects();

  const { showToast } = useToast();
  const { campaigns } = useCampaigns({ status: 'draft' });

  const [showEditProspectModal, setShowEditProspectModal] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showAddToCampaignModal, setShowAddToCampaignModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProspects();
  };

  
  const handleEditProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProspect) return;

    const formData = new FormData(e.currentTarget);

    try {
      const updatedProspect = await updateProspect(editingProspect.id, {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        company: formData.get('company') as string,
        title: formData.get('title') as string,
        website: formData.get('website') as string,
        phoneNumber: formData.get('phone') as string,
        industry: formData.get('industry') as string,
        location: formData.get('location') as string,
        linkedinProfile: formData.get('linkedinProfile') as string,
        tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
        notes: formData.get('notes') as string,
      });
      showToast(`Prospect "${updatedProspect.name}" updated successfully!`, 'success');
      setShowEditProspectModal(false);
      setEditingProspect(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update lead', 'error');
    }
  };

  const handleEditProspectClick = (lead: Prospect) => {
    // Navigate to the edit page instead of opening a modal
    navigate(`/dashboard/prospects/${lead.id}/edit`);
  };

  const handleDeleteProspect = async (prospectId: string, leadName: string) => {
    if (window.confirm(`Are you sure you want to delete "${leadName}"?`)) {
      try {
        await deleteProspect(prospectId);
        showToast(`Prospect deleted successfully!`, 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to delete lead', 'error');
      }
    }
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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadCSV(file);
      showToast(`Successfully uploaded ${result.prospects.length} prospects!`, 'success');
      if (result.errors && result.errors.length > 0) {
        showToast(`Some rows had errors: ${result.errors.slice(0, 3).join(', ')}`, 'warning');
      }
      setShowCSVUpload(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBulkStatusUpdate = async (status: 'CONTACTED' | 'REPLIED' | 'NOT_INTERESTED') => {
    if (selectedProspects.length === 0) {
      showToast('Please select prospects first', 'warning');
      return;
    }

    try {
      await bulkUpdateStatus(selectedProspects, status);
      showToast(`Updated ${selectedProspects.length} prospects to ${status}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Update failed', 'error');
    }
  };

  
  const handleExport = async () => {
    try {
      await exportProspects(filters);
      showToast('Prospects exported successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Export failed', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'status bg-blue-100 text-blue-800';
      case 'CONTACTED': return 'status bg-yellow-100 text-yellow-800';
      case 'REPLIED': return 'status bg-green-100 text-green-800';
      case 'NOT_INTERESTED': return 'status bg-gray-100 text-gray-800';
      default: return 'status bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-end">
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
            <div className="flex gap-3">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ status: e.target.value || undefined })}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="REPLIED">Replied</option>
                <option value="NOT_INTERESTED">Not Interested</option>
              </select>
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
                <button onClick={() => handleBulkStatusUpdate('CONTACTED')} className="btn-secondary text-sm px-4 py-2">
                  Mark as Contacted
                </button>
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

      
      {/* Edit Prospect Modal */}
      {showEditProspectModal && editingProspect && (
        <ModalWrapper
          isOpen={showEditProspectModal}
          onClose={() => {
            setShowEditProspectModal(false);
            setEditingProspect(null);
          }}
          maxWidth="max-w-md"
        >
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Edit Prospect</h3>
            <form onSubmit={handleEditProspect}>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={editingProspect.name}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={editingProspect.email}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Company *</label>
                    <input
                      name="company"
                      type="text"
                      required
                      defaultValue={editingProspect.company}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                    <input
                      name="title"
                      type="text"
                      defaultValue={editingProspect.title || ''}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="CEO"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Website</label>
                    <input
                      name="website"
                      type="url"
                      defaultValue={editingProspect.website || ''}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={editingProspect.phoneNumber || ''}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Industry</label>
                    <select
                      name="industry"
                      defaultValue={editingProspect.industry || ''}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select industry...</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Media">Media</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
                    <input
                      name="location"
                      type="text"
                      defaultValue={editingProspect.location || ''}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="New York, NY"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">LinkedIn Profile</label>
                  <input
                    name="linkedinProfile"
                    type="url"
                    defaultValue={editingProspect.linkedinProfile || ''}
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Tags</label>
                  <input
                    name="tags"
                    type="text"
                    defaultValue={editingProspect.tags?.join(', ') || ''}
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="vip, enterprise, decision-maker (comma separated)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingProspect.notes || ''}
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Additional notes about this prospect..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Update Prospect
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowEditProspectModal(false);
                    setEditingProspect(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </ModalWrapper>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <ModalWrapper
          isOpen={showCSVUpload}
          onClose={() => setShowCSVUpload(false)}
          maxWidth="max-w-md"
        >
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Import Prospects from CSV</h3>
            <p className="text-text-secondary mb-4">
              Upload a CSV file with columns: Name, Email, Company, Title, Website (optional)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full p-3 bg-bg-secondary border border-border rounded-lg"
            />
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowCSVUpload(false)}>
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
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Add {selectedProspects.length} Prospect{selectedProspects.length !== 1 ? 's' : ''} to Sequence
            </h3>
            <p className="text-text-secondary mb-4">
              Select a sequence to add the selected prospects. Research will be automatically performed if the sequence has AI personalization enabled.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Select Sequence</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a sequence...</option>
                {campaigns.length === 0 ? (
                  <option value="" disabled>No draft sequences available</option>
                ) : (
                  campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))
                )}
              </select>
              {campaigns.length === 0 && (
                <p className="text-sm text-text-secondary mt-2">
                  Create a sequence first to add prospects to it.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCampaign}
                disabled={!selectedCampaign || selectedProspects.length === 0}
                className="flex-1"
              >
                Add to Sequence
              </Button>
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
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Prospects Table */}
      <div className="card">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-spinner fa-spin text-blue-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Loading prospects...</h3>
            <p className="text-slate-600">Please wait while we fetch your data</p>
          </div>
        ) : prospects.length === 0 ? (
          <div className="card p-16 text-center">
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
        ) : (
          <div className="p-6">
            {/* Select All Checkbox */}
            <div className="mb-6 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
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
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Select All ({prospects.length} prospects)
              </span>
            </div>

            {/* Prospects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prospects.map((lead) => (
                <div
                  key={lead.id}
                  className={`relative bg-white border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-blue-200 ${
                    selectedProspects.includes(lead.id)
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 left-4">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(lead.id)}
                      onChange={() => toggleProspectSelection(lead.id)}
                      className="rounded border-slate-300"
                    />
                  </div>

                  {/* Card Header - Prospect Info */}
                  <div className="mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {getInitials(lead.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg mb-1 pr-2">{lead.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{lead.title || 'No title'}</p>
                        {lead.linkedinProfile && (
                          <a
                            href={lead.linkedinProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-xs flex items-center font-medium"
                          >
                            <i className="fab fa-linkedin mr-1" />
                            LinkedIn Profile
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-building text-slate-400 text-sm"></i>
                      <span className="font-medium text-slate-900">{lead.company}</span>
                    </div>
                    {lead.website && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-globe text-slate-400 text-sm"></i>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm truncate font-medium"
                          title={lead.website}
                        >
                          {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="mb-4 space-y-2">
                    {lead.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-phone text-slate-400 text-sm"></i>
                        <span className="text-sm text-slate-700">{lead.phoneNumber}</span>
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-slate-400 text-sm"></i>
                        <span className="text-sm text-slate-700">{lead.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {lead.researchData ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <i className="fas fa-check-circle mr-1.5" />
                        Researched
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <i className="fas fa-minus-circle mr-1.5" />
                        Not Researched
                      </span>
                    )}
                    <span className={`status-badge ${lead.status}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => handleEditProspectClick(lead)}
                    >
                      <i className="fas fa-edit" />
                      Edit
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleDeleteProspect(lead.id, lead.name)}
                    >
                      <i className="fas fa-trash" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

          </div>
  );
};

export default ProspectsPage;
