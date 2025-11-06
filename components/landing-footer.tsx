"use client"

import { motion, AnimatePresence } from "framer-motion"
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

          const isNearBottom = scrollTop + windowHeight >= documentHeight - 100

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
    <AnimatePresence>
      {isAtBottom && (
        <motion.div
          className="fixed z-50 bottom-0 left-0 w-full h-80 flex justify-center items-center"
          style={{ backgroundColor: "#FF6B35" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div
            className="relative overflow-hidden w-full h-full flex justify-end px-6 md:px-12 text-right items-start py-12"
          >
            <motion.div
              className="flex flex-row space-x-8 sm:space-x-12 md:space-x-16 text-sm sm:text-base md:text-lg font-bold text-black"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <ul className="space-y-2">
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/discover">Discover</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/about">About</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/help">Help Center</Link>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/apps">Apps</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/resources">Resources</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/privacy">Privacy</Link>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <Link href="/terms">Terms</Link>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    Twitter
                  </a>
                </li>
                <li className="hover:underline cursor-pointer transition-colors hover:text-black/80">
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </motion.div>
            <motion.h2
              className="absolute bottom-0 left-0 translate-y-[28%] text-[80px] sm:text-[120px] md:text-[160px] lg:text-[192px] font-black select-none text-black/20"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              BC
            </motion.h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
