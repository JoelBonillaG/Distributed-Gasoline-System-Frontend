"use client";

import React from "react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/shadcn/button";
import { Calendar } from "@/components/ui/shadcn/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover";

export default function DatePickerWithRange({
                                                value,            // { from?: Date, to?: Date }
                                                onChange,         // (range) => void
                                                className,
                                                numberOfMonths = 2,
                                                align = "start",
                                                disabled
                                            }) {
    const label = React.useMemo(() => {
        if (value?.from && value?.to) {
            return `${format(value.from, "dd/MM/yyyy", { locale: es })} → ${format(value.to, "dd/MM/yyyy", { locale: es })}`;
        }
        if (value?.from) {
            return format(value.from, "dd/MM/yyyy", { locale: es });
        }
        return "Selecciona un rango";
    }, [value]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-[260px] justify-start text-left font-normal", !value?.from && "text-muted-foreground", className)}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {label}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align={align}>
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={value?.from ?? addDays(new Date(), -7)}
                    selected={value}
                    onSelect={(range) => onChange?.(range)}
                    numberOfMonths={numberOfMonths}
                    captionLayout="buttons"
                    locale={es}
                />
            </PopoverContent>
        </Popover>
    );
}
