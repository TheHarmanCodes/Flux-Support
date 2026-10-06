"use client"
import React from "react"
import { Id } from "@workspace/backend/_generated/dataModel"
import { api } from "@workspace/backend/_generated/api"
import { useMutation, useQuery } from "convex/react"
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

const formSchema = z.object({
  message: z.string().min(1, "Message is required."),
})

const ConversationIdView = ({
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

  return (
    <div className="flex h-full flex-col bg-muted">
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        <Button size="sm" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
      </header>

      <AIConversation className="max-h-[calc(100vh-180px)]">
        <AIConversationContent>
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
        {/* <Form {...form}>

        </Form> */}

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
                <AIInputButton>
                  <Wand2Icon />
                  Enhance
                </AIInputButton>
              </AIInputTools>
              <AIInputSubmit
                disabled={
                  conversation?.status === "resolved" ||
                  !form.formState.isValid ||
                  form.formState.isSubmitting
                  // OR if is enhancing prompt
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

export default ConversationIdView
