import { cn } from "cn"
import { ArrowRight, ArrowUp, CheckIcon } from "lucide-react"

interface conversationStatusIconProps {
  status: "unresolved" | "resolved" | "escalated"
  className?: string
}

const statusConfig = {
  resolved: {
    icon: CheckIcon,
    bgColor: "bg-[#3FB62F]",
  },
  unresolved: {
    icon: ArrowRight,
    bgColor: "bg-destructive",
  },
  escalated: {
    icon: ArrowUp,
    bgColor: "bg-yellow-500",
  },
}

export const ConversationStatusIcon = ({
  status,
  className,
}: conversationStatusIconProps) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 xl:p-2",
        config.bgColor,
        className
      )}
    >
      <Icon className="size-3 stroke-3 text-white" />
    </div>
  )
}
