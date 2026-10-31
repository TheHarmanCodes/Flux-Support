import { v } from "convex/values"
import { internalAction } from "../_generated/server"
import { upsertSecret } from "../lib/secret"
import { internal } from "../_generated/api"

export const upsert = internalAction({
  args: {
    organizationId: v.string(),
    service: v.union(v.literal("vapi")),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    // tenant/1234/vapi
    const secretName = `tenant/${args.organizationId}/${args.service}`

    // we send secretName & value to aws secret manager
    await upsertSecret(secretName, args.value)

    // saving to internal convex database
    await ctx.runMutation(internal.system.plugins.upsert, {
      service: args.service,
      secretName,
      organizationId: args.organizationId,
    })

    return { status: "success" }
  },
})
