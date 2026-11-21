# ASTRO Modern Platform Blueprint

Status: PROPOSED — implementation must be verified per milestone.
Target branch: astro/real-execution-baseline
Principles: evidence over claims; least privilege; portable components; incremental migration; explicit cost controls.

## 1. Target architecture

Keep the existing TypeScript/Node application as the public API and control plane. Separate request handling from durable task execution.

- API / control plane: validate identity, input, policy, budget and idempotency; create a durable task; return 202 with a task identifier.
- Orchestrator: owns task state transitions, deadlines, retries, cancellation, delegation and budgets. It must never mark work complete without independent verification evidence.
- Worker runtime: executes one bounded task at a time in an isolated execution environment with explicit filesystem, network and tool permissions.
- Model gateway: provider-neutral adapter for hosted and local models. Record provider, model, latency, token usage, cost estimate and fallback reason. Never silently represent a fallback as the requested model.
- Tool gateway: typed, allowlisted tool registry. MCP is the preferred interoperability boundary for tools where it adds value; retain ordinary internal TypeScript interfaces for simple in-process functions.
- Agent interoperability: add A2A only when independent agents or external agent runtimes need to collaborate across process or organizational boundaries. Do not add a network protocol for agents that can safely remain local modules.
- Memory: PostgreSQL as the source of truth; pgvector for semantic retrieval and PostgreSQL full-text search for exact terms. Combine rankings only after baseline retrieval is measured. Enforce tenant and authorization filters in the database query.
- Observability: OpenTelemetry traces, metrics and structured logs with a shared task/correlation ID. Capture model/tool spans, retries, authorization decisions, duration and cost; do not log secrets or hidden model reasoning.
- Audit: append-only event records for task creation, authorization, tool invocation, evidence, verification, cancellation and state changes.

## 2. Selected technology direction

| Concern | Initial choice | Adoption rule |
|---|---|---|
| Runtime | Node.js + TypeScript | Preserve current stack |
| API | Existing Express API | Keep routes backward-compatible where safe |
| Durable workflow | PostgreSQL-backed task state + Cloud Tasks dispatch on Cloud Run | Start with explicit state machine; introduce Temporal only if workflow complexity justifies operating it |
| Database | PostgreSQL | Authoritative persistence for tasks, audit and memory metadata |
| Semantic memory | pgvector + PostgreSQL full-text search | Start with hybrid retrieval; benchmark before adding a dedicated vector database |
| Tool interoperability | MCP | Narrow, typed, allowlisted servers; never expose unrestricted shell or filesystem |
| Agent interoperability | A2A | Optional; only for cross-process/cross-framework delegation |
| Telemetry | OpenTelemetry | Trace API → orchestration → model/tool → verifier |
| Secrets | Secret Manager or equivalent | Runtime identity; never commit secrets or pass them in prompts |
| CI | GitHub Actions | Tests, typecheck, build, dependency and security checks |
| Deployment | Cloud Run service + asynchronous worker/task handler | Stateless API; persist all critical state externally |

## 3. Task lifecycle contract

Allowed lifecycle:

RECEBIDA → VALIDANDO → NA_FILA → EXECUTANDO → VERIFICANDO → CONCLUÍDA

Terminal alternatives: FALHOU, CANCELADA, EXPIRADA, BLOQUEADA.

Requirements:
- Every task has an immutable ID, tenant/owner scope, idempotency key, created/updated timestamps, deadline and policy classification.
- State transitions are validated server-side and persisted transactionally.
- Retries are bounded, delayed and idempotent. A retry must not duplicate external side effects.
- Tool calls require a declared capability, schema validation, policy approval and scoped credentials.
- High-impact actions require explicit user approval at execution time.
- Completion requires evidence references and a verifier identity distinct from the executing worker.
- Evidence records include type, source, timestamp, content hash and verification result.
- A timeout, provider fallback or tool error cannot be reported as successful completion.

## 4. Security boundaries

- Deny by default; least privilege per agent, tool, tenant and environment.
- Treat retrieved documents, web pages, tool output and model output as untrusted input.
- Defend against prompt injection by separating instructions from data and applying policy checks outside the model.
- Isolate code execution from the API process; apply CPU, memory, time, filesystem and network limits.
- Require authentication and authorization for all non-public routes; use workload identity for cloud-to-cloud calls.
- Redact credentials and sensitive data from logs, traces, task context and model telemetry.
- Apply retention and deletion rules to memory and audit data; audit access to private records.
- Never ingest ChatGPT conversation history or synchronize private chats unless an explicit supported connector and scoped authorization exist.
- Payment status must come only from a verified payment-provider webhook/API with signature validation and server-side charge binding. Simulated payment is not payment confirmation.

## 5. Deployment topology

Cloud Run API:
- Handles HTTPS requests and lightweight validation.
- Stores task and audit state in PostgreSQL.
- Enqueues bounded work through Cloud Tasks.

Private worker:
- Receives authenticated task dispatch.
- Claims a task with a lease/lock, executes permitted steps, writes evidence and releases/renews the lease.
- Uses bounded concurrency and per-provider rate limits.

PostgreSQL:
- Stores task state, event history, tool registry metadata, memory records and audit references.
- Use migrations, backups, connection pooling and tested restore procedures before production use.

Local mode:
- Same task, policy, model and tool interfaces.
- Local model providers and local worker execution may be configured without changing orchestration contracts.
- Local persistence must be explicitly configured; ephemeral container storage is not durable memory.

## 6. Delivery sequence

1. Complete current baseline: CI, truthful health status, task state machine and removal of simulated payment confirmation.
2. Add database schema and migrations for tasks, task events, evidence, tool registry and audit records. Keep current in-memory mode clearly marked as non-persistent until migration is tested.
3. Implement durable task repository and transactional state transitions; add integration tests against a disposable PostgreSQL instance.
4. Add authenticated queue dispatch and worker leases, retry policy, idempotency and cancellation.
5. Add provider-neutral model gateway with usage/cost accounting and explicit fallback telemetry.
6. Add OpenTelemetry traces and operational dashboards.
7. Add PostgreSQL hybrid memory with tenant-aware retrieval and retention controls.
8. Add MCP tool servers with per-tool permissions and adversarial tests.
9. Add A2A only after a concrete cross-runtime agent use case exists.
10. Conduct staging security, load, recovery, backup-restore and cost tests before production rollout.

## 7. Acceptance gates

A milestone is not complete until:
- automated tests cover success, failure, timeout, retry, cancellation, duplicate delivery and unauthorized access;
- persistence survives process restart;
- task completion cannot occur without independently verified evidence;
- every tool invocation is attributable to a task, principal and policy decision;
- secrets are absent from repository, logs and traces;
- resource and provider budgets are enforced;
- backup restoration and rollback are demonstrated;
- production deployment and domain routing are separately authorized and verified.

## 8. Current limitations

This blueprint does not claim that PostgreSQL, Cloud Tasks, MCP servers, A2A, OpenTelemetry, Secret Manager or production workers are currently deployed. They remain NOT_CONFIGURED until implementation and runtime evidence are available. Cloud Run's container filesystem is not the system of record. No paid cloud resources, DNS records, credentials or production services are created by this document.
