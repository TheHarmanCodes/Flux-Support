import { useState, useEffect } from "react"
import Vapi from "@vapi-ai/web"
import { useAtomValue } from "jotai"
import { vapiSecretAtom, widgetSettingAtom } from "../atoms/widget-atoms"

interface TranscriptMessage {
  role: "user" | "assistant"
  text: string
}

export const useVapi = () => {
  const vapiSecrets = useAtomValue(vapiSecretAtom)
  const widgetSettings = useAtomValue(widgetSettingAtom)

  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])

  useEffect(() => {
    if (!vapiSecrets) {
      return
    }

    const vapiInstance = new Vapi(vapiSecrets.publicApiKey)
    setVapi(vapiInstance)

    //Event listeners
    // when call is started
    vapiInstance.on("call-start", () => {
      setIsConnected(true)
      setIsConnecting(false)
      setTranscript([])
    })

    //when call ends
    vapiInstance.on("call-end", () => {
      setIsConnected(false)
      setIsConnecting(false)
      setIsSpeaking(false)
      setTranscript([])
    })

    // Real-time conversation events
    vapiInstance.on("speech-start", () => {
      setIsSpeaking(true)
    })

    vapiInstance.on("speech-end", () => {
      setIsSpeaking(false)
    })

    // Error handling
    vapiInstance.on("error", (error) => {
      console.log("Voice widget error:", error)
      setIsConnecting(false)
    })

    vapiInstance.on("message", (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role === "user" ? "user" : "assistant",
            text: message.transcript,
          },
        ])
      }
    })

    return () => {
      vapiInstance?.stop()
    }
  }, [])

  const startCall = () => {
    if (!vapiSecrets || !widgetSettings?.vapiSettings.assistantId) {
      return
    }
    setIsConnecting(true)

    if (vapi) {
      vapi.start(widgetSettings.vapiSettings.assistantId)
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  return {
    isSpeaking,
    isConnecting,
    isConnected,
    transcript,
    startCall,
    endCall,
  }
}
