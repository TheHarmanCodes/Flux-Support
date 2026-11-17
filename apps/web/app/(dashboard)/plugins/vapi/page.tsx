import PremiumFeatureOverlay from "@/modules/billing/ui/component/premium-feature-overlay"
import { VapiView } from "@/modules/plugins/ui/views/vapi-view"
import { Show } from "@clerk/nextjs"
import React from "react"

const Page = () => {
  return (
    <Show
      when={{ plan: "pro" }}
      fallback={
        <PremiumFeatureOverlay>
          <VapiView />
        </PremiumFeatureOverlay>
      }
    >
      <VapiView />
    </Show>
  )
}
export default Page
