/**
 * /catalog layout — provides metadata for all catalog routes.
 *
 * Leverages root layout's title.template: "%s | BioCommerce Caldas"
 * to produce "Catálogo de Biodiversidad | BioCommerce Caldas".
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Catálogo de Biodiversidad",
    description:
        "Explora el catálogo científico de biodiversidad del departamento de Caldas, Colombia. " +
        "Consulta especies de flora y fauna por reino, familia, municipio y estado de conservación.",
    keywords: [
        "biodiversidad",
        "Caldas",
        "Colombia",
        "especies",
        "catálogo",
        "flora",
        "fauna",
        "taxonomía",
        "conservación",
        "Manizales",
    ],
    openGraph: {
        title: "Catálogo de Biodiversidad | BioCommerce Caldas",
        description:
            "Catálogo científico de fauna y flora del departamento de Caldas. Busca por nombre, reino, familia o municipio.",
        type: "website",
    },
};

export default function CatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
