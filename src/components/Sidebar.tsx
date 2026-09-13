import React, { useState } from 'react';
import {
  Inbox,
  Send,
  Clock,
  FileText,
  Archive,
  Trash2,
  Star,
  Users,
  BarChart3,
  Bot,
  PenTool,
  ShieldCheck,
  PlusCircle,
  Briefcase,
  Layers,
  ChevronDown,
  Lock,
  WifiOff,
  CheckCircle2,
  FileCode2,
  Building2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Account, EmailFolder } from '../types';

export type ActiveTab =
  | 'mailbox'
  | 'crm'
  | 'templates'
  | 'auto_responses'
  | 'analytics'
  | 'team_admin'
  | 'signatures';

interface SidebarProps {
  accounts: Account[];
  selectedAccountId: string | 'all';
  onSelectAccount: (id: string | 'all') => void;
  currentFolder: EmailFolder;
  onSelectFolder: (folder: EmailFolder) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenCompose: () => void;
  onOpenAddAccount: () => void;
  folderCounts: Record<EmailFolder, number>;
  leadsCount: number;
  pendingOutboxCount: number;
  isOnline: boolean;
  lastSyncTime: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  businessName?: string;
  isGmailConnected?: boolean;
  gmailUserEmail?: string | null;
  onConnectGmail?: () => void;
  onSyncGmail?: () => void;
  isGmailSyncing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  currentFolder,
  onSelectFolder,
  activeTab,
  onSelectTab,
  onOpenCompose,
  onOpenAddAccount,
  folderCounts,
  leadsCount,
  pendingOutboxCount,
  isOnline,
  lastSyncTime,
  isMobileOpen,
  onCloseMobile,
  businessName = 'Partssource-za',
  isGmailConnected = false,
  gmailUserEmail = null,
  onConnectGmail,
  onSyncGmail,
  isGmailSyncing = false,
}) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const selectedAccount =
    selectedAccountId === 'all'
      ? null
      : accounts.find((a) => a.id === selectedAccountId);

  const navFolders: { id: EmailFolder; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox className="w-4 h-4" />,
      count: folderCounts.inbox,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: <Clock className="w-4 h-4" />,
      count: folderCounts.scheduled,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: <FileText className="w-4 h-4" />,
      count: folderCounts.drafts,
    },
    {
      id: 'outbox',
      label: 'Outbox (Offline)',
      icon: <WifiOff className="w-4 h-4" />,
      count: pendingOutboxCount,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star className="w-4 h-4" />,
      count: folderCounts.starred,
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="w-4 h-4" />,
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: <Trash2 className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        id="app-main-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 lg:w-64 flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/30 flex-shrink-0 font-bold text-xs">
              PS
            </div>
            <div className="min-w-0 truncate">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate" title={businessName}>
                {businessName}
              </h1>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                Mail &amp; CRM Platform
              </p>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex-shrink-0">
            E2EE
          </span>
        </div>

        {/* Account Selector Accordion */}
        <div className="px-3 pt-3">
          <div className="relative">
            <button
              id="sidebar-account-selector-btn"
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedAccount ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                    <img
                      src={selectedAccount.avatar}
                      alt={selectedAccount.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedAccount ? selectedAccount.name : 'Unified Inboxes'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedAccount ? selectedAccount.email : 'All 4 Accounts'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isAccountDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div
                id="sidebar-account-dropdown-menu"
                className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1.5"
              >
                <button
                  id="select-account-unified"
                  type="button"
                  onClick={() => {
                    onSelectAccount('all');
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                    selectedAccountId === 'all'
                      ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Unified Inboxes
                  </span>
                  {selectedAccountId === 'all' && <CheckCircle2 className="w-3 h-3" />}
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    id={`select-account-${acc.id}`}
                    type="button"
                    onClick={() => {
                      onSelectAccount(acc.id);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60 ${
                      selectedAccountId === acc.id
                        ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <span className="truncate">{acc.name}</span>
                    </div>
                    {acc.unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {acc.unreadCount}
                      </span>
                    )}
                  </button>
                ))}

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                <button
                  id="connect-gmail-sidebar-dropdown-btn"
                  type="button"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    if (onConnectGmail) onConnectGmail();
                  }}
                  className="w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isGmailConnected ? 'Gmail Active (Sync)' : 'Connect Gmail Account'}</span>
                </button>

                <button
                  id="add-business-account-trigger-btn"
                  type="button"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenAddAccount();
                  }}
                  className="w-full px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Connect Other Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Gmail live status chip if connected */}
          {isGmailConnected && (
            <div className="mt-2 p-2 rounded-lg bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {gmailUserEmail || 'Gmail Active'}
                </span>
              </div>
              <button
                type="button"
                onClick={onSyncGmail}
                disabled={isGmailSyncing}
                title="Sync Gmail inbox"
                className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isGmailSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Primary Compose Button */}
        <div className="p-3">
          <button
            id="sidebar-compose-email-btn"
            type="button"
            onClick={onOpenCompose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wide shadow-sm hover:shadow transition-all"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Compose Message</span>
            <span className="ml-auto text-[10px] bg-blue-500/50 px-1 rounded text-blue-100">
              C
            </span>
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4">
          {/* Email Folders */}
          <div>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Mailbox
            </p>
            <div className="space-y-0.5">
              {navFolders.map((folder) => {
                const isSelected = activeTab === 'mailbox' && currentFolder === folder.id;
                const isOutbox = folder.id === 'outbox';
                return (
                  <button
                    key={folder.id}
                    id={`sidebar-nav-folder-${folder.id}`}
                    type="button"
                    onClick={() => {
                      onSelectTab('mailbox');
                      onSelectFolder(folder.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }
                      >
                        {folder.icon}
                      </span>
                      <span>{folder.label}</span>
                    </div>
                    {typeof folder.count === 'number' && folder.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isOutbox
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {folder.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business Tools & Integrations */}
          <div>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              CRM &amp; Automation
            </p>
            <div className="space-y-0.5">
              {/* CRM Leads */}
              <button
                id="sidebar-nav-tab-crm"
                type="button"
                onClick={() => {
                  onSelectTab('crm');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'crm'
                    ? 'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase
                    className={`w-4 h-4 ${
                      activeTab === 'crm'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>CRM Lead Pipeline</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {leadsCount}
                </span>
              </button>

              {/* Email Templates */}
              <button
                id="sidebar-nav-tab-templates"
                type="button"
                onClick={() => {
                  onSelectTab('templates');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode2
                    className={`w-4 h-4 ${
                      activeTab === 'templates'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Email Templates</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Boilerplate
                </span>
              </button>

              {/* Automated Responses */}
              <button
                id="sidebar-nav-tab-auto-responses"
                type="button"
                onClick={() => {
                  onSelectTab('auto_responses');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'auto_responses'
                    ? 'bg-purple-100/80 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot
                    className={`w-4 h-4 ${
                      activeTab === 'auto_responses'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Auto-Responses &amp; AI</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
              </button>

              {/* Analytics & Performance */}
              <button
                id="sidebar-nav-tab-analytics"
                type="button"
                onClick={() => {
                  onSelectTab('analytics');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-100/80 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3
                    className={`w-4 h-4 ${
                      activeTab === 'analytics'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Analytics &amp; KPI</span>
                </div>
              </button>
            </div>
          </div>

          {/* Administration & Organization */}
          <div>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Administration
            </p>
            <div className="space-y-0.5">
              {/* Owner Settings: Businesses & Team Governance */}
              <button
                id="sidebar-nav-tab-team"
                type="button"
                onClick={() => {
                  onSelectTab('team_admin');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'team_admin'
                    ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2
                    className={`w-4 h-4 ${
                      activeTab === 'team_admin'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Owner Settings</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Owner
                </span>
              </button>

              {/* Custom Signatures */}
              <button
                id="sidebar-nav-tab-signatures"
                type="button"
                onClick={() => {
                  onSelectTab('signatures');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'signatures'
                    ? 'bg-indigo-100/80 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText
                    className={`w-4 h-4 ${
                      activeTab === 'signatures'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Custom Signatures</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer: E2EE & Cloud Sync Status */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>AES-256-GCM Active</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">E2EE</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>Sync: {lastSyncTime}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
          </div>
        </div>
      </aside>
    </>
  );
};
