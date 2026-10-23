"use client"

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { RedirectToSignIn } from "@clerk/nextjs"

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* While auth is loading display Loading state */}
      <AuthLoading>
        <div className="flex h-full min-h-screen w-full items-center justify-center">
          <p>Loading...</p>
        </div>
      </AuthLoading>

      {/* if client is authenticated, render protected children */}
      <Authenticated>{children}</Authenticated>

      {/* if client is unauthenticated, redirect to sign-in */}
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  )
}
