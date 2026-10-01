import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { supportAgent } from "../system/ai/agent/supportAgent"
import { MessageDoc, saveMessage } from "@convex-dev/agent"
import { components } from "../_generated/api"
import { paginationOptsValidator } from "convex/server"

/**
 * Creates a new conversation for a contact session within an organization.
 *
 * Flow:
 * 1. Validates that the provided `contactSessionId` exists and has not expired.
 * 2. Initializes a conversation record in the database with "unresolved" status.
 * 3. Returns the newly created `conversationId`.
 */
export const create = mutation({
  args: {
    organizationId: v.string(),
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    // Verify that the contact session is valid and active before starting a conversation
    const session = await ctx.db.get(args.contactSessionId)
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    // convex-docx https://docs.convex.dev/agents/threads
    const { threadId } = await supportAgent.createThread(ctx, {
      userId: session.organizationId,
    })

    await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "assistant",
        // TODO: later modify the widget setting to modify initial message
        content: "Hello, How can I help you today?",
      },
    })

    // Persist conversation tied to the session and organization
    const conversationId = await ctx.db.insert("conversations", {
      threadId,
      organizationId: session.organizationId,
      contactSessionId: session._id,
      status: "unresolved",
    })
    return conversationId
  },
})

/**
 * Fetches an existing conversation after verifying session authorization.
 *
 * Flow:
 * 1. Checks that the requesting contact session is valid and not expired.
 * 2. Retrieves the conversation document by `conversationId`.
 * 3. Returns the conversation details (`_id`, `status`, `threadId`) or `null` if not found.
 */
export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    // Ensure caller has an active, valid contact session
    const session = await ctx.db.get(args.contactSessionId)
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      })
    }
    /**
     * A caller with a valid session and another conversation ID can read that conversation.
     * so we have to Authorize the conversation against the contact session.
     */
    if (conversation.contactSessionId !== session._id) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    return {
      _id: conversation._id,
      status: conversation.status,
      threadId: conversation.threadId,
    }
  },
})

// this getMany function will used to load Inbox component
export const getMany = query({
  args: {
    contactSessionId: v.id("contactSession"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId)

    if (!contactSession || contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    // load all conversations for provided contactSessionId
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_contact_session_id", (q) =>
        q.eq("contactSessionId", args.contactSessionId)
      )
      .order("desc")
      .paginate(args.paginationOpts)

    const conversationsWithLastMessage = await Promise.all(
      conversations.page.map(async (conversation) => {
        let lastMessage: MessageDoc | null = null

        // getting last message from agent
        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        })

        if (messages.page.length > 0) {
          lastMessage = messages.page[0] ?? null
        }

        return {
          _id: conversation._id,
          _creationTime: conversation._creationTime,
          status: conversation.status,
          organizationId: conversation.organizationId,
          threadId: conversation.threadId,
          lastMessage,
        }
      })
    )

    return {
      ...conversations,
      page: conversationsWithLastMessage,
    }
  },
})
