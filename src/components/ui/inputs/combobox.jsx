"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button.jsx";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/shadcn/popover.jsx";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/shadcn/command.jsx";
import { cn } from "@/lib/utils";

/**
 * Combobox simple (single select)
 * props:
 *  - options: { value: string, label: string }[]
 *  - value: string | undefined
 *  - onValueChange: (value: string) => void
 *  - placeholder?: string
 *  - emptyText?: string
 *  - searchPlaceholder?: string
 *  - disabled?: boolean
 *  - className?: string
 *  - maxVisibleOptions?: number
 */
export function Combobox({
    options = [],
    value,
    onValueChange,
    onChange, // backward compatibility
    placeholder = "Selecciona…",
    emptyText = "Sin resultados.",
    searchPlaceholder = "Buscar…",
    disabled = false,
    className = "",
    maxVisibleOptions = 8,
}) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((o) => o.value === value);

    // Usar onValueChange si está disponible, sino usar onChange
    const handleChange = onValueChange || onChange;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        "hover:bg-orange-50 hover:border-orange-300",
                        "focus:ring-2 focus:ring-orange-400 focus:border-orange-400",
                        selected &&
                            "text-orange-700 border-orange-300 bg-orange-50/50",
                        className
                    )}
                >
          <span className="truncate text-left flex-1">
            {selected ? selected.label : (
                <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="p-0 w-[--radix-popover-trigger-width] min-w-[400px]"
                align="start"
                sideOffset={4}
            >
                <Command
                    filter={(value, search) => {
                        // Custom filter para búsqueda más flexible
                        const normalizedSearch = search.toLowerCase();
                        const normalizedValue = value.toLowerCase();
                        if (normalizedValue.includes(normalizedSearch)) return 1;
                        return 0;
                    }}
                >
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="border-b"
                    />
                    <CommandList
                        style={{
                            maxHeight: `${maxVisibleOptions * 40}px`,
                        }}
                    >
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => {
                                const isActive = opt.value === value;
                                return (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.label}
                                        keywords={[opt.label, opt.value]}
                                        onSelect={() => {
                                            handleChange?.(opt.value);
                                            setOpen(false);
                                        }}
                                        className={cn(
                                            "cursor-pointer",
                                            "aria-selected:bg-orange-100 aria-selected:text-orange-900",
                                            isActive && "bg-orange-50 text-orange-800"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 size-4",
                                                isActive
                                                    ? "opacity-100 text-orange-600"
                                                    : "opacity-0"
                                            )}
                                        />
                                        <span className="flex-1">{opt.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
