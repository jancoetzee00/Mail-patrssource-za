import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Clock,
  Lock,
  Sparkles,
  Paperclip,
  Check,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  FileText,
  Calendar,
  FileCode2,
} from 'lucide-react';
import { Account, EmailSignature, Email, EmailTemplate } from '../types';
import { encryptEmailContent, computeFingerprint } from '../lib/crypto';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  signatures: EmailSignature[];
  templates?: EmailTemplate[];
  onSendEmail: (emailData: {
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
  }) => void;
  isOnline: boolean;
  prefilledEmail?: {
    to?: string;
    subject?: string;
    body?: string;
    accountId?: string;
    leadId?: string;
  };
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  signatures,
  templates = [],
  onSendEmail,
  isOnline,
  prefilledEmail,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState(
    prefilledEmail?.accountId || accounts[0]?.id || ''
  );
  const [to, setTo] = useState(prefilledEmail?.to || '');
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(prefilledEmail?.subject || '');
  const [body, setBody] = useState(prefilledEmail?.body || '');
  
  // Encryption
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [passphrase, setPassphrase] = useState('business-vault-2026');
  const [keyFingerprint, setKeyFingerprint] = useState('');

  // Scheduling
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [customScheduleInput, setCustomScheduleInput] = useState('');

  // Signatures
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');

  // AI Assistant
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  // Email Templates
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string }[]>([]);

  // Apply template with dynamic token interpolation
  const handleApplyTemplate = (tpl: EmailTemplate) => {
    const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const clientName = to
      ? to.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Client';
    const company = to && to.includes('@')
      ? to.split('@')[1].split('.')[0].toUpperCase()
      : 'Company';
    const yourName = currentAccount ? currentAccount.name.split(' (')[0] : 'Jan Coetzee';

    const interpolate = (text: string) => {
      return text
        .replaceAll('{{client_name}}', clientName)
        .replaceAll('{{company}}', company)
        .replaceAll('{{your_name}}', yourName)
        .replaceAll('{{deal_value}}', 'R 25,000')
        .replaceAll('{{part_reference}}', 'PS-PUMP-4022')
        .replaceAll('{{quantity}}', '2 Units')
        .replaceAll('{{quote_amount}}', 'R 4,850.00')
        .replaceAll('{{lead_time}}', '2-3 Business Days')
        .replaceAll('{{order_reference}}', 'ORD-8821')
        .replaceAll('{{courier_name}}', 'The Courier Guy')
        .replaceAll('{{waybill_number}}', 'TCG-ZA-992014')
        .replaceAll('{{calendly_link}}', 'https://cal.com/partssource-za')
        .replaceAll('{{meeting_time}}', 'Thursday at 10:00 AM');
    };

    setSubject(interpolate(tpl.subject));
    setBody(interpolate(tpl.body));
    setShowTemplateSelector(false);
  };

  // Update fingerprint when passphrase changes
  useEffect(() => {
    if (isEncrypted && passphrase) {
      computeFingerprint(passphrase).then(setKeyFingerprint).catch(() => {});
    }
  }, [isEncrypted, passphrase]);

  // Set default signature when account changes
  useEffect(() => {
    const acc = accounts.find((a) => a.id === selectedAccountId);
    const sig = signatures.find(
      (s) => s.assignedAccountId === selectedAccountId || s.assignedAccountId === 'all'
    );
    if (sig) {
      setSelectedSignatureId(sig.id);
    }
  }, [selectedAccountId, signatures, accounts]);

  // Reset or initialize on open
  useEffect(() => {
    if (prefilledEmail) {
      if (prefilledEmail.to) setTo(prefilledEmail.to);
      if (prefilledEmail.subject) setSubject(prefilledEmail.subject);
      if (prefilledEmail.body) setBody(prefilledEmail.body);
      if (prefilledEmail.accountId) setSelectedAccountId(prefilledEmail.accountId);
    }
  }, [prefilledEmail]);

  if (!isOpen) return null;

  const currentSignature = signatures.find((s) => s.id === selectedSignatureId);

  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiDrafting(true);
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: subject || 'Business Collaboration',
          emailBody: aiPrompt,
          sender: to,
          tone: 'professional',
          intent: aiPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setBody(data.reply);
          setShowAiPrompt(false);
          setAiPrompt('');
        }
      }
    } catch (err) {
      console.warn('AI Draft error, using fallback template');
      setBody(
        `Dear Client,\n\nI am writing to share an update regarding our upcoming business milestones. We look forward to coordinating with your team on key deliverables.\n\nPlease let me know your availability for a brief consultation.\n\nWarm regards,\nJan Coetzee`
      );
      setShowAiPrompt(false);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleAddSampleAttachment = () => {
    const sample = {
      name: `Contract_Proposal_${Math.floor(Math.random() * 900 + 100)}.pdf`,
      size: '1.2 MB',
      type: 'application/pdf',
    };
    setAttachments([...attachments, sample]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;

    let fullBody = body;
    if (currentSignature) {
      fullBody += `\n\n--\n${currentSignature.fullName}\n${currentSignature.title} | ${currentSignature.company}\nPhone: ${currentSignature.phone}\n${currentSignature.website}\n${currentSignature.disclaimer}`;
    }

    onSendEmail({
      accountId: selectedAccountId,
      to,
      cc: showCc && cc ? cc : undefined,
      subject,
      body: fullBody,
      isEncrypted,
      passphrase: isEncrypted ? passphrase : undefined,
      scheduledFor: scheduledTime || undefined,
      attachments,
    });

    onClose();
  };

  return (
    <div
      id="compose-email-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="compose-email-modal-window"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Compose Business Correspondence
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Offline Mode (Will Queue)
              </span>
            )}
            <button
              id="close-compose-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Sender Account Switcher */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="compose-account-select"
              className="w-16 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              From:
            </label>
            <div className="flex-1 relative">
              <select
                id="compose-account-select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} &lt;{acc.email}&gt; ({acc.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recipient To */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="compose-to-input"
              className="w-16 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              To:
            </label>
            <div className="flex-1 flex items-center gap-2">
              <input
                id="compose-to-input"
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client.executive@company.com"
                className="flex-1 text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-xs font-semibold text-slate-400 hover:text-blue-600 px-2"
                >
                  Cc
                </button>
              )}
            </div>
          </div>

          {/* Recipient CC */}
          {showCc && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="compose-cc-input"
                className="w-16 text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Cc:
              </label>
              <div className="flex-1">
                <input
                  id="compose-cc-input"
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="legal@company.com, partners@company.com"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Subject Line */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="compose-subject-input"
              className="w-16 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Subject:
            </label>
            <div className="flex-1">
              <input
                id="compose-subject-input"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contract Proposal & Executive Strategy Overview"
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Drafting & Template Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 relative">
            <div className="flex items-center gap-2">
              <button
                id="toggle-ai-draft-prompt-btn"
                type="button"
                onClick={() => setShowAiPrompt(!showAiPrompt)}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Draft with Gemini AI</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              {/* Quick Template Picker */}
              <div className="relative">
                <button
                  id="compose-insert-template-btn"
                  type="button"
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Insert Template</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showTemplateSelector ? 'rotate-180' : ''}`}
                  />
                </button>

                {showTemplateSelector && (
                  <div
                    id="template-quick-picker-dropdown"
                    className="absolute left-0 top-full mt-1.5 w-72 sm:w-88 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in duration-100"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                        Select Boilerplate Template
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                      {templates.length > 0 ? (
                        templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl)}
                            className="w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 border border-transparent hover:border-blue-100 dark:hover:border-slate-700 transition-all group"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {tpl.title}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                {tpl.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                              {tpl.subject}
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-3">No templates saved yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSampleAttachment}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Proposal PDF</span>
            </button>
          </div>

          {/* AI Prompt Input Bar */}
          {showAiPrompt && (
            <div
              id="ai-draft-prompt-container"
              className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  id="ai-draft-instruction-input"
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write a friendly contract follow-up asking for approval on Q3 SLA terms..."
                  className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <button
                  id="submit-ai-draft-btn"
                  type="button"
                  disabled={isAiDrafting || !aiPrompt.trim()}
                  onClick={handleAiDraft}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiDrafting ? 'Generating...' : 'Generate'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Email Body Editor */}
          <div className="space-y-1">
            <textarea
              id="compose-email-body-textarea"
              rows={8}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
            />
          </div>

          {/* Attachments chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  <Paperclip className="w-3 h-3 text-blue-500" />
                  <span>{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* E2EE Security Settings Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="compose-e2ee-toggle-checkbox"
                  type="checkbox"
                  checked={isEncrypted}
                  onChange={(e) => setIsEncrypted(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Client End-to-End Encryption (AES-256-GCM)
                </span>
              </label>
              {isEncrypted && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {keyFingerprint || 'Computing key...'}
                </span>
              )}
            </div>

            {isEncrypted && (
              <div className="pt-2 space-y-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This correspondence will be encrypted with Web Crypto API AES-GCM before transmission. The recipient must use the shared secret key to inspect content.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Passphrase:</span>
                  <input
                    id="compose-passphrase-input"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter security passphrase"
                    className="flex-1 text-xs py-1 px-2.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Signature Selection */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Attached Signature:
            </span>
            <select
              id="compose-signature-select"
              value={selectedSignatureId}
              onChange={(e) => setSelectedSignatureId(e.target.value)}
              className="text-xs py-1 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">None (Plain text)</option>
              {signatures.map((sig) => (
                <option key={sig.id} value={sig.id}>
                  {sig.name} ({sig.fullName})
                </option>
              ))}
            </select>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* Scheduling controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  id="compose-schedule-btn"
                  type="button"
                  onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    scheduledTime
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {scheduledTime
                      ? `Scheduled: ${new Date(scheduledTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })} at ${new Date(scheduledTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Schedule Send'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Scheduling Presets Menu */}
                {isScheduleOpen && (
                  <div
                    id="compose-schedule-presets-dropdown"
                    className="absolute left-0 bottom-full mb-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1 text-xs"
                  >
                    <p className="px-2 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Send Later Options
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(8, 0, 0, 0);
                        setScheduledTime(tomorrow.toISOString());
                        setIsScheduleOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span>Tomorrow morning</span>
                      <span className="text-[10px] text-slate-400">8:00 AM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(14, 0, 0, 0);
                        setScheduledTime(tomorrow.toISOString());
                        setIsScheduleOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span>Tomorrow afternoon</span>
                      <span className="text-[10px] text-slate-400">2:00 PM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const monday = new Date();
                        monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7 || 7));
                        monday.setHours(9, 0, 0, 0);
                        setScheduledTime(monday.toISOString());
                        setIsScheduleOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <span>Monday morning</span>
                      <span className="text-[10px] text-slate-400">9:00 AM</span>
                    </button>

                    {scheduledTime && (
                      <button
                        type="button"
                        onClick={() => {
                          setScheduledTime(null);
                          setIsScheduleOpen(false);
                        }}
                        className="w-full text-left px-2 py-1 text-red-600 dark:text-red-400 hover:underline text-[11px]"
                      >
                        Clear Schedule (Send Immediately)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-2">
              <button
                id="cancel-compose-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Discard
              </button>

              <button
                id="submit-send-email-btn"
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {!isOnline
                    ? 'Queue in Offline Outbox'
                    : scheduledTime
                    ? 'Schedule Message'
                    : 'Send Immediately'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
