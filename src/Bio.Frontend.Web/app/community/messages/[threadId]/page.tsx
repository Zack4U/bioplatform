"use client";

/**
 * Full-page chat for mobile (/community/messages/[threadId]).
 *
 * @module app/community/messages/[threadId]/page
 */

import { MessagesFullPage } from "@/components/features/community/MessagesFullPage";
import { use } from "react";

interface Props {
    params: Promise<{ threadId: string }>;
}

export default function ThreadPage({ params }: Props) {
    const { threadId } = use(params);
    return <MessagesFullPage threadId={threadId} />;
}
