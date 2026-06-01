"use client";

/**
 * Messages inbox page — requires authentication.
 *
 * @module app/community/messages/page
 */

import { ThreadList } from "@/components/features/community/ThreadList";
import { AuthGuard } from "@/components/common/AuthGuard";

export default function MessagesPage() {
    return (
        <AuthGuard>
            <div className="rounded-xl border bg-card overflow-hidden min-h-[60vh]">
                <ThreadList />
            </div>
        </AuthGuard>
    );
}
