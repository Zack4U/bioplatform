/**
 * Messages inbox page — lists all conversation threads.
 *
 * @module app/community/messages/page
 */

import { ThreadList } from "@/components/features/community/ThreadList";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mensajes | BioCommerce Caldas",
    description: "Bandeja de mensajes directos con tus conexiones.",
};

export default function MessagesPage() {
    return (
        <div className="rounded-xl border bg-card overflow-hidden min-h-[60vh]">
            <ThreadList />
        </div>
    );
}
