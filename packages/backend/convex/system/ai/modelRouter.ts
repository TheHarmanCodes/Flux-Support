import { createGroq } from "@ai-sdk/groq"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { Agent } from "@convex-dev/agent"
import { LanguageModel } from "ai"
import { components } from "../../_generated/api"
import { SUPPORT_AGENT_PROMPT } from "./constants"

// Environment variables
const GROQ_PRIMARY_API_KEY = process.env.GROQ_API_KEY
const GROQ_BACKUP_API_KEY = process.env.GROQ_BACKUP_API_KEY
const GROQ_INTERPRETER_API_KEY =
  process.env.GROQ_INTERPRETER_API_KEY || process.env.GROQ_BACKUP_API_KEY || process.env.GROQ_API_KEY

export const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY
export const GEMINI_BACKUP_API_KEY =
  process.env.GEMINI_BACKUP_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Provider instances
const primaryGroqProvider = createGroq({
  apiKey: GROQ_PRIMARY_API_KEY,
})

const backupGroqProvider = createGroq({
  apiKey: GROQ_BACKUP_API_KEY,
})

const interpreterGroqProvider = createGroq({
  apiKey: GROQ_INTERPRETER_API_KEY,
})

// Provider using GOOGLE_GENERATIVE_AI_API_KEY (for RAG embeddings & text-extraction)
export const googleGenerativeAiProvider = createGoogleGenerativeAI({
  apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
})

// Provider using GEMINI_BACKUP_API_KEY (for geminifallbackmodel agent and interpreter backup)
export const geminiBackupProvider = createGoogleGenerativeAI({
  apiKey: GEMINI_BACKUP_API_KEY,
})

// Model configurations
export const PRIMARY_GROQ_MODEL = "qwen/qwen3.8-27b"
export const BACKUP_GROQ_MODEL = "qwen/qwen3.8-27b"
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite"
export const INTERPRETER_GROQ_MODEL = "openai/gpt-oss-20b"
export const INTERPRETER_GEMINI_BACKUP_MODEL = "gemini-3.1-flash-lite"

export const getInterpreterModel = (): LanguageModel => {
  return interpreterGroqProvider(INTERPRETER_GROQ_MODEL) as LanguageModel
}

export const getInterpreterBackupModel = (): LanguageModel => {
  return geminiBackupProvider(INTERPRETER_GEMINI_BACKUP_MODEL) as LanguageModel
}

// Configured Support Agents for each fallback tier
export const primarySupportAgent: Agent = new (Agent as any)(components.agent, {
  name: "supportAgentPrimary",
  languageModel: primaryGroqProvider(PRIMARY_GROQ_MODEL),
  instructions: SUPPORT_AGENT_PROMPT,
})

export const backupSupportAgent: Agent = new (Agent as any)(components.agent, {
  name: "supportAgentBackup",
  languageModel: backupGroqProvider(BACKUP_GROQ_MODEL),
  instructions: SUPPORT_AGENT_PROMPT,
})

export const geminiSupportAgent: Agent = new (Agent as any)(components.agent, {
  name: "supportAgentGemini",
  languageModel: geminiBackupProvider(GEMINI_FALLBACK_MODEL),
  instructions: SUPPORT_AGENT_PROMPT,
})

export interface ModelTier {
  id: string
  provider: "groq" | "google"
  agent: Agent
  modelName: string
}

export const MAIN_AGENT_ROUTING_TIERS: ModelTier[] = [
  {
    id: "primary-groq",
    provider: "groq",
    agent: primarySupportAgent,
    modelName: PRIMARY_GROQ_MODEL,
  },
  {
    id: "backup-groq",
    provider: "groq",
    agent: backupSupportAgent,
    modelName: BACKUP_GROQ_MODEL,
  },
  {
    id: "tertiary-gemini",
    provider: "google",
    agent: geminiSupportAgent,
    modelName: GEMINI_FALLBACK_MODEL,
  },
]

export interface ErrorClassification {
  isRetryable: boolean
  statusCode?: number
  reason: string
}

/**
 * Classifies an error to determine whether it is transient/retryable (rate limit 429, 5xx, network timeout)
 * or non-retryable (401 auth, 400 bad request, schema error, invalid model).
 */
export function classifyError(error: unknown): ErrorClassification {
  if (!error) {
    return { isRetryable: false, reason: "Unknown error" }
  }

  const err = error as any
  const status =
    err.status ||
    err.statusCode ||
    err.response?.status ||
    err.cause?.status ||
    err.cause?.statusCode

  const message = String(err.message || err.toString() || "")
  const lowerMessage = message.toLowerCase()

  // 429 Rate limits - definitely retryable across fallback models
  if (
    status === 429 ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("429") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("quota exceeded")
  ) {
    return {
      isRetryable: true,
      statusCode: 429,
      reason: "Rate limit / Quota exceeded",
    }
  }

  // 5xx Transient server / provider errors
  if (typeof status === "number" && status >= 500 && status < 600) {
    return {
      isRetryable: true,
      statusCode: status,
      reason: `Server error (${status})`,
    }
  }

  if (
    lowerMessage.includes("503") ||
    lowerMessage.includes("500") ||
    lowerMessage.includes("502") ||
    lowerMessage.includes("504") ||
    lowerMessage.includes("service unavailable") ||
    lowerMessage.includes("bad gateway") ||
    lowerMessage.includes("gateway timeout") ||
    lowerMessage.includes("internal server error")
  ) {
    return {
      isRetryable: true,
      statusCode: status || 500,
      reason: "Transient provider server error",
    }
  }

  // Network / timeout errors
  if (
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("econnreset") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("etimedout") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("network error")
  ) {
    return { isRetryable: true, reason: "Network timeout / connection error" }
  }

  // Non-retryable: 401/403 Auth, 400 Bad Request, 404 Not Found, Invalid API Key
  if (
    status === 401 ||
    status === 403 ||
    status === 400 ||
    status === 404 ||
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("bad request") ||
    lowerMessage.includes("invalid request")
  ) {
    return {
      isRetryable: false,
      statusCode: status,
      reason: `Client or authentication error (${status || "non-retryable"})`,
    }
  }

  // Fallback: check if error is generic and potentially transient
  return {
    isRetryable: false,
    statusCode: status,
    reason: message.slice(0, 100),
  }
}
