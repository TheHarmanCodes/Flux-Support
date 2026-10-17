import { components } from "../../../_generated/api"
import { Agent } from "@convex-dev/agent"
import { groq } from "@ai-sdk/groq"

export const supportAgent: Agent = new (Agent as any)(components.agent, {
  name: "supportAgent",
  languageModel: groq("qwen/qwen3.8-27b"),
  instructions: `You are a customer support agent. Use "resolveConversation" tool when user expresses finalisation of conversation. Use "escalateConversation" tool when user expresses frustration, or request a human explicitly.`,
})
