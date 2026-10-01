"use client"
import React from "react"
import { useAtomValue } from "jotai"
import { WidgetAuthScreen } from "@/modules/widget/ui/screens/widget-auth-screen"
import { screenAtom } from "@/modules/widget/atoms/widget-atoms"
import { WidgetErrorScreen } from "@/modules/widget/ui/screens/widget-error-screen"
import { WidgetLoadingScreen } from "@/modules/widget/ui/screens/widget-loading-screen"
import { WidgetSelectionScreen } from "@/modules/widget/ui/screens/widget-selection-screen"
import { WidgetChatScreen } from "../screens/widget-chat-screen"
import { WidgetInboxScreen } from "../screens/widget-inbox-screen"

interface Props {
  organizationId: string
}

export const WidgetView = ({ organizationId }: Props) => {
  // Subscribes this view to route changes. When another component writes to
  // `screenAtom`, Jotai re-renders this view with the matching screen below.
  const screen = useAtomValue(screenAtom)

  // This is the router's route-to-screen registry. Add a screen here when a
  // new value is added to `WIDGET_SCREEN`; placeholder entries mark routes
  // whose UI has not been implemented yet.
  const screenComponents = {
    error: <WidgetErrorScreen />,
    loading: <WidgetLoadingScreen organizationId={organizationId} />,
    selection: <WidgetSelectionScreen />,
    voice: <p>TODO: Voice</p>,
    auth: <WidgetAuthScreen />,
    inbox: <WidgetInboxScreen />,
    chat: <WidgetChatScreen />,
    contact: <p>TODO: Contact</p>,
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden rounded-xl border bg-muted">
      {/* Renders only the component selected by the current Jotai route. */}
      {screenComponents[screen]}
    </main>
  )
}
