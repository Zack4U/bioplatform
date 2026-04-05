/**
 * /identify — Species Identification page (3-step wizard).
 *
 * Layout:
 *  ┌──────────────────────────────────────────────────────┐
 *  │ PageHeader + Step Indicator (1─2─3)                  │
 *  ├──────────────────────────────────┬───────────────────┤
 *  │ Wizard Content (dynamic step)   │ History (desktop)  │
 *  │ Step 1: Upload / Drag-and-drop  │                    │
 *  │ Step 2: Processing animation    │                    │
 *  │ Step 3: Results + TopK + Actions│                    │
 *  └──────────────────────────────────┴───────────────────┘
 *
 * On mobile, history is accessible via a Sheet button.
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 * All logic delegated to useIdentificationWizard hook.
 */

"use client";

import { PageHeader } from "@/components/common/PageHeader";
import {
    IdentificationHistoryMobile,
    IdentificationHistorySidebar,
} from "@/components/features/identification/IdentificationHistory";
import { IdentifyProcessingStep } from "@/components/features/identification/IdentifyProcessingStep";
import { IdentifyResultsStep } from "@/components/features/identification/IdentifyResultsStep";
import { IdentifyUploadStep } from "@/components/features/identification/IdentifyUploadStep";
import {
    useIdentificationWizard,
    type WizardStep,
} from "@/hooks/features/identification/useIdentificationWizard";
import { cn } from "@/lib/utils";

// ── Step indicator config ────────────────────────────────────────────────────

const STEPS: { step: WizardStep; label: string }[] = [
    { step: 1, label: "Subir Foto" },
    { step: 2, label: "Procesando" },
    { step: 3, label: "Resultados" },
];

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
    return (
        <div className="flex items-center justify-center gap-2" role="list" aria-label="Pasos del identificador">
            {STEPS.map(({ step, label }, index) => (
                <div key={step} className="flex items-center gap-2" role="listitem">
                    {/* Step circle */}
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                                step === currentStep
                                    ? "bg-primary text-primary-foreground scale-110"
                                    : step < currentStep
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted text-muted-foreground",
                            )}
                            aria-current={step === currentStep ? "step" : undefined}
                        >
                            {step < currentStep ? (
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            ) : (
                                step
                            )}
                        </div>
                        <span
                            className={cn(
                                "hidden text-sm font-medium sm:inline",
                                step === currentStep
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                            )}
                        >
                            {label}
                        </span>
                    </div>

                    {/* Connector line */}
                    {index < STEPS.length - 1 && (
                        <div
                            className={cn(
                                "h-0.5 w-8 rounded-full transition-colors duration-300 sm:w-12",
                                step < currentStep
                                    ? "bg-primary"
                                    : "bg-muted",
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IdentifyPage() {
    const wizard = useIdentificationWizard();

    return (
        <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* ── Header ──────────────────────────────────────────── */}
            <PageHeader
                title="Identificador de Especies"
                description="Sube una foto de una especie de Caldas y nuestra IA la identificara con datos taxonomicos y del catalogo cientifico."
                breadcrumbs={[
                    { label: "Inicio", href: "/" },
                    { label: "Identificacion IA" },
                ]}
            />

            {/* ── Step Indicator ───────────────────────────────────── */}
            <section className="mb-8" aria-label="Progreso de identificacion">
                <StepIndicator currentStep={wizard.step} />
            </section>

            {/* ── Content + History Sidebar ─────────────────────────── */}
            <div className="flex gap-6">
                {/* Main content */}
                <div className="min-w-0 flex-1">
                    {/* Mobile history button (visible on <lg) */}
                    {wizard.step !== 2 && (
                        <div className="mb-4 flex justify-end lg:hidden">
                            <IdentificationHistoryMobile />
                        </div>
                    )}

                    {/* Wizard steps */}
                    {wizard.step === 1 && (
                        <IdentifyUploadStep
                            selectedFile={wizard.selectedFile}
                            previewUrl={wizard.previewUrl}
                            onFileSelect={wizard.handleFileSelect}
                            onClassify={wizard.handleClassify}
                            onRetake={wizard.handleRetake}
                            isProcessing={wizard.isProcessing}
                            error={wizard.error}
                        />
                    )}

                    {wizard.step === 2 && (
                        <IdentifyProcessingStep
                            previewUrl={wizard.previewUrl}
                        />
                    )}

                    {wizard.step === 3 && wizard.result && (
                        <IdentifyResultsStep
                            result={wizard.result}
                            previewUrl={wizard.previewUrl}
                            onRetake={wizard.handleRetake}
                            topPredictionSlug={wizard.getTopPredictionSlug()}
                            topPredictionSpeciesId={wizard.getTopPredictionSpeciesId()}
                        />
                    )}
                </div>

                {/* Desktop history sidebar (visible on lg+) */}
                {wizard.step !== 2 && (
                    <div className="hidden shrink-0 lg:block">
                        <div className="sticky top-20">
                            <IdentificationHistorySidebar />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
