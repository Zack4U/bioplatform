import json
import os
import sys
from pathlib import Path
import chromadb
from dotenv import load_dotenv

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

def main():
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)

    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", 8001))  # Default to 8001 since docker maps it there
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "bioplatform_species_dev")

    print(f"Conectando a ChromaDB en {host}:{port}...")
    try:
        client = chromadb.HttpClient(host=host, port=port)
        client.heartbeat()
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a ChromaDB: {e}")
        sys.exit(1)

    try:
        collection = client.get_collection(name=collection_name)
        count = collection.count()
        print(f"Colección '{collection_name}' encontrada con {count} documentos.")
    except Exception as e:
        print(f"[ERROR] No se pudo obtener la colección '{collection_name}': {e}")
        sys.exit(1)

    if count == 0:
        print("La colección está vacía. No hay nada que exportar.")
        sys.exit(0)

    print("Obteniendo todos los documentos con sus embeddings...")
    try:
        # Traer todos los elementos especificando un limit igual al count
        data = collection.get(
            include=["documents", "metadatas", "embeddings"],
            limit=count
        )
    except Exception as e:
        print(f"[ERROR] Error al obtener los datos de la colección: {e}")
        sys.exit(1)

    export_data = {
        "collection_name": collection_name,
        "count": count,
        "ids": data.get("ids", []),
        "documents": data.get("documents", []),
        "metadatas": data.get("metadatas", []),
        "embeddings": data.get("embeddings", [])
    }

    # Ruta de exportación (compatible con host y Docker container)
    default_out_dir = PROJECT_ROOT / "src" / "Bio.Backend.AI" / "data" / "species_catalog"
    if not default_out_dir.parent.exists():
        # Estructura de producción dentro del contenedor
        default_out_dir = SCRIPT_DIR.parent.parent / "data" / "species_catalog"

    default_out_dir.mkdir(parents=True, exist_ok=True)
    out_file = default_out_dir / f"chroma_seed_{collection_name}.json"

    print(f"Guardando datos en {out_file}...")
    try:
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        print("¡Exportación completada exitosamente!")
    except Exception as e:
        print(f"[ERROR] No se pudo guardar el archivo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
