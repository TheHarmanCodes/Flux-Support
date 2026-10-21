"use client"

import { useAction } from "convex/react"
import { useState } from "react"

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

export const UploadDialog = ({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadDialogProps) => {
  const addFile = useAction(api.private.files.addFile)

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    category: "",
    filename: "",
  })

  const handleFileDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]

    if (file) {
      setUploadedFiles([file])
      if (!uploadForm.filename) {
        setUploadForm((prev) => ({ ...prev, filename: file.name }))
      }
    }
  }

  const handleUpload = async () => {
    setIsUploading(true)
    try {
      const blob = uploadedFiles[0]

      if (!blob) {
        return
      }

      const filename = uploadForm.filename || blob.name

      await addFile({
        // Convert the file to an ArrayBuffer for upload
        // This is necessary because the backend expects the file data in this format
        bytes: await blob.arrayBuffer(),
        filename,
        // MIME type e.g., "application/pdf", "text/plain", etc.
        mimeType: blob.type || "text/plain",
        // category is a user-defined string to categorize the uploaded file, e.g., "Documentation", "Support", etc.
        category: uploadForm.category,
      })

      onFileUploaded?.()
      handleCancle()
    } catch (err) {
      console.error("Error uploading file:", err)
      // Todo: Add a toast notification for error feedback
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancle = () => {
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
            onClick={handleCancle}
            variant="outline"
          >
            Cancle
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
