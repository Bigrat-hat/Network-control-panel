from flask import Flask, jsonify, request
from flask_cors import CORS
import network

app = Flask(__name__)
CORS(app)


@app.get("/api/bandwidth")
def bandwidth():
    return jsonify(network.get_bandwidth())


@app.get("/api/connections")
def connections():
    return jsonify(network.get_connections())


@app.get("/api/blocked")
def blocked():
    return jsonify(network.get_blocked_ips())


@app.post("/api/block")
def block():
    ip = request.json.get("ip", "").strip()
    if not ip:
        return jsonify({"ok": False, "error": "IP required"}), 400
    ok, err = network.block_ip(ip)
    return jsonify({"ok": ok, "error": err})


@app.post("/api/unblock")
def unblock():
    ip = request.json.get("ip", "").strip()
    if not ip:
        return jsonify({"ok": False, "error": "IP required"}), 400
    ok, err = network.unblock_ip(ip)
    return jsonify({"ok": ok, "error": err})


@app.post("/api/kill")
def kill():
    pid = request.json.get("pid")
    if not pid:
        return jsonify({"ok": False, "error": "PID required"}), 400
    ok, err = network.kill_process(int(pid))
    return jsonify({"ok": ok, "error": err})


@app.get("/api/topology")
def topology():
    return jsonify(network.get_topology_status())


@app.post("/api/topology/ping")
def topology_ping():
    return jsonify(network.get_topology_status(request.json.get("devices")))


# Network Info endpoints
@app.get("/api/sysinfo")
def sysinfo():
    return jsonify(network.get_system_info())


@app.get("/api/interfaces")
def interfaces():
    return jsonify(network.get_interfaces())


@app.get("/api/ports")
def ports():
    return jsonify(network.get_open_ports())


@app.get("/api/netbandwidth")
def netbandwidth():
    return jsonify(network.get_net_bandwidth())


# Network Tools endpoints
@app.get("/api/tools/myip")
def myip():
    return jsonify(network.tool_myip())


@app.post("/api/tools/ping")
def tool_ping():
    return jsonify(network.tool_ping(request.json.get("target", "")))


@app.post("/api/tools/dns")
def tool_dns():
    return jsonify(network.tool_dns(request.json.get("target", "")))


@app.post("/api/tools/portscan")
def tool_portscan():
    return jsonify(network.tool_portscan(request.json.get("target", "")))


@app.post("/api/tools/ssl")
def tool_ssl():
    return jsonify(network.tool_ssl(request.json.get("target", "")))


@app.post("/api/tools/subnet")
def tool_subnet():
    return jsonify(network.tool_subnet(request.json.get("target", "")))


@app.post("/api/tools/traceroute")
def tool_traceroute():
    return jsonify(network.tool_traceroute(request.json.get("target", "")))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
