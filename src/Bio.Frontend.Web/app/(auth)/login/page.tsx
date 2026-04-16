import { LoginForm } from "@/components/features/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesion",
    description:
        "Inicia sesion en BioCommerce Caldas para acceder al marketplace y catalogo de biodiversidad.",
};

export default function LoginPage() {
    return <LoginForm />;
}
