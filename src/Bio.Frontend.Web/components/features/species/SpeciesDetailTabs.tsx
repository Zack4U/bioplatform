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
import { Badge } from "@/components/ui/badge";
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
                {species.traditionalUses && species.traditionalUses.length > 0 ? (
                    <div className="space-y-4">
                        {species.traditionalUses.map((use) => (
                            <Card key={use.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <CardTitle className="text-base text-primary">
                                            {use.part}
                                        </CardTitle>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {use.category?.map(cat => (
                                                <Badge key={cat} variant="secondary">{cat}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {use.specificPurpose && (
                                        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Propósito:</strong> {use.specificPurpose}</p>
                                    )}
                                    {use.preparationMethod && (
                                        <p className="text-sm text-muted-foreground"><strong className="text-foreground">Preparación:</strong> {use.preparationMethod}</p>
                                    )}
                                    {use.description && (
                                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{use.description}</p>
                                    )}
                                    {(use.community || use.traditionalWarnings || use.confidence) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
                                            {use.community && <div><strong className="text-foreground">Comunidad:</strong> {use.community}</div>}
                                            {use.traditionalWarnings && <div><strong className="text-foreground text-destructive">Precauciones:</strong> {use.traditionalWarnings}</div>}
                                            {use.confidence && <div><strong className="text-foreground">Confianza:</strong> {use.confidence}</div>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <TabSection
                        icon={ScrollText}
                        title="Usos Tradicionales"
                        content={null}
                        emptyMessage="Los usos tradicionales de esta especie aún no han sido documentados."
                    />
                )}
            </TabsContent>

            <TabsContent value="economic">
                {species.economicPotentials && species.economicPotentials.length > 0 ? (
                    <div className="space-y-4">
                        {species.economicPotentials.map((pot) => (
                            <Card key={pot.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <CardTitle className="text-base text-primary">
                                            {pot.sector}
                                        </CardTitle>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                Valor: {pot.marketValue}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                Sustentabilidad: {pot.sustainabilityLevel}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pot.description && (
                                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{pot.description}</p>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {pot.products && pot.products.length > 0 && (
                                            <div>
                                                <strong className="text-sm text-foreground block mb-1">Productos derivados:</strong>
                                                <ul className="text-sm text-muted-foreground list-disc pl-5">
                                                    {pot.products.map(p => <li key={p}>{p}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {pot.activeProperties && pot.activeProperties.length > 0 && (
                                            <div>
                                                <strong className="text-sm text-foreground block mb-1">Propiedades activas:</strong>
                                                <ul className="text-sm text-muted-foreground list-disc pl-5">
                                                    {pot.activeProperties.map(p => <li key={p}>{p}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <TabSection
                        icon={DollarSign}
                        title="Potencial Económico"
                        content={null}
                        emptyMessage="El potencial económico de esta especie aún no ha sido evaluado."
                    />
                )}
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
