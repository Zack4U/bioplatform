/**
 * /my-products → REDIRECT to /admin/products
 *
 * Product management was consolidated under (protected)/admin/products
 * to follow the established admin architecture pattern.
 * This page exists only to provide a redirect for any existing bookmarks.
 */

import { redirect } from "next/navigation";

export default function MyProductsRedirectPage() {
    redirect("/admin/products");
}
