import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext(null)

const THEMES = {
  dark: {
    bgGradient: "linear-gradient(135deg,#080d2e 0%,#0d1545 40%,#0a1535 70%,#080d2e 100%)",
    cardBg: "rgba(10,20,80,0.45)",
    cardBorder: "rgba(100,150,255,0.2)",
    text: "#ffffff",
    textMuted: "#64748b",
    textDim: "#93c5fd",
    inputBg: "rgba(10,20,80,0.4)",
  },
  light: {
    bgGradient: "linear-gradient(135deg,#eef2ff 0%,#e0e7ff 40%,#dbeafe 70%,#eef2ff 100%)",
    cardBg: "rgba(255,255,255,0.7)",
    cardBorder: "rgba(100,100,255,0.15)",
    text: "#1e1b4b",
    textMuted: "#64748b",
    textDim: "#4f46e5",
    inputBg: "rgba(255,255,255,0.8)",
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("tm_theme") || "dark")

  useEffect(() => {
    localStorage.setItem("tm_theme", mode)
    document.documentElement.setAttribute("data-theme", mode)
  }, [mode])

  const toggleTheme = () => setMode(m => m === "dark" ? "light" : "dark")

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colors: THEMES[mode] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
