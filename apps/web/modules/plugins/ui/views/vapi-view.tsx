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
import { useMutation, useQuery } from "convex/react"
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
  const upsertSecret = useMutation(api.private.secrets.upsert)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicApiKey: "",
      privateApiKey: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await upsertSecret({
        service: "vapi",
        value: {
          publicApiKey: values.publicApiKey,
          privateApiKey: values.privateApiKey,
        },
      })
      setOpen(false)
      toast.success("Vapi secret created")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="min-w-lg">
        <DialogHeader>
          <DialogTitle>Enable Vapi</DialogTitle>
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

export const VapiView = () => {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" })

  const [connectOpen, setConnectOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  const handleSubmit = () => {
    setConnectOpen(true)
  }

  return (
    <>
      <VapiPluginForm open={connectOpen} setOpen={setConnectOpen} />
      <div className="flex min-h-screen flex-col bg-muted p-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl">Vapi Plugin</h1>
            <p className="text-muted-foreground">
              Connect Vapi to enable AI voice calls and phone support
            </p>
          </div>

          <div className="mt-8">
            <PluginCard
              serviceImage="/vapi.svg"
              serviceName="Vapi"
              features={vapiFeatures}
              isDisabled={vapiPlugin === undefined}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    </>
  )
}
