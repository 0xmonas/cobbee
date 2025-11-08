"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border-4 border-black bg-white px-4 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          className
        )}
        disabled
      >
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]",
        isDark ? "bg-black text-white" : "bg-white text-black",
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm">Light</span>
        </>
      )}
    </button>
  )
}
