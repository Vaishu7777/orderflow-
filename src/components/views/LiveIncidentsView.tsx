import React from 'react';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';
import { NavTab } from '../Sidebar';

interface LiveIncidentsViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const LiveIncidentsView: React.FC<LiveIncidentsViewProps> = ({ onNavigate }) => {
  const { activeIncident, services, orders } = useSentinel();

  const failedCount = orders.filter((o) => o.status === 'FAILED').length;
  const recoveredCount = orders.filter((o) => o.status === 'RECOVERED_VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                {activeIncident.id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {activeIncident.severity}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                STATUS: {activeIncident.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-2">{activeIncident.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Detected by Sentinel AI Failure Correlation Engine &bull; Started {activeIncident.started_at} (14m ago)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('twin')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Simulate in Recovery Twin
            </button>
            <button
              onClick={() => onNavigate('recovery')}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Recover Trapped Orders ({failedCount})
            </button>
          </div>
        </div>

        {/* Incident Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" />
              <span>Revenue at Risk</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ${activeIncident.revenue_at_risk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Unsettled or pending checkout value</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Affected Orders</span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{failedCount} Failed</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">{recoveredCount} already recovered & verified</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Affected Services</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">Inventory & Order APIs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Payment & Fulfillment healthy</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Correlated Root Cause</span>
            </div>
            <div className="text-sm font-bold text-purple-700 mt-1">DB Lock Contention</div>
            <div className="text-[10px] text-purple-600 mt-0.5">94% Confidence Level</div>
          </div>
        </div>
      </div>

      {/* Visual Service Dependency Graph */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Service Dependency Topology & Failure Path</h2>
            <p className="text-xs text-slate-500">Live order propagation across distributed microservices</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Degraded
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Critical Timeout
            </span>
          </div>
        </div>

        {/* Visual Graph Nodes & Arrows */}
        <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-200/70">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            {/* Node 1: Marketplace / Edge Ingress */}
            <div className="flex flex-col items-center text-center p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs w-44">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
                <Server className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Marketplace Edge</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Cloud Ingress Gateway</span>
              <span className="mt-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Healthy (24ms)
              </span>
            </div>

            {/* Connection 1 */}
            <div className="hidden lg:flex flex-col items-center text-slate-400">
              <span className="text-[10px] font-mono text-slate-500 mb-0.5">HTTP/2 POST</span>
              <div className="w-12 h-0.5 bg-slate-300 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-slate-400 rotate-45" />
              </div>
            </div>

            {/* Node 2: Order Orchestration */}
            <div className="flex flex-col items-center text-center p-3.5 bg-white rounded-xl border border-amber-300 shadow-xs w-44 relative ring-2 ring-amber-100">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Order Service</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Saga State Machine</span>
              <span className="mt-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
                Degraded (620ms)
              </span>
            </div>

            {/* Connection 2 (Failure bottleneck) */}
            <div className="hidden lg:flex flex-col items-center text-rose-500">
              <span className="text-[10px] font-mono font-bold text-rose-600 mb-0.5">HTTP 504 / 429</span>
              <div className="w-12 h-0.5 bg-rose-500 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-rose-500 rotate-45" />
              </div>
            </div>

            {/* Node 3: Inventory Service (Root degradation) */}
            <div className="flex flex-col items-center text-center p-3.5 bg-white rounded-xl border-2 border-rose-400 shadow-sm w-44 relative ring-4 ring-rose-50">
              <div className="absolute -top-2.5 bg-rose-600 text-white text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                Root Culprit
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 mb-2 mt-1">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-rose-900">Inventory API</span>
              <span className="text-[10px] text-rose-600 mt-0.5">Lock Contention (Postgres)</span>
              <span className="mt-2 px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                Critical (2,850ms)
              </span>
            </div>

            {/* Branching Connection to Payment & Fulfillment */}
            <div className="hidden lg:flex flex-col items-center text-slate-400">
              <span className="text-[10px] font-mono text-slate-500 mb-0.5">Reconcile</span>
              <div className="w-12 h-0.5 bg-slate-300 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-slate-400 rotate-45" />
              </div>
            </div>

            {/* Node 4: Payment Broker */}
            <div className="flex flex-col items-center text-center p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs w-44">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-2">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Payment Gateway</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Idempotent Webhooks</span>
              <span className="mt-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Healthy (165ms)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause Analysis: Evidence vs Probable Cause vs Confidence vs Recommendation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Evidence-Based Root Cause Diagnosis</h2>
          <p className="text-xs text-slate-500">
            Sentinel AI strictly separates verified empirical facts from algorithmic deduction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Section 1: Observed Evidence */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>1. Observed Evidence (Verified Telemetry)</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc mt-2">
              {activeIncident.root_cause_analysis.observed_evidence.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Probable Root Cause & Confidence */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>2. Probable Root Cause (Inference)</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200">
                Confidence: {activeIncident.root_cause_analysis.confidence_level} ({activeIncident.root_cause_analysis.confidence_percentage}%)
              </span>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {activeIncident.root_cause_analysis.probable_root_cause}
            </p>

            <div className="pt-2 border-t border-rose-200/60">
              <div className="text-[11px] font-bold text-rose-900 mb-1">Recommended Recovery Policy:</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeIncident.root_cause_analysis.recommended_action}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Event Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Incident Event Chronicle & Correlated Milestones</h2>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {activeIncident.timeline.map((evt) => (
            <div key={evt.id} className="relative">
              <div
                className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  evt.type === 'ALERT'
                    ? 'border-rose-500'
                    : evt.type === 'DECISION'
                    ? 'border-purple-500'
                    : evt.type === 'RECOVERY'
                    ? 'border-amber-500'
                    : 'border-slate-400'
                }`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{evt.title}</span>
                <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                    evt.type === 'ALERT'
                      ? 'bg-rose-100 text-rose-700'
                      : evt.type === 'DECISION'
                      ? 'bg-purple-100 text-purple-700'
                      : evt.type === 'RECOVERY'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {evt.type}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{evt.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
