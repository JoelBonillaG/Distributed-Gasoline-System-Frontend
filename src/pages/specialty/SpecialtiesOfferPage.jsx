// src/pages/specialty/SpecialtiesOfferPage.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { PageHeading } from "@/components/ui/typography/Heading";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Card } from "@/components/ui/shadcn/card";
import { Stethoscope, LayoutGrid, PanelsTopLeft } from "lucide-react";

import specialties from "@/services/specialties.service";
import SpecialtiesCarousel from "@/components/specialty/SpecialtiesCarousel";

// clamp sin plugin (corta a N líneas sin crecer la tarjeta)
const clamp = (lines) => ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.25",
    maxHeight: `calc(1.25em * ${lines})`,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
});

// tarjeta reutilizable para el modo GRID
function SpecialtyTile({ idx, name, description }) {
    return (
        <Card className="h-60 md:h-64 rounded-2xl border border-border/80 shadow-[0_6px_24px_-10px_rgb(0_0_0_/_.15)] hover:shadow-[0_10px_32px_-12px_rgb(0_0_0_/_.25)] transition-all overflow-hidden">
            <div className="relative h-full flex flex-col p-4 md:p-5">
        <span className="select-none absolute left-3 top-2 text-6xl md:text-7xl font-semibold leading-none text-brand opacity-25">
          {String(idx).padStart(2, "0")}
        </span>

                <h3 className="mt-6 md:mt-8 text-base font-semibold leading-tight truncate" title={name}>
                    {name}
                </h3>

                <p className="mt-3 text-sm text-muted-foreground leading-snug" style={clamp(3)} title={description || ""}>
                    {description || "Sin descripción"}
                </p>

                <div className="mt-auto pt-3">
                    <Link to="/consultations/form" className="text-primary underline underline-offset-2 font-medium">
                        Agendar cita
                    </Link>
                </div>
            </div>
        </Card>
    );
}

export default function SpecialtiesOfferPage() {
    const [view, setView] = React.useState("carousel"); // "carousel" | "grid"

    // Datos para el modo GRID (usamos la misma fuente que el carrusel)
    const { data, isLoading, isError } = useQuery({
        queryKey: ["specialties-all", { includeDeleted: false }],
        queryFn: () => specialties.listAllSpecialties({ includeDeleted: false }),
        staleTime: 60_000,
    });

    const list = React.useMemo(() => {
        const items = Array.isArray(data) ? data : [];
        return items.filter((s) => !s.deleted);
    }, [data]);

    const toggleView = () => setView((v) => (v === "carousel" ? "grid" : "carousel"));

    return (
        <div className="space-y-6 p-6">
            <PageHeading
                title="Especialidades"
                subtitle="Explora y selecciona una especialidad."
                icon={Stethoscope}
                actions={
                    <Button variant="outline" onClick={toggleView}>
                        {view === "carousel" ? (
                            <>
                                <LayoutGrid className="mr-2 size-4" />
                                Ver todo
                            </>
                        ) : (
                            <>
                                <PanelsTopLeft className="mr-2 size-4" />
                                Ver carrusel
                            </>
                        )}
                    </Button>
                }
            />

            {/* Contenedor (card) del contenido principal */}
            <div className="mx-auto max-w-7xl -mt-2 md:-mt-3">
                <div className="rounded-xl border bg-card shadow-sm">
                    {/* Header de la card */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <h2 className="text-xl font-semibold">Explora por especialidad</h2>
                        <span className="text-sm text-muted-foreground">
              {view === "carousel" ? "Desliza para ver más" : `Total: ${list.length}`}
            </span>
                    </div>

                    <Separator />

                    {/* Contenido según vista */}
                    <div className="p-10">
                        {view === "carousel" ? (
                            <SpecialtiesCarousel autoplay perView={{ base: 1, sm: 2, md: 3, lg: 3, xl: 4 }} />
                        ) : (
                            <>
                                {isLoading && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="h-60 md:h-64 rounded-2xl border animate-pulse" />
                                        ))}
                                    </div>
                                )}

                                {isError && <div className="text-sm text-destructive">No se pudieron cargar las especialidades.</div>}

                                {!isLoading && !isError && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                                        {list.map((s, i) => (
                                            <SpecialtyTile key={s.id} idx={i + 1} name={s.name} description={s.description} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
