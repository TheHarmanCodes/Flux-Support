"use client"
import React from "react"
import { PricingTable as ClerkPricingTable } from "@clerk/nextjs"

const PricingTable = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-4">
      <ClerkPricingTable
        for="organization"
        appearance={{
          elements: {
            pricingTableCard: "shadow-lg! border! rounded-lg!",
            pricingTableCardHeader: "bg-background!",
            pricingTableCardBody: "bg-background!",
            pricingTableCardFooter: "bg-background!",
          },
        }}
      />
    </div>
  )
}

export default PricingTable
