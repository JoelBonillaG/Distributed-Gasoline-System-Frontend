import React from "react";
import { Separator } from "@/components/ui/shadcn/separator";
import { Stars } from "lucide-react";
import { useTheme } from "next-themes";

export function PageHeading({
                                title,
                                subtitle,
                                kicker,
                                icon: Icon,
                                titleIcon: TitleIcon = Stars,
                                actions,
                                className = "",
                                children,
                            }) {
    const LeadingIcon = Icon ?? TitleIcon;

    // Tema actual (next-themes) – evita hydration mismatch
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    const resolved = theme === "system" ? systemTheme : theme;
    const isDark = mounted && resolved === "dark";

    // Blobs: mezcla con tu velo mint (sin negros/blancos duros)
    const veilPct = isDark ? 24 : 16;
    const blobStyle = (brandVar) => ({
        backgroundImage: `radial-gradient(closest-side,
      color-mix(in oklab, var(${brandVar}), var(--brand-veil) ${veilPct}% ) 0%,
      transparent 70%)`,
        filter: isDark ? "saturate(110%) brightness(0.98)" : "saturate(110%)",
    });

    // Línea central petrol/teal que combina con tus mints
    const petrolLight = "oklch(0.78 0.10 210)";
    const petrolDark  = "oklch(0.84 0.09 210)";
    const sepCore = isDark ? petrolDark : petrolLight;

    // Bordes exteriores mint (ligeros)
    const mintEdge = isDark
        ? "linear-gradient(to right, transparent, color-mix(in oklab, var(--brand-1), transparent 60%), transparent)"
        : "linear-gradient(to right, transparent, color-mix(in oklab, var(--brand-1), transparent 34%), transparent)";

    return (
        <div
            className={[
                "relative w-full overflow-hidden hero-surface",
                "px-6 py-6 sm:px-10 md:py-8 lg:px-14 xl:py-10",
                "bg-hero-mint",
                className,
            ].join(" ")}
        >
            <div className="liquid-pill" aria-hidden />
            <div className="pointer-events-none absolute inset-0 glass-edge" />

            {/* Blobs mint suaves */}
            <div
                className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full"
                style={blobStyle("--brand-2")}
            />
            <div
                className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full"
                style={blobStyle("--brand-3")}
            />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    {LeadingIcon ? (
                        <div
                            className={[
                                "grid size-14 md:size-16 place-content-center shrink-0 rounded-2xl shadow-sm",
                                "ring-1 ring-black/5 bg-white/60 text-foreground dark:bg-white/10 dark:ring-white/10",
                            ].join(" ")}
                        >
                            <LeadingIcon className="size-6 md:size-7" />
                        </div>
                    ) : null}

                    <div className="min-w-0">
                        {kicker ? (
                            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground/70">
                                {kicker}
                            </div>
                        ) : null}

                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight leading-tight md:text-4xl text-foreground">
                                {title}
                            </h1>
                        </div>

                        {subtitle ? (
                            <p className="mt-2 max-w-prose text-sm md:text-base text-foreground/75">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>

                {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>

            {/* ⬇️ Un pelín menos espacio antes del contenido secundario */}
            {children ? <div className="relative z-10 mt-4">{children}</div> : null}

            {/* Separador: centro petrol/teal que resalta + doble borde mint exterior */}
            {/* ⬇️ Menos espacio antes del separador */}
            <div className="relative z-10 mt-4">
                <div className="relative w-full">
                    {/* Bordes mint exteriores */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 -top-px h-px"
                        style={{ backgroundImage: mintEdge }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
                        style={{ backgroundImage: mintEdge }}
                    />

                    {/* Línea central (petrol) */}
                    <Separator
                        className="relative h-[2px] rounded-full"
                        style={{
                            backgroundImage: `linear-gradient(to right, transparent, var(--sep-core), transparent)`,
                            boxShadow: `0 0 10px color-mix(in oklab, var(--sep-core), transparent 88%)`,
                            ["--sep-core"]: sepCore,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export function SectionHeading({ title, subtitle, icon: Icon, className = "", actions }) {
    return (
        <div className={["mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className].join(" ")}>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    {Icon ? (
                        <span className="grid size-7 place-content-center rounded-lg bg-brand-1/60 text-foreground ring-1 ring-black/5">
              <Icon className="size-4" />
            </span>
                    ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_0_4px] shadow-[color-mix(in_oklab,var(--brand),transparent_80%)]" />
                    )}
                    <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground/95">{title}</h2>
                </div>
                {subtitle ? <p className="ml-9 mt-1 max-w-prose text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>

            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}

export function SubSectionHeading({ title, subtitle, className = "" }) {
    return (
        <div className={["mb-2", className].join(" ")}>
            <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-brand" />
                <h3 className="text-base font-semibold leading-none tracking-tight">{title}</h3>
            </div>
            {subtitle ? <p className="ml-8 mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
    );
}
