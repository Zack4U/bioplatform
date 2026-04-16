/**
 * App entry point — redirects to splash screen.
 */

import { Redirect } from "expo-router";

export default function Index() {
    return <Redirect href="/splash" />;
}
