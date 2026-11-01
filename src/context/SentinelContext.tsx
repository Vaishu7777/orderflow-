import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Order,
  Incident,
  ServiceHealth,
  AdaptiveControllerState,
  ProofLedgerEntry,
  LedgerVerificationResult,
  RecoveryTwinSimulationResult,
} from '../types';
import {
  initialServices,
  initialIncident,
  initialOrders,
  initialControllerState,
  initialProofLedger,
} from '../lib/seedData';
import {
  createLedgerBlock,
  verifyProofLedger,
  exportLedgerData,
} from '../lib/cryptoLedger';

export type SimulationStatus =
  | 'IDLE'
  | 'FLASH_SALE_SPIKE'
  | 'RECOVERING'
  | 'RECOVERED_VERIFIED'
  | 'PAUSED';

interface SentinelContextType {
  orders: Order[];
  incidents: Incident[];
  activeIncident: Incident;
  services: ServiceHealth[];
  controllerState: AdaptiveControllerState;
  ledger: ProofLedgerEntry[];
  simulationStatus: SimulationStatus;
  isSimulating: boolean;
  verificationResult: LedgerVerificationResult | null;
  isVerifyingLedger: boolean;
  tamperDetectedIndex: number | null;
  activeOrderFilter: string;
  setActiveOrderFilter: (filter: string) => void;

  // Actions
  startFlashSaleSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  injectInventoryFailure: () => void;
  injectPaymentTimeout: () => void;
  restoreServiceHealth: () => void;

  // Recovery Workflow
  simulateOrderRecovery: (orderId: string) => RecoveryTwinSimulationResult | null;
  approveOrderRecovery: (orderId: string) => Promise<void>;
  recoverEligibleOrders: () => Promise<void>;
  recoverSingleOrder: (orderId: string) => Promise<boolean>;
  verifyRecoveredOrders: () => Promise<void>;
  stopRecovery: () => void;

  // Ledger
  verifyLedgerIntegrity: () => Promise<LedgerVerificationResult>;
  simulateTamperLedger: () => void;
  repairLedger: () => void;
  exportLedger: (format: 'csv' | 'json') => void;
}

const SentinelContext = createContext<SentinelContextType | null>(null);

export const SentinelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [incidents, setIncidents] = useState<Incident[]>([initialIncident]);
  const [services, setServices] = useState<ServiceHealth[]>(initialServices);
  const [controllerState, setControllerState] = useState<AdaptiveControllerState>(initialControllerState);
  const [ledger, setLedger] = useState<ProofLedgerEntry[]>(initialProofLedger);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('FLASH_SALE_SPIKE');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<LedgerVerificationResult | null>(null);
  const [isVerifyingLedger, setIsVerifyingLedger] = useState<boolean>(false);
  const [tamperDetectedIndex, setTamperDetectedIndex] = useState<number | null>(null);
  const [activeOrderFilter, setActiveOrderFilter] = useState<string>('ALL');

  const activeIncident = incidents[0] || initialIncident;

  // Run initial ledger integrity check on mount
  useEffect(() => {
    verifyProofLedger(ledger).then(setVerificationResult);
  }, []);

  // Update dynamic incident stats whenever orders change
  useEffect(() => {
    const failedCount = orders.filter((o) => o.status === 'FAILED' || o.status === 'RECOVERING').length;
    const totalRisk = orders
      .filter((o) => o.status === 'FAILED' || o.status === 'RECOVERING')
      .reduce((sum, o) => sum + o.amount, 0);

    setIncidents((prev) =>
      prev.map((inc) => ({
        ...inc,
        affected_orders_count: failedCount,
        revenue_at_risk: Number(totalRisk.toFixed(2)),
        status: failedCount === 0 ? 'RESOLVED' : 'ACTIVE',
      }))
    );

    setControllerState((prev) => ({
      ...prev,
      queue_size: orders.filter((o) => o.recovery_eligibility === 'AUTONOMOUS' && o.status === 'FAILED').length,
    }));
  }, [orders]);

  // Start Flash Sale Simulation
  const startFlashSaleSimulation = useCallback(async () => {
    setIsSimulating(true);
    setSimulationStatus('FLASH_SALE_SPIKE');

    // Spike inventory & order services
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === 'inventory') {
          return {
            ...s,
            status: 'CRITICAL',
            latency_ms: 2890,
            error_rate: 44.8,
            request_rate: 3820,
            availability: 94.2,
          };
        }
        if (s.id === 'order') {
          return {
            ...s,
            status: 'DEGRADED',
            latency_ms: 680,
            error_rate: 19.5,
            request_rate: 2950,
            availability: 97.9,
          };
        }
        return s;
      })
    );

    setControllerState((prev) => ({
      ...prev,
      circuit_breaker: 'HALF_OPEN',
      throttle_status: 'THROTTLED',
      recovery_traffic_pct: 25,
      current_backoff_ms: 1500,
    }));

    // Record simulation start event in ledger
    const block = await createLedgerBlock(
      {
        incident_id: activeIncident.id,
        order_id: 'SYSTEM_EVENT',
        action: 'FLASH_SALE_SIMULATION_STARTED',
        previous_state: 'IDLE',
        new_state: 'FLASH_SALE_SPIKE',
        decision_reason: 'Simulated 10x ingress spike: Inventory DB lock contention and 504 timeouts injected.',
        verification_result: 'PASS: Anomaly correlated and tracked',
      },
      ledger
    );

    setLedger((prev) => [...prev, block]);
    setIsSimulating(false);
  }, [activeIncident.id, ledger]);

  const pauseSimulation = useCallback(() => {
    setSimulationStatus('PAUSED');
  }, []);

  const resumeSimulation = useCallback(() => {
    setSimulationStatus('FLASH_SALE_SPIKE');
  }, []);

  const resetSimulation = useCallback(() => {
    setOrders(initialOrders);
    setServices(initialServices);
    setIncidents([initialIncident]);
    setControllerState(initialControllerState);
    setLedger(initialProofLedger);
    setSimulationStatus('FLASH_SALE_SPIKE');
    setTamperDetectedIndex(null);
    verifyProofLedger(initialProofLedger).then(setVerificationResult);
  }, []);

  const injectInventoryFailure = useCallback(async () => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === 'inventory'
          ? {
              ...s,
              status: 'CRITICAL',
              latency_ms: 3600,
              error_rate: 62.4,
              request_rate: 4200,
              availability: 91.5,
              last_incident: 'Injected severe inventory deadlock',
            }
          : s
      )
    );

    setControllerState((prev) => ({
      ...prev,
      circuit_breaker: 'OPEN',
      throttle_status: 'HALTED',
      recovery_traffic_pct: 0,
      current_backoff_ms: 5000,
    }));

    const block = await createLedgerBlock(
      {
        incident_id: activeIncident.id,
        order_id: 'SYSTEM_INJECT',
        action: 'INVENTORY_FAILURE_INJECTED',
        previous_state: 'DEGRADED',
        new_state: 'CIRCUIT_BREAKER_OPEN',
        decision_reason: 'Injected 62% error rate spike. Circuit breaker tripped to OPEN to prevent cascade.',
        verification_result: 'PASS: Protective circuit trip verified',
      },
      ledger
    );

    setLedger((prev) => [...prev, block]);
  }, [activeIncident.id, ledger]);

  const injectPaymentTimeout = useCallback(async () => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === 'payment'
          ? {
              ...s,
              status: 'DEGRADED',
              latency_ms: 2150,
              error_rate: 31.8,
              request_rate: 1800,
              availability: 96.2,
              last_incident: 'Injected payment gateway socket timeouts',
            }
          : s
      )
    );

    const block = await createLedgerBlock(
      {
        incident_id: activeIncident.id,
        order_id: 'SYSTEM_INJECT',
        action: 'PAYMENT_TIMEOUT_INJECTED',
        previous_state: 'HEALTHY',
        new_state: 'DEGRADED',
        decision_reason: 'Injected 31.8% PSP timeouts. Policy blocks blind payment retry without reconciliation.',
        verification_result: 'PASS: Idempotency safety policy enforced',
      },
      ledger
    );

    setLedger((prev) => [...prev, block]);
  }, [activeIncident.id, ledger]);

  // Restore Service Health
  const restoreServiceHealth = useCallback(async () => {
    setServices((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'HEALTHY',
        latency_ms: s.id === 'inventory' ? 38 : s.id === 'order' ? 44 : s.id === 'payment' ? 110 : 35,
        error_rate: 0.1,
        availability: 99.98,
      }))
    );

    setControllerState((prev) => ({
      ...prev,
      circuit_breaker: 'CLOSED',
      throttle_status: 'NOMINAL',
      recovery_traffic_pct: 100,
      current_backoff_ms: 100,
    }));

    const block = await createLedgerBlock(
      {
        incident_id: activeIncident.id,
        order_id: 'SYSTEM_RESTORE',
        action: 'SERVICE_HEALTH_RESTORED',
        previous_state: 'DEGRADED',
        new_state: 'HEALTHY',
        decision_reason: 'Database pool scaled; inventory cluster p99 normalized to 38ms. Circuit breaker CLOSED.',
        verification_result: 'PASS: Health probe SLA 99.98% verified',
      },
      ledger
    );

    setLedger((prev) => [...prev, block]);
  }, [activeIncident.id, ledger]);

  // Simulate Order Recovery (Recovery Twin)
  const simulateOrderRecovery = useCallback(
    (orderId: string): RecoveryTwinSimulationResult | null => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return null;

      const inventoryService = services.find((s) => s.id === 'inventory');
      const isInventoryHealthy = (inventoryService?.latency_ms ?? 9999) < 500 && (inventoryService?.error_rate ?? 100) < 5.0;

      const isStockAvailable = order.inventory_status !== 'OUT_OF_STOCK';
      const isPaymentSafe = order.payment_status === 'CAPTURED' || order.payment_status === 'AUTHORIZED';
      const hasRetryBudget = controllerState.retry_budget_current > 0;
      const isCircuitPermissive = controllerState.circuit_breaker !== 'OPEN';
      const hasValidIdempotency = !!order.idempotency_key && order.idempotency_key.startsWith('idem_sec_');

      const safetyChecks = [
        {
          name: 'Downstream Service Health (Inventory & Order SLA)',
          passed: isInventoryHealthy,
          reason: isInventoryHealthy
            ? `Inventory latency (${inventoryService?.latency_ms}ms) is nominal.`
            : `Inventory service is degraded (${inventoryService?.latency_ms}ms, ${inventoryService?.error_rate}% error rate).`,
        },
        {
          name: 'Stock Reservation Availability Lock',
          passed: isStockAvailable,
          reason: isStockAvailable
            ? 'Stock reservation confirmed in warehouse cache.'
            : 'PHYSICAL STOCKOUT: SKU allocation is zero across all fulfillment centers.',
        },
        {
          name: 'Payment Authorization & Financial Protection',
          passed: isPaymentSafe,
          reason: isPaymentSafe
            ? `Payment status is ${order.payment_status}. No risk of duplicate customer charge.`
            : `Payment status is ${order.payment_status}. Authoritative reconciliation required before replay.`,
        },
        {
          name: 'Adaptive Retry Budget Allocation',
          passed: hasRetryBudget,
          reason: hasRetryBudget
            ? `${controllerState.retry_budget_current} retry tokens available in budget.`
            : 'Retry budget exhausted for current rolling window.',
        },
        {
          name: 'Idempotency Key & Deduplication Token',
          passed: hasValidIdempotency,
          reason: hasValidIdempotency
            ? `Cryptographic idempotency key valid: ${order.idempotency_key.slice(0, 18)}...`
            : 'Missing or malformed idempotency token.',
        },
        {
          name: 'Circuit Breaker Permissiveness',
          passed: isCircuitPermissive,
          reason: isCircuitPermissive
            ? `Circuit breaker is ${controllerState.circuit_breaker}.`
            : 'Circuit breaker is OPEN. All recovery requests must be throttled.',
        },
      ];

      let overallVerdict: 'SAFE_TO_EXECUTE' | 'REQUIRES_APPROVAL' | 'BLOCKED' = 'SAFE_TO_EXECUTE';
      const potentialRisks: string[] = [];

      if (!isStockAvailable || order.recovery_eligibility === 'BLOCKED' || order.payment_status === 'FAILED') {
        overallVerdict = 'BLOCKED';
        potentialRisks.push('Attempting recovery would violate strict inventory and anti-fraud business policies.');
      } else if (!isPaymentSafe || order.recovery_eligibility === 'NEEDS_APPROVAL' || order.retry_count >= 2) {
        overallVerdict = 'REQUIRES_APPROVAL';
        potentialRisks.push('Risk of charging customer twice or desynchronizing ledger state without manual PSP approval.');
      }

      if (!isInventoryHealthy) {
        potentialRisks.push('High latency on inventory cluster may cause recovery attempt to timeout again.');
      }

      return {
        order_id: order.id,
        current_state: order.status,
        proposed_action:
          overallVerdict === 'BLOCKED'
            ? 'CANCEL_AND_REFUND'
            : overallVerdict === 'REQUIRES_APPROVAL'
            ? 'PSP_RECONCILE_THEN_RESERVE'
            : 'IDEMPOTENT_RESERVE_AND_CAPTURE',
        expected_state: overallVerdict === 'BLOCKED' ? 'RECOVERY_BLOCKED' : 'RECOVERED_VERIFIED',
        safety_checks: safetyChecks,
        overall_verdict: overallVerdict,
        potential_risks: potentialRisks,
      };
    },
    [orders, services, controllerState]
  );

  // Approve Order Recovery (from NEEDS_APPROVAL to AUTONOMOUS)
  const approveOrderRecovery = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const updatedOrder: Order = {
        ...order,
        recovery_eligibility: 'AUTONOMOUS',
        payment_status: 'CAPTURED',
        recommended_action: 'Human SRE approved recovery following PSP payment verification.',
        updated_at: new Date().toISOString(),
      };

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));

      const block = await createLedgerBlock(
        {
          incident_id: activeIncident.id,
          order_id: order.id,
          action: 'HUMAN_POLICY_APPROVAL',
          previous_state: order.status,
          new_state: 'APPROVED_FOR_AUTONOMOUS_RECOVERY',
          decision_reason: `SRE reconciled payment idempotency token ${order.idempotency_key}. Marked order AUTONOMOUS.`,
          verification_result: 'PASS: Authorized by SRE operator; dual-control logged',
        },
        ledger
      );

      setLedger((prev) => [...prev, block]);
    },
    [orders, activeIncident.id, ledger]
  );

  // Recover Single Order
  const recoverSingleOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return false;

      if (order.recovery_eligibility === 'BLOCKED') {
        return false;
      }

      // Mark recovering
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'RECOVERING' as const } : o))
      );

      // Decrement retry budget
      setControllerState((prev) => ({
        ...prev,
        retry_budget_current: Math.max(0, prev.retry_budget_current - 1),
      }));

      // Simulate network verification delay
      await new Promise((r) => setTimeout(r, 600));

      const now = new Date().toISOString();
      const pspRef = `ch_${order.id.replace('ORD-', '')}_rec_${Math.random().toString(36).substring(2, 8)}`;

      const verifiedOrder: Order = {
        ...order,
        status: 'RECOVERED_VERIFIED',
        inventory_status: 'RESERVED',
        payment_status: 'CAPTURED',
        failure_reason: null,
        failure_type: null,
        verification_status: 'VERIFIED',
        verification_details: {
          psp_confirmed: true,
          inventory_locked: true,
          notification_sent: true,
          verified_at: now,
          psp_reference: pspRef,
        },
        updated_at: now,
      };

      setOrders((prev) => prev.map((o) => (o.id === orderId ? verifiedOrder : o)));

      const block = await createLedgerBlock(
        {
          incident_id: activeIncident.id,
          order_id: order.id,
          action: 'AUTONOMOUS_RECOVERY_EXECUTE',
          previous_state: 'FAILED',
          new_state: 'RECOVERED_VERIFIED',
          decision_reason: `Executed safe recovery via idempotency key ${order.idempotency_key}. Stock reserved; payment captured.`,
          verification_result: `PASS: 3-way verified (PSP: ${pspRef}, Warehouse lock: WH-1, Customer notify: sent)`,
        },
        ledger
      );

      setLedger((prev) => [...prev, block]);
      return true;
    },
    [orders, activeIncident.id, ledger]
  );

  // Recover All Eligible Orders in Batch
  const recoverEligibleOrders = useCallback(async () => {
    setIsSimulating(true);
    setSimulationStatus('RECOVERING');

    const eligibleOrders = orders.filter(
      (o) => o.recovery_eligibility === 'AUTONOMOUS' && (o.status === 'FAILED' || o.status === 'PENDING')
    );

    let currentLedger = [...ledger];

    for (const order of eligibleOrders) {
      // Small stagger to simulate adaptive throttle & jitter
      await new Promise((r) => setTimeout(r, 400));

      const now = new Date().toISOString();
      const pspRef = `ch_${order.id.replace('ORD-', '')}_rec_${Math.random().toString(36).substring(2, 8)}`;

      const updatedOrder: Order = {
        ...order,
        status: 'RECOVERED_VERIFIED',
        inventory_status: 'RESERVED',
        payment_status: 'CAPTURED',
        failure_reason: null,
        failure_type: null,
        verification_status: 'VERIFIED',
        verification_details: {
          psp_confirmed: true,
          inventory_locked: true,
          notification_sent: true,
          verified_at: now,
          psp_reference: pspRef,
        },
        updated_at: now,
      };

      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));

      setControllerState((prev) => ({
        ...prev,
        retry_budget_current: Math.max(0, prev.retry_budget_current - 1),
      }));

      const block = await createLedgerBlock(
        {
          incident_id: activeIncident.id,
          order_id: order.id,
          action: 'BATCH_AUTONOMOUS_RECOVERY',
          previous_state: 'FAILED',
          new_state: 'RECOVERED_VERIFIED',
          decision_reason: `Batch recovery policy executed. Stock lock secured under idempotency ${order.idempotency_key}.`,
          verification_result: `PASS: Independent PSP capture & inventory lock verified (${pspRef})`,
        },
        currentLedger
      );

      currentLedger = [...currentLedger, block];
      setLedger(currentLedger);
    }

    setSimulationStatus('RECOVERED_VERIFIED');
    setIsSimulating(false);
  }, [orders, activeIncident.id, ledger]);

  // Independently verify recovered orders
  const verifyRecoveredOrders = useCallback(async () => {
    setIsSimulating(true);
    await new Promise((r) => setTimeout(r, 800));

    const now = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.status === 'RECOVERED_VERIFIED') {
          return {
            ...o,
            verification_status: 'VERIFIED',
            verification_details: {
              psp_confirmed: true,
              inventory_locked: true,
              notification_sent: true,
              verified_at: now,
              psp_reference: o.verification_details?.psp_reference || 'ch_verified_reconciled',
            },
          };
        }
        return o;
      })
    );

    const block = await createLedgerBlock(
      {
        incident_id: activeIncident.id,
        order_id: 'SYSTEM_AUDIT',
        action: 'INDEPENDENT_3WAY_VERIFICATION',
        previous_state: 'RECOVERED',
        new_state: 'VERIFIED_AUDITED',
        decision_reason: 'Triple-attestation audit: PSP transaction status + Warehouse physical lock + Webhook receipt.',
        verification_result: 'PASS: 100% of recovered orders independently verified against authoritative ledgers',
      },
      ledger
    );

    setLedger((prev) => [...prev, block]);
    setIsSimulating(false);
  }, [activeIncident.id, ledger]);

  const stopRecovery = useCallback(() => {
    setControllerState((prev) => ({
      ...prev,
      circuit_breaker: 'OPEN',
      throttle_status: 'HALTED',
      recovery_traffic_pct: 0,
    }));
    setSimulationStatus('PAUSED');
  }, []);

  // Verify Ledger Integrity
  const verifyLedgerIntegrity = useCallback(async () => {
    setIsVerifyingLedger(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await verifyProofLedger(ledger);
    setVerificationResult(result);
    setTamperDetectedIndex(result.tampered_index);
    setIsVerifyingLedger(false);
    return result;
  }, [ledger]);

  // Simulate Tampering with the Ledger
  const simulateTamperLedger = useCallback(() => {
    if (ledger.length < 3) return;

    // Tamper with block #2 (change previous_state and decision_reason without recalculating hashes)
    const targetIdx = 2;
    const tamperedLedger = ledger.map((entry, idx) => {
      if (idx === targetIdx) {
        return {
          ...entry,
          decision_reason: '[TAMPERED BY ATTACKER] Unauthorized manual state override without safety checks',
          new_state: 'TAMPERED_BYPASS',
          tampered: true,
        };
      }
      return entry;
    });

    setLedger(tamperedLedger);
    // Automatically trigger verification to highlight the breach!
    verifyProofLedger(tamperedLedger).then((res) => {
      setVerificationResult(res);
      setTamperDetectedIndex(targetIdx);
    });
  }, [ledger]);

  // Repair Ledger
  const repairLedger = useCallback(async () => {
    // Re-verify and rebuild ledger with untampered state
    resetSimulation();
  }, [resetSimulation]);

  // Export Ledger
  const exportLedger = useCallback(
    (format: 'csv' | 'json') => {
      const data = exportLedgerData(ledger, format);
      const mime = format === 'json' ? 'application/json' : 'text/csv';
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orderflow-sentinel-proof-ledger-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [ledger]
  );

  return (
    <SentinelContext.Provider
      value={{
        orders,
        incidents,
        activeIncident,
        services,
        controllerState,
        ledger,
        simulationStatus,
        isSimulating,
        verificationResult,
        isVerifyingLedger,
        tamperDetectedIndex,
        activeOrderFilter,
        setActiveOrderFilter,

        startFlashSaleSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        injectInventoryFailure,
        injectPaymentTimeout,
        restoreServiceHealth,

        simulateOrderRecovery,
        approveOrderRecovery,
        recoverEligibleOrders,
        recoverSingleOrder,
        verifyRecoveredOrders,
        stopRecovery,

        verifyLedgerIntegrity,
        simulateTamperLedger,
        repairLedger,
        exportLedger,
      }}
    >
      {children}
    </SentinelContext.Provider>
  );
};

export function useSentinel(): SentinelContextType {
  const context = useContext(SentinelContext);
  if (!context) {
    throw new Error('useSentinel must be used within a SentinelProvider');
  }
  return context;
}
