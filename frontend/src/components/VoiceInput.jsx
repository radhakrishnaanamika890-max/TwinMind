import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition

export default function VoiceInput({ onTranscript, disabled = false, lang = 'en-US' }) {
  const [state, setState] = useState('idle')
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)

  const isSupported = !!SpeechRecognition

  useEffect(() => {
    if (!isSupported) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interimText += t
      }
      if (finalText) onTranscript(finalText)
      setInterim(interimText)
    }

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') toast.error(`Voice error: ${e.error}`)
      setState('idle')
      setInterim('')
    }

    recognition.onend = () => {
      setState('idle')
      setInterim('')
    }

    recognitionRef.current = recognition
    return () => recognition.abort()
  }, [isSupported, lang, onTranscript])

  const toggle = () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser')
      return
    }
    if (state === 'idle') {
      recognitionRef.current.start()
      setState('listening')
      toast.success('Listening...', { duration: 1500 })
    } else {
      recognitionRef.current.stop()
      setState('processing')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Mic button */}
      <button
        onClick={toggle}
        disabled={disabled || !isSupported}
        aria-label={state === 'listening' ? 'Stop recording' : 'Start voice input'}
        className={clsx(
          'relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none',
          state === 'listening'
            ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30'
            : 'bg-[#1a1a2e] hover:bg-[#2a2a3e] text-slate-400 hover:text-violet-400 border border-[#2a2a3e]',
          (disabled || !isSupported) && 'opacity-40 cursor-not-allowed'
        )}
      >
        {/* Pulse rings while listening */}
        <AnimatePresence>
          {state === 'listening' && (
            <>
              {[1, 2].map((ring) => (
                <motion.span
                  key={ring}
                  className="absolute inset-0 rounded-full border border-red-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1 + ring * 0.35, opacity: 0 }}
                  transition={{ duration: 1.2, delay: ring * 0.3, repeat: Infinity }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {state === 'processing' ? (
          <Loader2 size={15} className="animate-spin" />
        ) : state === 'listening' ? (
          <MicOff size={15} />
        ) : (
          <Mic size={15} />
        )}
      </button>

      {/* Interim transcript bubble */}
      <AnimatePresence>
        {interim && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-xs text-center text-xs text-slate-300 italic px-4 py-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl shadow-xl z-50"
          >
            🎤 {interim}
          </motion.p>
        )}
      </AnimatePresence>

      {!isSupported && (
        <p className="text-xs text-slate-600">Voice not supported</p>
      )}
    </div>
  )
}