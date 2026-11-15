import { v } from "convex/values"
import { internalMutation, internalQuery } from "../_generated/server"

// upsert a subscription for an organization, creating it if it doesn't exist or updating the status if it does
export const upsert = internalMutation({
  args: {
    organizationId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if a subscription already exists for the organization
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique()

    if (existingSubscription) {
      await ctx.db.patch(existingSubscription._id, {
        status: args.status,
      })
    } else {
      await ctx.db.insert("subscriptions", {
        organizationId: args.organizationId,
        status: args.status,
      })
    }
  },
})

export const getByOrganizationId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch the subscription for the given organization
    return await await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique()
  },
})
