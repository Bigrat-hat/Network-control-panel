# Network Control Panel

A full-stack network monitoring and security assessment tool combining a real-time React dashboard with Bash-based diagnostic automation.

## Features

### React Dashboard (Flask + React)
- Live bandwidth usage per process — auto-refreshing bar chart
- Active network connections table with suspicious port detection
- One-click process kill for suspicious connections
- IP blocking/unblocking via iptables

### Bash Diagnostic Tool
- Network diagnostics: ping, traceroute, latency, gateway, interfaces
- Advanced analysis: DNS, routing table, MTU discovery, TCP connectivity
- Port & service enumeration via Nmap (safe flags only)
- Web vulnerability simulation via Nikto (read-only, no exploits)
- Interactive menu + timestamped report generation

## Stack
- **Frontend:** React, Vite, Recharts
- **Backend:** Flask, psutil, iptables (Linux)
- **Scripts:** Bash, ping, traceroute, netstat/ss, Nmap, Nikto

## Setup

### Backend (Flask)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
sudo venv/bin/python3 app.py   # sudo needed for iptables + psutil
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Bash Scripts
```bash
# Install dependencies (Linux)
sudo apt install nmap nikto traceroute

# macOS
brew install nmap nikto

cd scripts
./scan.sh
```

## Script Menu Options
| Option | Module |
|--------|--------|
| 1 | Network Diagnostics (ping, traceroute, gateway) |
| 2 | Port & Service Enumeration (Nmap) |
| 3 | Web Vulnerability Scan (Nikto + SSL check) |
| 4 | Advanced Network Analysis (DNS, MTU, routing) |
| 5 | Full Scan — all modules |
| 6 | Exit |

## Project Structure
```
Network Control/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── network.py          # psutil + iptables logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── BandwidthChart.jsx
│   │       ├── Connections.jsx
│   │       └── IPBlocker.jsx
│   └── vite.config.js
├── scripts/
│   ├── scan.sh             # Main interactive menu
│   ├── diagnostics.sh      # Basic diagnostics
│   ├── advanced_network.sh # Advanced analysis
│   ├── port_scan.sh        # Nmap enumeration
│   ├── web_scan.sh         # Nikto + SSL
│   └── report/             # Generated scan reports
└── README.md
```

## Notes
- iptables and full psutil features require Linux + sudo
- Scan only systems you own or have explicit permission to test
- Nikto scans use `-Tuning 1234` — passive checks only, no exploit payloads
- Safe test targets: `127.0.0.1`, `scanme.nmap.org`
