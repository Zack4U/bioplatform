"use client";

/**
 * CategoryTabs — horizontal scrollable tabs for filtering community posts by category.
 * UI-only.
 *
 * @module components/features/community/CategoryTabs
 */

import { POST_CATEGORIES, CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/constants";
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
                // activeCategory is a backend English key or null; tab is a Spanish label
                const isActive =
                    tab === ALL_LABEL
                        ? activeCategory === null
                        : CATEGORY_LABELS[activeCategory ?? ''] === tab || activeCategory === tab;
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
                        onClick={() => {
                            if (tab === ALL_LABEL) {
                                onCategoryChange(null);
                            } else {
                                // Send backend English key to API, display Spanish in UI
                                const backendKey = CATEGORY_KEYS[tab] ?? tab;
                                onCategoryChange(backendKey);
                            }
                        }}
                        aria-current={isActive ? "true" : undefined}
                    >
                        {tab}
                    </Button>
                );
            })}
        </nav>
    );
}
