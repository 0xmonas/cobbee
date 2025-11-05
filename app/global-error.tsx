"use client"

import { useEffect } from "react"

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="inline-block bg-[#FF6B35] border-4 border-black rounded-full p-8">
                <svg
                  className="w-24 h-24 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black mb-6">Critical Error</h1>
            <p className="text-xl md:text-2xl font-bold text-gray-600 mb-12 max-w-lg mx-auto">
              Something went seriously wrong. Please refresh the page or contact support.
            </p>

            <button
              onClick={reset}
              className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
