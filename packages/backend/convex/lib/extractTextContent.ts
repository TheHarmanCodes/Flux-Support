import { google } from "@ai-sdk/google"
import { Id } from "../_generated/dataModel"
import { StorageActionWriter } from "convex/server"
import { assert } from "convex-helpers"
import { generateText } from "ai"

const AI_MODELS = {
  image: google.chat("gemini-3.5-flash-lite"),
  pdf: google.chat("gemini-3.1-flash-lite"),
  html: google.chat("gemini-3.1-flash-lite"),
} as const

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

const SYSTEM_PROMPTS = {
  image:
    "You turn images into text. If it is a photo of a document, transcribe it. If it is not a document, describe it.",
  pdf: "You transform PDF files into text.",
  html: "You transform content into markdown.",
}

export type extractTextContentArgs = {
  storageId: Id<"_storage">
  filename: string
  bytes?: ArrayBuffer
  mimeType: string
}

/**
 * extractTextContent is a function that takes in a storageId, filename, bytes, and mimeType and returns the extracted text content from the file. It uses different methods to extract text based on the mimeType of the file. If the file is an image, it uses AI to extract text from the image. If the file is a PDF, it uses AI to extract text from the PDF. If the file is a text-based file, it decodes the bytes into a string and returns it. If the mimeType is not supported, it throws an error.
 */
export const extractTextContent = async (
  ctx: { storage: StorageActionWriter },
  args: extractTextContentArgs
): Promise<string> => {
  const { storageId, filename, bytes, mimeType } = args

  const url = await ctx.storage.getUrl(storageId)
  assert(url, "Failed to get storage URL")

  // handling image files
  if (SUPPORTED_IMAGE_TYPES.some((type) => type === mimeType)) {
    return extractImageText(url)
  }

  // handling pdf files
  if (mimeType.toLowerCase().includes("pdf")) {
    return extractPdfText(url, mimeType, filename)
  }

  // handle all other text based files
  if (mimeType.toLowerCase().includes("text")) {
    return extractTextFileContent(ctx, storageId, bytes, mimeType)
  }

  throw new Error("Unsupported MIME type : " + mimeType)
}

// here we will extract the text from the image
const extractImageText = async (url: string): Promise<string> => {
  const result = await generateText({
    model: AI_MODELS.image,
    system: SYSTEM_PROMPTS.image,
    messages: [
      {
        role: "user",
        content: [{ type: "image", image: new URL(url) }],
      },
    ],
  })

  return result.text
}

// here we will extract the text content from pdf files
const extractPdfText = async (
  url: string,
  mimeType: string,
  filename: string
): Promise<string> => {
  const result = await generateText({
    model: AI_MODELS.pdf,
    system: SYSTEM_PROMPTS.pdf,
    messages: [
      {
        role: "user",
        content: [
          { type: "file", data: new URL(url), mediaType: mimeType, filename },
          {
            type: "text",
            text: "Extract the text from the PDF and print it without explaining you'll do so.",
          },
        ],
      },
    ],
  })

  return result.text
}

/**
 * extractTextFileContent is a function that extracts text content from text-based files or uses AI to extract text from non-text files.
 * @param ctx - The context object containing storage actions
 * @param storageId - The ID of the storage location
 * @param bytes - The bytes of the file
 * @param mimeType - The MIME type of the file
 * @returns A promise resolving to the extracted text content
 */

const extractTextFileContent = async (
  ctx: { storage: StorageActionWriter },
  storageId: Id<"_storage">,
  bytes: ArrayBuffer | undefined,
  mimeType: string
): Promise<string> => {
  // if we get bytes, we can use them directly, otherwise we need to fetch the bytes from storage
  const arrayBuffer =
    bytes || (await (await ctx.storage.get(storageId))?.arrayBuffer())

  if (!arrayBuffer) {
    throw new Error("Failed to get file bytes from storage")
  }

  // decode the bytes into a string using TextDecoder
  const text = new TextDecoder().decode(arrayBuffer)

  if (mimeType.toLowerCase() !== "text/plain") {
    // if the mime type is not text/plain, we can use AI to extract the text content
    const result = await generateText({
      model: AI_MODELS.html,
      system: SYSTEM_PROMPTS.html,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            {
              type: "text",
              text: "Extract the text and print it in markdown format without explaining you'll do so.",
            },
          ],
        },
      ],
    })
    return result.text
  }

  return text
}
