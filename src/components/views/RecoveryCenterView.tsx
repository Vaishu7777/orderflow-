import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Check,
  Eye,
  SlidersHorizontal,
  Lock,
  PauseOctagon,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';
import { Order, RecoveryEligibility, OrderStatus } from '../../types';
import { NavTab } from '../Sidebar';

interface RecoveryCenterViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectOrderForTwin?: (orderId: string) => void;
}

export const RecoveryCenterView: React.FC<RecoveryCenterViewProps> = ({
  onNavigate,
  onSelectOrderForTwin,
}) => {
  const {
    orders,
    activeOrderFilter,
    setActiveOrderFilter,
    recoverEligibleOrders,
    approveOrderRecovery,
    recoverSingleOrder,
    verifyRecoveredOrders,
    stopRecovery,
    isSimulating,
    simulationStatus,
    controllerState,
  } = useSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Filter tab
    if (activeOrderFilter === 'AUTONOMOUS' && order.recovery_eligibility !== 'AUTONOMOUS') return false;
    if (activeOrderFilter === 'NEEDS_APPROVAL' && order.recovery_eligibility !== 'NEEDS_APPROVAL') return false;
    if (activeOrderFilter === 'BLOCKED' && order.recovery_eligibility !== 'BLOCKED') return false;
    if (activeOrderFilter === 'RECOVERED_VERIFIED' && order.status !== 'RECOVERED_VERIFIED') return false;
    if (activeOrderFilter === 'FAILED' && order.status !== 'FAILED') return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_id.toLowerCase().includes(q) ||
        order.customer_email.toLowerCase().includes(q) ||
        order.idempotency_key.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const autonomousCount = orders.filter((o) => o.recovery_eligibility === 'AUTONOMOUS' && o.status === 'FAILED').length;
  const approvalCount = orders.filter((o) => o.recovery_eligibility === 'NEEDS_APPROVAL').length;
  const blockedCount = orders.filter((o) => o.recovery_eligibility === 'BLOCKED').length;
  const verifiedCount = orders.filter((o) => o.status === 'RECOVERED_VERIFIED').length;

  const handleApprove = async (orderId: string) => {
    await approveOrderRecovery(orderId);
    setActionSuccessMessage(`Order ${orderId} approved by operator. Policy cleared for autonomous recovery.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleRecoverSingle = async (orderId: string) => {
    const success = await recoverSingleOrder(orderId);
    if (success) {
      setActionSuccessMessage(`Order ${orderId} successfully recovered & cryptographically attested!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Recovery Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Reliability Engine v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Safely triage, simulate, approve, and execute order recovery without risk of double-charging or phantom stock locks.
          </p>
        </div>

        {/* Global Batch Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('twin')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulate in Twin</span>
          </button>

          <button
            onClick={recoverEligibleOrders}
            disabled={isSimulating || autonomousCount === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
              autonomousCount > 0 && !isSimulating
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Recover Eligible ({autonomousCount})</span>
          </button>

          <button
            onClick={verifyRecoveredOrders}
            disabled={isSimulating || verifiedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verify Results</span>
          </button>

          <button
            onClick={stopRecovery}
            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            title="Emergency Halt Recovery Controller"
          >
            <PauseOctagon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => onNavigate('ledger')}
            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            View in Proof Ledger &rarr;
          </button>
        </div>
      )}

      {/* Safety Policy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="flex items-center justify-between font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>AUTONOMOUS ELIGIBLE</span>
            </span>
            <span className="text-base font-bold">{autonomousCount}</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Confirmed stock cache + captured payment + verified idempotency. Zero-risk automated execution.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center justify-between font-semibold text-amber-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>NEEDS SRE APPROVAL</span>
            </span>
            <span className="text-base font-bold">{approvalCount}</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Ambiguous payment status (PSP timeout) or multiple retries. Operator reconciliation required.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80">
          <div className="flex items-center justify-between font-semibold text-rose-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>STRICTLY BLOCKED</span>
            </span>
            <span className="text-base font-bold">{blockedCount}</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">
            Physical stockout or permanent card decline. Recovery forbidden to protect inventory & customer trust.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'AUTONOMOUS', label: 'Autonomous', count: autonomousCount },
            { id: 'NEEDS_APPROVAL', label: 'Needs Approval', count: approvalCount },
            { id: 'BLOCKED', label: 'Blocked', count: blockedCount },
            { id: 'RECOVERED_VERIFIED', label: 'Verified', count: verifiedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveOrderFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeOrderFilter === tab.id
                  ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, customer, key..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Failure Reason</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Inventory</th>
                <th className="py-3 px-3">Eligibility</th>
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No orders match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isAutonomous = order.recovery_eligibility === 'AUTONOMOUS';
                  const isNeedsApproval = order.recovery_eligibility === 'NEEDS_APPROVAL';
                  const isBlocked = order.recovery_eligibility === 'BLOCKED';
                  const isVerified = order.status === 'RECOVERED_VERIFIED';
                  const isRecovering = order.status === 'RECOVERING';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Order Details */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{order.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {order.idempotency_key.slice(0, 16)}...
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                        <div className="text-[10px] text-slate-500">{order.customer_id}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        ${order.amount.toFixed(2)}
                      </td>

                      {/* Failure Reason */}
                      <td className="py-3 px-3 max-w-xs">
                        {order.failure_reason ? (
                          <span className="text-[11px] text-rose-700 line-clamp-1" title={order.failure_reason}>
                            {order.failure_reason}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Nominal
                          </span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            order.payment_status === 'CAPTURED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.payment_status === 'AUTHORIZED'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : order.payment_status === 'UNKNOWN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>

                      {/* Inventory */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            order.inventory_status === 'RESERVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.inventory_status === 'CONFIRMED_AVAILABLE'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : order.inventory_status === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.inventory_status}
                        </span>
                      </td>

                      {/* Eligibility */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            isAutonomous
                              ? 'bg-emerald-100 text-emerald-800'
                              : isNeedsApproval
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isAutonomous && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                          {isNeedsApproval && <HelpCircle className="w-2.5 h-2.5 text-amber-600" />}
                          {isBlocked && <XCircle className="w-2.5 h-2.5 text-rose-600" />}
                          {order.recovery_eligibility}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="py-3 px-3">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            VERIFIED
                          </span>
                        ) : isRecovering ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            RECOVERING
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">UNVERIFIED</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isAutonomous && order.status === 'FAILED' && (
                            <button
                              onClick={() => handleRecoverSingle(order.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs cursor-pointer"
                              title="Recover this order safely"
                            >
                              Recover
                            </button>
                          )}

                          {isNeedsApproval && (
                            <button
                              onClick={() => handleApprove(order.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer"
                              title="Verify PSP reconciliation and approve"
                            >
                              Approve
                            </button>
                          )}

                          {isBlocked && (
                            <span className="text-[10px] text-rose-500 font-semibold px-2 py-1 bg-rose-50 rounded">
                              Blocked
                            </span>
                          )}

                          <button
                            onClick={() => {
                              if (onSelectOrderForTwin) onSelectOrderForTwin(order.id);
                              onNavigate('twin');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Inspect in Digital Twin"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{selectedOrder.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrder.recovery_eligibility === 'AUTONOMOUS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.recovery_eligibility === 'NEEDS_APPROVAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedOrder.recovery_eligibility}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: {selectedOrder.customer_name} ({selectedOrder.customer_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Items */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-700">Order Items:</span>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-slate-700">
                    <span>
                      {item.quantity}x {item.name} ({item.sku})
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span>${selectedOrder.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Idempotency & Safety Token */}
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-700">Cryptographic Idempotency Key:</span>
              <div className="p-2 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700 break-all border border-slate-200">
                {selectedOrder.idempotency_key}
              </div>
            </div>

            {/* Failure Diagnostics */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs space-y-1">
              <span className="font-semibold text-rose-900">Failure Diagnostic:</span>
              <p className="text-rose-700">{selectedOrder.failure_reason || 'No failure recorded.'}</p>
              <div className="pt-1 text-[11px] text-rose-800 font-medium">
                Recommended Policy: {selectedOrder.recommended_action}
              </div>
            </div>

            {/* Verification Details if present */}
            {selectedOrder.verification_details && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs space-y-1">
                <span className="font-semibold text-emerald-900">3-Phase Attestation:</span>
                <div className="text-emerald-700 text-[11px] space-y-0.5">
                  <div>&bull; PSP Gateway Reference: {selectedOrder.verification_details.psp_reference}</div>
                  <div>&bull; Warehouse Physical Stock Lock: Verified (WH-East)</div>
                  <div>&bull; Customer Order Confirmation: Dispatched</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedOrder.recovery_eligibility === 'NEEDS_APPROVAL' && (
                <button
                  onClick={() => {
                    handleApprove(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Approve Recovery Policy
                </button>
              )}

              {selectedOrder.recovery_eligibility === 'AUTONOMOUS' && selectedOrder.status === 'FAILED' && (
                <button
                  onClick={() => {
                    handleRecoverSingle(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Execute Autonomous Recovery
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
