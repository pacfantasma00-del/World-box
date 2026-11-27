# ASTRO Termux Device Tools

These scripts are deliberately conservative and run without root.

## Read-only device audit

From the repository root:

```bash
bash scripts/termux/astro-device-audit.sh
```

The report is written under `$HOME/.astro/reports/`. It records device properties, battery API output when available, memory, CPU, raw thermal zones, storage, selected listeners, PM2, Node and the local Ollama health endpoint. It does not change settings or signal processes.

## Advisory battery-temperature watcher

Install the Termux:API Android companion app from the same trusted distribution source as Termux, then in Termux:

```bash
pkg install termux-api
bash scripts/termux/astro-thermal-watch.sh --once
bash scripts/termux/astro-thermal-watch.sh
```

Default advisory thresholds are 40 C (warning) and 43 C (critical). They are not manufacturer safety limits and do not replace Android thermal management. Override with environment variables only when you have a justified device-specific policy:

```bash
ASTRO_TEMP_WARN_C=40 ASTRO_TEMP_CRIT_C=43 ASTRO_THERMAL_INTERVAL=30 bash scripts/termux/astro-thermal-watch.sh
```

The watcher only reads the Termux:API battery temperature, writes a private log in `$HOME/.astro/logs/`, and optionally displays a toast. It does not throttle CPU, kill apps, alter charging, change governor/frequency, acquire a wakelock, or disable thermal protections.

## Limitations

- Termux:API readings require the companion app and package, with Android permissions as applicable.
- If the API is unavailable, the watcher stops rather than inventing a temperature.
- Thermal-zone sysfs sensors are intentionally reported as raw values by the audit script because driver units and sensor meanings differ.
- Android's vendor thermal service remains authoritative. At elevated temperature, reduce workload, stop charging if the manufacturer advises it, remove insulating covers if safe, and allow passive cooling.
