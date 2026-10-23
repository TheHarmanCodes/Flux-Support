import { ConvexError, v } from "convex/values"
import { action, mutation, query, QueryCtx } from "../_generated/server"
import {
  contentHashFromArrayBuffer,
  Entry,
  EntryId,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
  vEntry,
  vEntryId,
} from "@convex-dev/rag"
import { extractTextContent } from "../lib/extractTextContent"
import rag from "../system/ai/rag"
import { Id } from "../_generated/dataModel"
import { paginationOptsValidator } from "convex/server"

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
      namespace: orgId, // namespace is the organization ID, so we can only search files that belong to the same organization
      text,
      key: filename,
      title: filename,
      metadata: {
        storageId, // Important to delete the file from storage if the entry is deleted
        uploadedBy: orgId, // Important to check if the user is allowed to delete the file
        filename,
        category: category ?? null,
      } as EntryMetadata,
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
    entryId: vEntryId,
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
      entryId: args.entryId,
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
      entryId: args.entryId,
    })
  },
})

// This query lists all the files that belong to the same organization as the user
export const list = query({
  args: {
    category: v.string().optional(),
    paginationOpts: paginationOptsValidator,
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

    // namespace is the organization ID, so we can only list files that belong to the same organization
    const namespace = await rag.getNamespace(ctx, {
      namespace: orgId,
    })

    if (!namespace) {
      return { page: [], isDone: true, continueCursor: "" }
    }
    // List the entries in the RAG index for the given namespace
    const result = await rag.list(ctx, {
      namespaceId: namespace.namespaceId,
      paginationOpts: args.paginationOpts,
    })

    // Convert the entries to PublicFile format
    const files = await Promise.all(
      result.page.map(async (entry) => convertEntryToPublicFile(ctx, entry))
    )

    const filteredFiles = args.category
      ? files.filter((file) => file.category === args.category)
      : files

    return {
      page: filteredFiles,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    }
  },
})

export type PublicFile = {
  id: EntryId
  name: string
  type: string
  size: string
  status: "ready" | "processing" | "error"
  url: string | null
  category: string | undefined
}

type EntryMetadata = {
  storageId: Id<"_storage">
  uploadedBy: string
  filename: string
  category: string | null
}
// This function converts an Entry object to a PublicFile object, which is the format we want to return to the client.
// It fetches the storage metadata to get the file size, and constructs the PublicFile object with the necessary fields.
const convertEntryToPublicFile = async (
  ctx: QueryCtx,
  entry: Entry
): Promise<PublicFile> => {
  const metadata = entry.metadata as EntryMetadata | undefined
  const storageId = metadata?.storageId

  let fileSize = "unknown"

  if (storageId) {
    try {
      const storageMetadata = await ctx.db.system.get("_storage", storageId)
      if (storageMetadata && typeof storageMetadata.size === "number") {
        fileSize = formatFileSize(storageMetadata.size)
      }
    } catch (error) {
      console.error("Error fetching storage metadata:", error)
    }
  }

  const filename = entry.key || "unknown"
  // Get the file extension from the filename, defaulting to "txt" if not found
  const extension = filename.split(".").pop()?.toLowerCase() || "txt"

  let status: "ready" | "processing" | "error" = "error"
  if (entry.status === "ready") {
    status = "ready"
  } else if (entry.status === "pending") {
    status = "processing"
  }

  const url = storageId ? await ctx.storage.getUrl(storageId) : null

  return {
    id: entry.entryId,
    name: filename,
    type: extension,
    size: fileSize,
    status,
    url,
    category: metadata?.category || undefined,
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 B"
  }

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}
