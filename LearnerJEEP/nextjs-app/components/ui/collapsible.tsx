"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CollapsibleProps {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  className?: string
  triggerClassName?: string
  contentClassName?: string
  title: string
}

export function Collapsible({
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  children,
  className,
  triggerClassName,
  contentClassName,
  title
}: CollapsibleProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  
  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }
  
  // Use controlled state if provided
  const isOpen = openProp !== undefined ? openProp : open
  
  return (
    <div className={cn("w-full", className)}>
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full p-3 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-t-md transition-colors",
          triggerClassName
        )}
      >
        <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200",
            isOpen ? "transform rotate-180" : ""
          )} 
        />
      </button>
      
      {isOpen && (
        <div 
          className={cn(
            "p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-md", 
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
