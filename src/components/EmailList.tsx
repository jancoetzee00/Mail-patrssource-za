import React from 'react';
import {
  Star,
  Lock,
  Clock,
  Briefcase,
  Paperclip,
  WifiOff,
  CheckSquare,
  Square,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Email, Account, EmailFolder } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
  accounts: Account[];
  currentFolder: EmailFolder;
  selectedIds: string[];
  onToggleSelectId: (id: string) => void;
  onSelectAll: () => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
  onMarkReadSelected: (read: boolean) => void;
  isOnline: boolean;
  selectedAccountId: string | 'all';
  isGmailConnected?: boolean;
  onConnectGmail?: () => void;
  onSyncGmail?: () => void;
  isGmailSyncing?: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  accounts,
  currentFolder,
  selectedIds,
  onToggleSelectId,
  onSelectAll,
  onToggleStar,
  onArchiveSelected,
  onDeleteSelected,
  onMarkReadSelected,
  isOnline,
  selectedAccountId,
  isGmailConnected = false,
  onConnectGmail,
  onSyncGmail,
  isGmailSyncing = false,
}) => {
  const allSelected = emails.length > 0 && selectedIds.length === emails.length;

  const getAccountInfo = (accountId: string) => {
    return accounts.find((a) => a.id === accountId);
  };

  const formatEmailTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      id="email-list-container"
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800"
    >
      {/* List Action Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          <button
            id="select-all-emails-btn"
            type="button"
            onClick={onSelectAll}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
              <button
                id="batch-mark-read-btn"
                type="button"
                onClick={() => onMarkReadSelected(true)}
                title="Mark as read"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <MailOpen className="w-4 h-4" />
              </button>
              <button
                id="batch-mark-unread-btn"
                type="button"
                onClick={() => onMarkReadSelected(false)}
                title="Mark as unread"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                id="batch-archive-btn"
                type="button"
                onClick={onArchiveSelected}
                title="Archive selected"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                id="batch-delete-btn"
                type="button"
                onClick={onDeleteSelected}
                title="Delete selected"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-500 pl-1">
                {selectedIds.length} selected
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="capitalize font-semibold">{currentFolder}</span>
          <span>•</span>
          <span>{emails.length} items</span>
        </div>
      </div>

      {/* Email List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {emails.length === 0 ? (
          <div
            id="empty-email-list-state"
            className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No messages in {currentFolder}
            </p>
            <p className="text-xs mt-1 text-slate-500 max-w-xs mb-4">
              {currentFolder === 'outbox'
                ? 'Outgoing emails will be queued here safely while offline and synced automatically when reconnected.'
                : 'All clear! Messages will appear here when received, synced, or composed.'}
            </p>

            {currentFolder === 'inbox' && (
              <div className="flex flex-col items-center gap-2">
                {!isGmailConnected && onConnectGmail ? (
                  <GoogleSignInButton
                    onClick={onConnectGmail}
                    label="Connect Gmail to sync inbox"
                    className="shadow-sm"
                  />
                ) : isGmailConnected && onSyncGmail ? (
                  <button
                    type="button"
                    onClick={onSyncGmail}
                    disabled={isGmailSyncing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGmailSyncing ? 'animate-spin' : ''}`} />
                    <span>{isGmailSyncing ? 'Syncing Gmail...' : 'Sync Gmail Inbox'}</span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          emails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const isChecked = selectedIds.includes(email.id);
            const account = getAccountInfo(email.accountId);

            return (
              <div
                key={email.id}
                id={`email-item-${email.id}`}
                onClick={() => onSelectEmail(email.id)}
                className={`group relative flex items-start gap-3 p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-3 border-blue-600'
                    : email.isRead
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/90 font-semibold'
                }`}
              >
                {/* Selection checkbox & Star */}
                <div
                  className="flex flex-col items-center gap-2 pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleSelectId(email.id)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onToggleStar(email.id, e)}
                    className={`transition-colors ${
                      email.isStarred
                        ? 'text-amber-400'
                        : 'text-slate-300 dark:text-slate-600 opacity-40 group-hover:opacity-100 hover:text-amber-400'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        email.isStarred ? 'fill-amber-400' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Email Body & Details */}
                <div className="flex-1 min-w-0">
                  {/* Sender line & Timestamp */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Unified inbox account indicator pill */}
                      {selectedAccountId === 'all' && account && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0"
                          style={{
                            backgroundColor: `${account.color}20`,
                            color: account.color,
                          }}
                        >
                          {account.name.split(' ')[0]}
                        </span>
                      )}
                      <span
                        className={`text-xs truncate ${
                          email.isRead
                            ? 'font-medium text-slate-700 dark:text-slate-300'
                            : 'font-bold text-slate-900 dark:text-white'
                        }`}
                      >
                        {email.from.name || email.from.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatEmailTime(email.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {/* E2EE indicator */}
                    {email.isEncrypted && (
                      <span
                        title="End-to-End Encrypted (AES-256)"
                        className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        E2EE
                      </span>
                    )}

                    {/* Scheduled indicator */}
                    {email.scheduledFor && (
                      <span
                        title={`Scheduled for ${new Date(email.scheduledFor).toLocaleString()}`}
                        className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        Scheduled
                      </span>
                    )}

                    {/* Offline Outbox queue */}
                    {email.syncStatus === 'pending_outbox' && (
                      <span
                        title="Queued in offline outbox - will sync automatically"
                        className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0"
                      >
                        <WifiOff className="w-2.5 h-2.5" />
                        Queued Offline
                      </span>
                    )}

                    {/* Subject text */}
                    <h2
                      className={`text-xs truncate ${
                        email.isRead
                          ? 'font-normal text-slate-800 dark:text-slate-200'
                          : 'font-semibold text-slate-900 dark:text-white'
                      }`}
                    >
                      {email.subject || '(No Subject)'}
                    </h2>
                  </div>

                  {/* Body Preview */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1.5">
                    {email.isEncrypted
                      ? '🔒 [End-to-End Encrypted Client Correspondence - Click to view]'
                      : email.previewText || email.body.substring(0, 100)}
                  </p>

                  {/* Tags and Lead Stage badges */}
                  <div className="flex flex-wrap items-center gap-1">
                    {email.leadStage && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                        <Briefcase className="w-2.5 h-2.5" />
                        {email.leadStage}
                      </span>
                    )}

                    {email.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
