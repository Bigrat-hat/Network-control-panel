import { useState } from 'react'
import BandwidthChart from './components/BandwidthChart'
import Connections from './components/Connections'
import IPBlocker from './components/IPBlocker'
import TopologyViewer from './components/TopologyViewer'

const TABS = ['Dashboard', 'Topology Viewer']

export default function App() {
  const [tab, setTab] = useState('Dashboard')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>🛡 Network Control Panel</h1>
        <p style={{ color: '#4a5568', marginTop: 4 }}>Real-time monitoring & control</p>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Dashboard' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <BandwidthChart />
          <Connections />
          <IPBlocker />
        </div>
      )}

      {tab === 'Topology Viewer' && <TopologyViewer />}
    </div>
  )
}
