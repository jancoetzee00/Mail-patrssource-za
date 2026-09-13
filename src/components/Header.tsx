import React from 'react';
import {
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Shield,
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  Lock,
} from 'lucide-react';
import { Account, NotificationItem } from '../types';

interface HeaderProps {
  accounts: Account[];
  selectedAccountId: string | 'all';
  onSelectAccount: (id: string | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOnline: boolean;
  onToggleSimulateOffline: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  pendingOutboxCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenMfa: () => void;
  onToggleMobileSidebar: () => void;
  isMfaActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  searchQuery,
  onSearchChange,
  isOnline,
  onToggleSimulateOffline,
  isSyncing,
  onManualSync,
  pendingOutboxCount,
  darkMode,
  onToggleDarkMode,
  notifications,
  onOpenNotifications,
  onOpenMfa,
  onToggleMobileSidebar,
  isMfaActive,
}) => {
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const currentAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2.5 transition-colors duration-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
    >
      {/* Left: Mobile hamburger & Brand/Search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          id="mobile-sidebar-toggle-btn"
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-email-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search emails, leads, encrypted messages, or tags..."
            className="w-full pl-9.5 pr-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Account Selector filter */}
        <div className="hidden lg:flex items-center">
          <select
            id="header-account-selector-select"
            value={selectedAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="text-xs font-medium py-1.5 px-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">🌐 All Inboxes (Unified)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.email.split('@')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Actions & Status controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline Simulation / Real status */}
        <button
          id="offline-mode-toggle-btn"
          type="button"
          onClick={onToggleSimulateOffline}
          title={isOnline ? 'Online - Click to test Offline Mode' : 'Offline - Click to reconnect'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Offline ({pendingOutboxCount} queued)</span>
            </>
          )}
        </button>

        {/* Cloud Sync Button */}
        <button
          id="cloud-sync-action-btn"
          type="button"
          onClick={onManualSync}
          disabled={isSyncing || !isOnline}
          title="Synchronize client data with secure cloud"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
        </button>

        {/* Multi-Factor Authentication & Security Modal Trigger */}
        <button
          id="mfa-security-toggle-btn"
          type="button"
          onClick={onOpenMfa}
          title="Multi-Factor Authentication & E2EE Security Settings"
          className="flex items-center gap-1 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isMfaActive ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Shield className="w-4 h-4 text-slate-400" />
          )}
          <span className="hidden md:inline text-xs font-medium">MFA Active</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            type="button"
            onClick={onOpenNotifications}
            title="Notifications & Updates"
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle-btn"
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Account Avatar / Current Role */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
            <img
              src={currentAccount?.avatar || accounts[0]?.avatar}
              alt="Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left hidden xl:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {currentAccount?.name.split(' ')[0] || 'Executive'}
            </p>
            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {currentAccount?.role || 'Owner'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
