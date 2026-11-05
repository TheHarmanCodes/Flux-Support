import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"

export const upsert = mutation({
  args: {
    greetMessage: v.string(),
    defaultSuggestions: v.object({
      suggestion1: v.string().optional(),
      suggestion2: v.string().optional(),
      suggestion3: v.string().optional(),
    }),
    vapiSettings: v.object({
      assistantId: v.string().optional(),
      phoneNumber: v.string().optional(),
    }),
  },
  handler: async (ctx, args) => {
    // Confirm that the user is logged in and has an active organization ID
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

    const existingWidgetSettings = await ctx.db
      .query("widgetSettings")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique()

    if (existingWidgetSettings) {
      await ctx.db.patch(existingWidgetSettings._id, {
        greetMessage: args.greetMessage,
        defaultSuggestions: args.defaultSuggestions,
        vapiSettings: args.vapiSettings,
      })
    } else {
      await ctx.db.insert("widgetSettings", {
        organizationId: orgId,
        greetMessage: args.greetMessage,
        defaultSuggestions: args.defaultSuggestions,
        vapiSettings: args.vapiSettings,
      })
    }
  },
})

export const getOne = query({
  args: {},
  handler: async (ctx) => {
    // Confirm that the user is logged in and has an active organization ID
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

    const widgetSettings = await ctx.db
      .query("widgetSettings")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique()

    return widgetSettings
  },
})
