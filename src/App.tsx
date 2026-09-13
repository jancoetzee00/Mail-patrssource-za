import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailDetail } from './components/EmailDetail';
import { ComposeModal } from './components/ComposeModal';
import { CrmPipelineView } from './components/CrmPipelineView';
import { AutoResponsesView } from './components/AutoResponsesView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TeamAdminView } from './components/TeamAdminView';
import { SignaturesModal } from './components/SignaturesModal';
import { SecurityMfaModal } from './components/SecurityMfaModal';
import { NotificationCenter } from './components/NotificationCenter';
import { AddAccountModal } from './components/AddAccountModal';
import { SessionLockScreen } from './components/SessionLockScreen';
import { TemplatesView } from './components/TemplatesView';

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
  EmailFolder,
  LeadStage,
  EmailTemplate,
} from './types';

import {
  INITIAL_ACCOUNTS,
  INITIAL_BUSINESSES,
  INITIAL_EMAILS,
  INITIAL_CRM_LEADS,
  INITIAL_AUTO_RULES,
  INITIAL_SIGNATURES,
  INITIAL_TEAM_MEMBERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMAIL_TEMPLATES,
} from './data/mockData';

// Purge any legacy mock data from previous sessions so user starts clean with Partssource-za
const LEGACY_KEYS = [
  'apex_accounts',
  'apex_business_entities',
  'apex_active_business_id',
  'apex_emails',
  'apex_crm_leads',
  'apex_auto_rules',
  'apex_signatures',
  'apex_email_templates',
  'apex_team_members',
  'apex_pending_outbox',
  'apex_notifications',
];

if (typeof window !== 'undefined') {
  const version = localStorage.getItem('ps_za_storage_version');
  if (version !== '2.1_clean_partssource_za') {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('ps_za_storage_version', '2.1_clean_partssource_za');
  }
}

export default function App() {
  // --- Persistent State or Defaults for Partssource-za ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('ps_za_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // --- Multi-Business Entities State ---
  const [businesses, setBusinesses] = useState<BusinessEntity[]>(() => {
    const saved = localStorage.getItem('ps_za_businesses');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESSES;
  });

  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    const saved = localStorage.getItem('ps_za_active_business_id');
    return saved || (INITIAL_BUSINESSES[0]?.id ?? 'biz_partssource_za');
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

  const [emails, setEmails] = useState<Email[]>(() => {
    const saved = localStorage.getItem('ps_za_emails');
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(() => {
    const saved = localStorage.getItem('ps_za_crm_leads');
    return saved ? JSON.parse(saved) : INITIAL_CRM_LEADS;
  });

  const [autoRules, setAutoRules] = useState<AutoResponseRule[]>(() => {
    const saved = localStorage.getItem('ps_za_auto_rules');
    return saved ? JSON.parse(saved) : INITIAL_AUTO_RULES;
  });

  const [signatures, setSignatures] = useState<EmailSignature[]>(() => {
    const saved = localStorage.getItem('ps_za_signatures');
    return saved ? JSON.parse(saved) : INITIAL_SIGNATURES;
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('ps_za_email_templates');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_TEMPLATES;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('ps_za_team_members');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(INITIAL_AUDIT_LOGS);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('ps_za_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // --- Offline & Cloud Sync ---
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [pendingOutbox, setPendingOutbox] = useState<Email[]>(() => {
    const saved = localStorage.getItem('ps_za_pending_outbox');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI Navigation State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('mailbox');
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Modals & Overlays ---
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composePrefill, setComposePrefill] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    accountId?: string;
    leadId?: string;
  }>({});
  const [isAddAccountOpen, setIsAddAccountOpen] = useState<boolean>(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState<boolean>(false);
  const [isMfaActive, setIsMfaActive] = useState<boolean>(true);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // --- Dark Mode Sync with DOM ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Sync State to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('ps_za_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('ps_za_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('ps_za_active_business_id', activeBusinessId);
  }, [activeBusinessId]);

  useEffect(() => {
    localStorage.setItem('ps_za_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('ps_za_crm_leads', JSON.stringify(crmLeads));
  }, [crmLeads]);

  useEffect(() => {
    localStorage.setItem('ps_za_auto_rules', JSON.stringify(autoRules));
  }, [autoRules]);

  useEffect(() => {
    localStorage.setItem('ps_za_signatures', JSON.stringify(signatures));
  }, [signatures]);

  useEffect(() => {
    localStorage.setItem('ps_za_email_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('ps_za_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('ps_za_pending_outbox', JSON.stringify(pendingOutbox));
  }, [pendingOutbox]);

  useEffect(() => {
    localStorage.setItem('ps_za_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // --- Automatic Scheduled Email Dispatch Timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setEmails((prev) => {
        let changed = false;
        const updated = prev.map((email) => {
          if (email.folder === 'scheduled' && email.scheduledFor) {
            const schedTime = new Date(email.scheduledFor);
            if (now >= schedTime) {
              changed = true;
              return {
                ...email,
                folder: 'sent' as const,
                timestamp: now.toISOString(),
              };
            }
          }
          return email;
        });

        if (changed) {
          // Notify user
          setNotifications((notifs) => [
            {
              id: `notif-${Date.now()}`,
              title: 'Scheduled Dispatch Sent',
              message: 'A client communication scheduled in advance was successfully sent.',
              type: 'scheduled',
              timestamp: 'Just now',
              read: false,
            },
            ...notifs,
          ]);
        }
        return changed ? updated : prev;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // --- Cloud Sync Handler ---
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      if (isOnline) {
        // Send pending outbox to backend API /api/sync
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pendingEmails: pendingOutbox,
            lastSyncTimestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Move pending outbox items to sent folder in emails
          if (pendingOutbox.length > 0) {
            setEmails((prev) => [
              ...pendingOutbox.map((e) => ({
                ...e,
                folder: 'sent' as const,
                syncStatus: 'synced' as const,
              })),
              ...prev,
            ]);
            setPendingOutbox([]);
          }

          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          setNotifications((prev) => [
            {
              id: `sync-notif-${Date.now()}`,
              title: 'Cloud Synchronization Complete',
              message: `Encrypted cloud sync completed. ${result.processedCount || 0} messages synced.`,
              type: 'sync',
              timestamp: 'Just now',
              read: false,
            },
            ...prev,
          ]);
        }
      } else {
        // Offline attempt
        setNotifications((prev) => [
          {
            id: `offline-notif-${Date.now()}`,
            title: 'Offline Mode Active',
            message: 'Your changes are safely saved in local offline storage and will sync upon reconnecting.',
            type: 'system',
            timestamp: 'Just now',
            read: false,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      // Local graceful fallback
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // --- Filtered Emails List ---
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // Account filter
      if (selectedAccountId !== 'all' && email.accountId !== selectedAccountId) {
        return false;
      }

      // Folder filter
      if (currentFolder === 'starred') {
        if (!email.isStarred) return false;
      } else if (currentFolder === 'scheduled') {
        if (email.folder !== 'scheduled') return false;
      } else if (currentFolder === 'outbox') {
        if (email.folder !== 'outbox' && email.syncStatus !== 'pending_outbox') return false;
      } else {
        if (email.folder !== currentFolder) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = email.subject.toLowerCase().includes(q);
        const matchesSender = email.from.email.toLowerCase().includes(q);
        const matchesSenderName = email.from.name.toLowerCase().includes(q);
        const matchesBody = email.body.toLowerCase().includes(q);
        const matchesTag = email.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesSubject && !matchesSender && !matchesSenderName && !matchesBody && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [emails, selectedAccountId, currentFolder, searchQuery]);

  // Calculate folder badge counts
  const folderCounts = useMemo(() => {
    const accFiltered =
      selectedAccountId === 'all'
        ? emails
        : emails.filter((e) => e.accountId === selectedAccountId);

    return {
      inbox: accFiltered.filter((e) => e.folder === 'inbox' && !e.isRead).length,
      starred: accFiltered.filter((e) => e.isStarred).length,
      sent: accFiltered.filter((e) => e.folder === 'sent').length,
      scheduled: accFiltered.filter((e) => e.folder === 'scheduled').length,
      drafts: accFiltered.filter((e) => e.folder === 'drafts').length,
      archive: accFiltered.filter((e) => e.folder === 'archive').length,
      trash: accFiltered.filter((e) => e.folder === 'trash').length,
      outbox: pendingOutbox.length,
    };
  }, [emails, selectedAccountId, pendingOutbox]);

  const activeEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId);
  }, [emails, selectedEmailId]);

  // --- Email Actions ---
  const handleToggleStar = (emailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((em) => (em.id === emailId ? { ...em, isStarred: !em.isStarred } : em))
    );
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    // Mark as read
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, isRead: true } : em))
    );
  };

  const handleArchiveEmail = (id: string) => {
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, folder: 'archive' } : em))
    );
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleDeleteEmail = (id: string) => {
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, folder: 'trash' } : em))
    );
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleBatchArchive = () => {
    setEmails((prev) =>
      prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, folder: 'archive' } : em))
    );
    setSelectedEmailIds([]);
  };

  const handleBatchDelete = () => {
    setEmails((prev) =>
      prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, folder: 'trash' } : em))
    );
    setSelectedEmailIds([]);
  };

  const handleBatchMarkRead = (read: boolean) => {
    setEmails((prev) =>
      prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, isRead: read } : em))
    );
    setSelectedEmailIds([]);
  };

  // --- Send Email Handler (from Compose modal or reply) ---
  const handleSendEmail = (emailData: {
    accountId: string;
    to: string;
    cc?: string;
    subject: string;
    body: string;
    isEncrypted: boolean;
    passphrase?: string;
    scheduledFor?: string;
    tags?: string[];
    attachments?: { name: string; size: string; type: string }[];
  }) => {
    const fromAccount = accounts.find((a) => a.id === emailData.accountId) || accounts[0];

    const isScheduled = Boolean(emailData.scheduledFor);
    const newEmail: Email = {
      id: `mail-${Date.now()}`,
      threadId: `thread-${Date.now()}`,
      accountId: emailData.accountId,
      from: {
        name: fromAccount.name,
        email: fromAccount.email,
      },
      to: [
        {
          name: emailData.to.split('@')[0],
          email: emailData.to,
        },
      ],
      subject: emailData.subject,
      previewText: emailData.body.slice(0, 100),
      body: emailData.body,
      isEncrypted: emailData.isEncrypted,
      isStarred: false,
      isRead: true,
      folder: isScheduled ? 'scheduled' : !isOnline ? 'outbox' : 'sent',
      timestamp: new Date().toISOString(),
      scheduledFor: emailData.scheduledFor,
      tags: emailData.tags || ['Client Correspondence'],
      syncStatus: !isOnline && !isScheduled ? 'pending_outbox' : 'synced',
      attachments: emailData.attachments || [],
    };

    if (!isOnline && !isScheduled) {
      // Store in pending outbox
      setPendingOutbox((prev) => [newEmail, ...prev]);
      setNotifications((prev) => [
        {
          id: `outbox-${Date.now()}`,
          title: 'Email Saved in Offline Outbox',
          message: `To: ${emailData.to} - Will be automatically sent when network connectivity restores.`,
          type: 'system',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    } else {
      setEmails((prev) => [newEmail, ...prev]);
      setNotifications((prev) => [
        {
          id: `sent-${Date.now()}`,
          title: isScheduled ? 'Email Scheduled' : 'Email Dispatched',
          message: isScheduled
            ? `Message to ${emailData.to} scheduled for ${new Date(
                emailData.scheduledFor!
              ).toLocaleString()}`
            : `Client communication sent successfully to ${emailData.to}`,
          type: isScheduled ? 'scheduled' : 'crm',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    }

    // Check automated rules: if any rule matches
    checkAndTriggerAutoRules(newEmail);
  };

  const checkAndTriggerAutoRules = (sentEmail: Email) => {
    // If it mentions any keyword in active rules, simulate execution
    autoRules.forEach((rule) => {
      if (
        rule.isEnabled &&
        rule.conditions.keyword &&
        sentEmail.body.toLowerCase().includes(rule.conditions.keyword.toLowerCase())
      ) {
        setAutoRules((prev) =>
          prev.map((r) =>
            r.id === rule.id
              ? {
                  ...r,
                  executionCount: r.executionCount + 1,
                  lastTriggered: new Date().toISOString(),
                }
              : r
          )
        );
      }
    });
  };

  // --- CRM Handlers ---
  const handleUpdateLeadStage = (leadId: string, newStage: LeadStage) => {
    setCrmLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    );

    const targetLead = crmLeads.find((l) => l.id === leadId);
    setNotifications((prev) => [
      {
        id: `lead-stage-${Date.now()}`,
        title: 'CRM Lead Stage Updated',
        message: `${targetLead?.company || 'Lead'} advanced to "${newStage}" stage.`,
        type: 'crm',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleAddLead = (newLeadData: Omit<CRMLead, 'id' | 'linkedEmailIds'>) => {
    const newLead: CRMLead = {
      ...newLeadData,
      id: `lead-${Date.now()}`,
      linkedEmailIds: [],
    };
    setCrmLeads((prev) => [newLead, ...prev]);

    setNotifications((prev) => [
      {
        id: `new-lead-${Date.now()}`,
        title: 'New High-Value Lead Created',
        message: `${newLead.company} ($${newLead.dealValue.toLocaleString()}) added to pipeline.`,
        type: 'crm',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleCreateLeadFromEmail = (email: Email) => {
    const newLead: CRMLead = {
      id: `lead-${Date.now()}`,
      contactName: email.from.name,
      email: email.from.email,
      company: email.from.email.split('@')[1]?.replace(/\..+/, '').toUpperCase() || 'New Company',
      title: 'Business Inquirer',
      phone: '+1 (555) 019-2834',
      stage: 'New Lead',
      dealValue: 20000,
      probability: 50,
      score: 80,
      tags: ['Email Inbound', 'Qualified Prospect'],
      lastContactDate: new Date().toISOString(),
      notes: [`Inbound email inquiry regarding: ${email.subject}`],
      linkedEmailIds: [email.id],
      assignedTo: accounts[0]?.name || 'Commercial Rep',
      source: 'Direct Business Email',
    };

    setCrmLeads((prev) => [newLead, ...prev]);

    // Link lead to email
    setEmails((prev) =>
      prev.map((em) => (em.id === email.id ? { ...em, leadId: newLead.id } : em))
    );

    setActiveTab('crm');

    setNotifications((prev) => [
      {
        id: `crm-link-${Date.now()}`,
        title: 'Client Inbound Converted to CRM Lead',
        message: `${newLead.contactName} linked to Enterprise Deal Pipeline.`,
        type: 'crm',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleSelectEmailLead = (lead: CRMLead) => {
    setComposePrefill({
      to: lead.email,
      subject: `Commercial Partnership Strategy: ${lead.company}`,
      leadId: lead.id,
    });
    setIsComposeOpen(true);
  };

  // --- Email Template Handlers ---
  const handleAddTemplate = (
    newTplData: Omit<EmailTemplate, 'id' | 'usageCount' | 'lastUsed'>
  ) => {
    const newTpl: EmailTemplate = {
      ...newTplData,
      id: `tpl-${Date.now()}`,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
    };
    setTemplates((prev) => [newTpl, ...prev]);
    setNotifications((prev) => [
      {
        id: `tpl-notif-${Date.now()}`,
        title: 'New Email Template Created',
        message: `Template "${newTpl.title}" saved to boilerplate library.`,
        type: 'email',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleUpdateTemplate = (id: string, updated: Partial<EmailTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectUseTemplate = (tpl: EmailTemplate) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === tpl.id
          ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date().toISOString() }
          : t
      )
    );
    setComposePrefill({
      subject: tpl.subject,
      body: tpl.body,
    });
    setIsComposeOpen(true);
  };

  // --- Real-time Notification Simulator Trigger ---
  const handleTriggerDemoNotification = () => {
    const companies = ['Cape Machinery & Plant', 'Highveld Auto & Spares', 'Trans-Africa Heavy Parts', 'Durban Fleet Equipment'];
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const dealVal = Math.floor(15000 + Math.random() * 45000);

    const newNotif: NotificationItem = {
      id: `sim-${Date.now()}`,
      title: `⚡ New Parts Inquiry: ${randomCompany}`,
      message: `Commercial client submitted quotation inquiry for R ${dealVal.toLocaleString()} parts order.`,
      type: 'crm',
      timestamp: 'Just now',
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
  };

  // --- Owner Business Management Handlers ---
  const handleAddBusiness = (
    newBizData: Omit<BusinessEntity, 'id' | 'createdAt'>
  ) => {
    const newBiz: BusinessEntity = {
      ...newBizData,
      id: `biz-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setBusinesses((prev) => {
      // If marked primary, unmark others
      if (newBiz.isPrimary) {
        return [newBiz, ...prev.map((b) => ({ ...b, isPrimary: false }))];
      }
      return [...prev, newBiz];
    });

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        action: `Owner registered new enterprise business: ${newBiz.name} (${newBiz.domain})`,
        actor: 'Jan Coetzee (Owner)',
        timestamp: new Date().toISOString(),
        severity: 'info',
        ipAddress: '192.168.1.104',
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `biz-notif-${Date.now()}`,
        title: 'Business Entity Added',
        message: `Registered ${newBiz.name} (${newBiz.domain}) under enterprise portfolio.`,
        type: 'system',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleDeleteBusiness = (businessId: string) => {
    const targetBiz = businesses.find((b) => b.id === businessId);
    if (!targetBiz) return;

    // Remove business
    const remaining = businesses.filter((b) => b.id !== businessId);
    setBusinesses(remaining);

    // If active was deleted, fall back to first remaining
    if (activeBusinessId === businessId && remaining.length > 0) {
      setActiveBusinessId(remaining[0].id);
    }

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        action: `Owner deleted business entity: ${targetBiz.name} (${targetBiz.domain})`,
        actor: 'Jan Coetzee (Owner)',
        timestamp: new Date().toISOString(),
        severity: 'warning',
        ipAddress: '192.168.1.104',
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `biz-del-${Date.now()}`,
        title: 'Business Entity Deleted',
        message: `Removed ${targetBiz.name} and archived linked configuration profiles.`,
        type: 'security',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleSelectActiveBusiness = (id: string) => {
    setActiveBusinessId(id);
    const biz = businesses.find((b) => b.id === id);
    if (biz) {
      setNotifications((prev) => [
        {
          id: `biz-switch-${Date.now()}`,
          title: 'Switched Active Business Context',
          message: `Active business context changed to ${biz.name} (${biz.domain}).`,
          type: 'system',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    }
  };

  // --- Team Member Actions (Owner can add or delete ANY member) ---
  const handleAddTeamMember = (memberData: Omit<TeamMember, 'id' | 'lastActive'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `tm-${Date.now()}`,
      lastActive: 'Just now',
    };
    setTeamMembers((prev) => [...prev, newMember]);

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        action: `Owner added team member: ${newMember.name} (${newMember.role})`,
        actor: 'Jan Coetzee (Owner)',
        timestamp: new Date().toISOString(),
        severity: 'info',
        ipAddress: '192.168.1.104',
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `member-add-${Date.now()}`,
        title: 'Team Member Added',
        message: `${newMember.name} assigned as ${newMember.role} in Owner Settings.`,
        type: 'system',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const handleUpdateMemberPermissions = (
    memberId: string,
    permissions: TeamMember['permissions'],
    role: TeamMember['role']
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, permissions, role } : m))
    );

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        action: `Updated access permissions & role for member ID: ${memberId}`,
        actor: 'Jan Coetzee (Owner)',
        timestamp: new Date().toISOString(),
        severity: 'security',
        ipAddress: '192.168.1.104',
      },
      ...prev,
    ]);
  };

  const handleDeleteTeamMember = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        action: `Owner revoked access & deleted member: ${member?.name} (${member?.role})`,
        actor: 'Jan Coetzee (Owner)',
        timestamp: new Date().toISOString(),
        severity: 'warning',
        ipAddress: '192.168.1.104',
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `member-del-${Date.now()}`,
        title: 'Team Member Deleted',
        message: `Revoked access and terminated session credentials for ${member?.name || 'Member'}.`,
        type: 'security',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  return (
    <div
      id="partssource-za-app"
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white"
    >
      {/* Session Security Lock Overlay */}
      {isSessionLocked && (
        <SessionLockScreen
          onUnlock={() => setIsSessionLocked(false)}
          userEmail={accounts[0]?.email || 'jancoetzee00@gmail.com'}
        />
      )}

      {/* Top Application Header */}
      <Header
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={(id) => {
          setSelectedAccountId(id);
          setSelectedEmailId(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isOnline}
        onToggleSimulateOffline={() => setIsOnline(!isOnline)}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        pendingOutboxCount={pendingOutbox.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenMfa={() => setIsMfaModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        isMfaActive={isMfaActive}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(id) => {
            setSelectedAccountId(id);
            setSelectedEmailId(null);
          }}
          currentFolder={currentFolder}
          onSelectFolder={(f) => {
            setCurrentFolder(f);
            setActiveTab('mailbox');
            setSelectedEmailId(null);
          }}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedEmailId(null);
          }}
          onOpenCompose={() => {
            setComposePrefill({});
            setIsComposeOpen(true);
          }}
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          folderCounts={folderCounts}
          leadsCount={crmLeads.length}
          pendingOutboxCount={pendingOutbox.length}
          isOnline={isOnline}
          lastSyncTime={lastSyncTime}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          businessName={businesses.find((b) => b.id === activeBusinessId)?.name || 'Partssource-za'}
        />

        {/* Dynamic Center Stage View */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* TAB 1: MAILBOX (Email List + Detail split) */}
          {activeTab === 'mailbox' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Email List Column */}
              <div
                className={`w-full ${
                  activeEmail ? 'hidden md:flex md:w-80 lg:w-96' : 'flex'
                } flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}
              >
                <EmailList
                  emails={filteredEmails}
                  selectedEmailId={selectedEmailId}
                  onSelectEmail={handleSelectEmail}
                  accounts={accounts}
                  currentFolder={currentFolder}
                  selectedIds={selectedEmailIds}
                  onToggleSelectId={(id) => {
                    setSelectedEmailIds((prev) =>
                      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                    );
                  }}
                  onSelectAll={() => {
                    if (selectedEmailIds.length === filteredEmails.length) {
                      setSelectedEmailIds([]);
                    } else {
                      setSelectedEmailIds(filteredEmails.map((e) => e.id));
                    }
                  }}
                  onToggleStar={handleToggleStar}
                  onArchiveSelected={handleBatchArchive}
                  onDeleteSelected={handleBatchDelete}
                  onMarkReadSelected={handleBatchMarkRead}
                  isOnline={isOnline}
                  selectedAccountId={selectedAccountId}
                />
              </div>

              {/* Email Detail Column or Empty State */}
              <div
                className={`flex-1 ${
                  !activeEmail ? 'hidden md:flex' : 'flex'
                } flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden`}
              >
                {activeEmail ? (
                  <EmailDetail
                    email={activeEmail}
                    accounts={accounts}
                    crmLeads={crmLeads}
                    signatures={signatures}
                    onBack={() => setSelectedEmailId(null)}
                    onArchive={handleArchiveEmail}
                    onDelete={handleDeleteEmail}
                    onToggleStar={handleToggleStar}
                    onSendReply={(replyData) => {
                      handleSendEmail({
                        accountId: activeEmail.accountId,
                        to: replyData.to,
                        subject: replyData.subject,
                        body: replyData.body,
                        isEncrypted: replyData.isEncrypted,
                        passphrase: replyData.passphrase,
                        scheduledFor: replyData.scheduledFor,
                      });
                    }}
                    onUpdateLeadStage={handleUpdateLeadStage}
                    onCreateLeadFromEmail={handleCreateLeadFromEmail}
                    onNavigateToCrmLead={(leadId) => {
                      setActiveTab('crm');
                    }}
                    isOnline={isOnline}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600">
                    <div className="w-16 h-16 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                      <span className="text-2xl">✉️</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No Correspondence Selected
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Choose an email from the left to view messages, decrypt end-to-end client correspondence, or draft AI responses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CRM PIPELINE VIEW */}
          {activeTab === 'crm' && (
            <CrmPipelineView
              leads={crmLeads}
              onUpdateStage={handleUpdateLeadStage}
              onAddLead={handleAddLead}
              onSelectEmailLead={handleSelectEmailLead}
            />
          )}

          {/* TAB 2.5: EMAIL TEMPLATES */}
          {activeTab === 'templates' && (
            <TemplatesView
              templates={templates}
              onSelectUseTemplate={handleSelectUseTemplate}
              onAddTemplate={handleAddTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}

          {/* TAB 3: AUTO RESPONSES */}
          {activeTab === 'auto_responses' && (
            <AutoResponsesView
              rules={autoRules}
              accounts={accounts}
              onToggleRule={(id) =>
                setAutoRules((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
                )
              }
              onAddRule={(newRule) => {
                const rule: AutoResponseRule = {
                  ...newRule,
                  id: `rule-${Date.now()}`,
                  executionCount: 0,
                };
                setAutoRules((prev) => [rule, ...prev]);
              }}
              onDeleteRule={(id) => setAutoRules((prev) => prev.filter((r) => r.id !== id))}
              onTriggerTestExecution={(ruleId) => {
                setAutoRules((prev) =>
                  prev.map((r) =>
                    r.id === ruleId
                      ? {
                          ...r,
                          executionCount: r.executionCount + 1,
                          lastTriggered: new Date().toISOString(),
                        }
                      : r
                  )
                );
              }}
            />
          )}

          {/* TAB 4: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard emails={emails} leads={crmLeads} />
          )}

          {/* TAB 5: OWNER SETTINGS: BUSINESSES, TEAM GOVERNANCE & AUDIT */}
          {activeTab === 'team_admin' && (
            <TeamAdminView
              businesses={businesses}
              activeBusinessId={activeBusinessId}
              onSelectBusiness={handleSelectActiveBusiness}
              onAddBusiness={handleAddBusiness}
              onDeleteBusiness={handleDeleteBusiness}
              members={teamMembers}
              auditLogs={auditLogs}
              onAddMember={handleAddTeamMember}
              onUpdateMemberPermissions={handleUpdateMemberPermissions}
              onDeleteMember={handleDeleteTeamMember}
              accounts={accounts}
            />
          )}

          {/* TAB 6: CUSTOM SIGNATURES */}
          {activeTab === 'signatures' && (
            <SignaturesModal
              signatures={signatures}
              accounts={accounts}
              onAddSignature={(sig) => {
                const newSig: EmailSignature = {
                  ...sig,
                  id: `sig-${Date.now()}`,
                };
                setSignatures((prev) => [...prev, newSig]);
              }}
              onUpdateSignature={(id, updated) => {
                setSignatures((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
                );
              }}
              onDeleteSignature={(id) => {
                setSignatures((prev) => prev.filter((s) => s.id !== id));
              }}
            />
          )}
        </main>
      </div>

      {/* Compose & Schedule Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setComposePrefill({});
        }}
        accounts={accounts}
        signatures={signatures}
        templates={templates}
        onSendEmail={handleSendEmail}
        isOnline={isOnline}
        prefilledEmail={composePrefill}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAddAccount={(acc) => {
          const newAcc: Account = {
            ...acc,
            id: `acc-${Date.now()}`,
            unreadCount: 0,
          };
          setAccounts((prev) => [...prev, newAcc]);
        }}
      />

      {/* Multi-Factor Authentication (MFA) Modal */}
      <SecurityMfaModal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        onLockSession={() => setIsSessionLocked(true)}
      />

      {/* Real-time Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onSelectNotification={(item) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          );
          if (item.type === 'crm') {
            setActiveTab('crm');
          } else if (item.type === 'scheduled') {
            setCurrentFolder('scheduled');
            setActiveTab('mailbox');
          }
          setIsNotificationCenterOpen(false);
        }}
        onTriggerDemoNotification={handleTriggerDemoNotification}
      />
    </div>
  );
}
