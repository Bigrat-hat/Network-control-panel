#!/bin/bash
TARGET="$1"; REPORT="$2"
CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "\n${CYAN}${BOLD}[ Web Vulnerability Scan — $TARGET ]${NC}"
echo -e "\n=== WEB VULNERABILITY SCAN: $TARGET ===" >> "$REPORT"

# Check if web service is reachable on 80 or 443
WEB_PORT=""
for port in 80 443; do
  if timeout 3 bash -c "echo >/dev/tcp/$TARGET/$port" 2>/dev/null; then
    WEB_PORT=$port
    break
  fi
done

if [[ -z "$WEB_PORT" ]]; then
  MSG="No web service detected on ports 80/443. Skipping web scan."
  echo -e "${YELLOW}$MSG${NC}"; echo "$MSG" >> "$REPORT"
  exit 0
fi

echo -e "${BOLD}Web service detected on port $WEB_PORT${NC}"

# SSL/TLS check
if [[ "$WEB_PORT" == "443" ]] && command -v openssl &>/dev/null; then
  echo -e "\n${BOLD}► SSL/TLS Configuration${NC}"
  echo "--- SSL/TLS ---" >> "$REPORT"
  SSL=$(echo | timeout 5 openssl s_client -connect "$TARGET:443" 2>&1 | grep -E "Protocol|Cipher|subject|issuer|Verify")
  echo "$SSL"; echo "$SSL" >> "$REPORT"
fi

# Nikto scan — read-only, no exploits
echo -e "\n${BOLD}► Nikto Web Vulnerability Scan${NC}"
echo "--- Nikto ---" >> "$REPORT"
if ! command -v nikto &>/dev/null; then
  echo -e "${RED}nikto not found. Install: brew install nikto / sudo apt install nikto${NC}"
  echo "nikto not installed." >> "$REPORT"
  exit 1
fi

PROTO="http"; [[ "$WEB_PORT" == "443" ]] && PROTO="https"
NIKTO=$(nikto -h "$PROTO://$TARGET" -nointeractive -Tuning 1234 2>&1)
echo "$NIKTO"; echo "$NIKTO" >> "$REPORT"
