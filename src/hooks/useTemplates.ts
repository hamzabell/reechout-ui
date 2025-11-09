import useSWR from 'swr';
import { EmailTemplate } from '../types';
import { swrConfig, staticConfig } from '../lib/swr-config';
import { useSWRMutation, useOptimisticMutation } from './useSWRMutation';
import { useNeon } from '../providers/NeonProvider';

// Hook for fetching all email templates
export const useTemplates = () => {
  const { authState } = useNeon();

  // Only fetch templates if user is authenticated
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    templates: EmailTemplate[];
  }>(
    authState.isAuthenticated && authState.user ? `/templates?userId=${authState.user.id}` : null,
    staticConfig
  );

  return {
    templates: data?.templates || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for fetching a single template
export const useTemplate = (id: string) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    template: EmailTemplate;
  }>(id ? [`/templates/${id}`] : null, staticConfig);

  return {
    template: data?.template,
    isLoading,
    isValidating,
    error,
    mutate,
  };
};

// Hook for creating templates
export const useCreateTemplate = () => {
  return useOptimisticMutation(
    '/templates',
    'POST',
    (newTemplate: EmailTemplate) => (current: { templates: EmailTemplate[] }) => {
      const currentTemplates = current?.templates || [];
      return {
        templates: [newTemplate, ...currentTemplates],
      };
    },
    {
      invalidateQueries: ['/templates'],
    }
  );
};

// Hook for updating templates
export const useUpdateTemplate = (templateId: string) => {
  return useOptimisticMutation(
    `/templates/${templateId}`,
    'PUT',
    (variables: Partial<EmailTemplate>) => (current: { templates: EmailTemplate[] }) => {
      if (!current || !current.templates) {
        return current;
      }
      return {
        templates: current.templates.map(template =>
          template.id === templateId
            ? { ...template, ...variables, updatedAt: new Date().toISOString() }
            : template
        ),
      };
    },
    {
      invalidateQueries: [
        `/templates/${templateId}`,
        '/templates'
      ],
    }
  );
};

// Hook for deleting templates
export const useDeleteTemplate = (templateId: string) => {
  return useOptimisticMutation(
    `/templates/${templateId}`,
    'DELETE',
    () => (current: { templates: EmailTemplate[] }) => {
      if (!current || !current.templates) {
        return current;
      }
      return {
        templates: current.templates.filter(template => template.id !== templateId),
      };
    },
    {
      invalidateQueries: ['/templates'],
    }
  );
};

// Hook for duplicating templates
export const useDuplicateTemplate = () => {
  return useCreateTemplate();
};

// Hook for testing templates
export const useTestTemplate = (templateId: string) => {
  return useSWRMutation(
    `/templates/${templateId}/test`,
    'POST'
  );
};

// Hook for AI-generated templates
export const useGenerateTemplate = () => {
  return useSWRMutation(
    '/api/ai/generate-template',
    'POST',
    {
      invalidateQueries: ['/templates'],
    }
  );
};