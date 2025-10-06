import React from "react";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/shadcn/select";
import { Calendar } from "@/components/ui/shadcn/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/shadcn/popover";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (d) => (d ? d.toISOString().slice(0, 10) : "");
const parseISO = (s) => (s ? new Date(`${s}T00:00:00`) : undefined);

// value shape:
// {
//   name: "", city: "", updatedFrom: "", updatedTo: ""
// }
export default function CentersFilters({
                                           value,
                                           onChange,
                                           cities = [],                 // eg: ["Quito","Guayaquil","Cuenca"]
                                           onApply,                      // callback cuando se aprieta Aplicar
                                           onReset,                      // callback cuando se aprieta Limpiar
                                           className = "",
                                       }) {
    // estado local editable
    const [draft, setDraft] = React.useState({
        name: value?.name ?? "",
        city: value?.city ?? "",
        updatedFrom: value?.updatedFrom ?? "",
        updatedTo: value?.updatedTo ?? "",
    });

    // sync cuando cambian desde afuera
    React.useEffect(() => {
        setDraft((d) => ({
            ...d,
            name: value?.name ?? "",
            city: value?.city ?? "",
            updatedFrom: value?.updatedFrom ?? "",
            updatedTo: value?.updatedTo ?? "",
        }));
    }, [value?.name, value?.city, value?.updatedFrom, value?.updatedTo]);

    // debounce para nombre
    React.useEffect(() => {
        const t = setTimeout(() => onChange?.({ ...value, name: draft.name }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft.name]);

    const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

    // calendario de rango (usa Calendar de shadcn con mode="range")
    const range = {
        from: parseISO(draft.updatedFrom),
        to: parseISO(draft.updatedTo),
    };

    const setRange = (r) => {
        setField("updatedFrom", r?.from ? formatDate(r.from) : "");
        setField("updatedTo", r?.to ? formatDate(r.to) : "");
    };

    const apply = () => {
        onChange?.(draft);
        onApply?.(draft);
    };

    const reset = () => {
        const empty = { name: "", city: "", updatedFrom: "", updatedTo: "" };
        setDraft(empty);
        onChange?.(empty);
        onReset?.(empty);
    };

    const hasFilters =
        !!draft.name || !!draft.city || !!draft.updatedFrom || !!draft.updatedTo;

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {/* Nombre */}
            <div className="flex items-center gap-2">
        <span
            className={cn(
                "h-5 w-1.5 rounded-full",
                "bg-gradient-to-b from-[color-mix(in_oklab,var(--brand-2),white_10%)] to-[color-mix(in_oklab,var(--brand-3),transparent_20%)]",
                "backdrop-blur-[2px] bg-opacity-80",
                "shadow-[0_0_6px_color-mix(in_oklab,var(--brand-2),transparent_70%)]"
            )}
        />
                <Input
                    value={draft.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Buscar por nombre…"
                    className="w-[220px]"
                />
            </div>

            {/* Ciudad */}
            <Select
                value={draft.city || ""}
                onValueChange={(v) => setField("city", v === "all" ? "" : v)}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cities.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Fecha (rango) */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            (!draft.updatedFrom && !draft.updatedTo) && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 size-4" />
                        {draft.updatedFrom || draft.updatedTo
                            ? `${draft.updatedFrom || "…"} → ${draft.updatedTo || "…"}`
                            : "Actualizado: rango"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={range}
                        onSelect={setRange}
                        initialFocus
                        captionLayout="buttons"
                    />
                    <div className="flex items-center justify-between gap-2 border-t p-2">
                        <Button size="sm" variant="ghost" onClick={() => setRange(undefined)}>
                            <X className="mr-1 size-4" /> Limpiar rango
                        </Button>
                        <Button size="sm" onClick={apply}>Aplicar</Button>
                    </div>
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="secondary" onClick={apply}>Aplicar</Button>
            <Button variant="outline" onClick={reset}>Limpiar filtros</Button>

            {hasFilters && (
                <span className="text-xs text-muted-foreground ml-2">
          Filtros activos
        </span>
            )}
        </div>
    );
}
