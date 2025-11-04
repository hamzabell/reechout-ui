import { useState, useCallback } from 'react';
import AIService, { 
  AIResearchRequest, 
  AIResearchResponse, 
  PersonalizationRequest, 
  PersonalizationResponse 
} from '../services/aiService';

export interface AIState {
  loading: boolean;
  researching: boolean;
  personalizing: boolean;
  error: string | null;
}

export const useAI = () => {
  const [state, setState] = useState<AIState>({
    loading: false,
    researching: false,
    personalizing: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setResearching = useCallback((researching: boolean) => {
    setState(prev => ({ ...prev, researching }));
  }, []);

  const setPersonalizing = useCallback((personalizing: boolean) => {
    setState(prev => ({ ...prev, personalizing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * Research a lead using Lemonfox AI
   */
  const researchProspect = useCallback(async (request: AIResearchRequest): Promise<AIResearchResponse> => {
    setResearching(true);
    setError(null);
    
    try {
      const response = await AIService.researchProspect(request);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Research failed';
      setError(errorMessage);
      throw error;
    } finally {
      setResearching(false);
    }
  }, [setResearching, setError]);

  /**
   * Personalize email content for a lead
   */
  const personalizeEmail = useCallback(async (request: PersonalizationRequest): Promise<PersonalizationResponse> => {
    setPersonalizing(true);
    setError(null);
    
    try {
      const response = await AIService.personalizeEmail(request);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Personalization failed';
      setError(errorMessage);
      throw error;
    } finally {
      setPersonalizing(false);
    }
  }, [setPersonalizing, setError]);

  /**
   * Generate email template using AI
   */
  const generateTemplate = useCallback(async (prompt: string): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const template = await AIService.generateEmailTemplate(prompt);
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Template generation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Analyze email effectiveness
   */
  const analyzeEmail = useCallback(async (subject: string, body: string) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await AIService.analyzeEmail({ subject, body });
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email analysis failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Suggest optimal send time
   */
  const suggestOptimalSendTime = useCallback(async (leadData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const suggestion = await AIService.suggestOptimalSendTime(leadData);
      return suggestion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Send time suggestion failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  /**
   * Generate follow-up email
   */
  const generateFollowUp = useCallback(async (
    originalSubject: string,
    originalBody: string,
    responseReceived: boolean,
    daysSinceContact: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const followUp = await AIService.generateFollowUp(
        originalSubject,
        originalBody,
        responseReceived,
        daysSinceContact
      );
      return followUp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Follow-up generation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    // State
    ...state,
    
    // Actions
    clearError,
    
    // AI Operations
    researchProspect,
    personalizeEmail,
    generateTemplate,
    analyzeEmail,
    suggestOptimalSendTime,
    generateFollowUp,
  };
};
