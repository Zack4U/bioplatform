"use client";
/**
 * SpeciesSearchCombobox — searchable dropdown to pick a species by ID.
 * Used in PermitFormDialog and ProductFormDialog.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Leaf, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput,
    CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { getAdminSpecies } from "@/services/admin-service";
import type { SpeciesAdminItem } from "@/types/admin";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSpeciesSelect?: (species: SpeciesAdminItem | null) => void;
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
}

export function SpeciesSearchCombobox({ value, onChange, onSpeciesSelect, placeholder = "Buscar especie...", disabled, clearable }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ["species-search", debouncedSearch],
        queryFn: () => getAdminSpecies({ query: debouncedSearch || undefined, pageSize: 30 }),
        enabled: open,
        staleTime: 1000 * 30,
    });

    const species = data?.items ?? [];
    const selectedSpecies = species.find((s) => s.id === value);

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="flex-1 justify-between font-normal"
                    >
                        {selectedSpecies ? (
                            <span className="italic truncate">{selectedSpecies.scientificName}
                                {selectedSpecies.commonName && (
                                    <span className="not-italic text-muted-foreground ml-1">({selectedSpecies.commonName})</span>
                                )}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Nombre científico o común..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {!isLoading && species.length === 0 && (
                                <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                    <Leaf className="h-4 w-4 mx-auto mb-1 opacity-50" />
                                    {debouncedSearch ? "No se encontraron especies" : "Escribe para buscar especies"}
                                </CommandEmpty>
                            )}
                            {!isLoading && species.length > 0 && (
                                <CommandGroup>
                                    {species.map((sp) => (
                                        <CommandItem
                                            key={sp.id}
                                            value={sp.id}
                                            onSelect={() => {
                                                const newVal = sp.id === value ? "" : sp.id;
                                                onChange(newVal);
                                                onSpeciesSelect?.(newVal ? sp : null);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", sp.id === value ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                                <span className="italic text-sm">{sp.scientificName}</span>
                                                {sp.commonName && (
                                                    <span className="text-xs text-muted-foreground">{sp.commonName}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {clearable && value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { onChange(""); onSpeciesSelect?.(null); }}
                    className="shrink-0"
                    aria-label="Limpiar selección"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
