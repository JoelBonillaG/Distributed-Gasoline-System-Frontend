import React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const toggle = () => {
        const current = (theme ?? resolvedTheme) === "dark" ? "light" : "dark";
        setTheme(current);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Cambiar tema"
            className="relative"
        >
            {/* Sol (modo claro) */}
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            {/* Luna (modo oscuro) */}
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            {/* Evita parpadeo SSR/CSR */}
            {!mounted && <span className="sr-only">Toggle</span>}
        </Button>
    );
}
