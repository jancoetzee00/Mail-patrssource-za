export type AccountRole = 'owner' | 'admin' | 'sales' | 'support' | 'member';

export interface BusinessEntity {
  id: string;
  name: string;
  legalName: string;
  domain: string;
  supportEmail: string;
  industry: string;
  tier: 'Enterprise Suite' | 'Growth' | 'Starter';
  color: string;
  currency: string;
  phone: string;
  address: string;
  createdAt: string;
  isPrimary?: boolean;
}

export interface Account {
  id: string;
  businessId?: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: AccountRole;
  provider: 'Google Workspace' | 'Microsoft 365' | 'Custom IMAP/SMTP';
  isDefault?: boolean;
  signatureId?: string;
  unreadCount: number;
}

export type EmailFolder =
  | 'inbox'
  | 'sent'
  | 'scheduled'
  | 'drafts'
  | 'outbox' // offline queue
  | 'starred'
  | 'archive'
  | 'trash';

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EncryptionMetadata {
  algorithm: string;
  keyFingerprint: string;
  iv: string;
  cipherText: string;
  salt: string;
}

export interface Email {
  id: string;
  threadId: string;
  accountId: string;
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  body: string;
  previewText: string;
  timestamp: string; // ISO string
  folder: EmailFolder;
  isRead: boolean;
  isStarred: boolean;
  tags: string[];
  // End-to-End Encryption
  isEncrypted?: boolean;
  encryptionData?: EncryptionMetadata;
  decryptedBody?: string;
  // Scheduling
  scheduledFor?: string; // ISO string
  // CRM Integration
  leadId?: string;
  leadStage?: 'New Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  // Offline & Cloud Sync
  syncStatus?: 'synced' | 'pending_outbox' | 'syncing' | 'failed';
  attachments?: { name: string; size: string; type: string }[];
}

export type LeadStage = 'New Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface CRMLead {
  id: string;
  contactName: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  stage: LeadStage;
  dealValue: number;
  probability: number;
  score: number; // 1-100
  tags: string[];
  lastContactDate: string;
  nextFollowUpDate?: string;
  notes: string[];
  linkedEmailIds: string[];
  assignedTo: string; // Member name
  source: string;
}

export interface AutoResponseRule {
  id: string;
  title: string;
  triggerType: 'vacation' | 'new_lead' | 'after_hours' | 'support_ticket' | 'keyword';
  conditions: {
    keyword?: string;
    senderDomain?: string;
    businessHoursOnly?: boolean;
    afterHoursOnly?: boolean;
    targetAccountIds?: string[];
  };
  responseSubject: string;
  responseTemplate: string;
  isEnabled: boolean;
  lastTriggered?: string;
  executionCount: number;
}

export interface EmailSignature {
  id: string;
  name: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  website: string;
  calendlyUrl?: string;
  disclaimer: string;
  brandColor: string;
  assignedAccountId?: string; // 'all' or specific account id
}

export interface TeamMember {
  id: string;
  businessId?: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Sales Manager' | 'Support Specialist' | 'Auditor';
  department: string;
  status: 'active' | 'invited' | 'suspended';
  twoFactorEnabled: boolean;
  lastActive: string;
  avatar: string;
  permissions: {
    canViewEncrypted: boolean;
    canManageCrm: boolean;
    canScheduleEmails: boolean;
    canManageTeam: boolean;
    canViewFinancialAnalytics: boolean;
    canDeleteEmails: boolean;
  };
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'security';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'email' | 'crm' | 'sync' | 'security' | 'scheduled';
  read: boolean;
  linkId?: string;
}

export type TemplateCategory =
  | 'Sales'
  | 'Follow-up'
  | 'Onboarding'
  | 'Billing'
  | 'Support'
  | 'General';

export interface EmailTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  usageCount: number;
  lastUsed?: string;
}
