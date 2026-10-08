"use client"
import React, { useState } from "react"
import { Id } from "@workspace/backend/_generated/dataModel"
import { api } from "@workspace/backend/_generated/api"
import { useAction, useMutation, useQuery } from "convex/react"
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { MoreHorizontalIcon, Wand2Icon } from "lucide-react"
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation"
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message"
import { AIResponse } from "@workspace/ui/components/ai/response"
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar"
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input"
import { Field, FieldError, FieldGroup } from "@workspace/ui/components/field"
import ConversationStatusButton from "../components/conversation-status-button"
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll"
import InfiniteScrollTrigger from "@workspace/ui/components/infinite-scroll-trigger"
import { cn } from "@workspace/ui/lib/utils"
import { Skeleton } from "@workspace/ui/components/skeleton"

const formSchema = z.object({
  message: z.string().min(1, "Message is required."),
})

export const ConversationIdView = ({
  conversationId,
}: {
  conversationId: Id<"conversations">
}) => {
  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  })

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 10 }
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })

  const { topElementRef, handleLoadMore, canLoadMore, isLoadingMore } =
    useInfiniteScroll({
      status: messages.status,
      loadMore: messages.loadMore,
      loadSize: 10, // last 10 chats will be loaded
    })

  const [isEnhancing, setIsEnhancing] = useState(false)
  const enhanceResponse = useAction(api.private.messages.enhanceResponse)
  const handleEnhanceResponse = async () => {
    setIsEnhancing(true)
    const currentValue = form.getValues("message")

    try {
      const response = await enhanceResponse({ prompt: currentValue })

      form.setValue("message", response)
    } catch (err) {
      console.error(err)
      //TODO : add toast later on
    } finally {
      setIsEnhancing(false)
    }
  }

  const createMessage = useMutation(api.private.messages.create)

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await createMessage({
        conversationId,
        prompt: data.message,
      })

      form.reset()
    } catch (error) {
      console.error(error)
      // TODO: Add a toast
    }
  }

  // State to prevent unexpected calls to change conversation.status
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const updateConversationStatus = useMutation(
    api.private.conversations.updateStatus
  )
  const handleToggleStatus = async () => {
    if (!conversation) {
      return
    }
    setIsUpdatingStatus(true)

    let newStatus: "unresolved" | "resolved" | "escalated"

    /* cycle through states: unresolved -> escalated -> resolved -> unresolved */
    if (conversation.status === "unresolved") {
      newStatus = "escalated"
    } else if (conversation.status === "escalated") {
      newStatus = "resolved"
    } else {
      newStatus = "unresolved"
    }

    try {
      updateConversationStatus({
        conversationId,
        status: newStatus,
      })
    } catch (err) {
      console.error(err)
      // TODO: add a toast later on
    } finally {
      setIsUpdatingStatus(false)
    }
  }
  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />
  }
  return (
    <div className="flex h-full flex-col bg-muted">
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        <Button size="sm" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
        <div>
          {!!conversation && (
            <ConversationStatusButton
              onClick={handleToggleStatus}
              status={conversation.status}
              disabled={isUpdatingStatus}
            />
          )}
        </div>
      </header>

      <AIConversation className="max-h-[calc(100vh-180px)]">
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />
          {toUIMessages(messages.results ?? [])?.map((message) => (
            //In reverse, because we are watching from "assistant" perspective
            <AIMessage
              from={message.role === "user" ? "assistant" : "user"}
              key={message.id}
            >
              <AIMessageContent>
                <AIResponse>{message.content}</AIResponse>
              </AIMessageContent>
              {message.role === "user" && (
                <DicebearAvatar
                  seed={conversation?.contactSession._id ?? ""}
                  size={32}
                />
              )}
            </AIMessage>
          ))}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      <div className="p-2">
        <AIInput onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="message"
              control={form.control}
              disabled={conversation?.status === "resolved"}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <AIInputTextarea
                    disabled={
                      conversation?.status === "resolved" ||
                      form.formState.isSubmitting
                      // TODO: or If enhancing prompt
                    }
                    onChange={field.onChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        form.handleSubmit(onSubmit)()
                      }
                    }}
                    placeholder={
                      conversation?.status === "resolved"
                        ? "This conversation has been resolved"
                        : "Type your response as an operator"
                    }
                    value={field.value}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <AIInputToolbar>
              <AIInputTools>
                <AIInputButton
                  disabled={
                    conversation?.status === "resolved" ||
                    isEnhancing ||
                    !form.formState.isValid
                  }
                  onClick={handleEnhanceResponse}
                >
                  <Wand2Icon />
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </AIInputButton>
              </AIInputTools>
              <AIInputSubmit
                disabled={
                  conversation?.status === "resolved" ||
                  !form.formState.isValid ||
                  form.formState.isSubmitting ||
                  isEnhancing
                }
                status="ready"
                type="submit"
              />
            </AIInputToolbar>
          </FieldGroup>
        </AIInput>
      </div>
    </div>
  )
}

export const ConversationIdViewLoading = () => {
  return (
    <div className="flex h-full flex-col bg-muted">
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        <Button disabled size="sm" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
      </header>
      <AIConversation className="max-h-[calc(100vh-180px)]">
        <AIConversationContent>
          {Array.from({ length: 8 }, (_, index) => {
            const isUser = index % 2 === 0
            const widths = ["w-48", "w-60", "w-72"]
            const width = widths[index % widths.length]

            return (
              <div
                key={index}
                className={cn(
                  "group flex w-full items-end justify-end gap-2 py-2 [&>div]:max-w-[80%]",
                  isUser ? "is-user" : "is-assistant flex-row-reverse"
                )}
              >
                <Skeleton
                  className={`h-9 ${width} rounded-lg bg-neutral-200`}
                />
                <Skeleton className={`$ size-8 rounded-full bg-neutral-200`} />
              </div>
            )
          })}
        </AIConversationContent>
      </AIConversation>
      <div className="p-2">
        <AIInput>
          <AIInputTextarea
            disabled
            placeholder="Type your response as an operator..."
          />
          <AIInputToolbar>
            <AIInputTools />
            <AIInputSubmit disabled status="ready" />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  )
}
