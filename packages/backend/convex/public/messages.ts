import { ConvexError, v } from "convex/values"
import { action, query } from "../_generated/server"
import { components, internal } from "../_generated/api"
import { supportAgent } from "../system/ai/agent/supportAgent"
import { paginationOptsValidator } from "convex/server"
import { escalateConversation } from "../system/ai/tools/escalateConversation"
import { resolveConversation } from "../system/ai/tools/resolveConveration"
import { saveMessage, stepCountIs } from "@convex-dev/agent"
import { search } from "../system/ai/tools/search"
import {
  MAIN_AGENT_ROUTING_TIERS,
  classifyError,
} from "../system/ai/modelRouter"

export const create = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.runQuery(
      internal.system.contactSession.getOne,
      {
        contactSessionId: args.contactSessionId,
      }
    )

    if (!contactSession || contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      {
        threadId: args.threadId,
      }
    )
    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      })
    }
    if (conversation.status === "resolved") {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Conversation resolved",
      })
    }

    const shouldTriggerAgent = conversation.status === "unresolved"

    if (shouldTriggerAgent) {
      let lastError: unknown = null
      let executedSuccessfully = false

      for (let i = 0; i < MAIN_AGENT_ROUTING_TIERS.length; i++) {
        const tier = MAIN_AGENT_ROUTING_TIERS[i]
        if (!tier) continue

        // Check if previous attempt already caused state mutations (e.g. escalated or resolved)
        // If state changed, do NOT re-run tools or retry from scratch to avoid duplicate side effects.
        if (i > 0) {
          const currentConv = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: args.threadId }
          )
          if (currentConv && currentConv.status !== "unresolved") {
            console.log("Conversation state changed during previous attempt; aborting further retries to avoid duplicating side effects.", {
              currentStatus: currentConv.status,
            })
            return
          }
        }

        try {
          const result = await tier.agent.generateText(
            ctx,
            {
              threadId: args.threadId,
            },
            {
              prompt: args.prompt,
              tools: {
                escalateConversationTool: escalateConversation,
                resolveConversationTool: resolveConversation,
                searchTool: search,
              },
              stopWhen: stepCountIs(3),
            }
          )

          // Structured diagnostics logging
          const usageAny = result.usage as any
          console.log("Agent generation succeeded:", {
            tierId: tier.id,
            provider: tier.provider,
            model: tier.modelName,
            fallbackOccurred: i > 0,
            attemptNumber: i + 1,
            steps: result.steps?.length ?? 0,
            usage: usageAny
              ? {
                  inputTokens: usageAny.inputTokens ?? usageAny.promptTokens,
                  outputTokens: usageAny.outputTokens ?? usageAny.completionTokens,
                }
              : undefined,
          })

          executedSuccessfully = true
          break
        } catch (error) {
          lastError = error
          const classification = classifyError(error)

          console.error(`Agent generation failed on tier ${tier.id} (${tier.modelName}):`, {
            reason: classification.reason,
            statusCode: classification.statusCode,
            isRetryable: classification.isRetryable,
            attempt: i + 1,
            totalTiers: MAIN_AGENT_ROUTING_TIERS.length,
          })

          // If the error is non-retryable (e.g. invalid auth, bad request), do not cycle models indiscriminately
          if (!classification.isRetryable) {
            console.error("Non-retryable error encountered; stopping fallback routing.")
            break
          }

          // If retryable and there are more tiers, log fallback event and proceed to next tier
          if (i + 1 < MAIN_AGENT_ROUTING_TIERS.length) {
            const nextTier = MAIN_AGENT_ROUTING_TIERS[i + 1]
            if (nextTier) {
              console.log(`Falling back from ${tier.id} to ${nextTier.id} due to: ${classification.reason}`)
            }
          }
        }
      }

      if (!executedSuccessfully) {
        // Fallback exhausted or non-retryable error occurred
        console.error("All agent fallback tiers failed or terminated with error.")
        throw lastError
      }
    } else {
      await saveMessage(ctx, components.agent, {
        threadId: args.threadId,
        prompt: args.prompt,
      })
    }
  },
})

export const getMany = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId)

    if (!contactSession || contactSession.expiresAt < Date.now()) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid session",
      })
    }

    const paginated = await supportAgent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    })

    return paginated
  },
})
