import { useState, useEffect } from 'react'
import { Mail, Calendar, FolderOpen, RefreshCw, CheckCircle } from 'lucide-react'

const USER_ID = 'test123'
const BASE = 'https://twinmind-production-5a79.up.railway.app/api/mcp'

export default function MCPPanel() {
  const [tab, setTab] = useState('gmail')
  const [gmail, setGmail] = useState([])
  const [calendar, setCalendar] = useState([])
  const [drive, setDrive] = useState([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    fetch(BASE + '/status?user_id=' + USER_ID).then(r => r.json()).then(d => setConnected(d.connected))
  }, [])

  useEffect(() => { if (connected) fetchAll() }, [connected])

  async function fetchAll() {
    setLoading(true)
    const [g, c, d] = await Promise.all([
      fetch(BASE + '/gmail/messages?user_id=' + USER_ID).then(r => r.json()),
      fetch(BASE + '/calendar/events?user_id=' + USER_ID).then(r => r.json()),
      fetch(BASE + '/drive/files?user_id=' + USER_ID).then(r => r.json()),
    ])
    setGmail(g.messages || [])
    setCalendar(c.events || [])
    setDrive(d.files || [])
    setLoading(false)
  }

  const tabs = [
    { id: 'gmail', icon: Mail, label: 'Gmail', color: 'from-red-500 to-pink-500' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', color: 'from-blue-500 to-cyan-500' },
    { id: 'drive', icon: FolderOpen, label: 'Drive', color: 'from-yellow-500 to-orange-500' },
  ]

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6" style={{background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)'}}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)'}}>
          <Mail size={28} className="text-white" />
        </div>
        <p className="text-slate-300 text-sm font-medium">Google account connect பண்ணவும்</p>
        <button
          onClick={() => window.open(BASE + '/auth/google?user_id=' + USER_ID, '_blank')}
          className="px-5 py-2.5 rounded-xl text-sm text-white font-medium transition-all hover:scale-105"
          style={{background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)'}}
        >
          Connect Google
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a18 100%)'}}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" style={{boxShadow: '0 0 8px rgba(74,222,128,0.8)'}} />
          <span className="text-xs text-slate-300 font-medium">Google Connected</span>
        </div>
        <button onClick={fetchAll} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-all hover:bg-white/5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex p-2 gap-1">
        {tabs.map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ' + (tab === id ? 'text-white scale-105' : 'text-slate-500 hover:text-slate-300')}
            style={tab === id ? {background: 'linear-gradient(135deg, ' + (id === 'gmail' ? '#ef4444,#ec4899' : id === 'calendar' ? '#3b82f6,#06b6d4' : '#eab308,#f97316') + ')', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'} : {}}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{background: 'linear-gradient(90deg, #1a1a2e, #2a1a3e, #1a1a2e)', backgroundSize: '200% 100%'}} />
            ))}
          </div>
        )}

        {tab === 'gmail' && !loading && gmail.map(m => (
          <div key={m.id} className="rounded-xl p-3 border border-white/5 transition-all hover:scale-[1.02] hover:border-red-500/30 cursor-pointer"
            style={{background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(17,17,34,0.9))', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'}}>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background: 'linear-gradient(135deg, #ef4444, #ec4899)'}}>
                <Mail size={10} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{m.subject}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{m.from}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 opacity-70">{m.snippet}</p>
              </div>
            </div>
          </div>
        ))}

        {tab === 'calendar' && !loading && calendar.map(e => (
          <div key={e.id} className="rounded-xl p-3 border border-white/5 transition-all hover:scale-[1.02] hover:border-blue-500/30"
            style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(17,17,34,0.9))', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'}}>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'}}>
                <Calendar size={10} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">{e.summary}</p>
                <p className="text-xs mt-1" style={{color: '#60a5fa'}}>
                  {new Date(e.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {e.location && <p className="text-xs text-slate-500 mt-0.5">📍 {e.location}</p>}
              </div>
            </div>
          </div>
        ))}

        {tab === 'drive' && !loading && drive.map(f => (
          <div key={f.id} onClick={() => window.open(f.webViewLink, '_blank')}
            className="rounded-xl p-3 border border-white/5 transition-all hover:scale-[1.02] hover:border-yellow-500/30 cursor-pointer"
            style={{background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(17,17,34,0.9))', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'}}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #eab308, #f97316)'}}>
                <FolderOpen size={10} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(f.modifiedTime).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

