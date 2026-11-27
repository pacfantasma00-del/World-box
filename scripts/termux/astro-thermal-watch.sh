#!/usr/bin/env bash
# ASTRO THERMAL WATCH — advisory-only battery temperature monitor.
# Android remains responsible for thermal throttling and emergency protection.
set -u
umask 077

WARN_C="\${ASTRO_TEMP_WARN_C:-40}"
CRIT_C="\${ASTRO_TEMP_CRIT_C:-43}"
INTERVAL="\${ASTRO_THERMAL_INTERVAL:-30}"
LOG_DIR="$HOME/.astro/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/thermal-watch.log"

case "$WARN_C:$CRIT_C:$INTERVAL" in
  *[!0-9:.]*|::*|:*|*:) echo "Invalid thresholds or interval." >&2; exit 2 ;;
esac
if ! command -v termux-battery-status >/dev/null 2>&1; then
  echo "Termux:API unavailable. Install the Termux:API Android app and 'pkg install termux-api'." >&2
  exit 1
fi

sample() {
  local payload temp level stamp
  payload="$(termux-battery-status 2>/dev/null)" || {
    echo "UNKNOWN: battery telemetry request failed"
    return 0
  }
  temp="$(printf '%s\n' "$payload" | sed -nE 's/.*"temperature"[[:space:]]*:[[:space:]]*(-?[0-9]+([.][0-9]+)?).*/\1/p' | head -n 1)"
  stamp="$(date -Is 2>/dev/null || date)"
  if [ -z "$temp" ]; then
    printf '%s UNKNOWN temperature_field_missing\n' "$stamp" | tee -a "$LOG"
    return 0
  fi

  level="NORMAL"
  if awk -v t="$temp" -v c="$CRIT_C" 'BEGIN {exit !(t >= c)}'; then
    level="CRITICAL"
  elif awk -v t="$temp" -v w="$WARN_C" 'BEGIN {exit !(t >= w)}'; then
    level="WARNING"
  fi

  printf '%s battery_temp_c=%s level=%s\n' "$stamp" "$temp" "$level" | tee -a "$LOG"

  if [ "$level" = "WARNING" ]; then
    command -v termux-toast >/dev/null 2>&1 && termux-toast "ASTRO: bateria aquecida ($temp C). Reduza carga e deixe o aparelho ventilar."
  elif [ "$level" = "CRITICAL" ]; then
    command -v termux-toast >/dev/null 2>&1 && termux-toast "ASTRO ALERTA: bateria a $temp C. Interrompa tarefas pesadas e siga as orientacoes do fabricante."
  fi
}

if [ "\${1:-}" = "--once" ]; then
  sample
  exit 0
fi

echo "ASTRO THERMAL WATCH — advisory only; Ctrl+C to stop."
echo "warn=$WARN_C C critical=$CRIT_C C interval=$INTERVAL s log=$LOG"
while true; do
  sample
  sleep "$INTERVAL"
done
