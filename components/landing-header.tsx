"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Coffee } from "lucide-react"

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 120
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <>
      {/* Desktop Header */}
      <header
        className={`sticky top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between rounded-full bg-white md:flex transition-all duration-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
          isScrolled ? "max-w-3xl px-2" : "max-w-5xl px-4"
        } py-2`}
      >
        <Link
          className={`z-50 flex items-center justify-center gap-2 transition-all duration-300 ${
            isScrolled ? "ml-4" : ""
          }`}
          href="/"
        >
          <div className="bg-[#0000FF] rounded-full p-2 border-4 border-black">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-black transition-all duration-300 ${isScrolled ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
            BuyCoffee
          </span>
        </Link>

        <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-bold md:flex md:space-x-2 pointer-events-none">
          <button
            onClick={() => scrollToSection("features")}
            className="relative px-4 py-2 hover:underline transition-colors cursor-pointer pointer-events-auto"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("support")}
            className="relative px-4 py-2 hover:underline transition-colors cursor-pointer pointer-events-auto"
          >
            Support
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="relative px-4 py-2 hover:underline transition-colors cursor-pointer pointer-events-auto"
          >
            How it works
          </button>
          <Link
            href="/discover"
            className="relative px-4 py-2 hover:underline transition-colors cursor-pointer pointer-events-auto"
          >
            Discover
          </Link>
        </div>

        <div className="flex items-center gap-4 z-50">
          <Link href="/login" className="font-bold transition-colors hover:underline text-sm cursor-pointer">
            Log In
          </Link>

          <Link
            href="/signup"
            className="rounded-full font-black cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-[#CCFF00] text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-2 text-sm"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hidden px-4 py-3">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-[#0000FF] rounded-full p-2 border-4 border-black">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black">BuyCoffee</span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#CCFF00] border-4 border-black transition-colors hover:bg-[#B8E600]"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
            <span
              className={`block w-4 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-black transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            ></span>
          </div>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 md:hidden">
          <div className="absolute top-20 left-4 right-4 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setTimeout(() => scrollToSection("features"), 100)
                }}
                className="text-left px-4 py-3 text-lg font-bold hover:bg-[#CCFF00] transition-colors rounded-2xl border-2 border-transparent hover:border-black"
              >
                Features
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setTimeout(() => scrollToSection("support"), 100)
                }}
                className="text-left px-4 py-3 text-lg font-bold hover:bg-[#CCFF00] transition-colors rounded-2xl border-2 border-transparent hover:border-black"
              >
                Support
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setTimeout(() => scrollToSection("how-it-works"), 100)
                }}
                className="text-left px-4 py-3 text-lg font-bold hover:bg-[#CCFF00] transition-colors rounded-2xl border-2 border-transparent hover:border-black"
              >
                How it works
              </button>
              <Link
                href="/discover"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-left px-4 py-3 text-lg font-bold hover:bg-[#CCFF00] transition-colors rounded-2xl border-2 border-transparent hover:border-black"
              >
                Discover
              </Link>
              <div className="border-t-4 border-black pt-4 mt-4 flex flex-col space-y-3">
                <Link
                  href="/login"
                  className="px-4 py-3 text-lg font-bold hover:bg-gray-100 transition-colors rounded-2xl border-2 border-transparent hover:border-black cursor-pointer"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-3 text-lg font-bold text-center bg-[#CCFF00] rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Sign Up
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
