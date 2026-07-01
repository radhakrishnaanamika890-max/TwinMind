import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Sparkles, Brain, Settings, LogOut } from "lucide-react"
import { useChat } from "@/hooks/ChatContext"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/hooks/useTheme"

function groupByDate(sessions) {
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const groups = { Today: [], Yesterday: [], Earlier: [] }
  sessions.forEach(s => {
    const d = new Date(s.created_at*1000); d.setHours(0,0,0,0)
    if (d.getTime() === today.getTime()) groups.Today.push(s)
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(s)
    else groups.Earlier.push(s)
  })
  return groups
}

export default function Sidebar() {
  const { mode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { sessions, activeSession, isLoading, fetchSessions, startSession, switchSession, removeSession } = useChat()
  const [collapsed, setCollapsed] = useState(false)
  const [hoverId, setHoverId] = useState(null)

  useEffect(() => {
    if (user?.uid) fetchSessions()
  }, [user?.uid, fetchSessions])

  const handleNewChat = async () => {
    navigate("/dashboard")
    await startSession("New Chat")
  }

  const handleSelect = async (s) => {
    console.log("[Sidebar] Selecting session:", s)
    navigate("/dashboard")
    await switchSession(s)
    console.log("[Sidebar] Switch complete")
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    await removeSession(id)
  }

  const groups = groupByDate(sessions)
  const isChat = location.pathname === "/dashboard" || location.pathname === "/dashboard/"

  const navItems = [
    { icon: <MessageSquare size={15}/>, label: "Chat", path: "/dashboard" },
    { icon: <Brain size={15}/>, label: "Memory", path: "/dashboard/memory" },
    { icon: <Settings size={15}/>, label: "Settings", path: "/dashboard/settings" },
  ]

  return (
    <motion.div
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        height: "100%", flexShrink: 0, overflow: "hidden",
        background: mode === "light" ? "rgba(255,255,255,0.85)" : "rgba(6,10,40,0.9)", backdropFilter: "blur(20px)",
        borderRight: mode === "light" ? "1px solid rgba(100,100,255,0.15)" : "1px solid rgba(80,120,255,0.15)",
        display: "flex", flexDirection: "column", position: "relative", zIndex: 20
      }}>

      <div style={{ padding: "14px 10px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                boxShadow: "0 0 12px rgba(124,58,237,0.5)"
              }}>
                <Sparkles size={13} color="white"/>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#c7d2fe", whiteSpace: "nowrap" }}>TwinMind</span>
              <span style={{ fontSize: 9, background: "rgba(124,58,237,0.3)", color: "#a78bfa", borderRadius: 4, padding: "1px 5px", border: "1px solid rgba(124,58,237,0.4)" }}>AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(v => !v)} style={{
          padding: 5, borderRadius: 6, border: "none", cursor: "pointer",
          background: "transparent", color: "#475569", marginLeft: collapsed ? "auto" : 0,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>
      </div>

      <div style={{ padding: "4px 8px 8px", flexShrink: 0 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path || (item.path === "/dashboard" && isChat)
          return (
            <button key={item.path} onClick={() => navigate(item.path)} title={item.label}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 8, padding: collapsed ? "7px" : "7px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 7, border: "none", cursor: "pointer", marginBottom: 2,
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#a78bfa" : "#475569",
                fontSize: 12, transition: "all 0.15s", textAlign: "left", fontFamily: "inherit"
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
              {item.icon}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ whiteSpace: "nowrap", fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: "rgba(80,120,255,0.1)", margin: "0 10px 8px", flexShrink: 0 }}/>

      <div style={{ padding: "0 8px 8px", flexShrink: 0 }}>
        <button onClick={handleNewChat} title="New chat" style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: collapsed ? "8px" : "8px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 8, border: "1px solid rgba(124,58,237,0.35)", cursor: "pointer",
          background: "rgba(124,58,237,0.15)", color: "#a78bfa", fontSize: 12,
          transition: "all 0.2s", fontFamily: "inherit"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.28)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.15)"}>
          <Plus size={14} style={{ flexShrink: 0 }}/>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ whiteSpace: "nowrap", fontWeight: 500 }}>New chat</motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 8px" }}>
        {isLoading ? (
          <div style={{ padding: "8px 4px" }}>
            {[...Array(3)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                style={{ height: 28, borderRadius: 6, background: "rgba(80,120,255,0.08)", marginBottom: 6 }}/>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <AnimatePresence>
            {!collapsed && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "16px 8px", margin: 0 }}>
                No chats yet — start one!
              </motion.p>
            )}
          </AnimatePresence>
        ) : (
          Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label} style={{ marginBottom: 10 }}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 10, color: "#334155", fontWeight: 600, textTransform: "uppercase",
                        letterSpacing: "0.08em", padding: "0 4px", marginBottom: 4, marginTop: 4 }}>
                      {label}
                    </motion.p>
                  )}
                </AnimatePresence>
                {items.map(s => (
                  <div key={s.id}
                    onMouseEnter={() => setHoverId(s.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => handleSelect(s)}
                    title={s.title}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: collapsed ? "7px" : "7px 8px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 7, cursor: "pointer", marginBottom: 2,
                      background: activeSession?.id === s.id ? "rgba(124,58,237,0.2)" : hoverId === s.id ? "rgba(255,255,255,0.04)" : "transparent",
                      border: activeSession?.id === s.id ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                      transition: "all 0.15s"
                    }}>
                    <MessageSquare size={13} color={activeSession?.id === s.id ? "#a78bfa" : "#475569"} style={{ flexShrink: 0 }}/>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 12, color: activeSession?.id === s.id ? "#c7d2fe" : "#64748b",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>
                          {s.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {!collapsed && hoverId === s.id && (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={e => handleDelete(e, s.id)}
                          style={{ padding: 3, borderRadius: 4, border: "none", cursor: "pointer",
                            background: "transparent", color: "#475569", flexShrink: 0, display: "flex" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
                          <Trash2 size={11}/>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>

      <div style={{ padding: "8px", flexShrink: 0, borderTop: "1px solid rgba(80,120,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: collapsed ? "6px" : "6px 8px",
          borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#7c3aed,#2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "white"
          }}>
            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.displayName || "User"}
                </p>
                <p style={{ fontSize: 10, color: "#334155", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={logout} title="Logout"
                style={{ padding: 4, borderRadius: 6, border: "none", cursor: "pointer",
                  background: "transparent", color: "#334155", display: "flex", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                onMouseLeave={e => e.currentTarget.style.color = "#334155"}>
                <LogOut size={13}/>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
