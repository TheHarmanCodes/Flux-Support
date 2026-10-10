import { components } from "../../../_generated/api"
import { Agent } from "@convex-dev/agent"
import { google } from "@ai-sdk/google"

export const supportAgent = new Agent(components.agent, {
  chat: google.chat("gemini-3.5-flash-lite"),
  instructions: `You are a customer support agent. Use "resolveConversation" tool when user expresses finalisation of conversation. Use "escalateConversation" tool when user expresses frustration, or request a human explicitly.`,
})
