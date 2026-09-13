import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Check,
  Globe,
  Phone,
  Calendar,
  Building,
  Shield,
  Palette,
} from 'lucide-react';
import { EmailSignature, Account } from '../types';

interface SignaturesModalProps {
  signatures: EmailSignature[];
  accounts: Account[];
  onAddSignature: (sig: Omit<EmailSignature, 'id'>) => void;
  onUpdateSignature: (id: string, sig: Partial<EmailSignature>) => void;
  onDeleteSignature: (id: string) => void;
}

export const SignaturesModal: React.FC<SignaturesModalProps> = ({
  signatures,
  accounts,
  onAddSignature,
  onUpdateSignature,
  onDeleteSignature,
}) => {
  const [selectedSigId, setSelectedSigId] = useState<string>(signatures[0]?.id || '');
  const activeSig = signatures.find((s) => s.id === selectedSigId) || signatures[0];

  const handleAddNew = () => {
    onAddSignature({
      name: `Signature #${signatures.length + 1}`,
      fullName: 'Jan Coetzee',
      title: 'Commercial Executive',
      company: 'Partssource-za',
      phone: '+27 11 000 0000',
      website: 'https://partssource-za.co.za',
      calendlyUrl: '',
      disclaimer: 'CONFIDENTIAL: Contains proprietary business communication.',
      brandColor: '#2563EB',
      assignedAccountId: 'all',
    });
  };

  return (
    <div
      id="signatures-manager-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto text-slate-800 dark:text-slate-100"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Custom Business Email Signatures
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Design professional multi-account signatures, booking links, and legal confidentiality disclaimers
          </p>
        </div>

        <button
          id="create-new-signature-btn"
          type="button"
          onClick={handleAddNew}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Signature</span>
        </button>
      </div>

      <div className="p-5 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Signatures List */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Saved Profiles ({signatures.length})
          </p>

          <div className="space-y-2">
            {signatures.map((sig) => {
              const isSelected = sig.id === selectedSigId;
              const assignedAcc = accounts.find((a) => a.id === sig.assignedAccountId);

              return (
                <div
                  key={sig.id}
                  id={`signature-item-${sig.id}`}
                  onClick={() => setSelectedSigId(sig.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sig.brandColor }}
                      />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sig.name}
                      </h4>
                    </div>

                    {signatures.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSignature(sig.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    {sig.fullName} • {sig.title}
                  </p>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 inline-block">
                    Assigned: {assignedAcc ? assignedAcc.name : 'All Accounts'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Form Editor */}
        {activeSig && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Signature Details
            </h3>

            <div>
              <label className="font-semibold text-slate-500">Preset Label:</label>
              <input
                type="text"
                value={activeSig.name}
                onChange={(e) => onUpdateSignature(activeSig.id, { name: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-500">Full Name:</label>
                <input
                  type="text"
                  value={activeSig.fullName}
                  onChange={(e) => onUpdateSignature(activeSig.id, { fullName: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500">Job Title:</label>
                <input
                  type="text"
                  value={activeSig.title}
                  onChange={(e) => onUpdateSignature(activeSig.id, { title: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-500">Company:</label>
                <input
                  type="text"
                  value={activeSig.company}
                  onChange={(e) => onUpdateSignature(activeSig.id, { company: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500">Direct Phone:</label>
                <input
                  type="text"
                  value={activeSig.phone}
                  onChange={(e) => onUpdateSignature(activeSig.id, { phone: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-500">Meeting Booking Link:</label>
              <input
                type="url"
                value={activeSig.calendlyUrl || ''}
                onChange={(e) => onUpdateSignature(activeSig.id, { calendlyUrl: e.target.value })}
                placeholder="https://calendly.com/your-business/discovery"
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-500">Default Assigned Account:</label>
              <select
                value={activeSig.assignedAccountId || 'all'}
                onChange={(e) => onUpdateSignature(activeSig.id, { assignedAccountId: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">Apply to All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-500">Legal Disclaimer / Notice:</label>
              <textarea
                rows={2}
                value={activeSig.disclaimer}
                onChange={(e) => onUpdateSignature(activeSig.id, { disclaimer: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        )}

        {/* Right Column: Live Signature Preview */}
        {activeSig && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Outgoing Email Preview
            </p>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <p className="text-xs text-slate-400 italic">
                ...I look forward to finalizing our commercial deliverables.
              </p>

              <div
                className="pt-3 border-t-2 space-y-2"
                style={{ borderColor: activeSig.brandColor }}
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeSig.fullName}
                  </h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {activeSig.title} • {activeSig.company}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{activeSig.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-slate-400" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {activeSig.website}
                    </span>
                  </div>
                  {activeSig.calendlyUrl && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400 font-semibold underline">
                        Schedule a Strategy Consultation
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-normal">
                  {activeSig.disclaimer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
