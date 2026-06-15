import { useEffect, useState } from 'react'

export default function Connections() {
  const [conns, setConns] = useState([])

  useEffect(() => {
    const fetch_ = () => fetch('/api/connections').then(r => r.json()).then(setConns).catch(() => {})
    fetch_()
    const id = setInterval(fetch_, 3000)
    return () => clearInterval(id)
  }, [])

  const kill = (pid) =>
    fetch('/api/kill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid }) })
      .then(r => r.json()).then(d => { if (!d.ok) alert('Kill failed: ' + d.error) })

  return (
    <div className="card">
      <h2>Active Connections ({conns.length})</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Process</th><th>PID</th><th>Local</th><th>Remote</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {conns.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: '#4a5568', padding: '20px 0' }}>No connections</td></tr>
              : conns.map((c, i) => (
                <tr key={i} className={c.suspicious ? 'suspicious' : ''}>
                  <td>{c.name}</td><td>{c.pid}</td><td>{c.laddr}</td><td>{c.raddr}</td>
                  <td>
                    {c.suspicious && <span className="badge badge-red" style={{ marginRight: 6 }}>⚠ SUSPICIOUS</span>}
                    {c.status}
                  </td>
                  <td>{c.pid && <button className="btn-red" onClick={() => kill(c.pid)}>Kill</button>}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
