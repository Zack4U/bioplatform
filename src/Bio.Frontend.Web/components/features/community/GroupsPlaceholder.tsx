"use client";

/**
 * GroupsPlaceholder — "Proximamente" placeholder for the Groups tab.
 *
 * @module components/features/community/GroupsPlaceholder
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users2, Clock } from "lucide-react";
import Link from "next/link";

export function GroupsPlaceholder() {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="max-w-md w-full border-dashed">
                <CardContent className="flex flex-col items-center gap-5 py-12 text-center px-8">
                    <div className="relative">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                            <Users2
                                className="h-10 w-10 text-primary"
                                aria-hidden="true"
                            />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning">
                            <Clock className="h-3.5 w-3.5 text-warning-foreground" aria-hidden="true" />
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Grupos</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            La funcion de Grupos esta en desarrollo. Pronto podras
                            crear y unirte a grupos de interes sobre biodiversidad,
                            investigacion y biocomercio.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <Button asChild>
                            <Link href="/community">Ir al Feed</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/community/friends">Ver Conexiones</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
