import React from "react"
import { cookies } from "next/headers"
import { AuthGuard } from "@/app/modules/auth/ui/components/auth-guard"
import { OrganizationGuard } from "@/app/modules/auth/ui/components/organization-guard"
import { Provider } from "jotai"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
import { DashbordSidebar } from "../components/dashboard-sidebar"

export const DashboardLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const cookieStore = await cookies()
  // Keep the sidebar open when the cookie is absent (initially when user first-time visitor, the sidebar will be in open state)
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "false"

  return (
    <AuthGuard>
      <OrganizationGuard>
        <Provider>
          <SidebarProvider defaultOpen={defaultOpen}>
            {/* left sidebar having fields customer support, configuration, account navigation and user profile bar*/}
            <DashbordSidebar />

            <main className="flex flex-1 flex-col">{children}</main>
          </SidebarProvider>
        </Provider>
      </OrganizationGuard>
    </AuthGuard>
  )
}
