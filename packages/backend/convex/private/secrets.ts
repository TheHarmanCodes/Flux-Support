import { ConvexError, v } from "convex/values"
import { action } from "../_generated/server"
import { internal } from "../_generated/api"

/**
 * Objective: Securely store organization plugin secrets in external AWS Secrets Manager
 * and update the internal plugin status in Convex DB without reporting premature success.
 *
 * Flow:
 * 1. Authenticate the caller and verify their active organization ID.
 * 2. Validate the secret payload specific to the requested service (e.g., Vapi API keys).
 * 3. Await the external AWS Secrets Manager write and internal DB update in the request path
 *    via internal.system.secrets.upsert.
 * 4. Propagate any AWS or DB failure directly to the client (VapiPluginForm) so that errors
 *    can be displayed without closing the modal or showing a false success toast.
 */
export const upsert = action({
  args: {
    service: v.union(v.literal("vapi")),
    value: v.object({
      publicApiKey: v.string(),
      privateApiKey: v.string(),
    }),
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

    // TODO: CHECK FOR SUBSCRIPTIONS

    // Await the secret upsert in the request path (AWS write + DB plugin update)
    // rather than fire-and-forget scheduling, ensuring the client receives true success or failure.
    await ctx.runAction(internal.system.secrets.upsert, {
      service: args.service,
      organizationId: orgId,
      value: args.value,
    })

    return { status: "success" }
  },
})
