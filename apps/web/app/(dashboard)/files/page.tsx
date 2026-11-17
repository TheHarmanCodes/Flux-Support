import PremiumFeatureOverlay from "@/modules/billing/ui/component/premium-feature-overlay"
import FilesView from "@/modules/files/ui/views/files-view"
import { Show } from "@clerk/nextjs"
import React from "react"

const Page = () => {
  return (
    <Show
      when={{ plan: "pro" }}
      fallback={
        <PremiumFeatureOverlay>
          <FilesView />
        </PremiumFeatureOverlay>
      }
    >
      <FilesView />
    </Show>
  )
}
export default Page
