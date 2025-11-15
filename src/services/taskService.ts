import { post } from './apiService';
import {
  Task,
  TaskFilters,
  TasksResponse,
  TaskUpdateData,
  TaskStats,
  TaskStatus
} from '../types';

export interface UpdateTaskRequest {
  taskId: string;
  status: TaskStatus;
}

export interface GetTasksRequest extends TaskFilters {
  userId: string;
}

export class TasksService {
  /**
   * Get user's tasks with filtering and pagination
   */
  static async getTasks(request: GetTasksRequest): Promise<TasksResponse> {
    try {
      const response = await post('/tasks-get-tasks', request);
      return response;
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tasks');
    }
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(request: UpdateTaskRequest & { userId: string }): Promise<{
    success: boolean;
    message: string;
    task: Task;
  }> {
    try {
      const response = await post('/tasks-update-task', request);
      return response;
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update task status');
    }
  }

  /**
   * Get task statistics for a user
   */
  static async getTaskStats(userId: string): Promise<TaskStats> {
    try {
      // Get all tasks to calculate stats
      const response = await this.getTasks({
        userId,
        limit: 1000 // Get all tasks for accurate stats
      });

      const tasks = response.tasks;
      const now = new Date();

      const stats: TaskStats = {
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'PENDING').length,
        completed: tasks.filter(task => task.status === 'COMPLETED').length,
        cancelled: tasks.filter(task => task.status === 'CANCELLED').length,
        overdue: tasks.filter(task => {
          if (task.status !== 'PENDING' || !task.dueDate) return false;
          return new Date(task.dueDate) < now;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get task stats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch task statistics');
    }
  }

  /**
   * Complete a task
   */
  static async completeTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await this.updateTaskStatus({
        taskId,
        userId,
        status: 'COMPLETED'
      });
      return response.task;
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to complete task');
    }
  }

  /**
   * Cancel a task
   */
  static async cancelTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await this.updateTaskStatus({
        taskId,
        userId,
        status: 'CANCELLED'
      });
      return response.task;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel task');
    }
  }

  /**
   * Reopen a task (change status back to PENDING)
   */
  static async reopenTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await this.updateTaskStatus({
        taskId,
        userId,
        status: 'PENDING'
      });
      return response.task;
    } catch (error) {
      console.error('Failed to reopen task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reopen task');
    }
  }

  /**
   * Get tasks by campaign
   */
  static async getTasksByCampaign(campaignId: string, userId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        userId,
        campaignId,
        limit: 1000
      });
      return response.tasks;
    } catch (error) {
      console.error('Failed to get campaign tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign tasks');
    }
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        userId,
        sortBy: 'dueDate',
        sortOrder: 'asc',
        limit: 1000
      });

      const now = new Date();
      return response.tasks.filter(task =>
        task.status === 'PENDING' &&
        task.dueDate &&
        new Date(task.dueDate) < now
      );
    } catch (error) {
      console.error('Failed to get overdue tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch overdue tasks');
    }
  }

  /**
   * Get tasks due today
   */
  static async getTasksDueToday(userId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        userId,
        sortBy: 'dueDate',
        sortOrder: 'asc',
        limit: 1000
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return response.tasks.filter(task =>
        task.status === 'PENDING' &&
        task.dueDate &&
        new Date(task.dueDate) >= today &&
        new Date(task.dueDate) < tomorrow
      );
    } catch (error) {
      console.error('Failed to get tasks due today:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tasks due today');
    }
  }

  /**
   * Search tasks
   */
  static async searchTasks(query: string, userId: string): Promise<Task[]> {
    try {
      const response = await this.getTasks({
        userId,
        search: query,
        limit: 1000
      });
      return response.tasks;
    } catch (error) {
      console.error('Failed to search tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search tasks');
    }
  }
}

export default TasksService;