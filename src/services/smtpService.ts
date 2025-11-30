import { api } from './apiService';

export interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastTested?: string;
  testResult?: string;
}

export interface SmtpTestRequest {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface SmtpTestResponse {
  success: boolean;
  message: string;
  testedAt: string;
}

export interface SmtpConfigResponse {
  success: boolean;
  message?: string;
  config?: SmtpConfig;
}

class SmtpService {
  // Get user's SMTP configuration
  async getSmtpConfig(): Promise<SmtpConfig | null> {
    try {
      const response = await api.get('/smtp-config') as SmtpConfigResponse;
      return response.config || null;
    } catch (error) {
      console.error('Error fetching SMTP config:', error);
      throw error;
    }
  }

  // Save or update SMTP configuration
  async saveSmtpConfig(config: SmtpConfig & { password?: string }): Promise<SmtpConfigResponse> {
    try {
      const response = await api.post('/smtp-config', config) as SmtpConfigResponse;
      return response;
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      throw error;
    }
  }

  // Test SMTP connection
  async testSmtpConnection(testConfig: SmtpTestRequest): Promise<SmtpTestResponse> {
    try {
      const response = await api.post('/smtp-config/test', testConfig) as SmtpTestResponse;
      return response;
    } catch (error: any) {
      console.error('Error testing SMTP connection:', error);
      throw error;
    }
  }

  // Delete SMTP configuration
  async deleteSmtpConfig(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/smtp-config') as { success: boolean; message: string };
      return response;
    } catch (error) {
      console.error('Error deleting SMTP config:', error);
      throw error;
    }
  }

  // Check if SMTP is configured and active
  async isSmtpConfigured(): Promise<boolean> {
    try {
      const config = await this.getSmtpConfig();
      return !!(config && config.isActive);
    } catch (error) {
      console.error('Error checking SMTP configuration:', error);
      return false;
    }
  }

  // Get common SMTP providers configurations for quick setup
  getCommonProviders(): Array<{
    name: string;
    host: string;
    port: number;
    secure: boolean;
    description: string;
  }> {
    return [
      {
        name: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        description: 'Use Gmail with App Password (2-factor authentication required)'
      },
      {
        name: 'Outlook',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        description: 'Microsoft Outlook / Hotmail SMTP server'
      },
      {
        name: 'Yahoo Mail',
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        description: 'Yahoo Mail SMTP server (App Password required)'
      },
      {
        name: 'SendGrid',
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        description: 'SendGrid SMTP relay service'
      },
      {
        name: 'Mailgun',
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        description: 'Mailgun SMTP service'
      },
      {
        name: 'Amazon SES',
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: false,
        description: 'Amazon Simple Email Service (US East)'
      }
    ];
  }
}

export const smtpService = new SmtpService();
export default smtpService;