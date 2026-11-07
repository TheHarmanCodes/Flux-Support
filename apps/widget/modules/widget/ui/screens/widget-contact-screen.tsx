import { useAtomValue, useSetAtom } from "jotai"
import React, { useState } from "react"
import { screenAtom, widgetSettingAtom } from "../../atoms/widget-atoms"
import WidgetHeader from "../components/widget-header"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { ArrowLeftIcon, CheckIcon, CopyIcon, PhoneIcon } from "lucide-react"
import Link from "next/link"

const WidgetContactScreen = () => {
  const setScreen = useSetAtom(screenAtom)
  const widgetSettings = useAtomValue(widgetSettingAtom)

  const phoneNumber = widgetSettings?.vapiSettings?.phoneNumber

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!phoneNumber) {
      return
    }
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopied(true)
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <WidgetHeader>
        <div className="flex items-center gap-x-2">
          <Button
            variant="transparent"
            size="icon"
            onClick={() => {
              setScreen("selection")
            }}
          >
            <ArrowLeftIcon />
          </Button>
          <p>Contact Us</p>
        </div>
      </WidgetHeader>
      <div className="flex h-full flex-col items-center justify-center gap-y-4">
        <div className="flex items-center justify-center rounded-full border bg-white p-3">
          <PhoneIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Available 24/7</p>
        <p className="text-2xl font-bold">{phoneNumber}</p>
      </div>
      <div className="border-t bg-background p-4">
        <div className="flex flex-col items-center gap-y-2">
          <Button
            className="w-full"
            onClick={handleCopy}
            size="lg"
            variant="outline"
          >
            {copied ? (
              <>
                <CheckIcon className="mr-2 size-4" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="mr-2 size-4" />
                Copy Number
              </>
            )}
          </Button>
          <Link
            href={`tel:${phoneNumber}`}
            onClick={() => {}}
            className={buttonVariants({
              size: "lg",
              className: "w-full gap-2",
            })}
          >
            <PhoneIcon className="size-4" />
            Call Now
          </Link>
        </div>
      </div>
    </>
  )
}

export default WidgetContactScreen
