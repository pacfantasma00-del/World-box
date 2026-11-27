# ASTRO Execution and Evidence Contract v1

## Non-negotiable rules

1. Evidence outranks rhetoric.
2. Failure does not imply abandonment; it triggers diagnosis and a bounded retry policy.
3. Verified execution outranks claimed execution.
4. Real integration outranks simulated configuration.

## Required vocabulary

### Runtime status
`ONLINE | OFFLINE | DEGRADED | NOT_CONFIGURED | NOT_TESTED`

### Epistemic class
`FACT | INFERENCE | HYPOTHESIS | UNKNOWN`

### Execution state
`RECEBIDA | ANALISANDO | PLANEJADA | VALIDANDO | EXECUTANDO | VERIFICANDO | CONCLUÍDA | FALHOU`

### Integration mode
`SIMULATED | LOCAL_ONLY | PROVIDER_CONFIRMED`

## Evidence envelope

A probe or action record should contain:

```json
{
  "component": "ollama",
  "status": "ONLINE",
  "classification": "FACT",
  "mode": "LOCAL_ONLY",
  "observedAt": "ISO-8601 timestamp",
  "source": "HTTP GET 127.0.0.1:11434/api/tags",
  "check": "HTTP response successful within 3 seconds",
  "evidence": "HTTP 200; response body redacted/truncated",
  "durationMs": 42
}
```

Do not store API keys, authorization headers, payment credentials, private conversation content, or full environment dumps in evidence.

## Completion gate

A task may become `CONCLUÍDA` only when:
- prerequisites were checked;
- authorized actions were executed;
- expected postconditions were independently checked;
- evidence is attached to the task;
- the verifier records the result and timestamp.

If any postcondition is unverified, use `VERIFICANDO` or `FALHOU`, never `CONCLUÍDA`.

## Safety gates

- Read-only discovery precedes mutation.
- Preserve existing user data; back up before any overwrite.
- No kill-by-port, blind process termination, destructive disk operation, or security-control bypass.
- Device thermal protections remain enabled.
- Simulations are visibly labelled and cannot impersonate real provider confirmations.
- Secrets are loaded from protected environment/configuration stores and never returned by status endpoints.
