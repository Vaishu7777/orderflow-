import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Play,
  RotateCcw,
  HeartHandshake,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

interface HeaderProps {
  onOpenCopilot: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCopilot }) => {
  const {
    simulationStatus,
    startFlashSaleSimulation,
    restoreServiceHealth,
    resetSimulation,
    activeIncident,
    orders,
    isSimulating,
  } = useSentinel();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const failedOrdersCount = orders.filter((o) => o.status === 'FAILED').length;
  const recoveredOrdersCount = orders.filter((o) => o.status === 'RECOVERED_VERIFIED').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Environment */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-rose-400 to-pink-500 text-white shadow-sm shadow-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-base font-sans">
                OrderFlow Sentinel <span className="text-rose-600 font-bold">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                DEMO ENVIRONMENT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Intelligent Flash-Sale Order Recovery & Cryptographic Proof Platform
            </p>
          </div>
        </div>

        {/* Global Simulation Controls */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                simulationStatus === 'FLASH_SALE_SPIKE'
                  ? 'bg-rose-500 animate-pulse'
                  : simulationStatus === 'RECOVERING'
                  ? 'bg-amber-500 animate-pulse'
                  : simulationStatus === 'RECOVERED_VERIFIED'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-700">
              {simulationStatus === 'FLASH_SALE_SPIKE' && 'FLASH SALE SPIKE (CRITICAL)'}
              {simulationStatus === 'RECOVERING' && 'ADAPTIVE RECOVERY IN PROGRESS'}
              {simulationStatus === 'RECOVERED_VERIFIED' && 'ALL ELIGIBLE RECOVERED & VERIFIED'}
              {simulationStatus === 'PAUSED' && 'SIMULATION PAUSED'}
              {simulationStatus === 'IDLE' && 'IDLE'}
            </span>
          </div>

          {/* Quick Simulation Action Buttons */}
          <button
            onClick={startFlashSaleSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Inject 10x traffic surge and inventory latency failure"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Flash Sale</span>
          </button>

          <button
            onClick={restoreServiceHealth}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Restore downstream service latency and error rates"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Restore Health</span>
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Reset Simulation State to Initial Seed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Copilot Trigger */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {failedOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {failedOrdersCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-semibold text-slate-800">Reliability Alerts</span>
                  <span className="text-[10px] text-slate-500">Live stream</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-1.5 font-medium text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{activeIncident.title}</span>
                    </div>
                    <p className="text-[11px] text-rose-600 mt-1">
                      {activeIncident.affected_orders_count} orders impacted. Revenue at risk: $
                      {activeIncident.revenue_at_risk.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{recoveredOrdersCount} Orders Verified</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 mt-1">
                      Idempotent stock locks and PSP captures independently verified.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-rose-400 text-white flex items-center justify-center text-xs font-semibold">
                VH
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs">
                <p className="font-medium text-slate-800">vaishu7777hema@gmail.com</p>
                <p className="text-[11px] text-slate-500">Principal Reliability Lead</p>
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                  <div className="text-[11px] text-slate-600">Region: us-central1 (Simulated)</div>
                  <div className="text-[11px] text-slate-600">Dual-Control Role: Policy Admin</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
