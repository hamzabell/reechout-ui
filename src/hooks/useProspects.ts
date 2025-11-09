import { useState, useCallback, useEffect } from 'react';
import { Prospect, ProspectStatus } from '../types';

export interface ProspectsState {
  prospects: Prospect[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedProspects: string[];
  filters: {
    status?: string;
    company?: string;
    industry?: string;
  };
}

export const useProspects = () => {
  const [state, setState] = useState<ProspectsState>({
    prospects: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedProspects: [],
    filters: {}
  });

  const fetchProspects = useCallback(async (searchQuery?: string, filters?: ProspectsState['filters']) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - using the correct ProspectStatus type
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
          phoneNumber: '+1 (555) 123-4567',
          linkedinProfile: 'https://linkedin.com/in/johnsmith',
          status: 'NEW' as ProspectStatus,
          createdBy: 'user1',
          tags: ['enterprise', 'tech'],
          isOptedOut: false,
                    createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@startup.io',
          company: 'StartupIO',
          title: 'CEO',
          website: 'https://startup.io',
          industry: 'SaaS',
          location: 'New York, NY',
          phoneNumber: '+1 (555) 987-6543',
          linkedinProfile: 'https://linkedin.com/in/sarahjohnson',
          status: 'CONTACTED' as ProspectStatus,
          createdBy: 'user1',
          tags: ['startup', 'decision-maker'],
          isOptedOut: false,
                    createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Michael Chen',
          email: 'michael@enterprise.co',
          company: 'Enterprise Co',
          title: 'VP of Engineering',
          website: 'https://enterprise.co',
          industry: 'Enterprise Software',
          location: 'Austin, TX',
          phoneNumber: '+1 (555) 456-7890',
          linkedinProfile: 'https://linkedin.com/in/michaelchen',
          status: 'REPLIED' as ProspectStatus,
          createdBy: 'user1',
          tags: ['enterprise', 'engineering'],
          isOptedOut: false,
                    createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Alice Williams',
          email: 'alice@techstart.io',
          company: 'TechStart',
          title: 'VP of Engineering',
          website: 'https://techstart.io',
          industry: 'Technology',
          location: 'Boston, MA',
          phoneNumber: '+1 (555) 234-5678',
          linkedinProfile: 'https://linkedin.com/in/alicewilliams',
          status: 'NOT_INTERESTED' as ProspectStatus,
          createdBy: 'user1',
          tags: [],
          isOptedOut: false,
                    createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Sarah Mitchell',
          email: 'sarah@innovatecorp.com',
          company: 'InnovateCorp',
          title: 'Chief Product Officer',
          website: 'https://innovatecorp.com',
          industry: 'Technology',
          location: 'San Francisco, CA',
          phoneNumber: '+1 (555) 345-6789',
          linkedinProfile: 'https://linkedin.com/in/sarahmitchell',
          status: 'NEW' as ProspectStatus,
          createdBy: 'user1',
          tags: ['enterprise', 'decision-maker'],
          isOptedOut: false,
                    createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          researchData: {
            companyOverview: {
              description: 'InnovateCorp is a leading enterprise software company specializing in AI-powered business solutions. Founded in 2015, the company has experienced rapid growth, reaching $200M in annual revenue with over 500 employees across 12 offices worldwide.',
              size: '501-1000 employees',
              revenue: '$100-500M',
              foundedYear: '2015',
              headquarters: 'San Francisco, CA',
              website: 'https://innovatecorp.com'
            },
            keyInsights: [
              'Recently secured $50M Series D funding led by Sequoia Capital',
              'Planning major expansion into European market in Q3 2024',
              'Looking for customer success solutions to improve retention rates',
              'Current tech stack includes Salesforce, Marketo, and Segment',
              'Competing with established players like HubSpot and Adobe'
            ],
            leadershipTeam: [
              { name: 'Michael Chen', title: 'CEO', background: 'Former Google executive, 15+ years in SaaS' },
              { name: 'Jennifer Park', title: 'CTO', background: 'MIT graduate, AI/ML specialist' },
              { name: 'David Kumar', title: 'CFO', background: 'Ex-Morgan Stanley, IPO experience' }
            ],
            recentNews: [
              { date: '2024-01-15', title: 'InnovateCorp Launches New AI Platform', source: 'TechCrunch' },
              { date: '2024-01-08', title: 'Company Named Top Workplace 2024', source: 'Forbes' },
              { date: '2023-12-20', title: 'Q4 Earnings Beat Expectations', source: 'Yahoo Finance' }
            ],
            competitiveLandscape: {
              mainCompetitors: ['HubSpot', 'Salesforce', 'Adobe', 'Oracle'],
              marketPosition: 'Fast-growing challenger in enterprise AI space',
              competitiveAdvantages: ['Proprietary AI algorithms', 'Strong customer success team', 'Flexible pricing']
            },
            contactIntelligence: {
              decisionMaker: 'Primary decision maker for customer success tools',
              budgetAuthority: 'Controls annual budget of $2-3M for software solutions',
              currentChallenges: [
                'High customer churn rate (25% annually)',
                'Lack of integrated customer data platform',
                'Need for better analytics and reporting'
              ],
              buyingSignals: [
                'Attended Customer Success Summit in December 2023',
                'Downloaded whitepaper on customer retention strategies',
                'Active in customer success communities on LinkedIn'
              ]
            }
          }
        }
      ];

      // Apply filters
      let filteredProspects = mockProspects;
      
      if (searchQuery) {
        filteredProspects = filteredProspects.filter(prospect =>
          prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prospect.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prospect.company && prospect.company.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      if (filters?.status) {
        filteredProspects = filteredProspects.filter(prospect => prospect.status === filters.status);
      }
      
      if (filters?.company) {
        filteredProspects = filteredProspects.filter(prospect => 
          (prospect.company && prospect.company.toLowerCase().includes(filters.company!.toLowerCase()))
        );
      }
      
      if (filters?.industry) {
        filteredProspects = filteredProspects.filter(prospect => 
          prospect.industry?.toLowerCase().includes(filters.industry!.toLowerCase())
        );
      }

      setState(prev => ({ 
        ...prev, 
        prospects: filteredProspects, 
        loading: false 
      }));
      
      return filteredProspects;
    } catch (error) {
      console.warn('Search API failed, filtering mock data:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to fetch prospects' 
      }));
      return [];
    }
  }, []);

  // Load initial data on component mount
  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const searchProspects = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    return fetchProspects(query, state.filters);
  }, [fetchProspects, state.filters]);

  const setFilters = useCallback((filters: ProspectsState['filters']) => {
    setState(prev => ({ ...prev, filters }));
    return fetchProspects(state.searchQuery, filters);
  }, [fetchProspects, state.searchQuery]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const selectProspect = useCallback((prospectId: string) => {
    setState(prev => ({
      ...prev,
      selectedProspects: prev.selectedProspects.includes(prospectId)
        ? prev.selectedProspects.filter(id => id !== prospectId)
        : [...prev.selectedProspects, prospectId]
    }));
  }, []);

  const toggleProspectSelection = useCallback((prospectId: string) => {
    setState(prev => ({
      ...prev,
      selectedProspects: prev.selectedProspects.includes(prospectId)
        ? prev.selectedProspects.filter(id => id !== prospectId)
        : [...prev.selectedProspects, prospectId]
    }));
  }, []);

  const selectAllProspects = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedProspects: prev.prospects.map(p => p.id)
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedProspects: [] }));
  }, []);

  // Additional methods that were missing - with proper return values
  const createProspect = useCallback(async (prospectData: Partial<Prospect>) => {
    const newProspect: Prospect = {
      id: Date.now().toString(),
      name: prospectData.name || '',
      email: prospectData.email || '',
      company: prospectData.company || '',
      title: prospectData.title,
      website: prospectData.website,
      industry: prospectData.industry,
      linkedinProfile: prospectData.linkedinProfile,
      phoneNumber: prospectData.phoneNumber,
      location: prospectData.location,
      status: 'NEW',
            tags: prospectData.tags || [],
      isOptedOut: false,
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      prospects: [...prev.prospects, newProspect]
    }));

    return newProspect;
  }, []);

  const fetchProspect = useCallback(async (prospectId: string) => {
    const prospect = state.prospects.find(p => p.id === prospectId);
    return prospect || null;
  }, [state.prospects]);

  const updateProspect = useCallback(async (prospectId: string, updates: Partial<Prospect>) => {
    let updatedProspect: Prospect | null = null;
    
    setState(prev => {
      const updatedProspects = prev.prospects.map(p => {
        if (p.id === prospectId) {
          updatedProspect = { ...p, ...updates, updatedAt: new Date().toISOString() };
          return updatedProspect;
        }
        return p;
      });
      return { ...prev, prospects: updatedProspects };
    });

    return updatedProspect;
  }, []);

  const deleteProspect = useCallback(async (prospectId: string) => {
    setState(prev => ({
      ...prev,
      prospects: prev.prospects.filter(p => p.id !== prospectId),
      selectedProspects: prev.selectedProspects.filter(id => id !== prospectId)
    }));
  }, []);

  const bulkUpdateStatus = useCallback(async (prospectIds: string[], status: ProspectStatus) => {
    setState(prev => ({
      ...prev,
      prospects: prev.prospects.map(p => 
        prospectIds.includes(p.id) 
          ? { ...p, status, updatedAt: new Date().toISOString() }
          : p
      )
    }));
  }, []);

  const deleteSelectedProspects = useCallback(async () => {
    setState(prev => ({
      ...prev,
      prospects: prev.prospects.filter(p => !prev.selectedProspects.includes(p.id)),
      selectedProspects: []
    }));
  }, []);

  const uploadCSV = useCallback(async (file: File) => {
    // Mock implementation with proper return type
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
    
    const importedCount = Math.floor(Math.random() * 50) + 10;
    const newProspects: Prospect[] = Array.from({ length: importedCount }, (_, i) => ({
      id: `imported-${Date.now()}-${i}`,
      name: `Imported Prospect ${i + 1}`,
      email: `prospect${i + 1}@example.com`,
      company: 'Imported Company',
      title: 'Director',
      website: 'https://example.com',
      industry: 'Technology',
      location: 'San Francisco, CA',
      phoneNumber: '+1 (555) 000-0000',
      linkedinProfile: `https://linkedin.com/in/prospect${i + 1}`,
      status: 'NEW' as ProspectStatus,
            tags: ['imported'],
      isOptedOut: false,
      createdBy: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Add new prospects to the state
    setState(prev => ({
      ...prev,
      prospects: [...prev.prospects, ...newProspects]
    }));
    
    return { 
      success: true, 
      prospects: newProspects,
      errors: []
    };
  }, []);

  const exportProspects = useCallback(async (filters?: any) => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate export
    return { 
      success: true, 
      data: 'CSV export data would be here',
      filename: `prospects-${new Date().toISOString().split('T')[0]}.csv`
    };
  }, []);

  return {
    ...state,
    fetchProspects,
    searchProspects,
    setFilters,
    setSearchQuery,
    selectProspect,
    toggleProspectSelection,
    selectAllProspects,
    clearSelection,
    createProspect,
    fetchProspect,
    updateProspect,
    deleteProspect,
    bulkUpdateStatus,
    deleteSelectedProspects,
    uploadCSV,
    exportProspects
  };
};
