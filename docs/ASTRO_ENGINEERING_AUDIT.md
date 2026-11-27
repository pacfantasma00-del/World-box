# ASTRO Engineering Audit — World-box / ASTRO CORE

**Audit basis:** repository files read from `main` on 2026-11-27. This is a source review, not a runtime test.

## FACT — observed in source

- `src/astro/matrix.ts` initializes memory, task history, anti-quota metrics and project-state records in process memory.
- `getStatus()` labels all twelve architecture layers `CONFIRMADO`, regardless of a runtime probe.
- `POST /api/astro/task` creates a task with status `CONCLUÍDA`, one attempt, and a success verification string immediately. It does not execute the listed plan or verify side effects.
- `POST /api/nexus/simulate-payment/:chargeId` marks an in-memory charge as completed. It is a simulation endpoint, not evidence of settlement by a payment provider.
- The fallback responses in the Gemini routes are application-generated text, not model execution.
- `public/install.sh` extracts with `unzip -o` into `${HOME}/astro-worldbox`, which can overwrite existing files. It runs package-manager updates and `npm install`; it does not create a backup before extraction.
- The installer accepts a server URL and downloads `/api/download-zip`. The server ZIP route shells out to `python3 scripts/make_zip.py`; deployment must include that script and its dependencies.
- `package.json` declares `test` as `tsx --test src/game/engine.test.ts`; this does not establish coverage for ASTRO orchestration, installer behavior, API security, or device telemetry.

## INFERENCE — engineering risks

1. The UI can present simulated or in-memory state as confirmed operational state.
2. A task's completion claim is not trustworthy until execution and verification are separate states with recorded evidence.
3. Re-running the current installer against an existing target directory may replace user files.
4. In-memory task/payment state is lost on process restart and is not durable persistence.
5. The existing Android/Termux integration does not establish that privileged thermal, CPU-frequency, or memory controls are available.

## REQUIRED contract

Every status exposed by ASTRO must use one of:
- `ONLINE`: a live probe succeeded at a recorded time.
- `OFFLINE`: a live probe failed or the service is unreachable.
- `DEGRADED`: the service responds but a required capability is failing.
- `NOT_CONFIGURED`: required configuration is absent.
- `NOT_TESTED`: no probe was performed.

Every operational claim must carry:
- `status`, `observedAt`, `source`, `check`, and a bounded `evidence` value.
- `FACT`, `INFERENCE`, `HYPOTHESIS`, or `UNKNOWN` classification for analytical statements.
- A distinction between `SIMULATED`, `LOCAL_ONLY`, and `PROVIDER_CONFIRMED` for payment and external actions.

A task must progress through `RECEBIDA → ANALISANDO → PLANEJADA → VALIDANDO → EXECUTANDO → VERIFICANDO`. Only the verifier may set `CONCLUÍDA`; failure must set `FALHOU` with evidence. Planning alone is never execution.

## Android / Termux guardrails

- The included `scripts/termux/astro-device-audit.sh` is read-only and does not require root.
- Termux:API battery readings require the companion Android app plus the Termux package. Sensor exposure varies by OEM and Android version.
- Thermal-zone sysfs values are driver-specific. Preserve raw values and source paths; never blindly treat every value as millidegrees Celsius.
- Android's thermal service and vendor power HAL remain authoritative. ASTRO must not disable thermal throttling, write CPU governors/frequencies, alter kernel parameters, or kill unknown processes.
- A busy port is a diagnostic finding. Resolve it by identifying the owning PID and service configuration; never kill by port number without explicit, reviewed ownership.
- zRAM/swap visibility and controls vary by Android build and privilege. Read-only observation is the default; no swap resizing or kernel tuning from an unprivileged Termux script.

## Validation still required

- Run the existing test command in a controlled checkout.
- Add unit tests for task state transitions and evidence requirements.
- Add integration tests proving simulated payment cannot be represented as provider settlement.
- Test installer behavior against a non-empty temporary directory before changing its overwrite policy.
- Run the device audit on the target handset and retain the timestamped report.
- Verify each network endpoint, listener PID, PM2 process and Ollama response independently.

## Non-goals of this audit branch

No production deployment, no secret/key rotation, no payment-provider calls, no device-side modifications, no deletion, no forced process termination, and no changes to `main`.
