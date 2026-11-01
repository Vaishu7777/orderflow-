import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Check,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';
import { Order } from '../../types';
import { NavTab } from '../Sidebar';

interface OrdersViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectOrderForTwin?: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigate, onSelectOrderForTwin }) => {
  const { orders, recoverSingleOrder, approveOrderRecovery } = useSentinel();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_id.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Lifecycle Registry</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
              {orders.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete inventory reservation and payment transaction audit trail across flash sale traffic.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, email..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="FAILED">Failed</option>
            <option value="RECOVERED_VERIFIED">Recovered & Verified</option>
            <option value="PROCESSING">Processing</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Inventory</th>
                <th className="py-3 px-3">Eligibility</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.id}</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">{order.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{order.customer_email}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ({order.items[0]?.name})
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">${order.amount.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'RECOVERED_VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {order.inventory_status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        order.recovery_eligibility === 'AUTONOMOUS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.recovery_eligibility === 'NEEDS_APPROVAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {order.recovery_eligibility}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (onSelectOrderForTwin) onSelectOrderForTwin(order.id);
                        onNavigate('twin');
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Inspect Digital Twin"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-sm font-bold text-slate-900">{selectedOrder.id}</span>
                <p className="text-xs text-slate-500">{selectedOrder.customer_name} &bull; {selectedOrder.customer_email}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700">Purchased SKUs:</span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name} ({it.sku})</span>
                    <span className="font-semibold">${(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Idempotency Key:</span>
              <div className="p-2 rounded bg-slate-100 font-mono text-[11px] text-slate-700 break-all border border-slate-200">
                {selectedOrder.idempotency_key}
              </div>
            </div>

            {selectedOrder.failure_reason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800">
                <strong>Failure Diagnostic:</strong> {selectedOrder.failure_reason}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
