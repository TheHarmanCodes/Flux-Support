import { ConvexError, v } from "convex/values"
import { action, query } from "../_generated/server"
import { components, internal } from "../_generated/api"
import { supportAgent } from "../system/ai/agent/supportAgent"
import { paginationOptsValidator } from "convex/server"
import { escalateConversation } from "../system/ai/tools/escalateConversation"
import { resolveConversation } from "../system/ai/tools/resolveConveration"
import { saveMessage } from "@convex-dev/agent"
/*
 * action are special type of functions in convex used to query third party services
 * https://docs.convex.dev/functions/internal-functions
 */
export const create = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    contactSessionId: v.id("contactSession"),
  },
  /*
   * This function will be used by the widget user right so the widget user will attempt
   * to create a new message so we have to verify their contact session.
   */
  handler: async (ctx, args) => {
    const contactSession = await ctx.runQuery(
      internal.system.contactSession.getOne,
      {
        contactSessionId: args.contactSessionId,
      }
    )

    if (!contactSession || contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    // getting the conversations
    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      {
        threadId: args.threadId,
      }
    )
    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      })
    }
    if (conversation.status === "resolved") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Conversation resolved",
      })
    }

    // TODO: Implement subscription check
    const shouldTriggerAgent = conversation.status === "unresolved"

    if (shouldTriggerAgent) {
      await supportAgent.generateText(
        ctx,
        {
          // using this threadId the Ai agent will know the previous conversation history
          threadId: args.threadId,
        },
        {
          prompt: args.prompt,
          tools: {
            escalateConversation,
            resolveConversation,
          },
        }
      )
    } else {
      await saveMessage(ctx, components.agent, {
        threadId: args.threadId,
        prompt: args.prompt,
      })
    }
  },
})

export const getMany = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId)

    if (!contactSession || contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    /*
     * Paginated queries are queries that return a list of results in incremental pages.
     * Docx: https://docs.convex.dev/database/pagination
     */
    const paginated = await supportAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    })

    return paginated
  },
})
