"use client"

import { api } from "@workspace/backend/_generated/api"
import { PublicFile } from "@workspace/backend/private/files"
import { Button } from "@workspace/ui/components/button"
import { Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"

interface DeleteFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: PublicFile | null
  onDelete: () => void
}

export const DeleteFileDialog = ({
  open,
  onOpenChange,
  file,
  onDelete,
}: DeleteFileDialogProps) => {
  const deletefile = useMutation(api.private.files.deleteFile)

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!file) return

    setIsDeleting(true)
    try {
      await deletefile({ entryId: file.id })
      toast.success("File deleted successfully")
      onDelete?.()
      onOpenChange(false)
    } catch (err) {
      console.error("Error deleting file:", err)
      toast.error("Failed to delete file")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-bold">Delete File</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the file? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {file && (
          <div className="py-4">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              Type: {file.type.toUpperCase()} | Size: {file.size}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={isDeleting}
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting || !file}
            variant="destructive"
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
