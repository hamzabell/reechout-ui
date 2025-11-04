import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useProspects } from '../hooks/useProspects';
import { Prospect } from '../types';

const AddProspectPage: React.FC = () => {
  const navigate = useNavigate();
  const { createProspect } = useProspects();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Extract tags from comma-separated string
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const prospectData: Omit<Prospect, 'id' | 'status' | 'score' | 'researchData' | 'personalizationData' | 'lastContacted' | 'nextFollowUp' | 'isOptedOut' | 'createdAt' | 'updatedAt'> = {
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
      timezone: undefined,
      source: undefined,
      assignedTo: undefined,
    };

    try {
      await createProspect(prospectData as Prospect);
      navigate('/dashboard/prospects');
    } catch (error) {
      console.error('Error creating prospect:', error);
      // Error is handled by the hook with toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Add New Prospect</h1>
            <p className="text-text-secondary">
              Add a new prospect to your database. Fill in the details below to get started.
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
                    <span>Adding Prospect...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle" />
                    <span>Add Prospect</span>
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

export default AddProspectPage;