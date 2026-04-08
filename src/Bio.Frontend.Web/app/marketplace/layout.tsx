import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Marketplace Sostenible",
    description:
        "Explora productos de biocomercio sostenible del departamento de Caldas, Colombia. Artesanías, alimentos orgánicos, cosméticos naturales y experiencias de ecoturismo.",
};

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
