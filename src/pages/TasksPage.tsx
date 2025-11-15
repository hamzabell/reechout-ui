import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiCalendar, FiAlertCircle, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { Task, TaskStatus } from '../types';
import { useTasks, useCompleteTask, useCancelTask, useReopenTask } from '../hooks/useTasks';
import { useNeon } from '../providers/NeonProvider';
import { useToast } from '../hooks/useToast';

const TasksPage: React.FC = () => {
  const { authState } = useNeon();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const userId = authState.user?.id || authState.user?.neonUserId;

  console.log('TasksPage - Full authState.user:', authState.user);
  console.log('TasksPage - userId resolution:', {
    id: authState.user?.id,
    neonUserId: authState.user?.neonUserId,
    selectedUserId: userId
  });

  console.log('TasksPage - userId:', userId);
  console.log('TasksPage - filter:', filter);

  // Get tasks hook
  const { tasks, pagination, isLoading, error, mutate } = useTasks(userId ? {
    userId: userId,
    status: filter === 'all' ? undefined : filter,
    limit,
    offset: (page - 1) * limit,
    sortBy: 'dueDate',
    sortOrder: 'asc'
  } : undefined);

  console.log('TasksPage - hook state:', {
    tasksCount: tasks.length,
    isLoading,
    error: error?.message,
    tasks
  });

  // Task action hooks
  const { trigger: completeTask, isMutating: isCompleting } = useCompleteTask();
  const { trigger: cancelTask, isMutating: isCancelling } = useCancelTask();
  const { trigger: reopenTask, isMutating: isReopening } = useReopenTask();

  const handleCompleteTask = async (taskId: string) => {
    if (!userId) return;

    try {
      await completeTask(taskId, userId);
      showToast('Task completed successfully', 'success');
    } catch (error) {
      showToast('Failed to complete task', 'error');
      // Refresh data to ensure consistency after error
      mutate();
    }
  };

  const handleUncompleteTask = async (taskId: string) => {
    if (!userId) return;

    try {
      await reopenTask(taskId, userId);
      showToast('Task reopened', 'success');
    } catch (error) {
      showToast('Failed to reopen task', 'error');
      // Refresh data to ensure consistency after error
      mutate();
    }
  };

  const handleCancelTask = async (taskId: string) => {
    if (!userId) return;

    try {
      await cancelTask(taskId, userId);
      showToast('Task cancelled', 'success');
    } catch (error) {
      showToast('Failed to cancel task', 'error');
      // Refresh data to ensure consistency after error
      mutate();
    }
  };

  const handleRefresh = () => {
    mutate();
  };

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

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
    <div className="p-6">

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map((filterOption) => (
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
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh tasks"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

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
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <FiCheck className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tasks found</p>
          {filter !== 'all' && (
            <p className="text-sm text-gray-400 mt-2">Try changing the filter or create tasks from campaign sequences</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task: Task) => (
            <div
              key={task.id}
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
                    <>
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={isCompleting}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Mark as complete"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleCancelTask(task.id)}
                        disabled={isCancelling}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancel task"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {task.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleUncompleteTask(task.id)}
                      disabled={isReopening}
                      className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reopen task"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                  {task.status === 'CANCELLED' && (
                    <button
                      onClick={() => handleUncompleteTask(task.id)}
                      disabled={isReopening}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reopen task"
                    >
                      <FiRefreshCw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages} ({pagination.total} tasks)
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* No User State */}
      {!userId && !isLoading && (
        <div className="text-center py-12">
          <FiAlertCircle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your tasks</p>
        </div>
      )}
    </div>
  );
};

export default TasksPage;