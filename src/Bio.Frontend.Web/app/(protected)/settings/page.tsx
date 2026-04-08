/**
 * Settings page — redirects to /profile (settings tab).
 * This ensures Navbar "Configuracion" links work properly.
 *
 * @route /settings
 */

import { redirect } from "next/navigation";

export default function SettingsPage() {
    redirect("/profile");
}
