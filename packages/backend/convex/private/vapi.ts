import { ConvexError } from "convex/values"
import { action } from "../_generated/server"
import { internal } from "../_generated/api"
import { getSecretValue, parseSecretString } from "../lib/secret"
import { Vapi, VapiClient } from "@vapi-ai/server-sdk"

export const getAssistants = action({
  args: {},
  handler: async (ctx): Promise<Vapi.Assistant[]> => {
    // Confirm that the user is logged in and has an active organization ID before proceeding with the action.
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

    // Retrieve the Vapi plugin saved in convex for the organization
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: orgId,
        service: "vapi",
      }
    )
    if (!plugin) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Plugin not found",
      })
    }

    const secretName = plugin.secretName
    const secretValue = await getSecretValue(secretName)
    const secretData = parseSecretString<{
      privateApiKey: string
      publicApiKey: string
    }>(secretValue)

    if (!secretData) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials not found",
      })
    }

    if (!secretData.privateApiKey || !secretData.publicApiKey) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials incomplete. Please reconnect your Vapi account.",
      })
    }

    // Initialize the Vapi client with the private API key.
    const vapiClient = new VapiClient({
      token: secretData.privateApiKey,
    })

    try {
      // Fetch the list of assistants associated with the Vapi account
      const assistants = await vapiClient.assistants.list()

      return assistants
    } catch (err) {
      throw new ConvexError({
        code: "EXTERNAL_SERVICE_ERROR",
        message: "Failed to fetch assistants from Vapi",
      })
    }
  },
})

export const getPhoneNumbers = action({
  args: {},
  handler: async (ctx): Promise<Vapi.ListPhoneNumbersResponseItem[]> => {
    // Confirm that the user is logged in and has an active organization ID before proceeding with the action.
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

    // Retrieve the Vapi plugin saved in convex for the organization
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      {
        organizationId: orgId,
        service: "vapi",
      }
    )
    if (!plugin) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Plugin not found",
      })
    }

    const secretName = plugin.secretName
    const secretValue = await getSecretValue(secretName)
    const secretData = parseSecretString<{
      privateApiKey: string
      publicApiKey: string
    }>(secretValue)

    if (!secretData) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials not found",
      })
    }

    if (!secretData.privateApiKey || !secretData.publicApiKey) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credentials incomplete. Please reconnect your Vapi account.",
      })
    }

    // Initialize the Vapi client with the private API key.
    const vapiClient = new VapiClient({
      token: secretData.privateApiKey,
    })
    try {
      // Fetch the list of phone numbers associated with the Vapi account
      const phoneNumbers = await vapiClient.phoneNumbers.list()

      return phoneNumbers
    } catch (err) {
      throw new ConvexError({
        code: "EXTERNAL_SERVICE_ERROR",
        message: "Failed to fetch phone numbers from Vapi",
      })
    }
  },
})
