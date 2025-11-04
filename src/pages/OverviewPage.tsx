import React from 'react';

const OverviewPage: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    {
      label: 'Emails Sent',
      value: '1,284',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: 'fas fa-envelope'
    },
    {
      label: 'Reply Rate',
      value: '38%',
      change: '+8% from last month',
      changeType: 'positive' as const,
      icon: 'fas fa-reply'
    },
    {
      label: 'Active Campaigns',
      value: '42',
      change: '+3 new this week',
      changeType: 'positive' as const,
      icon: 'fas fa-bullseye'
    },
    {
      label: 'Total Prospects',
      value: '8,721',
      change: '+324 added this month',
      changeType: 'positive' as const,
      icon: 'fas fa-users'
    }
  ];

  const recentSequences = [
    {
      name: 'Q4 Tech Outreach',
      startDate: 'Nov 15, 2024',
      status: 'active' as const,
      sent: 450,
      opens: 312,
      replies: 171,
      replyRate: '38%'
    },
    {
      name: 'SaaS Startups',
      startDate: 'Nov 10, 2024',
      status: 'completed' as const,
      sent: 200,
      opens: 156,
      replies: 62,
      replyRate: '31%'
    },
    {
      name: 'Marketing Directors',
      startDate: 'Nov 5, 2024',
      status: 'paused' as const,
      sent: 180,
      opens: 98,
      replies: 41,
      replyRate: '23%'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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

      {/* Recent Sequences */}
      <div className="card">
        <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Recent Sequences</h3>
              <p className="text-slate-600 text-lg">Track the performance of your latest email sequences</p>
            </div>
            <button className="nav-item flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold">
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
              {recentSequences.map((sequence, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                  <td className="table-cell">
                    <div>
                      <div className="font-semibold text-slate-900 text-base">{sequence.name}</div>
                      <div className="text-sm text-slate-500">{sequence.startDate}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${sequence.status}`}>
                      {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-slate-900 font-semibold">{sequence.sent}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-slate-900 font-semibold">{sequence.opens}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-slate-900 font-semibold">{sequence.replies}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-emerald-600 font-bold text-base">{sequence.replyRate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
