import { useEffect, useState } from 'react'

export default function IPBlocker() {
  const [ip, setIp] = useState('')
  const [blocked, setBlocked] = useState([])
  const [msg, setMsg] = useState('')

  const fetchBlocked = () => fetch('/api/blocked').then(r => r.json()).then(setBlocked).catch(() => {})
  useEffect(() => { fetchBlocked() }, [])

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const block = async () => {
    if (!ip.trim()) return
    const d = await fetch('/api/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip }) }).then(r => r.json())
    notify(d.ok ? `Blocked ${ip}` : `Error: ${d.error}`)
    if (d.ok) { setIp(''); fetchBlocked() }
  }

  const unblock = async (addr) => {
    const d = await fetch('/api/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: addr }) }).then(r => r.json())
    notify(d.ok ? `Unblocked ${addr}` : `Error: ${d.error}`)
    if (d.ok) fetchBlocked()
  }

  return (
    <div className="card">
      <h2>IP Blocker (iptables)</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.100"
          style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && block()} />
        <button className="btn-red" onClick={block}>Block IP</button>
      </div>
      {msg && <p style={{ marginBottom: 12, color: '#68d391', fontSize: 13 }}>{msg}</p>}
      <table>
        <thead><tr><th>Blocked IP</th><th></th></tr></thead>
        <tbody>
          {blocked.length === 0
            ? <tr><td colSpan={2} style={{ color: '#4a5568', textAlign: 'center', padding: '12px 0' }}>No blocked IPs</td></tr>
            : blocked.map((addr, i) => (
              <tr key={i}>
                <td>{addr}</td>
                <td><button className="btn-green" onClick={() => unblock(addr)}>Unblock</button></td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
