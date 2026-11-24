"use client"

import { Authenticated, Unauthenticated } from "convex/react"
import { useMutation } from "convex/react"
import {
  OrganizationSwitcher,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import Image from "next/image"
import {
  InboxIcon,
  LibraryBigIcon,
  PaletteIcon,
  LayoutDashboardIcon,
  Mic,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { api } from "@workspace/backend/_generated/api"

const quickLinks = [
  {
    title: "Conversations",
    description: "View and manage customer support threads",
    href: "/conversations",
    icon: InboxIcon,
  },
  {
    title: "Knowledge Base",
    description: "Upload files to train your AI assistant",
    href: "/files",
    icon: LibraryBigIcon,
  },
  {
    title: "Widget Customization",
    description: "Style your chat widget to match your brand",
    href: "/customization",
    icon: PaletteIcon,
  },
  {
    title: "Integrations",
    description: "Connect your tools and platforms",
    href: "/integrations",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Voice Assistant",
    description: "Configure your AI-powered voice agent",
    href: "/plugins/vapi",
    icon: Mic,
  },
]

export default function Home() {
  useMutation(api.users.add)

  return (
    <>
      {/* ── Authenticated ─────────────────────────────────── */}
      <Authenticated>
        <div className="flex min-h-svh flex-col bg-muted">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-3 backdrop-blur-sm">
            <Image
              src="/logo_full2.svg"
              alt="FluxSupport logo"
              height={32}
              width={160}
              className="h-8 w-auto"
              priority
            />
            <div className="flex items-center gap-3">
              <OrganizationSwitcher
                hidePersonal
                skipInvitationScreen
                afterSelectOrganizationUrl="/"
                afterCreateOrganizationUrl="/"
                appearance={{
                  elements: {
                    rootBox: "h-8",
                    avatarBox: "size-6! rounded-sm!",
                    organizationSwitcherTrigger:
                      "h-8 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    organizationPreviewTextContainer: "text-sm font-medium",
                    organizationSwitcherTriggerIcon:
                      "ml-2 text-muted-foreground",
                  },
                }}
              />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8",
                  },
                }}
              />
            </div>
          </header>

          {/* Hero */}
          <main className="flex flex-1 flex-col items-center px-4 py-16">
            <div className="mb-10 flex flex-col items-center gap-4 text-center">
              {/* Logo mark */}
              <Image
                src="/logo.svg"
                alt="FluxSupport icon"
                height={50}
                width={50}
                priority
              />
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Welcome to{" "}
                <span className="bg-linear-to-r from-[#3b82f6] to-[#0b63f3] bg-clip-text text-transparent">
                  FluxSupport
                </span>
              </h1>
              <p className="max-w-md text-base text-muted-foreground">
                Your AI-powered customer support platform. Jump straight into a
                section below or switch workspaces from the header above.
              </p>
            </div>

            {/* Quick-link cards */}
            <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickLinks.map(({ title, description, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col gap-3 rounded-xl border bg-background p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-linear-to-b group-hover:from-[#3b82f6] group-hover:to-[#0b63f3] group-hover:text-white dark:bg-blue-950 dark:text-blue-400">
                      <Icon className="size-5" />
                    </div>
                    <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-background/60 py-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
            © {new Date().getFullYear()} FluxSupport · All rights reserved
          </footer>
        </div>
      </Authenticated>

      {/* ── Unauthenticated ───────────────────────────────── */}
      <Unauthenticated>
        <div className="flex min-h-svh flex-col bg-muted">
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
            {/* Logo */}
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/logo.svg"
                alt="FluxSupport icon"
                height={64}
                width={64}
                priority
              />
              <Image
                src="/logo_full2.svg"
                alt="FluxSupport"
                height={40}
                width={200}
                className="h-10 w-auto"
                priority
              />
            </div>

            {/* Copy */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Sign in to your workspace
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                FluxSupport lets your team manage customer conversations, build
                a knowledge base, and deploy AI-powered support — all in one
                place.
              </p>
            </div>

            {/* Auth card */}
            <div className="w-full max-w-xs rounded-2xl border bg-background p-6 shadow-md">
              <div className="flex flex-col gap-3">
                <SignInButton mode="modal">
                  <Button className="w-full cursor-pointer bg-linear-to-b from-[#3b82f6] to-[#0b63f3] text-white shadow-sm hover:opacity-90">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Create an account
                  </Button>
                </SignUpButton>
              </div>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-3.5 text-blue-500" />
                Secured by Clerk
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t bg-background/60 py-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
            © {new Date().getFullYear()} FluxSupport · All rights reserved
          </footer>
        </div>
      </Unauthenticated>
    </>
  )
}
