export interface User {
  id: string;
  neonUserId: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  emailConfirmed?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
  company?: string;
  title?: string;
}

export type ProspectStatus = 'NEW' | 'CONTACTED' | 'ENGAGED' | 'REPLIED' | 'INTERESTED' | 'NOT_INTERESTED' | 'OPTED_OUT' | 'CONVERTED' | 'BOUNCED';

// Backward compatibility aliases
export type LeadStatus = ProspectStatus;
export type Lead = Prospect;

export interface Prospect {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  website?: string;
  industry?: string;
  linkedinProfile?: string;
  phoneNumber?: string;
  location?: string;
  status: ProspectStatus;
  tags: string[];
  researchData?: any;
  notes?: string;
  isOptedOut: boolean;
  source?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaignProspects: number;
    emailLogs: number;
    activities: number;
  };
}

// Legacy Campaign interface (for backward compatibility)
// Use the new Sequence interface for new development
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled';
  sent: number;
  opens: number;
  replies: number;
  replyRate: number;
  startDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  startedAt?: string;
  scheduledAt?: string;
  pausedAt?: string;
  prospects: string[]; // Prospect IDs instead of full prospect objects
  templateId?: string;
  settings: CampaignSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Type alias for clarity - use Sequence for new code
export type CampaignSequence = Sequence;

export interface CampaignSettings {
  sendImmediately?: boolean;
  scheduledDate?: string;
  dailyLimit?: number;
  sendTime?: string;
  timezone?: string;
  enableFollowUps?: boolean;
  followUpDelay?: number; // days
  trackOpens?: boolean;
  trackClicks?: boolean;
  personalizationLevel?: 'basic' | 'advanced' | 'ai-powered';
}

export interface CampaignScheduling {
  scheduledDate: string;
  timezone: string;
  dailyLimit: number;
  sendTime: string;
  createdAt: string;
}

export interface CampaignControlAction {
  sequenceId: string;
  action: 'start' | 'pause' | 'resume' | 'stop' | 'cancel';
  userId: string;
}

export interface CampaignScheduleRequest {
  sequenceId: string;
  scheduledDate: string;
  timezone: string;
  userId: string;
  dailyLimit?: number;
  sendTime?: string;
}

export interface TimezoneInfo {
  value: string;
  label: string;
  offset: string;
  currentTime: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  fromEmail?: string;
  category?: string;
  lastModified?: string;
  bodyHtml?: string;
}

export interface CampaignStats {
  sent: number;
  openRate: number;
  replyRate: number;
  meetingRate: number;
  opens: number;
  replies: number;
  meetings: number;
}

export interface Analytics {
  totalSent: number;
  totalOpenRate: number;
  totalReplyRate: number;
  totalMeetingRate: number;
  campaigns: Campaign[];
  period: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
}

// Email Content and Approval Types
export interface GeneratedEmail {
  id: string;
  campaignId: string;
  prospectId: string;
  templateId?: string;
  subject: string;
  body: string;
  personalizationScore: number;
  status: 'generated' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  repliedAt?: string;
  personalizationData: PersonalizationData;
  variations?: EmailVariation[];
  approvalHistory: ApprovalRecord[];
  feedback?: EmailFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizationData {
  variables: Record<string, string>;
  insights?: string[];
  companyResearch?: any;
  approachAngle?: string;
  painPoints?: string[];
  achievements?: string[];
}

export interface EmailVariation {
  id: string;
  type: 'subject' | 'body' | 'call_to_action';
  content: string;
  performance?: {
    opens?: number;
    clicks?: number;
    replies?: number;
  };
}

export interface ApprovalRecord {
  id: string;
  approverId: string;
  approverName: string;
  status: 'approved' | 'rejected' | 'requested_changes';
  comments?: string;
  requestedChanges?: string[];
  createdAt: string;
}

export interface EmailFeedback {
  rating: number; // 1-5
  comments: string;
  improvementSuggestions: string[];
  strengths: string[];
  weaknesses: string[];
  personalizationNotes?: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalEmails: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  scheduled: number;
  pendingApproval: number;
  rejected: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  conversionRate: number;
  averagePersonalizationScore: number;
  topPerformingVariations: EmailVariation[];
  performanceByTimeSlot: {
    hour: number;
    opens: number;
    replies: number;
  }[];
  performanceByDay: {
    date: string;
    sent: number;
    opened: number;
    replied: number;
  }[];
}

export interface CampaignWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => boolean;
}

export interface CampaignCreationData {
  step1: {
    name: string;
    description: string;
    goal?: string;
  };
  step2: {
    prospectIds: string[];
    segments?: ProspectSegment[];
  };
  step3: {
    templateId?: string;
    generateWithAI: boolean;
    aiPrompt?: string;
  };
  step4: {
    personalizationLevel: 'basic' | 'advanced' | 'ai-powered';
    enableABTest: boolean;
    sendImmediately: boolean;
    scheduledDate?: string;
    dailyLimit?: number;
    sendTime?: string;
    timezone?: string;
  };
}

export interface ProspectSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  prospectIds: string[];
}

export interface SegmentCriteria {
  company?: string;
  title?: string;
  status?: string;
  lastContacted?: {
    operator: 'before' | 'after' | 'between';
    value: string | string[];
  };
  customFields?: Record<string, any>;
}

export interface EmailGenerationRequest {
  campaignId: string;
  prospectIds: string[];
  templateId?: string;
  personalizationLevel: 'basic' | 'advanced' | 'ai-powered';
  variations: {
    subjectVariations?: number;
    bodyVariations?: number;
    callToActionVariations?: number;
  };
  generateWithAI: boolean;
  aiPrompt?: string;
}

export interface BulkApprovalRequest {
  emailIds: string[];
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
  requestedChanges?: string[];
}

// Campaign/Sequence Status Types (matching backend)
export type SequenceStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED';

// Sequence interface (matches backend Prisma model)
export interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: SequenceStatus;
  createdBy: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  prospects?: CampaignProspect[];
  steps?: SequenceStep[];
  _count?: {
    campaignProspects?: number;
    steps?: number;
  };
}

export interface CampaignProspect {
  id: string;
  campaignId: string;
  prospectId: string;
  status: ProspectStatus;
  addedAt: string;
  pausedAt?: string;
  prospect?: Prospect;
  personalizedEmails?: PersonalizedEmail[];
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  day: number;
  createdAt: string;
  updatedAt: string;
  emailAction?: StepEmailAction;
  taskAction?: StepTaskAction;
}

export interface StepEmailAction {
  id: string;
  stepId: string;
  templateId?: string;
  customSubject?: string;
  customBody?: string;
  enablePersonalization: boolean;
  createdAt: string;
  updatedAt: string;
  template?: EmailTemplate;
}

export interface StepTaskAction {
  id: string;
  stepId: string;
  taskTitle: string;
  taskDescription?: string;
  enableEmailNotification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizedEmail {
  id: string;
  campaignProspectId: string;
  stepEmailActionId: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledFor?: string;
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailStatus = 'PENDING' | 'SENT' | 'OPENED' | 'REPLIED' | 'BOUNCED' | 'FAILED';

export type TabType = 'overview' | 'campaigns' | 'prospects' | 'templates' | 'tasks' | 'settings';

// Overview Stats Types
export interface OverviewStats {
  totalEmailsSent: number;
  totalReplyRate: number;
  activeCampaigns: number;
  totalProspects: number;
  monthlyChange: {
    emailsSent: number;
    replyRate: number;
    campaigns: number;
    prospects: number;
  };
  period: string;
}

export interface RecentProspect {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  status: ProspectStatus;
  createdAt: string;
  source?: string;
  tags: string[];
}

export interface OverviewData {
  stats: OverviewStats;
  recentCampaigns: Campaign[];
  recentProspects: RecentProspect[];
}

// Task Management Types
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type TaskType = 'LINKEDIN' | 'WHATSAPP' | 'CALL' | 'EMAIL' | 'CUSTOM';

export interface StepTaskAction {
  id: string;
  stepId: string;
  taskTitle: string;
  taskDescription?: string;
  taskType: TaskType;
  enableEmailNotification: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  stepTaskActionId: string;
  campaignId: string;
  dueDate?: string;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  stepTaskAction?: StepTaskAction;
  assignments?: TaskAssignment[];
  // Derived fields for frontend convenience
  title?: string;
  description?: string;
  campaignName?: string;
  day?: number;
  stepName?: string;
  isOverdue?: boolean;
  daysUntilDue?: number;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  task?: Task;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  search?: string;
  campaignId?: string;
  assignedTo?: string;
  dueBefore?: string;
  dueAfter?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskUpdateData {
  status: TaskStatus;
  completedAt?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  overdue: number;
}
