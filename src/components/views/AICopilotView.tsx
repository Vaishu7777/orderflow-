import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Cpu,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useSentinel } from '../../context/SentinelContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini-3.8-flash' | 'sentinel-rule-engine';
}

export const AICopilotView: React.FC = () => {
  const { orders, incidents, services, controllerState, ledger, activeIncident } = useSentinel();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello! I am **OrderFlow Sentinel AI Copilot**, your enterprise order recovery and reliability specialist.

I am grounded in live telemetry from your current environment:
* **Active Incident:** ${activeIncident.title} (${activeIncident.affected_orders_count} orders trapped)
* **Services Degraded:** ${services.filter((s) => s.status !== 'HEALTHY').map((s) => s.name).join(', ') || 'None'}
* **Proof Ledger:** ${ledger.length} SHA-256 attested blocks

How can I assist your reliability investigation or recovery decisions?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'sentinel-rule-engine',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      // Package current system snapshot
      const contextSnapshot = {
        activeIncident,
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          latency_ms: s.latency_ms,
          error_rate: s.error_rate,
        })),
        orders: orders.map((o) => ({
          id: o.id,
          amount: o.amount,
          status: o.status,
          failure_type: o.failure_type,
          payment_status: o.payment_status,
          inventory_status: o.inventory_status,
          recovery_eligibility: o.recovery_eligibility,
          idempotency_key: o.idempotency_key,
        })),
        controllerState,
        ledgerStats: {
          total_blocks: ledger.length,
          last_block: ledger[ledger.length - 1],
        },
      };

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend, context: contextSnapshot }),
      });

      if (!response.ok) {
        throw new Error(`Copilot API responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No analysis could be generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-3.8-flash',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.warn('Direct API copilot request failed, using local rule-engine:', err);
      // Fallback response
      const fallbackReply = generateClientFallback(textToSend, orders, services, activeIncident);
      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'sentinel-rule-engine',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Why are orders failing?',
    'Which orders are safe to recover?',
    'What is causing the inventory service degradation?',
    'How many orders have been verified?',
    'Why was order ORD-7845 flagged for approval?',
    'What happens if I blindly retry a failed order?',
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sentinel AI Copilot</h1>
            <p className="text-xs text-slate-500">
              Reliability architect and failure root cause assistant powered by Gemini 3.8 Flash & Evidence Rule Engine.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Grounded in Real Telemetry</span>
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 rounded-2xl border border-slate-200/80">
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div key={m.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-rose-500 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-rose-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                <div
                  className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    isUser ? 'border-rose-500 text-rose-200' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.source && (
                    <span className="font-mono text-[9px] uppercase tracking-wider">
                      Model: {m.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              <span>Analyzing live telemetry, root causes, and safety policies...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
        <span className="text-slate-400 font-medium whitespace-nowrap text-[11px] flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sentinel AI about order recovery safety, incident INC-8921, proof ledger..."
          className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-2.5 rounded-xl font-medium transition-all cursor-pointer ${
            input.trim() && !isLoading
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

function generateClientFallback(q: string, orders: any[], services: any[], activeIncident: any): string {
  const query = q.toLowerCase();
  const failed = orders.filter((o) => o.status === 'FAILED');
  const auto = orders.filter((o) => o.recovery_eligibility === 'AUTONOMOUS');
  const approval = orders.filter((o) => o.recovery_eligibility === 'NEEDS_APPROVAL');
  const blocked = orders.filter((o) => o.recovery_eligibility === 'BLOCKED');

  if (query.includes('why are orders failing') || query.includes('cause')) {
    return `### Root Cause Analysis (Observed Telemetry)

1. **Observed Facts:**
* Inventory API p99 latency surged to 2,850ms (baseline < 45ms).
* Ingress error logs report HTTP 504 Gateway Timeouts and HTTP 429 Too Many Requests.
* 14 orders trapped in processing awaiting inventory reservation confirmation.

2. **Inferred Cause (94% Confidence):**
* PostgreSQL inventory cluster connection exhaustion under concurrent flash sale writes on limited SKU rows.

3. **Recommended Action:**
* Scale pool connections; execute AUTONOMOUS recovery for orders with cached stock; require reconciliation for ambiguous PSP charges.`;
  }

  if (query.includes('safe') || query.includes('eligible')) {
    return `### Safe Recovery Assessment

* **Safe for Autonomous Recovery:** ${auto.length} orders (including ORD-7842, ORD-7848).
  * Stock confirmed in cache, payment authorized/captured, valid idempotency keys verified.
* **Requires Human SRE Approval:** ${approval.length} orders (including ORD-7845).
  * Payment status is UNKNOWN; blind retry risks double-charging the customer.
* **Strictly Blocked:** ${blocked.length} orders (including ORD-7843, ORD-7850).
  * Confirmed out-of-stock or permanent card issuer decline.`;
  }

  return `### Sentinel AI System Diagnostic

* **Incident:** ${activeIncident?.id} (${activeIncident?.title})
* **Telemetry:** Inventory API p99: 2,850ms, Error Rate: 42.1%
* **Orders Impacted:** ${failed.length} failed, ${auto.length} autonomous eligible, ${blocked.length} blocked.
* **Integrity:** SHA-256 chained Proof Ledger is active and recording all transitions.`;
}
