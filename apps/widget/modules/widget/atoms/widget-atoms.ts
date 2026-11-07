import { atom } from "jotai"
import { WidgetScreen } from "@/modules/widget/types"
import { atomWithStorage } from "jotai/utils"
import { atomFamily } from "jotai-family"
import { CONTACT_SESSION_KEY } from "../constant"
import { Doc, Id } from "@workspace/backend/_generated/dataModel"

/**
 * The widget's in-memory route. Updating this atom switches the visible screen
 * in `WidgetView`; it does not change the browser URL or trigger navigation.
 */
export const screenAtom = atom<WidgetScreen>("loading")
export const organizationIdAtom = atom<string | null>(null)

// organization scoped contact session atom
export const contactSessionIdAtomFamily = atomFamily((organizationId: string) =>
  atomWithStorage<Id<"contactSession"> | null>(
    `${CONTACT_SESSION_KEY}_${organizationId}`,
    null
  )
)
export const errorMessageAtom = atom<string | null>(null)
export const loadingMessageAtom = atom<string | null>(null)

// Holds the active conversation ID for the current chat session
export const conversationIdAtom = atom<Id<"conversations"> | null>(null)

export const widgetSettingAtom = atom<Doc<"widgetSettings"> | null>(null)

export const vapiSecretAtom = atom<{
  publicApiKey: string
} | null>(null)

export const hasVapiSecretAtom = atom((get) => get(vapiSecretAtom) !== null)
