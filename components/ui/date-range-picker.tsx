"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
    dateFrom,
    dateTo,
    onDateChange,
    className,
}: {
    dateFrom: string
    dateTo: string
    onDateChange: (from: string, to: string) => void
    className?: string
}) {
    const from = dateFrom ? new Date(dateFrom) : undefined
    const to = dateTo ? new Date(dateTo) : undefined

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal border-border bg-card",
                            !from && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {from ? (
                            to ? (
                                <>
                                    {format(from, "LLL dd, y")} -{" "}
                                    {format(to, "LLL dd, y")}
                                </>
                            ) : (
                                format(from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={from}
                        selected={{ from, to }}
                        onSelect={(range: any) => {
                            // Convert range dates back to YYYY-MM-DD
                            const formatYMD = (d: Date | undefined) => {
                                if (!d) return ""
                                // Use local timezone to prevent off-by-one errors from UTC conversion
                                const offset = d.getTimezoneOffset()
                                const local = new Date(d.getTime() - (offset * 60 * 1000))
                                return local.toISOString().split("T")[0]
                            }
                            onDateChange(formatYMD(range?.from), formatYMD(range?.to))
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0"
                    onClick={() => onDateChange("", "")}
                    title="Clear dates"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
