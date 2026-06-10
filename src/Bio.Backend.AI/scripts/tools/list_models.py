import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"


def main():
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY no encontrado")
        return

    client = genai.Client(api_key=api_key)
    print(f"Usando API Key: {api_key[:10]}...")
    print("Listando modelos disponibles para tu cuenta:\n")

    try:
        models = client.models.list()
        for model in models:
            methods = ", ".join(model.supported_generation_methods)
            print(f"- {model.name}")
            print(f"  Nombre: {model.display_name}")
            print(f"  Métodos: {methods}\n")
    except Exception as e:
        print(f"Error al listar modelos: {e}")


if __name__ == "__main__":
    main()
