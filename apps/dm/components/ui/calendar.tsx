"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

import "react-day-picker/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/** react-day-picker v9 + default stylesheet; tweak with className if needed */
export function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn("p-2", className)} {...props} />
}
