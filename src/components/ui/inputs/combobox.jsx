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

/**
 * Combobox simple (single select)
 * props:
 *  - options: { value: string, label: string }[]
 *  - value: string | undefined
 *  - onChange: (value: string) => void
 *  - placeholder?: string
 *  - emptyText?: string
 *  - disabled?: boolean
 *  - className?: string
 */
export function Combobox({
                             options = [],
                             value,
                             onChange,
                             placeholder = "Selecciona…",
                             emptyText = "Sin resultados.",
                             disabled = false,
                             className = "",
                         }) {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={`w-full justify-between ${className}`}
                >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
                    <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-[240px]">
                <Command>
                    <CommandInput placeholder="Buscar…" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => {
                                const isActive = opt.value === value;
                                return (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.label}
                                        onSelect={() => {
                                            onChange?.(opt.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={`mr-2 size-4 ${isActive ? "opacity-100" : "opacity-0"}`}
                                        />
                                        {opt.label}
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
