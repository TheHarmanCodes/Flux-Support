import { ConvexError, v } from "convex/values"
import { internalMutation, internalQuery } from "../_generated/server"
import { AUTO_REFRESH_THRESHOLD_MS, SESSION_DURATION_MS } from "../constant"

/* This function will be allowed to read from your Convex database. It will not be accessible from the client. */
export const getOne = internalQuery({
  args: {
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactSessionId)
  },
})

/*
 * This referesh function takes contactSessionId and checks if the current session expires within the next 4 hours.
 * If it does, it will extend the session by 24 hours. If not, it will return the current session without extending it.
 */
export const refresh = internalMutation({
  args: {
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId)

    if (!contactSession) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contact session not found",
      })
    }

    if (contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Contact session expired",
      })
    }

    // Calculate the time remaining until the session expires
    const timeRemaining = contactSession.expiresAt - Date.now()

    // If the session is set to expire within the next 4 hours, extend it by 24 hours
    if (timeRemaining < AUTO_REFRESH_THRESHOLD_MS) {
      const newExpiresAt = Date.now() + SESSION_DURATION_MS
      await ctx.db.patch(args.contactSessionId, {
        expiresAt: newExpiresAt,
      })

      return { ...contactSession, expiresAt: newExpiresAt }
    }

    // If the session is not set to expire within the next 4 hours, return the current session without extending it
    return contactSession
  },
})
