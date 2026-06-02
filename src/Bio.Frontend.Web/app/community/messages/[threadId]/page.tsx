"use client";

/**
 * Full-page chat for mobile — requires authentication.
 *
 * @module app/community/messages/[threadId]/page
 */

import { MessagesFullPage } from "@/components/features/community/MessagesFullPage";
import { AuthGuard } from "@/components/common/AuthGuard";
import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
    params: Promise<{ threadId: string }>;
}

function ThreadPageContent({ threadId }: { threadId: string }) {
    const searchParams = useSearchParams();
    const threadTitle = searchParams.get("name") ?? undefined;
    return (
        <AuthGuard>
            <MessagesFullPage threadId={threadId} threadTitle={threadTitle} />
        </AuthGuard>
    );
}

export default function ThreadPage({ params }: Props) {
    const { threadId } = use(params);
    return (
        <Suspense fallback={null}>
            <ThreadPageContent threadId={threadId} />
        </Suspense>
    );
}
