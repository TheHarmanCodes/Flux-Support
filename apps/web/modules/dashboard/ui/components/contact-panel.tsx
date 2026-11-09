"use client"

import Bowser from "bowser"
import { getCountryFlagUrl, getCountryFromTimezone } from "@/lib/country-utils"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { buttonVariants } from "@workspace/ui/components/button"
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar"
import { useQuery } from "convex/react"
import { ClockIcon, GlobeIcon, MailIcon, MonitorIcon } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useMemo } from "react"
import { format } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

type InfoItem = {
  label: string
  value: string | React.ReactNode
  className?: string
}

type InfoSelection = {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  items: InfoItem[]
}

const ContactPanel = () => {
  const params = useParams()
  const conversationId = params.conversationId as Id<"conversations"> | null

  const contactSession = useQuery(
    api.private.constactSession.getOneByConversationId,
    conversationId
      ? {
          conversationId,
        }
      : "skip"
  )

  const parseUserAgent = useMemo(() => {
    return (userAgent?: string) => {
      if (!userAgent) {
        return { browser: "Unknown", os: "Unknown", device: "Unknown" }
      }

      const browser = Bowser.getParser(userAgent)
      const result = browser.getResult()

      return {
        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || "",
        os: result.os.name || "Unknown",
        osVersion: result.os.version || "",
        device: result.platform.type || "desktop",
        deviceVendor: result.platform.vendor || "",
        deviceModel: result.platform.model || "",
      }
    }
  }, [])

  const userAgentInfo = useMemo(
    () => parseUserAgent(contactSession?.metadata?.userAgent),
    [contactSession?.metadata?.userAgent, parseUserAgent]
  )

  const countryInfo = useMemo(() => {
    return getCountryFromTimezone(contactSession?.metadata?.timezone)
  }, [contactSession?.metadata?.timezone])

  const accordionSections = useMemo<InfoSelection[]>(() => {
    if (!contactSession) {
      return []
    }

    const sections: InfoSelection[] = []

    if (contactSession.metadata) {
      sections.push({
        id: "devie-info",
        icon: MonitorIcon,
        title: "Device Information",
        items: [
          {
            label: "Browser",
            value:
              userAgentInfo.browser +
              (userAgentInfo.browserVersion
                ? ` ${userAgentInfo.browserVersion}`
                : ""),
          },
          {
            label: "OS",
            value:
              userAgentInfo.os +
              (userAgentInfo.os ? ` ${userAgentInfo.osVersion}` : ""),
          },
          {
            label: "Device",
            value:
              userAgentInfo.device +
              (userAgentInfo.deviceModel
                ? ` ${userAgentInfo.deviceModel}`
                : ""),
            className: "capitalize",
          },
          {
            label: "Screen",
            value: contactSession.metadata.screenResolution,
          },
          {
            label: "Viewport",
            value: contactSession.metadata.viewportSize,
          },
          {
            label: "Cookies",
            value: contactSession.metadata.cookieEnabled
              ? "Enabled"
              : "Disabled",
          },
        ],
      })

      sections.push({
        id: "location-info",
        icon: GlobeIcon,
        title: "Location & Language",
        items: [
          ...(countryInfo
            ? [
                {
                  label: "Country",
                  value: <span>{countryInfo.name}</span>,
                },
              ]
            : []),
          {
            label: "Language",
            value: contactSession.metadata.language,
          },
          {
            label: "Timezone",
            value: contactSession.metadata.timezone,
          },
          {
            label: "UTC Offset",
            value: contactSession.metadata.timezoneOffset,
          },
        ],
      })
    }

    const isSessionExpired = contactSession.expiresAt < Date.now()

    sections.push({
      id: "session-details",
      icon: ClockIcon,
      title: "Session Details",
      items: [
        {
          label: "Session ID",
          value: (
            <span
              className="block max-w-[180px] truncate text-right font-mono text-xs"
              title={contactSession._id}
            >
              {contactSession._id}
            </span>
          ),
        },
        {
          label: "Status",
          value: (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                isSessionExpired
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isSessionExpired ? "Expired" : "Active"}
            </span>
          ),
        },
        {
          label: "Started",
          value: format(contactSession._creationTime, "MMM d, yyyy, h:mm a"),
        },
        {
          label: "Expires",
          value: format(contactSession.expiresAt, "MMM d, yyyy, h:mm a"),
        },
        ...(contactSession.metadata?.currentUrl
          ? [
              {
                label: "Current URL",
                value: (
                  <a
                    href={contactSession.metadata.currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-[180px] truncate text-right text-primary hover:underline"
                    title={contactSession.metadata.currentUrl}
                  >
                    {contactSession.metadata.currentUrl}
                  </a>
                ),
              },
            ]
          : []),
        ...(contactSession.metadata?.referrer
          ? [
              {
                label: "Referrer",
                value: (
                  <span
                    className="block max-w-[180px] truncate text-right"
                    title={contactSession.metadata.referrer}
                  >
                    {contactSession.metadata.referrer}
                  </span>
                ),
              },
            ]
          : []),
      ],
    })

    return sections
  }, [contactSession, userAgentInfo, countryInfo])

  if (contactSession === undefined || contactSession === null) {
    return null
  }

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      <div className="flex flex-col gap-y-4 p-4">
        <div className="flex items-center gap-x-2">
          <DicebearAvatar
            seed={contactSession._id}
            badgeImageUrl={
              countryInfo?.code
                ? getCountryFlagUrl(countryInfo.code)
                : undefined
            }
            size={42}
          />
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-x-2">
              <h4 className="line-clamp-1">{contactSession.name}</h4>
            </div>
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {contactSession.email}
            </p>
          </div>
        </div>
        <Link
          href={`mailto:${contactSession.email}`}
          className={buttonVariants({
            size: "lg",
            className: "w-full",
          })}
        >
          <MailIcon />
          <span>Send Email</span>
        </Link>
      </div>

      <div>
        {accordionSections.length > 0 && (
          <Accordion className="w-full rounded-none border-y" typeof="single">
            {accordionSections.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="rounded-none outline-none has-focus-visible:z-10 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
              >
                <AccordionTrigger className="flex w-full flex-1 items-start justify-between gap-4 rounded-none bg-accent px-5 py-4 text-left text-sm font-medium transition-all outline-none hover:no-underline disabled:pointer-events-none disabled:opacity-50">
                  <div className="flex items-center gap-4">
                    <section.icon className="size-4 shrink-0" />
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 py-4">
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div
                        className="flex items-center justify-between gap-x-2"
                        key={`${section.id}-${item.label}`}
                      >
                        <span className="shrink-0 text-muted-foreground">
                          {item.label}
                        </span>
                        <span className={item.className}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}

export default ContactPanel
