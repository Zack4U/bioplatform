"use client";

/**
 * ThemeToggle — dark/light/system mode selector.
 * Built on Shadcn Button + DropdownMenu primitives.
 * WCAG: labeled button, visible state indicator, keyboard accessible menu.
 */

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/** Returns true once the component has hydrated on the client. */
function useHydrated() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const mounted = useHydrated();

    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                aria-label="Cambiar tema"
                disabled
            >
                <Sun className="h-4 w-4" aria-hidden="true" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Cambiar tema">
                    <Sun
                        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                        aria-hidden="true"
                    />
                    <Moon
                        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                        aria-hidden="true"
                    />
                    <span className="sr-only">Cambiar tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={theme === "light" ? "bg-accent" : ""}
                >
                    <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
                    Claro
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={theme === "dark" ? "bg-accent" : ""}
                >
                    <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
                    Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={theme === "system" ? "bg-accent" : ""}
                >
                    <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sistema
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
