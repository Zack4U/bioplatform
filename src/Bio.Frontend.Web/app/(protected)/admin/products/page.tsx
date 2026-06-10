import { ProductsManagement } from "@/components/features/admin/products/ProductsManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Productos" };

export default function ProductsPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "ENTREPRENEUR", "AUTHORITY"]}>
            <ProductsManagement />
        </PageRoleGuard>
    );
}
