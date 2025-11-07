import Image from "next/image"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-bounce mb-6">
          <Image src="/logo/logocobbee.svg" alt="Cobbee" width={64} height={64} className="w-16 h-16" />
        </div>
        <p className="text-2xl font-black">Brewing your page...</p>
      </div>
    </div>
  )
}
