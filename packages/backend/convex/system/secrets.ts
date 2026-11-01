import { ConvexError, v } from "convex/values"
import { internalAction } from "../_generated/server"
import { upsertSecret } from "../lib/secret"
import { internal } from "../_generated/api" 

/**
 * Objective: Internal action to persist encrypted credentials to AWS Secrets Manager
 * and record the plugin status in Convex DB.
 *
 * Flow:
 * 1. Build the deterministic secret name `tenant/${organizationId}/${service}` for idempotency.
 * 2. Send secret credentials to AWS Secrets Manager via upsertSecret.
 *    If AWS fails, log securely and throw a sanitized ConvexError.
 * 3. On AWS success, record the plugin and secret reference in the Convex database.
 * 4. Return success upon full completion.
 */
export const upsert = internalAction({
  args: {
    organizationId: v.string(),
    service: v.union(v.literal("vapi")),
    value: v.object({
      publicApiKey: v.string(),
      privateApiKey: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Deterministic secret name: tenant/1234/vapi ensures safe retries via upsert
    const secretName = `tenant/${args.organizationId}/${args.service}`

    // 1. Store credentials in AWS Secrets Manager
    try {
      await upsertSecret(secretName, args.value)
    } catch (err) {
      console.error(`Failed to upsert secret ${secretName}`, err)
      throw new ConvexError({
        code: "SECRET_UPSERT_FAILED",
        message: "Failed to store secret credentials",
      })
    }

    // 2. Persist plugin state to internal Convex database
    await ctx.runMutation(internal.system.plugins.upsert, {
      service: args.service,
      secretName,
      organizationId: args.organizationId,
    })

    return { status: "success" }
  },
})
