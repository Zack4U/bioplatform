import { OrdersManagement } from "@/components/features/admin/orders/OrdersManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Ordenes" };

export default function OrdersPage() {
    return <OrdersManagement />;
}
