import React from "react";
import { Stars } from "lucide-react";

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

    return (
        <div
            className={[
                "relative w-full overflow-hidden rounded-xl",
                "px-6 py-5",
                "bg-gradient-to-r from-brand-1/30 via-brand-2/30 to-brand-3/30",
                "dark:from-brand-1/20 dark:via-brand-2/20 dark:to-brand-3/20",
                "border border-brand-1/20",
                className,
            ].join(" ")}
        >
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    {LeadingIcon ? (
                        <div
                            className={[
                                "grid size-12 place-content-center shrink-0 rounded-xl",
                                "bg-card border border-border shadow-sm",
                            ].join(" ")}
                        >
                            <LeadingIcon className="size-5 text-foreground" />
                        </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                        {kicker ? (
                            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {kicker}
                            </div>
                        ) : null}

                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>

                        {subtitle ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>

                {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
            </div>

            {children ? <div className="relative z-10 mt-4">{children}</div> : null}
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
