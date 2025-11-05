"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function LandingFooter() {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const documentHeight = document.documentElement.scrollHeight

          const isNearBottom = scrollTop + windowHeight >= documentHeight - 10

          setIsAtBottom(isNearBottom)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {isAtBottom && (
        <div
          className="fixed z-50 bottom-0 left-0 w-full h-80 flex justify-center items-center bg-[#FF6B35] transition-transform duration-300 ease-out"
          style={{
            transform: isAtBottom ? "translateY(0)" : "translateY(100%)",
          }}
        >
          <div className="relative overflow-hidden w-full h-full flex justify-end px-6 md:px-12 text-right items-start py-12">
            <div className="flex flex-row space-x-8 sm:space-x-12 md:space-x-16 text-sm sm:text-base md:text-lg font-bold">
              <ul className="space-y-2">
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <Link href="/discover">Discover</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <Link href="/login">Login</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <Link href="/signup">Sign Up</Link>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <a href="#features">Features</a>
                </li>
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <a href="#how-it-works">How it works</a>
                </li>
                <li className="hover:underline cursor-pointer transition-colors text-black hover:text-black/80">
                  <a href="#">Help</a>
                </li>
              </ul>
            </div>
            <h2 className="absolute bottom-0 left-0 translate-y-1/3 text-[80px] sm:text-[120px] md:text-[192px] font-black select-none text-black opacity-90">
              BC
            </h2>
          </div>
        </div>
      )}
    </>
  )
}
