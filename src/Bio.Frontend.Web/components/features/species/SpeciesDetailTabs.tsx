/**
 * SpeciesDetailTabs — tabbed content sections for species detail.
 *
 * Tabs: Descripción | Usos Tradicionales | Potencial Económico | Info Ecológica
 *
 * Uses ShadCN Tabs component. Each tab renders rich text content
 * from the species detail fields.
 *
 * UI ONLY — receives data via props.
 */

"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import type { SpeciesDetail } from "@/types/species";
import {
    BookOpen,
    DollarSign,
    Leaf,
    ScrollText,
} from "lucide-react";

interface SpeciesDetailTabsProps {
    species: SpeciesDetail;
}

/* ─── Tab content wrapper ─────────────────────────────────────────────── */

function TabSection({
    icon: Icon,
    title,
    content,
    emptyMessage = "Información no disponible.",
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    content: string | null;
    emptyMessage?: string;
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {content ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {content}
                    </p>
                ) : (
                    <p className="text-sm italic text-muted-foreground/60">
                        {emptyMessage}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export function SpeciesDetailTabs({ species }: SpeciesDetailTabsProps) {
    return (
        <Tabs defaultValue="description" className="w-full">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
                <TabsTrigger value="description" className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Descripción</span>
                    <span className="sm:hidden">Desc.</span>
                </TabsTrigger>
                <TabsTrigger value="traditional" className="gap-1.5">
                    <ScrollText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Usos Tradicionales</span>
                    <span className="sm:hidden">Usos</span>
                </TabsTrigger>
                <TabsTrigger value="economic" className="gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Potencial Económico</span>
                    <span className="sm:hidden">Económico</span>
                </TabsTrigger>
                <TabsTrigger value="ecological" className="gap-1.5">
                    <Leaf className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Info Ecológica</span>
                    <span className="sm:hidden">Ecología</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="description">
                <TabSection
                    icon={BookOpen}
                    title="Descripción"
                    content={species.description}
                    emptyMessage="La descripción de esta especie aún no ha sido registrada."
                />
            </TabsContent>

            <TabsContent value="traditional">
                <TabSection
                    icon={ScrollText}
                    title="Usos Tradicionales"
                    content={species.traditionalUses}
                    emptyMessage="Los usos tradicionales de esta especie aún no han sido documentados."
                />
            </TabsContent>

            <TabsContent value="economic">
                <TabSection
                    icon={DollarSign}
                    title="Potencial Económico"
                    content={species.economicPotential}
                    emptyMessage="El potencial económico de esta especie aún no ha sido evaluado."
                />
            </TabsContent>

            <TabsContent value="ecological">
                <TabSection
                    icon={Leaf}
                    title="Información Ecológica"
                    content={species.ecologicalInfo}
                    emptyMessage="La información ecológica de esta especie aún no está disponible."
                />
            </TabsContent>
        </Tabs>
    );
}
