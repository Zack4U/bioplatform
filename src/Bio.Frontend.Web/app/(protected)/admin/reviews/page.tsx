import { ReviewsManagement } from "@/components/features/admin/reviews/ReviewsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Resenas" };

export default function ReviewsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "ENTREPRENEUR"]}>
            <ReviewsManagement />
        </PageRoleGuard>
    );
}
