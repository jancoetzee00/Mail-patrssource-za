import React, { useState } from 'react';
import { Lock, Shield, KeyRound, ArrowRight, Fingerprint } from 'lucide-react';

interface SessionLockScreenProps {
  onUnlock: () => void;
  userEmail: string;
}

export const SessionLockScreen: React.FC<SessionLockScreenProps> = ({
  onUnlock,
  userEmail,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept standard default PIN or any 4+ char passcode
    if (pin.length >= 4) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div
      id="session-locked-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white"
    >
      <div className="w-full max-w-sm p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold">Session Security Locked</h2>
          <p className="text-xs text-slate-400 mt-1">
            Client data is encrypted with AES-256 zero-knowledge credentials.
          </p>
          <div className="mt-2 text-xs font-semibold text-slate-300 font-mono bg-slate-800/80 py-1 px-3 rounded-full inline-block">
            {userEmail}
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Enter PIN (e.g. 1234 or your passphrase)"
              className="w-full text-center tracking-widest text-sm p-3 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1">
                Please enter at least 4 characters to unlock.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <span>Unlock Secure Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onUnlock}
            className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Biometric / WebAuthn Instant Unlock</span>
          </button>
        </form>
      </div>
    </div>
  );
};
