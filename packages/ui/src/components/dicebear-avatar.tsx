"use client"

import { useMemo } from "react"
import { Style, Avatar as createAvatar } from "@dicebear/core"
import definition from "@dicebear/styles/glass.json" with { type: "json" }
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "../lib/utils"

interface DicebearAvatarProps {
  seed: string
  size?: number
  className?: string
  badgeClassName?: string
  imageUrl?: string
  badgeImageUrl?: string
}

/**
 * Avatar component that renders a custom image URL or generates a deterministic
 * DiceBear SVG avatar based on a seed string when no image URL is provided.
 * Optionally supports rendering an overlapping badge image.
 */
export const DicebearAvatar = ({
  seed,
  size = 32,
  className,
  badgeClassName,
  imageUrl,
  badgeImageUrl,
}: DicebearAvatarProps) => {
  const avatarSrc = useMemo(() => {
    if (imageUrl) {
      return imageUrl
    }

    // Generate avatar for users/customers without a custom profile image
    const style = new Style(definition)
    const avatar = new createAvatar(style, {
      seed: seed.toLowerCase().trim(),
      size,
    })
    return avatar.toDataUri()
  }, [seed, size, imageUrl])

  // Badge size is scaled proportionally to half the avatar size
  const badgeSize = Math.round(size * 0.5)

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Main avatar image */}
      <Avatar
        className={cn("border", className)}
        style={{ width: size, height: size }}
      >
        <AvatarImage alt="Avatar Image" src={avatarSrc} />
      </Avatar>

      {/* Optional badge overlay in bottom-right corner */}
      {badgeImageUrl && (
        <div
          className={cn(
            "absolute right-0 bottom-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background",
            badgeClassName
          )}
          style={{
            width: badgeSize,
            height: badgeSize,
            transform: "translate(15%, 15%)",
          }}
        >
          <img
            alt="badge"
            className="h-full w-full object-cover"
            height={badgeSize}
            width={badgeImageUrl}
            src={badgeImageUrl}
          />
        </div>
      )}
    </div>
  )
}
