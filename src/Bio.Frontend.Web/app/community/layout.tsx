/**
 * Community layout — wraps all /community/* pages.
 * Public layout — no auth guard on the layout itself.
 * Individual pages guard their own actions.
 *
 * @module app/community/layout
 */

import { CommunityLayout } from "@/components/features/community/CommunityLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Comunidad | BioCommerce Caldas",
    description:
        "Explora publicaciones, conecta con otros miembros y comparte conocimiento sobre biodiversidad y biocomercio en Caldas.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <CommunityLayout>{children}</CommunityLayout>;
}
