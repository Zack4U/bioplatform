/**
 * Protected layout — wraps all authenticated pages with AuthGuard.
 * Pages inside (protected)/ require the user to be logged in.
 */

import { AuthGuard } from "@/components/common/AuthGuard";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthGuard>{children}</AuthGuard>;
}
