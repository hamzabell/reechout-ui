import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useProspects } from '../hooks/useProspects';
import { Prospect } from '../types';

const ProspectEditPage: React.FC = () => {
  const { prospectId } = useParams<{ prospectId: string }>();
  const navigate = useNavigate();
  const { fetchProspect, updateProspect } = useProspects();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProspect = async () => {
      if (!prospectId) {
        navigate('/dashboard/prospects');
        return;
      }

      try {
        const data = await fetchProspect(prospectId);
        setProspect(data);
      } catch (error) {
        console.error('Error loading prospect:', error);
        navigate('/dashboard/prospects');
      } finally {
        setLoading(false);
      }
    };

    loadProspect();
  }, [prospectId, navigate, fetchProspect]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prospect) return;

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Extract tags from comma-separated string
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const prospectData: Partial<Prospect> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      title: formData.get('title') as string || undefined,
      website: formData.get('website') as string || undefined,
      phoneNumber: formData.get('phone') as string || undefined,
      industry: formData.get('industry') as string || undefined,
      location: formData.get('location') as string || undefined,
      linkedinProfile: formData.get('linkedinProfile') as string || undefined,
      tags,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await updateProspect(prospectId!, prospectData);
      navigate('/dashboard/prospects');
    } catch (error) {
      console.error('Error updating prospect:', error);
      // Error is handled by the hook with toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-text-secondary">Loading prospect details...</p>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Prospect not found</h2>
          <p className="text-text-secondary mb-4">The prospect you're looking for doesn't exist.</p>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard/prospects')}
          >
            Back to Prospects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Prospect</h1>
            <p className="text-text-secondary">
              Update the details for {prospect.name}. Fill in the information below.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard/prospects')}
            className="flex items-center space-x-2"
          >
            <i className="fas fa-arrow-left" />
            <span>Back to Prospects</span>
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-surface rounded-xl border border-border shadow-sm">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-user-circle mr-2 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={prospect.name}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={prospect.email}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-briefcase mr-2 text-primary" />
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="company"
                    type="text"
                    required
                    defaultValue={prospect.company}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Acme Corp"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={prospect.title || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="CEO"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-address-card mr-2 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Website
                  </label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={prospect.website || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={prospect.phoneNumber || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-info-circle mr-2 text-primary" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    defaultValue={prospect.industry || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    disabled={isSubmitting}
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
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Location
                  </label>
                  <input
                    name="location"
                    type="text"
                    defaultValue={prospect.location || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="New York, NY"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  LinkedIn Profile
                </label>
                <input
                  name="linkedinProfile"
                  type="url"
                  defaultValue={prospect.linkedinProfile || ''}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="https://linkedin.com/in/johndoe"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Tags and Notes */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <i className="fas fa-tags mr-2 text-primary" />
                Tags and Notes
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tags
                  </label>
                  <input
                    name="tags"
                    type="text"
                    defaultValue={prospect.tags?.join(', ') || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="vip, enterprise, decision-maker (comma separated)"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-text-secondary mt-1">
                    Separate multiple tags with commas
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={prospect.notes || ''}
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-vertical"
                    placeholder="Additional notes about this prospect..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate('/dashboard/prospects')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>Updating Prospect...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProspectEditPage;