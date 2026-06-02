/**
 * Groups placeholder page.
 *
 * @module app/community/groups/page
 */

import { GroupsPlaceholder } from "@/components/features/community/GroupsPlaceholder";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Grupos | BioCommerce Caldas",
    description: "Grupos de interes en la comunidad BioCommerce Caldas. Proximamente.",
};

export default function GroupsPage() {
    return <GroupsPlaceholder />;
}
