import React from 'react';
import { useOverviewData } from '../hooks/useOverview';
import { OverviewStats, Campaign } from '../types';

const OverviewPage: React.FC = () => {
  const { stats, recentCampaigns, isLoading, error, refresh } = useOverviewData();

  // Format stats for display
  const formatStats = (stats: OverviewStats | undefined) => {
    if (!stats) return [];

    return [
      {
        label: 'Emails Sent',
        value: stats.totalEmailsSent.toLocaleString(),
        change: `${stats.monthlyChange.emailsSent >= 0 ? '+' : ''}${stats.monthlyChange.emailsSent}% from last ${stats.period}`,
        changeType: stats.monthlyChange.emailsSent >= 0 ? 'positive' as const : 'negative' as const,
        icon: 'fas fa-envelope'
      },
      {
        label: 'Reply Rate',
        value: `${stats.totalReplyRate}%`,
        change: `${stats.monthlyChange.replyRate >= 0 ? '+' : ''}${stats.monthlyChange.replyRate}% from last ${stats.period}`,
        changeType: stats.monthlyChange.replyRate >= 0 ? 'positive' as const : 'negative' as const,
        icon: 'fas fa-reply'
      },
      {
        label: 'Active Sequences',
        value: stats.activeCampaigns.toString(),
        change: `${stats.monthlyChange.campaigns >= 0 ? '+' : ''}${stats.monthlyChange.campaigns}% from last ${stats.period}`,
        changeType: stats.monthlyChange.campaigns >= 0 ? 'positive' as const : 'negative' as const,
        icon: 'fas fa-bullseye'
      },
      {
        label: 'Total Prospects',
        value: stats.totalProspects.toLocaleString(),
        change: `${stats.monthlyChange.prospects >= 0 ? '+' : ''}${stats.monthlyChange.prospects}% from last ${stats.period}`,
        changeType: stats.monthlyChange.prospects >= 0 ? 'positive' as const : 'negative' as const,
        icon: 'fas fa-users'
      }
    ];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const displayStats = formatStats(stats);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4" />
            <p className="text-text-secondary">Loading overview data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card">
          <div className="p-8 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Overview</h3>
            <p className="text-slate-600 mb-4">Unable to load overview data. Please try again.</p>
            <button 
              onClick={refresh}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-refresh mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => (
          <div key={index} className="stat-card hover-lift group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <i className={`${stat.icon} text-blue-600 text-xl`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-lg font-semibold text-slate-700">{stat.label}</div>
              <div className={`text-sm stat-change ${stat.changeType} flex items-center space-x-1`}>
                <i className={`fas fa-arrow-${stat.changeType === 'positive' ? 'up' : 'down'} text-xs`}></i>
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Recent Sequences</h3>
              <p className="text-slate-600 text-lg">Track the performance of your latest email sequences</p>
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard/campaigns'}
              className="nav-item flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              <span>View All</span>
              <i className="fas fa-arrow-right text-sm"></i>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="table-header">Sequence</th>
                <th className="table-header">Status</th>
                <th className="table-header">Sent</th>
                <th className="table-header">Opens</th>
                <th className="table-header">Replies</th>
                <th className="table-header">Reply Rate</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-slate-500">
                    No sequences found. Create your first sequence to get started.
                  </td>
                </tr>
              ) : (
                recentCampaigns.map((campaign, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 cursor-pointer" onClick={() => window.location.href = `/dashboard/campaigns/${campaign.id}`}>
                    <td className="table-cell">
                      <div>
                        <div className="font-semibold text-slate-900 text-base">{campaign.name}</div>
                        <div className="text-sm text-slate-500">{formatDate(campaign.createdAt)}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${campaign.status}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-slate-900 font-semibold">{campaign.sent}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-slate-900 font-semibold">{campaign.opens}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-slate-900 font-semibold">{campaign.replies}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-emerald-600 font-bold text-base">{campaign.replyRate}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
  );
};

export default OverviewPage;
