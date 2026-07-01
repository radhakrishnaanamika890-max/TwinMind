import { useState, useCallback, useRef } from "react"
import { getChatHistory, createSession, listSessions, deleteSession, sendMessage } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import toast from "react-hot-toast"

export function useChat() {
  const { user } = useAuth()
  const userId = user?.uid || user?.email || "guest"

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const fetchSessions = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await listSessions(userId)
      setSessions(data.sessions || [])
    } catch {
      toast.error("Failed to load sessions")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const startSession = useCallback(async (title = "New chat") => {
    try {
      const session = await createSession(title, userId)
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setMessages([])
      return session
    } catch {
      toast.error("Could not create session")
    }
  }, [userId])

  const switchSession = useCallback(async (session) => {
    setActiveSession(session)
    setIsLoading(true)
    try {
      const history = await getChatHistory(session.id)
      setMessages(history.messages || [])
    } catch {
      toast.error("Could not load history")
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const removeSession = useCallback(async (sessionId) => {
    try {
      await deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        setMessages([])
      }
    } catch {
      toast.error("Could not delete session")
    }
  }, [activeSession])

  const send = useCallback(async (content, files = []) => {
    if (!content.trim() || isSending) return

    let session = activeSession
    if (!session) {
      session = await startSession(content.slice(0, 30))
      if (!session) return
    }

    const userMsgId = `tmp-${Date.now()}`

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: userMsgId, role: "user", content,
      created_at: new Date().toISOString(), files
    }])

    setIsSending(true)

    try {
      const response = await sendMessage(session.id, content, files, userId)

      const asstMsg = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: response.reply,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, asstMsg])

      // Update session id if it was newly created on backend
      if (response.session_id && response.session_id !== session.id) {
        setActiveSession(prev => ({ ...prev, id: response.session_id }))
      }

      fetchSessions()
    } catch (err) {
      toast.error(err.message || "Message failed")
      setMessages(prev => prev.filter(m => m.id !== userMsgId))
    } finally {
      setIsSending(false)
    }
  }, [activeSession, isSending, userId, startSession, fetchSessions])

  const cancelStream = useCallback(() => {
    setIsSending(false)
  }, [])

  return {
    sessions, activeSession, messages, isLoading, isSending,
    fetchSessions, startSession, switchSession, removeSession,
    send, cancelStream
  }
}