#!/bin/bash
# ===========================================
# BioCommerce Caldas - Database Migrations Script
# ===========================================

set -e

# Configuración de Rutas
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$ROOT_DIR/src/Bio.Backend.Core"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        BioCommerce - Migraciones y Actualizaciones         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Elegir contexto
echo -e "${YELLOW}Selecciona el contexto para la migración:${NC}"
echo "1) BioDbContext (Transaccional - SQL Server)"
echo "2) ScientificDbContext (Científica - PostgreSQL)"
echo "3) Ambas"
read -p "Opción [1-3]: " CONTEXT_OPTION

CONTEXTS=()
case $CONTEXT_OPTION in
    1) CONTEXTS=("BioDbContext") ;;
    2) CONTEXTS=("ScientificDbContext") ;;
    3) CONTEXTS=("BioDbContext" "ScientificDbContext") ;;
    *) echo -e "${RED}Opción inválida. Saliendo...${NC}"; exit 1 ;;
esac

# 2. Ingresar nombre de migración
echo -e "\n${YELLOW}Ingresa el nombre de la migración (ej. InitialCreate):${NC}"
read -p "> " MIGRATION_NAME

if [ -z "$MIGRATION_NAME" ]; then
    echo -e "${RED}El nombre de la migración no puede estar vacío. Saliendo...${NC}"
    exit 1
fi

# Verificar directorio core
if [ ! -d "$CORE_DIR" ]; then
    echo -e "${RED}Error: No se encontró el directorio $CORE_DIR${NC}"
    echo -e "${YELLOW}Asegúrate de ejecutar este script desde la raíz del proyecto.${NC}"
    exit 1
fi

cd "$CORE_DIR"

# Función para ejecutar comandos con manejo de errores
run_command() {
    local cmd="$1"
    local desc="$2"
    
    echo -e "${YELLOW}▶ $desc...${NC}"
    echo -e "  Comando: $cmd"
    
    # Desactivar 'exit on error' temporalmente para capturar el error manual
    set +e
    eval "$cmd"
    local exit_code=$?
    set -e
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}❌ Error al ejecutar: $desc${NC}"
        echo -e "${RED}Revisa los logs arriba para más detalles.${NC}"
        exit $exit_code
    else
        echo -e "${GREEN}✓ Éxito: $desc${NC}"
    fi
}

echo ""
echo -e "${BLUE}Iniciando proceso para: ${CONTEXTS[*]}${NC}"
echo ""

for CONTEXT in "${CONTEXTS[@]}"; do
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE} Procesando contexto: $CONTEXT ${NC}"
    echo -e "${BLUE}=================================================${NC}"
    
    # Crear migración
    CMD_MIGRATE="dotnet ef migrations add \"$MIGRATION_NAME\" --context $CONTEXT -p Bio.Infrastructure -s Bio.API"
    run_command "$CMD_MIGRATE" "Creando migración '$MIGRATION_NAME' para $CONTEXT"
    
    echo ""
    
    # Actualizar BD
    CMD_UPDATE="dotnet ef database update --context $CONTEXT -p Bio.Infrastructure -s Bio.API"
    run_command "$CMD_UPDATE" "Actualizando base de datos para $CONTEXT"
    
    echo ""
done

echo -e "${GREEN}🎉 Proceso completado exitosamente para todas las bases de datos seleccionadas.${NC}"
echo ""
