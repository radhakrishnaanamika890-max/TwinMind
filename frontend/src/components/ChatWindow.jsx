import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Square, User, Paperclip, Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import FileUpload from './FileUpload'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

const REACTIONS = ['👍','❤️','😂','🔥','👏']

function MessageBubble({ message, onReact }) {
  const { mode } = useTheme()
  const isUser = message.role === 'user'
  const isStreaming = message.streaming === true
  const [copied, setCopied] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [reaction, setReaction] = useState(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReact = (emoji) => {
    setReaction(emoji)
    setShowReactions(false)
    onReact?.(message.id, emoji)
  }

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.25}}
      onMouseEnter={()=>setShowActions(true)}
      onMouseLeave={()=>{setShowActions(false);setShowReactions(false)}}
      style={{display:"flex",gap:12,padding:"10px 20px",flexDirection:isUser?"row-reverse":"row",position:"relative"}}>

      <div style={{
        flexShrink:0,width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
        background:isUser?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(80,100,255,0.15)",
        border:isUser?"none":"1px solid rgba(100,150,255,0.3)",
        boxShadow:isUser?"0 4px 12px rgba(100,80,255,0.4)":"none"
      }}>
        {isUser?<User size={13} color="white"/>:<Sparkles size={13} color="#818cf8"/>}
      </div>

      <div style={{maxWidth:"75%",display:"flex",flexDirection:"column",gap:4,alignItems:isUser?"flex-end":"flex-start"}}>
        <div style={{
          borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
          padding:"10px 14px",fontSize:13,lineHeight:1.6,
          background:isUser?"linear-gradient(135deg,#7c3aed,#2563eb)":(mode==="light"?"rgba(255,255,255,0.85)":"rgba(10,20,80,0.55)"),
          border:isUser?"none":(mode==="light"?"1px solid rgba(100,100,255,0.2)":"1px solid rgba(100,150,255,0.2)"),
          color:isUser?"white":(mode==="light"?"#1e1b4b":"#e2e8f0"),backdropFilter:"blur(10px)",
          boxShadow:isUser?"0 4px 20px rgba(100,80,255,0.35)":"0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {message.files?.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {message.files.map((f,i)=>(
                <span key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,background:"rgba(255,255,255,0.1)",borderRadius:6,padding:"2px 8px"}}>
                  <Paperclip size={8}/>{f.name}
                </span>
              ))}
            </div>
          )}

          {/* Markdown content — cursor is OUTSIDE ReactMarkdown */}
          <div style={{display:"inline"}}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}
              components={{
                code({inline,children,...props}){
                  return inline
                    ?<code style={{background:"rgba(255,255,255,0.1)",borderRadius:4,padding:"0 4px",fontFamily:"monospace",fontSize:11}}>{children}</code>
                    :<pre style={{background:"rgba(0,0,0,0.4)",borderRadius:8,padding:12,overflowX:"auto",marginTop:8}}><code style={{fontFamily:"monospace",fontSize:11}}>{children}</code></pre>
                },
                a:({href,children})=>(
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{color:"#818cf8",textDecoration:"underline"}}>{children}</a>
                )
              }}>
              {message.content || " "}
            </ReactMarkdown>
            {/* Streaming cursor — outside ReactMarkdown */}
            {isStreaming && (
              <motion.span
                animate={{opacity:[1,0,1]}}
                transition={{duration:0.7,repeat:Infinity}}
                style={{display:"inline-block",width:2,height:"0.9em",background:"#818cf8",marginLeft:2,verticalAlign:"text-bottom",borderRadius:1}}
              />
            )}
          </div>

          <p style={{fontSize:10,opacity:0.35,marginTop:4,textAlign:"right",marginBottom:0}}>
            {new Date(message.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
          </p>
        </div>

        {reaction&&(
          <motion.span initial={{scale:0}} animate={{scale:1}}
            style={{fontSize:16,cursor:"pointer"}} onClick={()=>setReaction(null)}>
            {reaction}
          </motion.span>
        )}

        <AnimatePresence>
          {showActions&&!isStreaming&&(
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
              style={{display:"flex",gap:4,alignItems:"center",flexDirection:isUser?"row-reverse":"row"}}>

              <button onClick={handleCopy} style={{
                display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:8,border:"1px solid rgba(80,120,255,0.2)",cursor:"pointer",
                background:"rgba(10,20,80,0.6)",backdropFilter:"blur(10px)",
                color:copied?"#34d399":"#94a3b8",fontSize:11,transition:"all 0.2s",fontFamily:"inherit"
              }}>
                {copied?<><Check size={11}/>Copied!</>:<><Copy size={11}/>Copy</>}
              </button>

              <div style={{position:"relative"}}>
                <button onClick={()=>setShowReactions(v=>!v)} style={{
                  padding:"4px 8px",borderRadius:8,border:"1px solid rgba(80,120,255,0.2)",cursor:"pointer",
                  background:"rgba(10,20,80,0.6)",backdropFilter:"blur(10px)",color:"#94a3b8",fontSize:12
                }}>😊</button>
                <AnimatePresence>
                  {showReactions&&(
                    <motion.div initial={{opacity:0,scale:0.8,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8}}
                      style={{
                        position:"absolute",bottom:"calc(100% + 8px)",
                        left:isUser?"auto":"0",right:isUser?"0":"auto",
                        display:"flex",gap:4,padding:"8px 10px",
                        background:"rgba(8,15,60,0.95)",backdropFilter:"blur(20px)",
                        border:"1px solid rgba(80,120,255,0.3)",borderRadius:14,
                        boxShadow:"0 8px 32px rgba(0,0,0,0.4)",zIndex:50,whiteSpace:"nowrap"
                      }}>
                      {REACTIONS.map(e=>(
                        <button key={e} onClick={()=>handleReact(e)} style={{
                          fontSize:18,background:"none",border:"none",cursor:"pointer",padding:"2px 4px",borderRadius:6
                        }}>{e}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isUser&&(
                <>
                  <button style={{padding:"4px 6px",borderRadius:8,border:"1px solid rgba(80,120,255,0.2)",cursor:"pointer",background:"rgba(10,20,80,0.6)",color:"#94a3b8",fontSize:11}} title="Good response"><ThumbsUp size={11}/></button>
                  <button style={{padding:"4px 6px",borderRadius:8,border:"1px solid rgba(80,120,255,0.2)",cursor:"pointer",background:"rgba(10,20,80,0.6)",color:"#94a3b8",fontSize:11}} title="Bad response"><ThumbsDown size={11}/></button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div style={{display:"flex",gap:12,padding:"10px 20px"}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(80,100,255,0.15)",border:"1px solid rgba(100,150,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Sparkles size={13} color="#818cf8"/>
      </div>
      <div style={{background:"rgba(10,20,80,0.55)",border:"1px solid rgba(100,150,255,0.2)",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:6,alignItems:"center",backdropFilter:"blur(10px)"}}>
        {[0,1,2].map(i=>(
          <motion.span key={i} animate={{y:[0,-6,0]}} transition={{duration:0.6,delay:i*0.15,repeat:Infinity}}
            style={{width:6,height:6,borderRadius:"50%",background:"#818cf8",display:"block"}}/>
        ))}
      </div>
    </div>
  )
}

function EmptyState({onSuggestion}) {
  const suggestions = ["Reply to my professor","Summarize my notes","Schedule a meeting"]
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:"0 32px",userSelect:"none"}}>
      <motion.div
        animate={{y:[0,-8,0],boxShadow:["0 0 20px rgba(100,80,255,0.3)","0 0 40px rgba(100,80,255,0.6)","0 0 20px rgba(100,80,255,0.3)"]}}
        transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
        style={{width:64,height:64,borderRadius:20,
          background:"linear-gradient(135deg,rgba(80,60,200,0.4),rgba(30,80,200,0.4))",
          border:"1px solid rgba(100,150,255,0.3)",backdropFilter:"blur(20px)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Sparkles size={28} color="#a78bfa"/>
      </motion.div>
      <div style={{textAlign:"center"}}>
        <p style={{fontSize:15,fontWeight:600,margin:"0 0 6px",
          background:"linear-gradient(135deg,#c084fc,#60a5fa)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Your Digital Twin</p>
        <p style={{fontSize:12,color:"#475569",margin:0}}>Start a conversation — I'll respond exactly like you</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>
        {suggestions.map(s=>(
          <button key={s} onClick={()=>onSuggestion(s)} style={{
            fontSize:12,padding:"8px 16px",borderRadius:20,cursor:"pointer",
            background:"rgba(10,20,80,0.5)",border:"1px solid rgba(100,150,255,0.25)",
            color:"#94a3b8",backdropFilter:"blur(10px)",transition:"all 0.2s",fontFamily:"inherit"
          }}
          onMouseEnter={e=>{e.currentTarget.style.color="#a78bfa";e.currentTarget.style.borderColor="rgba(120,100,255,0.5)";e.currentTarget.style.background="rgba(80,60,200,0.2)"}}
          onMouseLeave={e=>{e.currentTarget.style.color="#94a3b8";e.currentTarget.style.borderColor="rgba(100,150,255,0.25)";e.currentTarget.style.background="rgba(10,20,80,0.5)"}}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatWindow({messages=[],isSending=false,onSend,sessionId,voiceText=""}) {
  const { mode } = useTheme()
  const {user} = useAuth()
  const [input,setInput] = useState("")
  const [pendingFiles,setPendingFiles] = useState([])
  const [showUpload,setShowUpload] = useState(false)
  const [focused,setFocused] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"})},[messages,isSending])
  useEffect(()=>{if(voiceText)setInput(prev=>(prev+" "+voiceText).trim())},[voiceText])

  const handleSend = () => {
    const text = input.trim()
    if(!text&&pendingFiles.length===0)return
    onSend?.(text,pendingFiles)
    setInput(""); setPendingFiles([]); setShowUpload(false)
  }

  const handleKeyDown = (e) => {
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend()}
  }

  const isStreamingNow = messages.some(m => m.streaming === true)

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",minHeight:0}}>
        {messages.length===0?(
          <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
            <EmptyState onSuggestion={s=>{setInput(s);textareaRef.current?.focus()}}/>
          </div>
        ):(
          <div style={{paddingTop:16,paddingBottom:16}}>
            <AnimatePresence initial={false}>
              {messages.map(msg=><MessageBubble key={msg.id} message={msg}/>)}
            </AnimatePresence>
            <div ref={bottomRef}/>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUpload&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            style={{borderTop:"1px solid rgba(80,120,255,0.15)",overflow:"hidden",flexShrink:0}}>
            <FileUpload sessionId={sessionId} onFilesReady={setPendingFiles} autoUpload={true} userId={user?.uid||"guest"}/>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingFiles.length>0&&(
        <div style={{display:"flex",gap:8,padding:"8px 16px",flexWrap:"wrap",flexShrink:0}}>
          {pendingFiles.map((f,i)=>(
            <span key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,background:"rgba(10,20,80,0.5)",color:"#94a3b8",borderRadius:20,padding:"4px 12px",border:"1px solid rgba(100,150,255,0.2)"}}>
              <Paperclip size={9}/>{f.name}
              <button onClick={()=>setPendingFiles(p=>p.filter((_,j)=>j!==i))} style={{marginLeft:4,opacity:0.5,cursor:"pointer",background:"none",border:"none",color:"inherit"}}>×</button>
            </span>
          ))}
        </div>
      )}

      <div style={{flexShrink:0,padding:"12px 16px",background:mode==="light"?"rgba(255,255,255,0.7)":"rgba(8,13,46,0.7)",backdropFilter:"blur(20px)",borderTop:mode==="light"?"1px solid rgba(100,100,255,0.15)":"1px solid rgba(80,120,255,0.15)"}}>
        <div style={{
          display:"flex",gap:8,alignItems:"flex-end",
          background:mode==="light"?"rgba(245,247,255,0.8)":"rgba(15,25,90,0.6)",
          border:focused?"1px solid rgba(120,160,255,0.7)":"1px solid rgba(80,120,255,0.3)",
          borderRadius:16,padding:"10px 14px",backdropFilter:"blur(20px)",
          boxShadow:focused?"0 0 0 3px rgba(80,120,255,0.2),0 0 30px rgba(80,120,255,0.25)":"0 4px 20px rgba(0,0,0,0.2)",
          transition:"all 0.3s"
        }}>
          <button onClick={()=>setShowUpload(v=>!v)} style={{
            padding:6,borderRadius:8,border:"none",cursor:"pointer",flexShrink:0,
            background:showUpload?"rgba(120,100,255,0.2)":"transparent",
            color:showUpload?"#a78bfa":"#475569",transition:"all 0.2s"
          }}>
            <Paperclip size={15}/>
          </button>
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={()=>setFocused(true)}
            onBlur={()=>setFocused(false)}
            placeholder="Message your twin…"
            style={{
              flex:1,background:"transparent",fontSize:13,color:mode==="light"?"#1e1b4b":"#e2e8f0",
              resize:"none",outline:"none",maxHeight:128,minHeight:24,
              paddingTop:2,border:"none",fontFamily:"inherit",lineHeight:1.5
            }}
            onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px"}}
          />
          <motion.button
            onClick={isStreamingNow ? ()=>{} : handleSend}
            whileHover={{scale:1.1}} whileTap={{scale:0.9}}
            style={{
              padding:6,borderRadius:8,border:"none",cursor:"pointer",flexShrink:0,
              background:input.trim()||isStreamingNow?"linear-gradient(135deg,#7c3aed,#2563eb)":"transparent",
              color:input.trim()||isStreamingNow?"white":"#475569",
              boxShadow:input.trim()?"0 4px 12px rgba(100,80,255,0.4)":"none",
              transition:"all 0.2s"
            }}>
            {isStreamingNow?<Square size={15}/>:<Send size={15}/>}
          </motion.button>
        </div>
        <p style={{fontSize:10,color:"#334155",textAlign:"center",marginTop:6,marginBottom:0}}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}


