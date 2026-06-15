import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#4299e1','#48bb78','#ed8936','#f56565','#9f7aea','#38b2ac','#fc8181','#68d391','#63b3ed','#fbd38d']

export default function BandwidthChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetch_ = () => fetch('/api/bandwidth').then(r => r.json()).then(setData).catch(() => {})
    fetch_()
    const id = setInterval(fetch_, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card">
      <h2>Live Bandwidth (KB/s)</h2>
      {data.length === 0
        ? <p style={{ color: '#4a5568', textAlign: 'center', padding: '20px 0' }}>No active I/O</p>
        : <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 11 }} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 6 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={v => [`${v} KB/s`]}
              />
              <Bar dataKey="rate_kb" radius={[3, 3, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
      }
    </div>
  )
}
