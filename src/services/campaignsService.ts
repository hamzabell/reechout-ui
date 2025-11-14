import { get, post, put, deleteRequest as del } from './apiService';
import {
  Campaign,
  EmailTemplate,
  GeneratedEmail,
  EmailGenerationRequest,
  BulkApprovalRequest,
  CampaignAnalytics as CampaignAnalyticsType,
  ApprovalRecord,
  EmailFeedback,
  CampaignCreationData,
  CampaignSettings
} from '../types';

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  templateId: string;
  prospectIds: string[];
  settings: {
    sendImmediately?: boolean;
    scheduledDate?: string;
    dailyLimit?: number;
    sendTime?: string;
  };
}

export interface UpdateCampaignRequest {
  id: string;
  data: Partial<Campaign>;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

export interface UpdateTemplateRequest {
  id: string;
  data: Partial<EmailTemplate>;
}

export interface SendCampaignRequest {
  campaignId: string;
  testMode?: boolean;
}

export interface CampaignAnalytics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

export class CampaignsService {
  /**
   * Get all campaigns
   */
  static async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await get('/campaigns');
      return response.campaigns || [];
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaigns');
    }
  }

  /**
   * Get a single campaign by ID
   */
  static async getCampaign(id: string): Promise<Campaign> {
    try {
      const response = await get(`/campaigns/${id}`);
      return response.campaign;
    } catch (error) {
      console.error('Failed to get campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign');
    }
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(request: CreateCampaignRequest): Promise<Campaign> {
    try {
      const response = await post('/campaigns', request);
      return response.campaign;
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  }

  /**
   * Update an existing campaign
   */
  static async updateCampaign(request: UpdateCampaignRequest): Promise<Campaign> {
    try {
      const response = await put(`/campaigns/${request.id}`, request.data);
      return response.campaign;
    } catch (error) {
      console.error('Failed to update campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update campaign');
    }
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id: string): Promise<void> {
    try {
      await del(`/campaigns/${id}`);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  }

  /**
   * Send a campaign
   */
  static async sendCampaign(request: SendCampaignRequest): Promise<{
    success: boolean;
    message: string;
    scheduled?: boolean;
    estimatedDelivery?: string;
  }> {
    try {
      const response = await post(`/campaigns/${request.campaignId}/send`, {
        testMode: request.testMode || false,
      });
      return response;
    } catch (error) {
      console.error('Failed to send campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send campaign');
    }
  }


  // Email Templates

  /**
   * Get all email templates
   */
  static async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await get('/templates');
      return response.templates || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch templates');
    }
  }

  /**
   * Get a single template by ID
   */
  static async getTemplate(id: string): Promise<EmailTemplate> {
    try {
      const response = await get(`/templates/${id}`);
      return response.template;
    } catch (error) {
      console.error('Failed to get template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch template');
    }
  }

  /**
   * Create a new email template
   */
  static async createTemplate(request: CreateTemplateRequest): Promise<EmailTemplate> {
    try {
      const response = await post('/templates', request);
      return response.template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create template');
    }
  }

  /**
   * Update an existing template
   */
  static async updateTemplate(request: UpdateTemplateRequest): Promise<EmailTemplate> {
    try {
      const response = await put(`/templates/${request.id}`, request.data);
      return response.template;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update template');
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      await del(`/templates/${id}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete template');
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicateTemplate(id: string, newName: string): Promise<EmailTemplate> {
    try {
      const response = await post(`/templates/${id}/duplicate`, { name: newName });
      return response.template;
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to duplicate template');
    }
  }

  /**
   * Test email template
   */
  static async testTemplate(templateId: string, testEmail: string): Promise<{
    success: boolean;
    message: string;
    deliveryTime?: string;
  }> {
    try {
      const response = await post(`/templates/${templateId}/test`, { email: testEmail });
      return response;
    } catch (error) {
      console.error('Failed to test template:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to test template');
    }
  }

  // Email Generation and Management

  /**
   * Generate personalized emails for a campaign
   */
  static async generateEmails(request: EmailGenerationRequest): Promise<{
    success: boolean;
    message: string;
    emails: GeneratedEmail[];
    totalGenerated: number;
    averagePersonalizationScore: number;
  }> {
    try {
      const response = await post('/campaigns/generate-emails', request);
      return response;
    } catch (error) {
      console.error('Failed to generate emails:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate emails');
    }
  }

  /**
   * Get all generated emails for a campaign
   */
  static async getCampaignEmails(
    campaignId: string,
    filters?: {
      status?: string;
      search?: string;
      sortBy?: 'createdAt' | 'personalizationScore' | 'status';
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    emails: GeneratedEmail[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await get(`/campaigns/${campaignId}/emails?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get campaign emails:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign emails');
    }
  }

  /**
   * Get a single generated email by ID
   */
  static async getEmail(emailId: string): Promise<GeneratedEmail> {
    try {
      const response = await get(`/emails/${emailId}`);
      return response.email;
    } catch (error) {
      console.error('Failed to get email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch email');
    }
  }

  /**
   * Update a generated email
   */
  static async updateEmail(emailId: string, data: Partial<GeneratedEmail>): Promise<GeneratedEmail> {
    try {
      const response = await put(`/emails/${emailId}`, data);
      return response.email;
    } catch (error) {
      console.error('Failed to update email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update email');
    }
  }

  /**
   * Delete a generated email
   */
  static async deleteEmail(emailId: string): Promise<void> {
    try {
      await del(`/emails/${emailId}`);
    } catch (error) {
      console.error('Failed to delete email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete email');
    }
  }

  /**
   * Regenerate a single email with AI
   */
  static async regenerateEmail(emailId: string, options?: {
    newPrompt?: string;
    keepPersonalization?: boolean;
    variationType?: 'subject' | 'body' | 'full';
  }): Promise<GeneratedEmail> {
    try {
      const response = await post(`/emails/${emailId}/regenerate`, options);
      return response.email;
    } catch (error) {
      console.error('Failed to regenerate email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to regenerate email');
    }
  }

  // Approval Workflow

  /**
   * Submit email for approval
   */
  static async submitForApproval(emailId: string): Promise<{
    success: boolean;
    message: string;
    email: GeneratedEmail;
  }> {
    try {
      const response = await post(`/emails/${emailId}/submit-approval`, {});
      return response;
    } catch (error) {
      console.error('Failed to submit for approval:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to submit for approval');
    }
  }

  /**
   * Approve an email
   */
  static async approveEmail(emailId: string, comments?: string): Promise<{
    success: boolean;
    message: string;
    email: GeneratedEmail;
    approvalRecord: ApprovalRecord;
  }> {
    try {
      const response = await post(`/emails/${emailId}/approve`, { comments });
      return response;
    } catch (error) {
      console.error('Failed to approve email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to approve email');
    }
  }

  /**
   * Reject an email
   */
  static async rejectEmail(
    emailId: string,
    reason: string,
    requestedChanges?: string[]
  ): Promise<{
    success: boolean;
    message: string;
    email: GeneratedEmail;
    approvalRecord: ApprovalRecord;
  }> {
    try {
      const response = await post(`/emails/${emailId}/reject`, {
        reason,
        requestedChanges,
      });
      return response;
    } catch (error) {
      console.error('Failed to reject email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reject email');
    }
  }

  /**
   * Add feedback to an email
   */
  static async addEmailFeedback(emailId: string, feedback: Omit<EmailFeedback, 'reviewedBy' | 'reviewedAt'>): Promise<{
    success: boolean;
    message: string;
    feedback: EmailFeedback;
  }> {
    try {
      const response = await post(`/emails/${emailId}/feedback`, feedback);
      return response;
    } catch (error) {
      console.error('Failed to add feedback:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add feedback');
    }
  }

  /**
   * Bulk approve/reject emails
   */
  static async bulkApproval(request: BulkApprovalRequest): Promise<{
    success: boolean;
    message: string;
    processed: number;
    results: {
      emailId: string;
      success: boolean;
      message: string;
    }[];
  }> {
    try {
      const response = await post('/emails/bulk-approval', request);
      return response;
    } catch (error) {
      console.error('Failed to process bulk approval:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process bulk approval');
    }
  }

  // Scheduling and Sending

  /**
   * Schedule emails for sending
   */
  static async scheduleEmails(
    campaignId: string,
    emailIds: string[],
    scheduledDate: string,
    options?: {
      dailyLimit?: number;
      sendTime?: string;
      timezone?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    scheduled: number;
    scheduledDate: string;
  }> {
    try {
      const response = await post(`/campaigns/${campaignId}/schedule`, {
        emailIds,
        scheduledDate,
        ...options,
      });
      return response;
    } catch (error) {
      console.error('Failed to schedule emails:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to schedule emails');
    }
  }

  /**
   * Send emails immediately
   */
  static async sendEmails(
    campaignId: string,
    emailIds: string[],
    options?: {
      testMode?: boolean;
      dailyLimit?: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    sent: number;
    scheduled: number;
    estimatedDelivery?: string;
  }> {
    try {
      const response = await post(`/campaigns/${campaignId}/send`, {
        emailIds,
        ...options,
      });
      return response;
    } catch (error) {
      console.error('Failed to send emails:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send emails');
    }
  }

  /**
   * Pause a campaign
   */
  static async pauseCampaign(campaignId: string): Promise<{
    success: boolean;
    message: string;
    campaign: Campaign;
  }> {
    try {
      const response = await put(`/campaigns/${campaignId}/pause`, {});
      return response;
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to pause campaign');
    }
  }

  /**
   * Resume a paused campaign
   */
  static async resumeCampaign(campaignId: string): Promise<{
    success: boolean;
    message: string;
    campaign: Campaign;
  }> {
    try {
      const response = await put(`/campaigns/${campaignId}/resume`, {});
      return response;
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to resume campaign');
    }
  }

  // Campaign Analytics and Performance

  /**
   * Get comprehensive campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalyticsType> {
    try {
      const response = await get(`/campaigns/${campaignId}/analytics`);
      return response.analytics;
    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign analytics');
    }
  }

  /**
   * Get campaign performance over time
   */
  static async getCampaignPerformance(
    campaignId: string,
    period: '24h' | '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  }[]> {
    try {
      const response = await get(`/campaigns/${campaignId}/performance?period=${period}`);
      return response.performance || [];
    } catch (error) {
      console.error('Failed to get campaign performance:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaign performance');
    }
  }

  /**
   * Get email performance details
   */
  static async getEmailPerformance(emailId: string): Promise<{
    email: GeneratedEmail;
    events: {
      type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced';
      timestamp: string;
      details?: any;
    }[];
    performance: {
      openRate: number;
      clickRate: number;
      replyRate: number;
      timeToOpen?: number;
      timeToReply?: number;
    };
  }> {
    try {
      const response = await get(`/emails/${emailId}/performance`);
      return response;
    } catch (error) {
      console.error('Failed to get email performance:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch email performance');
    }
  }

  // Campaign Management with Enhanced Features

  /**
   * Create campaign from wizard data
   */
  static async createCampaignFromWizard(data: CampaignCreationData): Promise<{
    success: boolean;
    message: string;
    campaign: Campaign;
    emailsGenerated?: number;
  }> {
    try {
      const campaignData = {
        name: data.step1.name,
        description: data.step1.description,
        prospectIds: data.step2.prospectIds,
        templateId: data.step3.templateId,
        generateWithAI: data.step3.generateWithAI,
        aiPrompt: data.step3.aiPrompt,
        settings: {
          sendImmediately: data.step4.sendImmediately,
          scheduledDate: data.step4.scheduledDate,
          dailyLimit: data.step4.dailyLimit,
          sendTime: data.step4.sendTime,
          timezone: data.step4.timezone,
          enableFollowUps: false,
          trackOpens: true,
          trackClicks: true,
          personalizationLevel: data.step4.personalizationLevel,
        } as CampaignSettings,
        enableABTest: data.step4.enableABTest,
      };

      const response = await post('/campaigns/create-from-wizard', campaignData);
      return response;
    } catch (error) {
      console.error('Failed to create campaign from wizard:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  }

  /**
    * Add prospects to a campaign
    */
  static async addProspectsToCampaign(campaignId: string, prospectIds: string[], userId: string): Promise<{
    success: boolean;
    status: string;
    message: string;
    added: number;
    duplicates: number;
    duplicateProspects: any[];
    campaignProspects: any[];
  }> {
    try {
      const response = await post('/campaigns-add-prospects', {
        campaignId,
        prospectIds,
        userId
      });
      return response;
    } catch (error) {
      console.error('Failed to add prospects to campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add prospects to campaign');
    }
  }

  /**
    * Remove a prospect from a campaign
    */
  static async removeProspectFromCampaign(campaignId: string, prospectId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await post('/campaigns-remove-prospect', {
        campaignId,
        prospectId,
        userId
      });
      return response;
    } catch (error) {
      console.error('Failed to remove prospect from campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to remove prospect from campaign');
    }
  }

  /**
    * Duplicate a campaign
    */
  static async duplicateCampaign(campaignId: string, newName: string): Promise<{
    success: boolean;
    message: string;
    campaign: Campaign;
  }> {
    try {
      const response = await post(`/campaigns/${campaignId}/duplicate`, { name: newName });
      return response;
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to duplicate campaign');
    }
  }

  /**
   * Get campaigns with advanced filtering
   */
  static async getCampaignsAdvanced(filters?: {
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status' | 'sent' | 'replyRate';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{
    campaigns: Campaign[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start);
        params.append('endDate', filters.dateRange.end);
      }

      const response = await get(`/campaigns/advanced?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get campaigns:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch campaigns');
    }
  }
}

export default CampaignsService;
