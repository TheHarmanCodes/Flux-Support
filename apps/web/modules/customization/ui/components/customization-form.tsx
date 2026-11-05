import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js"
import { api } from "@workspace/backend/_generated/api"
import { Doc } from "@workspace/backend/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation } from "convex/react"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"
import VapiFormFields from "./vapi-form-field"
import { FormSchema } from "../../types"
import { widgetSettingsSchema } from "../../schemas"

type WidgetSettings = Doc<"widgetSettings">

interface CustomizationFormProps {
  initialData?: WidgetSettings | null
  hasVapiPlugin: boolean
}

export const CustomizationForm = ({
  initialData,
  hasVapiPlugin,
}: CustomizationFormProps) => {
  const upsertWidgetSettings = useMutation(api.private.widgetSettings.upsert)

  const form = useForm<FormSchema>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues: {
      greetMessage:
        initialData?.greetMessage || "Hi! How can I help you today?",
      defaultSuggestions: {
        suggestion1: initialData?.defaultSuggestions?.suggestion1 || "",
        suggestion2: initialData?.defaultSuggestions?.suggestion2 || "",
        suggestion3: initialData?.defaultSuggestions?.suggestion3 || "",
      },
      vapiSettings: {
        assistantId: initialData?.vapiSettings?.assistantId || "",
        phoneNumber: initialData?.vapiSettings?.phoneNumber || "",
      },
    },
  })

  const onSubmit = async (values: FormSchema) => {
    try {
      const vapiSettings: WidgetSettings["vapiSettings"] = {
        assistantId:
          values.vapiSettings.assistantId === "none"
            ? ""
            : values.vapiSettings.assistantId,
        phoneNumber:
          values.vapiSettings.phoneNumber === "none"
            ? ""
            : values.vapiSettings.phoneNumber,
      }

      await upsertWidgetSettings({
        greetMessage: values.greetMessage,
        defaultSuggestions: values.defaultSuggestions,
        vapiSettings,
      })
      toast.success("Widget settings updated successfully!", {
        position: "top-center",
      })
    } catch (err) {
      console.error("Error updating widget settings:", err)
      toast.error("Failed to update widget settings. Please try again.", {
        position: "top-center",
      })
    }
  }
  return (
    <form
      id="customization-form"
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Card>
        <CardHeader>
          <CardTitle>General Chat Settings</CardTitle>
          <CardDescription>
            Configure basic chat widget behaviour and messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            name="greetMessage"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="text-area-greet-message">
                  Greeting Message
                </FieldLabel>
                <Textarea
                  {...field}
                  id="text-area-greet-message"
                  aria-invalid={fieldState.invalid}
                  placeholder="Welcome message shown when chat open"
                />
                <FieldDescription>
                  The First message your customers will see when they open the
                  chat widget.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-sm">Default Suggestions</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Quick reply suggestions shown to customers to help guide the
                conversation
              </p>

              <div className="space-y-4">
                <Controller
                  name="defaultSuggestions.suggestion1"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="input-suggestion-1">
                        Suggestion 1
                      </FieldLabel>
                      <Input
                        {...field}
                        id="input-suggestion-1"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g., How do I get started?"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="defaultSuggestions.suggestion2"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="input-suggestion-2">
                        Suggestion 2
                      </FieldLabel>
                      <Input
                        {...field}
                        id="input-suggestion-2"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g., What are your pricing plans?"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="defaultSuggestions.suggestion3"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="input-suggestion-3">
                        Suggestion 3
                      </FieldLabel>
                      <Input
                        {...field}
                        id="input-suggestion-3"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g., I need help with my account"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasVapiPlugin && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Assistant Settings</CardTitle>
            <CardDescription>
              Configure Voice calling features powered by Vapi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VapiFormFields form={form} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={form.formState.isSubmitting} type="submit">
          Save Settings
        </Button>
      </div>
    </form>
  )
}
