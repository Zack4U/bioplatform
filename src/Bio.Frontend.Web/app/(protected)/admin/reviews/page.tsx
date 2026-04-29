import { ReviewsManagement } from "@/components/features/admin/reviews/ReviewsManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Administracion de Resenas" };

export default function ReviewsPage() {
    return <ReviewsManagement />;
}
