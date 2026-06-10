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
    port = int(os.getenv("CHROMA_PORT", 8001))
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "bioplatform_species_dev")

    # Ruta del archivo de semilla (compatible con host y Docker container)
    default_seed_dir = PROJECT_ROOT / "src" / "Bio.Backend.AI" / "data" / "species_catalog"
    seed_file = default_seed_dir / f"chroma_seed_{collection_name}.json"

    if not seed_file.exists():
        # Intentar ruta alternativa (ej. en Docker)
        alt_seed_dir = SCRIPT_DIR.parent.parent / "data" / "species_catalog"
        alt_seed_file = alt_seed_dir / f"chroma_seed_{collection_name}.json"
        if alt_seed_file.exists():
            seed_file = alt_seed_file

    if not seed_file.exists():
        print(f"[ERROR] No se encontró el archivo de semilla: {seed_file}")
        sys.exit(1)

    print(f"Cargando semilla desde {seed_file}...")
    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            seed_data = json.load(f)
    except Exception as e:
        print(f"[ERROR] Error al leer el archivo de semilla: {e}")
        sys.exit(1)

    ids = seed_data.get("ids", [])
    documents = seed_data.get("documents", [])
    metadatas = seed_data.get("metadatas", [])
    embeddings = seed_data.get("embeddings", [])

    total_docs = len(ids)
    print(f"Semilla cargada con {total_docs} documentos.")

    if total_docs == 0:
        print("No hay documentos para importar.")
        sys.exit(0)

    print(f"Conectando a ChromaDB en {host}:{port}...")
    try:
        client = chromadb.HttpClient(host=host, port=port)
        client.heartbeat()
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a ChromaDB: {e}")
        sys.exit(1)

    # Crear o recuperar colección con cosine distance (hnsw:space)
    collection = client.get_or_create_collection(
        name=collection_name, metadata={"hnsw:space": "cosine"}
    )
    print(f"Colección '{collection_name}' preparada.")

    # Ingestar en lotes de 100
    batch_size = 100
    print(f"Importando {total_docs} documentos en lotes de {batch_size}...")

    for i in range(0, total_docs, batch_size):
        b_ids = ids[i : i + batch_size]
        b_docs = documents[i : i + batch_size]
        b_meta = metadatas[i : i + batch_size]
        b_embs = embeddings[i : i + batch_size]

        print(f"Importando lote {i // batch_size + 1}/{(total_docs + batch_size - 1) // batch_size} ({len(b_ids)} elementos)...")
        try:
            collection.upsert(
                ids=b_ids,
                documents=b_docs,
                metadatas=b_meta,
                embeddings=b_embs
            )
        except Exception as e:
            print(f"[ERROR] Error al importar lote: {e}")
            sys.exit(1)

    print("¡Importación de semilla completada con éxito!")


if __name__ == "__main__":
    main()
