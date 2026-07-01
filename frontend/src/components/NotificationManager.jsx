import { useEffect, useRef } from 'react'

const USER_ID = 'test123'
const BASE = 'https://twinmind-production-5a79.up.railway.app/api/mcp'
const CHECK_INTERVAL = 60000 // 1 minute

export default function NotificationManager() {
  const lastEmailId = useRef(null)
  const notifiedEvents = useRef(new Set())

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(checkAll, CHECK_INTERVAL)
    checkAll()
    return () => clearInterval(interval)
  }, [])

  async function checkAll() {
    if (Notification.permission !== 'granted') return
    await checkEmails()
    await checkCalendar()
  }

  async function checkEmails() {
    try {
      const res = await fetch(BASE + '/gmail/messages?user_id=' + USER_ID + '&max_results=1')
      const data = await res.json()
      const latest = data.messages?.[0]
      if (!latest) return
      if (lastEmailId.current && lastEmailId.current !== latest.id) {
        new Notification('📧 New Email', {
          body: latest.subject + '\nFrom: ' + latest.from,
          icon: '/vite.svg',
        })
      }
      lastEmailId.current = latest.id
    } catch (e) {}
  }

  async function checkCalendar() {
    try {
      const res = await fetch(BASE + '/calendar/events?user_id=' + USER_ID + '&max_results=5')
      const data = await res.json()
      const events = data.events || []
      const now = Date.now()
      for (const event of events) {
        const start = new Date(event.start).getTime()
        const diff = start - now
        const key = event.id + '-15min'
        if (diff > 0 && diff <= 15 * 60 * 1000 && !notifiedEvents.current.has(key)) {
          notifiedEvents.current.add(key)
          new Notification('📅 Meeting in 15 minutes', {
            body: event.summary,
            icon: '/vite.svg',
          })
        }
        const key30 = event.id + '-30min'
        if (diff > 0 && diff <= 30 * 60 * 1000 && !notifiedEvents.current.has(key30)) {
          notifiedEvents.current.add(key30)
          new Notification('📅 Meeting in 30 minutes', {
            body: event.summary,
            icon: '/vite.svg',
          })
        }
      }
    } catch (e) {}
  }

  return null
}

