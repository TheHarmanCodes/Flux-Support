import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Stores support conversations linked to an organization and a contact session
  conversations: defineTable({
    threadId: v.string(), // Identifier for the external messaging thread (e.g., chat engine / AI thread)
    organizationId: v.string(), // Tenant / organization scope for multi-tenant isolation
    contactSessionId: v.id("contactSession"), // References the active contact session of the user
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved")
    ), // Current lifecycle state of the conversation
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_contact_session_id", ["contactSessionId"])
    .index("by_thread_id", ["threadId"])
    .index("by_status_and_organization_id", ["status", "organizationId"]),

  // defining contactSession table
  contactSession: defineTable({
    name: v.string(),
    email: v.string(),
    organizationId: v.string(),
    expiresAt: v.number(),
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
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_expires_at", ["expiresAt"]),

  users: defineTable({
    name: v.string(),
  }),
})
