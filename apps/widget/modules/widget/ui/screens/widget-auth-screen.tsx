import React from "react"
import WidgetHeader from "@/modules/widget/ui/components/widget-header"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Doc } from "@workspace/backend/_generated/dataModel"
import { useAtomValue, useSetAtom } from "jotai"
import {
  contactSessionIdAtomFamily,
  organizationIdAtom,
  screenAtom,
} from "../../atoms/widget-atoms"

// zod validation
const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  email: z.string().trim().email({ message: "Invalid email" }),
})

export const WidgetAuthScreen = () => {
  const setScreen = useSetAtom(screenAtom)

  const organizationId = useAtomValue(organizationIdAtom)
  const setContactSessionId = useSetAtom(
    contactSessionIdAtomFamily(organizationId || "")
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  // https://docs.convex.dev/api/modules/react#usemutation
  const createContactSession = useMutation(api.public.contactSession.create)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!organizationId) {
      return
    }

    try {
      const metadata: Doc<"contactSession">["metadata"] = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(","),
        platform: navigator.platform,
        vendor: navigator.vendor,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        cookieEnabled: navigator.cookieEnabled,
        referrer: document.referrer || "direct",
        currentUrl: window.location.href,
      }

      const contactSessionId = await createContactSession({
        ...values,
        organizationId,
        metadata,
      })

      setContactSessionId(contactSessionId)
      setScreen("selection")
    } catch (err) {
      console.error("Failed to create contact session: ", err)
      // will show a decent msg to user using UI
    }
  }

  return (
    <>
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">Hi there! 👋</p>
          <p className="text-lg">Let&apos;s get you started?</p>
        </div>
      </WidgetHeader>

      <form
        className="flex flex-1 flex-col gap-y-4 p-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="widget-auth-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="widget-auth-name"
                  aria-invalid={fieldState.invalid}
                  className="h-10 bg-background"
                  placeholder="e.g. John Doe"
                  type="text"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="widget-auth-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="widget-auth-email"
                  aria-invalid={fieldState.invalid}
                  className="h-10 bg-background"
                  placeholder="e.g. john.doe@example.com"
                  type="email"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <Button disabled={form.formState.isSubmitting} size="lg" type="submit">
          Continue
        </Button>
      </form>
    </>
  )
}
