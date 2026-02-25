"use client";

/**
 * SearchInput — debounced search bar with clear button.
 * Built on Shadcn Input primitive.
 * Reused in catalog, marketplace, and dashboard filters.
 * WCAG: labeled input, keyboard accessible clear, aria-live results count.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
} from "react";

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void;
    debounceMs?: number;
    className?: string;
    "aria-label"?: string;
}

export function SearchInput({
    placeholder = "Buscar...",
    value: controlledValue,
    onChange,
    debounceMs = 300,
    className,
    "aria-label": ariaLabel = "Buscar",
}: SearchInputProps) {
    const [internalValue, setInternalValue] = useState(controlledValue ?? "");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync controlled value
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInternalValue(newValue);

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => onChange(newValue), debounceMs);
        },
        [onChange, debounceMs],
    );

    const handleClear = useCallback(() => {
        setInternalValue("");
        onChange("");
    }, [onChange]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className={cn("relative", className)}>
            <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                aria-hidden="true"
            />
            <Input
                type="search"
                role="searchbox"
                aria-label={ariaLabel}
                placeholder={placeholder}
                value={internalValue}
                onChange={handleChange}
                className="h-10 pl-10 pr-10"
            />
            {internalValue && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleClear}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </Button>
            )}
        </div>
    );
}
