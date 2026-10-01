"use client"
import WidgetHeader from "@/modules/widget/ui/components/widget-header"
import { WidgetFooter } from "../components/widget-footer"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeftIcon } from "lucide-react"
import { useAtomValue, useSetAtom } from "jotai"
import {
  contactSessionIdAtomFamily,
  conversationIdAtom,
  organizationIdAtom,
  screenAtom,
} from "../../atoms/widget-atoms"
import { usePaginatedQuery } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { formatDistanceToNow } from "date-fns"
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon"
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll"
import InfiniteScrollTrigger from "@workspace/ui/components/infinite-scroll-trigger"

export const WidgetInboxScreen = () => {
  const setScreen = useSetAtom(screenAtom)
  const setConversationId = useSetAtom(conversationIdAtom)

  const organizationId = useAtomValue(organizationIdAtom)
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  )

  const conversations = usePaginatedQuery(
    api.public.conversations.getMany,
    contactSessionId
      ? {
          contactSessionId,
        }
      : "skip",
    {
      initialNumItems: 10,
    }
  )
  // https://docs.convex.dev/database/pagination
  const { topElementRef, handleLoadMore, canLoadMore, isLoadingMore } =
    useInfiniteScroll({
      status: conversations.status,
      loadMore: conversations.loadMore,
      loadSize: 10,
    })

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
          <p>Inbox</p>
        </div>
      </WidgetHeader>
      <div className="flex flex-1 flex-col gap-y-2 overflow-y-auto p-4">
        {conversations.status === "LoadingFirstPage" && (
          <p className="text-center text-sm text-muted-foreground">
            Loading...
          </p>
        )}
        {conversations.status !== "LoadingFirstPage" &&
          conversations.results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No conversations yet.
            </p>
          )}
        {conversations.results.map((conversation) => (
          <Button
            className="h-20 w-full justify-between"
            key={conversation._id}
            onClick={() => {
              setConversationId(conversation._id)
              setScreen("chat")
            }}
            variant="outline"
          >
            <div className="flex w-full flex-col gap-4 overflow-hidden text-start">
              <div className="flex w-full items-center justify-between gap-x-2">
                <p className="text-xs text-muted-foreground lg:text-sm">Chat</p>
                <p className="text-xs text-muted-foreground lg:text-sm">
                  {formatDistanceToNow(new Date(conversation._creationTime))}
                </p>
              </div>
              <div className="flex w-full items-center justify-between">
                <p className="truncate text-sm">
                  {conversation.lastMessage?.text}
                </p>
                <ConversationStatusIcon status={conversation.status} />
              </div>
            </div>
          </Button>
        ))}
        <InfiniteScrollTrigger
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          ref={topElementRef}
        />
      </div>
      <WidgetFooter />
    </>
  )
}
