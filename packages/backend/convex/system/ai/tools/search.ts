import { createTool } from "@convex-dev/agent"
import z from "zod"
import { generateText, Output } from "ai"
import { internal } from "../../../_generated/api"
import rag from "../rag"
import { SEARCH_INTERPRETER_PROMPT } from "../constants"
import {
  getInterpreterModel,
  getInterpreterBackupModel,
  classifyError,
} from "../modelRouter"

export const SearchInterpretationSchema = z.object({
  status: z.enum(["ANSWER_FOUND", "PARTIAL_ANSWER", "NOT_FOUND"]),
  answer: z.string().describe("The concise extracted answer or explanation"),
  missingInformation: z
    .array(z.string())
    .optional()
    .describe("List of details that were requested but missing from evidence"),
})

export type SearchInterpretation = z.infer<typeof SearchInterpretationSchema>

export const NO_RELEVANT_INFO_FALLBACK =
  "I couldn't find specific information about that in our knowledge base. Would you like me to connect you with a human support agent who can help?"

export const search: any = createTool({
  description:
    "Searches the knowledge base for relevant information based on a user's query and provides context to the support agent.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The specific question to search for in the knowledge base"),
  }),
  execute: async (ctx, args) => {
    if (!ctx.threadId) {
      return JSON.stringify({
        status: "SEARCH_ERROR",
        message: "Missing Thread ID",
      })
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId: ctx.threadId }
    )

    if (!conversation) {
      return JSON.stringify({
        status: "SEARCH_ERROR",
        message: "Conversation not found",
      })
    }

    let searchResult
    try {
      searchResult = await rag.search(ctx, {
        namespace: conversation.organizationId,
        query: args.query,
        limit: 5,
      })
    } catch (ragError) {
      const classification = classifyError(ragError)
      console.error("RAG search failed:", {
        reason: classification.reason,
        statusCode: classification.statusCode,
      })
      return JSON.stringify({
        status: "RAG_SERVICE_UNAVAILABLE",
        message:
          "Unable to query the knowledge base due to a service error. Offer human support to the customer.",
      })
    }

    const context = searchResult?.text?.trim()
    const resultCount = searchResult?.entries?.length ?? (context ? 1 : 0)

    if (!context) {
      return JSON.stringify({
        status: "NOT_FOUND",
        answer: NO_RELEVANT_INFO_FALLBACK,
      })
    }

    // Two-stage RAG: run dedicated interpreter model to extract compact, validated facts
    const runInterpreter = async (model: any, isBackup: boolean = false) => {
      const { output: interpretation, usage } = await generateText({
        model,
        output: Output.object({ schema: SearchInterpretationSchema }),
        system: SEARCH_INTERPRETER_PROMPT,
        prompt: `User Question: "${args.query}"\n\nRetrieved Knowledge Base Evidence:\n${context.slice(0, 4000)}`,
      })

      // Minimal structured diagnostic log
      if (usage) {
        const usageAny = usage as any
        console.log("Interpreter diagnostics:", {
          status: interpretation.status,
          ragResultCount: resultCount,
          isBackupModel: isBackup,
          inputTokens: usageAny.inputTokens ?? usageAny.promptTokens,
          outputTokens: usageAny.outputTokens ?? usageAny.completionTokens,
        })
      }

      if (interpretation.status === "NOT_FOUND" && !interpretation.answer) {
        interpretation.answer = NO_RELEVANT_INFO_FALLBACK
      }

      return interpretation
    }

    try {
      const interpreterModel = getInterpreterModel()
      const interpretation = await runInterpreter(interpreterModel, false)
      return JSON.stringify(interpretation)
    } catch (interpreterError) {
      const classification = classifyError(interpreterError)
      console.error("Search interpreter primary Groq model failed:", {
        reason: classification.reason,
        isRetryable: classification.isRetryable,
        statusCode: classification.statusCode,
      })

      // Fall back to backup Gemini interpreter model
      try {
        console.log("Falling back to backup Gemini interpreter model (gemini-3.1-flash-lite)...")
        const backupModel = getInterpreterBackupModel()
        const backupInterpretation = await runInterpreter(backupModel, true)
        return JSON.stringify(backupInterpretation)
      } catch (backupError) {
        const backupClassification = classifyError(backupError)
        console.error("Search interpreter backup Gemini model failed:", {
          reason: backupClassification.reason,
          isRetryable: backupClassification.isRetryable,
          statusCode: backupClassification.statusCode,
        })
      }

      // Safe bounded fallback if both interpreter attempts fail: return a bounded excerpt without overwhelming main agent
      const boundedContext = context.slice(0, 1000)
      return JSON.stringify({
        status: "PARTIAL_ANSWER",
        answer: `Direct knowledge base excerpt: ${boundedContext}`,
        missingInformation: ["Interpreter unavailable; bounded raw evidence provided"],
      })
    }
  },
})
