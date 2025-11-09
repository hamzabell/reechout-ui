import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUpdateProspect, useProspects } from '../hooks/useProspectsSWR';
import { useToast } from '../hooks/useToast';
import { useNeon } from '../providers/NeonProvider';
import { Prospect } from '../types';

const ProspectEditPage: React.FC = () => {
  const { prospectId } = useParams<{ prospectId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { authState } = useNeon();
  const { trigger: updateProspect } = useUpdateProspect();
  const { prospects, isLoading } = useProspects();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!prospectId) {
      navigate('/dashboard/prospects');
      return;
    }

    if (!isLoading && prospects.length > 0) {
      const foundProspect = prospects.find(p => p.id === prospectId);
      if (foundProspect) {
        setProspect(foundProspect);
      } else {
        showToast('Prospect not found', 'error');
        navigate('/dashboard/prospects');
      }
    }
  }, [prospectId, prospects, isLoading, navigate, showToast]);

  const handleEditProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prospect || !authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const updates = {
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
    };

    try {
      await updateProspect({
        id: prospect.id,
        ...updates,
        userId: authState.user.id
      });

      // Navigate immediately after optimistic update
      navigate('/dashboard/prospects');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update prospect', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-spinner fa-spin text-blue-600 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Loading prospect...</h3>
          <p className="text-slate-600">Please wait while we fetch the prospect data</p>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-red-600 text-3xl" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Prospect Not Found</h3>
          <p className="text-lg text-slate-600 mb-6">The prospect you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard/prospects')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Prospects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={() => navigate('/dashboard/prospects')}
                  className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <i className="fas fa-arrow-left text-slate-600 group-hover:scale-110 transition-transform"></i>
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-user-edit text-white text-lg"></i>
                    </div>
                    Edit Prospect
                  </h1>
                  <p className="text-slate-600 mt-2">Update information for {prospect.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleEditProspect} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                Basic Information
              </h2>
              <p className="text-blue-100 mt-1">Essential details about the prospect</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Full Name *</label>
                  <div className="relative">
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={prospect.name}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="John Doe"
                    />
                    <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Email Address *</label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={prospect.email}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="john@example.com"
                    />
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Company *</label>
                  <div className="relative">
                    <input
                      name="company"
                      type="text"
                      required
                      defaultValue={prospect.company}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="Acme Corp"
                    />
                    <i className="fas fa-building absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Job Title</label>
                  <div className="relative">
                    <input
                      name="title"
                      type="text"
                      defaultValue={prospect.title || ''}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="CEO"
                    />
                    <i className="fas fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-address-book text-white text-sm"></i>
                </div>
                Contact Details
              </h2>
              <p className="text-emerald-100 mt-1">How to reach this prospect</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={prospect.phoneNumber || ''}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="+1 (555) 123-4567"
                    />
                    <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Location</label>
                  <div className="relative">
                    <input
                      name="location"
                      type="text"
                      defaultValue={prospect.location || ''}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="New York, NY"
                    />
                    <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <label className="block text-sm font-semibold text-slate-700">Website</label>
                <div className="relative">
                  <input
                    name="website"
                    type="url"
                    defaultValue={prospect.website || ''}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                    placeholder="https://example.com"
                  />
                  <i className="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <label className="block text-sm font-semibold text-slate-700">LinkedIn Profile</label>
                <div className="relative">
                  <input
                    name="linkedinProfile"
                    type="url"
                    defaultValue={prospect.linkedinProfile || ''}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                  <i className="fab fa-linkedin absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-info-circle text-white text-sm"></i>
                </div>
                Additional Information
              </h2>
              <p className="text-purple-100 mt-1">Extra details to help personalize outreach</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Industry</label>
                  <div className="relative">
                    <select
                      name="industry"
                      defaultValue={prospect.industry || ''}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none"
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
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Tags</label>
                  <div className="relative">
                    <input
                      name="tags"
                      type="text"
                      defaultValue={prospect.tags?.join(', ') || ''}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                      placeholder="vip, enterprise, decision-maker"
                    />
                    <i className="fas fa-tags absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <label className="block text-sm font-semibold text-slate-700">Notes</label>
                <div className="relative">
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={prospect.notes || ''}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                    placeholder="Additional notes about this prospect..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard/prospects')}
              disabled={isSubmitting}
              className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-300 shadow-sm hover:shadow-md"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating Prospect...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Update Prospect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectEditPage;
