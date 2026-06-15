#!/bin/bash
TARGET="$1"; REPORT="$2"
CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

log() { echo -e "$1"; echo "$2" >> "$REPORT"; }

echo -e "\n${CYAN}${BOLD}[ Advanced Network Analysis — $TARGET ]${NC}"
echo -e "\n=== ADVANCED NETWORK ANALYSIS: $TARGET ===" >> "$REPORT"

# DNS resolution
log "\n${BOLD}► DNS Resolution${NC}" "--- DNS ---"
DNS=$(nslookup "$TARGET" 2>&1)
echo "$DNS"; echo "$DNS" >> "$REPORT"

# Connection statistics
log "\n${BOLD}► Connection Statistics${NC}" "--- Connections ---"
if command -v ss &>/dev/null; then
  CONNS=$(ss -tunap 2>&1)
else
  CONNS=$(netstat -tunap 2>&1)
fi
echo "$CONNS"; echo "$CONNS" >> "$REPORT"

# Routing table
log "\n${BOLD}► Routing Table${NC}" "--- Routing Table ---"
ROUTES=$(ip route 2>/dev/null || netstat -rn 2>/dev/null)
echo "$ROUTES"; echo "$ROUTES" >> "$REPORT"

# Packet loss & latency (extended ping)
log "\n${BOLD}► Packet Loss & Latency (10 packets)${NC}" "--- Packet Loss ---"
PL=$(ping -c 10 "$TARGET" 2>&1 | tail -3)
echo "$PL"; echo "$PL" >> "$REPORT"

# MTU path discovery
log "\n${BOLD}► MTU Path Discovery${NC}" "--- MTU ---"
MTU=$(ping -M do -s 1472 -c 1 "$TARGET" 2>&1 || ping -D -s 1472 -c 1 "$TARGET" 2>&1)
echo "$MTU"; echo "$MTU" >> "$REPORT"

# TCP connectivity test
log "\n${BOLD}► TCP Connectivity (port 80 & 443)${NC}" "--- TCP Test ---"
for port in 80 443; do
  if timeout 3 bash -c "echo >/dev/tcp/$TARGET/$port" 2>/dev/null; then
    result="Port $port: OPEN"
  else
    result="Port $port: CLOSED/FILTERED"
  fi
  echo "$result"; echo "$result" >> "$REPORT"
done
