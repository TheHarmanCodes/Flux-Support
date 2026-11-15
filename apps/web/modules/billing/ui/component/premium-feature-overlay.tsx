"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  BookOpenIcon,
  BotIcon,
  GemIcon,
  LucideIcon,
  MicIcon,
  PaletteIcon,
  PhoneIcon,
  UsersIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"

interface Feature {
  icon: LucideIcon
  label: string
  description: string
}

interface PremiumFeatureOverlayProps {
  children: React.ReactNode
}

const features: Feature[] = [
  {
    icon: BotIcon,
    label: "AI Customer Support",
    description: "Intelligent automated responses 24/7",
  },
  {
    icon: MicIcon,
    label: "AI Voice Agent",
    description: "Natural voice conversations with customers",
  },
  {
    icon: PhoneIcon,
    label: "Phone System",
    description: "Inbound & outbound calling capabilities",
  },
  {
    icon: BookOpenIcon,
    label: "Knowledge Base",
    description: "Train AI on your documentation",
  },
  {
    icon: UsersIcon,
    label: "Team Access",
    description: "Up to 5 operators per organization",
  },
  {
    icon: PaletteIcon,
    label: "Widget Customization",
    description: "Customize your chat widget appearance",
  },
]

const PremiumFeatureOverlay = ({ children }: PremiumFeatureOverlayProps) => {
  const router = useRouter()

  return (
    <div className="relative h-dvh min-h-screen">
      {/* Scrollable background content */}
      <div className="absolute inset-0 overflow-y-auto blur-[2px] select-none">
        {children}
      </div>

      {/* Background blur and darkening */}
      <div className="pointer-events-none absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px]" />

      {/* upgrade */}
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <Card className="pointer-events-auto my-auto w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full">
                <GemIcon className="size-6 text-muted-foreground" />
              </div>
            </div>

            <CardTitle className="text-xl">Premium Feature</CardTitle>

            <CardDescription>
              This Feature requires a Pro subscription
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-2 space-y-6">
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
                    <feature.icon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={() => router.push("/billing")}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PremiumFeatureOverlay
