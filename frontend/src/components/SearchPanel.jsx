import { useState } from "react"
import { Search, Mail, Calendar, FolderOpen, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const USER_ID = "test123"
const BASE = "https://twinmind-production-5a79.up.railway.app/api/mcp"

export default function SearchPanel({ onClose }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState("all")

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(BASE + "/search?user_id=" + USER_ID + "&query=" + encodeURIComponent(query))
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalCount = results ? (results.emails?.length || 0) + (results.events?.length || 0) + (results.files?.length || 0) : 0

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(5,5,15,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "10vh 20px"
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 600,
          background: "rgba(10,12,30,0.95)", borderRadius: 16,
          border: "1px solid rgba(124,58,237,0.3)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1)",
          maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden"
        }}
      >
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={18} color="#818cf8" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emails, events, files..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "white", fontSize: 14
            }}
          />
          {loading && <Loader2 size={16} className="animate-spin" color="#818cf8" />}
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={18} />
          </button>
        </form>

        {results && (
          <div style={{ display: "flex", gap: 4, padding: "10px 16px 0" }}>
            {[
              { id: "all", label: "All (" + totalCount + ")" },
              { id: "emails", label: "Emails (" + (results.emails?.length || 0) + ")" },
              { id: "events", label: "Events (" + (results.events?.length || 0) + ")" },
              { id: "files", label: "Files (" + (results.files?.length || 0) + ")" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 11, border: "none", cursor: "pointer",
                background: tab === t.id ? "rgba(124,58,237,0.25)" : "transparent",
                color: tab === t.id ? "#a78bfa" : "#64748b"
              }}>{t.label}</button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {!results && !loading && (
            <p style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>
              Type something to search across Gmail, Calendar & Drive
            </p>
          )}

          {results && totalCount === 0 && (
            <p style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>
              No results found for "{query}"
            </p>
          )}

          {results && (tab === "all" || tab === "emails") && results.emails?.map(m => (
            <a key={m.id} href={"https://mail.google.com/mail/u/0/#inbox/" + m.id} target="_blank" rel="noreferrer"
              style={{ display: "block", padding: 10, borderRadius: 10, marginBottom: 6, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", textDecoration: "none" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Mail size={13} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#e2e8f0", margin: 0, fontWeight: 500 }}>{m.subject}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{m.from}</p>
                </div>
              </div>
            </a>
          ))}

          {results && (tab === "all" || tab === "events") && results.events?.map(e => (
            <div key={e.id} style={{ padding: 10, borderRadius: 10, marginBottom: 6, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Calendar size={13} color="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, color: "#e2e8f0", margin: 0, fontWeight: 500 }}>{e.summary}</p>
                  <p style={{ fontSize: 11, color: "#60a5fa", margin: "2px 0 0" }}>
                    {new Date(e.start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {results && (tab === "all" || tab === "files") && results.files?.map(f => (
            <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer"
              style={{ display: "block", padding: 10, borderRadius: 10, marginBottom: 6, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", textDecoration: "none" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <FolderOpen size={13} color="#eab308" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#e2e8f0", margin: 0 }}>{f.name}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

