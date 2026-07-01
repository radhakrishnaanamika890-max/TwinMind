import { useState, useCallback, useEffect } from "react"
import { getMemories, deleteMemory, searchMemory } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import { Search, Trash2, Loader2, Brain, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

const TYPES = [
  { id: null, label: "All" },
  { id: "preference", label: "Preferences" },
  { id: "fact", label: "Facts" },
  { id: "task", label: "Tasks" },
  { id: "conversation", label: "Conversations" },
]

export default function MemoryViewer() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [activeType, setActiveType] = useState(null)

  const fetchMemories = useCallback(async (type = null) => {
    setIsLoading(true)
    setActiveType(type)
    try {
      const data = await getMemories(user?.uid || "guest", type)
      setMemories(data.memories || [])
    } catch {
      // silently fail - memory is optional
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const search = useCallback(async (q) => {
    setIsLoading(true)
    try {
      const data = await searchMemory(user?.uid || "guest", q)
      setMemories(data.memories || [])
    } catch {
      toast.error("Search failed")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const remove = useCallback(async (id) => {
    try {
      await deleteMemory(id, user?.uid || "guest")
      setMemories((prev) => prev.filter((m) => m.id !== id))
      toast.success("Memory removed")
    } catch {
      toast.error("Could not remove memory")
    }
  }, [user])

  useEffect(() => {
    fetchMemories(null)
  }, [fetchMemories])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setActiveType(null)
      search(query.trim())
    } else {
      fetchMemories(null)
    }
  }

  const handleTabClick = (type) => {
    setQuery("")
    fetchMemories(type)
  }

  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column", padding:16}}>

      {/* Header */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <Brain size={16} color="#a78bfa" />
          <span style={{fontSize:13, fontWeight:600, color:"white"}}>Memory</span>
        </div>
        <button onClick={() => fetchMemories(activeType)} style={{
          background:"transparent", border:"none", cursor:"pointer", color:"#64748b",
          display:"flex", alignItems:"center"
        }}>
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} style={{display:"flex", gap:6, marginBottom:12}}>
        <div style={{
          flex:1, display:"flex", alignItems:"center", gap:8,
          background:"rgba(10,20,80,0.4)", border:"1px solid rgba(100,150,255,0.25)",
          borderRadius:10, padding:"8px 12px"
        }}>
          <Search size={13} color="#64748b" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
            style={{
              flex:1, background:"transparent", border:"none", outline:"none",
              color:"white", fontSize:12
            }}
          />
        </div>
        <button type="submit" style={{
          padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer",
          background:"linear-gradient(135deg,#7c3aed,#2563eb)",
          color:"white", fontSize:12, fontWeight:500
        }}>
          Go
        </button>
      </form>

      {/* Filter Tabs */}
      <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap"}}>
        {TYPES.map(t => (
          <button key={t.label} onClick={() => handleTabClick(t.id)} style={{
            padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
            fontSize:11, fontWeight:500, transition:"all 0.2s",
            background: activeType === t.id && !query ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
            color: activeType === t.id && !query ? "#c4b5fd" : "#64748b",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1, overflowY:"auto"}}>
        {isLoading ? (
          <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:40, color:"#64748b"}}>
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <div style={{textAlign:"center", padding:40, color:"#64748b"}}>
            <Brain size={28} style={{opacity:0.3, marginBottom:8}} />
            <p style={{fontSize:12, margin:0}}>No memories yet</p>
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <AnimatePresence>
              {memories.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{opacity:0, y:6}}
                  animate={{opacity:1, y:0}}
                  exit={{opacity:0, x:20}}
                  style={{
                    background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(100,150,255,0.12)",
                    borderRadius:10, padding:"10px 12px",
                    display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8
                  }}
                >
                  <div style={{flex:1, minWidth:0}}>
                    {m.type && (
                      <span style={{
                        fontSize:9, fontWeight:600, color:"#93c5fd",
                        background:"rgba(100,150,255,0.12)", padding:"2px 6px",
                        borderRadius:6, marginBottom:6, display:"inline-block",
                        textTransform:"uppercase"
                      }}>{m.type}</span>
                    )}
                    <p style={{fontSize:12, color:"#e2e8f0", margin:"4px 0 0", lineHeight:1.5, wordBreak:"break-word"}}>
                      {m.text || m.content || m.memory || ""}
                    </p>
                  </div>
                  <button onClick={() => remove(m.id)} style={{
                    background:"transparent", border:"none", cursor:"pointer",
                    color:"#64748b", flexShrink:0, padding:4
                  }}>
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
