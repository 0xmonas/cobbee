import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeMap = {
    sm: { width: 20, height: 20, className: "w-5 h-5" },
    md: { width: 24, height: 24, className: "w-6 h-6" },
    lg: { width: 32, height: 32, className: "w-8 h-8" },
  }

  const { width, height, className: sizeClass } = sizeMap[size]

  return (
    <div className={`bg-white rounded-full p-2 border-4 border-black flex items-center justify-center ${className}`}>
      <Image
        src="/logo/logocobbee.svg"
        alt="Cobbee"
        width={width}
        height={height}
        className={sizeClass}
      />
    </div>
  )
}
