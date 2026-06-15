import psutil
import subprocess
import time
import platform
import socket
import ssl
import ipaddress

_last_io = {}
_last_time = {}

SUSPICIOUS_PORTS = {4444, 1337, 31337, 12345, 6666, 9999}

DEFAULT_DEVICES = [
    {"id": 1, "name": "Router",         "ip": "192.168.1.1", "type": "Router"},
    {"id": 2, "name": "Google DNS",     "ip": "8.8.8.8",     "type": "Server"},
    {"id": 3, "name": "Cloudflare DNS", "ip": "1.1.1.1",     "type": "Server"},
    {"id": 4, "name": "Local Machine",  "ip": "127.0.0.1",   "type": "PC"},
]


def ping_device(ip):
    flag = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        r = subprocess.run(["ping", flag, "1", "-W", "1", ip],
                           capture_output=True, text=True, timeout=3)
        online = r.returncode == 0
        latency = None
        for line in r.stdout.splitlines():
            if "time=" in line:
                try:
                    latency = float(line.split("time=")[1].split()[0].replace("ms", ""))
                except Exception:
                    pass
        return online, latency
    except Exception:
        return False, None


def get_topology_status(devices=None):
    devices = devices or DEFAULT_DEVICES
    return [{**d, "online": (ol := ping_device(d["ip"]))[0],
             "latency": ol[1], "checked_at": time.strftime("%H:%M:%S")}
            for d in devices]


def get_system_info():
    uname = platform.uname()
    return {
        "hostname": socket.gethostname(),
        "os": f"{uname.system} {uname.release}",
        "machine": uname.machine,
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "ram_total_gb": round(psutil.virtual_memory().total / 1e9, 2),
        "ram_used_percent": psutil.virtual_memory().percent,
        "boot_time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(psutil.boot_time())),
    }


def get_interfaces():
    result = []
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()
    for iface, addr_list in addrs.items():
        st = stats.get(iface)
        ips = [a.address for a in addr_list if a.family == socket.AF_INET]
        result.append({
            "name": iface,
            "ips": ips,
            "up": st.isup if st else False,
            "speed": st.speed if st else 0,
            "mtu": st.mtu if st else 0,
        })
    return result


def get_open_ports():
    ports = []
    try:
        for c in psutil.net_connections(kind='inet'):
            if c.status == 'LISTEN':
                try:
                    name = psutil.Process(c.pid).name() if c.pid else "unknown"
                except Exception:
                    name = "unknown"
                ports.append({"port": c.laddr.port, "ip": c.laddr.ip, "pid": c.pid, "process": name})
    except Exception:
        pass
    return sorted(ports, key=lambda x: x['port'])


def get_bandwidth():
    global _last_io, _last_time
    result = []
    try:
        now = time.time()
        for p in psutil.process_iter(['pid', 'name']):
            try:
                io = p.io_counters()
                curr = io.read_bytes + io.write_bytes
                prev = _last_io.get(p.pid, curr)
                elapsed = now - _last_time.get(p.pid, now)
                rate = (curr - prev) / elapsed if elapsed > 0 else 0
                _last_io[p.pid] = curr
                _last_time[p.pid] = now
                if rate > 0:
                    result.append({"pid": p.pid, "name": p.info['name'], "rate_kb": round(rate / 1024, 2)})
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass
    return sorted(result, key=lambda x: x['rate_kb'], reverse=True)[:10]


def get_net_bandwidth():
    io = psutil.net_io_counters(pernic=True)
    return {iface: {"sent_mb": round(v.bytes_sent / 1e6, 2), "recv_mb": round(v.bytes_recv / 1e6, 2)}
            for iface, v in io.items()}


def get_connections():
    conns = []
    try:
        for c in psutil.net_connections(kind='inet'):
            if c.status == 'ESTABLISHED' and c.raddr:
                try:
                    name = psutil.Process(c.pid).name() if c.pid else "unknown"
                except Exception:
                    name = "unknown"
                suspicious = c.raddr.port in SUSPICIOUS_PORTS or c.laddr.port in SUSPICIOUS_PORTS
                conns.append({"pid": c.pid, "name": name,
                               "laddr": f"{c.laddr.ip}:{c.laddr.port}",
                               "raddr": f"{c.raddr.ip}:{c.raddr.port}",
                               "status": c.status, "suspicious": suspicious})
    except Exception:
        pass
    return conns


def tool_myip():
    try:
        import urllib.request
        with urllib.request.urlopen("https://ipinfo.io/json", timeout=5) as r:
            import json
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}


def tool_ping(target):
    online, latency = ping_device(target)
    return {"target": target, "online": online, "latency": latency}


def tool_dns(target):
    try:
        results = socket.getaddrinfo(target, None)
        ips = list({r[4][0] for r in results})
        return {"target": target, "ips": ips}
    except Exception as e:
        return {"error": str(e)}


def tool_portscan(target):
    common = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443]
    open_ports = []
    for port in common:
        try:
            with socket.create_connection((target, port), timeout=0.5):
                open_ports.append(port)
        except Exception:
            pass
    return {"target": target, "open_ports": open_ports}


def tool_ssl(target):
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=target) as s:
            s.settimeout(5)
            s.connect((target, 443))
            cert = s.getpeercert()
            return {
                "subject": dict(x[0] for x in cert.get("subject", [])),
                "issuer": dict(x[0] for x in cert.get("issuer", [])),
                "expires": cert.get("notAfter"),
                "version": cert.get("version"),
            }
    except Exception as e:
        return {"error": str(e)}


def tool_subnet(cidr):
    try:
        net = ipaddress.IPv4Network(cidr, strict=False)
        return {
            "network": str(net.network_address),
            "broadcast": str(net.broadcast_address),
            "netmask": str(net.netmask),
            "prefix": net.prefixlen,
            "total_hosts": net.num_addresses - 2,
            "first_host": str(list(net.hosts())[0]) if net.num_addresses > 2 else "N/A",
            "last_host": str(list(net.hosts())[-1]) if net.num_addresses > 2 else "N/A",
        }
    except Exception as e:
        return {"error": str(e)}


def tool_traceroute(target):
    cmd = ["traceroute", "-m", "15", target] if platform.system() != "Windows" else ["tracert", target]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        hops = []
        for line in r.stdout.splitlines()[1:]:
            line = line.strip()
            if line:
                hops.append(line)
        return {"target": target, "hops": hops}
    except Exception as e:
        return {"error": str(e)}


def block_ip(ip):
    r = subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"],
                       capture_output=True, text=True)
    return r.returncode == 0, r.stderr


def unblock_ip(ip):
    r = subprocess.run(["sudo", "iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"],
                       capture_output=True, text=True)
    return r.returncode == 0, r.stderr


def get_blocked_ips():
    r = subprocess.run(["sudo", "iptables", "-L", "INPUT", "-n", "--line-numbers"],
                       capture_output=True, text=True)
    return [p for line in r.stdout.splitlines() if "DROP" in line
            for p in line.split() if p.count('.') == 3]


def kill_process(pid):
    try:
        psutil.Process(pid).kill()
        return True, ""
    except Exception as e:
        return False, str(e)
