/**
 * /catalog/[slug] layout — provides dynamic metadata for species detail pages.
 *
 * Leverages root layout's title.template: "%s | BioCommerce Caldas"
 * to produce "[Species Name] | BioCommerce Caldas".
 */

import type { Metadata } from "next";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    // Convert slug back to a readable title
    const title = slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return {
        title: `${title} — Catálogo de Biodiversidad`,
        description: `Información detallada sobre ${title}: taxonomía, distribución geográfica, usos tradicionales, potencial económico y estado de conservación.`,
        openGraph: {
            title: `${title} | BioCommerce Caldas`,
            description: `Ficha completa de ${title} en el catálogo de biodiversidad de Caldas, Colombia.`,
            type: "article",
        },
    };
}

export default function SpeciesDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
