import { motion } from 'framer-motion'

function Shimmer({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width, height, borderRadius: radius,
        background: "linear-gradient(90deg, rgba(80,120,255,0.1), rgba(120,160,255,0.2), rgba(80,120,255,0.1))",
        border: "1px solid rgba(80,120,255,0.1)",
        ...style
      }}
    />
  )
}

export function ChatSkeleton() {
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: "flex", gap: 12, flexDirection: i % 2 === 0 ? "row-reverse" : "row" }}>
          <Shimmer width={28} height={28} radius="50%" style={{ flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "60%" }}>
            <Shimmer width={i % 2 === 0 ? 180 : 220} height={14} />
            <Shimmer width={i % 2 === 0 ? 120 : 160} height={14} />
            {i === 2 && <Shimmer width={100} height={14} />}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <Shimmer width={12} height={12} radius="50%" style={{ flexShrink: 0 }} />
          <Shimmer width={`${60 + i * 15}%`} height={11} />
        </div>
      ))}
    </div>
  )
}

export function MemorySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 4 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          background: "rgba(10,20,80,0.3)", border: "1px solid rgba(80,120,255,0.1)",
          borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8
        }}>
          <Shimmer width="90%" height={13} />
          <Shimmer width="70%" height={13} />
          <Shimmer width={60} height={10} radius={20} />
        </div>
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(8,13,46,0.85)", backdropFilter: "blur(10px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid rgba(80,120,255,0.1)",
          borderTop: "3px solid #818cf8",
        }}
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ fontSize: 13, color: "#818cf8", margin: 0 }}
      >
        Loading TwinMind...
      </motion.p>
    </div>
  )
}

export default Shimmer
