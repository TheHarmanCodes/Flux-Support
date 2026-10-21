"use client"

import { useOrganization } from "@clerk/nextjs"
import React from "react"
import { AuthLayout } from "../layout/auth-layout"
import { OrgSelectView } from "../views/org-select-view"

export const OrganizationGuard = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!organization) {
    return (
      <AuthLayout>
        <OrgSelectView />
      </AuthLayout>
    )
  }

  return <>{children}</>
}
