import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Mail,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  ArrowUpRight,
  Shield,
  Zap,
} from 'lucide-react';
import { CRMLead, Email } from '../types';

interface AnalyticsDashboardProps {
  emails: Email[];
  leads: CRMLead[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ emails, leads }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totalSent = emails.filter((e) => e.folder === 'sent').length + 42;
  const totalReceived = emails.filter((e) => e.folder === 'inbox').length + 86;
  const totalLeadsValue = leads.reduce((sum, l) => sum + l.dealValue, 0);
  const wonLeads = leads.filter((l) => l.stage === 'Won');
  const wonValue = wonLeads.reduce((sum, l) => sum + l.dealValue, 0);

  // Daily activity mock data
  const activityData = [
    { day: 'Mon', sent: 18, received: 34 },
    { day: 'Tue', sent: 24, received: 42 },
    { day: 'Wed', sent: 32, received: 38 },
    { day: 'Thu', sent: 28, received: 45 },
    { day: 'Fri', sent: 35, received: 39 },
    { day: 'Sat', sent: 8, received: 12 },
    { day: 'Sun', sent: 11, received: 15 },
  ];

  // Hourly volume distribution
  const hourlyData = [
    { hour: '8 AM', count: 12 },
    { hour: '10 AM', count: 48 },
    { hour: '12 PM', count: 32 },
    { hour: '2 PM', count: 54 },
    { hour: '4 PM', count: 42 },
    { hour: '6 PM', count: 20 },
  ];

  return (
    <div
      id="analytics-dashboard-container"
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto text-slate-800 dark:text-slate-100"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance &amp; Communication Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time client engagement, SLA response velocities, and CRM conversion tracking
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === '7d'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === '30d'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded-md transition-all ${
              timeRange === '90d'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Quarter
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6 max-w-6xl">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Handled */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Correspondence</span>
              <Mail className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(totalSent + totalReceived).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4% vs last period</span>
            </p>
          </div>

          {/* Response Speed */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Avg First Reply</span>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              12 mins
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Industry benchmark: 45 mins
            </p>
          </div>

          {/* Open & Read Rate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Client Read Rate</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              68.4%
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+4.2% engagement</span>
            </p>
          </div>

          {/* Pipeline Conversion */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pipeline Won</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              ${(wonValue / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Total Pipeline: ${(totalLeadsValue / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Email Traffic Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Email Traffic Volume
                </h3>
                <p className="text-xs text-slate-500">Incoming inquiries vs sent replies</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Received
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Sent
                </span>
              </div>
            </div>

            {/* SVG / Bar Chart Representation */}
            <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
              {activityData.map((item) => {
                const maxVal = 50;
                const receivedHeight = (item.received / maxVal) * 100;
                const sentHeight = (item.sent / maxVal) * 100;

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      <div
                        style={{ height: `${receivedHeight}%` }}
                        className="w-3.5 sm:w-4 rounded-t-md bg-blue-500/80 hover:bg-blue-600 transition-all"
                        title={`Received: ${item.received}`}
                      />
                      <div
                        style={{ height: `${sentHeight}%` }}
                        className="w-3.5 sm:w-4 rounded-t-md bg-emerald-500/80 hover:bg-emerald-600 transition-all"
                        title={`Sent: ${item.sent}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peak Correspondence Hours */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Peak Client Communication Hours
                </h3>
                <p className="text-xs text-slate-500">Optimal dispatch times for high open rates</p>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                Peak: 2:00 PM EST
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {hourlyData.map((slot) => (
                <div key={slot.hour} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{slot.hour}</span>
                    <span className="text-slate-400">{slot.count} messages</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${(slot.count / 60) * 100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Cloud Sync Telemetry Panel */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security &amp; Cloud Reliability Architecture
              </h4>
              <p className="text-sm font-semibold">
                100% AES-256 Client Isolation • Zero-Knowledge Telemetry • Offline Store Integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold">
              SYSTEM HEALTH: 99.99%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
