import React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { ConversationsPanel } from "../components/conversations-panel"

const ConversationsLayout = ({ children }: { children: React.ReactNode }) => {
  /* it is just a resizable component which has currently 2 sections (just uses shadcn resizable component reference) */
  return (
    <ResizablePanelGroup className="h-full flex-1" orientation="horizontal">
      <ResizablePanel defaultSize="30%" maxSize="30%" minSize="20%">
        <ConversationsPanel />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel className="h-full" defaultSize="70%">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default ConversationsLayout
