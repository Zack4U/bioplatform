import { RegisterForm } from "@/components/features/auth/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Crear Cuenta",
    description:
        "Registrate en BioCommerce Caldas para acceder al marketplace de biodiversidad y biocomercio.",
};

export default function RegisterPage() {
    return <RegisterForm />;
}
