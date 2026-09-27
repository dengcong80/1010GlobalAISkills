import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  ALL_FAULTS,
  auditTradeCase,
  buildHashChain,
  checkMpiMarketAccess,
  compareFingerprint,
  createDemoCase,
  createTaskPlan,
  parseIntent,
  runAdversarySkill,
  runCustomsSkill,
  runTradeCase,
  type CustodyEventInput,
  type CustomsInput,
  type FaultType,
  type MpiEvidence,
} from "./public-api.js";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "0.0.0.0";
const SERVER_VERSION = "1.0.0";
const PROTOCOL_VERSION = "2025-03-26";
const MAX_BODY_BYTES = 1_000_000;

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: unknown };
type JsonRpcResponse = { jsonrpc: "2.0"; id: JsonRpcId; result?: unknown; error?: { code: number; message: string; data?: unknown } };

const tools = [
  {
    name: "beetrust_orchestrate",
    description: "Parse the supported New Zealand-to-Australia honey release intent and return its dependency-aware SkillMessage/v1 task plan.",
    inputSchema: {
      type: "object",
      properties: { intent: { type: "string", description: "Supported release intent." }, caseId: { type: "string", description: "Optional case identifier." } },
      required: ["intent"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_fingerprint_evidence",
    description: "Compare a honey laboratory marker CSV with a reference profile and return similarity, confidence, anomalies, and evidence references.",
    inputSchema: {
      type: "object",
      properties: {
        batchId: { type: "string" },
        sampleCsv: { type: "string" },
        reference: { type: "object", additionalProperties: { type: "number" } },
        referenceBatchId: { type: "string" },
      },
      required: ["batchId", "sampleCsv", "reference", "referenceBatchId"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_custody_ledger",
    description: "Build a tamper-evident SHA-256 custody chain and return previousHash, hash, headHash, and blocked event IDs.",
    inputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              eventId: { type: "string" }, timestamp: { type: "string" }, actor: { type: "string" }, location: { type: "string" }, action: { type: "string" }, batchId: { type: "string" }, quantity: { type: "number" }, metadata: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["eventId", "timestamp", "actor", "location", "action", "batchId", "quantity"],
            additionalProperties: false,
          },
        },
      },
      required: ["events"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_mpi_market_access",
    description: "Check the supported Australia MPI market-access evidence, freshness, mandatory documents, and rule-version consistency.",
    inputSchema: {
      type: "object",
      properties: {
        destination: { type: "string" },
        evidence: { type: "object" },
      },
      required: ["destination", "evidence"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_customs_clearance",
    description: "Prepare candidate honey HS classification, transparent landed-cost totals, and draft commercial documents without submitting to TSW.",
    inputSchema: {
      type: "object",
      properties: {
        caseId: { type: "string" }, seller: { type: "string" }, buyer: { type: "string" }, origin: { type: "string" }, destination: { type: "string" }, currency: { type: "string", enum: ["NZD"] }, lines: { type: "array" }, freightNzd: { type: "number" }, insuranceNzd: { type: "number" }, dutyRate: { type: "number" }, levyRate: { type: "number" }, exportGstRate: { type: "number" }, classificationEvidence: { type: "boolean" },
      },
      required: ["caseId", "seller", "buyer", "origin", "destination", "currency", "lines", "freightNzd", "insuranceNzd", "dutyRate", "levyRate", "exportGstRate", "classificationEvidence"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_trade_risk_adversary",
    description: "Replay controlled red-team faults against a cloned trade case and verify that the fault produces a BLOCKED finding while preserving the baseline.",
    inputSchema: {
      type: "object",
      properties: {
        intent: { type: "string" },
        faults: { type: "array", items: { type: "string", enum: [...ALL_FAULTS] } },
      },
      required: ["faults"],
      additionalProperties: false,
    },
  },
  {
    name: "beetrust_evidence_monitor",
    description: "Run the deterministic release evidence workflow and return the five release gates with a RELEASE, REVIEW, or BLOCKED decision.",
    inputSchema: {
      type: "object",
      properties: { intent: { type: "string" } },
      additionalProperties: false,
    },
  },
] as const;

function jsonResponse(response: ServerResponse, status: number, body: unknown): void {
  const encoded = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(encoded), "cache-control": "no-store" });
  response.end(encoded);
}

function textResponse(response: ServerResponse, status: number, text: string): void {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8", "content-length": Buffer.byteLength(text), "cache-control": "no-store" });
  response.end(text);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isAuthorized(request: IncomingMessage): boolean {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected) return true;
  return request.headers.authorization === `Bearer ${expected}`;
}

function success(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function failure(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function toolResult(value: unknown): Record<string, unknown> {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value, isError: false };
}

async function callTool(name: string, rawArguments: unknown): Promise<Record<string, unknown>> {
  const args = (rawArguments && typeof rawArguments === "object" ? rawArguments : {}) as Record<string, unknown>;
  switch (name) {
    case "beetrust_orchestrate": {
      const intentText = requireString(args, "intent");
      const intent = parseIntent(intentText);
      return toolResult({ intent, taskPlan: createTaskPlan(requireOptionalString(args, "caseId") ?? "mcp-case", intent), protocol: "SkillMessage/v1" });
    }
    case "beetrust_fingerprint_evidence": {
      return toolResult(compareFingerprint({ batchId: requireString(args, "batchId"), sampleCsv: requireString(args, "sampleCsv"), reference: requireNumberMap(args, "reference"), referenceBatchId: requireString(args, "referenceBatchId") }));
    }
    case "beetrust_custody_ledger": {
      return toolResult(buildHashChain(requireEvents(args, "events")));
    }
    case "beetrust_mpi_market_access": {
      return toolResult(checkMpiMarketAccess(requireString(args, "destination"), requireObject(args, "evidence") as unknown as MpiEvidence));
    }
    case "beetrust_customs_clearance": {
      const input = requireObject(args) as unknown as CustomsInput;
      return toolResult(await runCustomsSkill({ ...input, liveSourceLookup: false }));
    }
    case "beetrust_trade_risk_adversary": {
      const tradeCase = createDemoCase(requireOptionalString(args, "intent"));
      const faults = requireFaults(args, "faults");
      return toolResult(runAdversarySkill(tradeCase, faults));
    }
    case "beetrust_evidence_monitor": {
      const workflow = await runTradeCase(requireOptionalString(args, "intent"), { liveSources: false, includeRedTeam: false });
      return toolResult({ decision: workflow.baseline, gates: workflow.baseline.gates, evidenceMatrix: workflow.baseline.evidenceMatrix, kpis: workflow.kpis });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`Argument '${key}' must be a non-empty string.`);
  return value;
}

function requireOptionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  return requireString(args, key);
}

function requireObject(args: Record<string, unknown>, key?: string): Record<string, unknown> {
  const value = key ? args[key] : args;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Argument '${key ?? "input"}' must be an object.`);
  return value as Record<string, unknown>;
}

function requireNumberMap(args: Record<string, unknown>, key: string): Record<string, number> {
  const value = requireObject(args, key);
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([, item]) => typeof item !== "number" || !Number.isFinite(item))) throw new Error(`Argument '${key}' must contain finite numeric values.`);
  return Object.fromEntries(entries) as Record<string, number>;
}

function requireEvents(args: Record<string, unknown>, key: string): CustodyEventInput[] {
  const value = args[key];
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Argument '${key}' must be a non-empty array.`);
  return value as CustodyEventInput[];
}

function requireFaults(args: Record<string, unknown>, key: string): FaultType[] {
  const value = args[key];
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => !ALL_FAULTS.includes(item as FaultType))) throw new Error(`Argument '${key}' must contain only supported controlled faults.`);
  return value as FaultType[];
}

async function handleRpc(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null;
  if (request.method === "notifications/initialized") return null;
  if (request.method === "ping") return success(id, {});
  if (request.method === "initialize") {
    return success(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "beetrust-mcp", version: SERVER_VERSION }, instructions: "BeeTrust provides read-only, evidence-backed decision support for the supported New Zealand-to-Australia honey release case. It does not issue certificates or submit customs declarations." });
  }
  if (request.method === "tools/list") return success(id, { tools });
  if (request.method === "tools/call") {
    const params = requireObject((request.params ?? {}) as Record<string, unknown>);
    const name = requireString(params, "name");
    return success(id, await callTool(name, params.arguments));
  }
  return failure(id, -32601, `Method not found: ${request.method ?? ""}`);
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/health" && request.method === "GET") return jsonResponse(response, 200, { status: "ok", service: "beetrust-mcp", version: SERVER_VERSION });
  if (url.pathname === "/.well-known/openai-apps-challenge" && request.method === "GET") {
    const token = process.env.OPENAI_APP_CHALLENGE;
    return token ? textResponse(response, 200, token) : textResponse(response, 404, "Challenge token is not configured.");
  }
  if (url.pathname !== "/mcp") return textResponse(response, 404, "Not found.");
  if (!isAuthorized(request)) return textResponse(response, 401, "Unauthorized.");
  if (request.method !== "POST") return textResponse(response, 405, "Use POST /mcp for MCP Streamable HTTP requests.");
  try {
    const payload = await readJson(request);
    const requests = Array.isArray(payload) ? payload as JsonRpcRequest[] : [payload as JsonRpcRequest];
    const responses = (await Promise.all(requests.map(handleRpc))).filter((item): item is JsonRpcResponse => item !== null);
    if (responses.length === 0) {
      response.writeHead(202).end();
      return;
    }
    return jsonResponse(response, 200, Array.isArray(payload) ? responses : responses[0]);
  } catch (error) {
    return jsonResponse(response, 400, failure(null, -32602, error instanceof Error ? error.message : "Invalid MCP request."));
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error: unknown) => {
    if (!response.headersSent) jsonResponse(response, 500, { error: error instanceof Error ? error.message : "Internal server error." });
    else response.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`BeeTrust MCP server listening on http://${HOST}:${PORT}/mcp`);
});
