"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export const UpgradeModal = ({
  open,
  onOpenChange,
  title = "Unlock AI Message Enhancement",
  description = "Turn quick notes and rough drafts into clear, empathetic, and professional customer replies with a single click.",
}: UpgradeModalProps) => {
  const router = useRouter()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push("/billing")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-[#3b82f6]">
              <SparklesIcon className="size-3.5 fill-amber-400/20 text-amber-500" />
              Pro Feature
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight">
            {title}
          </DialogTitle>

          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Before / After Preview Card */}
        <div className="space-y-2.5 rounded-xl border bg-muted/40 p-3.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <Wand2Icon className="size-3 text-amber-500" />
            See it in action
          </div>

          <div className="space-y-2 text-xs">
            <div className="rounded-lg border border-border/50 bg-background/80 p-2.5 text-muted-foreground">
              <span className="font-semibold text-foreground/70">Draft: </span>
              &ldquo;no refund after 30 days check terms&rdquo;
            </div>

            <div className="rounded-lg border border-[#3b82f6]/20 bg-[#3b82f6]/10 p-2.5 text-foreground">
              <span className="font-semibold text-[#3b82f6]">
                <SparklesIcon className="mr-1 inline size-3.5 fill-amber-400/20 text-amber-500" />
                Enhanced:{" "}
              </span>
              &ldquo;Thank you for reaching out! While our standard policy
              doesn&apos;t allow refunds past 30 days, I&apos;d be glad to look
              into credit or alternative options for you.&rdquo;
            </div>
          </div>
        </div>

        {/* Feature Benefits */}
        <div className="space-y-2 pt-1 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
            <span>Unlimited AI prompt and tone enhancements</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
            <span>Knowledge Base RAG document training</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
            <span>Up to 5 operator seats per organization</span>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>

          <Button
            type="button"
            onClick={handleUpgrade}
            className="w-full bg-[#3b82f6] font-medium text-white shadow-sm hover:bg-[#2563eb] sm:w-auto"
          >
            Upgrade to Pro
            <ArrowRightIcon className="ml-1.5 size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
