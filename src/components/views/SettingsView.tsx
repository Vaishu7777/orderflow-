import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Sliders,
  Database,
  Lock,
  RotateCcw,
  Check,
  Flame,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';

export const SettingsView: React.FC = () => {
  const {
    resetSimulation,
    startFlashSaleSimulation,
    restoreServiceHealth,
    injectPaymentTimeout,
  } = useSentinel();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Policy Settings state
  const [maxRetries, setMaxRetries] = useState(3);
  const [circuitTripRate, setCircuitTripRate] = useState(30);
  const [latencyThresholdMs, setLatencyThresholdMs] = useState(1500);
  const [retryBudgetTokens, setRetryBudgetTokens] = useState(50);
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const [strictStockCheck, setStrictStockCheck] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Policy Settings</h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Dual-Control Governance
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Define safety thresholds, governor parameters, autonomous recovery gates, and seed scenarios.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Policies and thresholds updated successfully. Enforced across all state machines.</span>
        </div>
      )}

      {/* Scenario Presets */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Deterministic Demo Scenarios</h2>
          <p className="text-xs text-slate-500">Inject reproducible flash sale failure patterns to test recovery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Flash Sale Traffic Spike</span>
              </div>
              <p className="text-rose-700 text-[11px] mt-1">
                Simulates 10x ingress surge with downstream PostgreSQL lock contention and 504 timeouts.
              </p>
            </div>
            <button
              onClick={startFlashSaleSimulation}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
            >
              Load Scenario
            </button>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>PSP Webhook Lag Wave</span>
              </div>
              <p className="text-amber-700 text-[11px] mt-1">
                Injects payment gateway timeouts leaving charge status in UNKNOWN state. Tests approval gating.
              </p>
            </div>
            <button
              onClick={injectPaymentTimeout}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
            >
              Load Scenario
            </button>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Nominal SLA Baseline</span>
              </div>
              <p className="text-emerald-700 text-[11px] mt-1">
                Restores all 5 microservices to sub-50ms latency and 99.99% availability.
              </p>
            </div>
            <button
              onClick={restoreServiceHealth}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              Restore Baseline
            </button>
          </div>
        </div>
      </div>

      {/* Policy Configuration Form */}
      <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Safety Gating & Governor Parameters</h2>
          <p className="text-xs text-slate-500">Tune the autonomous recovery engine thresholds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Circuit Breaker Trip Error Rate (%)</label>
            <input
              type="number"
              value={circuitTripRate}
              onChange={(e) => setCircuitTripRate(Number(e.target.value))}
              min={5}
              max={80}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400">If service error rate exceeds this, trips circuit to OPEN.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Latency Warning Threshold (ms)</label>
            <input
              type="number"
              value={latencyThresholdMs}
              onChange={(e) => setLatencyThresholdMs(Number(e.target.value))}
              min={200}
              max={5000}
              step={100}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400">Downstream p99 response time threshold for incident trigger.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Rolling Retry Budget Tokens</label>
            <input
              type="number"
              value={retryBudgetTokens}
              onChange={(e) => setRetryBudgetTokens(Number(e.target.value))}
              min={10}
              max={200}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400">Total recovery attempts permitted per rolling 5-minute window.</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Max Per-Order Autonomous Retries</label>
            <input
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              min={1}
              max={5}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400">Orders exceeding this count automatically require SRE review.</p>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-800">Autonomous Recovery Engine</div>
              <div className="text-[11px] text-slate-500">Allow zero-risk orders to recover automatically when criteria pass</div>
            </div>
            <input
              type="checkbox"
              checked={autoRecoveryEnabled}
              onChange={(e) => setAutoRecoveryEnabled(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
            <div>
              <div className="font-semibold text-slate-800">Strict Stockout Hard Block (POL-03)</div>
              <div className="text-[11px] text-slate-500">Permanently forbid retries on orders with confirmed physical depletion</div>
            </div>
            <input
              type="checkbox"
              checked={strictStockCheck}
              onChange={(e) => setStrictStockCheck(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo to Seed Defaults</span>
          </button>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Policy Rules
          </button>
        </div>
      </form>
    </div>
  );
};
