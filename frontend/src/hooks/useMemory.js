import { useState, useCallback } from 'react'
import { getMemories, deleteMemory, searchMemory } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export function useMemory() {
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState(null) // null = "All"

  const fetchMemories = useCallback(async (type = null) => {
    setIsLoading(true)
    setQuery('') // clear any active search when going back to the list view
    setActiveType(type)
    try {
      const data = await getMemories(user?.uid || 'guest', type)
      setMemories(data.memories || [])
    } catch (err) {
      // silently fail — memory is optional
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const search = useCallback(async (q) => {
    setQuery(q)
    setActiveType(null) // search overrides type filter
    setIsLoading(true)
    try {
      const data = await searchMemory(user?.uid || 'guest', q)
      setMemories(data.memories || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const remove = useCallback(async (id) => {
    try {
      await deleteMemory(id, user?.uid || 'guest')
      setMemories((prev) => prev.filter((m) => m.id !== id))
      toast.success('Memory removed')
    } catch {
      toast.error('Could not remove memory')
    }
  }, [user])

  return {
    memories,
    isLoading,
    query,
    activeType,
    fetchMemories,
    search,
    remove,
  }
}