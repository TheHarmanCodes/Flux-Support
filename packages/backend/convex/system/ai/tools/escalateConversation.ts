import { createTool } from "@convex-dev/agent"
import { internal } from "../../../_generated/api"
import { z } from "zod"

export const escalateConversation: any = createTool({
  description: "Escalate a conversation to a human operator",
  inputSchema: z.object({}),
  execute: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID"
    }

    await ctx.runMutation(internal.system.conversations.escalate, {
      threadId: ctx.threadId,
    })

    return "Conversation escalated to a human operator."
  },
})
