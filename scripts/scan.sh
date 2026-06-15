#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/report"
mkdir -p "$REPORT_DIR"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'; BOLD='\033[1m'

banner() {
  echo -e "${CYAN}${BOLD}"
  echo "╔══════════════════════════════════════════════════╗"
  echo "║     Network Vulnerability & Diagnostic Tool      ║"
  echo "║         Bash | Nmap | Nikto | Linux              ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

get_target() {
  read -rp "$(echo -e ${YELLOW}Enter target IP/hostname: ${NC})" TARGET
  [[ -z "$TARGET" ]] && echo -e "${RED}No target provided.${NC}" && exit 1
  REPORT="$REPORT_DIR/scan_report_$(date +%Y%m%d_%H%M%S).txt"
  echo "Scan Report — $(date)" > "$REPORT"
  echo "Target: $TARGET" >> "$REPORT"
  echo "----------------------------------------" >> "$REPORT"
}

menu() {
  banner
  echo -e "${BOLD}Select scan type:${NC}"
  echo "  1) Network Diagnostics & Troubleshooting"
  echo "  2) Port & Service Enumeration"
  echo "  3) Web Vulnerability Scan"
  echo "  4) Advanced Network Analysis"
  echo "  5) Full Scan (All Modules)"
  echo "  6) Exit"
  echo ""
  read -rp "$(echo -e ${YELLOW}Choice [1-6]: ${NC})" CHOICE
}

run_module() {
  local script="$SCRIPT_DIR/$1"
  if [[ -f "$script" ]]; then
    bash "$script" "$TARGET" "$REPORT"
  else
    echo -e "${RED}Module $1 not found.${NC}"
  fi
}

menu
[[ "$CHOICE" == "6" ]] && echo "Bye." && exit 0

get_target

case "$CHOICE" in
  1) run_module diagnostics.sh ;;
  2) run_module port_scan.sh ;;
  3) run_module web_scan.sh ;;
  4) run_module advanced_network.sh ;;
  5)
    run_module diagnostics.sh
    run_module advanced_network.sh
    run_module port_scan.sh
    run_module web_scan.sh
    ;;
  *) echo -e "${RED}Invalid choice.${NC}" && exit 1 ;;
esac

echo -e "\n${GREEN}${BOLD}Report saved: $REPORT${NC}"
