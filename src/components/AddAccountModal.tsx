import React, { useState } from 'react';
import { PlusCircle, X, Shield, Mail, Check } from 'lucide-react';
import { Account, AccountRole } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: Omit<Account, 'id' | 'unreadCount'>) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState<Account['provider']>('Google Workspace');
  const [role, setRole] = useState<AccountRole>('sales');
  const [color, setColor] = useState('#3B82F6');

  if (!isOpen) return null;

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
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
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
              placeholder="e.g. Legal & Contracts / Regional Sales"
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
              placeholder="sales@partssource-za.co.za"
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-300">Provider:</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Account['provider'])}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="sales">Sales &amp; Deals</option>
                <option value="support">Support &amp; SLA</option>
                <option value="admin">Operations / Billing</option>
                <option value="owner">Executive</option>
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
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600"
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
