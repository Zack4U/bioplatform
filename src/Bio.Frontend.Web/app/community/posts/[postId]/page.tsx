/**
 * Post detail page — shows full post with inline comments.
 *
 * @module app/community/posts/[postId]/page
 */

import { PostDetail } from "@/components/features/community/PostDetail";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { postId } = await params;
    return {
        title: `Post ${postId} | Comunidad BioCommerce Caldas`,
    };
}

export default async function PostDetailPage({ params }: Props) {
    const { postId } = await params;
    return <PostDetail postId={postId} />;
}
