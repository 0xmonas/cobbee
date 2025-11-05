import { Coffee } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block bg-[#CCFF00] border-4 border-black rounded-full p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
          <Coffee className="w-16 h-16 text-black" />
        </div>
        <p className="text-2xl font-black mt-6">Brewing your page...</p>
      </div>
    </div>
  )
}
