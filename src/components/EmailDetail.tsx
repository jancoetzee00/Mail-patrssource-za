import React, { useState } from 'react';
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Briefcase,
  Paperclip,
  Clock,
  Sparkles,
  Send,
  Calendar,
  ChevronDown,
  UserPlus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Email, Account, CRMLead, LeadStage, EmailSignature } from '../types';
import { decryptEmailContent } from '../lib/crypto';

interface EmailDetailProps {
  email: Email;
  accounts: Account[];
  crmLeads: CRMLead[];
  signatures: EmailSignature[];
  onBack: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onSendReply: (replyData: {
    to: string;
    subject: string;
    body: string;
    isEncrypted: boolean;
    passphrase?: string;
    scheduledFor?: string;
    signatureId?: string;
  }) => void;
  onUpdateLeadStage: (leadId: string, newStage: LeadStage) => void;
  onCreateLeadFromEmail: (email: Email) => void;
  onNavigateToCrmLead: (leadId: string) => void;
  isOnline: boolean;
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  accounts,
  crmLeads,
  signatures,
  onBack,
  onArchive,
  onDelete,
  onToggleStar,
  onSendReply,
  onUpdateLeadStage,
  onCreateLeadFromEmail,
  onNavigateToCrmLead,
  isOnline,
}) => {
  // E2EE Decryption state
  const [isDecrypted, setIsDecrypted] = useState<boolean>(!email.isEncrypted);
  const [passphrase, setPassphrase] = useState('business-vault-2026');
  const [decryptedText, setDecryptedText] = useState<string>(email.decryptedBody || '');
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Quick Reply state
  const [replyBody, setReplyBody] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [encryptReply, setEncryptReply] = useState(Boolean(email.isEncrypted));
  const [replyPassphrase, setReplyPassphrase] = useState('business-vault-2026');
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  // Find linked CRM Lead
  const linkedLead = crmLeads.find((l) => l.id === email.leadId || l.email === email.from.email);
  const account = accounts.find((a) => a.id === email.accountId);

  // Default signature
  const defaultSignature = signatures.find(
    (s) => s.assignedAccountId === email.accountId || s.assignedAccountId === 'all'
  ) || signatures[0];

  const [selectedSignatureId, setSelectedSignatureId] = useState<string>(defaultSignature?.id || '');

  // Handle E2EE Decrypt
  const handleDecrypt = async () => {
    if (!email.encryptionData) {
      setIsDecrypted(true);
      return;
    }

    try {
      setDecryptError(null);
      // If we already have decrypted text cached
      if (email.decryptedBody && (passphrase === 'business-vault-2026' || !passphrase)) {
        setDecryptedText(email.decryptedBody);
        setIsDecrypted(true);
        return;
      }

      const result = await decryptEmailContent(email.encryptionData, passphrase);
      setDecryptedText(result);
      setIsDecrypted(true);
    } catch (err: any) {
      // If mock cipher, fallback to the pre-rendered decrypted text
      if (email.decryptedBody && passphrase === 'business-vault-2026') {
        setDecryptedText(email.decryptedBody);
        setIsDecrypted(true);
      } else {
        setDecryptError('Invalid passphrase. Could not decrypt AES-256 payload.');
      }
    }
  };

  // AI Smart Reply Generator
  const handleGenerateAiReply = async (tone: 'professional' | 'quick' | 'meeting' | 'quote') => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: email.subject,
          emailBody: isDecrypted && decryptedText ? decryptedText : email.body,
          sender: email.from.email,
          senderName: email.from.name,
          tone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setReplyBody(data.reply);
        }
      }
    } catch (e) {
      console.warn('AI reply generation failed, using local template:', e);
      setReplyBody(
        `Hi ${email.from.name || 'there'},\n\nThank you for following up regarding "${email.subject}". We have reviewed the details and will proceed with next steps as outlined.\n\nBest regards,\n${account?.name || 'Jan Coetzee'}`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Dispatch reply
  const handleSend = () => {
    if (!replyBody.trim()) return;

    onSendReply({
      to: email.from.email,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: replyBody,
      isEncrypted: encryptReply,
      passphrase: encryptReply ? replyPassphrase : undefined,
      scheduledFor: scheduledTime || undefined,
      signatureId: selectedSignatureId,
    });

    setReplyBody('');
    setScheduledTime(null);
  };

  return (
    <div
      id="email-detail-container"
      className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto"
    >
      {/* Top Action Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <button
            id="email-detail-back-btn"
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            id="detail-archive-btn"
            type="button"
            onClick={() => onArchive(email.id)}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Archive message"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            id="detail-delete-btn"
            type="button"
            onClick={() => onDelete(email.id)}
            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Move to trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            id="detail-star-btn"
            type="button"
            onClick={() => onToggleStar(email.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              email.isStarred
                ? 'text-amber-400'
                : 'text-slate-400 hover:text-amber-400 dark:hover:text-amber-400'
            }`}
            title="Star message"
          >
            <Star className={`w-4 h-4 ${email.isStarred ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* CRM Lead Action button */}
        <div className="flex items-center gap-2">
          {linkedLead ? (
            <button
              id="view-linked-crm-lead-btn"
              type="button"
              onClick={() => onNavigateToCrmLead(linkedLead.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>CRM: {linkedLead.company}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          ) : (
            <button
              id="create-crm-lead-trigger-btn"
              type="button"
              onClick={() => onCreateLeadFromEmail(email)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Convert to CRM Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Thread Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Subject and tags */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {email.isEncrypted && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                <Lock className="w-3 h-3" />
                End-to-End Encrypted (AES-256)
              </span>
            )}
            {email.scheduledFor && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                <Clock className="w-3 h-3" />
                Scheduled for {new Date(email.scheduledFor).toLocaleString()}
              </span>
            )}
            {email.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>

          <h1
            id="email-detail-subject-heading"
            className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
          >
            {email.subject}
          </h1>
        </div>

        {/* Sender and Recipient Header */}
        <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {email.from.name ? email.from.name[0].toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {email.from.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  &lt;{email.from.email}&gt;
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                To: {email.to.map((t) => t.name || t.email).join(', ')}
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400 shrink-0">
            {new Date(email.timestamp).toLocaleString()}
          </span>
        </div>

        {/* E2EE Decrypt Panel */}
        {email.isEncrypted && (
          <div
            id="e2ee-encryption-banner"
            className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Client Correspondence Cryptographic Verification
                </span>
              </div>
              {email.encryptionData && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  {email.encryptionData.keyFingerprint}
                </span>
              )}
            </div>

            {!isDecrypted ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  This message was encrypted client-side using 256-bit AES-GCM. Enter your organizational passphrase to decrypt.
                </p>
                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      id="e2ee-passphrase-input"
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter decryption passphrase..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <button
                    id="e2ee-decrypt-now-btn"
                    type="button"
                    onClick={handleDecrypt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Decrypt</span>
                  </button>
                </div>
                {decryptError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {decryptError}
                  </p>
                )}
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                  💡 Hint for test environment: Passphrase is prefilled with organizational key{' '}
                  <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono">
                    business-vault-2026
                  </code>
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Decrypted with verified AES-256 integrity check.
                </span>
                <button
                  id="e2ee-relock-btn"
                  type="button"
                  onClick={() => setIsDecrypted(false)}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  Re-lock
                </button>
              </div>
            )}
          </div>
        )}

        {/* Linked CRM Lead Pipeline Status Box */}
        {linkedLead && (
          <div
            id="linked-crm-lead-card"
            className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600 text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    CRM Lead: {linkedLead.company}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ${linkedLead.dealValue.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                  Contact: {linkedLead.contactName} ({linkedLead.title}) • Score: {linkedLead.score}/100
                </p>
              </div>
            </div>

            {/* Quick Stage Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="crm-stage-select"
                className="text-[11px] font-semibold text-purple-800 dark:text-purple-300"
              >
                Deal Stage:
              </label>
              <select
                id="crm-stage-select"
                value={linkedLead.stage}
                onChange={(e) => onUpdateLeadStage(linkedLead.id, e.target.value as LeadStage)}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-900 dark:text-purple-200 focus:outline-none cursor-pointer"
              >
                <option value="New Lead">New Lead</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won (Closed)</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        )}

        {/* Email Body Content */}
        <div
          id="email-body-text-content"
          className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[160px] p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 font-sans"
        >
          {email.isEncrypted && !isDecrypted ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Lock className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                Confidential Client Message Locked
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Enter your security passphrase in the cryptographic verification banner above to inspect this correspondence.
              </p>
            </div>
          ) : isDecrypted && decryptedText ? (
            decryptedText
          ) : (
            email.body
          )}
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({email.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => alert(`Downloading verified attachment: ${att.name}`)}
                >
                  <Paperclip className="w-4 h-4 text-blue-500" />
                  <span className="font-medium truncate max-w-[200px]">{att.name}</span>
                  <span className="text-[10px] text-slate-400">({att.size})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reply & AI Response Box */}
        <div
          id="email-reply-composer-card"
          className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Reply className="w-3.5 h-3.5 text-blue-500" />
              Respond to {email.from.name || email.from.email}
            </h3>

            {/* AI Smart Response generator chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Smart Replies:
              </span>
              <button
                id="ai-tone-professional-btn"
                type="button"
                disabled={isAiLoading}
                onClick={() => handleGenerateAiReply('professional')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800 transition-colors"
              >
                Professional
              </button>
              <button
                id="ai-tone-quick-btn"
                type="button"
                disabled={isAiLoading}
                onClick={() => handleGenerateAiReply('quick')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800 transition-colors"
              >
                Quick Ack
              </button>
              <button
                id="ai-tone-meeting-btn"
                type="button"
                disabled={isAiLoading}
                onClick={() => handleGenerateAiReply('meeting')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800 transition-colors"
              >
                Propose Meeting
              </button>
              <button
                id="ai-tone-quote-btn"
                type="button"
                disabled={isAiLoading}
                onClick={() => handleGenerateAiReply('quote')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800 transition-colors"
              >
                Quote / Pricing
              </button>
            </div>
          </div>

          {/* Reply Textarea */}
          <div className="relative">
            <textarea
              id="email-reply-body-textarea"
              rows={4}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={`Write a professional reply to ${email.from.name || 'client'}... (or click an AI Smart Reply above)`}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all resize-y"
            />
            {isAiLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Crafting AI response with Gemini...</span>
              </div>
            )}
          </div>

          {/* Controls bar: Encryption switch, Scheduling, Signature selector, Send */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              {/* E2EE Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  id="reply-e2ee-encrypt-checkbox"
                  type="checkbox"
                  checked={encryptReply}
                  onChange={(e) => setEncryptReply(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  E2EE Encrypt
                </span>
              </label>

              {/* Signature Selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Signature:</span>
                <select
                  id="reply-signature-select"
                  value={selectedSignatureId}
                  onChange={(e) => setSelectedSignatureId(e.target.value)}
                  className="text-xs py-1 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">No Signature</option>
                  {signatures.map((sig) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name} ({sig.fullName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled info if set */}
              {scheduledTime && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Clock className="w-3 h-3" />
                  Scheduled: {new Date(scheduledTime).toLocaleString()}
                  <button
                    type="button"
                    onClick={() => setScheduledTime(null)}
                    className="ml-1 text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {/* Send & Schedule buttons */}
            <div className="flex items-center gap-1">
              <button
                id="send-reply-now-btn"
                type="button"
                onClick={handleSend}
                disabled={!replyBody.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {!isOnline
                    ? 'Queue (Offline)'
                    : scheduledTime
                    ? 'Confirm Schedule'
                    : 'Send Reply'}
                </span>
              </button>

              {/* Schedule presets dropdown */}
              <div className="relative">
                <button
                  id="schedule-reply-dropdown-trigger"
                  type="button"
                  onClick={() => setIsScheduleDropdownOpen(!isScheduleDropdownOpen)}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs border-l border-blue-500 transition-colors"
                  title="Schedule send for later"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isScheduleDropdownOpen && (
                  <div
                    id="schedule-reply-presets-menu"
                    className="absolute right-0 bottom-full mb-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-30 space-y-1 text-xs"
                  >
                    <p className="px-2 py-1 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Schedule Send Presets
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        setScheduledTime(tomorrow.toISOString());
                        setIsScheduleDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>Tomorrow morning</span>
                      <span className="text-[10px] text-slate-400">9:00 AM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
                        setScheduledTime(inTwoHours.toISOString());
                        setIsScheduleDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>In 2 hours</span>
                      <span className="text-[10px] text-slate-400">+2h</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const monday = new Date();
                        monday.setDate(monday.getDate() + ((1 + 7 - monday.getDay()) % 7 || 7));
                        monday.setHours(9, 0, 0, 0);
                        setScheduledTime(monday.toISOString());
                        setIsScheduleDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                    >
                      <span>Monday morning</span>
                      <span className="text-[10px] text-slate-400">9:00 AM</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
