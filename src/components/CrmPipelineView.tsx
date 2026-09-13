import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FileText,
  Search,
  X,
  Send,
} from 'lucide-react';
import { CRMLead, LeadStage, Email } from '../types';

interface CrmPipelineViewProps {
  leads: CRMLead[];
  onUpdateStage: (leadId: string, newStage: LeadStage) => void;
  onAddLead: (newLead: Omit<CRMLead, 'id' | 'linkedEmailIds'>) => void;
  onSelectEmailLead: (lead: CRMLead) => void;
}

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'New Lead', label: 'New Inquiry', color: 'bg-blue-500' },
  { id: 'Qualified', label: 'Qualified Lead', color: 'bg-indigo-500' },
  { id: 'Proposal', label: 'Proposal Sent', color: 'bg-purple-500' },
  { id: 'Negotiation', label: 'In Negotiation', color: 'bg-amber-500' },
  { id: 'Won', label: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'Lost', label: 'Closed Lost', color: 'bg-rose-500' },
];

export const CrmPipelineView: React.FC<CrmPipelineViewProps> = ({
  leads,
  onUpdateStage,
  onAddLead,
  onSelectEmailLead,
}) => {
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState('');

  // Form State for new lead
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    stage: 'New Lead' as LeadStage,
    dealValue: 15000,
    probability: 50,
    score: 75,
    assignedTo: 'Jan Coetzee',
    source: 'Direct Business Email',
    tags: 'Enterprise, Q3 Deal',
  });

  const totalPipelineValue = leads
    .filter((l) => l.stage !== 'Lost')
    .reduce((acc, curr) => acc + curr.dealValue, 0);

  const wonDealsValue = leads
    .filter((l) => l.stage === 'Won')
    .reduce((acc, curr) => acc + curr.dealValue, 0);

  const filteredLeads = leads.filter(
    (l) =>
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.email) return;

    onAddLead({
      contactName: formData.contactName || 'Lead Contact',
      email: formData.email,
      company: formData.company,
      title: formData.title || 'Decision Maker',
      phone: formData.phone || '+1 (555) 000-0000',
      stage: formData.stage,
      dealValue: Number(formData.dealValue) || 10000,
      probability: Number(formData.probability) || 50,
      score: Number(formData.score) || 75,
      tags: formData.tags.split(',').map((t) => t.trim()),
      lastContactDate: new Date().toISOString(),
      notes: ['Lead profile created in CRM pipeline.'],
      assignedTo: formData.assignedTo,
      source: formData.source,
    });

    setIsAddModalOpen(false);
  };

  const handleAddNoteToLead = () => {
    if (!newNote.trim() || !selectedLead) return;
    const updated = {
      ...selectedLead,
      notes: [...selectedLead.notes, `${new Date().toLocaleDateString()}: ${newNote}`],
    };
    setSelectedLead(updated);
    setNewNote('');
  };

  return (
    <div
      id="crm-pipeline-view-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100"
    >
      {/* Top Banner: Metrics & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              CRM Business Lead Pipeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track prospective client deals synced with incoming &amp; outgoing communications
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Pipeline</p>
              <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                ${totalPipelineValue.toLocaleString()}
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                Closed Won Revenue
              </p>
              <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                ${wonDealsValue.toLocaleString()}
              </p>
            </div>

            <button
              id="crm-add-new-lead-btn"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add CRM Lead</span>
            </button>
          </div>
        </div>

        {/* Filter / Search bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="crm-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by company, contact or email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredLeads.length} deals
          </span>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
          const stageValue = stageLeads.reduce((sum, l) => sum + l.dealValue, 0);

          return (
            <div
              key={stage.id}
              id={`kanban-column-${stage.id.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-72 shrink-0 flex flex-col max-h-full rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              {/* Stage Header */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {stage.label}
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                  ${(stageValue / 1000).toFixed(0)}k
                </span>
              </div>

              {/* Stage Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-600 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No active deals in {stage.label}
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      id={`crm-card-${lead.id}`}
                      onClick={() => setSelectedLead(lead)}
                      className="group p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
                    >
                      {/* Top: Company & Deal Value */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {lead.company}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {lead.contactName} • {lead.title}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          ${lead.dealValue.toLocaleString()}
                        </span>
                      </div>

                      {/* Lead Score & Probability */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-semibold">
                          <TrendingUp className="w-3 h-3 text-blue-500" />
                          Score: {lead.score}/100
                        </span>
                        <span>{lead.probability}% probability</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmailLead(lead);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email Lead</span>
                        </button>

                        {/* Advance stage button */}
                        {stage.id !== 'Won' && stage.id !== 'Lost' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStages: Record<LeadStage, LeadStage> = {
                                'New Lead': 'Qualified',
                                Qualified: 'Proposal',
                                Proposal: 'Negotiation',
                                Negotiation: 'Won',
                                Won: 'Won',
                                Lost: 'Lost',
                              };
                              onUpdateStage(lead.id, nextStages[lead.stage]);
                            }}
                            className="text-[10px] font-semibold text-slate-400 hover:text-emerald-600 flex items-center gap-0.5"
                            title="Advance to next pipeline stage"
                          >
                            <span>Advance</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Drawer / Inspector */}
      {selectedLead && (
        <div
          id="crm-lead-detail-drawer"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedLead.company}
              </h3>
              <p className="text-xs text-slate-500">{selectedLead.contactName}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectEmailLead(selectedLead);
                  setSelectedLead(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Email Client</span>
              </button>
            </div>

            {/* Deal Info */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Deal Value:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  ${selectedLead.dealValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stage:</span>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => {
                    const newStage = e.target.value as LeadStage;
                    onUpdateStage(selectedLead.id, newStage);
                    setSelectedLead({ ...selectedLead, stage: newStage });
                  }}
                  className="font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-0.5"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lead Score:</span>
                <span className="font-semibold text-blue-500">{selectedLead.score} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned To:</span>
                <span className="font-medium">{selectedLead.assignedTo}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Contact Data
              </p>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                  {selectedLead.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedLead.phone}</span>
              </div>
            </div>

            {/* Notes Timeline */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Activity &amp; Client Notes
              </p>
              <div className="space-y-1.5">
                {selectedLead.notes.map((n, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs"
                  >
                    {n}
                  </div>
                ))}
              </div>

              {/* Add note input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add note or client call log..."
                  className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNoteToLead}
                  disabled={!newNote.trim()}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 dark:bg-slate-700 text-white disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Lead Modal */}
      {isAddModalOpen && (
        <div
          id="add-lead-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            id="add-lead-modal-window"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Add New Enterprise Lead
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Company Name:
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Acme Global Industries"
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Contact Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Business Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@acme.com"
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Estimated Value ($):
                  </label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300">
                    Initial Stage:
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as LeadStage })}
                    className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300">Tags:</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Enterprise, Annual Contract, Urgent"
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
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
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
