import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32, className: "w-8 h-8" },
    md: { width: 40, height: 40, className: "w-10 h-10" },
    lg: { width: 48, height: 48, className: "w-12 h-12" },
  }

  const { width, height, className: sizeClass } = sizeMap[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
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
