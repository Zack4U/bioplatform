"use client";
/**
 * UserSearchCombobox — searchable dropdown to pick a user by ID.
 * Used in PermitFormDialog to search entrepreneurs.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command, CommandEmpty, CommandGroup, CommandInput,
    CommandItem, CommandList,
} from "@/components/ui/command";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { getAdminUsers } from "@/services/admin-service";
import type { UserAdminItem } from "@/types/admin";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onUserSelect?: (user: UserAdminItem | null) => void;
    placeholder?: string;
    disabled?: boolean;
    roleName?: string;
}

export function UserSearchCombobox({
    value,
    onChange,
    onUserSelect,
    placeholder = "Buscar usuario...",
    disabled,
    roleName,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading } = useQuery({
        queryKey: ["user-search", debouncedSearch, roleName],
        queryFn: () =>
            getAdminUsers({
                search: debouncedSearch || undefined,
                roleName: roleName ?? undefined,
                pageSize: 30,
            }),
        enabled: open,
        staleTime: 30_000,
    });

    const users = data?.items ?? [];
    const selectedUser = users.find((u) => u.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    {selectedUser ? (
                        <span className="truncate">
                            {selectedUser.fullName}
                            <span className="text-muted-foreground ml-1 text-xs">({selectedUser.email})</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Nombre o correo electrónico..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!isLoading && users.length === 0 && (
                            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                <User className="h-4 w-4 mx-auto mb-1 opacity-50" />
                                {debouncedSearch ? "No se encontraron usuarios" : "Escribe para buscar usuarios"}
                            </CommandEmpty>
                        )}
                        {!isLoading && users.length > 0 && (
                            <CommandGroup>
                                {users.map((u) => (
                                    <CommandItem
                                        key={u.id}
                                        value={u.id}
                                        onSelect={() => {
                                            const newVal = u.id === value ? "" : u.id;
                                            onChange(newVal);
                                            onUserSelect?.(newVal ? u : null);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", u.id === value ? "opacity-100" : "opacity-0")} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{u.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
