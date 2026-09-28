import { useCallback, useEffect, useRef } from "react"

interface UseInfiniteScrollProps {
  status: "CanLoadMore" | "Exhausted" | "LoadingFirstPage" | "LoadingMore"
  // Function to fetch the next batch of items
  loadMore: (numItems: number) => void
  // Number of items to fetch per batch (default: 10)
  loadSize?: number
  // Enable autoloading via IntersectionObserver when scrolling (default: true)
  observerEnabled?: boolean
}
/**
 * Custom hook to handle infinite scrolling pagination.
 * Supports both automatic scroll-based triggering via IntersectionObserver
 * and manual button-click loading.
 */
export const useInfiniteScroll = ({
  status,
  loadMore,
  loadSize = 10,
  observerEnabled = true,
}: UseInfiniteScrollProps) => {
  // Step 1: Create a ref to attach to the target sentinel/trigger element in the DOM
  const topElementRef = useRef<HTMLDivElement>(null)

  // Step 2: Define the handler to load more items if loading is permitted
  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(loadSize)
    }
  }, [status, loadMore, loadSize])

  // Step 3: Set up IntersectionObserver to automatically trigger loading when the element comes into view
  useEffect(() => {
    const topElement = topElementRef.current
    // Skip observer setup if target element is not mounted or auto-scroll observer is disabled
    if (!(topElement && observerEnabled)) {
      return
    }

    // Initialize IntersectionObserver to watch for visibility changes
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel element is visible in the viewport, trigger loadMore
        if (entry?.isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 } // Triggers when at least 10% of the element is visible
    )

    // Start observing the target element
    observer.observe(topElement)

    // Step 4: Cleanup by disconnecting the observer when component unmounts or dependencies change
    return () => {
      observer.disconnect()
    }
  }, [handleLoadMore, observerEnabled])

  // Step 5: Return the element ref, trigger handler, and convenient status flags
  return {
    topElementRef,
    handleLoadMore,
    canLoadMore: status === "CanLoadMore",
    isLoadingMore: status === "LoadingMore",
    isLoadingFirstPage: status === "LoadingFirstPage",
    isExhausted: status === "Exhausted",
  }
}
