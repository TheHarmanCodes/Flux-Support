import { RAG } from "@convex-dev/rag"
import { components } from "../../_generated/api"
import { googleGenerativeAiProvider } from "./modelRouter"

const rag = new RAG(components.rag, {
  textEmbeddingModel: googleGenerativeAiProvider.embedding("gemini-embedding-001"),
  embeddingDimension: 3072,
})

export default rag
