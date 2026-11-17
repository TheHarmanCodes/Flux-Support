import { query } from "../_generated/server"

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { hasActiveSubscription: false, status: null }
    }

    const orgId = (identity?.o as { id?: string })?.id ?? ""
    if (!orgId) {
      return { hasActiveSubscription: false, status: null }
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique()

    return {
      hasActiveSubscription: subscription?.status === "active",
      status: subscription?.status ?? null,
    }
  },
})
