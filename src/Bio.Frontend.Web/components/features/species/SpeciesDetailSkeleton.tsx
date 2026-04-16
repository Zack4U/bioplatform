/**
 * SpeciesDetailSkeleton — full loading skeleton for the species detail page.
 *
 * Mirrors the layout of the detail page: hero, info card, tabs, map, products.
 * Used as fallback while React Query loads species data.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SpeciesDetailSkeleton() {
    return (
        <div className="animate-in fade-in duration-300">
            {/* Hero skeleton */}
            <Skeleton className="aspect-[21/9] min-h-[280px] max-h-[480px] w-full sm:aspect-[3/1]" />

            <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Info card skeleton */}
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-56" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-px w-full" />
                        <div className="flex gap-3">
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs skeleton */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 w-28 rounded-md" />
                        ))}
                    </div>
                    <Card>
                        <CardHeader className="pb-3">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                </div>

                {/* Map skeleton */}
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-48" />
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        <Skeleton className="h-[350px] w-full sm:rounded-lg" />
                    </CardContent>
                </Card>

                {/* Related products skeleton */}
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-44" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-3 rounded-lg border p-3">
                                    <Skeleton className="h-20 w-20 shrink-0 rounded-md" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
