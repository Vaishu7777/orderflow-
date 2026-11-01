import React from 'react';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Hash,
  ArrowRight,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';

export const ProofLedgerView: React.FC = () => {
  const {
    ledger,
    verificationResult,
    isVerifyingLedger,
    verifyLedgerIntegrity,
    simulateTamperLedger,
    repairLedger,
    exportLedger,
    tamperDetectedIndex,
  } = useSentinel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tamper-Evident Proof Ledger</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              SHA-256 Cryptographic Chain
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every state transition, decision reason, and independent verification is cryptographically sealed into a hash-linked audit chain.
          </p>
        </div>

        {/* Global Ledger Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={verifyLedgerIntegrity}
            disabled={isVerifyingLedger}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingLedger ? 'animate-spin text-rose-400' : 'text-emerald-400'}`} />
            <span>{isVerifyingLedger ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}</span>
          </button>

          <button
            onClick={simulateTamperLedger}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
            title="Simulate attacker modifying a historical block payload without valid chain recalculation"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulate Tamper Attack</span>
          </button>

          {tamperDetectedIndex !== null && (
            <button
              onClick={repairLedger}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restore Valid State</span>
            </button>
          )}

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={() => exportLedger('csv')}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportLedger('json')}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            verificationResult.is_valid
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.is_valid ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {verificationResult.is_valid
                  ? 'Cryptographic Chain Integrity Confirmed'
                  : 'INTEGRITY BREACH DETECTED: Tampered Block Identified!'}
              </div>
              <p className="mt-0.5 leading-relaxed">{verificationResult.message}</p>
              <div className="text-[10px] opacity-75 mt-1 font-mono">
                Verified at: {verificationResult.verified_at} &bull; Total Blocks Checked:{' '}
                {verificationResult.total_blocks}
              </div>
            </div>
          </div>

          <div className="shrink-0 font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 border border-current">
            {verificationResult.is_valid ? 'STATUS: VALID' : 'STATUS: CORRUPTED'}
          </div>
        </div>
      )}

      {/* Notice on Tamper-Evident Architecture */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Tamper-Evident Cryptographic Architecture:</span>
          <p className="mt-0.5 leading-relaxed">
            Each record generates a SHA-256 digest sealing <code className="text-slate-800 font-mono font-semibold">previous_hash + block_index + timestamp + order_id + action + previous_state + new_state + decision_reason</code>.
            Because each block references the digest of its predecessor, altering any historical block immediately invalidates all downstream hash pointers.
            This ledger is tamper-evident (detects any modification), providing enterprise compliance verification.
          </p>
        </div>
      </div>

      {/* Chain Stream Blocks */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Cryptographic Block Chronicle ({ledger.length} Blocks)</h2>

        <div className="space-y-3">
          {ledger.map((entry, index) => {
            const isTampered = entry.tampered || tamperDetectedIndex === index;

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border transition-all ${
                  isTampered
                    ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 shadow-sm'
                    : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      Block #{entry.block_index} ({entry.id})
                    </span>
                    <span className="text-xs font-mono text-slate-400">{entry.timestamp}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Order: {entry.order_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Action: {entry.action}
                    </span>
                    {isTampered && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500 text-white animate-bounce">
                        TAMPERED BLOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* State Transition & Decision Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">State Machine Transition:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {entry.previous_state}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {entry.new_state}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <span className="text-slate-500 font-medium">Decision Reason:</span>
                      <p className="text-slate-800 mt-0.5">{entry.decision_reason}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium">Attestation & Verification Result:</span>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-mono text-[11px] mt-1">
                      {entry.verification_result}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Hash Links */}
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <span className="font-sans font-medium text-slate-400">Previous Hash:</span>
                    <span className="text-slate-600 truncate" title={entry.previous_hash}>
                      {entry.previous_hash.slice(0, 16)}...{entry.previous_hash.slice(-8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <span className="font-sans font-medium text-slate-400">Current Hash:</span>
                    <span
                      className={`truncate font-bold ${isTampered ? 'text-rose-600' : 'text-slate-900'}`}
                      title={entry.current_hash}
                    >
                      {entry.current_hash.slice(0, 16)}...{entry.current_hash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
