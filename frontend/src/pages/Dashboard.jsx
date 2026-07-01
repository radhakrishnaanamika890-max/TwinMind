import { useState, useMemo } from "react"
import { Routes, Route } from "react-router-dom"
import { PanelRightOpen, PanelRightClose } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Sidebar from "@/components/Sidebar"
import { useTheme } from "@/hooks/useTheme"
import ChatWindow from "@/components/ChatWindow"
import MemoryViewer from "@/components/MemoryViewer"
import MCPPanel from "@/components/MCPPanel"
import StatsBar from "@/components/StatsBar"
import NotificationManager from "@/components/NotificationManager"
import Settings from "./Settings"
import { useChat } from "@/hooks/ChatContext"
import VoiceInput from "@/components/VoiceInput"
import DailyDigest from "@/components/DailyDigest"
import TasksPanel from "@/components/TasksPanel"
import SearchPanel from "@/components/SearchPanel"

function Background() {
  const { mode } = useTheme()
  const stars = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    id: i, left: Math.random()*100, top: Math.random()*100,
    size: Math.random()*3+0.5, delay: Math.random()*6, dur: Math.random()*3+2,
  })), [])
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background: mode === "light" ? "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 40%,#dbeafe 70%,#eef2ff 100%)" : "linear-gradient(135deg,#080d2e 0%,#0d1545 40%,#0a1535 70%,#080d2e 100%)"}}/>
      <motion.div animate={{x:[0,60,20,-40,0],y:[0,-50,40,20,0],scale:[1,1.2,0.9,1.1,1]}}
        transition={{duration:12,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:700,height:700,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(120,60,255,0.5) 0%,transparent 65%)",
          filter:"blur(55px)",top:-200,left:-150,pointerEvents:"none"}}/>
      <motion.div animate={{x:[0,-70,-20,50,0],y:[0,40,-50,-10,0],scale:[1,1.1,0.95,1.15,1]}}
        transition={{duration:16,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:600,height:600,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(30,100,255,0.45) 0%,transparent 65%)",
          filter:"blur(55px)",bottom:-150,right:-100,pointerEvents:"none"}}/>
      <motion.div animate={{x:[0,40,-30,10,0],y:[0,30,50,-40,0],scale:[1,0.85,1.15,0.95,1]}}
        transition={{duration:10,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:400,height:400,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(0,180,255,0.3) 0%,transparent 65%)",
          filter:"blur(45px)",top:"30%",left:"35%",pointerEvents:"none"}}/>
      <motion.div animate={{x:[0,-30,40,-10,0],y:[0,-20,30,50,0],scale:[1,1.1,0.9,1.05,1]}}
        transition={{duration:14,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(200,60,255,0.2) 0%,transparent 65%)",
          filter:"blur(40px)",top:"5%",right:"10%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(80,120,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(80,120,255,0.06) 1px,transparent 1px)",
        backgroundSize:"60px 60px",transform:"perspective(900px) rotateX(6deg)",transformOrigin:"center bottom"}}/>
      <div style={{position:"absolute",top:0,left:"15%",width:"70%",height:"350px",
        background:"linear-gradient(180deg,rgba(80,100,255,0.15) 0%,transparent 100%)",pointerEvents:"none"}}/>
      {stars.map(s=>(
        <motion.div key={s.id}
          animate={{opacity:[0.15,1,0.15],scale:[0.8,1.5,0.8]}}
          transition={{duration:s.dur,delay:s.delay,repeat:Infinity,ease:"easeInOut"}}
          style={{position:"absolute",borderRadius:"50%",
            background:s.size>2?"rgba(160,200,255,0.9)":"white",
            boxShadow:s.size>2?"0 0 6px rgba(120,180,255,0.8)":"none",
            width:s.size,height:s.size,left:s.left+"%",top:s.top+"%"}}/>
      ))}
    </div>
  )
}

function PageWrapper({ children, title }) {
  const { mode } = useTheme()
  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column"}}>
      <header style={{
        height:48, display:"flex", alignItems:"center", padding:"0 20px", flexShrink:0,
        background: mode === "light" ? "rgba(255,255,255,0.6)" : "rgba(8,13,46,0.6)", backdropFilter:"blur(20px)",
        borderBottom: mode === "light" ? "1px solid rgba(100,100,255,0.15)" : "1px solid rgba(80,120,255,0.2)",
      }}>
        <span style={{
          fontSize:13, fontWeight:600,
          background:"linear-gradient(135deg,#c084fc,#60a5fa)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
        }}>{title}</span>
      </header>
      <div style={{flex:1, overflowY:"auto"}}>{children}</div>
    </div>
  )
}

function ChatLayout() {
  const { mode } = useTheme()
  const { activeSession, messages, isSending, send } = useChat()
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [mcpOpen, setMcpOpen] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const handleVoiceTranscript = (text) => setVoiceText(prev => prev + " " + text)

  return (
    <div style={{display:"flex",height:"100%"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        <header style={{
          height:48,display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 20px",flexShrink:0,
          background:mode==="light"?"rgba(255,255,255,0.6)":"rgba(8,13,46,0.6)",backdropFilter:"blur(20px)",
          borderBottom:mode==="light"?"1px solid rgba(100,100,255,0.15)":"1px solid rgba(80,120,255,0.2)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <motion.div animate={{boxShadow:["0 0 4px rgba(124,58,237,0.6)","0 0 16px rgba(124,58,237,1)","0 0 4px rgba(124,58,237,0.6)"]}}
              transition={{duration:2,repeat:Infinity}}
              style={{width:8,height:8,borderRadius:"50%",background:"#818cf8"}}/>
            <span style={{fontSize:13,fontWeight:500,
              background:"linear-gradient(135deg,#c084fc,#60a5fa,#34d399)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              {activeSession ? activeSession.title : "Select a chat"}
            </span>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>setMcpOpen(v=>!v)} style={{
              padding:"6px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,
              background:mcpOpen?"rgba(124,58,237,0.2)":"transparent",
              color:mcpOpen?"#a78bfa":"#64748b"}}>🔗</button>
            <button onClick={()=>setTasksOpen(v=>!v)} style={{
              padding:"6px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,
              background:tasksOpen?"rgba(124,58,237,0.2)":"transparent",
              color:tasksOpen?"#a78bfa":"#64748b"}}>✅</button>
            <button onClick={()=>setSearchOpen(true)} style={{
              padding:"6px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,
              background:"transparent",color:"#64748b"}}>🔍</button>
            <DailyDigest/>
            <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSending}/>
            <button onClick={()=>setMemoryOpen(v=>!v)} style={{
              padding:"6px",borderRadius:8,border:"none",cursor:"pointer",
              background:"transparent",color:"#64748b"}}>
              {memoryOpen?<PanelRightClose size={15}/>:<PanelRightOpen size={15}/>}
            </button>
          </div>
        </header>
        <StatsBar/>
        <ChatWindow messages={messages} isSending={isSending} onSend={send}
          sessionId={activeSession?.id??null} voiceText={voiceText}/>
      </div>
      <AnimatePresence>
        {searchOpen && <SearchPanel onClose={()=>setSearchOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {tasksOpen&&(
          <motion.div initial={{width:0,opacity:0}} animate={{width:300,opacity:1}}
            exit={{width:0,opacity:0}} transition={{type:"spring",stiffness:300,damping:30}}
            style={{borderLeft:"1px solid rgba(80,120,255,0.15)",overflow:"hidden",flexShrink:0,
              background:"rgba(8,13,46,0.7)",backdropFilter:"blur(20px)"}}>
            <TasksPanel voiceTranscript={voiceText}/>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mcpOpen&&(
          <motion.div initial={{width:0,opacity:0}} animate={{width:288,opacity:1}}
            exit={{width:0,opacity:0}} transition={{type:"spring",stiffness:300,damping:30}}
            style={{borderLeft:"1px solid rgba(80,120,255,0.15)",overflow:"hidden",flexShrink:0}}>
            <MCPPanel/>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {memoryOpen&&(
          <motion.div initial={{width:0,opacity:0}} animate={{width:300,opacity:1}}
            exit={{width:0,opacity:0}} transition={{type:"spring",stiffness:300,damping:30}}
            style={{borderLeft:"1px solid rgba(80,120,255,0.15)",overflow:"hidden",flexShrink:0,
              background:"rgba(8,13,46,0.7)",backdropFilter:"blur(20px)"}}>
            <MemoryViewer/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div style={{display:"flex",height:"100vh",color:"white",overflow:"hidden",fontFamily:"Inter,sans-serif"}}>
      <Background/>
      <NotificationManager/>
      <div style={{position:"relative",zIndex:10,display:"flex",width:"100%",height:"100%"}}>
        <Sidebar/>
        <main style={{flex:1,minWidth:0,overflow:"hidden"}}>
          <Routes>
            <Route index element={<ChatLayout/>}/>
            <Route path="memory" element={<PageWrapper title="🧠 Memory"><MemoryViewer/></PageWrapper>}/>
            <Route path="settings" element={<PageWrapper title="⚙️ Settings"><Settings/></PageWrapper>}/>
          </Routes>
        </main>
      </div>
    </div>
  )
}





