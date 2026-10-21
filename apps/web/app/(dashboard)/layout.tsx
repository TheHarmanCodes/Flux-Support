import { auth } from "@clerk/nextjs/server"
import React from "react"
import { DashboardLayout } from "../../modules/dashboard/ui/layouts/dashboard-layout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await auth.protect()

  return <DashboardLayout>{children}</DashboardLayout>
}
