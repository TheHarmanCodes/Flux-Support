import { ConvexError, v } from "convex/values"
import { action, mutation } from "../_generated/server"
import {
  contentHashFromArrayBuffer,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
  vEntry,
} from "@convex-dev/rag"
import { extractTextContent } from "../lib/extractTextContent"
import rag from "../system/ai/rag"
import { Id } from "../_generated/dataModel"

// here we guess the mime type of the file based on its extension or its contents.
// If we can't guess it, we default to application/octet-stream
const guessMimeType = (filename: string, bytes: ArrayBuffer): string => {
  return (
    guessMimeTypeFromExtension(filename) ||
    guessMimeTypeFromContents(bytes) ||
    "application/octet-stream"
  )
}

/*
 * This addFile action at first extracts the text content from the file and then adds it to the RAG index.
 * It also stores the file in Convex storage and returns the URL to access it.
 */
export const addFile = action({
  args: {
    filename: v.string(),
    mimeType: v.optional(v.string()),
    bytes: v.bytes(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const { bytes, filename, category } = args

    // Guess the mime type if not provided
    const mimeType = args.mimeType || guessMimeType(filename, bytes)
    const blob = new Blob([bytes], { type: mimeType })
    // Store the file in Convex storage
    const storageId = await ctx.storage.store(blob)

    // extract the text from uploaded file
    const text = await extractTextContent(ctx, {
      storageId,
      filename,
      bytes,
      mimeType,
    })

    const { entryId, created } = await rag.add(ctx, {
      // SUPER IMPOPORTANT: What search space to add the file to. You cannot search across namespaces,
      // If not added, it will be considered global. (we don't want this)
      namespace: orgId,
      text,
      key: filename,
      title: filename,
      metadata: {
        storageId,
        uploadedBy: orgId,
        filename,
        category: category ?? null,
      },
      contentHash: await contentHashFromArrayBuffer(bytes), // To avoid re-insert if the file content hasn't changed
    })
    // If the entry already exists, we can delete the uploaded file from storage to save space
    if (!created) {
      console.debug("Entry already exists, skipping upload metadata")
      await ctx.storage.delete(storageId)
      return { url: null, entryId }
    }

    return {
      url: await ctx.storage.getUrl(storageId),
      entryId,
    }
  },
})

export const deleteFile = mutation({
  args: {
    entryId: vEntry,
  },
  handler: async (ctx, args) => {
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

    const namespace = await rag.getNamespace(ctx, {
      namespace: orgId,
    })

    if (!namespace) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid namespace",
      })
    }

    const entry = await rag.getEntry(ctx, {
      entryId: args.entryId.entryId,
    })

    if (!entry) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Entry not found",
      })
    }

    if (entry.metadata?.uploadedBy !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid organization ID",
      })
    }

    // Delete the 'file' from Convex storage if it exists
    if (entry.metadata?.storageId) {
      await ctx.storage.delete(entry.metadata.storageId as Id<"_storage">)
    }

    // At last we delete the 'entry' from the RAG index
    await rag.deleteAsync(ctx, {
      entryId: args.entryId.entryId,
    })
  },
})
