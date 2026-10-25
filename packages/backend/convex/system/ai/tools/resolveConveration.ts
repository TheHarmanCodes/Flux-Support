import { createTool } from "@convex-dev/agent"
import { internal } from "../../../_generated/api"
import { z } from "zod"

export const resolveConversation: any = createTool({
  description: "Mark a conversation as resolved",
  inputSchema: z.object({}),
  execute: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID"
    }

    await ctx.runMutation(internal.system.conversations.resolve, {
      threadId: ctx.threadId,
    })

    return "Conversation resolved."
  },
})
