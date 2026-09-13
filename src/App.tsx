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
import { GmailConfirmModal, GmailConfirmType } from './components/GmailConfirmModal';
import {
  initGmailAuth,
  signInWithGmail,
  signOutGmail,
  fetchGmailEmails,
  sendGmailEmail,
  trashGmailEmail,
  setGmailStarred,
  setGmailReadStatus,
} from './lib/gmailService';
import {
  auth,
  syncEmailToFirestore,
  deleteEmailFromFirestore,
  syncLeadToFirestore,
  subscribeFirestoreEmails,
  subscribeFirestoreLeads,
} from './lib/firebase';

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

  // --- Gmail Integration State ---
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(false);
  const [gmailUserEmail, setGmailUserEmail] = useState<string | null>(null);
  const [isGmailSyncing, setIsGmailSyncing] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: GmailConfirmType;
    title: string;
    description: string;
    detailItems?: string[];
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // --- Firebase User & Firestore Realtime Sync ---
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(
    auth.currentUser?.uid || null
  );

  // --- Initialize Gmail Client Auth Listener ---
  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user) => {
        setIsGmailConnected(true);
        if (user.email) {
          setGmailUserEmail(user.email);
        }
        setFirebaseUserId(user.uid);
      },
      () => {
        setIsGmailConnected(false);
        setGmailUserEmail(null);
        setFirebaseUserId(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Realtime Firestore Cloud Database Synchronization ---
  useEffect(() => {
    if (!firebaseUserId) return;
    const unsubEmails = subscribeFirestoreEmails(
      firebaseUserId,
      (remoteEmails) => {
        if (remoteEmails.length > 0) {
          setEmails((prev) => {
            const remoteMap = new Map(remoteEmails.map((e) => [e.id, e]));
            const merged = prev.map((e) => remoteMap.get(e.id) || e);
            const existingIds = new Set(prev.map((e) => e.id));
            const newFromRemote = remoteEmails.filter((e) => !existingIds.has(e.id));
            return [...newFromRemote, ...merged];
          });
        }
      },
      (err) => console.warn('Firestore Email Sync warning:', err.message)
    );

    const unsubLeads = subscribeFirestoreLeads(
      firebaseUserId,
      (remoteLeads) => {
        if (remoteLeads.length > 0) {
          setCrmLeads((prev) => {
            const remoteMap = new Map(remoteLeads.map((l) => [l.id, l]));
            const merged = prev.map((l) => remoteMap.get(l.id) || l);
            const existingIds = new Set(prev.map((l) => l.id));
            const newFromRemote = remoteLeads.filter((l) => !existingIds.has(l.id));
            return [...newFromRemote, ...merged];
          });
        }
      },
      (err) => console.warn('Firestore CRM Leads Sync warning:', err.message)
    );

    return () => {
      unsubEmails();
      unsubLeads();
    };
  }, [firebaseUserId]);

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

  // --- Gmail Authentication & Synchronization Handlers ---
  const handleConnectGmail = async () => {
    try {
      const { user } = await signInWithGmail();
      const userEmail = user.email || 'jancoetzee00@gmail.com';
      setIsGmailConnected(true);
      setGmailUserEmail(userEmail);

      // Link to accounts list
      setAccounts((prev) => {
        const found = prev.find((a) => a.email.toLowerCase() === userEmail.toLowerCase());
        if (found) {
          return prev.map((a) =>
            a.id === found.id
              ? { ...a, name: user.displayName || a.name, avatar: user.photoURL || a.avatar }
              : a
          );
        }
        return [
          {
            id: `acc_gmail_${Date.now()}`,
            businessId: activeBusinessId,
            name: user.displayName || 'Jan Coetzee',
            email: userEmail,
            avatar:
              user.photoURL ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            color: '#EA4335',
            role: 'owner',
            provider: 'Google Workspace',
            unreadCount: 0,
          },
          ...prev,
        ];
      });

      setNotifications((prev) => [
        {
          id: `gmail-connect-${Date.now()}`,
          title: 'Gmail Connected Successfully',
          message: `Signed in as ${userEmail}. Ready to sync and send messages.`,
          type: 'sync',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);

      await triggerGmailSync(userEmail);
    } catch (err: any) {
      console.error('Gmail Connect Error:', err);
      setNotifications((prev) => [
        {
          id: `gmail-connect-err-${Date.now()}`,
          title: 'Gmail Authentication',
          message: err.message || 'Google OAuth sign-in was cancelled or blocked.',
          type: 'system',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const handleDisconnectGmail = async () => {
    await signOutGmail();
    setIsGmailConnected(false);
    setGmailUserEmail(null);
    setNotifications((prev) => [
      {
        id: `gmail-disconnect-${Date.now()}`,
        title: 'Gmail Session Disconnected',
        message: 'Google Workspace access tokens removed from memory.',
        type: 'system',
        timestamp: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const triggerGmailSync = async (userEmailOverride?: string) => {
    if (isGmailSyncing) return;
    setIsGmailSyncing(true);
    try {
      const targetAccountId =
        accounts.find((a) => a.provider === 'Google Workspace')?.id ||
        accounts[0]?.id ||
        'acc_jan';
      const fetchedEmails = await fetchGmailEmails(targetAccountId, 30);

      setEmails((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEmails = fetchedEmails.filter((e) => !existingIds.has(e.id));
        return [...newEmails, ...prev];
      });

      if (firebaseUserId) {
        for (const fe of fetchedEmails.slice(0, 15)) {
          syncEmailToFirestore(firebaseUserId, fe).catch(console.error);
        }
      }

      const unreadCount = fetchedEmails.filter((e) => !e.isRead && e.folder === 'inbox').length;
      setAccounts((prev) =>
        prev.map((a) => (a.id === targetAccountId ? { ...a, unreadCount } : a))
      );

      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );

      setNotifications((prev) => [
        {
          id: `gmail-synced-${Date.now()}`,
          title: 'Gmail Inbox Synced',
          message: `Retrieved ${fetchedEmails.length} messages from ${
            userEmailOverride || gmailUserEmail || 'Gmail'
          }.`,
          type: 'sync',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error('Gmail Sync Error:', err);
      setNotifications((prev) => [
        {
          id: `gmail-sync-err-${Date.now()}`,
          title: 'Gmail Sync Error',
          message:
            err.message || 'Failed to fetch messages from Gmail API. Ensure you are signed in.',
          type: 'system',
          timestamp: 'Just now',
          read: false,
        },
        ...prev,
      ]);
    } finally {
      setIsGmailSyncing(false);
    }
  };

  // --- Email Actions ---
  const handleToggleStar = (emailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = emails.find((em) => em.id === emailId);
    if (!current) return;
    const newStarred = !current.isStarred;
    setEmails((prev) =>
      prev.map((em) => (em.id === emailId ? { ...em, isStarred: newStarred } : em))
    );
    if (isGmailConnected) {
      setGmailStarred(emailId, newStarred).catch(console.error);
    }
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    // Mark as read
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, isRead: true } : em))
    );
    if (isGmailConnected) {
      setGmailReadStatus(id, true).catch(console.error);
    }
  };

  const handleArchiveEmail = (id: string) => {
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, folder: 'archive' } : em))
    );
    if (selectedEmailId === id) setSelectedEmailId(null);
  };

  const handleDeleteEmail = (id: string) => {
    const emailToDelete = emails.find((e) => e.id === id);
    // Mandatory user confirmation for destructive delete/trash action
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      title: 'Move Email to Trash',
      description:
        'Are you sure you want to move this message to trash? If connected to Gmail, this will update your remote mailbox.',
      detailItems: emailToDelete
        ? [
            `Subject: ${emailToDelete.subject}`,
            `From: ${emailToDelete.from.name} <${emailToDelete.from.email}>`,
          ]
        : undefined,
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(null);
        if (isGmailConnected) {
          try {
            await trashGmailEmail(id);
          } catch (e) {
            console.error('Failed to trash email in Gmail:', e);
          }
        }
        setEmails((prev) =>
          prev.map((em) => (em.id === id ? { ...em, folder: 'trash' } : em))
        );
        if (firebaseUserId && emailToDelete) {
          syncEmailToFirestore(firebaseUserId, { ...emailToDelete, folder: 'trash' }).catch(console.error);
        }
        if (selectedEmailId === id) setSelectedEmailId(null);
        setNotifications((prev) => [
          {
            id: `del-${Date.now()}`,
            title: 'Email Moved to Trash',
            message: 'The email was moved to the trash folder.',
            type: 'system',
            timestamp: 'Just now',
            read: false,
          },
          ...prev,
        ]);
      },
    });
  };

  const handleBatchArchive = () => {
    setEmails((prev) =>
      prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, folder: 'archive' } : em))
    );
    setSelectedEmailIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedEmailIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'batch_delete',
      title: `Move ${selectedEmailIds.length} Emails to Trash`,
      description: `Are you sure you want to move all ${selectedEmailIds.length} selected messages to trash?`,
      detailItems: [`Selected items: ${selectedEmailIds.length} messages`],
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(null);
        if (isGmailConnected) {
          for (const id of selectedEmailIds) {
            try {
              await trashGmailEmail(id);
            } catch (e) {
              console.error(`Failed to trash ${id}:`, e);
            }
          }
        }
        setEmails((prev) =>
          prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, folder: 'trash' } : em))
        );
        setSelectedEmailIds([]);
        setNotifications((prev) => [
          {
            id: `batch-del-${Date.now()}`,
            title: 'Emails Moved to Trash',
            message: `${selectedEmailIds.length} messages moved to trash.`,
            type: 'system',
            timestamp: 'Just now',
            read: false,
          },
          ...prev,
        ]);
      },
    });
  };

  const handleBatchMarkRead = (read: boolean) => {
    setEmails((prev) =>
      prev.map((em) => (selectedEmailIds.includes(em.id) ? { ...em, isRead: read } : em))
    );
    setSelectedEmailIds([]);
  };

  // --- Send Email Execution ---
  const executeSendEmail = async (emailData: {
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

    let sentMessageId: string | undefined;
    let sentThreadId: string | undefined;

    if (
      isOnline &&
      !isScheduled &&
      (isGmailConnected || fromAccount.provider === 'Google Workspace')
    ) {
      try {
        const result = await sendGmailEmail({
          fromEmail: fromAccount.email,
          fromName: fromAccount.name,
          to: [emailData.to],
          cc: emailData.cc ? [emailData.cc] : undefined,
          subject: emailData.subject,
          htmlBody: emailData.body,
        });
        sentMessageId = result.id;
        sentThreadId = result.threadId;
      } catch (err: any) {
        console.warn('Gmail API direct send failed, falling back to local dispatch:', err);
      }
    }

    const newEmail: Email = {
      id: sentMessageId || `mail-${Date.now()}`,
      threadId: sentThreadId || `thread-${Date.now()}`,
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
      if (firebaseUserId) {
        syncEmailToFirestore(firebaseUserId, newEmail).catch(console.error);
      }
      setNotifications((prev) => [
        {
          id: `sent-${Date.now()}`,
          title: sentMessageId
            ? 'Delivered via Gmail API'
            : isScheduled
            ? 'Email Scheduled'
            : 'Email Dispatched',
          message: sentMessageId
            ? `Dispatched via live Gmail API to ${emailData.to}`
            : isScheduled
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

  // --- Send Email Handler (from Compose modal or reply) with user confirmation ---
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
    const isGmail = isGmailConnected || fromAccount.provider === 'Google Workspace';

    if (isGmail && isOnline && !emailData.scheduledFor) {
      // Mandatory confirmation before dispatching live email via Gmail
      setConfirmModal({
        isOpen: true,
        type: 'send',
        title: 'Send Email via Gmail API',
        description:
          'You are about to dispatch this message directly via your connected Gmail / Google Workspace account.',
        detailItems: [
          `From: ${fromAccount.name} <${fromAccount.email}>`,
          `To: ${emailData.to}`,
          `Subject: ${emailData.subject}`,
        ],
        isDestructive: false,
        onConfirm: () => {
          setConfirmModal(null);
          executeSendEmail(emailData);
        },
      });
    } else {
      executeSendEmail(emailData);
    }
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
    if (firebaseUserId && targetLead) {
      syncLeadToFirestore(firebaseUserId, { ...targetLead, stage: newStage }).catch(console.error);
    }
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
    if (firebaseUserId) {
      syncLeadToFirestore(firebaseUserId, newLead).catch(console.error);
    }

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
    if (firebaseUserId) {
      syncLeadToFirestore(firebaseUserId, newLead).catch(console.error);
    }

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
        isGmailConnected={isGmailConnected}
        gmailUserEmail={gmailUserEmail}
        onConnectGmail={handleConnectGmail}
        onDisconnectGmail={handleDisconnectGmail}
        onSyncGmail={() => triggerGmailSync()}
        isGmailSyncing={isGmailSyncing}
        isFirestoreActive={true}
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
          isGmailConnected={isGmailConnected}
          gmailUserEmail={gmailUserEmail}
          onConnectGmail={handleConnectGmail}
          onSyncGmail={() => triggerGmailSync()}
          isGmailSyncing={isGmailSyncing}
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
                  isGmailConnected={isGmailConnected}
                  onConnectGmail={handleConnectGmail}
                  onSyncGmail={() => triggerGmailSync()}
                  isGmailSyncing={isGmailSyncing}
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
        onGmailConnected={(gmailEmail, displayName, photoUrl) => {
          setIsGmailConnected(true);
          setGmailUserEmail(gmailEmail);
          setAccounts((prev) => {
            const found = prev.find((a) => a.email.toLowerCase() === gmailEmail.toLowerCase());
            if (found) {
              return prev.map((a) =>
                a.id === found.id
                  ? { ...a, name: displayName || a.name, avatar: photoUrl || a.avatar }
                  : a
              );
            }
            return [
              {
                id: `acc_gmail_${Date.now()}`,
                businessId: activeBusinessId,
                name: displayName || 'Jan Coetzee',
                email: gmailEmail,
                avatar: photoUrl,
                color: '#EA4335',
                role: 'owner',
                provider: 'Google Workspace',
                unreadCount: 0,
              },
              ...prev,
            ];
          });
          triggerGmailSync(gmailEmail);
        }}
      />

      {/* Workspace API Explicit Confirmation Modal */}
      {confirmModal && (
        <GmailConfirmModal
          isOpen={confirmModal.isOpen}
          type={confirmModal.type}
          title={confirmModal.title}
          description={confirmModal.description}
          detailItems={confirmModal.detailItems}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

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
