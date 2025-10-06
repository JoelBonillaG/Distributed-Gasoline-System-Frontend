// src/components/SpecialtiesCarousel.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import specialties from "@/services/specialties.service";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/shadcn/carousel";
import { Card } from "@/components/ui/shadcn/card";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";

function useAllSpecialties(includeDeleted = false) {
    return useQuery({
        queryKey: ["specialties-all", { includeDeleted }],
        queryFn: () => specialties.listAllSpecialties({ includeDeleted }),
        staleTime: 60_000,
    });
}

// Helper: clamp sin plugin (3 líneas)
const clamp = (lines) => ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.25",
    maxHeight: `calc(1.25em * ${lines})`, // fallback para navegadores sin -webkit-line-clamp
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
});

const Tile = ({ idx, name, description }) => (
    <Card className="h-60 md:h-64 rounded-2xl border border-border/80 shadow-[0_6px_24px_-10px_rgb(0_0_0_/_.15)] hover:shadow-[0_10px_32px_-12px_rgb(0_0_0_/_.25)] transition-all overflow-hidden">
        <div className="relative h-full flex flex-col p-4 md:p-5">
            {/* Número grande (brand) */}
            <span className="select-none absolute left-3 top-2 text-6xl md:text-7xl font-semibold leading-none text-brand opacity-25">
        {String(idx).padStart(2, "0")}
      </span>

            {/* Título -> 1 línea con ellipsis */}
            <h3 className="mt-6 md:mt-8 text-base font-semibold leading-tight truncate" title={name}>
                {name}
            </h3>

            {/* Descripción -> máximo 3 líneas */}
            <p
                className="mt-3 text-sm text-muted-foreground leading-snug"
                style={clamp(3)}
                title={description || ""}
            >
                {description || "Sin descripción"}
            </p>

            {/* CTA anclado abajo */}
            <div className="mt-auto pt-3">
                <Link to="/consultations/form" className="text-primary underline underline-offset-2 font-medium">
                    Agendar cita
                </Link>
            </div>
        </div>
    </Card>
);

export default function SpecialtiesCarousel({
                                                className,
                                                includeDeleted = false,
                                                autoplay = true,
                                            }) {
    const { data, isLoading, isError } = useAllSpecialties(includeDeleted);
    const plugin = React.useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));

    const list = React.useMemo(() => {
        const items = Array.isArray(data) ? data : [];
        return includeDeleted ? items : items.filter((s) => !s.deleted);
    }, [data, includeDeleted]);

    // Slides: ancho fijo por breakpoint (no crecen por contenido)
    const itemClasses =
        "shrink-0 grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3 xl:basis-1/4 min-w-[280px] md:min-w-[320px]";

    return (
        <div className={cn("w-full", className)}>
            <Carousel opts={{ align: "start", loop: true }} plugins={autoplay ? [plugin.current] : []}>
                <CarouselContent>
                    {isLoading &&
                        Array.from({ length: 6 }).map((_, i) => (
                            <CarouselItem key={`sk-${i}`} className={itemClasses}>
                                <div className="h-60 md:h-64 w-full animate-pulse rounded-2xl border" />
                            </CarouselItem>
                        ))}

                    {!isLoading && !isError && list.length === 0 && (
                        <CarouselItem className="basis-full shrink-0 grow-0">
                            <Card className="h-60 grid place-items-center text-sm opacity-80">
                                No hay especialidades para mostrar
                            </Card>
                        </CarouselItem>
                    )}

                    {!isLoading &&
                        !isError &&
                        list.map((s, i) => (
                            <CarouselItem key={s.id} className={itemClasses}>
                                <Tile idx={i + 1} name={s.name} description={s.description} />
                            </CarouselItem>
                        ))}
                </CarouselContent>

                <CarouselPrevious className="-left-3" />
                <CarouselNext className="-right-3" />
            </Carousel>

            {isError && (
                <div className="mt-3 text-sm text-destructive">
                    Ocurrió un error al cargar las especialidades.
                </div>
            )}
        </div>
    );
}
