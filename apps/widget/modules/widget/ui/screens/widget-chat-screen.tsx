"use client"

import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react"
import WidgetHeader from "@/modules/widget/ui/components/widget-header"
import { Button } from "@workspace/ui/components/button"
import { useAtomValue, useSetAtom } from "jotai"
import { ArrowLeftIcon, MenuIcon } from "lucide-react"
import {
  contactSessionIdAtomFamily,
  conversationIdAtom,
  organizationIdAtom,
  screenAtom,
} from "../../atoms/widget-atoms"
import { useAction, useQuery } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AIConversation,
  AIConversationContent,
} from "@workspace/ui/components/ai/conversation"
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message"
import { AIResponse } from "@workspace/ui/components/ai/response"
import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input"
import { FormField } from "@workspace/ui/components/form"
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll"
import InfiniteScrollTrigger from "@workspace/ui/components/infinite-scroll-trigger"
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar"

const formSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
})

/**
 * Chat screen that renders the active conversation view.
 *
 * Flow:
 * 1. Reads `conversationId`, `organizationId`, and `contactSessionId` from Jotai atoms.
 * 2. Fetches conversation data using the `getOne` query when both IDs are present.
 * 3. Provides a back button to reset active conversation state and return to the selection screen.
 */
export const WidgetChatScreen = () => {
  const setScreen = useSetAtom(screenAtom)
  const setConversationId = useSetAtom(conversationIdAtom)

  const conversationId = useAtomValue(conversationIdAtom)
  const organizationId = useAtomValue(organizationIdAtom)
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  )

  const onBack = () => {
    setConversationId(null)
    setScreen("selection")
  }

  /* it loads the conversations if client have a valid session */
  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? {
          conversationId,
          contactSessionId,
        }
      : "skip"
  )
  // useThread Messages is a hook that fetches messages from a thread.
  const messages = useThreadMessages(
    api.public.messages.getMany,
    conversation?.threadId && contactSessionId
      ? { threadId: conversation.threadId, contactSessionId }
      : "skip",
    {
      initialNumItems: 10,
    }
  )

  const { topElementRef, handleLoadMore, canLoadMore, isLoadingMore } =
    useInfiniteScroll({
      status: messages.status,
      loadMore: messages.loadMore,
      loadSize: 10,
    })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      message: "",
    },
  })

  const createMessage = useAction(api.public.messages.create)
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!conversation || !contactSessionId) {
      return
    }

    await createMessage({
      threadId: conversation.threadId,
      prompt: values.message,
      contactSessionId,
    })
    form.reset()
  }

  return (
    <>
      <WidgetHeader className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button size="icon" variant="transparent" onClick={onBack}>
            <ArrowLeftIcon />
          </Button>
          <p>Chat</p>
        </div>
        <Button size="icon" variant="transparent">
          <MenuIcon />
        </Button>
      </WidgetHeader>

      <AIConversation>
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />
          {/* toUIMessages is a helper function that transforms MessageDocs into AI SDK "UIMessage"s.
           This is a convenient data model for displaying messages. */}
          {toUIMessages(messages.results ?? [])?.map((msg) => {
            return (
              <AIMessage
                from={msg.role === "user" ? "user" : "assistant"}
                key={msg.id}
              >
                <AIMessageContent>
                  <AIResponse>{msg.content}</AIResponse>
                </AIMessageContent>
                {msg.role === "assistant" && (
                  <DicebearAvatar
                    imageUrl="/logo.svg"
                    seed="assistant"
                    size={32}
                  />
                )}
              </AIMessage>
            )
          })}
        </AIConversationContent>
      </AIConversation>
      {/* TODO: Add suggestions later on */}

      <AIInput
        className="absolute inset-x-0 bottom-0 rounded-none border-x-0 border-b-0"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          disabled={
            conversation?.status === "resolved" || form.formState.isSubmitting
          }
          name="message"
          render={({ field }) => (
            <AIInputTextarea
              disabled={conversation?.status === "resolved"}
              onChange={field.onChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)()
                }
              }}
              placeholder={
                conversation?.status === "resolved"
                  ? "This conversation has been resolved."
                  : "Type your message..."
              }
              value={field.value}
            />
          )}
        />
        <AIInputToolbar>
          <AIInputTools />
          <AIInputSubmit
            disabled={
              conversation?.status === "resolved" ||
              form.formState.isSubmitting ||
              !form.formState.isValid
            }
            status={form.formState.isSubmitting ? "submitted" : "ready"}
            type="submit"
          />
        </AIInputToolbar>
      </AIInput>
    </>
  )
}
