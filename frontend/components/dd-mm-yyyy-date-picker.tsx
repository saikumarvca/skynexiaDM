"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { parseFlexibleDateParam } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function parseDefaultToDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const iso = parseFlexibleDateParam(value.trim());
  if (!iso) return undefined;
  const d = new Date(`${iso}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export interface DdMmYyyyDatePickerProps {
  name: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Shows dd-mm-yyyy and opens a calendar. Submits the same string via a hidden input (server parses with parseFlexibleDateParam).
 */
export function DdMmYyyyDatePicker({
  name,
  id,
  defaultValue,
  placeholder = "dd-mm-yyyy",
  className,
}: DdMmYyyyDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseDefaultToDate(defaultValue),
  );

  const valueStr = date ? format(date, "dd-MM-yyyy") : "";

  return (
    <div className={cn("w-full", className)}>
      <input type="hidden" name={name} value={valueStr} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            {date ? valueStr : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
