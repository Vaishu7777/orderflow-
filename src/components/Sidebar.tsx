import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  ShoppingBag,
  RefreshCw,
  Activity,
  Binary,
  Cpu,
  FileCheck2,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useSentinel } from '../context/SentinelContext';

export type NavTab =
  | 'overview'
  | 'incidents'
  | 'orders'
  | 'recovery'
  | 'services'
  | 'twin'
  | 'controller'
  | 'ledger'
  | 'copilot'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { orders, incidents, activeIncident, services, controllerState } = useSentinel();

  const failedOrdersCount = orders.filter((o) => o.status === 'FAILED').length;
  const autonomousReadyCount = orders.filter(
    (o) => o.recovery_eligibility === 'AUTONOMOUS' && o.status === 'FAILED'
  ).length;
  const criticalServicesCount = services.filter((s) => s.status !== 'HEALTHY').length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'incidents',
      label: 'Live Incidents',
      icon: AlertOctagon,
      badge: activeIncident?.status === 'ACTIVE' ? '1 CRIT' : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      badge: orders.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'recovery',
      label: 'Recovery Center',
      icon: RefreshCw,
      badge: autonomousReadyCount > 0 ? `${autonomousReadyCount} Ready` : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
    },
    {
      id: 'services',
      label: 'Service Health',
      icon: Activity,
      badge: criticalServicesCount > 0 ? `${criticalServicesCount} Degraded` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'twin',
      label: 'Recovery Twin',
      icon: Binary,
    },
    {
      id: 'controller',
      label: 'Adaptive Controller',
      icon: Cpu,
      badge: controllerState.circuit_breaker,
      badgeColor:
        controllerState.circuit_breaker === 'OPEN'
          ? 'bg-rose-100 text-rose-700'
          : controllerState.circuit_breaker === 'HALF_OPEN'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'ledger',
      label: 'Proof Ledger',
      icon: FileCheck2,
    },
    {
      id: 'copilot',
      label: 'AI Copilot',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-purple-100 text-purple-700 font-semibold',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-[calc(100vh-53px)] select-none">
      {/* Navigation links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Reliability Console
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-50 text-rose-900 font-semibold shadow-xs border border-rose-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-rose-600' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status Card */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Sentinel Engine</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Idempotency: SHA-256 Chained
            <br />
            Retry Budget: {controllerState.retry_budget_current}/{controllerState.retry_budget_max} tokens
          </p>
        </div>
      </div>
    </aside>
  );
};
