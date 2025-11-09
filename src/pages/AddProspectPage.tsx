import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProspect } from '../hooks/useProspectsSWR';
import { useToast } from '../hooks/useToast';
import { useNeon } from '../providers/NeonProvider';

const AddProspectPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { authState } = useNeon();
  const { trigger: createProspect } = useCreateProspect();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authState.user?.id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const prospectData = {
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
      await createProspect({
        ...prospectData,
        userId: authState.user.id
      });

      // Navigate immediately after optimistic update
      navigate('/dashboard/prospects');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create prospect', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/30">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-user-plus text-white text-lg"></i>
                    </div>
                    Add New Prospect
                  </h1>
                  <p className="text-slate-600 mt-2">Create a new prospect record with comprehensive information</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleCreateProspect} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                Basic Information
              </h2>
              <p className="text-emerald-100 mt-1">Essential details about the prospect</p>
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-address-book text-white text-sm"></i>
                </div>
                Contact Details
              </h2>
              <p className="text-blue-100 mt-1">How to reach this prospect</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <input
                      name="phone"
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                  <i className="fab fa-linkedin absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="fas fa-info-circle text-white text-sm"></i>
                </div>
                Additional Information
              </h2>
              <p className="text-amber-100 mt-1">Extra details to help personalize outreach</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Industry</label>
                  <div className="relative">
                    <select
                      name="industry"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none"
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
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 shadow-sm hover:shadow-md pl-11"
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
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
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
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating Prospect...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Create Prospect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProspectPage;
