import { useState } from "react"
import { Sparkles, X, Loader2, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"

const BASE = "http://localhost:8000/api/chat"

export default function DailyDigest() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [digest, setDigest] = useState("")
  const [error, setError] = useState(false)

  const fetchDigest = async () => {
    if (!user?.uid) return
    setOpen(true)
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`${BASE}/digest?user_id=${user.uid}`)
      const data = await res.json()
      setDigest(data.digest || "No digest available")
    } catch (e) {
      setError(true)
      setDigest("Failed to load digest. Try again.")
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={fetchDigest} title="Daily Digest" style={{
        padding:"6px 10px", borderRadius:8, border:"1px solid rgba(120,100,255,0.3)",
        cursor:"pointer", background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.15))",
        color:"#c4b5fd", fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:5,
        transition:"all 0.2s"
      }}
      onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.3))"}}
      onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,rgba(124,58,237,0.15),rgba(37,99,235,0.15))"}}>
        <Sun size={13}/> Digest
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setOpen(false)}
              style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",zIndex:200}}/>

            <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}}
              transition={{type:"spring",stiffness:300,damping:25}}
              style={{
                position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
                zIndex:201,width:"90%",maxWidth:480,maxHeight:"80vh",overflowY:"auto",
                background:"rgba(10,15,60,0.85)",backdropFilter:"blur(30px)",
                border:"1px solid rgba(100,150,255,0.25)",borderRadius:20,padding:28,
                boxShadow:"0 30px 80px rgba(0,0,0,0.5)"
              }}>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <motion.div
                    animate={{rotate:[0,15,-15,0]}}
                    transition={{duration:2,repeat:Infinity,repeatDelay:1}}
                    style={{width:36,height:36,borderRadius:12,
                      background:"linear-gradient(135deg,#facc15,#fb923c)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      boxShadow:"0 4px 16px rgba(250,200,20,0.4)"}}>
                    <Sun size={18} color="white"/>
                  </motion.div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700,margin:0,
                      background:"linear-gradient(135deg,#facc15,#fb923c)",
                      WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                      Daily Digest
                    </h3>
                    <p style={{fontSize:11,color:"#64748b",margin:0}}>
                      {new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}
                    </p>
                  </div>
                </div>
                <button onClick={()=>setOpen(false)} style={{
                  background:"rgba(255,255,255,0.05)",border:"none",borderRadius:8,
                  width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",color:"#94a3b8"
                }}>
                  <X size={15}/>
                </button>
              </div>

              {loading ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"40px 0"}}>
                  <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                    style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(250,200,20,0.15)",borderTop:"3px solid #facc15"}}/>
                  <p style={{fontSize:12,color:"#94a3b8"}}>Gathering your day...</p>
                </div>
              ) : (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}}
                  style={{
                    fontSize:13,lineHeight:1.8,color:"#e2e8f0",whiteSpace:"pre-line",
                    background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,150,255,0.1)",
                    borderRadius:14,padding:18
                  }}>
                  {digest}
                </motion.div>
              )}

              <button onClick={fetchDigest} disabled={loading} style={{
                marginTop:16,width:"100%",padding:"10px",borderRadius:10,border:"none",cursor:"pointer",
                background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"white",fontSize:12,fontWeight:500,
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                boxShadow:"0 4px 15px rgba(100,80,255,0.3)",opacity:loading?0.6:1
              }}>
                {loading?<Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>:<Sparkles size={13}/>}
                Refresh Digest
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
