"use client"

import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { BotIcon } from "lucide-react"
import { useVapiAssistant } from "../../hooks/use-vapi-data"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

const VapiAssistantsTab = () => {
  const { data: assistants, isLoading } = useVapiAssistant()

  return (
    <div className="border-t bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-4">Assistant</TableHead>
            <TableHead className="px-6 py-4">Model</TableHead>
            <TableHead className="px-6 py-4">First Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(() => {
            if (isLoading) {
              return (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Loading assistants...
                  </TableCell>
                </TableRow>
              )
            }

            if (!assistants || assistants.length === 0) {
              return (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No phone numbers configured
                  </TableCell>
                </TableRow>
              )
            }

            return assistants.map((assistant) => (
              <TableRow className="hover:bg-muted/50" key={assistant.id}>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <BotIcon className="size-4 text-muted-foreground" />
                    <span>{assistant.name || "Unnamed assistant"}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className="text-sm">
                    {assistant.model?.model || "Not configured"}
                  </span>
                </TableCell>
                <TableCell className="max-w-sm px-6 py-4">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <p className="cursor-help truncate text-sm text-muted-foreground">
                          {assistant.firstMessage || "No greeting configured"}
                        </p>
                      }
                    />

                    <TooltipContent
                      side="top"
                      align="end"
                      className="max-w-sm rounded-lg border bg-popover px-3 py-2.5 text-sm leading-relaxed wrap-break-word whitespace-normal text-popover-foreground shadow-lg"
                    >
                      {assistant.firstMessage || "No greeting configured"}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          })()}
        </TableBody>
      </Table>
    </div>
  )
}

export default VapiAssistantsTab
