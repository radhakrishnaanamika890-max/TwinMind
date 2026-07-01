import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, FileCode, File } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadFile } from '@/services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const MAX_SIZE_MB = 20
const ACCEPTED = [
  'image/*',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  '.py', '.js', '.ts', '.jsx', '.tsx', '.md',
]

function fileIcon(type = '') {
  if (type.startsWith('image/')) return <Image size={14} />
  if (type === 'application/pdf') return <FileText size={14} />
  if (type.startsWith('text/') || type.includes('script')) return <FileCode size={14} />
  return <File size={14} />
}

function FileRow({ file, status, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-center gap-2 text-xs bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 py-2"
    >
      <span className="text-slate-500 flex-shrink-0">{fileIcon(file.type)}</span>
      <span className="flex-1 min-w-0 truncate text-slate-300">{file.name}</span>
      <span className="text-slate-600 flex-shrink-0">
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </span>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        status === 'done' && 'bg-green-400',
        status === 'uploading' && 'bg-yellow-400 animate-pulse',
        status === 'error' && 'bg-red-400',
        status === 'pending' && 'bg-slate-600',
      )} />
      <button onClick={() => onRemove(file.name)} className="text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors">
        <X size={12} />
      </button>
    </motion.div>
  )
}

export default function FileUpload({ sessionId, onFilesReady, autoUpload = false, userId = 'guest' }) {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const addFiles = useCallback(
    async (incoming) => {
      const valid = [...incoming].filter((f) => {
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${f.name} exceeds ${MAX_SIZE_MB} MB`)
          return false
        }
        return true
      })
      if (!valid.length) return

      const entries = valid.map((f) => ({ file: f, status: 'pending' }))
      setFiles((prev) => [...prev, ...entries])
      onFilesReady?.(valid)

      if (autoUpload) {
        for (const entry of entries) {
          setFiles((prev) =>
            prev.map((e) => e.file.name === entry.file.name ? { ...e, status: 'uploading' } : e)
          )
          try {
            await uploadFile(entry.file, sessionId, userId)
            setFiles((prev) =>
              prev.map((e) => e.file.name === entry.file.name ? { ...e, status: 'done' } : e)
            )
            toast.success(`${entry.file.name} uploaded successfully!`)
          } catch (err) {
            setFiles((prev) =>
              prev.map((e) => e.file.name === entry.file.name ? { ...e, status: 'error' } : e)
            )
            toast.error(`Failed to upload ${entry.file.name}`)
          }
        }
      }
    },
    [autoUpload, onFilesReady, sessionId, userId]
  )

  const remove = (name) => setFiles((prev) => prev.filter((e) => e.file.name !== name))

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="p-3 space-y-2 bg-[#0d0d1a]">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all',
          isDragging
            ? 'border-violet-500 bg-violet-500/5'
            : 'border-[#2a2a3e] hover:border-violet-700/50 hover:bg-violet-500/5'
        )}
      >
        <Upload size={18} className={clsx('transition-colors', isDragging ? 'text-violet-400' : 'text-slate-600')} />
        <p className="text-xs text-slate-500 text-center">
          Drop files here or <span className="text-violet-400">click to browse</span>
        </p>
        <p className="text-[10px] text-slate-600">
          PDF, images, code, text · max {MAX_SIZE_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <AnimatePresence>
        {files.map(({ file, status }) => (
          <FileRow key={file.name} file={file} status={status} onRemove={remove} />
        ))}
      </AnimatePresence>
    </div>
  )
}