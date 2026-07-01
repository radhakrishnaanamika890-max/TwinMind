import { useEffect, useState } from "react"
import { Mail, Calendar, FolderOpen, Sparkles, X, Loader2, Copy, Check } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

const BASE = "https://twinmind-production-5a79.up.railway.app/api/mcp"

function EmailPanel({ userId, onClose }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [suggestions, setSuggestions] = useState({})
  const [generating, setGenerating] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  useEffect(() => {
    fetch(`${BASE}/gmail/messages?user_id=${userId}&max_results=8`)
      .then(r => r.json())
      .then(d => setEmails(d.messages || []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false))
  }, [userId])

  const generateReply = async (messageId) => {
    setGenerating(messageId)
    try {
      const res = await fetch(`${BASE}/gmail/smart-reply?user_id=${userId}&message_id=${messageId}`)
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setSuggestions(prev => ({ ...prev, [messageId]: data.suggestions }))
      }
    } catch {
      toast.error("Could not generate reply")
    } finally {
      setGenerating(null)
    }
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{
        position: "absolute", top: "100%", left: 16, right: 16, zIndex: 40, marginTop: 6,
        maxHeight: 420, overflowY: "auto",
        background: "rgba(8,13,46,0.97)", backdropFilter: "blur(24px)",
        border: "1px solid rgba(100,150,255,0.25)", borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(100,150,255,0.12)", position: "sticky", top: 0, background: "rgba(8,13,46,0.97)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>📧 Recent Emails</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 2 }}>
          <X size={14}/>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 12 }}>
          <Loader2 size={16} className="animate-spin" style={{ margin: "0 auto 8px" }}/>
          Loading emails...
        </div>
      ) : emails.length === 0 ? (
        <p style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 12 }}>No emails found</p>
      ) : (
        <div style={{ padding: 8 }}>
          {emails.map(email => (
            <div key={email.id} style={{
              padding: 10, borderRadius: 10, marginBottom: 4,
              background: activeId === email.id ? "rgba(124,58,237,0.1)" : "transparent",
              border: "1px solid rgba(100,150,255,0.08)"
            }}>
              <div style={{ cursor: "pointer" }} onClick={() => setActiveId(activeId === email.id ? null : email.id)}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "white", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email.subject || "(No subject)"}
                </p>
                <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email.from}
                </p>
                <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email.snippet}
                </p>
              </div>

              <AnimatePresence>
                {activeId === email.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden", marginTop: 8 }}>

                    {!suggestions[email.id] ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); generateReply(email.id) }}
                        disabled={generating === email.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "white",
                          fontSize: 11, fontWeight: 500, boxShadow: "0 2px 10px rgba(100,80,255,0.3)"
                        }}>
                        {generating === email.id
                          ? <><Loader2 size={11} className="animate-spin"/> Generating...</>
                          : <><Sparkles size={11}/> Smart Reply</>}
                      </button>
                    ) : (
                      <div style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,150,255,0.15)",
                        borderRadius: 10, padding: 12
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 600 }}>✨ Suggested replies</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(suggestions[email.id], email.id) }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === email.id ? "#34d399" : "#64748b", display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                            {copiedKey === email.id ? <><Check size={10}/>Copied</> : <><Copy size={10}/>Copy</>}
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                          {suggestions[email.id]}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function StatsBar() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ emails: 0, events: 0, files: 0, connected: false })
  const [showEmails, setShowEmails] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    const USER_ID = user.uid
    async function load() {
      try {
        const [s, g, c, d] = await Promise.all([
          fetch(BASE + "/status?user_id=" + USER_ID).then(r => r.json()),
          fetch(BASE + "/gmail/messages?user_id=" + USER_ID).then(r => r.json()),
          fetch(BASE + "/calendar/events?user_id=" + USER_ID).then(r => r.json()),
          fetch(BASE + "/drive/files?user_id=" + USER_ID).then(r => r.json()),
        ])
        setStats({ connected: s.connected, emails: (g.messages || []).length, events: (c.events || []).length, files: (d.files || []).length })
      } catch (e) {}
    }
    load()
  }, [user])

  if (!stats.connected) return null

  const items = [
    { icon: Mail, label: "emails", value: stats.emails, from: "#ef4444", to: "#ec4899", clickable: true },
    { icon: Calendar, label: "events", value: stats.events, from: "#3b82f6", to: "#06b6d4" },
    { icon: FolderOpen, label: "files", value: stats.files, from: "#eab308", to: "#f97316" },
  ]

  return (
    <div style={{ position: "relative" }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5" style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.05), rgba(37,99,235,0.05))" }}>
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }} />
          <span className="text-xs font-medium" style={{ background: "linear-gradient(90deg, #7c3aed, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Google</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        {items.map(({ icon: Icon, label, value, from, to, clickable }) => (
          <div key={label}
            onClick={() => clickable && setShowEmails(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{
              background: showEmails && clickable ? `linear-gradient(135deg, ${from}30, ${to}20)` : `linear-gradient(135deg, ${from}15, ${to}10)`,
              cursor: clickable ? "pointer" : "default",
              border: clickable ? "1px solid rgba(255,255,255,0.06)" : "none",
              transition: "all 0.15s"
            }}>
            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
              <Icon size={9} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white">{value}</span>
            <span className="text-xs text-slate-500">{label}</span>
            {clickable && <Sparkles size={9} color="#a78bfa" style={{ marginLeft: 2 }}/>}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showEmails && user?.uid && (
          <EmailPanel userId={user.uid} onClose={() => setShowEmails(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

