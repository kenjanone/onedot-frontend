"use client"

import Image from "next/image"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TeamLogoProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  size?: number // Shorthand for squared width & height
  className?: string
  fallbackClassName?: string
}

export function TeamLogo({
  src,
  alt,
  width,
  height,
  size = 24,
  className,
  fallbackClassName,
}: TeamLogoProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const w = width ?? size
  const h = height ?? size

  if (!src || error) {
    return (
      <div 
        className={cn("bg-secondary flex-shrink-0 rounded-full flex items-center justify-center border border-border/50", fallbackClassName, className)}
        style={{ width: w, height: h }}
      />
    )
  }

  return (
    <div 
      className={cn("relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center", className)} 
      style={{ width: w, height: h }}
    >
      {loading && (
        <Skeleton className="absolute inset-0 rounded-full z-0" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${w}px`}
        className={cn(
          "object-contain transition-opacity duration-300 z-10",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}
