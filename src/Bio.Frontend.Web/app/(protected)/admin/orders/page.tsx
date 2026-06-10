import { OrdersManagement } from "@/components/features/admin/orders/OrdersManagement";
import { PageRoleGuard } from "@/components/common/PageRoleGuard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Ordenes" };

export default function OrdersPage() {
    return (
        <PageRoleGuard requiredRoles={["ADMIN", "ENTREPRENEUR"]}>
            <OrdersManagement />
        </PageRoleGuard>
    );
}
