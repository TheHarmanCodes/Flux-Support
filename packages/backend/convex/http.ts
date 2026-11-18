import { Webhook } from "svix"
import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { createClerkClient } from "@clerk/backend"
import type { WebhookEvent } from "@clerk/backend"
import { internal } from "./_generated/api"

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
})

const http = httpRouter()

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request)

    if (!event) {
      return new Response("Invalid webhook signature", { status: 400 })
    }

    switch (event.type) {
      case "subscription.updated": {
        const subscription = event.data as {
          status: string
          payer?: {
            organization_id?: string
            user_id?: string
          }
        }
        const organizationId = subscription.payer?.organization_id

        if (!organizationId) {
          console.warn(
            "Subscription event received without organization ID, skipping"
          )
          return new Response(null, { status: 200 })
        }

        try {
          const newMaxAllowedMemberships =
            subscription.status === "active" ? 5 : 1

          await clerkClient.organizations.updateOrganization(organizationId, {
            maxAllowedMemberships: newMaxAllowedMemberships,
          })

          await ctx.runMutation(internal.system.subscriptions.upsert, {
            organizationId,
            status: subscription.status,
          })
        } catch (error) {
          console.error(
            `Failed to process ${event.type} for organization ${organizationId}:`,
            error
          )
        }

        break
      }
      default:
        console.log("Ignored Clerk webhook event", event.type)
    }

    return new Response(null, { status: 200 })
  }),
})

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable")
    return null
  }

  const payloadString = await req.text()
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") || "",
    "svix-timestamp": req.headers.get("svix-timestamp") || "",
    "svix-signature": req.headers.get("svix-signature") || "",
  }

  try {
    const wh = new Webhook(webhookSecret)
    wh.verify(payloadString, svixHeaders)
    return JSON.parse(payloadString) as unknown as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook event:", err)
    return null
  }
}

export default http
