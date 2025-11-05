import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Prospect } from '../types';

// Mock data - same as ProspectsPage
const mockProspects: Prospect[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@techcorp.com',
    company: 'TechCorp',
    title: 'Engineering Manager',
    website: 'https://techcorp.com',
    industry: 'Technology',
    location: 'San Francisco, CA',
    linkedinProfile: 'https://linkedin.com/in/johnsmith',
    status: 'NEW',
    score: 85,
    tags: ['enterprise', 'tech'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isOptedOut: false
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@innovate.io',
    company: 'InnovateCo',
    title: 'Product Director',
    website: 'https://innovate.io',
    industry: 'Software',
    location: 'New York, NY',
    linkedinProfile: 'https://linkedin.com/in/sarahjohnson',
    status: 'CONTACTED',
    score: 92,
    tags: ['startup', 'product'],
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    isOptedOut: false
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'mchen@growth.com',
    company: 'GrowthLabs',
    title: 'CEO',
    website: 'https://growth.com',
    industry: 'Marketing Tech',
    location: 'Austin, TX',
    linkedinProfile: 'https://linkedin.com/in/michaelchen',
    status: 'ENGAGED',
    score: 88,
    tags: ['scaleup', 'ceo'],
    createdAt: '2024-01-08T11:45:00Z',
    updatedAt: '2024-01-14T16:30:00Z',
    isOptedOut: false
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@financeai.com',
    company: 'FinanceAI',
    title: 'CTO',
    website: 'https://financeai.com',
    industry: 'FinTech',
    location: 'Chicago, IL',
    linkedinProfile: 'https://linkedin.com/in/emilydavis',
    status: 'NEW',
    score: 79,
    tags: ['fintech', 'enterprise'],
    createdAt: '2024-01-12T13:10:00Z',
    updatedAt: '2024-01-12T13:10:00Z',
    isOptedOut: false
  },
  {
    id: '5',
    name: 'Alice Williams',
    email: 'alice@healthtech.io',
    company: 'HealthTech Solutions',
    title: 'VP of Engineering',
    website: 'https://healthtech.io',
    industry: 'Healthcare',
    location: 'Boston, MA',
    linkedinProfile: 'https://linkedin.com/in/alicewilliams',
    status: 'CONTACTED',
    score: 95,
    tags: ['healthcare', 'enterprise'],
    createdAt: '2024-01-05T15:30:00Z',
    updatedAt: '2024-01-17T12:45:00Z',
    isOptedOut: false
  },
  {
    id: '6',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@innovatecorp.com',
    company: 'InnovateCorp',
    title: 'VP of Product',
    website: 'https://innovatecorp.com',
    industry: 'Enterprise Software',
    location: 'Seattle, WA',
    linkedinProfile: 'https://linkedin.com/in/sarahmitchell',
    status: 'NEW',
    score: 94,
    tags: ['enterprise', 'product', 'high-value'],
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z',
    isOptedOut: false
  }
];

const ProspectEditPage: React.FC = () => {
  const { prospectId } = useParams<{ prospectId: string }>();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state with basic fields only
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    website: '',
    industry: '',
    location: '',
    linkedinProfile: ''
  });

  useEffect(() => {
    const loadProspect = async () => {
      if (!prospectId) {
        navigate('/dashboard/prospects');
        return;
      }

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find prospect in mock data
        const foundProspect = mockProspects.find(p => p.id === prospectId);
        
        if (!foundProspect) {
          navigate('/dashboard/prospects');
          return;
        }

        setProspect(foundProspect);
        setFormData({
          name: foundProspect.name || '',
          email: foundProspect.email || '',
          company: foundProspect.company || '',
          title: foundProspect.title || '',
          website: foundProspect.website || '',
          industry: foundProspect.industry || '',
          location: foundProspect.location || '',
          linkedinProfile: foundProspect.linkedinProfile || ''
        });
      } catch (error) {
        console.error('Error loading prospect:', error);
        navigate('/dashboard/prospects');
      } finally {
        setLoading(false);
      }
    };

    loadProspect();
  }, [prospectId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospect) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would call an API
      console.log('Updating prospect:', { ...prospect, ...formData });
      
      // Show success message
      alert('Prospect updated successfully (this is a demo)');
      
      // Navigate back to prospects page
      navigate('/dashboard/prospects');
    } catch (error) {
      console.error('Error updating prospect:', error);
      alert('Error updating prospect');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading prospect...</div>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Prospect not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Prospect</h1>
            <p className="text-gray-600">Update prospect information</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard/prospects')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="linkedinProfile" className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  id="linkedinProfile"
                  name="linkedinProfile"
                  value={formData.linkedinProfile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard/prospects')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectEditPage;
