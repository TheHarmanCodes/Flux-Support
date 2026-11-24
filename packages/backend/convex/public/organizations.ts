import { createClerkClient } from "@clerk/backend"
import { v } from "convex/values"
import { action } from "../_generated/server"

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is not set")
}

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export const validate = action({
  args: {
    // organization: validate functions take single argument that is orgId
    organizationId: v.string(),
  },
  handler: async (_, args) => {
    try {
      await clerkClient.organizations.getOrganization({
        organizationId: args.organizationId,
      })
      return { valid: true }
    } catch (err) {
      if (
        (typeof err === "object" &&
          err !== null &&
          "status" in err &&
          err.status === 404) ||
        (typeof err === "object" &&
          err !== null &&
          "errors" in err &&
          Array.isArray(err.errors) &&
          err.errors.some((e) => e?.code === "resource_not_found"))
      ) {
        return { valid: false, reason: "Organization not valid" }
      }
      throw err
    }
  },
})
