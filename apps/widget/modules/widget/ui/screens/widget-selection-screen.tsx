"use client"

import { useAtomValue, useSetAtom } from "jotai"
import WidgetHeader from "@/modules/widget/ui/components/widget-header"
import { Button } from "@workspace/ui/components/button"
import { ChevronRightIcon, MessageSquareTextIcon } from "lucide-react"
import {
  contactSessionIdAtomFamily,
  conversationIdAtom,
  errorMessageAtom,
  organizationIdAtom,
  screenAtom,
} from "../../atoms/widget-atoms"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { useState } from "react"
import { WidgetFooter } from "../components/widget-footer"

/**
 * Selection screen displayed after successful organization and session initialization.
 * Allows the user to choose an action, such as initiating a new support chat conversation.
 */
export const WidgetSelectionScreen = () => {
  const setScreen = useSetAtom(screenAtom)
  const setErrorMessage = useSetAtom(errorMessageAtom)
  const setConversationIdAtom = useSetAtom(conversationIdAtom)
  const organizationId = useAtomValue(organizationIdAtom)
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  )

  const createConversation = useMutation(api.public.conversations.create)
  const [isPending, setIsPending] = useState(false)

  /**
   * Handles starting a new conversation:
   * 1. Verifies that the organization ID is present (navigates to error screen if missing).
   * 2. Checks for an active contact session (redirects to auth screen if absent).
   * 3. Calls the Convex mutation to create a new conversation in the database.
   * 4. Stores the returned conversation ID in `conversationIdAtom` and switches to the "chat" screen.
   * 5. If creation fails (e.g., expired session), fallback navigates to the "auth" screen.
   */
  const handleNewConversation = async () => {
    if (!organizationId) {
      setScreen("error")
      setErrorMessage("Missing Organization Id")
      return
    }

    if (!contactSessionId) {
      setScreen("auth")
      return
    }
    setIsPending(true)
    try {
      const conversationId = await createConversation({
        contactSessionId,
        organizationId,
      })
      setConversationIdAtom(conversationId)
      setScreen("chat")
    } catch {
      setScreen("auth")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">Hi there! 👋</p>
          <p className="text-lg">Let&apos;s get you started?</p>
        </div>
      </WidgetHeader>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-y-4 overflow-y-auto p-4">
        <Button
          className="h-16 w-full justify-between"
          variant="outline"
          onClick={handleNewConversation}
          disabled={isPending}
        >
          <div className="flex items-center gap-x-2">
            <MessageSquareTextIcon />
            <span>Start chat</span>
          </div>
          <ChevronRightIcon />
        </Button>
      </div>
      <WidgetFooter />
    </>
  )
}
