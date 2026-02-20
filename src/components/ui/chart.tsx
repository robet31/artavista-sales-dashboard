"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// ==========================================
// Common types
// ==========================================

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType<any>
    color?: string
  }
}

interface ChartContextProps {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider")
  }
  return context
}

// ==========================================
// Chart Container
// ==========================================

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn("w-full h-full", className)}
          {...props}
        >
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

// ==========================================
// Chart Tooltip
// ==========================================

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: any[]
  label?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  formatter?: (value: any, name: string, props: any) => React.ReactNode
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      indicator = "dot",
      hideLabel = false,
      formatter,
      className,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-background px-3 py-2 shadow-md",
          className
        )}
        {...props}
      >
        {!hideLabel && label && (
          <p className="font-medium text-sm mb-2">{label}</p>
        )}
        <div className="space-y-1">
          {payload.map((item, index) => {
            const dataKey = item.dataKey
            const itemConfig = config[dataKey]
            const color = item.color
            const value = item.value
            const formattedValue = formatter
              ? formatter(value, dataKey, item)
              : typeof value === "number"
              ? value.toLocaleString()
              : value

            return (
              <div key={index} className="flex items-center gap-2">
                {indicator === "dot" && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "line" && (
                  <div
                    className="h-0.5 w-4"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {itemConfig?.label || dataKey}
                </span>
                <span className="font-medium text-sm ml-auto">
                  {formattedValue}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// ==========================================
// Recharts Wrappers
// ==========================================

export {
  ChartContainer,
  ChartTooltipContent,
  RechartsPrimitive,
}
