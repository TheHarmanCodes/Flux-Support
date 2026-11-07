import { v } from "convex/values"
import { action } from "../_generated/server"
import { internal } from "../_generated/api"
import { getSecretValue, parseSecretString } from "../lib/secret"

export const getVapiSecrets = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: args.organizationId,
        service: "vapi",
      }
    )
    if (!plugin) {
      return null
    }

    const secretName = plugin.secretName

    // retriving secret from aws using secret name
    const secret = await getSecretValue(secretName)

    const secretData = parseSecretString<{
      publicApiKey: string
    }>(secret)

    if (!secretData || !secretData?.publicApiKey) {
      return null
    }

    return {
      publicApiKey: secretData.publicApiKey,
    }
  },
})
