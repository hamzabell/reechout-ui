import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSearch, FiX, FiCheck, FiMail, FiClock, FiSettings, FiZap } from 'react-icons/fi';

interface Prospect {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
  lastUpdated: string;
  hasPersonalizedSteps: number;
  totalSteps: number;
  hasAIGeneration: boolean;
}

const CampaignEmailPersonalizationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'personalized' | 'ai' | 'standard'>('all');

  // Mock prospects data - each prospect has multiple steps
  const [prospects] = useState<Prospect[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      company: 'TechCorp Industries',
      title: 'VP of Engineering',
      lastUpdated: '2024-01-15T10:30:00Z',
      hasPersonalizedSteps: 2,
      totalSteps: 4,
      hasAIGeneration: true
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'm.chen@innovate.io',
      company: 'Innovate Solutions',
      title: 'CTO',
      lastUpdated: '2024-01-14T15:45:00Z',
      hasPersonalizedSteps: 0,
      totalSteps: 4,
      hasAIGeneration: false
    },
    {
      id: 3,
      name: 'Emily Davis',
      email: 'emily.davis@financepro.com',
      company: 'FinancePro LLC',
      title: 'CFO',
      lastUpdated: '2024-01-15T09:15:00Z',
      hasPersonalizedSteps: 1,
      totalSteps: 4,
      hasAIGeneration: true
    },
    {
      id: 4,
      name: 'Alex Thompson',
      email: 'alex.thompson@healthsys.org',
      company: 'Healthcare Systems',
      title: 'Director of Operations',
      lastUpdated: '2024-01-13T14:20:00Z',
      hasPersonalizedSteps: 0,
      totalSteps: 4,
      hasAIGeneration: false
    },
    {
      id: 5,
      name: 'Jessica Martinez',
      email: 'jmartinez@retailmax.com',
      company: 'RetailMax',
      title: 'VP of Marketing',
      lastUpdated: '2024-01-15T11:00:00Z',
      hasPersonalizedSteps: 3,
      totalSteps: 4,
      hasAIGeneration: true
    }
  ]);

  // Filter prospects
  const filteredProspects = useMemo(() => {
    let filtered = prospects;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prospect =>
        prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prospect => {
        if (filterStatus === 'personalized') {
          return prospect.hasPersonalizedSteps > 0;
        } else if (filterStatus === 'ai') {
          return prospect.hasAIGeneration;
        } else if (filterStatus === 'standard') {
          return prospect.hasPersonalizedSteps === 0;
        }
        return true;
      });
    }

    return filtered;
  }, [prospects, searchTerm, filterStatus]);

  // Get stats
  const stats = {
    total: prospects.length,
    personalized: prospects.filter(p => p.hasPersonalizedSteps > 0).length,
    aiEnabled: prospects.filter(p => p.hasAIGeneration).length,
    standard: prospects.filter(p => p.hasPersonalizedSteps === 0).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Prospect Personalization</h1>
              <p className="text-gray-600 text-sm">
                Click on prospects to configure personalization for each step
              </p>
            </div>
            
            {/* Campaign Settings Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FiSettings className="w-3 h-3 mr-1" />
                Campaign Setup
              </div>
              <button
                onClick={() => {
                  // TODO: Open campaign settings modal
                  console.log('Open campaign settings');
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configure campaign settings"
              >
                <FiSettings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

  

        {/* Progress Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Campaign Progress</h2>
            <span className="text-xs text-gray-500">{stats.total} prospects</span>
          </div>
          
          {/* Progress stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{stats.personalized}</div>
              <div className="text-xs text-gray-600">With Personalization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-purple-600">{stats.aiEnabled}</div>
              <div className="text-xs text-gray-600">AI Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-600">{stats.standard}</div>
              <div className="text-xs text-gray-600">Standard Only</div>
            </div>
          </div>
        </div>

    

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              
              <button
                onClick={() => setFilterStatus('personalized')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'personalized'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personalized ({stats.personalized})
              </button>
              
              <button
                onClick={() => setFilterStatus('ai')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ai'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                AI Enabled ({stats.aiEnabled})
              </button>
              
              <button
                onClick={() => setFilterStatus('standard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'standard'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Standard ({stats.standard})
              </button>
            </div>
          </div>
        </div>

        {/* Prospects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FiSearch className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No prospects found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <motion.div
                key={prospect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/dashboard/campaigns/2/prospects/${prospect.id}/steps`)}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{prospect.name}</h3>
                        {prospect.hasPersonalizedSteps > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <FiCheck className="w-3 h-3 mr-0.5" />
                            {prospect.hasPersonalizedSteps}/{prospect.totalSteps}
                          </span>
                        )}
                        {prospect.hasAIGeneration && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            <FiZap className="w-3 h-3 mr-0.5" />
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{prospect.title}</p>
                      <p className="text-sm text-gray-500">{prospect.company}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <FiMail className="w-3 h-3 mr-1" />
                    {prospect.email}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Steps Configured</span>
                      <span className="text-xs text-gray-500">{prospect.hasPersonalizedSteps}/{prospect.totalSteps}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(prospect.hasPersonalizedSteps / prospect.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-400">
                      <FiClock className="w-3 h-3 mr-1" />
                      {new Date(prospect.lastUpdated).toLocaleDateString()}
                    </div>
                    <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200 transition-colors">
                      Configure Steps
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Click on any prospect to configure personalization for individual steps. 
            Each step can have different settings and AI capabilities.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignEmailPersonalizationPage;
