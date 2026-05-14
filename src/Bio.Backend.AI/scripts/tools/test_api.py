import os
import requests
from dotenv import load_dotenv
from pathlib import Path

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

    print(f"Probando API Key: {api_key[:10]}...")
    
    # 1. Probar listar modelos
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    print(f"Consultando: {url}")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"\nModelos encontrados ({len(models)}):")
            for m in models:
                if "embedContent" in m.get("supportedGenerationMethods", []):
                    print(f" - {m['name']} ({m['displayName']})")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Excepción: {e}")

if __name__ == "__main__":
    main()
