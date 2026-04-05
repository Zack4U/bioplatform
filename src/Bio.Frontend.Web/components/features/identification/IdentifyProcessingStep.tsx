/**
 * IdentifyProcessingStep — Step 2 of the identification wizard.
 *
 * Full-screen animated overlay shown while CNN inference runs.
 * Shows the uploaded image with blur + animated scanning visual.
 *
 * @module components/features/identification/IdentifyProcessingStep
 */

"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface IdentifyProcessingStepProps {
    previewUrl: string | null;
}

const PROCESSING_MESSAGES = [
    "Analizando imagen...",
    "Procesando red neuronal...",
    "Comparando con base de datos...",
    "Consultando taxonomia...",
    "Generando predicciones...",
];

export function IdentifyProcessingStep({
    previewUrl,
}: IdentifyProcessingStepProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    // Cycle through processing messages
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-8">
            {/* Image with scanning animation */}
            <div className="relative h-72 w-72 overflow-hidden rounded-3xl sm:h-80 sm:w-80">
                {/* Background image */}
                {previewUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${previewUrl})`,
                            filter: "blur(2px) brightness(0.6)",
                        }}
                    />
                )}

                {/* Scanning animation overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Pulsing rings */}
                    <div className="relative flex items-center justify-center">
                        <div
                            className={cn(
                                "absolute h-40 w-40 rounded-full border-2 border-primary/40",
                                "animate-ping",
                            )}
                            style={{ animationDuration: "2s" }}
                        />
                        <div
                            className={cn(
                                "absolute h-28 w-28 rounded-full border-2 border-primary/60",
                                "animate-ping",
                            )}
                            style={{ animationDuration: "1.5s", animationDelay: "0.3s" }}
                        />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 backdrop-blur-lg">
                            <Loader2
                                className="h-10 w-10 animate-spin text-primary"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </div>

                {/* Scanning line */}
                <div
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    style={{
                        animation: "scanLine 2s ease-in-out infinite",
                    }}
                />

                <style jsx>{`
                    @keyframes scanLine {
                        0% { top: 0; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                `}</style>
            </div>

            {/* Processing text */}
            <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="text-xl font-semibold">
                    Identificando especie
                </h3>
                <p
                    className="h-6 text-sm text-muted-foreground transition-opacity duration-500"
                    key={messageIndex}
                    aria-live="polite"
                >
                    {PROCESSING_MESSAGES[messageIndex]}
                </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary/40"
                        style={{
                            animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                        }}
                    />
                ))}
                <style jsx>{`
                    @keyframes dotPulse {
                        0%, 100% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.3); }
                    }
                `}</style>
            </div>
        </div>
    );
}
