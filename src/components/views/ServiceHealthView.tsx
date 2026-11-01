import React from 'react';
import {
  Activity,
  Server,
  Zap,
  DollarSign,
  Package,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Flame,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useSentinel } from '../../context/SentinelContext';

export const ServiceHealthView: React.FC = () => {
  const { services, restoreServiceHealth, injectInventoryFailure, injectPaymentTimeout } = useSentinel();

  // Combine history for multi-line comparison chart
  const timestamps = ['13:50', '13:55', '14:00', '14:05', '14:10'];
  const chartData = timestamps.map((time, idx) => {
    const point: any = { time };
    services.forEach((s) => {
      const h = s.history[idx];
      point[s.id] = h ? h.latency_ms : s.latency_ms;
    });
    return point;
  });

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'order':
        return <Zap className="w-5 h-5" />;
      case 'inventory':
        return <Server className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'fulfillment':
        return <Package className="w-5 h-5" />;
      case 'notification':
        return <BellRing className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Distributed Service Telemetry</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              5 Core Microservices
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time p99 latency, error rates, throughput, and dependencies across upstream and downstream services.
          </p>
        </div>

        {/* Telemetry Injections */}
        <div className="flex items-center gap-2">
          <button
            onClick={injectInventoryFailure}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Spike Inventory Latency</span>
          </button>
          <button
            onClick={injectPaymentTimeout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Spike PSP Gateway</span>
          </button>
          <button
            onClick={restoreServiceHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>Restore All</span>
          </button>
        </div>
      </div>

      {/* Microservice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isCritical = service.status === 'CRITICAL';
          const isDegraded = service.status === 'DEGRADED';
          const isHealthy = service.status === 'HEALTHY';

          return (
            <div
              key={service.id}
              className={`p-5 rounded-2xl border transition-all ${
                isCritical
                  ? 'bg-rose-50/40 border-rose-300 ring-2 ring-rose-100 shadow-sm'
                  : isDegraded
                  ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-100 shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700'
                        : isDegraded
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {getServiceIcon(service.id)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{service.name}</h2>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {service.id}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isCritical
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isDegraded
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">p99 Latency</span>
                  <div className={`text-lg font-bold font-mono ${isCritical ? 'text-rose-600' : isDegraded ? 'text-amber-600' : 'text-slate-900'}`}>
                    {service.latency_ms} ms
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Error Rate</span>
                  <div className={`text-lg font-bold font-mono ${service.error_rate > 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {service.error_rate}%
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Request Throughput</span>
                  <div className="text-sm font-bold text-slate-800 font-mono">
                    {service.request_rate.toLocaleString()} req/s
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">SLA Availability</span>
                  <div className="text-sm font-bold text-emerald-700 font-mono">
                    {service.availability}%
                  </div>
                </div>
              </div>

              {/* Recent diagnostic event */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Recent Status:</span>{' '}
                {service.last_incident || 'Nominal operations'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Latency History Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Service Latency Evolution (p99 ms)</h2>
            <p className="text-xs text-slate-500">Tracking latency degradation and recovery across flash sale surge</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis unit="ms" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="inventory" stroke="#f43f5e" strokeWidth={2.5} name="Inventory Service" />
              <Line type="monotone" dataKey="order" stroke="#f59e0b" strokeWidth={2} name="Order Orchestrator" />
              <Line type="monotone" dataKey="payment" stroke="#0ea5e9" strokeWidth={1.5} name="Payment Broker" />
              <Line type="monotone" dataKey="fulfillment" stroke="#8b5cf6" strokeWidth={1.5} name="Fulfillment" />
              <Line type="monotone" dataKey="notification" stroke="#10b981" strokeWidth={1.5} name="Notifications" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
