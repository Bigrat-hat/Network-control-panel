#!/bin/bash
TARGET="$1"; REPORT="$2"
GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

log() { echo -e "$1"; echo "$2" >> "$REPORT"; }

echo -e "\n${CYAN}${BOLD}[ Network Diagnostics — $TARGET ]${NC}"
echo -e "\n=== NETWORK DIAGNOSTICS: $TARGET ===" >> "$REPORT"

# Ping test
log "${BOLD}► Ping Test${NC}" "--- Ping Test ---"
PING_OUT=$(ping -c 4 "$TARGET" 2>&1)
echo "$PING_OUT"
echo "$PING_OUT" >> "$REPORT"

# Latency summary
LATENCY=$(echo "$PING_OUT" | grep -E "min/avg/max|round-trip" | tail -1)
[[ -n "$LATENCY" ]] && log "${GREEN}Latency: $LATENCY${NC}" "Latency: $LATENCY"

# Traceroute
log "\n${BOLD}► Traceroute${NC}" "--- Traceroute ---"
if command -v traceroute &>/dev/null; then
  TRACE=$(traceroute -m 15 "$TARGET" 2>&1)
else
  TRACE=$(tracert "$TARGET" 2>&1)
fi
echo "$TRACE"
echo "$TRACE" >> "$REPORT"

# Default gateway
log "\n${BOLD}► Default Gateway${NC}" "--- Gateway ---"
GW=$(ip route 2>/dev/null | grep default | awk '{print $3}' || netstat -nr 2>/dev/null | grep default | awk '{print $2}' | head -1)
echo "Gateway: ${GW:-not found}"
echo "Gateway: ${GW:-not found}" >> "$REPORT"

# Network interfaces
log "\n${BOLD}► Network Interfaces${NC}" "--- Interfaces ---"
IFACE=$(ip addr 2>/dev/null || ifconfig 2>/dev/null)
echo "$IFACE"
echo "$IFACE" >> "$REPORT"
