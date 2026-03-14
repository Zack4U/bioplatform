import { View, Text } from "react-native";
import { Link } from "expo-router";
import { Button } from "../components/ui/button";

export default function IndexScreen() {
    return (
        <View className="flex-1 items-center justify-center p-6 bg-background">
            <Text className="text-2xl font-bold mb-4 text-foreground">
                BioCommerce Caldas
            </Text>
            <Text className="text-muted-foreground text-center mb-10">
                Bienvenido a la aplicación móvil. Navega a la página de pruebas
                para verificar la correcta alineación de los estilos UI transferidos desde la web.
            </Text>
            <Link href="/test" asChild>
                <Button>
                    <Text className="text-primary-foreground font-semibold">
                        Ver Página de Pruebas
                    </Text>
                </Button>
            </Link>
        </View>
    );
}
