import { ArrowRightIcon, ArrowUpIcon, CheckIcon, ListIcon } from "lucide-react"

export const filterItems = [
  {
    label: "All",
    value: "all",
    icon: ListIcon,
  },
  {
    label: "Unresolved",
    value: "unresolved",
    icon: ArrowRightIcon,
  },
  {
    label: "Escalated",
    value: "escalated",
    icon: ArrowUpIcon,
  },
  {
    label: "Resolved",
    value: "resolved",
    icon: CheckIcon,
  },
]

export const STATUS_FILTER_KEY = "flux-status-filter"
