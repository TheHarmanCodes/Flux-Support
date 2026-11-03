import type { FunctionReturnType } from "convex/server"
import { api } from "@workspace/backend/_generated/api"
import { useEffect, useState } from "react"
import { useAction } from "convex/react"
import { toast } from "sonner"

type PhoneNumbers = FunctionReturnType<typeof api.private.vapi.getPhoneNumbers>
type Assistant = FunctionReturnType<typeof api.private.vapi.getAssistants>

export const useVapiPhoneNumbers = (): {
  data: PhoneNumbers
  isLoading: boolean
  error: Error | null
} => {
  const [data, setData] = useState<PhoneNumbers>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const getPhoneNumbers = useAction(api.private.vapi.getPhoneNumbers)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getPhoneNumbers()
        if (cancelled) return
        setData(result)
        setError(null)
      } catch (err) {
        if (cancelled) return

        setError(err as Error)
        toast.error("Failed to fetch phone numbers")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, error }
}

export const useVapiAssistant = (): {
  data: Assistant
  isLoading: boolean
  error: Error | null
} => {
  const [data, setData] = useState<Assistant>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const getAssistants = useAction(api.private.vapi.getAssistants)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const result = await getAssistants()
        if (cancelled) return
        setData(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err as Error)
        toast.error("Failed to fetch assistants")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, error }
}
