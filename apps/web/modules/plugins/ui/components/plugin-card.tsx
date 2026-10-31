import { Button } from "@workspace/ui/components/button"
import { ArrowLeftRightIcon, LucideIcon, PlugIcon } from "lucide-react"
import Image from "next/image"
import React from "react"

export interface Feature {
  icon: LucideIcon
  label: string
  description: string
}

interface PluginCardProps {
  isDisabled?: boolean
  serviceName: string
  serviceImage: string
  features: Feature[]
  onSubmit: () => void
}

const PluginCard = ({
  isDisabled,
  serviceName,
  serviceImage,
  features,
  onSubmit,
}: PluginCardProps) => {
  return (
    <div className="h-fit w-full rounded-lg border bg-background p-8">
      <div className="mb-6 flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <Image
            className="rounded object-contain"
            alt={serviceName}
            src={serviceImage}
            height={40}
            width={40}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <ArrowLeftRightIcon />
        </div>

        <div className="flex flex-col items-center">
          <Image
            className="rounded object-contain"
            alt="Platform"
            src="/logo.svg"
            height={40}
            width={40}
          />
        </div>
      </div>

      <div className="mb-8 text-center">
        <p className="text-lg">Connect your {serviceName} account</p>
      </div>

      <div className="mb-6">
        <div className="space-y-4">
          {features.map((feature) => (
            <div className="flex items-center gap-3" key={feature.label}>
              <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
                <feature.icon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{feature.label}</div>
                <div className="text-sm text-muted-foreground">
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center">
        <Button
          className="size-full py-2"
          disabled={isDisabled}
          onClick={onSubmit}
          variant="default"
        >
          Connect
          <PlugIcon />
        </Button>
      </div>
    </div>
  )
}

export default PluginCard
