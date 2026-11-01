import React, { useState } from 'react';
import {
  Binary,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  Lock,
  Play,
  Zap,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';
import { Order } from '../../types';
import { NavTab } from '../Sidebar';

interface RecoveryTwinViewProps {
  onNavigate: (tab: NavTab) => void;
  selectedOrderId?: string;
}

export const RecoveryTwinView: React.FC<RecoveryTwinViewProps> = ({
  onNavigate,
  selectedOrderId: initialOrderId,
}) => {
  const {
    orders,
    simulateOrderRecovery,
    recoverSingleOrder,
    approveOrderRecovery,
    services,
    controllerState,
  } = useSentinel();

  const [activeOrderId, setActiveOrderId] = useState<string>(
    initialOrderId || orders[0]?.id || 'ORD-7842'
  );
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [lastSimTimestamp, setLastSimTimestamp] = useState<string>(new Date().toLocaleTimeString());

  const currentOrder = orders.find((o) => o.id === activeOrderId) || orders[0];
  const simResult = simulateOrderRecovery(currentOrder?.id);

  const handleRunSimulation = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      setIsRunningSim(false);
      setLastSimTimestamp(new Date().toLocaleTimeString());
    }, 450);
  };

  const handleExecuteFromTwin = async () => {
    if (!currentOrder) return;
    if (simResult?.overall_verdict === 'REQUIRES_APPROVAL') {
      await approveOrderRecovery(currentOrder.id);
    } else if (simResult?.overall_verdict === 'SAFE_TO_EXECUTE') {
      await recoverSingleOrder(currentOrder.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Digital Twin</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Pre-Execution Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic pre-flight state simulation. Validates idempotency, stock locks, and downstream capacity before execution.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Order:</label>
          <select
            value={activeOrderId}
            onChange={(e) => setActiveOrderId(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg shadow-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 cursor-pointer"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} ({o.recovery_eligibility} - ${o.amount})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunSimulation}
            disabled={isRunningSim}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningSim ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Select Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Quick Profiles:</span>
        <button
          onClick={() => setActiveOrderId('ORD-7842')}
          className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
            activeOrderId === 'ORD-7842'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ORD-7842 (Autonomous Safe)
        </button>
        <button
          onClick={() => setActiveOrderId('ORD-7845')}
          className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
            activeOrderId === 'ORD-7845'
              ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ORD-7845 (Needs Approval - PSP Timeout)
        </button>
        <button
          onClick={() => setActiveOrderId('ORD-7843')}
          className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
            activeOrderId === 'ORD-7843'
              ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          ORD-7843 (Blocked - Stockout)
        </button>
      </div>

      {/* Main Twin Comparison Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Current Order State */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h2 className="text-sm font-bold text-slate-900">Current Order State</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Snapshot</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{currentOrder?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lifecycle Status:</span>
                <span className="font-semibold text-rose-600">{currentOrder?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-slate-800">{currentOrder?.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inventory Status:</span>
                <span className="font-semibold text-slate-800">{currentOrder?.inventory_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium text-slate-800">{currentOrder?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Value:</span>
                <span className="font-bold text-slate-900">${currentOrder?.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Cryptographic Key Verification */}
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px]">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Authoritative Idempotency Key</span>
              </div>
              <div className="font-mono text-[10px] text-purple-800 break-all bg-white/80 p-1.5 rounded border border-purple-200">
                {currentOrder?.idempotency_key}
              </div>
              <p className="text-[10px] text-purple-600">
                Guarantees zero duplicate operations at payment gateways & inventory reservation locks.
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Proposed Action & Transformation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h2 className="text-sm font-bold text-slate-900">Proposed Action & Expected State</h2>
            </div>
            <span className="text-[10px] font-mono text-purple-600 font-semibold">Twin Engine</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide">
                Proposed State Machine Transition:
              </span>
              <div className="p-2 rounded-lg bg-white border border-purple-200 font-mono text-xs font-bold text-purple-800">
                {simResult?.proposed_action}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>{currentOrder?.status}</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-bold text-emerald-700">{simResult?.expected_state}</span>
              </div>
            </div>

            {/* Expected Result State Details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-semibold text-slate-700">Expected Post-Recovery Outcomes:</span>
              <ul className="space-y-1 text-slate-600 text-[11px] pl-3 list-disc">
                <li>Inventory reservation lock locked in warehouse DB.</li>
                <li>PSP charge settlement finalized via webhook.</li>
                <li>Customer email confirmation dispatched.</li>
                <li>Tamper-evident SHA-256 block appended to Proof Ledger.</li>
              </ul>
            </div>

            {/* Verdict Badge */}
            <div
              className={`p-4 rounded-xl border text-center space-y-1 ${
                simResult?.overall_verdict === 'SAFE_TO_EXECUTE'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : simResult?.overall_verdict === 'REQUIRES_APPROVAL'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider">
                Twin Pre-Flight Verdict:
              </div>
              <div className="text-base font-extrabold flex items-center justify-center gap-2">
                {simResult?.overall_verdict === 'SAFE_TO_EXECUTE' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>SAFE TO EXECUTE</span>
                  </>
                )}
                {simResult?.overall_verdict === 'REQUIRES_APPROVAL' && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>HUMAN APPROVAL REQUIRED</span>
                  </>
                )}
                {simResult?.overall_verdict === 'BLOCKED' && (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <span>RECOVERY STRICTLY BLOCKED</span>
                  </>
                )}
              </div>
              <p className="text-[11px] opacity-80 mt-1">
                Evaluated against 6 zero-trust safety gates
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Zero-Trust Safety Gates Checklist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Safety Gate Checklist</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Last check: {lastSimTimestamp}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {simResult?.safety_checks.map((check, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs transition-colors ${
                  check.passed
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-rose-50/40 border-rose-200/80'
                }`}
              >
                <div className="flex items-start gap-2">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">{check.name}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{check.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Trigger */}
          <div className="pt-2 border-t border-slate-100">
            {simResult?.overall_verdict === 'SAFE_TO_EXECUTE' && currentOrder?.status !== 'RECOVERED_VERIFIED' && (
              <button
                onClick={handleExecuteFromTwin}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Execute Safe Recovery for {currentOrder?.id}</span>
              </button>
            )}

            {simResult?.overall_verdict === 'REQUIRES_APPROVAL' && (
              <button
                onClick={handleExecuteFromTwin}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve PSP Reconciliation & Grant Recovery</span>
              </button>
            )}

            {simResult?.overall_verdict === 'BLOCKED' && (
              <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-500 text-center text-xs font-medium">
                Autonomous execution locked by safety policy.
              </div>
            )}

            {currentOrder?.status === 'RECOVERED_VERIFIED' && (
              <div className="w-full py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Order Already Recovered & Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
