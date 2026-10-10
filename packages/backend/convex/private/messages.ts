import { ConvexError, v } from "convex/values"
import { action, mutation, query } from "../_generated/server"
import { components } from "../_generated/api"
import { supportAgent } from "../system/ai/agent/supportAgent"
import { paginationOptsValidator } from "convex/server"
import { saveMessage } from "@convex-dev/agent"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export const create = mutation({
  args: {
    prompt: v.string(),
    conversationId: v.id("conversations"),
  },
  /*
   * This function will be used by the widget user right so the widget user will attempt
   * to create a new message so we have to verify their contact session.
   */
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      })
    }

    const orgId = (identity?.o as { id?: string })?.id ?? ""
    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      })
    }

    const conversation = await ctx.db.get(args.conversationId)

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

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid Organization Id",
      })
    }

    await saveMessage(ctx, components.agent, {
      threadId: conversation.threadId,
      // TODO : check if "agentName" is needed or not
      agentName: identity.familyName,
      message: {
        role: "assistant",
        content: args.prompt,
      },
    })
  },
})

export const getMany = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      })
    }

    const orgId = (identity?.o as { id?: string })?.id ?? ""
    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      })
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
      .unique()

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      })
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid Organization Id",
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

// enchanceResponse method help the operators to enhance or paraphrase their messaages
export const enhanceResponse = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      })
    }

    const orgId = (identity?.o as { id?: string })?.id ?? ""
    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      })
    }

    const response = await generateText({
      model: google.chat("gemini-3.1-flash-lite"),
      messages: [
        {
          role: "system",
          content:
            "You refine customer support chat drafts into professional, clear, and helpful messages in balance length.\n\n- Preserve Intent: Retain all facts, steps, and technical details. Do not add or remove information.\n- Tone & Quality: Make the message polite, professional, and empathetic. Fix grammar and typos.\n- Output Constraint: Output ONLY the enhanced message. No explanations, quotes, or introductory text.",
        },
        {
          role: "user",
          content: args.prompt,
        },
      ],
    })
    return response.text
  },
})
