import React, { useState } from 'react';
import { PlusCircle, X, Shield, Mail, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Account, AccountRole } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { signInWithGmail } from '../lib/gmailService';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<Account, 'id' | 'unreadCount'>) => void;
  onGmailConnected?: (gmailEmail: string, displayName: string, avatarUrl: string) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  onGmailConnected,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<Account['provider']>('Google Workspace');
  const [role, setRole] = useState<AccountRole>('sales');
  const [color, setColor] = useState('#3B82F6');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);
    try {
      const { user } = await signInWithGmail();
      const userEmail = user.email || 'jancoetzee00@gmail.com';
      const displayName = user.displayName || userEmail.split('@')[0];
      const photoURL =
        user.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      if (onGmailConnected) {
        onGmailConnected(userEmail, displayName, photoURL);
      } else {
        onAddAccount({
          name: displayName,
          email: userEmail,
          avatar: photoURL,
          color: '#EA4335',
          role: 'owner',
          provider: 'Google Workspace',
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setAuthError(
        err.message || 'Failed to authenticate with Google. Please check your popup blocker and try again.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onAddAccount({
      name,
      email,
      avatar: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80`,
      color,
      role,
      provider,
    });

    onClose();
    setName('');
    setEmail('');
  };

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div
      id="add-account-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="add-account-modal-window"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Connect Business Mail Account
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Real Gmail Connection Option */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Connect Real Gmail / Google Workspace
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Authorize directly with Google OAuth to read, sync, compose, and send your live business emails in real-time.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <GoogleSignInButton
              onClick={handleGoogleConnect}
              isLoading={isGoogleLoading}
              label="Sign in with Google / Connect Gmail"
              className="w-full py-2.5 shadow-sm text-xs font-semibold"
            />
          </div>

          {authError && (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
            or manual account setup
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-300">
              Account Display Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Parts Sales / Jan Coetzee"
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-300">
              Business Email Address:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@partssource-za.co.za"
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300">Provider:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Account['provider'])}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="Google Workspace">Google Workspace</option>
                <option value="Microsoft 365">Microsoft 365</option>
                <option value="Custom IMAP/SMTP">Custom IMAP/SMTP</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300">
                Department Role:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AccountRole)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="owner">Executive / Owner</option>
                <option value="sales">Sales &amp; Deals</option>
                <option value="support">Support &amp; SLA</option>
                <option value="admin">Operations / Billing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Account Badge Accent:
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700"
            >
              Connect Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
