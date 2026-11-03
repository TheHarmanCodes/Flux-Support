"use client"
import React, { useState } from "react"
import PluginCard, { Feature } from "../components/plugin-card"
import {
  GlobeIcon,
  PhoneCallIcon,
  PhoneIcon,
  WorkflowIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"
import { useAction, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { api } from "@workspace/backend/_generated/api"
import z from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { VapiConnectedView } from "../components/vapi-connected-view"
import { Id } from "@workspace/backend/_generated/dataModel"

const vapiFeatures: Feature[] = [
  {
    icon: GlobeIcon,
    label: "Web voice calls",
    description: "Voice chat directly in your app",
  },
  {
    icon: PhoneIcon,
    label: "Phone numbers",
    description: "Get dedicated business lines",
  },
  {
    icon: PhoneCallIcon,
    label: "Outbond calls",
    description: "Automated customer outreach",
  },
  {
    icon: WorkflowIcon,
    label: "Workflows",
    description: "Custom conversation flows",
  },
]

const formSchema = z.object({
  publicApiKey: z.string().min(1, "Public API key is required"),
  privateApiKey: z.string().min(1, "Private API key is required"),
})

const VapiPluginForm = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  // Use action instead of mutation so the external AWS Secrets Manager write
  // and Convex database update are awaited before returning to the UI.
  const upsertSecret = useAction(api.private.secrets.upsert)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicApiKey: "",
      privateApiKey: "",
    },
  })

  /**
   * Objective: Submit credentials, keeping the dialog open and disabling buttons
   * until AWS Secrets Manager and Convex DB operations complete.
   *
   * Flow:
   * - During execution: isSubmitting is true -> button shows "Connecting...", prevents double submit.
   * - On failure (AWS or DB): dialog stays open, form inputs remain preserved, error toast shown.
   * - On success: dialog closes, form resets, success toast shown.
   */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await upsertSecret({
        service: "vapi",
        value: {
          publicApiKey: values.publicApiKey,
          privateApiKey: values.privateApiKey,
        },
      })
      // Only close and reset when the write has truly completed successfully
      setOpen(false)
      form.reset()
      toast.success("Vapi plugin enabled")
    } catch (err) {
      console.error("Failed to enable Vapi plugin:", err)
      // Keep dialog open and fields intact so user can fix or retry without re-typing.
      let message = "Failed to store secret credentials"
      if (
        err instanceof ConvexError &&
        typeof err.data === "object" &&
        err.data !== null
      ) {
        message = (err.data as { message?: string }).message || message
      } else if (err instanceof Error && err.message) {
        message = err.message
      }
      toast.error(message)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">Enable Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Your API keys are safely encrypted and stored using AWS Secrets
          Manager
        </DialogDescription>

        <form
          className="flex flex-col gap-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FieldGroup>
              <Controller
                name="publicApiKey"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="public-api-key">
                      Public API key
                    </FieldLabel>

                    <div className="relative">
                      <Input
                        {...field}
                        id="public-api-key"
                        aria-invalid={fieldState.invalid}
                        placeholder="Your public API key"
                        autoComplete="off"
                        type={showPublicKey ? "text" : "password"}
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPublicKey((prev) => !prev)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPublicKey
                            ? "Hide public API key"
                            : "Show public API key"
                        }
                      >
                        {showPublicKey ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="privateApiKey"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="private-api-key">
                      Private API key
                    </FieldLabel>

                    <div className="relative">
                      <Input
                        {...field}
                        id="private-api-key"
                        aria-invalid={fieldState.invalid}
                        placeholder="Your private API key"
                        autoComplete="off"
                        type={showPrivateKey ? "text" : "password"}
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPrivateKey((prev) => !prev)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPrivateKey
                            ? "Hide private API key"
                            : "Show private API key"
                        }
                      >
                        {showPrivateKey ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button disabled={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Connecting..." : "Connect"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const VapiPluginRemoveForm = ({
  open,
  setOpen,
  pluginId,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  pluginId: Id<"plugins"> | null
}) => {
  const removePlugin = useMutation(api.private.plugins.remove)
  const [isRemoving, setIsRemoving] = useState(false)

  const onSubmit = async () => {
    if (isRemoving) return
    setIsRemoving(true)
    if (!pluginId) return
    try {
      await removePlugin({
        service: "vapi",
        pluginId,
      })
      setOpen(false)
      toast.success("Vapi plugin removed")
    } catch (err) {
      console.error("Failed to remove Vapi plugin:", err)
      toast.error("Something went wrong.\nFailed to remove Vapi Plugin")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">Disconnect Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to disconnect the Vapi plugin?
        </DialogDescription>
        <DialogFooter>
          <Button
            disabled={isRemoving}
            onClick={onSubmit}
            variant="destructive"
          >
            {isRemoving ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const VapiView = () => {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" })

  const [connectOpen, setConnectOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removePluginId, setRemovePluginId] = useState<Id<"plugins"> | null>(
    null
  )

  const toggleConnection = () => {
    if (vapiPlugin) {
      setRemovePluginId(vapiPlugin._id)
      setRemoveOpen(true)
    } else {
      setConnectOpen(true)
    }
  }

  return (
    <>
      <VapiPluginForm open={connectOpen} setOpen={setConnectOpen} />
      {/* <VapiPluginRemoveForm open={removeOpen} setOpen={setRemoveOpen} /> */}
      <VapiPluginRemoveForm
        open={removeOpen}
        setOpen={setRemoveOpen}
        pluginId={removePluginId}
      />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Vapi Plugin</h1>
            <p className="text-muted-foreground">
              Connect Vapi to enable AI voice calls and phone support
            </p>
          </div>

          <div className="mt-8">
            {vapiPlugin ? (
              <VapiConnectedView onDisconnect={toggleConnection} />
            ) : (
              <PluginCard
                serviceImage="/vapi.svg"
                serviceName="Vapi"
                features={vapiFeatures}
                isDisabled={vapiPlugin === undefined}
                onSubmit={toggleConnection}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
