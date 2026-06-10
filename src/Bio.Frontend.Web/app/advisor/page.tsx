import { ChatInterface } from "@/components/features/advisor/ChatInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Asesor IA",
    description: "Consulta a nuestro experto en biocomercio potenciado por IA sobre especies, normativa y sostenibilidad en Caldas.",
};

export default function AdvisorPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Asesor de Biocomercio</h1>
                <p className="text-muted-foreground">
                    Obtén respuestas expertas y personalizadas para impulsar tus proyectos de biodiversidad.
                </p>
            </div>
            
            <ChatInterface />
        </div>
    );
}
