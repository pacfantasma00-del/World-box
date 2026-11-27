#!/usr/bin/env bash
# ASTRO DEVICE AUDIT — Android / Termux, read-only
# Does not require root. Does not kill processes or change kernel/device settings.
set -u
umask 077

OUT_DIR="$HOME/.astro/reports"
mkdir -p "$OUT_DIR"
STAMP="$(date '+%Y%m%d-%H%M%S')"
REPORT="$OUT_DIR/device-audit-$STAMP.txt"

have() { command -v "$1" >/dev/null 2>&1; }
section() { printf '\n===== %s =====\n' "$1"; }

{
  echo "ASTRO DEVICE AUDIT v1.0"
  echo "timestamp=$(date -Is 2>/dev/null || date)"
  echo "mode=READ_ONLY"
  echo "user=$(id 2>/dev/null | cut -c1-180)"
  echo "termux_prefix=$PREFIX"

  section "DEVICE"
  for key in ro.product.manufacturer ro.product.model ro.build.version.release ro.build.version.sdk ro.hardware; do
    printf '%s=' "$key"
    getprop "$key" 2>/dev/null || true
  done

  section "BATTERY (Termux:API)"
  if have termux-battery-status; then
    termux-battery-status 2>&1
  else
    echo "UNAVAILABLE: install Termux:API app and termux-api package to read battery telemetry."
  fi

  section "MEMORY"
  if [ -r /proc/meminfo ]; then
    grep -E '^(MemTotal|MemFree|MemAvailable|Buffers|Cached|SwapTotal|SwapFree):' /proc/meminfo
  else
    echo "UNAVAILABLE: /proc/meminfo not readable"
  fi

  section "CPU"
  echo "logical_cpus=$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc 2>/dev/null || echo unknown)"
  if [ -r /proc/loadavg ]; then printf 'loadavg='; cat /proc/loadavg; fi
  for f in /sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_governor; do
    [ -r "$f" ] || continue
    printf '%s=' "$f"; cat "$f" 2>/dev/null || true
  done

  section "THERMAL ZONES (raw sysfs; units vary by driver)"
  found=0
  for z in /sys/class/thermal/thermal_zone*; do
    [ -d "$z" ] || continue
    found=1
    name="unknown"; raw="unreadable"
    [ -r "$z/type" ] && name="$(cat "$z/type" 2>/dev/null)"
    [ -r "$z/temp" ] && raw="$(cat "$z/temp" 2>/dev/null)"
    printf '%s type=%s raw_temp=%s\n' "$z" "$name" "$raw"
  done
  [ "$found" -eq 1 ] || echo "No readable thermal zones exposed to this app."

  section "STORAGE"
  df -h "$HOME" /storage/emulated/0 2>&1 || true

  section "ASTRO PORTS (no process termination)"
  if have ss; then
    ss -ltnp 2>&1 | grep -E ':(3000|4000|5000|7007|11434)([[:space:]]|$)' || echo "No matching listening sockets visible."
  elif have lsof; then
    lsof -nP -iTCP -sTCP:LISTEN 2>&1 | grep -E ':(3000|4000|5000|7007|11434)([[:space:]]|$)' || echo "No matching listeners visible."
  else
    echo "UNAVAILABLE: install iproute2 (ss) or lsof for PID-to-port inspection."
  fi

  section "PROCESS SNAPSHOT"
  if have ps; then
    ps -A 2>&1 | grep -Ei '(^|[ /])(node|ollama|pm2)([ /:]|$)|astro' | head -60 || true
  fi

  section "PM2"
  if have pm2; then pm2 ls 2>&1; else echo "PM2 not found in PATH."; fi

  section "NODE / NPM"
  if have node; then node --version; else echo "node unavailable"; fi
  if have npm; then npm --version; else echo "npm unavailable"; fi

  section "OLLAMA LOCAL HEALTH"
  if have curl; then
    curl -fsS --max-time 3 http://127.0.0.1:11434/api/tags 2>&1 | head -c 1500 || echo "Ollama endpoint unavailable."
    echo
  else
    echo "curl unavailable"
  fi

  section "SAFETY"
  echo "No settings changed."
  echo "No process was signalled or terminated."
  echo "Thermal sysfs values are driver-specific; do not assume every value is Celsius."
  echo "Port visibility may be restricted by Android process isolation."
} 2>&1 | tee "$REPORT"

echo
echo "REPORT_PATH=$REPORT"
