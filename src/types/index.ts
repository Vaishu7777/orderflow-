export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'RECOVERING'
  | 'RECOVERED_VERIFIED'
  | 'RECOVERY_BLOCKED';

export type PaymentStatus =
  | 'CAPTURED'
  | 'AUTHORIZED'
  | 'PENDING'
  | 'UNKNOWN'
  | 'FAILED'
  | 'REFUNDED';

export type InventoryStatus =
  | 'RESERVED'
  | 'CONFIRMED_AVAILABLE'
  | 'TIMEOUT_UNKNOWN'
  | 'OUT_OF_STOCK';

export type RecoveryEligibility = 'AUTONOMOUS' | 'NEEDS_APPROVAL' | 'BLOCKED';

export type FailureType =
  | 'INVENTORY_TIMEOUT'
  | 'INVENTORY_STOCKOUT'
  | 'PAYMENT_TIMEOUT'
  | 'RATE_LIMIT_429'
  | 'GATEWAY_504'
  | 'DUPLICATE_RISK'
  | null;

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface VerificationDetails {
  psp_confirmed: boolean;
  inventory_locked: boolean;
  notification_sent: boolean;
  verified_at?: string;
  psp_reference?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  items: OrderItem[];
  status: OrderStatus;
  failure_reason: string | null;
  failure_type: FailureType;
  payment_status: PaymentStatus;
  inventory_status: InventoryStatus;
  recovery_eligibility: RecoveryEligibility;
  recommended_action: string;
  idempotency_key: string;
  retry_count: number;
  max_retries: number;
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  verification_details?: VerificationDetails;
  created_at: string;
  updated_at: string;
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'ALERT' | 'METRIC' | 'DECISION' | 'RECOVERY' | 'VERIFICATION';
}

export interface Incident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  affected_services: string[];
  affected_orders_count: number;
  revenue_at_risk: number;
  started_at: string;
  resolved_at?: string;
  root_cause_analysis: {
    observed_evidence: string[];
    probable_root_cause: string;
    confidence_level: 'HIGH' | 'MODERATE' | 'LOW';
    confidence_percentage: number;
    recommended_action: string;
  };
  timeline: IncidentTimelineEvent[];
}

export type ServiceId = 'order' | 'inventory' | 'payment' | 'fulfillment' | 'notification';

export interface ServiceHealthHistoryPoint {
  time: string;
  latency_ms: number;
  error_rate: number;
  request_rate: number;
}

export interface ServiceHealth {
  id: ServiceId;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  latency_ms: number;
  error_rate: number; // percentage
  request_rate: number; // req/sec
  availability: number; // percentage e.g. 99.8%
  last_incident?: string;
  dependencies: string[];
  history: ServiceHealthHistoryPoint[];
}

export interface AdaptiveControllerState {
  circuit_breaker: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  retry_budget_current: number;
  retry_budget_max: number;
  recovery_traffic_pct: number;
  current_backoff_ms: number;
  throttle_status: 'NOMINAL' | 'THROTTLED' | 'HALTED';
  queue_size: number;
}

export interface ProofLedgerEntry {
  id: string;
  block_index: number;
  timestamp: string;
  incident_id: string;
  order_id: string;
  action: string;
  previous_state: string;
  new_state: string;
  decision_reason: string;
  verification_result: string;
  payload_hash: string;
  previous_hash: string;
  current_hash: string;
  tampered?: boolean;
}

export interface LedgerVerificationResult {
  is_valid: boolean;
  total_blocks: number;
  tampered_index: number | null;
  message: string;
  verified_at: string;
}

export interface RecoveryTwinSimulationResult {
  order_id: string;
  current_state: OrderStatus;
  proposed_action: string;
  expected_state: OrderStatus;
  safety_checks: {
    name: string;
    passed: boolean;
    reason: string;
  }[];
  overall_verdict: 'SAFE_TO_EXECUTE' | 'REQUIRES_APPROVAL' | 'BLOCKED';
  potential_risks: string[];
}
