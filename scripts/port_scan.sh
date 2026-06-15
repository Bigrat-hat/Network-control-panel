#!/bin/bash
TARGET="$1"; REPORT="$2"
CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'

echo -e "\n${CYAN}${BOLD}[ Port & Service Enumeration — $TARGET ]${NC}"
echo -e "\n=== PORT & SERVICE ENUMERATION: $TARGET ===" >> "$REPORT"

if ! command -v nmap &>/dev/null; then
  echo -e "${RED}nmap not found. Install: brew install nmap / sudo apt install nmap${NC}"
  echo "nmap not installed." >> "$REPORT"
  exit 1
fi

# Top 1000 ports — safe flags only
echo -e "\n${BOLD}► Top 1000 Ports Scan${NC}"
echo "--- Nmap Top 1000 ---" >> "$REPORT"
OUT=$(nmap -sV --version-intensity 1 -T3 "$TARGET" 2>&1)
echo "$OUT"; echo "$OUT" >> "$REPORT"

# OS detection (requires sudo)
echo -e "\n${BOLD}► OS Detection${NC}"
echo "--- OS Detection ---" >> "$REPORT"
if [[ $EUID -eq 0 ]]; then
  OS=$(nmap -O --osscan-limit "$TARGET" 2>&1)
else
  OS="Skipped (requires sudo)"
fi
echo "$OS"; echo "$OS" >> "$REPORT"
