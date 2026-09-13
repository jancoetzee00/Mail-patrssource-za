import {
  Account,
  BusinessEntity,
  Email,
  CRMLead,
  AutoResponseRule,
  EmailSignature,
  TeamMember,
  SecurityAuditLog,
  NotificationItem,
  EmailTemplate,
} from '../types';

export const INITIAL_BUSINESSES: BusinessEntity[] = [
  {
    id: 'biz_partssource_za',
    name: 'Partssource-za',
    legalName: 'Partssource-za (Pty) Ltd',
    domain: 'partssource-za.co.za',
    supportEmail: 'info@partssource-za.co.za',
    industry: 'Automotive & Industrial Machinery Parts',
    tier: 'Enterprise Suite',
    color: '#0284C7',
    currency: 'ZAR (R)',
    phone: '+27 11 000 0000',
    address: 'South Africa',
    createdAt: '2026-09-13T08:00:00Z',
    isPrimary: true,
  },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_jan',
    businessId: 'biz_partssource_za',
    name: 'Jan Coetzee',
    email: 'jancoetzee00@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#0284C7',
    role: 'owner',
    provider: 'Google Workspace',
    isDefault: true,
    signatureId: 'sig_ps_jan',
    unreadCount: 0,
  },
];

export const INITIAL_SIGNATURES: EmailSignature[] = [
  {
    id: 'sig_ps_jan',
    name: 'Partssource-za Primary Signature',
    fullName: 'Jan Coetzee',
    title: 'Owner & Managing Director',
    company: 'Partssource-za',
    phone: '+27 11 000 0000',
    website: 'https://partssource-za.co.za',
    calendlyUrl: '',
    disclaimer: 'CONFIDENTIALITY NOTICE: This transmission is intended strictly for the named recipient. If received in error, please notify the sender and delete immediately.',
    brandColor: '#0284C7',
    assignedAccountId: 'acc_jan',
  },
];

// Completely clean empty mailbox so user can input and receive their own real data
export const INITIAL_EMAILS: Email[] = [];

// Completely clean empty CRM pipeline so user can register their own customer leads
export const INITIAL_CRM_LEADS: CRMLead[] = [];

export const INITIAL_AUTO_RULES: AutoResponseRule[] = [
  {
    id: 'rule_ps_inquiry',
    title: 'Partssource-za Inquiry Acknowledgment',
    triggerType: 'new_lead',
    conditions: {
      businessHoursOnly: false,
      targetAccountIds: ['acc_jan'],
      keyword: 'quote',
    },
    responseSubject: 'Thank you for contacting Partssource-za - Inquiry Received',
    responseTemplate: `Hello {{sender_name}},

Thank you for reaching out to Partssource-za. We have received your inquiry regarding "{{email_subject}}".

Our team is currently reviewing your parts request and will follow up with pricing, availability, and delivery lead times as quickly as possible.

Best regards,
Partssource-za Sales & Support Team`,
    isEnabled: true,
    lastTriggered: undefined,
    executionCount: 0,
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mem_jan',
    businessId: 'biz_partssource_za',
    name: 'Jan Coetzee',
    email: 'jancoetzee00@gmail.com',
    role: 'Owner',
    department: 'Management',
    status: 'active',
    twoFactorEnabled: true,
    lastActive: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    permissions: {
      canViewEncrypted: true,
      canManageCrm: true,
      canScheduleEmails: true,
      canManageTeam: true,
      canViewFinancialAnalytics: true,
      canDeleteEmails: true,
    },
  },
];

export const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: 'log_init',
    timestamp: '2026-09-13T14:15:00Z',
    actor: 'Jan Coetzee (Owner)',
    action: 'Partssource-za workspace initialized with Root Owner clearance',
    ipAddress: '192.168.1.100 (Verified Session)',
    severity: 'security',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_welcome',
    title: 'Partssource-za Initialized',
    message: 'All mock data cleared. Ready for your own Partssource-za emails, accounts, and CRM leads.',
    timestamp: 'Just now',
    type: 'security',
    read: false,
  },
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_parts_quote',
    title: 'Parts Quotation & Availability',
    category: 'Sales',
    subject: 'Quotation for Parts Inquiry: {{part_reference}} - Partssource-za',
    body: `Hi {{client_name}},

Thank you for reaching out to Partssource-za.

Please find below the quotation for your parts request:
- Part / Item: {{part_reference}}
- Quantity: {{quantity}}
- Unit / Total Price: {{quote_amount}}
- Estimated Lead Time: {{lead_time}}

Please let us know if you would like us to reserve these parts or issue an official proforma invoice.

Best regards,
{{your_name}}
Partssource-za`,
    variables: ['client_name', 'part_reference', 'quantity', 'quote_amount', 'lead_time', 'your_name'],
    usageCount: 0,
    lastUsed: undefined,
  },
  {
    id: 'tpl_order_dispatch',
    title: 'Order Dispatch & Waybill Tracking',
    category: 'Follow-up',
    subject: 'Your Partssource-za Order Has Dispatched: Waybill {{waybill_number}}',
    body: `Hi {{client_name}},

Good news! Your order has been packed and dispatched.

Shipment Details:
- Order Reference: {{order_reference}}
- Courier / Carrier: {{courier_name}}
- Waybill / Tracking #: {{waybill_number}}

Please let us know if you need any additional assistance or documentation.

Kind regards,
{{your_name}}
Partssource-za Logistics`,
    variables: ['client_name', 'order_reference', 'courier_name', 'waybill_number', 'your_name'],
    usageCount: 0,
    lastUsed: undefined,
  },
  {
    id: 'tpl_parts_avail',
    title: 'Part Sourcing & Stock Check',
    category: 'Support',
    subject: 'Update on Part Sourcing: {{part_reference}}',
    body: `Hi {{client_name}},

We have checked stock availability with our supply network for {{part_reference}}.

We can supply this item with standard dispatch. Please confirm if you would like us to secure this allocation for your account.

Best regards,
{{your_name}}
Partssource-za`,
    variables: ['client_name', 'part_reference', 'your_name'],
    usageCount: 0,
    lastUsed: undefined,
  },
];
