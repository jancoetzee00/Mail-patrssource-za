import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  Search,
  Send,
  Copy,
  Check,
  Edit3,
  Trash2,
  Sparkles,
  Tag,
  Clock,
  Layers,
  X,
  Variable,
  BookOpen,
} from 'lucide-react';
import { EmailTemplate, TemplateCategory } from '../types';

interface TemplatesViewProps {
  templates: EmailTemplate[];
  onSelectUseTemplate: (template: EmailTemplate) => void;
  onAddTemplate: (newTemplate: Omit<EmailTemplate, 'id' | 'usageCount' | 'lastUsed'>) => void;
  onUpdateTemplate: (id: string, updated: Partial<EmailTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
}

const CATEGORIES: { id: TemplateCategory | 'All'; label: string; color: string }[] = [
  { id: 'All', label: 'All Boilerplates', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { id: 'Sales', label: 'Sales Outreach', color: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' },
  { id: 'Follow-up', label: 'Follow-up', color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' },
  { id: 'Onboarding', label: 'Onboarding', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  { id: 'Billing', label: 'Billing & Terms', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
  { id: 'Support', label: 'Support SLA', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
  { id: 'General', label: 'General / Meeting', color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
];

const COMMON_VARIABLES = [
  { token: '{{client_name}}', label: 'Client Name' },
  { token: '{{company}}', label: 'Company' },
  { token: '{{your_name}}', label: 'Your Name' },
  { token: '{{deal_value}}', label: 'Deal Value' },
  { token: '{{meeting_time}}', label: 'Meeting Time' },
  { token: '{{calendly_link}}', label: 'Booking Link' },
];

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onSelectUseTemplate,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    category: TemplateCategory;
    subject: string;
    body: string;
  }>({
    title: '',
    category: 'Sales',
    subject: '',
    body: '',
  });

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedCategory !== 'All' && tpl.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tpl.title.toLowerCase().includes(q);
      const matchSubject = tpl.subject.toLowerCase().includes(q);
      const matchBody = tpl.body.toLowerCase().includes(q);
      return matchTitle || matchSubject || matchBody;
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      category: 'Sales',
      subject: '',
      body: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setFormData({
      title: tpl.title,
      category: tpl.category,
      subject: tpl.subject,
      body: tpl.body,
    });
    setIsModalOpen(true);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, ''))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) return;

    const foundVars = extractVariables(`${formData.subject} ${formData.body}`);

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, {
        title: formData.title,
        category: formData.category,
        subject: formData.subject,
        body: formData.body,
        variables: foundVars,
      });
    } else {
      onAddTemplate({
        title: formData.title,
        category: formData.category,
        subject: formData.subject || 'Client Communication',
        body: formData.body,
        variables: foundVars,
      });
    }

    setIsModalOpen(false);
  };

  const handleCopyBody = (tpl: EmailTemplate) => {
    navigator.clipboard.writeText(`${tpl.subject}\n\n${tpl.body}`);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertVariable = (token: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body ? `${prev.body} ${token}` : token,
    }));
  };

  const handleAiDraftTemplate = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSubject: formData.title || `Client Template: ${formData.category}`,
          emailBody: `Draft an executive, professional email boilerplate for online business communication in category "${formData.category}". Include dynamic tokens such as {{client_name}}, {{company}}, and {{your_name}}. Keep it concise, high-conversion, and respectful.`,
          sender: 'client@company.com',
          tone: 'professional',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setFormData((prev) => ({
            ...prev,
            subject: prev.subject || `${formData.category}: Update regarding {{company}}`,
            body: data.reply,
          }));
        }
      }
    } catch (err) {
      // Fallback boilerplate
      setFormData((prev) => ({
        ...prev,
        subject: prev.subject || `Partnership Discussion: {{company}}`,
        body: `Hi {{client_name}},\n\nThank you for connecting with our team. Following our recent correspondence, I wanted to provide this update regarding our collaboration with {{company}}.\n\nPlease let me know if you have any questions.\n\nBest regards,\n{{your_name}}`,
      }));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const highlightTokens = (text: string) => {
    const parts = text.split(/(\{\{[a-zA-Z0-9_-]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold border border-blue-200 dark:border-blue-800"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      id="email-templates-view-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto text-slate-800 dark:text-slate-100"
    >
      {/* Top Banner Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-blue-600" />
              Reusable Email Templates &amp; Boilerplate
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standardize client correspondence, outreach cadences, and proposal boilerplate with dynamic variables
            </p>
          </div>

          <button
            id="create-email-template-btn"
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>

        {/* Category Filter Pills & Search Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or variables..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-5 max-w-7xl">
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500">
              <FileCode2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No templates found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria or category filter.'
                : 'Get started by creating your first reusable email boilerplate to speed up daily communications.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                id={`template-card-${tpl.id}`}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                {/* Top: Category, Title & Actions */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {tpl.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Used {tpl.usageCount} times
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyBody(tpl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy boilerplate to clipboard"
                      >
                        {copiedId === tpl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tpl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit template"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tpl.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 font-mono line-clamp-1">
                    Subject: {tpl.subject}
                  </p>
                </div>

                {/* Body snippet preview */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans line-clamp-4 whitespace-pre-line">
                  {highlightTokens(tpl.body)}
                </div>

                {/* Dynamic Variables Chips & Use Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Variable className="w-3 h-3" />
                      Tokens:
                    </span>
                    {tpl.variables.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">None</span>
                    ) : (
                      tpl.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          &#123;&#123;{v}&#125;&#125;
                        </span>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectUseTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Use in Compose</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div
          id="template-editor-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="template-editor-modal-window"
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingTemplate ? 'Edit Boilerplate Template' : 'Create New Reusable Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Template Name / Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Enterprise Discovery Call Pitch"
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Category:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as TemplateCategory })
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Billing">Billing</option>
                    <option value="Support">Support</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Default Email Subject:
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Partnership Proposal for {{company}}"
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Dynamic Tokens Helper Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Variable className="w-3.5 h-3.5 text-blue-500" />
                    Insert Dynamic Tokens (click to add):
                  </label>

                  <button
                    type="button"
                    onClick={handleAiDraftTemplate}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingAi ? 'Drafting with Gemini...' : 'Draft with AI'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {COMMON_VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => handleInsertVariable(v.token)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      title={`Insert ${v.label}`}
                    >
                      + {v.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Textarea */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Boilerplate Message Body:
                </label>
                <textarea
                  rows={8}
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Hi {{client_name}},&#10;&#10;Following up on our conversation..."
                  className="w-full p-3 font-sans text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
