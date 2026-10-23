import Image from "next/image"
import React from "react"

const ConversationView = () => {
  return (
    <div className="flex h-full flex-1 flex-col gap-y-4 bg-muted">
      <div className="flex flex-1 items-center justify-center gap-x-2">
        <Image
          src="/logo_full2.svg"
          alt="FluxSupport logo"
          height={40}
          width={40}
          className="w-52"
        />
      </div>
    </div>
  )
}

export default ConversationView
