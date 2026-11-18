"use client"

import { useOrganization } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { CopyIcon } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"
import { Separator } from "@workspace/ui/components/separator"
import { IntegrationId, INTEGRATIONS } from "../../constant"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { createScript } from "../../utils"

export const IntegrationView = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSnippet, setSelectedSnippet] = useState("")

  const { organization } = useOrganization()

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found")
      return
    }

    const snippet = createScript(integrationId, organization.id)
    setSelectedSnippet(snippet)
    setDialogOpen(true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization?.id ?? "")
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }
  return (
    <>
      <IntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={selectedSnippet}
      />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Setup & Integration</h1>
            <p className="text-muted-foreground">
              Choose the integration that&apos;s right for you
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Label className="w-34" htmlFor="organization-id">
                Organization ID
              </Label>
              <Input
                id="organization-id"
                readOnly
                value={organization?.id ?? ""}
                className="pointer-events-none flex-1 bg-background font-mono text-sm"
              />
              <Button
                className="gap-2"
                onClick={() => {
                  handleCopy()
                }}
                size="sm"
              >
                <CopyIcon className="size-4" />
                Copy
              </Button>
            </div>
          </div>

          <Separator className="my-8" />
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-lg">Integration</Label>
              <p className="text-sm text-muted-foreground">
                Add the following code to your website to enable the chatbox.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {INTEGRATIONS.map((integration) => (
                <button
                  key={integration.id}
                  className="flex items-center gap-4 rounded-lg bg-background p-4 hover:bg-accent"
                  type="button"
                  onClick={() => {
                    handleIntegrationClick(integration.id)
                  }}
                >
                  <Image
                    height={32}
                    width={32}
                    src={integration.icon}
                    alt={integration.title}
                  />
                  <p>{integration.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const IntegrationDialog = ({
  open,
  onOpenChange,
  snippet,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  snippet: string
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Integrate with your website</DialogTitle>
          <DialogDescription>
            Follow these steps to add the chatbox to your website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-4 text-sm">
              1. Copy the following code
            </div>
            <div className="group relative">
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto rounded-md bg-foreground p-2 font-mono text-sm break-all whitespace-pre-wrap text-secondary">
                {snippet}
              </pre>
              <Button
                className="absolute top-4 right-6 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  handleCopy()
                }}
                size="icon"
                variant="secondary"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              1. Copy the following code
            </div>
            <p className="text-sm text-muted-foreground">
              Paste the the chatbox code above in your page. You can add it in
              the HTML head section.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
