import { post, API_ENDPOINTS } from './apiService';

export interface PersonalizeEmailRequest {
  prospectId: string;
  templateId?: string;
  customTemplate?: {
    subject: string;
    body: string;
  };
  personalizationLevel?: 'low' | 'medium' | 'high';
  tone?: 'professional' | 'casual' | 'friendly';
  maxLength?: number;
}

export interface PersonalizeEmailResponse {
  success: boolean;
  personalizedEmail: {
    subject: string;
    body: string;
    personalizationHighlights: string[];
    callToAction: string;
    score: number;
    variablesUsed: string[];
  };
  prospect: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
}

export interface GenerateTemplateRequest {
  purpose: string;
  industry?: string;
  tone?: 'professional' | 'casual' | 'friendly';
  length?: 'short' | 'medium' | 'long';
  includeCallToAction?: boolean;
}

export interface GenerateTemplateResponse {
  success: boolean;
  template: {
    subject: string;
    body: string;
    variables: string[];
    category?: string;
  };
}

export interface AnalyzeEmailRequest {
  subject: string;
  body: string;
  targetIndustry?: string;
  targetRole?: string;
}

export interface AnalyzeEmailResponse {
  success: boolean;
  analysis: {
    overallScore: number;
    readabilityScore: number;
    personalizationScore: number;
    callToActionClarity: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    predictedOpenRate?: number;
    predictedReplyRate?: number;
  };
}

export interface ResearchLeadRequest {
  prospectId: string;
  researchType?: 'basic' | 'comprehensive' | 'deep';
  // Legacy properties for backward compatibility
  name?: string;
  company?: string;
  website?: string;
}

export interface ResearchLeadResponse {
  success: boolean;
  message: string;
  researchData: any;
  personalizationData: any;
  prospectScore: number;
  cached: boolean;
}

// Legacy exports for backward compatibility
export interface AIResearchRequest extends ResearchLeadRequest {}
export interface AIResearchResponse extends ResearchLeadResponse {}
export interface PersonalizationRequest extends PersonalizeEmailRequest {}
export interface PersonalizationResponse extends PersonalizeEmailResponse {}

class AIService {
  /**
   * Personalize an email for a specific prospect using AI
   */
  static async personalizeEmail(request: PersonalizeEmailRequest): Promise<PersonalizeEmailResponse> {
    try {
      const response = await post(API_ENDPOINTS.PERSONALIZE_EMAIL, request);
      return response;
    } catch (error) {
      console.error('Failed to personalize email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to personalize email');
    }
  }

  /**
   * Generate an email template using AI
   */
  static async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    try {
      const response = await post(API_ENDPOINTS.GENERATE_TEMPLATE, request);
      return response;
    } catch (error) {
      console.error('Failed to generate template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate template');
    }
  }

  /**
   * Analyze email effectiveness using AI
   */
  static async analyzeEmail(request: AnalyzeEmailRequest): Promise<AnalyzeEmailResponse> {
    try {
      const response = await post(API_ENDPOINTS.ANALYZE_EMAIL, request);
      return response;
    } catch (error) {
      console.error('Failed to analyze email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze email');
    }
  }

  /**
   * Research a prospect using AI (Lemonfox.ai integration)
   */
  static async researchProspect(request: ResearchLeadRequest): Promise<ResearchLeadResponse> {
    try {
      const response = await post(API_ENDPOINTS.RESEARCH_LEAD, request);
      return response;
    } catch (error) {
      console.error('Failed to research prospect:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to research prospect');
    }
  }

  /**
   * Batch personalize emails for multiple prospects
   */
  static async batchPersonalizeEmails(requests: PersonalizeEmailRequest[]): Promise<PersonalizeEmailResponse[]> {
    try {
      const response = await post('/api/ai/batch-personalize-emails', { requests });
      return response.data.results;
    } catch (error) {
      console.error('Failed to batch personalize emails:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to batch personalize emails');
    }
  }

  /**
   * Get AI-powered prospect insights
   */
  static async getLeadInsights(prospectId: string): Promise<{
    success: boolean;
    insights: {
      bestContactTime: string;
      preferredCommunicationStyle: string;
      keyInterests: string[];
      potentialPainPoints: string[];
      recommendedApproach: string;
    };
  }> {
    try {
      const response = await post('/api/ai/prospect-insights', { prospectId });
      return response;
    } catch (error) {
      console.error('Failed to get prospect insights:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get prospect insights');
    }
  }

  /**
   * Generate follow-up email sequence
   */
  static async generateFollowUpSequence(
    prospectId: string,
    initialEmailContent: string,
    sequenceLength: number = 3
  ): Promise<{
    success: boolean;
    sequence: Array<{
      dayNumber: number;
      subject: string;
      body: string;
      purpose: string;
    }>;
  }> {
    try {
      const response = await post('/api/ai/generate-follow-up-sequence', {
        prospectId,
        initialEmailContent,
        sequenceLength
      });
      return response;
    } catch (error) {
      console.error('Failed to generate follow-up sequence:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate follow-up sequence');
    }
  }

  /**
   * Optimize send time for emails
   */
  static async optimizeSendTime(prospectIds: string[]): Promise<{
    success: boolean;
    optimizations: Array<{
      prospectId: string;
      optimalSendTime: string;
      timezone: string;
      confidence: number;
    }>;
  }> {
    try {
      const response = await post('/api/ai/optimize-send-time', { prospectIds });
      return response;
    } catch (error) {
      console.error('Failed to optimize send time:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to optimize send time');
    }
  }

  /**
   * Analyze campaign performance and provide recommendations
   */
  static async analyzeCampaignPerformance(campaignId: string): Promise<{
    success: boolean;
    analysis: {
      overallPerformance: 'excellent' | 'good' | 'average' | 'poor';
      keyMetrics: {
        openRate: number;
        replyRate: number;
        clickRate: number;
        bounceRate: number;
      };
      recommendations: string[];
      a_b_testSuggestions?: Array<{
        variable: string;
        suggestion: string;
        potentialImpact: string;
      }>;
    };
  }> {
    try {
      const response = await post('/api/ai/analyze-campaign-performance', { campaignId });
      return response;
    } catch (error) {
      console.error('Failed to analyze campaign performance:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze campaign performance');
    }
  }

  /**
   * Generate subject line variations
   */
  static async generateSubjectLineVariations(
    baseSubject: string,
    count: number = 5
  ): Promise<{
    success: boolean;
    variations: Array<{
      subject: string;
      predictedOpenRate: number;
      style: 'professional' | 'casual' | 'curious' | 'urgent';
    }>;
  }> {
    try {
      const response = await post('/api/ai/generate-subject-variations', {
        baseSubject,
        count
      });
      return response;
    } catch (error) {
      console.error('Failed to generate subject line variations:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate subject line variations');
    }
  }

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use personalizeEmail instead
   */
  static async generateEmailTemplate(prompt: string): Promise<string> {
    try {
      const response = await this.generateTemplate({
        purpose: prompt,
        tone: 'professional',
        length: 'medium',
        includeCallToAction: true
      });
      return `${response.template.subject}\n\n${response.template.body}`;
    } catch (error) {
      console.error('Template generation failed:', error);
      throw new Error('Failed to generate email template');
    }
  }

  /**
   * @deprecated Use analyzeEmail instead
   */
  static async analyzeEmailLegacy(subject: string, body: string): Promise<{
    score: number;
    suggestions: string[];
    strengths: string[];
  }> {
    try {
      const response = await this.analyzeEmail({ subject, body });
      return {
        score: response.analysis.overallScore,
        suggestions: response.analysis.suggestions,
        strengths: response.analysis.strengths
      };
    } catch (error) {
      console.error('Email analysis failed:', error);
      throw new Error('Failed to analyze email');
    }
  }

  /**
   * @deprecated Legacy method for optimal send time
   */
  static async suggestOptimalSendTime(prospectData: any): Promise<{
    dayOfWeek: string;
    timeOfDay: string;
    timezone: string;
    reasoning: string;
  }> {
    try {
      // Mock suggestion logic - in production this would use AI
      const days = ['Tuesday', 'Wednesday', 'Thursday'];
      const times = ['9:00 AM', '10:00 AM', '2:00 PM'];

      return {
        dayOfWeek: days[Math.floor(Math.random() * days.length)],
        timeOfDay: times[Math.floor(Math.random() * times.length)],
        timezone: 'UTC',
        reasoning: 'Based on industry standards and typical engagement patterns'
      };
    } catch (error) {
      console.error('Send time suggestion failed:', error);
      throw new Error('Failed to suggest optimal send time');
    }
  }

  /**
   * @deprecated Legacy method for follow-up generation
   */
  static async generateFollowUp(
    originalSubject: string,
    originalBody: string,
    responseReceived: boolean,
    daysSinceContact: number
  ): Promise<string> {
    try {
      if (!responseReceived) {
        return `Hi {{firstName}},

Just wanted to follow up on my previous email about ${this.extractTopic(originalBody)}.

I understand you're busy, but I believe this could be valuable for {{company}}.

Best regards,
{{senderName}}`;
      } else {
        return `Hi {{firstName}},

Thank you for your response!

Based on your interest in ${this.extractTopic(originalBody)}, I'd love to share more details.

Best regards,
{{senderName}}`;
      }
    } catch (error) {
      console.error('Follow-up generation failed:', error);
      throw new Error('Failed to generate follow-up email');
    }
  }

  private static extractTopic(body: string): string {
    // Simple topic extraction - in production this would be more sophisticated
    const topics = ['our solution', 'our services', 'our platform', 'our product'];
    for (const topic of topics) {
      if (body.toLowerCase().includes(topic)) {
        return topic;
      }
    }
    return 'our collaboration';
  }
}

export default AIService;
