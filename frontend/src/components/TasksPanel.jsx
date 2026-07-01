import { useEffect, useState, useCallback } from "react"
import { CheckSquare, Square, Trash2, Mic, Loader2, ListTodo } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"

const API_BASE = "http://localhost:8000/api/tasks"

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(10,20,80,0.4)", border: "1px solid rgba(100,150,255,0.15)",
        borderRadius: 10, padding: "10px 12px", marginBottom: 6
      }}>
      <button onClick={() => onToggle(task)} style={{ background: "none", border: "none", cursor: "pointer", color: task.done ? "#34d399" : "#64748b", display: "flex", flexShrink: 0 }}>
        {task.done ? <CheckSquare size={16}/> : <Square size={16}/>}
      </button>
      <span style={{
        flex: 1, fontSize: 12, color: task.done ? "#475569" : "#e2e8f0",
        textDecoration: task.done ? "line-through" : "none", lineHeight: 1.5
      }}>
        {task.text}
      </span>
      {task.source === "voice" && <Mic size={10} color="#a78bfa" style={{ flexShrink: 0 }}/>}
      <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
        onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
        <Trash2 size={13}/>
      </button>
    </motion.div>
  )
}

export default function TasksPanel({ voiceTranscript }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/?user_id=${user.uid}`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch {
      toast.error("Could not load tasks")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  useEffect(() => {
    if (!voiceTranscript || !user?.uid) return
    extractTasks(voiceTranscript)
  }, [voiceTranscript])

  const extractTasks = async (transcript) => {
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE}/from-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uid, transcript })
      })
      const data = await res.json()
      if (data.tasks?.length) {
        setTasks(prev => [...data.tasks, ...prev])
        toast.success(`${data.tasks.length} task${data.tasks.length > 1 ? "s" : ""} added! ✅`)
      }
    } catch {
      toast.error("Could not extract tasks")
    } finally {
      setProcessing(false)
    }
  }

  const toggleTask = async (task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    try {
      await fetch(`${API_BASE}/${task.id}?user_id=${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done })
      })
    } catch {
      toast.error("Could not update task")
    }
  }

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await fetch(`${API_BASE}/${taskId}?user_id=${user.uid}`, { method: "DELETE" })
    } catch {
      toast.error("Could not delete task")
    }
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ListTodo size={16} color="#818cf8"/>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc" }}>Tasks</span>
        {pending.length > 0 && (
          <span style={{ fontSize: 10, background: "rgba(124,58,237,0.2)", color: "#a78bfa", borderRadius: 20, padding: "2px 8px" }}>
            {pending.length} pending
          </span>
        )}
      </div>

      {processing && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", marginBottom: 12, fontSize: 11, color: "#a78bfa" }}>
          <Loader2 size={13} className="animate-spin"/> Extracting tasks from voice note...
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 12 }}>
          <Loader2 size={16} className="animate-spin" style={{ margin: "0 auto 8px" }}/>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 12px", color: "#475569" }}>
          <Mic size={24} style={{ margin: "0 auto 10px", opacity: 0.4 }}/>
          <p style={{ fontSize: 12, margin: 0 }}>No tasks yet</p>
          <p style={{ fontSize: 11, margin: "4px 0 0", color: "#334155" }}>Use the mic to speak a voice note —<br/>I'll turn it into tasks automatically</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <AnimatePresence>
                {pending.map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask}/>)}
              </AnimatePresence>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p style={{ fontSize: 10, color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Completed</p>
              <AnimatePresence>
                {done.map(task => <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask}/>)}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}
