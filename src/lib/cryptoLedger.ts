import { ProofLedgerEntry, LedgerVerificationResult } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates SHA-256 hash of a string using Web Crypto API.
 */
export async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Pure JS fallback for lightweight deterministic 64-character hash if Web Crypto isn't available
    return pseudoSha256(message);
  }
}

/**
 * Pure JS SHA-like hashing fallback
 */
function pseudoSha256(ascii: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let ch = 0; ch < ascii.length; ch++) {
    const code = ascii.charCodeAt(ch);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
    h3 = Math.imul(h3 ^ code, 2246822507);
    h4 = Math.imul(h4 ^ code, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677) ^ Math.imul(h3 ^ (h3 >>> 13), 2654435761);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 13), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909) ^ Math.imul(h1 ^ (h1 >>> 13), 2246822507);

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return (p1 + p2 + p3 + p4 + p2 + p1 + p4 + p3).slice(0, 64);
}

/**
 * Creates canonical string representation of entry payload for hashing
 */
export function canonicalPayload(entry: {
  block_index: number;
  timestamp: string;
  incident_id: string;
  order_id: string;
  action: string;
  previous_state: string;
  new_state: string;
  decision_reason: string;
  verification_result: string;
  previous_hash: string;
}): string {
  return JSON.stringify({
    idx: entry.block_index,
    ts: entry.timestamp,
    inc: entry.incident_id,
    ord: entry.order_id,
    act: entry.action,
    prev_st: entry.previous_state,
    new_st: entry.new_state,
    reason: entry.decision_reason,
    vrfy: entry.verification_result,
    prev_h: entry.previous_hash,
  });
}

/**
 * Creates a new cryptographically chained block for the ledger
 */
export async function createLedgerBlock(
  params: {
    incident_id: string;
    order_id: string;
    action: string;
    previous_state: string;
    new_state: string;
    decision_reason: string;
    verification_result: string;
  },
  existingLedger: ProofLedgerEntry[]
): Promise<ProofLedgerEntry> {
  const blockIndex = existingLedger.length;
  const previousHash = blockIndex === 0 ? GENESIS_HASH : existingLedger[blockIndex - 1].current_hash;
  const timestamp = new Date().toISOString();

  const payloadString = canonicalPayload({
    block_index: blockIndex,
    timestamp,
    incident_id: params.incident_id,
    order_id: params.order_id,
    action: params.action,
    previous_state: params.previous_state,
    new_state: params.new_state,
    decision_reason: params.decision_reason,
    verification_result: params.verification_result,
    previous_hash: previousHash,
  });

  const currentHash = await sha256(payloadString);

  return {
    id: `BLK-${String(blockIndex).padStart(5, '0')}`,
    block_index: blockIndex,
    timestamp,
    incident_id: params.incident_id,
    order_id: params.order_id,
    action: params.action,
    previous_state: params.previous_state,
    new_state: params.new_state,
    decision_reason: params.decision_reason,
    verification_result: params.verification_result,
    payload_hash: currentHash.slice(0, 16),
    previous_hash: previousHash,
    current_hash: currentHash,
  };
}

/**
 * Verifies the integrity of the entire tamper-evident proof ledger.
 */
export async function verifyProofLedger(ledger: ProofLedgerEntry[]): Promise<LedgerVerificationResult> {
  const verifiedAt = new Date().toISOString();

  if (ledger.length === 0) {
    return {
      is_valid: true,
      total_blocks: 0,
      tampered_index: null,
      message: 'Ledger is empty. Zero tampering detected.',
      verified_at: verifiedAt,
    };
  }

  for (let i = 0; i < ledger.length; i++) {
    const entry = ledger[i];
    const expectedPreviousHash = i === 0 ? GENESIS_HASH : ledger[i - 1].current_hash;

    // Check 1: Previous hash link
    if (entry.previous_hash !== expectedPreviousHash) {
      return {
        is_valid: false,
        total_blocks: ledger.length,
        tampered_index: i,
        message: `Broken chain link at Block #${entry.block_index} (${entry.id}). Previous hash mismatch. Expected ${expectedPreviousHash.slice(0, 12)}... but found ${entry.previous_hash.slice(0, 12)}...`,
        verified_at: verifiedAt,
      };
    }

    // Check 2: Payload hash recalculation
    const payloadString = canonicalPayload({
      block_index: entry.block_index,
      timestamp: entry.timestamp,
      incident_id: entry.incident_id,
      order_id: entry.order_id,
      action: entry.action,
      previous_state: entry.previous_state,
      new_state: entry.new_state,
      decision_reason: entry.decision_reason,
      verification_result: entry.verification_result,
      previous_hash: entry.previous_hash,
    });

    const recalculatedHash = await sha256(payloadString);
    if (recalculatedHash !== entry.current_hash || entry.tampered) {
      return {
        is_valid: false,
        total_blocks: ledger.length,
        tampered_index: i,
        message: `Cryptographic digest mismatch at Block #${entry.block_index} (${entry.id}). Payload or hash has been altered! Recalculated hash differs from recorded proof.`,
        verified_at: verifiedAt,
      };
    }
  }

  return {
    is_valid: true,
    total_blocks: ledger.length,
    tampered_index: null,
    message: `All ${ledger.length} cryptographic blocks verified successfully. Chain hash link is continuous and intact from Genesis block.`,
    verified_at: verifiedAt,
  };
}

/**
 * Exports the ledger as CSV or JSON format
 */
export function exportLedgerData(ledger: ProofLedgerEntry[], format: 'csv' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify(ledger, null, 2);
  }

  const headers = [
    'Block Index',
    'ID',
    'Timestamp',
    'Incident ID',
    'Order ID',
    'Action',
    'Previous State',
    'New State',
    'Decision Reason',
    'Verification Result',
    'Previous Hash',
    'Current Hash',
  ];

  const rows = ledger.map((entry) => [
    entry.block_index,
    entry.id,
    entry.timestamp,
    entry.incident_id,
    entry.order_id,
    `"${entry.action.replace(/"/g, '""')}"`,
    entry.previous_state,
    entry.new_state,
    `"${entry.decision_reason.replace(/"/g, '""')}"`,
    `"${entry.verification_result.replace(/"/g, '""')}"`,
    entry.previous_hash,
    entry.current_hash,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
