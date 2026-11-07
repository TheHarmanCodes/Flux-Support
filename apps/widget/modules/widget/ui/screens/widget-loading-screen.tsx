"use client"

import { useEffect, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"
import {
  contactSessionIdAtomFamily,
  errorMessageAtom,
  loadingMessageAtom,
  organizationIdAtom,
  screenAtom,
  vapiSecretAtom,
  widgetSettingAtom,
} from "@/modules/widget/atoms/widget-atoms"
import WidgetHeader from "@/modules/widget/ui/components/widget-header"
import { LoaderIcon } from "lucide-react"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/_generated/api"

type InitStep = "storage" | "org" | "session" | "settings" | "vapi" | "done"

export const WidgetLoadingScreen = ({
  organizationId,
}: {
  organizationId: string | null
}) => {
  const [step, setStep] = useState<InitStep>("org")
  const [sessionValid, setSessionValid] = useState(false)

  const loadingMessage = useAtomValue(loadingMessageAtom)
  const setWidgetSettings = useSetAtom(widgetSettingAtom)
  const setOrganizationId = useSetAtom(organizationIdAtom)
  const setLoadingMessage = useSetAtom(loadingMessageAtom)
  const setErrorMessage = useSetAtom(errorMessageAtom)
  const setScreen = useSetAtom(screenAtom)
  const setVapiSecrets = useSetAtom(vapiSecretAtom)

  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  )

  /* step 1: To validate the Organization */
  const validateOrganization = useAction(api.public.organizations.validate)
  useEffect(() => {
    if (step !== "org") {
      return
    }
    setLoadingMessage("Loading organization...")

    if (!organizationId) {
      setErrorMessage("Organization ID is required")
      setScreen("error")
      return
    }
    setLoadingMessage("Verifying organization...")

    validateOrganization({ organizationId })
      .then((result) => {
        if (result.valid) {
          setOrganizationId(organizationId)
          setStep("session")
        } else {
          setErrorMessage(result.reason || "Invalid configurations")
          setScreen("error")
        }
      })
      .catch(() => {
        setErrorMessage("Unable to verify organization")
        setScreen("error")
      })
  }, [
    step,
    organizationId,
    setErrorMessage,
    setScreen,
    setOrganizationId,
    setStep,
    validateOrganization,
    setLoadingMessage,
  ])

  /* step 2: Validate Session if it exists*/
  const validateContactSession = useMutation(api.public.contactSession.validate)
  useEffect(() => {
    if (step !== "session") {
      return
    }
    setLoadingMessage("Finding contact session ID...")
    if (!contactSessionId) {
      setSessionValid(false)
      setStep("settings")
      return
    }

    setLoadingMessage("Validating session...")

    validateContactSession({ contactSessionId })
      .then((result) => {
        setSessionValid(result.valid)
        setStep("settings")
      })
      .catch(() => {
        setSessionValid(false)
        setStep("settings")
      })
  }, [step, contactSessionId, validateContactSession, setLoadingMessage])

  // Step 3: Load Widget Settings
  const widgetSettings = useQuery(
    api.public.widgetSettings.getByOrganizationId,
    organizationId
      ? {
          organizationId,
        }
      : "skip"
  )
  useEffect(() => {
    if (step !== "settings") {
      return
    }

    setLoadingMessage("loading widget Settings")

    if (widgetSettings !== undefined) {
      setWidgetSettings(widgetSettings)
      setStep("vapi")
    }
  }, [step, widgetSettings, setWidgetSettings, setLoadingMessage])

  // step 4: Load Vapi secrets
  const getVapiSecrets = useAction(api.public.secrets.getVapiSecrets)
  useEffect(() => {
    if (step !== "vapi") {
      return
    }
    if (!organizationId) {
      setErrorMessage("Organization ID is required")
      setScreen("error")
      return
    }

    setLoadingMessage("Loading vapi features...")
    getVapiSecrets({ organizationId })
      .then((secrets) => {
        setVapiSecrets(secrets)
        setStep("done")
      })
      .catch(() => {
        setVapiSecrets(null)
        setStep("done")
      })
  }, [
    step,
    organizationId,
    getVapiSecrets,
    setVapiSecrets,
    setLoadingMessage,
    setStep,
    setErrorMessage,
    setScreen,
  ])

  useEffect(() => {
    if (step !== "done") {
      return
    }

    const hasValidSession = contactSessionId && sessionValid
    setScreen(hasValidSession ? "selection" : "auth")
  }, [step, contactSessionId, sessionValid, setScreen])

  return (
    <>
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">Hi there! 👋</p>
          <p className="text-lg">Let&apos;s get you started?</p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4">
        <LoaderIcon className="animate-spin" />
        {loadingMessage || "Loading..."}
      </div>
    </>
  )
}
