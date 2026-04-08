/**
 * /identify layout — SEO metadata for the species identification section.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Identificar Especie | BioCommerce Caldas",
    description:
        "Sube una foto de flora o fauna y nuestro modelo de IA (CNN) identificara la especie. " +
        "Obtendras predicciones con nivel de confianza, taxonomia completa y datos del catalogo cientifico.",
    openGraph: {
        title: "Identificador de Especies con IA | BioCommerce Caldas",
        description:
            "Identifica especies de biodiversidad de Caldas, Colombia usando inteligencia artificial.",
    },
};

export default function IdentifyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
