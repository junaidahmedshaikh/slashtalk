"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

const LS_KEY = "SlashTalk_theme"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = saved ? saved === "dark" : prefersDark
    setDark(initial)
    document.documentElement.classList.toggle("dark", initial)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem(LS_KEY, next ? "dark" : "light")
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-950/60 px-2.5 py-1.5 hover:bg-white dark:hover:bg-gray-900 transition"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {dark ? <Moon size={16} /> : <Sun size={16} />}
      <span className="text-xs">{dark ? "Dark" : "Light"}</span>
    </button>
  )
}
