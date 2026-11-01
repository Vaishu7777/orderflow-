import React from 'react';
import {
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  AlertOctagon,
  Timer,
  Activity,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useSentinel } from '../../context/SentinelContext';
import { NavTab } from '../Sidebar';

interface OverviewDashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const {
    orders,
    incidents,
    activeIncident,
    services,
    startFlashSaleSimulation,
    recoverEligibleOrders,
    simulationStatus,
    isSimulating,
  } = useSentinel();

  // Dynamic calculations directly from state
  const totalOrders = orders.length;
  const failedOrders = orders.filter((o) => o.status === 'FAILED').length;
  const recoveredVerifiedOrders = orders.filter((o) => o.status === 'RECOVERED_VERIFIED').length;
  const recoveringOrders = orders.filter((o) => o.status === 'RECOVERING').length;
  const blockedOrders = orders.filter((o) => o.recovery_eligibility === 'BLOCKED').length;
  const autonomousEligible = orders.filter(
    (o) => o.recovery_eligibility === 'AUTONOMOUS' && o.status === 'FAILED'
  ).length;

  const totalProblemOrders = failedOrders + recoveredVerifiedOrders + recoveringOrders;
  const recoveryRate =
    totalProblemOrders > 0
      ? Math.round((recoveredVerifiedOrders / totalProblemOrders) * 100)
      : 0;

  const activeIncidentsCount = incidents.filter((i) => i.status === 'ACTIVE').length;
  const avgRecoveryTimeSec = recoveredVerifiedOrders > 0 ? 1.4 : 0;

  const avgAvailability = (
    services.reduce((acc, s) => acc + s.availability, 0) / services.length
  ).toFixed(1);

  // Time-series chart data (dynamic based on current simulation state)
  const volumeData = [
    { time: '13:50', total: 120, failed: 1, recovered: 1 },
    { time: '13:55', total: 145, failed: 2, recovered: 2 },
    { time: '14:00', total: 840, failed: 12, recovered: 4 },
    { time: '14:05', total: 1120, failed: failedOrders > 0 ? 18 : 6, recovered: recoveredVerifiedOrders > 0 ? recoveredVerifiedOrders : 4 },
    { time: '14:10', total: 980, failed: failedOrders, recovered: recoveredVerifiedOrders },
  ];

  const severityData = [
    { name: 'Critical (Flash Sale)', value: activeIncidentsCount > 0 ? 1 : 0, color: '#f43f5e' },
    { name: 'High (Latency)', value: services.some((s) => s.status === 'DEGRADED') ? 1 : 0, color: '#fb923c' },
    { name: 'Medium (Timeouts)', value: 2, color: '#fbbf24' },
    { name: 'Low (Warning)', value: 1, color: '#94a3b8' },
  ];

  const eligibilityData = [
    { name: 'Autonomous (Safe)', count: orders.filter((o) => o.recovery_eligibility === 'AUTONOMOUS').length, fill: '#10b981' },
    { name: 'Needs Approval', count: orders.filter((o) => o.recovery_eligibility === 'NEEDS_APPROVAL').length, fill: '#f59e0b' },
    { name: 'Blocked', count: blockedOrders, fill: '#ef4444' },
  ];

  const serviceHealthData = services.map((s) => ({
    name: s.name.replace(' Service', '').replace(' API', ''),
    latency: s.latency_ms,
    errorRate: s.error_rate,
    status: s.status,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reliability & Recovery Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry, failure correlation, autonomous recovery, and ledger attestation.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {autonomousEligible > 0 && (
            <button
              onClick={recoverEligibleOrders}
              disabled={isSimulating}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Recover {autonomousEligible} Safe Orders</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('recovery')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Recovery Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Orders */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-medium">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{totalOrders}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Simulated live dataset</div>
        </div>

        {/* Failed Orders */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200/70 shadow-xs bg-gradient-to-b from-rose-50/30 to-white">
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-[11px] font-medium">Failed Orders</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600">{failedOrders}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Requires triage / recovery</div>
        </div>

        {/* Verified Recovered */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/70 shadow-xs bg-gradient-to-b from-emerald-50/20 to-white">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5">
            <span className="text-[11px] font-medium">Verified Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{recoveredVerifiedOrders}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">3-way PSP & stock lock</div>
        </div>

        {/* Recovery Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-medium">Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{recoveryRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified / Impacted</div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-medium">Active Incidents</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{activeIncidentsCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            {activeIncidentsCount > 0 ? 'INC-8921 Active' : 'All Clear'}
          </div>
        </div>

        {/* Avg Recovery Time */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-medium">Avg Recovery Time</span>
            <Timer className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900">{avgRecoveryTimeSec}s</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Autonomous resolution</div>
        </div>

        {/* API Health */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-medium">API Health SLA</span>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{avgAvailability}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 core services</div>
        </div>
      </div>

      {/* Active Incident Alert Banner */}
      {activeIncident && activeIncident.status === 'ACTIVE' && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Active Incident: {activeIncident.id}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-200 text-rose-800">
                  {activeIncident.severity}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{activeIncident.title}</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                {activeIncident.root_cause_analysis.probable_root_cause}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span>
                  Affected Services: <strong>{activeIncident.affected_services.join(', ')}</strong>
                </span>
                <span>
                  Orders Trapped: <strong>{activeIncident.affected_orders_count}</strong>
                </span>
                <span>
                  Revenue at Risk: <strong>${activeIncident.revenue_at_risk.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('incidents')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Inspect Root Cause
            </button>
            <button
              onClick={() => onNavigate('recovery')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Open Recovery Center
            </button>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Order Volume Over Time */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Order Volume & Failure Ingress</h2>
              <p className="text-xs text-slate-500">Live order ingress vs failed timeouts during flash sale</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Ingress Volume
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed Orders
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Recovered
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#64748b" fill="url(#volGradient)" strokeWidth={1.5} name="Total Orders" />
                <Area type="monotone" dataKey="failed" stroke="#f43f5e" fill="url(#failGradient)" strokeWidth={2} name="Failed" />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="none" strokeWidth={2} name="Recovered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Recovery Eligibility Distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recovery Policy Triage</h2>
              <p className="text-xs text-slate-500">Autonomous vs Approval vs Blocked</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eligibilityData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                  {eligibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Service Health Trends & Active Incident Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Service Latency & Error Rate Trend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Service Latency Profile</h2>
              <p className="text-xs text-slate-500">Comparing current p99 latency across distributed microservices</p>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              Full telemetry &rarr;
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceHealthData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" unit="ms" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} ms`, 'p99 Latency']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="latency" radius={[0, 6, 6, 0]} barSize={18}>
                  {serviceHealthData.map((s, idx) => (
                    <Cell
                      key={`s-${idx}`}
                      fill={s.status === 'CRITICAL' ? '#f43f5e' : s.status === 'DEGRADED' ? '#fb923c' : '#0ea5e9'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Root Cause & Proof Ledger Quick Summary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sentinel Reliability Safeguards</h2>
              <p className="text-xs text-slate-500">Dual-control policies and cryptographic attestation</p>
            </div>
            <button
              onClick={() => onNavigate('ledger')}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              Proof Ledger &rarr;
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800">Zero Blind Retries Policy</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Orders with payment status UNKNOWN are never retried without authoritative PSP transaction verification.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800">Recovery Digital Twin Pre-Flight</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Simulates expected state and verifies circuit breaker, idempotency tokens, and stock locks before writing transitions.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
              <Timer className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-slate-800">Adaptive Backoff & Retry Budget</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Exponential backoff with full jitter throttles recovery rate to match downstream capacity restoration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
