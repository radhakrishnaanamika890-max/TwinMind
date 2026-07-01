import { useEffect, useState } from "react"
import { Save, Loader2, User, Sliders, Bell, Shield, Github, Link2, Unlink, GitBranch, Star, ExternalLink, MessageCircle, Download, Trash2, Clock, AlertTriangle, X } from "lucide-react"
import { getSettings, updateSettings, getProfile, updateProfile, exportUserData, clearUserData, getActivityLog } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/hooks/useTheme"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

const getCard = (mode) => ({
  background: mode === "light" ? "rgba(255,255,255,0.7)" : "rgba(10,20,80,0.45)",
  backdropFilter: "blur(20px)",
  border: mode === "light" ? "1px solid rgba(100,100,255,0.15)" : "1px solid rgba(100,150,255,0.2)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
})

const inputStyle = {
  width: "100%",
  background: "rgba(10,20,80,0.4)",
  border: "1px solid rgba(100,150,255,0.25)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "white",
  fontSize: 13,
  outline: "none",
}

const labelStyle = {
  fontSize: 12,
  color: "#93c5fd",
  marginBottom: 6,
  display: "block",
  fontWeight: 500
}

const API_BASE = "https://twinmind-production-5a79.up.railway.app"

export default function Settings() {
  const { user } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const [tab, setTab] = useState("profile")

  // Privacy state
  const [activityLog, setActivityLog] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [retentionDays, setRetentionDays] = useState("forever")
  const [privacySummary, setPrivacySummary] = useState(null)
  const [privacySummaryLoading, setPrivacySummaryLoading] = useState(false)

  const loadActivity = async () => {
    if (!user?.uid) return
    setActivityLoading(true)
    try {
      const data = await getActivityLog(user.uid, 10)
      setActivityLog(data.entries || [])
    } catch {
      // silent fail
    } finally {
      setActivityLoading(false)
    }
  }

  const loadPrivacySummary = async () => {
    if (!user?.uid) return
    setPrivacySummaryLoading(true)
    try {
      const data = await exportUserData(user.uid, { preview: true }) // see note below if exportUserData doesn't support a 2nd arg
      setPrivacySummary(data)
    } catch {
      setPrivacySummary(null)
    } finally {
      setPrivacySummaryLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== "privacy" || !user?.uid) return
    loadActivity()
    loadPrivacySummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user])

  const handleExport = async () => {
    if (!user?.uid) return
    setExporting(true)
    try {
      const data = await exportUserData(user.uid)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `twinmind-data-${user.uid}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Data exported!")
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }

  const handleClearData = async () => {
    if (!user?.uid) return
    setClearing(true)
    try {
      const result = await clearUserData(user.uid)
      toast.success(`Cleared ${result?.entries_removed ?? 0} memory entries`)
      setShowClearConfirm(false)
      loadActivity()
      loadPrivacySummary()
    } catch {
      toast.error("Failed to clear data")
    } finally {
      setClearing(false)
    }
  }
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ displayName: "", bio: "" })
  const [settings, setSettings] = useState({ temperature: 0.7, memory_enabled: true, notifications: true })

  const [githubConnected, setGithubConnected] = useState(false)
  const [githubLoading, setGithubLoading] = useState(true)
  const [githubUser, setGithubUser] = useState(null)
  const [githubRepos, setGithubRepos] = useState([])
  const [reposLoading, setReposLoading] = useState(false)

  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [linkedinLoading, setLinkedinLoading] = useState(true)
  const [linkedinUser, setLinkedinUser] = useState(null)

  // ── WhatsApp — direct wa.me link, no OAuth/demo needed ─────────────────────
  const [whatsappPhone, setWhatsappPhone] = useState(
    () => localStorage.getItem("whatsapp_phone") || ""
  )
  const [whatsappShowInput, setWhatsappShowInput] = useState(false)
  const whatsappConnected = !!whatsappPhone

  useEffect(() => {
    getProfile().then(d => setProfile({ displayName: d.displayName || "", bio: d.bio || "" })).catch(() => {})
    getSettings().then(d => setSettings(d)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== "integrations" || !user?.uid) return

    setGithubLoading(true)
    fetch(`${API_BASE}/api/auth/github/status?user_id=${user.uid}`)
      .then(res => res.json())
      .then(data => {
        setGithubConnected(!!data.connected)
        if (data.connected) { fetchGithubUser(); fetchGithubRepos() }
      })
      .catch(() => setGithubConnected(false))
      .finally(() => setGithubLoading(false))

    setLinkedinLoading(true)
    fetch(`${API_BASE}/api/auth/linkedin/status?user_id=${user.uid}`)
      .then(res => res.json())
      .then(data => {
        setLinkedinConnected(!!data.connected)
        if (data.connected) fetchLinkedinUser()
      })
      .catch(() => setLinkedinConnected(false))
      .finally(() => setLinkedinLoading(false))
  }, [tab, user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("github") === "connected") {
      toast.success("GitHub connected!")
      setGithubConnected(true)
      setTab("integrations")
      window.history.replaceState({}, "", window.location.pathname)
      fetchGithubUser(); fetchGithubRepos()
    }
    if (params.get("linkedin") === "connected") {
      toast.success("LinkedIn connected!")
      setLinkedinConnected(true)
      setTab("integrations")
      window.history.replaceState({}, "", window.location.pathname)
      fetchLinkedinUser()
    }
  }, [])

  const fetchGithubUser = async () => {
    if (!user?.uid) return
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/user?user_id=${user.uid}`)
      setGithubUser(await res.json())
    } catch { setGithubUser(null) }
  }

  const fetchGithubRepos = async () => {
    if (!user?.uid) return
    setReposLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/repos?user_id=${user.uid}`)
      const data = await res.json()
      setGithubRepos(Array.isArray(data) ? data.slice(0, 6) : [])
    } catch { setGithubRepos([]) }
    finally { setReposLoading(false) }
  }

  const fetchLinkedinUser = async () => {
    if (!user?.uid) return
    try {
      const res = await fetch(`${API_BASE}/api/auth/linkedin/user?user_id=${user.uid}`)
      setLinkedinUser(await res.json())
    } catch { setLinkedinUser(null) }
  }

  const saveProfile = async () => {
    setSaving(true)
    try { await updateProfile(profile); toast.success("Profile saved!") }
    catch { toast.error("Failed to save") }
    setSaving(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    try { await updateSettings(settings); toast.success("Settings saved!") }
    catch { toast.error("Failed to save") }
    setSaving(false)
  }

  const connectGithub = () => {
    if (!user?.uid) { toast.error("Sign in first"); return }
    window.location.href = `${API_BASE}/api/auth/github/login?user_id=${user.uid}`
  }

  const disconnectGithub = async () => {
    if (!user?.uid) return
    try {
      await fetch(`${API_BASE}/api/auth/github/disconnect?user_id=${user.uid}`, { method: "POST" })
      setGithubConnected(false); setGithubUser(null); setGithubRepos([])
      toast.success("GitHub disconnected")
    } catch { toast.error("Failed to disconnect") }
  }

  const connectLinkedin = () => {
    if (!user?.uid) { toast.error("Sign in first"); return }
    window.location.href = `${API_BASE}/api/auth/linkedin/login?user_id=${user.uid}`
  }

  const disconnectLinkedin = async () => {
    if (!user?.uid) return
    try {
      await fetch(`${API_BASE}/api/auth/linkedin/disconnect?user_id=${user.uid}`, { method: "POST" })
      setLinkedinConnected(false); setLinkedinUser(null)
      toast.success("LinkedIn disconnected")
    } catch { toast.error("Failed to disconnect") }
  }

  // ── WhatsApp handlers — no backend call, just store + build wa.me link ─────
  const sanitizePhone = (raw) => raw.replace(/[^0-9]/g, "")

  const connectWhatsapp = () => {
    const clean = sanitizePhone(whatsappPhone)
    if (!clean || clean.length < 8) {
      toast.error("Valid phone number (with country code) enter pannu")
      return
    }
    setWhatsappPhone(clean)
    localStorage.setItem("whatsapp_phone", clean)
    setWhatsappShowInput(false)
    toast.success("WhatsApp linked!")
  }

  const disconnectWhatsapp = () => {
    setWhatsappPhone("")
    localStorage.removeItem("whatsapp_phone")
    toast.success("WhatsApp disconnected")
  }

  const openWhatsapp = () => {
    if (!whatsappPhone) return
    window.open(`https://wa.me/${whatsappPhone}`, "_blank", "noopener,noreferrer")
  }

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "ai", icon: Sliders, label: "AI" },
    { id: "integrations", icon: Link2, label: "Integrations" },
    { id: "notifications", icon: Bell, label: "Alerts" },
    { id: "privacy", icon: Shield, label: "Privacy" },
  ]

  // Build a safe LinkedIn profile URL from whatever the backend returns
  const linkedinProfileUrl =
    linkedinUser?.profile_url ||
    linkedinUser?.publicProfileUrl ||
    (linkedinUser?.vanity_name ? `https://www.linkedin.com/in/${linkedinUser.vanity_name}` : null) ||
    (linkedinUser?.id ? `https://www.linkedin.com/in/${linkedinUser.id}` : null)

  return (
    <div style={{height:"100%", overflowY:"auto", padding:24}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>

        <div style={{marginBottom:24}}>
          <h1 style={{
            fontSize:22, fontWeight:700, margin:0,
            background:"linear-gradient(135deg,#c084fc,#60a5fa)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
          }}>Settings</h1>
          <p style={{fontSize:12, color:"#64748b", margin:"4px 0 0"}}>Manage your TwinMind preferences</p>
        </div>

        <div style={{display:"flex", gap:8, marginBottom:20, flexWrap:"wrap"}}>
          {tabs.map(({id, icon:Icon, label}) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:500, transition:"all 0.2s",
              background: tab===id ? "rgba(100,120,255,0.3)" : (mode === "light" ? "rgba(255,255,255,0.5)" : "rgba(10,20,80,0.3)"),
              color: tab===id ? (mode === "light" ? "#3730a3" : "#a5b4fc") : "#64748b",
              borderBottom: tab===id ? "2px solid #818cf8" : "2px solid transparent",
            }}>
              <Icon size={13}/>{label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div style={getCard(mode)}>
              <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
                <div style={{width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"2px solid rgba(100,150,255,0.4)",boxShadow:"0 0 20px rgba(100,100,255,0.3)"}}>
                  {user?.photoURL
                    ? <img src={user.photoURL} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    : <div style={{width:"100%",height:"100%",background:"rgba(100,80,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#a78bfa"}}>
                        {(user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                      </div>}
                </div>
                <div>
                  <p style={{fontSize:14,fontWeight:600,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>{user?.displayName || "User"}</p>
                  <p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>{user?.email}</p>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={labelStyle}>Display Name</label>
                <input style={inputStyle} value={profile.displayName}
                  onChange={e => setProfile(p => ({...p, displayName:e.target.value}))} placeholder="Your name" />
              </div>
              <div style={{marginBottom:20}}>
                <label style={labelStyle}>Bio</label>
                <textarea style={{...inputStyle, minHeight:80, resize:"vertical"}}
                  value={profile.bio}
                  onChange={e => setProfile(p => ({...p, bio:e.target.value}))}
                  placeholder="Tell your twin about you..." />
              </div>
              <button onClick={saveProfile} disabled={saving} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:13,fontWeight:500,boxShadow:"0 4px 15px rgba(100,80,255,0.4)"}}>
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* AI Tab */}
        {tab === "ai" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div style={getCard(mode)}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#a5b4fc",margin:"0 0 16px"}}>AI Behavior</h3>
              <div style={{marginBottom:20}}>
                <label style={labelStyle}>Temperature — {settings.temperature}</label>
                <input type="range" min="0" max="1" step="0.1" value={settings.temperature}
                  onChange={e => setSettings(s => ({...s, temperature:parseFloat(e.target.value)}))}
                  style={{width:"100%", accentColor:"#818cf8"}} />
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569",marginTop:4}}>
                  <span>Precise</span><span>Creative</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderTop:"1px solid rgba(100,150,255,0.1)"}}>
                <div>
                  <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>Memory Enabled</p>
                  <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>Remember past conversations</p>
                </div>
                <div onClick={() => setSettings(s => ({...s, memory_enabled:!s.memory_enabled}))}
                  style={{width:44,height:24,borderRadius:12,cursor:"pointer",transition:"all 0.2s",background:settings.memory_enabled?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.1)",position:"relative"}}>
                  <div style={{position:"absolute",top:2,width:20,height:20,borderRadius:"50%",background:"white",transition:"all 0.2s",left:settings.memory_enabled?22:2,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderTop:"1px solid rgba(100,150,255,0.1)"}}>
                <div>
                  <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>Light Mode</p>
                  <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>Switch between dark and light theme</p>
                </div>
                <div onClick={toggleTheme} style={{
                    width:44, height:24, borderRadius:12, cursor:"pointer", transition:"all 0.2s",
                    background: mode === "light" ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,0.1)",
                    position:"relative"
                  }}>
                  <div style={{
                    position:"absolute", top:2, width:20, height:20, borderRadius:"50%", background:"white",
                    transition:"all 0.2s", left: mode === "light" ? 22 : 2,
                    boxShadow:"0 2px 4px rgba(0,0,0,0.3)"
                  }}/>
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",marginTop:16,borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:13,fontWeight:500,boxShadow:"0 4px 15px rgba(100,80,255,0.4)"}}>
                {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save Settings
              </button>
            </div>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {tab === "integrations" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div style={getCard(mode)}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#a5b4fc",margin:"0 0 16px"}}>Connected Accounts</h3>

              {/* GitHub */}
              <div style={{borderBottom:"1px solid rgba(100,150,255,0.1)",paddingBottom:16,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:githubConnected&&githubUser?16:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Github size={18} color="#e2e8f0"/>
                    </div>
                    <div>
                      <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>GitHub</p>
                      <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>
                        {githubLoading?"Checking...":githubConnected?"Connected ✅":"Pull repos & issues into your twin"}
                      </p>
                    </div>
                  </div>
                  {githubLoading ? <Loader2 size={16} className="animate-spin" color="#64748b"/>
                  : githubConnected ? (
                    <button onClick={disconnectGithub} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,0.3)",cursor:"pointer",background:"rgba(248,113,113,0.1)",color:"#fca5a5",fontSize:12,fontWeight:500}}>
                      <Unlink size={13}/> Disconnect
                    </button>
                  ) : (
                    <button onClick={connectGithub} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:12,fontWeight:500,boxShadow:"0 4px 15px rgba(100,80,255,0.4)"}}>
                      <Link2 size={13}/> Connect
                    </button>
                  )}
                </div>
                {githubConnected && githubUser && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:16,marginBottom:16,border:"1px solid rgba(100,150,255,0.15)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <img src={githubUser.avatar_url} alt="avatar" style={{width:48,height:48,borderRadius:"50%",border:"2px solid rgba(100,150,255,0.4)"}}/>
                      <div>
                        <p style={{fontSize:14,fontWeight:600,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>{githubUser.name||githubUser.login}</p>
                        <p style={{fontSize:12,color:"#64748b",margin:"2px 0 0"}}>@{githubUser.login}</p>
                        {githubUser.email&&<p style={{fontSize:11,color:"#93c5fd",margin:"2px 0 0"}}>✉️ {githubUser.email}</p>}
                      </div>
                      <a href={githubUser.html_url} target="_blank" rel="noreferrer" style={{marginLeft:"auto",color:"#64748b"}}><ExternalLink size={14}/></a>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      {[["Repos",githubUser.public_repos],["Followers",githubUser.followers],["Following",githubUser.following]].map(([l,v])=>(
                        <div key={l} style={{textAlign:"center"}}>
                          <p style={{fontSize:16,fontWeight:700,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>{v||0}</p>
                          <p style={{fontSize:10,color:"#64748b",margin:0}}>{l}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {githubConnected && (
                  <div>
                    <p style={{fontSize:12,color:"#93c5fd",fontWeight:600,marginBottom:10}}>📁 Your Repositories</p>
                    {reposLoading ? (
                      <div style={{display:"flex",alignItems:"center",gap:8,color:"#64748b",fontSize:12}}>
                        <Loader2 size={14} className="animate-spin"/> Loading repos...
                      </div>
                    ) : githubRepos.length===0 ? <p style={{fontSize:12,color:"#64748b"}}>No repos found</p> : (
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {githubRepos.map(repo=>(
                          <div key={repo.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(100,150,255,0.1)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <GitBranch size={13} color="#818cf8"/>
                              <div>
                                <p style={{fontSize:12,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>{repo.name}</p>
                                {repo.description&&<p style={{fontSize:10,color:"#64748b",margin:0}}>{repo.description.slice(0,50)}{repo.description.length>50?"...":""}</p>}
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{display:"flex",alignItems:"center",gap:4,color:"#fbbf24",fontSize:11}}>
                                <Star size={11}/>{repo.stargazers_count}
                              </div>
                              <a href={repo.html_url} target="_blank" rel="noreferrer" style={{color:"#64748b"}}><ExternalLink size={12}/></a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LinkedIn */}
              <div style={{borderBottom:"1px solid rgba(100,150,255,0.1)",paddingBottom:16,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:linkedinConnected&&linkedinUser?16:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"rgba(10,102,194,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💼</div>
                    <div>
                      <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>LinkedIn</p>
                      <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>
                        {linkedinLoading?"Checking...":linkedinConnected?"Connected ✅":"Sync your professional profile"}
                      </p>
                    </div>
                  </div>
                  {linkedinLoading ? <Loader2 size={16} className="animate-spin" color="#64748b"/>
                  : linkedinConnected ? (
                    <button onClick={disconnectLinkedin} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,0.3)",cursor:"pointer",background:"rgba(248,113,113,0.1)",color:"#fca5a5",fontSize:12,fontWeight:500}}>
                      <Unlink size={13}/> Disconnect
                    </button>
                  ) : (
                    <button onClick={connectLinkedin} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#0a66c2,#0077b5)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:12,fontWeight:500,boxShadow:"0 4px 15px rgba(10,102,194,0.4)"}}>
                      <Link2 size={13}/> Connect
                    </button>
                  )}
                </div>
                {linkedinConnected && linkedinUser && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{background:"rgba(10,102,194,0.08)",borderRadius:12,padding:16,border:"1px solid rgba(10,102,194,0.25)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      {linkedinUser.picture
                        ? <img src={linkedinUser.picture} alt="avatar" style={{width:48,height:48,borderRadius:"50%",border:"2px solid rgba(10,102,194,0.4)"}}/>
                        : <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(10,102,194,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#60a5fa"}}>
                            {(linkedinUser.name?.[0]||"L").toUpperCase()}
                          </div>}
                      <div style={{flex:1}}>
                        <p style={{fontSize:14,fontWeight:600,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>{linkedinUser.name}</p>
                        {linkedinUser.email&&<p style={{fontSize:12,color:"#93c5fd",margin:"2px 0 0"}}>✉️ {linkedinUser.email}</p>}
                        {linkedinProfileUrl ? (
                          <a
                            href={linkedinProfileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize:11, color:"#60a5fa", margin:"4px 0 0",
                              textDecoration:"none", display:"inline-flex",
                              alignItems:"center", gap:4, cursor:"pointer"
                            }}
                          >
                            View LinkedIn Profile <ExternalLink size={11}/>
                          </a>
                        ) : (
                          <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>LinkedIn Profile</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* WhatsApp — real direct wa.me link, no backend/demo */}
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"rgba(37,211,102,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💬</div>
                    <div>
                      <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>WhatsApp</p>
                      <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>
                        {whatsappConnected ? `Linked ✅ (+${whatsappPhone})` : "Link your number to open a direct chat"}
                      </p>
                    </div>
                  </div>
                  {whatsappConnected ? (
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={disconnectWhatsapp}
                        style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(248,113,113,0.3)",cursor:"pointer",background:"rgba(248,113,113,0.1)",color:"#fca5a5",fontSize:12,fontWeight:500}}>
                        <Unlink size={13}/> Disconnect
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setWhatsappShowInput(!whatsappShowInput)}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#25d366,#128c7e)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:12,fontWeight:500,boxShadow:"0 4px 15px rgba(37,211,102,0.3)"}}>
                      <Link2 size={13}/> Connect
                    </button>
                  )}
                </div>

                {whatsappConnected && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{marginTop:12,padding:16,borderRadius:12,background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>+{whatsappPhone}</p>
                      <p style={{fontSize:10,color:"#64748b",margin:"2px 0 0"}}>Opens chat in WhatsApp</p>
                    </div>
                    <button onClick={openWhatsapp}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#25d366,#128c7e)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:12,fontWeight:500}}>
                      <MessageCircle size={13}/> Open WhatsApp
                    </button>
                  </motion.div>
                )}

                {whatsappShowInput && !whatsappConnected && (
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{marginTop:12,padding:16,borderRadius:12,background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.2)"}}>
                    <label style={{...labelStyle,color:"#4ade80"}}>Phone Number (with country code, no + or spaces)</label>
                    <div style={{display:"flex",gap:8}}>
                      <input style={{...inputStyle,border:"1px solid rgba(37,211,102,0.3)"}}
                        value={whatsappPhone}
                        onChange={e => setWhatsappPhone(e.target.value)}
                        placeholder="919876543210" />
                      <button onClick={connectWhatsapp}
                        style={{padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#25d366,#128c7e)",color: mode === "light" ? "#1e1b4b" : "white",fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>
                        Save
                      </button>
                    </div>
                    <p style={{fontSize:10,color:"#64748b",margin:"8px 0 0"}}>
                      Example: India number 98765 43210 → enter 919876543210
                    </p>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div style={getCard(mode)}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#a5b4fc",margin:"0 0 16px"}}>Notifications</h3>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0"}}>
                <div>
                  <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0}}>Push Notifications</p>
                  <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>Get notified about updates</p>
                </div>
                <div onClick={() => setSettings(s => ({...s, notifications:!s.notifications}))}
                  style={{width:44,height:24,borderRadius:12,cursor:"pointer",transition:"all 0.2s",background:settings.notifications?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,0.1)",position:"relative"}}>
                  <div style={{position:"absolute",top:2,width:20,height:20,borderRadius:"50%",background:"white",transition:"all 0.2s",left:settings.notifications?22:2,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}}/>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {tab === "privacy" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>

            <div style={getCard(mode)}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#a5b4fc",margin:"0 0 16px"}}>Privacy & Security</h3>
              <p style={{fontSize:12,color:"#64748b",lineHeight:1.6,margin:0}}>
                Your data is encrypted and stored securely. TwinMind does not share your personal data with third parties.
              </p>
            </div>

            {/* Connected services + memory count summary */}
            <div style={getCard(mode)}>
              <h3 style={{fontSize:14,fontWeight:600,color:"#a5b4fc",margin:"0 0 16px"}}>Your Data at a Glance</h3>
              {privacySummaryLoading ? (
                <div style={{display:"flex",alignItems:"center",gap:8,color:"#64748b",fontSize:12}}>
                  <Loader2 size={14} className="animate-spin"/> Loading...
                </div>
              ) : (
                <>
                  {privacySummary?.connected_services?.length > 0 ? (
                    <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
                      {privacySummary.connected_services.map(service => (
                        <span key={service} style={{
                          padding:"6px 12px", borderRadius:20,
                          background:"rgba(52,211,153,0.12)",
                          border:"1px solid rgba(52,211,153,0.25)",
                          color:"#6ee7b7", fontSize:11, fontWeight:500,
                          textTransform:"capitalize"
                        }}>● {service}</span>
                      ))}
                    </div>
                  ) : (
                    <p style={{fontSize:12,color:"#64748b",margin:"0 0 12px"}}>No services connected yet.</p>
                  )}
                  <p style={{fontSize:11,color:"#475569",margin:0}}>
                    {privacySummary?.memory_entries_count ?? 0} memory {privacySummary?.memory_entries_count === 1 ? 'entry' : 'entries'} stored
                  </p>
                </>
              )}
            </div>

            <div style={getCard(mode)}>
              {/* Export */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0"}}>
                <div>
                  <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>Export Your Data</p>
                  <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>Download everything TwinMind has stored about you</p>
                </div>
                <button onClick={handleExport} disabled={exporting} style={{
                  display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,
                  border:"1px solid rgba(100,150,255,0.3)",cursor:"pointer",
                  background:"rgba(100,150,255,0.1)",color:"#93c5fd",fontSize:12,fontWeight:500
                }}>
                  {exporting ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
                  Export
                </button>
              </div>

              {/* Data Retention */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderTop:"1px solid rgba(100,150,255,0.1)"}}>
                <div>
                  <p style={{fontSize:13,color: mode === "light" ? "#1e1b4b" : "white",margin:0,fontWeight:500}}>Data Retention</p>
                  <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>How long should TwinMind keep your conversation memory?</p>
                </div>
                <select value={retentionDays} onChange={e => setRetentionDays(e.target.value)} style={{
                  background: mode === "light" ? "rgba(255,255,255,0.8)" : "rgba(10,20,80,0.4)",
                  border:"1px solid rgba(100,150,255,0.25)", borderRadius:8, padding:"6px 10px",
                  color: mode === "light" ? "#1e1b4b" : "white", fontSize:12, outline:"none"
                }}>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>

              {/* Clear data */}
              <div style={{padding:"14px 0",borderTop:"1px solid rgba(100,150,255,0.1)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontSize:13,color:"#fca5a5",margin:0,fontWeight:500}}>Clear All Memory</p>
                    <p style={{fontSize:11,color:"#64748b",margin:"2px 0 0"}}>Permanently delete everything TwinMind remembers about you</p>
                  </div>
                  <button onClick={() => setShowClearConfirm(true)} style={{
                    display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,
                    border:"1px solid rgba(248,113,113,0.3)",cursor:"pointer",
                    background:"rgba(248,113,113,0.1)",color:"#fca5a5",fontSize:12,fontWeight:500
                  }}>
                    <Trash2 size={13}/> Clear Data
                  </button>
                </div>
              </div>
            </div>

            {/* Activity log */}
            <div style={getCard(mode)}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <p style={{fontSize:12,color:"#93c5fd",fontWeight:600,margin:0,display:"flex",alignItems:"center",gap:6}}>
                  <Clock size={13}/> Recent Activity
                </p>
                <button onClick={loadActivity} style={{
                  background:"none",border:"none",color:"#64748b",fontSize:11,cursor:"pointer"
                }}>{activityLoading ? "Loading..." : "Refresh"}</button>
              </div>
              {activityLog.length === 0 ? (
                <p style={{fontSize:11,color:"#64748b"}}>No recent activity. Click refresh to load.</p>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {activityLog.map((entry, i) => (
                    <div key={i} style={{
                      padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(100,150,255,0.08)"
                    }}>
                      <p style={{fontSize:11,color: mode === "light" ? "#1e1b4b" : "#cbd5e1",margin:0}}>{entry.summary || "(no content)"}</p>
                      <p style={{fontSize:9,color:"#64748b",margin:"3px 0 0",textTransform:"uppercase"}}>{entry.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{padding:"12px 16px",borderRadius:10,background:"rgba(100,150,255,0.08)",border:"1px solid rgba(100,150,255,0.15)"}}>
              <p style={{fontSize:12,color:"#93c5fd",margin:0}}>🔒 End-to-end encrypted conversations</p>
            </div>
            <div style={{marginTop:8,padding:"12px 16px",borderRadius:10,background:"rgba(100,150,255,0.08)",border:"1px solid rgba(100,150,255,0.15)"}}>
              <p style={{fontSize:12,color:"#93c5fd",margin:0}}>🛡️ GDPR compliant data handling</p>
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{
              position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
              display:"flex", alignItems:"center", justifyContent:"center", zIndex:100
            }}
            onClick={() => !clearing && setShowClearConfirm(false)}
          >
            <motion.div
              initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}}
              onClick={e => e.stopPropagation()}
              style={{
                background:"rgba(15,20,60,0.98)", borderRadius:16, padding:28, maxWidth:380,
                border:"1px solid rgba(248,113,113,0.25)",
                boxShadow:"0 20px 60px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <AlertTriangle size={20} color="#fca5a5"/>
                  <h3 style={{fontSize:15, fontWeight:600, color:"white", margin:0}}>Clear all memory?</h3>
                </div>
                <button onClick={() => !clearing && setShowClearConfirm(false)} style={{
                  background:"none", border:"none", cursor:"pointer", color:"#64748b"
                }}>
                  <X size={18}/>
                </button>
              </div>
              <p style={{fontSize:13, color:"#94a3b8", lineHeight:1.6, margin:"0 0 20px"}}>
                This will permanently delete everything your twin remembers about your conversations,
                preferences, and facts. This cannot be undone. Your connected accounts (GitHub, LinkedIn,
                WhatsApp) will stay connected.
              </p>
              <div style={{display:"flex", gap:10}}>
                <button onClick={() => setShowClearConfirm(false)} disabled={clearing} style={{
                  flex:1, padding:"10px", borderRadius:10, border:"1px solid rgba(100,150,255,0.2)",
                  background:"transparent", color:"#94a3b8", fontSize:13, fontWeight:500, cursor:"pointer"
                }}>
                  Cancel
                </button>
                <button onClick={handleClearData} disabled={clearing} style={{
                  flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"10px", borderRadius:10, border:"none",
                  background:"linear-gradient(135deg,#ef4444,#dc2626)",
                  color:"white", fontSize:13, fontWeight:500, cursor: clearing ? "default" : "pointer",
                  opacity: clearing ? 0.7 : 1
                }}>
                  {clearing ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                  {clearing ? 'Clearing...' : 'Yes, clear it'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

