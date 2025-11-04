import React from 'react';

interface SequencesStatsBarProps {
  totalSequences: number;
  activeSequences: number;
  completedSequences: number;
  totalEmailsSent: number;
  averageReplyRate: string;
  averageOpenRate: string;
}

const SequencesStatsBar: React.FC<SequencesStatsBarProps> = ({
  totalSequences,
  activeSequences,
  completedSequences,
  totalEmailsSent,
  averageReplyRate,
  averageOpenRate,
}) => {
  const stats = [
    {
      label: 'Total Sequences',
      value: totalSequences,
      icon: 'fas fa-bullhorn',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      description: `${activeSequences} active`,
    },
    {
      label: 'Emails Sent',
      value: totalEmailsSent.toLocaleString(),
      icon: 'fas fa-paper-plane',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Total delivered',
    },
    {
      label: 'Avg. Reply Rate',
      value: `${averageReplyRate}%`,
      icon: 'fas fa-reply',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: `${averageOpenRate}% open rate`,
    },
  ];

  return (
    <div className="card">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sequence Performance</h2>
            <p className="text-slate-600 text-lg">Monitor your email sequence metrics and performance indicators</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
            <i className="fas fa-sync-alt mr-2" />
            Last updated: Just now
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.bgColor} rounded-2xl p-8 border border-slate-200 hover-lift group`}>
              <div className="flex items-center justify-between mb-6">
                <div className={`${stat.color} opacity-80 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${stat.icon} text-2xl`} />
                </div>
                {stat.label === 'Total Sequences' && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-slate-900 mb-3">{stat.value}</div>
              <div className="text-lg text-slate-700 font-medium mb-2">{stat.label}</div>
              <div className="text-sm text-slate-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-sm text-slate-700 font-medium">Excellent Performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-slate-700 font-medium">Good Performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-sm text-slate-700 font-medium">Needs Attention</span>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center btn-secondary px-4 py-2">
              <i className="fas fa-download mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequencesStatsBar;
