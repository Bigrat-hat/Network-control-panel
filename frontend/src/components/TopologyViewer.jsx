import { useEffect, useRef, useState } from 'react'

const TYPE_ICON = { Router: '🔀', Server: '🖥️', PC: '💻', DNS: '🌐', default: '📡' }
const DEFAULT_DEVICES = [
  { id: 1, name: 'Router',         ip: '192.168.1.1', type: 'Router' },
  { id: 2, name: 'Google DNS',     ip: '8.8.8.8',     type: 'Server' },
  { id: 3, name: 'Cloudflare DNS', ip: '1.1.1.1',     type: 'Server' },
  { id: 4, name: 'Local Machine',  ip: '127.0.0.1',   type: 'PC'     },
]
const FILTERS = ['all', 'online', 'offline', 'Router', 'Server', 'PC']
const api = (path, body) => fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined).then(r => r.json())

// Mini ping history canvas chart
function PingChart({ history }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    const w = c.width, h = c.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, w, h)
    if (history.length < 2) return
    const vals = history.map(x => x ?? 0)
    const max = Math.max(...vals, 1)
    ctx.strokeStyle = '#4299e1'; ctx.lineWidth = 2; ctx.beginPath()
    vals.forEach((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - (v / max) * (h - 10) - 5
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.fillStyle = '#a0aec0'; ctx.font = '10px sans-serif'
    ctx.fillText(`${Math.round(max)}ms`, 2, 12)
  }, [history])
  return <canvas ref={ref} width={280} height={100} style={{ borderRadius: 4, width: '100%' }} />
}

export default function TopologyViewer() {
  const [devices, setDevices] = useState(DEFAULT_DEVICES)
  const [statuses, setStatuses] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [pingHistory, setPingHistory] = useState({})  // id -> [latency...]
  const [form, setForm] = useState({ name: '', ip: '', type: 'PC' })
  const [loading, setLoading] = useState(false)
  const [panel, setPanel] = useState(null) // 'info' | 'tools'
  const [sysinfo, setSysinfo] = useState(null)
  const [interfaces, setInterfaces] = useState([])
  const [netbw, setNetbw] = useState({})
  const [openPorts, setOpenPorts] = useState([])
  const [toolTarget, setToolTarget] = useState('')
  const [toolResult, setToolResult] = useState(null)
  const [toolTitle, setToolTitle] = useState('')
  const [toolLoading, setToolLoading] = useState(false)

  const poll = (devs) => {
    setLoading(true)
    api('/api/topology/ping', { devices: devs })
      .then(data => {
        setStatuses(data)
        setLoading(false)
        setPingHistory(prev => {
          const next = { ...prev }
          data.forEach(d => {
            const hist = next[d.id] || []
            next[d.id] = [...hist.slice(-19), d.latency]
          })
          return next
        })
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    poll(devices)
    const id = setInterval(() => poll(devices), 5000)
    return () => clearInterval(id)
  }, [devices])

  const getS = (id) => statuses.find(s => s.id === id)

  const online = statuses.filter(s => s.online).length
  const offline = statuses.filter(s => !s.online).length
  const latencies = statuses.filter(s => s.latency).map(s => s.latency)
  const avgPing = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0

  const filtered = devices.filter(d => {
    const s = getS(d.id)
    if (filter === 'online' && !s?.online) return false
    if (filter === 'offline' && s?.online) return false
    if (!['all', 'online', 'offline'].includes(filter) && d.type !== filter) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.ip.includes(search)) return false
    return true
  })

  const loadNetInfo = () => {
    setPanel('info')
    api('/api/sysinfo').then(setSysinfo)
    api('/api/interfaces').then(setInterfaces)
    api('/api/netbandwidth').then(setNetbw)
    api('/api/ports').then(setOpenPorts)
  }

  const runTool = async (tool) => {
    setToolLoading(true)
    setToolTitle(tool.toUpperCase())
    setToolResult(null)
    try {
      let res
      if (tool === 'myip') res = await api('/api/tools/myip')
      else if (tool === 'traceroute') res = await api('/api/tools/traceroute', { target: toolTarget })
      else res = await api(`/api/tools/${tool}`, { target: toolTarget })
      setToolResult(res)
    } catch (e) {
      setToolResult({ error: String(e) })
    }
    setToolLoading(false)
  }

  const exportData = () => {
    const data = { devices, statuses, exported_at: new Date().toISOString() }
    const a = document.createElement('a')
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(data, null, 2))
    a.download = `network-export-${Date.now()}.json`
    a.click()
  }

  const addDevice = () => {
    if (!form.name || !form.ip) return
    setDevices(d => [...d, { id: Date.now(), ...form }])
    setForm({ name: '', ip: '', type: 'PC' })
  }

  const s = { panel: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, padding: 16 } }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header bar */}
      <div style={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🌐 Network Topology Viewer</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search devices..."
          style={{ flex: '1 1 160px', minWidth: 0 }} />
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          {[['Online', online, '#68d391'], ['Offline', offline, '#fc8181'], ['Avg Ping', `${avgPing}ms`, '#fbd38d']].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ color: c, fontWeight: 700, fontSize: 16 }}>{v}</div>
              <div style={{ color: '#718096', fontSize: 11 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-gray" onClick={() => poll(devices)}>🔄 Refresh</button>
          <button className="btn-gray" onClick={loadNetInfo}>📡 Info</button>
          <button className="btn-gray" onClick={() => setPanel(panel === 'tools' ? null : 'tools')}>🔧 Tools</button>
        </div>
        <span style={{ fontSize: 11, color: loading ? '#ed8936' : '#68d391' }}>
          {loading ? '⟳ Polling...' : '● Live 5s'}
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #2d3148', cursor: 'pointer', fontSize: 12,
              background: filter === f ? '#4299e1' : '#1a1d27', color: filter === f ? '#fff' : '#a0aec0' }}>
            {f === 'all' ? 'All Devices' : f === 'online' ? '🟢 Online' : f === 'offline' ? '🔴 Offline' : f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || panel ? '1fr 340px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Device grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {filtered.map(dev => {
              const st = getS(dev.id)
              const color = st == null ? '#4a5568' : st.online ? '#68d391' : '#fc8181'
              return (
                <div key={dev.id} onClick={() => setSelected(selected?.id === dev.id ? null : (st || dev))}
                  style={{ background: '#0f1117', border: `1px solid ${color}`, borderRadius: 8, padding: '14px 10px',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    boxShadow: selected?.id === dev.id ? `0 0 0 2px ${color}` : 'none' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{TYPE_ICON[dev.type] || TYPE_ICON.default}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{dev.name}</div>
                  <div style={{ color: '#718096', fontSize: 11, margin: '2px 0 6px' }}>{dev.ip}</div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 4 }} />
                  <span style={{ color, fontSize: 11, fontWeight: 600 }}>{st == null ? 'Pending' : st.online ? 'Online' : 'Offline'}</span>
                  {st?.latency && <div style={{ color: '#a0aec0', fontSize: 11 }}>{st.latency}ms</div>}
                </div>
              )
            })}
          </div>

          {/* Add device */}
          <div style={s.panel}>
            <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>ADD DEVICE</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" style={{ flex: '1 1 100px' }} />
              <input value={form.ip} onChange={e => setForm(f => ({ ...f, ip: e.target.value }))} placeholder="IP" style={{ flex: '1 1 120px' }} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: 4, color: '#e2e8f0', padding: '6px 8px' }}>
                {['PC', 'Router', 'Server', 'DNS'].map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="btn-green" onClick={addDevice}>+ Add</button>
            </div>
          </div>
        </div>

        {/* Right panel: Device details OR Network Info OR Tools */}
        {selected && !panel && (
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>{TYPE_ICON[selected.type] || TYPE_ICON.default} {selected.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-red" style={{ fontSize: 11 }} onClick={() => { setDevices(d => d.filter(x => x.id !== selected.id)); setSelected(null) }}>Remove</button>
                <button className="btn-gray" style={{ fontSize: 11 }} onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            <table style={{ fontSize: 13, marginBottom: 16 }}>
              <tbody>
                {[['IP', selected.ip], ['Type', selected.type],
                  ['Status', selected.online ? '✅ Online' : '❌ Offline'],
                  ['Latency', selected.latency ? `${selected.latency}ms` : '—'],
                  ['Checked', selected.checked_at || '—']].map(([k, v]) => (
                  <tr key={k}><td style={{ color: '#718096', paddingRight: 12, paddingBottom: 4 }}>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>PING HISTORY</div>
              <PingChart history={pingHistory[selected.id] || []} />
            </div>
            <button className="btn-gray" style={{ width: '100%', fontSize: 12 }}
              onClick={() => { setToolTarget(selected.ip); setPanel('tools') }}>
              🔧 Run Tools on this device
            </button>
          </div>
        )}

        {panel === 'info' && (
          <div style={{ ...s.panel, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>📡 Network Information</span>
              <button className="btn-gray" style={{ fontSize: 11 }} onClick={() => setPanel(null)}>✕</button>
            </div>

            {sysinfo && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>SYSTEM INFO</div>
                <table style={{ fontSize: 12 }}><tbody>
                  {Object.entries(sysinfo).map(([k, v]) => (
                    <tr key={k}><td style={{ color: '#718096', paddingRight: 10, paddingBottom: 3 }}>{k}</td><td>{String(v)}</td></tr>
                  ))}
                </tbody></table>
              </div>
            )}

            {interfaces.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>NETWORK INTERFACES</div>
                {interfaces.map(i => (
                  <div key={i.name} style={{ background: '#0f1117', borderRadius: 4, padding: '6px 10px', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: i.up ? '#68d391' : '#fc8181' }}>{i.name}</span>
                    <span style={{ color: '#718096', marginLeft: 8 }}>{i.ips.join(', ') || 'no IP'}</span>
                    <span style={{ float: 'right', color: '#a0aec0' }}>MTU {i.mtu}</span>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(netbw).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>BANDWIDTH USAGE</div>
                {Object.entries(netbw).map(([iface, bw]) => (
                  <div key={iface} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#a0aec0' }}>{iface}</span>
                    <span>↑{bw.sent_mb}MB ↓{bw.recv_mb}MB</span>
                  </div>
                ))}
              </div>
            )}

            {openPorts.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>OPEN PORTS (LISTENING)</div>
                <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {openPorts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: '#4299e1' }}>{p.port}</span>
                      <span style={{ color: '#a0aec0' }}>{p.process}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-green" style={{ width: '100%', fontSize: 12 }} onClick={exportData}>
              📥 Export All Network Data
            </button>
          </div>
        )}

        {panel === 'tools' && (
          <div style={{ ...s.panel, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 600 }}>🔧 Network Tools</span>
              <button className="btn-gray" style={{ fontSize: 11 }} onClick={() => setPanel(null)}>✕</button>
            </div>

            <button onClick={() => runTool('myip')}
              style={{ width: '100%', marginBottom: 10, padding: '8px', background: '#9b59b6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
              🌐 My IP Info
            </button>

            <input value={toolTarget} onChange={e => setToolTarget(e.target.value)}
              placeholder="Enter IP or Domain (e.g. google.com)"
              style={{ width: '100%', marginBottom: 10 }}
              onKeyDown={e => e.key === 'Enter' && runTool('ping')} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {[['ping', '🟢 Ping', '#27ae60'], ['portscan', '🔍 Port Scan', '#2980b9'],
                ['dns', '🌐 DNS Lookup', '#2980b9'], ['ssl', '🔒 SSL Info', '#2980b9'],
                ['subnet', '🔢 Subnet Calc', '#2980b9'], ['traceroute', '🗺 Traceroute', '#e67e22']].map(([t, label, bg]) => (
                <button key={t} onClick={() => runTool(t)}
                  style={{ padding: '8px 4px', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                  {label}
                </button>
              ))}
            </div>

            {(toolLoading || toolResult) && (
              <div style={{ background: '#0f1117', borderRadius: 4, padding: 10 }}>
                <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
                  {toolLoading ? `⟳ Running ${toolTitle}...` : `▶ ${toolTitle} RESULT`}
                </div>
                {toolResult && (
                  <pre style={{ fontSize: 11, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 300, overflowY: 'auto' }}>
                    {JSON.stringify(toolResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
