import { createTool } from "@convex-dev/agent"
import { internal } from "../../../_generated/api"
import { z } from "zod"
import { supportAgent } from "../agent/supportAgent"

export const escalateConversation = createTool({
  description: "Escalate a conversation",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID"
    }

    await ctx.runMutation(internal.system.conversations.escalate, {
      threadId: ctx.threadId,
    })

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: "Conversation escalated to a human operator.",
      },
    })

    return "Conversation resolved"
  },
})
