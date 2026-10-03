import { v } from "convex/values"
import { mutation } from "../_generated/server"

// 24 hours in milliseconds
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),
    metadata: v
      .object({
        userAgent: v.string().optional(),
        language: v.string().optional(),
        languages: v.string().optional(),
        platform: v.string().optional(),
        vendor: v.string().optional(),
        screenResolution: v.string().optional(),
        viewportSize: v.string().optional(),
        timezone: v.string().optional(),
        timezoneOffset: v.number().optional(),
        cookieEnabled: v.boolean().optional(),
        referrer: v.string().optional(),
        currentUrl: v.string().optional(),
      })
      .optional(),
  },
  handler: async (ctx, args) => {
    // Sanitize inputs
    const sanitizedName = args.name.trim()
    const sanitizedEmail = args.name.trim()

    const now = Date.now()
    const expiresAt = now + SESSION_DURATION_MS

    const contactSessionId = await ctx.db.insert("contactSession", {
      name: sanitizedName,
      email: sanitizedEmail,
      organizationId: args.organizationId,
      metadata: args.metadata,
      expiresAt,
    })
    return contactSessionId
  },
})

export const validate = mutation({
  args: {
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId)
    if (!contactSession) {
      return { valid: false, reason: "Contact session not found" }
    }

    if (contactSession.expiresAt < Date.now()) {
      return { valid: false, reason: "Contact session expired" }
    }

    return { valid: true, contactSession }
  },
})
