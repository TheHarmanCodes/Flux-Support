import { cn } from "@workspace/ui/lib/utils"
import React from "react"
import { Button } from "./button"

interface infiniteScrollTriggerProps {
  // Whether more items are available to be loaded
  canLoadMore: boolean
  // Whether the next batch of items is currently being loaded
  isLoadingMore: boolean
  // Callback function triggered when user clicks to load more
  onLoadMore: () => void
  // Text to display when more items can be loaded
  loadMoreText?: string
  // Text to display when all items have been loaded
  noMoreText?: string
  className?: string
  // Ref forwarded to the container element (used by IntersectionObserver)
  ref?: React.Ref<HTMLDivElement>
}

/**
 * UI component that acts as a trigger/button for loading more items in infinite scroll.
 * Automatically displays appropriate text and disabled states based on loading status.
 */
const infiniteScrollTrigger = ({
  canLoadMore,
  isLoadingMore,
  onLoadMore,
  loadMoreText = "Load more",
  noMoreText = "No more items",
  className,
  ref,
}: infiniteScrollTriggerProps) => {
  // Determine button label based on current loading / pagination state
  let text = loadMoreText

  if (isLoadingMore) {
    text = "Loading..."
  } else if (!canLoadMore) {
    text = noMoreText
  }

  return (
    <div className={cn("flex w-full justify-center py-2", className)} ref={ref}>
      <Button
        disabled={!canLoadMore || isLoadingMore}
        onClick={onLoadMore}
        size="sm"
        variant="ghost"
      >
        {text}
      </Button>
    </div>
  )
}

export default infiniteScrollTrigger
