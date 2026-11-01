import React from 'react';
import {
  Cpu,
  ShieldAlert,
  Gauge,
  Activity,
  Zap,
  Timer,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Power,
  Flame,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';

export const AdaptiveControllerView: React.FC = () => {
  const { controllerState, services, restoreServiceHealth, injectInventoryFailure } = useSentinel();

  const inventoryService = services.find((s) => s.id === 'inventory');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Adaptive Recovery Controller</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Traffic Governor & Circuit Breaker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controls retry budgets, backoff intervals, circuit breakers, and throttles recovery traffic to prevent secondary service collapse.
          </p>
        </div>

        {/* Quick Governor Tests */}
        <div className="flex items-center gap-2">
          <button
            onClick={injectInventoryFailure}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Trip Circuit (Inject Error)</span>
          </button>
          <button
            onClick={restoreServiceHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Restore Nominal Health</span>
          </button>
        </div>
      </div>

      {/* Primary Governor Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Circuit Breaker Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Circuit Breaker</span>
            <Power className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                controllerState.circuit_breaker === 'CLOSED'
                  ? 'bg-emerald-500 ring-4 ring-emerald-100'
                  : controllerState.circuit_breaker === 'HALF_OPEN'
                  ? 'bg-amber-500 ring-4 ring-amber-100 animate-pulse'
                  : 'bg-rose-500 ring-4 ring-rose-100 animate-pulse'
              }`}
            />
            <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              {controllerState.circuit_breaker}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {controllerState.circuit_breaker === 'CLOSED' &&
              'Healthy. 100% recovery traffic allowed through to backend.'}
            {controllerState.circuit_breaker === 'HALF_OPEN' &&
              'Probing mode. Throttled to 25% traffic to test downstream latency.'}
            {controllerState.circuit_breaker === 'OPEN' &&
              'Tripped! All retries halted to prevent inventory service cascade.'}
          </p>
        </div>

        {/* Card 2: Retry Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rolling Retry Budget</span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {controllerState.retry_budget_current}
            </div>
            <span className="text-xs text-slate-400">/ {controllerState.retry_budget_max} tokens</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{
                width: `${(controllerState.retry_budget_current / controllerState.retry_budget_max) * 100}%`,
              }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Replenishes at 10 tokens/min. Prevents retry storming during flash sales.
          </p>
        </div>

        {/* Card 3: Recovery Traffic Throttle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Recovery Concurrency Throttle</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {controllerState.recovery_traffic_pct}%
            </div>
            <span className="text-xs text-slate-400">capacity</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                controllerState.recovery_traffic_pct > 75
                  ? 'bg-emerald-500'
                  : controllerState.recovery_traffic_pct > 25
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${controllerState.recovery_traffic_pct}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Status:{' '}
            <strong className="text-slate-800">{controllerState.throttle_status}</strong>
          </p>
        </div>

        {/* Card 4: Backoff Interval with Jitter */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Adaptive Backoff Interval</span>
            <Timer className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {controllerState.current_backoff_ms}
            </div>
            <span className="text-xs text-slate-400">ms (+ jitter)</span>
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5">
            <div>Base: 500ms &bull; Factor: 2x &bull; Full Jitter</div>
            <div className="text-[10px] text-slate-400">De-synchronizes concurrent retry stamps</div>
          </div>
        </div>
      </div>

      {/* Controller Operational Principles & Reactive Rule Engine */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Adaptive Governor Mechanics</h2>
          <p className="text-xs text-slate-500">
            How OrderFlow Sentinel AI prevents self-inflicted Distributed Denial of Service (DDoS)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1. Retry Budgeting</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Retries are capped at a strict percentage of regular traffic (10%). When the retry budget drops to zero, automated retries pause immediately until the rolling window refreshes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>2. Circuit Breaker Trips</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              If downstream API error rate exceeds 30% or p99 latency breaches 2,000ms, the circuit flips to OPEN. No recovery requests are sent until synthetic health probes verify stabilization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-sky-500" />
              <span>3. Full Jitter Exponential Backoff</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              T_sleep = random_between(0, min(T_max, T_base * 2^attempt)). Randomizing the delay eliminates synchronized thundering herd spikes hitting the database pool simultaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
