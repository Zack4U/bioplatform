import { ProductsManagement } from "@/components/features/admin/products/ProductsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion de Productos" };

export default function ProductsPage() {
    return <ProductsManagement />;
}
