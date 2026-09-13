import React, { useState } from 'react';
import {
  Bot,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Send,
  Calendar,
  AlertCircle,
  FileText,
  Trash2,
  X,
  MessageSquare,
} from 'lucide-react';
import { AutoResponseRule, Account } from '../types';

interface AutoResponsesViewProps {
  rules: AutoResponseRule[];
  accounts: Account[];
  onToggleRule: (id: string) => void;
  onAddRule: (rule: Omit<AutoResponseRule, 'id' | 'executionCount'>) => void;
  onDeleteRule: (id: string) => void;
  onTriggerTestExecution: (ruleId: string) => void;
}

export const AutoResponsesView: React.FC<AutoResponsesViewProps> = ({
  rules,
  accounts,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  onTriggerTestExecution,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testModalRule, setTestModalRule] = useState<AutoResponseRule | null>(null);
  const [simulatedIncomingSender, setSimulatedIncomingSender] = useState('prospective.client@enterprise.com');
  const [simulatedSubject, setSimulatedSubject] = useState('Enterprise Pricing & Demo Request');
  const [testResultOutput, setTestResultOutput] = useState<string | null>(null);

  // New Rule Form
  const [formData, setFormData] = useState({
    title: '',
    triggerType: 'keyword' as AutoResponseRule['triggerType'],
    keyword: '',
    targetAccount: 'all',
    responseSubject: '',
    responseTemplate: '',
    businessHoursOnly: false,
    afterHoursOnly: false,
  });

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.responseTemplate) return;

    onAddRule({
      title: formData.title,
      triggerType: formData.triggerType,
      conditions: {
        keyword: formData.keyword || undefined,
        businessHoursOnly: formData.businessHoursOnly,
        afterHoursOnly: formData.afterHoursOnly,
        targetAccountIds: formData.targetAccount === 'all' ? undefined : [formData.targetAccount],
      },
      responseSubject: formData.responseSubject || 'Automated Response: Thank you for your message',
      responseTemplate: formData.responseTemplate,
      isEnabled: true,
      lastTriggered: undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleGenerateAiTemplate = async () => {
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: formData.title || 'Client Inquiry Response Template',
          emailBody: `Generate an automated out-of-office or lead inquiry template for ${formData.triggerType}. Include {{sender_name}} placeholder.`,
          sender: 'client@company.com',
          tone: 'professional',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setFormData((prev) => ({
            ...prev,
            responseTemplate: data.reply,
            responseSubject: `Automated: Re: {{email_subject}}`,
          }));
        }
      }
    } catch (e) {
      setFormData((prev) => ({
        ...prev,
        responseTemplate: `Hi {{sender_name}},\n\nThank you for reaching out to Partssource-za. We have received your inquiry regarding "{{email_subject}}" and will follow up with pricing and availability promptly.\n\nBest regards,\nPartssource-za Team`,
      }));
    }
  };

  const runTestSimulation = (rule: AutoResponseRule) => {
    const populated = rule.responseTemplate
      .replace(/{{sender_name}}/g, simulatedIncomingSender.split('@')[0])
      .replace(/{{email_subject}}/g, simulatedSubject);

    setTestResultOutput(populated);
    onTriggerTestExecution(rule.id);
  };

  return (
    <div
      id="auto-responses-view-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto text-slate-800 dark:text-slate-100"
    >
      {/* Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              Automated Client Response Rules
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure intelligent auto-replies, out-of-office vacation responders, and SLA dispatch rules
            </p>
          </div>

          <button
            id="create-new-auto-rule-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Auto-Response Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="p-5 space-y-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              id={`auto-rule-card-${rule.id}`}
              className={`p-4 rounded-2xl border transition-all ${
                rule.isEnabled
                  ? 'bg-white dark:bg-slate-900 border-purple-200/80 dark:border-purple-800/60 shadow-xs'
                  : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      rule.isEnabled
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {rule.title}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Trigger: {rule.triggerType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Enable/Disable switch */}
                <button
                  id={`toggle-rule-${rule.id}`}
                  type="button"
                  onClick={() => onToggleRule(rule.id)}
                  className="text-slate-400 hover:text-purple-600"
                  title={rule.isEnabled ? 'Active (Click to pause)' : 'Paused (Click to enable)'}
                >
                  {rule.isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Conditions badge */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs space-y-1 mb-3">
                {rule.conditions.keyword && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-400">Keywords:</span>{' '}
                    <code className="text-purple-600 dark:text-purple-400 font-mono">
                      {rule.conditions.keyword}
                    </code>
                  </p>
                )}
                {rule.conditions.afterHoursOnly && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    ⏰ Only triggers outside business hours (8PM - 8AM)
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  Executed {rule.executionCount} times • Last active:{' '}
                  {rule.lastTriggered
                    ? new Date(rule.lastTriggered).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>

              {/* Template preview */}
              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 font-mono">
                {rule.responseTemplate}
              </div>

              {/* Action bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTestModalRule(rule);
                    setTestResultOutput(null);
                  }}
                  className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Play className="w-3 h-3" />
                  <span>Test Rule Simulator</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulator Modal */}
      {testModalRule && (
        <div
          id="rule-test-simulator-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-600" />
                Live Rule Engine Simulator: {testModalRule.title}
              </h3>
              <button
                type="button"
                onClick={() => setTestModalRule(null)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500">Incoming Sender Email:</label>
                <input
                  type="email"
                  value={simulatedIncomingSender}
                  onChange={(e) => setSimulatedIncomingSender(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500">Incoming Subject:</label>
                <input
                  type="text"
                  value={simulatedSubject}
                  onChange={(e) => setSimulatedSubject(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={() => runTestSimulation(testModalRule)}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Automated Dispatch</span>
              </button>

              {testResultOutput && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Automated Response Fired Successfully:
                  </p>
                  <pre className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200 font-sans p-2 bg-white dark:bg-slate-900 rounded border border-emerald-100 dark:border-emerald-900">
                    {testResultOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Rule Modal */}
      {isAddModalOpen && (
        <div
          id="create-rule-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                New Automated Response Rule
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Rule Name:
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vacation Responder / VIP Lead Dispatch"
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Trigger Type:
                  </label>
                  <select
                    value={formData.triggerType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        triggerType: e.target.value as AutoResponseRule['triggerType'],
                      })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="new_lead">New Lead Inbound</option>
                    <option value="vacation">Vacation / Out of Office</option>
                    <option value="after_hours">After-Hours Support</option>
                    <option value="keyword">Keyword Matching</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Matching Keyword:
                  </label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    placeholder="quote, pricing, urgent"
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Response Copy Template:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiTemplate}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Draft with Gemini</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={formData.responseTemplate}
                  onChange={(e) => setFormData({ ...formData, responseTemplate: e.target.value })}
                  placeholder="Hi {{sender_name}}, thank you for your note..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supported dynamic tokens: <code>&#123;&#123;sender_name&#125;&#125;</code>,{' '}
                  <code>&#123;&#123;email_subject&#125;&#125;</code>
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold"
                >
                  Save &amp; Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
