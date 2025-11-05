"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, RefreshCcw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Illustration */}
        <div className="mb-8">
          <div className="inline-block bg-[#FF6B35] border-4 border-black rounded-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Coffee className="w-24 h-24 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-5xl md:text-6xl font-black mb-6">Oops! Something went wrong</h1>
        <p className="text-xl md:text-2xl font-bold text-gray-600 mb-12 max-w-lg mx-auto">
          Don't worry, even the best code needs a coffee break sometimes. Let's try again!
        </p>

        {/* Error Details (dev mode) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 p-4 bg-gray-100 border-4 border-black rounded-2xl text-left max-w-2xl mx-auto overflow-auto">
            <p className="font-bold text-sm mb-2">Error Details:</p>
            <pre className="text-xs text-red-600">{error.message}</pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-[#CCFF00] transition-all"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
