import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiCalendar, FiAlertCircle, FiFilter, FiRefreshCw } from 'react-icons/fi';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  campaignName: string;
  day: number;
  stepName?: string;
  isOverdue: boolean;
  daysUntilDue?: number;
}

interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Mock task data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Review email copy for Welcome Series',
    description: 'Check personalization tokens and grammar',
    status: 'PENDING',
    dueDate: '2024-01-20T00:00:00Z',
    campaignName: 'Welcome Series',
    day: 2,
    stepName: 'Content Review',
    isOverdue: false,
    daysUntilDue: 2,
  },
  {
    id: '2',
    title: 'Approve target audience for Product Launch',
    description: 'Validate segmentation criteria',
    status: 'COMPLETED',
    dueDate: '2024-01-18T00:00:00Z',
    campaignName: 'Product Launch',
    day: 1,
    stepName: 'Audience Selection',
    isOverdue: false,
    daysUntilDue: 0,
  },
  {
    id: '3',
    title: 'Schedule Re-engagement Sequence',
    description: 'Set delivery dates and times',
    status: 'PENDING',
    dueDate: '2024-01-16T00:00:00Z',
    campaignName: 'Re-engagement Sequence',
    day: 4,
    stepName: 'Scheduling',
    isOverdue: true,
    daysUntilDue: -1,
  },
  {
    id: '4',
    title: 'Test email templates',
    description: 'Check rendering on different devices',
    status: 'PENDING',
    dueDate: '2024-01-22T00:00:00Z',
    campaignName: 'Newsletter January',
    day: 3,
    stepName: 'Template Testing',
    isOverdue: false,
    daysUntilDue: 4,
  },
  {
    id: '5',
    title: 'Review analytics for Holiday Promotion',
    description: 'Analyze open rates and conversions',
    status: 'CANCELLED',
    dueDate: '2024-01-17T00:00:00Z',
    campaignName: 'Holiday Promotion',
    day: 5,
    stepName: 'Performance Review',
    isOverdue: false,
    daysUntilDue: -1,
  },
  {
    id: '6',
    title: 'Update prospect list for Q1 sequences',
    description: 'Add new leads and remove inactive ones',
    status: 'PENDING',
    dueDate: '2024-01-25T00:00:00Z',
    campaignName: 'Q1 Planning',
    day: 1,
    stepName: 'List Management',
    isOverdue: false,
    daysUntilDue: 7,
  },
];

const TasksPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filter mock tasks based on selected filter
  const filteredTasks = filter === 'all'
    ? mockTasks
    : mockTasks.filter(task => task.status === filter);

  // Paginate filtered tasks
  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / limit);
  const startIndex = (page - 1) * limit;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + limit);

  // Create mock tasksData object
  const tasksData: TasksResponse = {
    tasks: paginatedTasks,
    pagination: {
      page,
      limit,
      total: totalTasks,
      totalPages,
    },
  };

  const isLoading = false;
  const error = null;

  const handleCompleteTask = (taskId: string) => {
    // Frontend-only - just show an alert
    alert('Task marked as complete (demo mode)');
  };

  const handleUncompleteTask = (taskId: string) => {
    // Frontend-only - just show an alert
    alert('Task marked as incomplete (demo mode)');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDueDateColor = (task: Task) => {
    if (!task.dueDate) return 'text-gray-500';
    if (task.isOverdue) return 'text-red-600 font-semibold';
    if (task.daysUntilDue === 0) return 'text-orange-600 font-semibold';
    if (task.daysUntilDue === 1) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getDueDateText = (task: Task) => {
    if (!task.dueDate) return 'No due date';
    if (task.isOverdue) return `${Math.abs(task.daysUntilDue || 0)} days overdue`;
    if (task.daysUntilDue === 0) return 'Due today';
    if (task.daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${task.daysUntilDue} days`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6"
    >

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-wrap gap-4 items-center"
      >
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'PENDING', 'COMPLETED', 'CANCELLED'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterOption.charAt(0) + filterOption.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh (Demo)"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <FiRefreshCw className="animate-spin text-2xl text-gray-400 mr-3" />
          <span className="text-gray-500">Loading tasks...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load tasks</p>
        </div>
      ) : tasksData?.tasks.length === 0 ? (
        <div className="text-center py-12">
          <FiCheck className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="space-y-4"
        >
          {tasksData?.tasks.map((task: Task) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              className={`bg-white rounded-lg shadow-sm border p-6 ${
                task.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-semibold ${
                      task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {task.isOverdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Overdue
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      <span className={getDueDateColor(task)}>
                        {getDueDateText(task)}
                      </span>
                    </div>
                    <div>
                      Sequence: <span className="font-medium text-gray-700">{task.campaignName}</span>
                    </div>
                    <div>
                      Step {task.day}
                      {task.stepName && (
                        <span className="text-gray-700 font-medium">: {task.stepName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Mark as complete (Demo)"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}
                  {task.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleUncompleteTask(task.id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                      title="Mark as incomplete (Demo)"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {tasksData && tasksData.pagination.totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="mt-8 flex justify-center items-center gap-4"
        >
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {tasksData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === tasksData.pagination.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TasksPage;