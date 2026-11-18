"use client"

import { useAction, useQuery } from "convex/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConvexError } from "convex/values"
import { SparklesIcon } from "lucide-react"

import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@workspace/ui/components/dropzone"
import { api } from "@workspace/backend/_generated/api"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileUploaded?: () => void
}

/**
 * It provides a ui for uploading a file to the knowledge base. It allows users to select a file, specify a category and an optional filename, and then upload the file to the backend. The component manages the state of the uploaded files, the upload form, and the uploading process. */
export const UploadDialog = ({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadDialogProps) => {
  const router = useRouter()
  const addFile = useAction(api.private.files.addFile)
  const subscriptionStatus = useQuery(api.private.subscriptions.getStatus)
  const isPro = subscriptionStatus?.hasActiveSubscription

  // State to manage the uploaded files and the upload form
  // internally uploadedFiles is an array of File objects, but we only allow one file to be uploaded at a time.
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    category: "",
    filename: "",
  })

  const handleFileDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]

    if (file) {
      const previousName = uploadedFiles[0]?.name
      setUploadedFiles([file])

      setUploadForm((prev) =>
        // it checks if the previous filename is empty or matches the previous file's name, and if so, it updates the filename to the new file's name. Otherwise, it keeps the previous filename.
        !prev.filename || prev.filename === previousName
          ? { ...prev, filename: file.name } // Update filename to new file's name
          : prev
      )
    }
  }

  const handleUpload = async () => {
    if (subscriptionStatus && !isPro) {
      toast.error("Pro Plan Required", {
        description:
          "Uploading documents to your knowledge base is only available on the Pro plan.",
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            onOpenChange(false)
            router.push("/billing")
          },
        },
        duration: 6000,
      })
      return
    }

    setIsUploading(true)
    try {
      const blob = uploadedFiles[0]

      if (!blob) {
        return
      }

      const filename = uploadForm.filename || blob.name

      await addFile({
        // MIME type e.g., "application/pdf", "text/plain", etc.
        mimeType: blob.type || undefined,
        // category is a user-defined string to categorize the uploaded file, e.g., "Documentation", "Support", etc.
        category: uploadForm.category,
        // Convert the file to an ArrayBuffer for upload
        // This is necessary because the backend expects the file data in this format
        bytes: await blob.arrayBuffer(),
        filename,
      })

      toast.success("File uploaded successfully")
      onFileUploaded?.()
      handleCancel()
    } catch (err: unknown) {
      console.error("Error uploading file:", err)

      const isSubscriptionError =
        (err instanceof ConvexError &&
          typeof err.data === "object" &&
          err.data !== null &&
          ((err.data as { code?: string }).code === "PLAN_UPGRADE_REQUIRED" ||
            (err.data as { message?: string }).message?.includes("subscription"))) ||
        (err instanceof Error && err.message.includes("subscription"))

      if (isSubscriptionError) {
        toast.error("Pro Plan Required", {
          description:
            "Uploading documents to your knowledge base is only available on the Pro plan.",
          action: {
            label: "Upgrade Plan",
            onClick: () => {
              onOpenChange(false)
              router.push("/billing")
            },
          },
          duration: 6000,
        })
      } else {
        toast.error("Failed to upload file. Please try again.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    // when onOpenChange is called with false, it will close the dialog in the parent component
    onOpenChange(false)
    setUploadedFiles([])
    // reset the upload form to its initial state when the dialog is closed
    setUploadForm({ category: "", filename: "" })
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">Upload Document</DialogTitle>
          <DialogDescription>
            Upload documents to your knowledge base for AI-powered search and
            retrieval
          </DialogDescription>
        </DialogHeader>

        {subscriptionStatus && !isPro && (
          <div className="flex items-center justify-between rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-violet-700 dark:text-violet-300">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span>
                Document upload is a <strong>Pro feature</strong>.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-violet-500/30 hover:bg-violet-500/20"
              onClick={() => {
                onOpenChange(false)
                router.push("/billing")
              }}
            >
              Upgrade
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              className="w-full"
              id="category"
              placeholder="e.g., Documentation, Support, Product"
              type="text"
              onChange={(e) =>
                setUploadForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              value={uploadForm.category}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filename">
              Filename{" "}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              className="w-full"
              id="filename"
              placeholder="Override default filename"
              type="text"
              onChange={(e) =>
                setUploadForm((prev) => ({
                  ...prev,
                  filename: e.target.value,
                }))
              }
              value={uploadForm.filename}
            />
          </div>

          <Dropzone
            accept={{
              "application/pdf": [".pdf"],
              "text/csv": [".csv"],
              "text/plain": [".txt"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
            }}
            disabled={isUploading}
            maxFiles={1}
            onDrop={handleFileDrop}
            src={uploadedFiles}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </div>

        <DialogFooter>
          <Button
            disabled={isUploading}
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              isUploading || uploadedFiles.length === 0 || !uploadForm.category
            }
            onClick={handleUpload}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
