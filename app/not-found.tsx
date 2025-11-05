import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Coffee, Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-block bg-[#CCFF00] border-4 border-black rounded-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Coffee className="w-24 h-24 text-black" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-9xl font-black mb-4">404</h1>

        {/* Error Message */}
        <h2 className="text-4xl md:text-5xl font-black mb-6">Page Not Found</h2>
        <p className="text-xl md:text-2xl font-bold text-gray-600 mb-12 max-w-lg mx-auto">
          Oops! The page you're looking for doesn't exist. Maybe it's time for a coffee break?
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-[#CCFF00] transition-all"
          >
            <Link href="/discover">
              <Search className="w-5 h-5 mr-2" />
              Discover Creators
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
