import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function Background() {
  const stars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i, left: Math.random()*100, top: Math.random()*100,
    size: Math.random()*2.5+0.5, delay: Math.random()*6, dur: Math.random()*3+2,
  })), [])
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#080d2e 0%,#0d1545 40%,#0a1535 70%,#080d2e 100%)"}}/>
      <motion.div animate={{x:[0,60,20,-40,0],y:[0,-50,40,20,0],scale:[1,1.2,0.9,1.1,1]}}
        transition={{duration:12,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:600,height:600,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(120,60,255,0.5) 0%,transparent 65%)",
          filter:"blur(55px)",top:-150,left:-100,pointerEvents:"none"}}/>
      <motion.div animate={{x:[0,-70,-20,50,0],y:[0,40,-50,-10,0]}}
        transition={{duration:16,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:500,height:500,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(30,100,255,0.45) 0%,transparent 65%)",
          filter:"blur(55px)",bottom:-100,right:-80,pointerEvents:"none"}}/>
      <motion.div animate={{x:[0,40,-30,10,0],y:[0,30,50,-40,0]}}
        transition={{duration:10,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"absolute",width:350,height:350,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(0,180,255,0.3) 0%,transparent 65%)",
          filter:"blur(45px)",top:"40%",left:"40%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(80,120,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(80,120,255,0.05) 1px,transparent 1px)",
        backgroundSize:"60px 60px",transform:"perspective(900px) rotateX(6deg)",transformOrigin:"center bottom"}}/>
      <div style={{position:"absolute",top:0,left:"20%",width:"60%",height:"300px",
        background:"linear-gradient(180deg,rgba(80,100,255,0.15) 0%,transparent 100%)",pointerEvents:"none"}}/>
      {stars.map(s=>(
        <motion.div key={s.id}
          animate={{opacity:[0.1,0.9,0.1],scale:[0.8,1.5,0.8]}}
          transition={{duration:s.dur,delay:s.delay,repeat:Infinity,ease:"easeInOut"}}
          style={{position:"absolute",borderRadius:"50%",
            background:s.size>2?"rgba(160,200,255,0.9)":"white",
            boxShadow:s.size>2?"0 0 6px rgba(120,180,255,0.8)":"none",
            width:s.size,height:s.size,left:s.left+"%",top:s.top+"%"}}/>
      ))}
    </div>
  )
}

export default function Login() {
  const { loginWithGoogle, loginWithEmail, register, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); clearError()
    try {
      mode==='login' ? await loginWithEmail(email,password) : await register(email,password)
      navigate('/dashboard')
    } catch {} finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setLoading(true); clearError()
    try { await loginWithGoogle(); navigate('/dashboard') }
    catch {} finally { setLoading(false) }
  }

  const inputStyle = (name) => ({
    width:"100%", background:"rgba(10,20,80,0.5)",
    border: focused===name ? "1px solid rgba(120,160,255,0.7)" : "1px solid rgba(80,120,255,0.25)",
    boxShadow: focused===name ? "0 0 0 3px rgba(80,120,255,0.15), 0 0 20px rgba(80,120,255,0.2)" : "none",
    borderRadius:12, padding:"11px 14px", color:"white", fontSize:13,
    outline:"none", boxSizing:"border-box", transition:"all 0.3s", fontFamily:"inherit"
  })

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Inter,sans-serif",color:"white"}}>
      <Background/>
      <motion.div initial={{opacity:0,y:30,scale:0.95}} animate={{opacity:1,y:0,scale:1}}
        transition={{duration:0.5,ease:"easeOut"}}
        style={{position:"relative",zIndex:10,width:"100%",maxWidth:400}}>

        {/* Logo */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:32}}>
          <motion.div
            animate={{boxShadow:["0 0 20px rgba(100,80,255,0.4)","0 0 40px rgba(100,80,255,0.7)","0 0 20px rgba(100,80,255,0.4)"],y:[0,-5,0]}}
            transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
            style={{width:60,height:60,borderRadius:18,
              background:"linear-gradient(135deg,#7c3aed,#2563eb)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 8px 32px rgba(100,80,255,0.4)"}}>
            <Sparkles size={26} color="white"/>
          </motion.div>
          <div style={{textAlign:"center"}}>
            <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 4px",
              background:"linear-gradient(135deg,#c084fc,#60a5fa)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TwinMind</h1>
            <p style={{fontSize:12,color:"#475569",margin:0}}>Your AI Digital Twin</p>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(8,15,60,0.6)",backdropFilter:"blur(24px)",
          border:"1px solid rgba(80,120,255,0.2)",borderRadius:20,padding:28,
          boxShadow:"0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}>
          {/* Tabs */}
          <div style={{display:"flex",background:"rgba(10,20,80,0.5)",borderRadius:12,padding:4,marginBottom:20,border:"1px solid rgba(80,120,255,0.15)"}}>
            {['login','register'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);clearError()}} style={{
                flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",
                fontSize:12,fontWeight:500,transition:"all 0.2s",
                background:mode===m?"linear-gradient(135deg,rgba(100,80,255,0.4),rgba(30,80,200,0.4))":"transparent",
                color:mode===m?"#c4b5fd":"#475569",
                boxShadow:mode===m?"0 2px 8px rgba(80,60,200,0.3)":"none"
              }}>{m==='login'?'Sign in':'Create account'}</button>
            ))}
          </div>

          {/* Error */}
          {error&&(
            <div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.1)",
              border:"1px solid rgba(248,113,113,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:11,color:"#93c5fd",marginBottom:6,display:"block",fontWeight:500}}>Email</label>
              <input type="email" required value={email}
                onChange={e=>setEmail(e.target.value)}
                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                placeholder="you@example.com" style={inputStyle('email')}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#93c5fd",marginBottom:6,display:"block",fontWeight:500}}>Password</label>
              <div style={{position:"relative"}}>
                <input type={showPw?'text':'password'} required value={password}
                  onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setFocused('password')} onBlur={()=>setFocused('')}
                  placeholder="••••••••" style={{...inputStyle('password'),paddingRight:40}}/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{
                  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",color:"#475569"
                }}>
                  {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>

            <motion.button onClick={handleSubmit} disabled={loading}
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              style={{
                width:"100%",padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                background:"linear-gradient(135deg,#7c3aed,#2563eb)",
                color:"white",fontSize:13,fontWeight:600,
                boxShadow:"0 4px 20px rgba(100,80,255,0.4)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                opacity:loading?0.7:1,transition:"opacity 0.2s"
              }}>
              {loading&&<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>}
              {mode==='login'?'Sign in':'Create account'}
            </motion.button>
          </div>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
            <div style={{flex:1,height:1,background:"rgba(80,120,255,0.15)"}}/>
            <span style={{fontSize:11,color:"#334155"}}>or</span>
            <div style={{flex:1,height:1,background:"rgba(80,120,255,0.15)"}}/>
          </div>

          {/* Google */}
          <motion.button onClick={handleGoogle} disabled={loading}
            whileHover={{scale:1.02,background:"rgba(20,35,100,0.7)"}} whileTap={{scale:0.98}}
            style={{
              width:"100%",padding:"12px",borderRadius:12,border:"1px solid rgba(80,120,255,0.25)",
              cursor:"pointer",background:"rgba(10,20,80,0.4)",backdropFilter:"blur(10px)",
              color:"#e2e8f0",fontSize:13,fontWeight:500,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              transition:"all 0.2s",opacity:loading?0.7:1
            }}>
            <GoogleIcon/>
            Continue with Google
          </motion.button>
        </div>

        <p style={{textAlign:"center",fontSize:11,color:"#1e3a5f",marginTop:16}}>
          Protected by end-to-end encryption 🔒
        </p>
      </motion.div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
