import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Key,
  Smartphone,
  Lock,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertCircle,
  QrCode,
} from 'lucide-react';

interface SecurityMfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockSession: () => void;
}

export const SecurityMfaModal: React.FC<SecurityMfaModalProps> = ({
  isOpen,
  onClose,
  onLockSession,
}) => {
  const [totpCode, setTotpCode] = useState('482 910');
  const [secondsRemaining, setSecondsRemaining] = useState(24);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const secretKey = 'JBSWY3DPEHPK3PXP';
  const backupCodes = [
    '8841-9920',
    '3412-8819',
    '7721-0045',
    '9102-4418',
    '5532-1189',
    '6490-2384',
  ];

  // Rolling TOTP timer simulation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Generate new 6-digit code
          const newCode = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(
            100 + Math.random() * 900
          )}`;
          setTotpCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div
      id="mfa-security-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="mfa-security-modal-window"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Factor Authentication (MFA / 2FA)
              </h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Status: Enforced &amp; Active
              </p>
            </div>
          </div>
          <button
            id="close-mfa-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rolling Code Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active TOTP One-Time Passcode
            </span>
            <div className="text-3xl font-extrabold tracking-wider font-mono text-slate-900 dark:text-white mt-0.5">
              {totpCode}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              Verified via Authenticator App
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-slate-200 dark:stroke-slate-700 fill-none"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  className="stroke-emerald-500 fill-none transition-all duration-1000"
                  strokeWidth="3"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (secondsRemaining / 30) * 94.2}
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {secondsRemaining}s
              </span>
            </div>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Refreshes</span>
          </div>
        </div>

        {/* QR Code and Secret Key */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Authenticator Secret Key:
            </span>
            <button
              type="button"
              onClick={handleCopySecret}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
          <code className="block p-2 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 text-center tracking-widest font-bold">
            {secretKey}
          </code>
        </div>

        {/* Emergency Backup Codes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Offline Emergency Recovery Codes
            </span>
            <button
              type="button"
              onClick={handleCopyBackupCodes}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {copiedCodes ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCodes ? 'Copied' : 'Copy All Codes'}</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {backupCodes.map((c, i) => (
              <div
                key={i}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Lock Session Now Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            id="lock-session-now-btn"
            type="button"
            onClick={() => {
              onClose();
              onLockSession();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Session Now</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
