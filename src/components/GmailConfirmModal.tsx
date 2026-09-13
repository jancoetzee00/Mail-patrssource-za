import React from 'react';
import { AlertTriangle, Send, Trash2, ShieldAlert, X } from 'lucide-react';

export type GmailConfirmType = 'send' | 'delete' | 'batch_delete' | 'disconnect';

export interface GmailConfirmModalProps {
  isOpen: boolean;
  type: GmailConfirmType;
  title: string;
  description: string;
  detailItems?: string[];
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GmailConfirmModal: React.FC<GmailConfirmModalProps> = ({
  isOpen,
  type,
  title,
  description,
  detailItems = [],
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'send':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Send className="w-5 h-5" />
          </div>
        );
      case 'delete':
      case 'batch_delete':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div
      id="gmail-confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        id="gmail-confirmation-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gmail-confirm-title"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {renderIcon()}
              <div>
                <h3
                  id="gmail-confirm-title"
                  className="text-base font-semibold text-slate-900 dark:text-white"
                >
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <button
              id="gmail-confirm-close-btn"
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {detailItems.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
              {detailItems.map((item, idx) => (
                <div key={idx} className="truncate">
                  {item}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              id="gmail-confirm-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="gmail-confirm-action-btn"
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-xs font-medium text-white shadow-xs transition-colors cursor-pointer ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isDestructive ? 'Confirm & Delete' : 'Confirm & Proceed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
