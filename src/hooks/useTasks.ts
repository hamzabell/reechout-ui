import useSWR, { mutate as globalMutate } from 'swr';
import React, { useCallback } from 'react';
import { Task, TaskFilters, TasksResponse, TaskStats, TaskStatus } from '../types';
import { useSWRMutation } from './useSWRMutation';
import { TasksService } from '../services/taskService';

// Custom fetcher for tasks API
const tasksFetcher = async ([url, params]: [string, any]) => {
  try {
    console.log('Tasks fetcher called with:', { url, params });
    const result = await TasksService.getTasks(params);
    console.log('Tasks fetcher result:', result);
    return result;
  } catch (error) {
    console.error('Tasks fetcher error:', error);
    throw error;
  }
};

// Hook for fetching user's tasks
export const useTasks = (filters?: TaskFilters & { userId: string }) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TasksResponse>(
    filters?.userId ? ['/tasks-get-tasks', filters] : null,
    tasksFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 2000,
    }
  );

  return {
    tasks: data?.tasks || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for fetching task statistics
export const useTaskStats = (userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TaskStats>(
    userId ? ['task-stats', userId] : null,
    async () => {
      if (!userId) throw new Error('User ID required');
      return await TasksService.getTaskStats(userId);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 10000, // Less frequent for stats
      focusThrottleInterval: 10000,
    }
  );

  return {
    stats: data || {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0
    },
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for updating task status with optimistic updates
export const useUpdateTaskStatus = () => {
  return useSWRMutation(
    '/tasks-update-task',
    'POST',
    {
      optimisticUpdate: (variables: any) => {
        const { taskId, status, userId } = variables;
        const previousStates = new Map();
        const now = new Date().toISOString();

        // Store previous states for potential rollback
        globalMutate(
          (key: any) => {
            // Match all task-related cache keys
            return Array.isArray(key) && (
              key[0] === '/tasks-get-tasks' ||
              key[0] === 'campaign-tasks' ||
              key[0] === 'overdue-tasks' ||
              key[0] === 'tasks-due-today' ||
              key[0] === 'search-tasks'
            );
          },
          (current: any, key: any) => {
            // Handle different cache structures
            if (Array.isArray(current)) {
              // For arrays of tasks (like campaign-tasks, overdue-tasks, etc.)
              const taskToUpdate = current.find((task: any) => task.id === taskId);
              if (taskToUpdate) {
                previousStates.set(JSON.stringify(key), { ...taskToUpdate });
              }

              return current.map((task: any) =>
                task.id === taskId
                  ? {
                      ...task,
                      status,
                      completedAt: status === 'COMPLETED' ? now : null,
                      isOverdue: status === 'PENDING' && task.dueDate ? new Date(task.dueDate) < new Date() : false
                    }
                  : task
              );
            } else if (current?.tasks) {
              // For paginated tasks response (like tasks-get-tasks)
              const taskToUpdate = current.tasks.find((task: any) => task.id === taskId);
              if (taskToUpdate) {
                previousStates.set(JSON.stringify(key), {
                  ...taskToUpdate,
                  status: taskToUpdate.status,
                  completedAt: taskToUpdate.completedAt,
                  isOverdue: taskToUpdate.isOverdue
                });
              }

              return {
                ...current,
                tasks: current.tasks.map((task: any) =>
                  task.id === taskId
                    ? {
                        ...task,
                        status,
                        completedAt: status === 'COMPLETED' ? now : null,
                        isOverdue: status === 'PENDING' && task.dueDate ? new Date(task.dueDate) < new Date() : false
                      }
                    : task
                )
              };
            }
            return current;
          },
          false
        );

        // Return rollback data and updated state
        return { taskId, status, previousStates, now };
      },
      onError: (error: any, variables, optimisticData) => {
        // Rollback on error
        if (optimisticData?.previousStates) {
          globalMutate(
            (key: any) => {
              return Array.isArray(key) && (
                key[0] === '/tasks-get-tasks' ||
                key[0] === 'campaign-tasks' ||
                key[0] === 'overdue-tasks' ||
                key[0] === 'tasks-due-today' ||
                key[0] === 'search-tasks'
              );
            },
            (current: any, key: any) => {
              const keyStr = JSON.stringify(key);
              const previousState = optimisticData.previousStates.get(keyStr);

              if (Array.isArray(current) && previousState) {
                // For arrays of tasks
                return current.map((task: any) =>
                  task.id === variables.taskId ? previousState : task
                );
              } else if (current?.tasks && previousState) {
                // For paginated tasks response
                return {
                  ...current,
                  tasks: current.tasks.map((task: any) =>
                    task.id === variables.taskId ? previousState : task
                  )
                };
              }
              return current;
            },
            false
          );
        }
      },
      invalidateQueries: [
        '/tasks-get-tasks',
        'campaign-tasks',
        'overdue-tasks',
        'tasks-due-today',
        'search-tasks'
      ],
      onSuccess: (data, variables) => {
        // Show specific success message based on status
        const statusMessages = {
          'COMPLETED': 'Task completed successfully',
          'CANCELLED': 'Task cancelled',
          'PENDING': 'Task reopened'
        };

        // We'll let the component handle the toast notification for more specific messaging
      },
      showToast: false, // Handle manually in component for better messaging
    }
  );
};

// Hook for completing a task
export const useCompleteTask = () => {
  const { trigger, isMutating } = useUpdateTaskStatus();

  const completeTask = useCallback(async (taskId: string, userId: string) => {
    return await trigger({ taskId, userId, status: 'COMPLETED' });
  }, [trigger]);

  return {
    trigger: completeTask,
    isMutating,
  };
};

// Hook for cancelling a task
export const useCancelTask = () => {
  const { trigger, isMutating } = useUpdateTaskStatus();

  const cancelTask = useCallback(async (taskId: string, userId: string) => {
    return await trigger({ taskId, userId, status: 'CANCELLED' });
  }, [trigger]);

  return {
    trigger: cancelTask,
    isMutating,
  };
};

// Hook for reopening a task
export const useReopenTask = () => {
  const { trigger, isMutating } = useUpdateTaskStatus();

  const reopenTask = useCallback(async (taskId: string, userId: string) => {
    return await trigger({ taskId, userId, status: 'PENDING' });
  }, [trigger]);

  return {
    trigger: reopenTask,
    isMutating,
  };
};

// Hook for getting tasks by campaign
export const useCampaignTasks = (campaignId?: string, userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Task[]>(
    campaignId && userId ? ['campaign-tasks', campaignId, userId] : null,
    {
      fetcher: async () => {
        if (!campaignId || !userId) return [];
        return await TasksService.getTasksByCampaign(campaignId, userId);
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 2000,
    }
  );

  return {
    tasks: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for getting overdue tasks
export const useOverdueTasks = (userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Task[]>(
    userId ? ['overdue-tasks', userId] : null,
    {
      fetcher: async () => {
        if (!userId) return [];
        return await TasksService.getOverdueTasks(userId);
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 10000, // Less frequent for overdue tasks
      focusThrottleInterval: 10000,
    }
  );

  return {
    tasks: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for getting tasks due today
export const useTasksDueToday = (userId?: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Task[]>(
    userId ? ['tasks-due-today', userId] : null,
    {
      fetcher: async () => {
        if (!userId) return [];
        return await TasksService.getTasksDueToday(userId);
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 5000, // More frequent for daily tasks
      focusThrottleInterval: 5000,
    }
  );

  return {
    tasks: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for searching tasks
export const useSearchTasks = () => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [userId, setUserId] = React.useState<string>('');

  const { data, error, isLoading, isValidating, mutate } = useSWR<Task[]>(
    searchQuery && userId ? ['search-tasks', searchQuery, userId] : null,
    {
      fetcher: async () => {
        if (!searchQuery || !userId) return [];
        return await TasksService.searchTasks(searchQuery, userId);
      },
      revalidateOnFocus: false, // Don't revalidate on focus for search results
      revalidateOnReconnect: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      dedupingInterval: 1000, // Short deduping for search
      focusThrottleInterval: 1000,
    }
  );

  const search = useCallback((query: string, currentUserId: string) => {
    setSearchQuery(query);
    setUserId(currentUserId);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setUserId('');
  }, []);

  return {
    tasks: data || [],
    searchQuery,
    search,
    clearSearch,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Utility hook for getting current user ID (to be implemented based on auth context)
export const useCurrentUserId = () => {
  // This would typically get the user ID from your auth context
  // For now, this is a placeholder - you should implement this based on your auth system
  const { data: authData } = useSWR('/auth/user');

  return {
    userId: authData?.user?.id || authData?.user?.neonUserId,
    isLoading: !authData,
  };
};

export default useTasks;