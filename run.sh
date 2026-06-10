#!/bin/bash
# ===========================================
# BioCommerce Caldas - Run Services Script (Linux/macOS/Git Bash)
# ===========================================

set -e

# Configuración de Rutas
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detectar sistema operativo
UNAME_S=$(uname -s 2>/dev/null || echo "unknown")
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$UNAME_S" == "Darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$UNAME_S" == "MINGW"* ]] || [[ "$UNAME_S" == "MSYS"* ]] || [[ "$UNAME_S" == "CYGWIN"* ]]; then
    OS="git-bash-windows"
elif grep -qi "microsoft" /proc/version 2>/dev/null || grep -qi "wsl" /proc/version 2>/dev/null; then
    OS="git-bash-windows"
else
    OS="linux"
fi

# Verificar si tmux está disponible (opcional para Linux/Mac)
USE_TMUX=false
if command -v tmux &> /dev/null; then
    USE_TMUX=true
fi

# Argumentos
if [ $# -eq 0 ] || [ "$1" = "all" ]; then
    SERVICES=("docker" "core" "ai" "web")
else
    SERVICES=("$@")
fi

function open_terminal() {
    local TITLE=$1
    local WORK_DIR=$2
    local CMD=$3
    local FULL_PATH="$ROOT_DIR/$WORK_DIR"
    
    case "$OS" in
        "git-bash-windows")
            # ESTRATEGIA ROBUSTA: Archivo temporal
            # Creamos un script temporal para evitar problemas de comillas con 'start'
            local TEMP_SCRIPT=".launcher_$TITLE.sh"
            
            echo "#!/bin/bash" > "$TEMP_SCRIPT"
            echo "echo -e '\033[1;33m=== $TITLE ===\033[0m'" >> "$TEMP_SCRIPT"
            # Usamos comillas dobles para que $FULL_PATH se expanda correctamente
            echo "cd \"$FULL_PATH\" || { echo 'Error: No se pudo entrar al directorio'; read -p 'Enter para salir...'; exit 1; }" >> "$TEMP_SCRIPT"
            echo "$CMD" >> "$TEMP_SCRIPT"
            echo "echo ''" >> "$TEMP_SCRIPT"
            echo "read -p 'Proceso terminado. Presiona Enter para cerrar...' key" >> "$TEMP_SCRIPT"
            
            # Ejecutar en nueva ventana
            if command -v mintty &> /dev/null; then
                # Si existe mintty (consola default de Git Bash), es mejor
                mintty -t "$TITLE" -e bash "$TEMP_SCRIPT" &
            elif command -v cmd.exe &> /dev/null; then
                # Soporte para WSL u otros entornos en Windows
                cmd.exe /c start bash "$TEMP_SCRIPT"
            else
                # Fallback a start bash
                start "" bash "$TEMP_SCRIPT"
            fi
            
            # Limpieza: Borrar el script después de un momento (el proceso lanzado ya lo habrá leído)
            (sleep 2 && rm -f "$TEMP_SCRIPT") &
        ;;
        
        "macOS")
            osascript <<EOF
tell application "Terminal"
    do script "echo -e '\033[1;33m$TITLE\033[0m'; cd '$FULL_PATH' && $CMD"
end tell
EOF
        ;;
        
        "linux")
            if [ "$USE_TMUX" = true ]; then
                tmux new-window -t bioplatform -n "$TITLE" -c "$FULL_PATH" "$CMD; bash" 2>/dev/null || \
                tmux new-session -d -s bioplatform -n "$TITLE" -c "$FULL_PATH" "$CMD; bash"
                elif command -v gnome-terminal &> /dev/null; then
                gnome-terminal --title="$TITLE" -- bash -c "cd '$FULL_PATH' && $CMD; bash"
            else
                xterm -T "$TITLE" -e "cd '$FULL_PATH' && $CMD; bash" &
            fi
        ;;
    esac
}

function start_service() {
    local SERVICE=$1
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}▶ Iniciando: $SERVICE${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    case ${SERVICE,,} in
        docker|infra)
            echo -e "${YELLOW}🐳 Infraestructura (Docker Compose)${NC}"
            open_terminal "docker" "." "docker-compose up -d"
            echo -e "${GREEN}✓ Docker levantado${NC}"
        ;;
        
        core)
            echo -e "${YELLOW}📦 Backend .NET${NC}"
            # CORRECCIÓN DE RUTA .NET:
            # Agregamos 'src/' adicional ya que la estructura Clean Architecture suele ser src/Bio.Backend.Core/src/Bio.API
            # Si esto falla, cambia a "Bio.API/Bio.API.csproj"
            open_terminal "core" "src/Bio.Backend.Core" "dotnet watch run --project Bio.API/Bio.API.csproj"
            echo -e "${GREEN}✓ Backend iniciando...${NC}"
        ;;
        
        ai)
            echo -e "${YELLOW}🐍 AI Service (Local Conda)${NC}"
            # Ejecución local usando el entorno Conda bio-ai
            open_terminal "ai" "src/Bio.Backend.AI" "conda run --no-capture-output -n bio-ai uvicorn app.main:app --reload --port 8000"
            echo -e "${GREEN}✓ AI Service iniciando localmente con Conda...${NC}"
        ;;
        
        web)
            echo -e "${YELLOW}⚛️  Frontend Web${NC}"
            open_terminal "web" "src/Bio.Frontend.Web" "npm run dev"
            echo -e "${GREEN}✓ Frontend Web iniciando...${NC}"
        ;;
        
        mobile)
            echo -e "${YELLOW}📱 Frontend Mobile${NC}"
            open_terminal "mobile" "src/Bio.Frontend.Mobile" "npx expo start"
            echo -e "${GREEN}✓ Frontend Mobile iniciando...${NC}"
        ;;

        docs)
            echo -e "${YELLOW}📚 Documentación (Mintlify)${NC}"
            open_terminal "docs" ".docs" "npm run docs"
            echo -e "${GREEN}✓ Documentación iniciando...${NC}"
        ;;

        *)
            echo -e "${RED}⚠️  Servicio desconocido: $SERVICE${NC}"
        ;;
    esac
}

# Header
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        BioPlatform Caldas - Development Orchestrator       ║${NC}"
echo -e "${GREEN}║                  OS: $OS                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

# Inicializar Tmux si es Linux/Mac y está activo
if [ "$OS" == "linux" ] && [ "$USE_TMUX" = true ]; then
    tmux kill-session -t bioplatform 2>/dev/null || true
    tmux new-session -d -s bioplatform -n "dashboard"
    echo -e "${BLUE}📌 Usando sesión tmux: bioplatform${NC}"
fi

# Loop principal
VALID_SERVICES=("docker" "infra" "core" "ai" "web" "mobile" "docs" "all")

for SERVICE in "${SERVICES[@]}"; do
    if [[ " ${VALID_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
        start_service "$SERVICE"
        sleep 1
    else
        echo -e "${RED}⚠️  Servicio desconocido: $SERVICE${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📍 URLs de Acceso:${NC}"
echo -e "   Frontend Web:   http://localhost:3000"
echo -e "   Backend API:    http://localhost:5070"
echo -e "   AI Service:     http://localhost:8000"
echo -e "   Documentación:  http://localhost:3333"
echo ""

if [ "$OS" == "git-bash-windows" ]; then
    echo -e "${YELLOW}💡 Nota: Se han abierto ventanas independientes para cada servicio.${NC}"
fi