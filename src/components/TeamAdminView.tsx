import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  History,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TeamMember, SecurityAuditLog, BusinessEntity, Account } from '../types';

interface TeamAdminViewProps {
  businesses: BusinessEntity[];
  activeBusinessId: string;
  onSelectBusiness: (id: string) => void;
  onAddBusiness: (business: Omit<BusinessEntity, 'id' | 'createdAt'>) => void;
  onDeleteBusiness: (businessId: string) => void;
  members: TeamMember[];
  auditLogs: SecurityAuditLog[];
  onAddMember: (member: Omit<TeamMember, 'id' | 'lastActive'>) => void;
  onUpdateMemberPermissions: (
    memberId: string,
    permissions: TeamMember['permissions'],
    role: TeamMember['role']
  ) => void;
  onDeleteMember: (memberId: string) => void;
  accounts?: Account[];
}

export const TeamAdminView: React.FC<TeamAdminViewProps> = ({
  businesses,
  activeBusinessId,
  onSelectBusiness,
  onAddBusiness,
  onDeleteBusiness,
  members,
  auditLogs,
  onAddMember,
  onUpdateMemberPermissions,
  onDeleteMember,
  accounts = [],
}) => {
  // Top-level tab inside Owner Settings: 'businesses' | 'members' | 'audit'
  const [subTab, setSubTab] = useState<'businesses' | 'members' | 'audit'>('businesses');

  // Modals state
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<BusinessEntity | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Filters & Search
  const [businessSearch, setBusinessSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('all');
  const [memberBizFilter, setMemberBizFilter] = useState<string>('all');

  // New Business Form State
  const [newBizData, setNewBizData] = useState({
    name: '',
    legalName: '',
    domain: '',
    supportEmail: '',
    industry: 'Cloud Infrastructure & Enterprise SaaS',
    tier: 'Enterprise Suite' as BusinessEntity['tier'],
    color: '#3B82F6',
    currency: 'USD ($)',
    phone: '',
    address: '',
    isPrimary: false,
  });

  // New Member Form State
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    role: 'Sales Manager' as TeamMember['role'],
    businessId: businesses[0]?.id || '',
    department: 'Commercial Revenue',
    twoFactorEnabled: true,
  });

  // Color options for businesses
  const colorOptions = [
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Crimson', value: '#EF4444' },
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Teal', value: '#14B8A6' },
  ];

  // Industry presets
  const industryOptions = [
    'Cloud Infrastructure & Enterprise SaaS',
    'Digital Media & E-Commerce',
    'Cybersecurity & Identity Verification',
    'Financial Services & FinTech',
    'Logistics & Global Supply Chain',
    'Healthcare & BioTech Solutions',
    'Consulting & Professional Services',
    'Other / Commercial Enterprise',
  ];

  // Filtered Businesses
  const filteredBusinesses = businesses.filter((b) => {
    const q = businessSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.legalName.toLowerCase().includes(q) ||
      b.domain.toLowerCase().includes(q) ||
      b.industry.toLowerCase().includes(q)
    );
  });

  // Filtered Members
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    const matchQuery =
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    const matchRole = memberRoleFilter === 'all' || m.role === memberRoleFilter;
    const matchBiz =
      memberBizFilter === 'all' ||
      m.businessId === memberBizFilter ||
      (!m.businessId && memberBizFilter === businesses[0]?.id);
    return matchQuery && matchRole && matchBiz;
  });

  // Handle Add Business Submit
  const handleAddBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizData.name || !newBizData.domain || !newBizData.supportEmail) return;

    onAddBusiness({
      name: newBizData.name.trim(),
      legalName: newBizData.legalName.trim() || `${newBizData.name.trim()} Inc.`,
      domain: newBizData.domain.trim().toLowerCase(),
      supportEmail: newBizData.supportEmail.trim().toLowerCase(),
      industry: newBizData.industry,
      tier: newBizData.tier,
      color: newBizData.color,
      currency: newBizData.currency,
      phone: newBizData.phone.trim() || '+1 (800) 555-0199',
      address: newBizData.address.trim() || 'Headquarters Office',
      isPrimary: newBizData.isPrimary,
    });

    setIsAddBusinessOpen(false);
    setNewBizData({
      name: '',
      legalName: '',
      domain: '',
      supportEmail: '',
      industry: 'Cloud Infrastructure & Enterprise SaaS',
      tier: 'Enterprise Suite',
      color: '#3B82F6',
      currency: 'USD ($)',
      phone: '',
      address: '',
      isPrimary: false,
    });
  };

  // Handle Confirm Delete Business
  const handleConfirmDeleteBusiness = () => {
    if (!businessToDelete) return;
    onDeleteBusiness(businessToDelete.id);
    setBusinessToDelete(null);
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name || !newMemberData.email) return;

    const assignedBiz =
      businesses.find((b) => b.id === newMemberData.businessId) || businesses[0];

    onAddMember({
      businessId: assignedBiz?.id,
      name: newMemberData.name.trim(),
      email: newMemberData.email.trim().toLowerCase(),
      role: newMemberData.role,
      department: newMemberData.department.trim() || 'General Staff',
      status: 'active',
      twoFactorEnabled: newMemberData.twoFactorEnabled,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      permissions: {
        canViewEncrypted:
          newMemberData.role === 'Owner' ||
          newMemberData.role === 'Admin' ||
          newMemberData.role === 'Auditor',
        canManageCrm: newMemberData.role !== 'Auditor',
        canScheduleEmails: true,
        canManageTeam: newMemberData.role === 'Owner' || newMemberData.role === 'Admin',
        canViewFinancialAnalytics: newMemberData.role !== 'Support Specialist',
        canDeleteEmails: newMemberData.role === 'Owner',
      },
    });

    setIsAddMemberOpen(false);
    setNewMemberData({
      name: '',
      email: '',
      role: 'Sales Manager',
      businessId: businesses[0]?.id || '',
      department: 'Commercial Revenue',
      twoFactorEnabled: true,
    });
  };

  // Handle Confirm Delete Member (Owner can delete ANY member)
  const handleConfirmDeleteMember = () => {
    if (!memberToDelete) return;
    onDeleteMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  // Handle Save Edited Permissions
  const handleSaveEditedPermissions = () => {
    if (!editingMember) return;
    onUpdateMemberPermissions(
      editingMember.id,
      editingMember.permissions,
      editingMember.role
    );
    setEditingMember(null);
  };

  // Helper to count members and accounts per business
  const getBusinessMetrics = (bizId: string) => {
    const bizMembers = members.filter(
      (m) => m.businessId === bizId || (!m.businessId && bizId === businesses[0]?.id)
    );
    const bizAccounts = accounts.filter(
      (a) => a.businessId === bizId || (!a.businessId && bizId === businesses[0]?.id)
    );
    return {
      memberCount: bizMembers.length,
      accountCount: bizAccounts.length,
    };
  };

  return (
    <div
      id="owner-settings-view-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto text-slate-800 dark:text-slate-100"
    >
      {/* Top Header Banner */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Owner Settings &amp; Organization Governance
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Root Owner Privileges
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full authority to create or delete business entities, manage enterprise domains, and add or delete any team member.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2">
          {subTab === 'businesses' ? (
            <button
              id="owner-add-business-btn"
              type="button"
              onClick={() => setIsAddBusinessOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Business</span>
            </button>
          ) : (
            <button
              id="owner-add-member-btn"
              type="button"
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Counters */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-6xl">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Registered Businesses
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {businesses.length}
              </span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active enterprise entities</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Team Members
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {members.length}
              </span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">All roles managed</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Active Mailboxes
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {accounts.length}
              </span>
              <Mail className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Across all registered domains</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Security Compliance
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                100%
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">MFA &amp; SOC-2 Type II active</p>
          </div>
        </div>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            id="owner-tab-businesses"
            type="button"
            onClick={() => setSubTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              subTab === 'businesses'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Business Entities ({businesses.length})</span>
          </button>

          <button
            id="owner-tab-members"
            type="button"
            onClick={() => setSubTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              subTab === 'members'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team &amp; Members ({members.length})</span>
          </button>

          <button
            id="owner-tab-audit"
            type="button"
            onClick={() => setSubTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              subTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Security &amp; Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="p-5 max-w-6xl space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: BUSINESS ENTITIES MANAGEMENT (Add & Delete)        */}
        {/* ========================================================= */}
        {subTab === 'businesses' && (
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-businesses-input"
                  type="text"
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  placeholder="Search businesses by name, legal entity, domain, or industry..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Showing {filteredBusinesses.length} of {businesses.length} businesses
                </span>
                <button
                  id="owner-add-business-sub-btn"
                  type="button"
                  onClick={() => setIsAddBusinessOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Business</span>
                </button>
              </div>
            </div>

            {/* Businesses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBusinesses.map((biz) => {
                const metrics = getBusinessMetrics(biz.id);
                const isActive = activeBusinessId === biz.id;

                return (
                  <div
                    key={biz.id}
                    id={`business-card-${biz.id}`}
                    className={`rounded-2xl bg-white dark:bg-slate-900 border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                      isActive
                        ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header: Color, Name, Tier, Primary */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-sm shrink-0"
                            style={{ backgroundColor: biz.color || '#3B82F6' }}
                          >
                            {biz.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {biz.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {biz.domain}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {biz.isPrimary && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              Primary
                            </span>
                          )}
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {biz.tier}
                          </span>
                        </div>
                      </div>

                      {/* Legal & Industry Info */}
                      <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Legal Entity:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {biz.legalName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Industry:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {biz.industry}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Support Mail:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                            {biz.supportEmail}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Operating Currency:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {biz.currency}
                          </span>
                        </div>
                      </div>

                      {/* Metrics counts */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">
                            {metrics.memberCount}
                          </span>
                          <span className="text-[10px] text-slate-400">Members</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">
                            {metrics.accountCount}
                          </span>
                          <span className="text-[10px] text-slate-400">Inboxes</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions: Switch Active & Delete Business */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        id={`select-active-biz-btn-${biz.id}`}
                        type="button"
                        onClick={() => onSelectBusiness(biz.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-600 text-white cursor-default'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active Context</span>
                          </>
                        ) : (
                          <span>Switch to Business</span>
                        )}
                      </button>

                      {/* Delete Business Action */}
                      <button
                        id={`delete-business-btn-${biz.id}`}
                        type="button"
                        onClick={() => setBusinessToDelete(biz)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors"
                        title={`Delete Business Entity: ${biz.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No businesses found matching query
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search criteria or register a new business entity.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddBusinessOpen(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold"
                >
                  Add Business Entity
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TEAM MEMBERS MANAGEMENT (Add & Delete ANY Member)  */}
        {/* ========================================================= */}
        {subTab === 'members' && (
          <div className="space-y-4">
            {/* Search, Role Filter, and Business Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-members-input"
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members by name, email, department..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Business Filter */}
                <select
                  id="member-filter-business-select"
                  value={memberBizFilter}
                  onChange={(e) => setMemberBizFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">🏢 All Businesses</option>
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.name}
                    </option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  id="member-filter-role-select"
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Support Specialist">Support Specialist</option>
                  <option value="Auditor">Auditor</option>
                </select>

                <button
                  id="owner-add-member-sub-btn"
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* Members Table / List */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Organization Members ({filteredMembers.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Owner can edit permissions or delete ANY member with immediate access revocation.
                  </p>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Enforced 2FA Active
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => {
                  const assignedBiz = businesses.find(
                    (b) => b.id === member.businessId
                  ) || businesses[0];

                  return (
                    <div
                      key={member.id}
                      id={`member-row-${member.id}`}
                      className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Identity */}
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                member.role === 'Owner'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : member.role === 'Admin'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {member.role}
                            </span>
                            {member.twoFactorEnabled && (
                              <span
                                title="2FA verified"
                                className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                2FA
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {member.email} • {member.department}
                          </p>
                          {assignedBiz && (
                            <span
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                              style={{
                                borderColor: `${assignedBiz.color}40`,
                                backgroundColor: `${assignedBiz.color}15`,
                                color: assignedBiz.color,
                              }}
                            >
                              <Building2 className="w-3 h-3" />
                              {assignedBiz.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Permissions tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {member.permissions.canViewEncrypted && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            🔒 E2EE Access
                          </span>
                        )}
                        {member.permissions.canManageCrm && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            💼 CRM Lead Manager
                          </span>
                        )}
                        {member.permissions.canManageTeam && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ⚙️ Team Admin
                          </span>
                        )}
                        {member.permissions.canViewFinancialAnalytics && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📊 Financial Analytics
                          </span>
                        )}
                        {member.permissions.canDeleteEmails && (
                          <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            🗑️ Delete Permissions
                          </span>
                        )}
                      </div>

                      {/* Actions: Permissions & DELETE ANY MEMBER */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Permissions</span>
                        </button>

                        {/* Owner can delete ANY member */}
                        <button
                          id={`delete-member-btn-${member.id}`}
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 transition-colors"
                          title={`Delete member ${member.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No team members found matching filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SECURITY & AUDIT TRAIL                             */}
        {/* ========================================================= */}
        {subTab === 'audit' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-500" />
                  SOC-2 Administrative &amp; Security Audit Trail
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chronological event ledger recording business additions, deletions, and member revocations.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Immutable Ledger
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        log.severity === 'security'
                          ? 'bg-emerald-500 ring-4 ring-emerald-500/10'
                          : log.severity === 'warning'
                          ? 'bg-amber-500 ring-4 ring-amber-500/10'
                          : 'bg-blue-500 ring-4 ring-blue-500/10'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.action}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Actor: <span className="font-medium text-slate-600 dark:text-slate-300">{log.actor}</span> • IP: {log.ipAddress}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD BUSINESS ENTITY                                */}
      {/* ========================================================= */}
      {isAddBusinessOpen && (
        <div
          id="add-business-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="add-business-modal-window"
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add New Business Entity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBusinessOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBusinessSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Business Name: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-biz-name-input"
                    type="text"
                    required
                    value={newBizData.name}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, name: e.target.value })
                    }
                    placeholder="e.g. Quantum Logistics Inc."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Legal Registered Name:
                  </label>
                  <input
                    id="new-biz-legal-input"
                    type="text"
                    value={newBizData.legalName}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, legalName: e.target.value })
                    }
                    placeholder="e.g. Quantum Logistics Global Corp."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Primary Domain: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-biz-domain-input"
                    type="text"
                    required
                    value={newBizData.domain}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, domain: e.target.value })
                    }
                    placeholder="quantum-logistics.com"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Support / Contact Email: <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="new-biz-email-input"
                    type="email"
                    required
                    value={newBizData.supportEmail}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, supportEmail: e.target.value })
                    }
                    placeholder="support@quantum-logistics.com"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Industry:
                  </label>
                  <select
                    value={newBizData.industry}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, industry: e.target.value })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    {industryOptions.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Subscription Tier:
                  </label>
                  <select
                    value={newBizData.tier}
                    onChange={(e) =>
                      setNewBizData({
                        ...newBizData,
                        tier: e.target.value as BusinessEntity['tier'],
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="Enterprise Suite">Enterprise Suite (Unlimited)</option>
                    <option value="Growth">Growth Plan</option>
                    <option value="Starter">Starter Plan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Contact Phone:
                  </label>
                  <input
                    type="text"
                    value={newBizData.phone}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, phone: e.target.value })
                    }
                    placeholder="+1 (800) 555-0199"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Operating Currency:
                  </label>
                  <select
                    value={newBizData.currency}
                    onChange={(e) =>
                      setNewBizData({ ...newBizData, currency: e.target.value })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="ZAR (R)">ZAR (R)</option>
                    <option value="CAD ($)">CAD ($)</option>
                    <option value="AUD ($)">AUD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Headquarters Address:
                </label>
                <input
                  type="text"
                  value={newBizData.address}
                  onChange={(e) =>
                    setNewBizData({ ...newBizData, address: e.target.value })
                  }
                  placeholder="e.g. 500 Howard St, San Francisco, CA 94105"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>

              {/* Brand Color Picker */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Brand Theme Color:
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewBizData({ ...newBizData, color: c.value })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newBizData.color === c.value
                          ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Set as Primary toggle */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBizData.isPrimary}
                  onChange={(e) =>
                    setNewBizData({ ...newBizData, isPrimary: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Set as Primary Business Entity for organization
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBusinessOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="submit-new-business-btn"
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                >
                  Register Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE BUSINESS CONFIRMATION                       */}
      {/* ========================================================= */}
      {businessToDelete && (
        <div
          id="delete-business-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="delete-business-modal-window"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Business Entity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal confirmation
                </p>
              </div>
            </div>

            {businesses.length <= 1 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold">Cannot delete the only business</p>
                <p className="mt-1">
                  You must have at least one active business entity in Owner Settings. Please register a secondary business before removing this entity.
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBusinessToDelete(null)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs"
                  >
                    Understood
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{businessToDelete.name}</strong> (<span className="font-mono">{businessToDelete.domain}</span>)?
                </p>

                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Warning: Owner Safeguard
                  </p>
                  <p>
                    Deleting this business will remove its enterprise profile, unbind linked corporate credentials, and archive all associated routing tables. This action is permanently logged to the SOC-2 audit ledger.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessToDelete(null)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-delete-business-btn"
                    type="button"
                    onClick={handleConfirmDeleteBusiness}
                    className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                  >
                    Confirm Permanent Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD TEAM MEMBER                                    */}
      {/* ========================================================= */}
      {isAddMemberOpen && (
        <div
          id="add-member-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="add-member-modal-window"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-600" />
                Add Team Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Full Name: <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-member-name-input"
                  type="text"
                  required
                  value={newMemberData.name}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, name: e.target.value })
                  }
                  placeholder="e.g. Jordan Hayes"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Business Email: <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-member-email-input"
                  type="email"
                  required
                  value={newMemberData.email}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, email: e.target.value })
                  }
                  placeholder="sales@partssource-za.co.za"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Assign to Business Entity:
                </label>
                <select
                  id="new-member-biz-select"
                  value={newMemberData.businessId}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, businessId: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.domain})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Role:
                  </label>
                  <select
                    id="new-member-role-select"
                    value={newMemberData.role}
                    onChange={(e) =>
                      setNewMemberData({
                        ...newMemberData,
                        role: e.target.value as TeamMember['role'],
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Support Specialist">Support Specialist</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Department:
                  </label>
                  <input
                    type="text"
                    value={newMemberData.department}
                    onChange={(e) =>
                      setNewMemberData({ ...newMemberData, department: e.target.value })
                    }
                    placeholder="Commercial Revenue"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMemberData.twoFactorEnabled}
                  onChange={(e) =>
                    setNewMemberData({
                      ...newMemberData,
                      twoFactorEnabled: e.target.checked,
                    })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Enforce Multi-Factor Authentication (2FA) on account
                </span>
              </label>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="submit-new-member-btn"
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE ANY MEMBER CONFIRMATION                     */}
      {/* ========================================================= */}
      {memberToDelete && (
        <div
          id="delete-member-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="delete-member-modal-window"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Team Member
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Owner revocation control
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{memberToDelete.name}</strong> ({memberToDelete.role}) from the organization?
              </p>

              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Immediate Access Revocation
                </p>
                <p>
                  Their login session, mailbox delegations, and API tokens will be terminated immediately. All past audit trails are retained.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-member-btn"
                  type="button"
                  onClick={handleConfirmDeleteMember}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                >
                  Delete Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT PERMISSIONS                                   */}
      {/* ========================================================= */}
      {editingMember && (
        <div
          id="edit-permissions-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="edit-permissions-modal-window"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Permissions: {editingMember.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Organization Role:
                </label>
                <select
                  value={editingMember.role}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      role: e.target.value as TeamMember['role'],
                    })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Owner">Owner (Superuser)</option>
                  <option value="Admin">Admin</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Support Specialist">Support Specialist</option>
                  <option value="Auditor">Auditor (Read-Only)</option>
                </select>
              </div>

              {/* Granular switches */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Granular Access Privileges
                </p>

                {[
                  {
                    key: 'canViewEncrypted',
                    label: 'Decrypt & View E2EE Client Correspondence',
                  },
                  { key: 'canManageCrm', label: 'Create & Update CRM Leads Pipeline' },
                  { key: 'canScheduleEmails', label: 'Schedule Outgoing Client Dispatches' },
                  { key: 'canManageTeam', label: 'Manage Team Members & Access Roles' },
                  {
                    key: 'canViewFinancialAnalytics',
                    label: 'Inspect Financial & Deal Revenue Analytics',
                  },
                  { key: 'canDeleteEmails', label: 'Permanently Purge & Delete Correspondence' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        editingMember.permissions[key as keyof TeamMember['permissions']]
                      }
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          permissions: {
                            ...editingMember.permissions,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">{label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="save-member-permissions-btn"
                  type="button"
                  onClick={handleSaveEditedPermissions}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                >
                  Save Access Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
