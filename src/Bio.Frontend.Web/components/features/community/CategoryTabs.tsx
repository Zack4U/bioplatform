"use client";

/**
 * CategoryTabs — horizontal scrollable tabs for filtering community posts by category.
 * UI-only.
 *
 * @module components/features/community/CategoryTabs
 */

import { POST_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CategoryTabsProps {
    activeCategory: string | null;
    onCategoryChange: (category: string | null) => void;
}

const ALL_LABEL = "Todos";

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
    const tabs = [ALL_LABEL, ...POST_CATEGORIES];

    return (
        <nav
            className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
            aria-label="Filtro de categorias de comunidad"
        >
            {tabs.map((tab) => {
                const isActive =
                    tab === ALL_LABEL ? activeCategory === null : activeCategory === tab;
                return (
                    <Button
                        key={tab}
                        id={`community-tab-${tab.toLowerCase()}`}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                            "shrink-0 rounded-full px-4 text-sm font-medium transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() =>
                            onCategoryChange(tab === ALL_LABEL ? null : tab)
                        }
                        aria-current={isActive ? "true" : undefined}
                    >
                        {tab}
                    </Button>
                );
            })}
        </nav>
    );
}
