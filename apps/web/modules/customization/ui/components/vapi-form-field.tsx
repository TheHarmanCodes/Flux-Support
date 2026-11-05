import React from "react"
import { Controller, UseFormReturn } from "react-hook-form"
import {
  useVapiAssistant,
  useVapiPhoneNumbers,
} from "@/modules/plugins/hooks/use-vapi-data"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { FormSchema } from "../../types"

interface VapiFormFieldsProps {
  form: UseFormReturn<FormSchema>
}

const VapiFormFields = ({ form }: VapiFormFieldsProps) => {
  const { data: assistants, isLoading: assistantsLoading } = useVapiAssistant()
  const { data: phoneNumbers, isLoading: phoneNumberLoading } =
    useVapiPhoneNumbers()

  const disabled = form.formState.isSubmitting

  return (
    <>
      {/* Field to choose Voice Assistant */}
      <Controller
        name="vapiSettings.assistantId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="select-voice-assistant">
              Voice Assistant
            </FieldLabel>
            <Select
              id="select-voice-assistant"
              aria-invalid={fieldState.invalid}
              value={field.value}
              onValueChange={field.onChange}
              disabled={assistantsLoading || disabled}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    assistantsLoading
                      ? "Loading assistants..."
                      : "Select an assistant"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name || "Unnamed Assistant"} -{" "}
                    {assistant.model?.model || "Unknown model"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              The Vapi assistant to use for voice calls
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {/* Field to Choose Phone Number */}
      <Controller
        name="vapiSettings.phoneNumber"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="select-phone-number">
              Display Phone Number
            </FieldLabel>
            <Select
              id="select-phone-number"
              aria-invalid={fieldState.invalid}
              value={field.value}
              onValueChange={field.onChange}
              disabled={phoneNumberLoading || disabled}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    phoneNumberLoading
                      ? "Loading phone numbers..."
                      : "Select a phone number"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.id} value={phone.number || phone.id}>
                    {phone.number || "Unknown"} - {phone.name || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Phone number to display in the widget
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  )
}

export default VapiFormFields
