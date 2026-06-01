"use client";

/**
 * Full-page chat for mobile — requires authentication.
 *
 * @module app/community/messages/[threadId]/page
 */

import { MessagesFullPage } from "@/components/features/community/MessagesFullPage";
import { AuthGuard } from "@/components/common/AuthGuard";
import { use } from "react";

interface Props {
    params: Promise<{ threadId: string }>;
}

export default function ThreadPage({ params }: Props) {
    const { threadId } = use(params);
    return (
        <AuthGuard>
            <MessagesFullPage threadId={threadId} />
        </AuthGuard>
    );
}
