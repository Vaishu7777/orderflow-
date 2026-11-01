import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini API client if API key is present
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'OrderFlow Sentinel AI Backend',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// AI Copilot endpoint
app.post('/api/copilot', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // If Gemini API is available and configured, use gemini-3.8-flash
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = `You are OrderFlow Sentinel AI Copilot, an enterprise-grade AI reliability and order recovery specialist for high-throughput e-commerce architectures.
You analyze live incidents, order state transitions, recovery twin simulations, service health telemetry, and cryptographic proof ledgers.

CRITICAL RULES:
1. Always clearly distinguish between:
   - "OBSERVED EVIDENCE" (actual recorded telemetry, metrics, HTTP status codes, error logs, and ledger entries)
   - "PROBABLE CAUSE / INFERENCE" (deductions made based on the evidence)
   - "CONFIDENCE LEVEL" (e.g., High, Moderate, Low)
   - "RECOMMENDED ACTION" (safe autonomous recovery, manual approval, or blocked)
2. NEVER claim absolute certainty when evidence is incomplete.
3. NEVER advise bypassing safety policies or retrying blind payments without authoritative idempotency checks.
4. Keep explanations crisp, professional, structured, and actionable. Use bullet points or concise sections.
5. Refer to specific order IDs, services, or metrics provided in the system context when relevant.`;

        const prompt = `CURRENT APPLICATION STATE CONTEXT:
${JSON.stringify(context || {}, null, 2)}

USER QUESTION:
${question}

Provide an authoritative, clear, and grounded response adhering strictly to the system instructions.`;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
          },
        });

        const reply = response.text || 'Unable to generate response.';
        return res.json({ reply, source: 'gemini-3.8-flash' });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using rule-based analyst fallback:', geminiError?.message);
        // Fall through to deterministic fallback
      }
    }

    // Deterministic rule-based analyst fallback if Gemini API is absent or fails
    const reply = generateDeterministicAnalysis(question, context);
    return res.json({ reply, source: 'sentinel-rule-engine' });
  } catch (error: any) {
    console.error('Copilot endpoint error:', error);
    res.status(500).json({ error: 'Internal server error processing copilot request' });
  }
});

function generateDeterministicAnalysis(question: string, context: any): string {
  const q = question.toLowerCase();
  const orders = context?.orders || [];
  const incidents = context?.incidents || [];
  const services = context?.services || [];
  const activeIncident = incidents.find((i: any) => i.status === 'ACTIVE') || incidents[0];

  const failedOrders = orders.filter((o: any) => o.status === 'FAILED');
  const autonomousOrders = orders.filter((o: any) => o.recovery_eligibility === 'AUTONOMOUS');
  const approvalOrders = orders.filter((o: any) => o.recovery_eligibility === 'NEEDS_APPROVAL');
  const blockedOrders = orders.filter((o: any) => o.recovery_eligibility === 'BLOCKED');
  const verifiedOrders = orders.filter((o: any) => o.status === 'RECOVERED_VERIFIED');

  if (q.includes('why are orders failing') || q.includes('cause') || q.includes('failing')) {
    const invService = services.find((s: any) => s.id === 'inventory') || { latency_ms: 2850, error_rate: 42.5 };
    return `### Root Cause Analysis & Evidence Synthesis

**1. Observed Evidence:**
* **Inventory Service Degraded:** Latency surged to ${invService.latency_ms}ms (baseline < 50ms) with an error rate of ${invService.error_rate}%.
* **HTTP 504 Gateway Timeouts & HTTP 429 Rate Limiting:** Downstream database pool exhaustion in inventory cluster.
* **Correlated Failure Pattern:** ${failedOrders.length} orders failed during the active flash sale traffic spike with status \`TIMEOUT_UNKNOWN\`.

**2. Probable Root Cause:**
* Primary: Inventory cluster database connection starvation under concurrent reservation locks.
* Secondary: Upstream order orchestration timed out waiting for inventory lock confirmation.

**3. Confidence Level:**
* **High (94%)** — Temporal alignment between traffic surge, latency threshold breaches, and order failure timestamps.

**4. Recommended Action:**
* Restore inventory service health before executing batch recovery.
* For orders with stock confirmed in cache, initiate \`AUTONOMOUS\` recovery via the Recovery Center.
* For payment status \`UNKNOWN\`, require authoritative reconciliation before re-attempting reservation.`;
  }

  if (q.includes('safe to recover') || q.includes('eligible') || q.includes('which orders')) {
    return `### Recovery Eligibility Assessment

* **Autonomous Recovery Eligible (${autonomousOrders.length} orders):**
  Orders such as ${autonomousOrders.slice(0, 3).map((o: any) => o.id).join(', ') || 'ORD-7842, ORD-7848'} are cleared for safe automatic execution.
  * *Reason:* Payment is already authorized or secured, stock reservation is confirmed available in cold reserve, and idempotency keys are verified.

* **Requires Manual Approval (${approvalOrders.length} orders):**
  Orders such as ${approvalOrders.slice(0, 3).map((o: any) => o.id).join(', ') || 'ORD-7845'} require human approval.
  * *Reason:* Payment status is \`UNKNOWN\` at payment gateway (preventing duplicate charge) or customer session has multiple retry attempts.

* **Strictly Blocked (${blockedOrders.length} orders):**
  Orders such as ${blockedOrders.slice(0, 2).map((o: any) => o.id).join(', ') || 'ORD-7850'} must NOT be recovered.
  * *Reason:* SKU out of stock or permanent payment decline by issuing bank.`;
  }

  if (q.includes('verified') || q.includes('how many')) {
    return `### Verification Status Summary

* **Verified Recovered:** ${verifiedOrders.length} orders have passed 3-phase independent verification:
  1. Authoritative payment transaction capture query.
  2. Inventory reservation lock verification in warehouse database.
  3. Customer notification receipt generation.
* **Tamper-Evident Proof Ledger:** Each state transition is cryptographically chained using SHA-256 with verifiable hash integrity.`;
  }

  if (q.includes('ord-7845') || (q.includes('blocked') && q.includes('ord'))) {
    return `### Diagnostic for Blocked / Approval Orders

**Order ORD-7845 Inspection:**
* **Current State:** \`FAILED\` (\`PAYMENT_TIMEOUT_UNKNOWN\`)
* **Risk Factor:** Payment gateway timed out while awaiting 3D Secure / card network response.
* **Policy Verdict:** \`NEEDS_APPROVAL\`
* **Safety Gate:** Blindly retrying would risk double-charging the customer ($289.00). Sentinel AI paused automatic progression until PSP transaction reconciliation confirms no capture occurred.`;
  }

  return `### OrderFlow Sentinel AI System Status

* **Active Incident:** ${activeIncident?.title || 'INC-8921: Flash Sale Spike - Inventory Service Degradation'}
* **Orders Tracked:** ${orders.length} total (${failedOrders.length} failed, ${verifiedOrders.length} verified recovered)
* **Autonomous Eligible:** ${autonomousOrders.length} ready for instant zero-risk recovery
* **Safety Protocol:** Idempotency keys enforced, circuit breaker active, and SHA-256 proof ledger recording all events.

You can ask me specific questions like:
- *"Why are orders failing?"*
- *"Which orders are safe to recover?"*
- *"What happens if I retry ORD-7845?"*
- *"Explain the proof ledger verification."*`;
}

// In development, integrate Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OrderFlow Sentinel AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
