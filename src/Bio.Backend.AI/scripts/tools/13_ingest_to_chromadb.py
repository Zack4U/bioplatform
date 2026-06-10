import json
import os
import sys
import time
from pathlib import Path

import chromadb
import requests
from dotenv import load_dotenv

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
DATA_DIR = PROJECT_ROOT / "src" / "Bio.Backend.AI" / "data" / "species_catalog"
TRADITIONAL_USES_FILE = DATA_DIR / "species_traditional_uses.json"
ECONOMIC_POTENTIAL_FILE = DATA_DIR / "species_economic_potential.json"


def get_chroma_client():
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", 8000))
    print(f"Conectando a ChromaDB en {host}:{port}...")
    try:
        client = chromadb.HttpClient(host=host, port=port)
        client.heartbeat()
        return client
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a ChromaDB: {e}")
        sys.exit(1)


def get_embeddings_batch(
    texts: list[str], api_key: str, retries: int = 5
) -> list[list[float]]:
    """Obtiene embeddings para un lote de textos usando la API REST de Gemini con reintentos."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key={api_key}"

    requests_data = []
    for text in texts:
        requests_data.append(
            {
                "model": "models/gemini-embedding-001",
                "content": {"parts": [{"text": text}]},
            }
        )

    payload = {"requests": requests_data}

    for attempt in range(retries):
        try:
            response = requests.post(url, json=payload, timeout=60)

            if response.status_code == 200:
                data = response.json()
                return [emb["values"] for emb in data.get("embeddings", [])]

            if response.status_code == 429:
                wait_time = 90
                print(
                    f"[REINTENTO] Cuota excedida. Esperando {wait_time}s antes del intento {attempt + 1}..."
                )
                time.sleep(wait_time)
                continue

            print(f"[ERROR] Error de API ({response.status_code}): {response.text}")
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            print(f"[REINTENTO] Error de conexión ({e}). Reintentando en 10s...")
            time.sleep(10)
            continue
        except Exception as e:
            print(f"[ERROR] Error inesperado: {e}")

        break

    return []


def main():
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("[ERROR] GEMINI_API_KEY no encontrado en .env")
        sys.exit(1)

    chroma_client = get_chroma_client()
    collection_name = os.getenv("CHROMA_COLLECTION_NAME", "bioplatform_species_dev")

    # Intentar obtener la colección, si existe, agregar nuevos (ya no hacemos limpieza)
    # try:
    #     chroma_client.delete_collection(name=collection_name)
    #     print(f"Colección {collection_name} borrada para iniciar carga limpia con nuevo modelo.")
    # except Exception:
    #     pass

    collection = chroma_client.get_or_create_collection(
        name=collection_name, metadata={"hnsw:space": "cosine"}
    )
    print(f"Colección '{collection_name}' preparada exitosamente.")

    docs = []
    metadatas = []
    ids = []

    # Cargar Usos Tradicionales
    if TRADITIONAL_USES_FILE.exists():
        print(f"Cargando {TRADITIONAL_USES_FILE}...")
        with open(TRADITIONAL_USES_FILE, "r", encoding="utf-8") as f:
            uses_data = json.load(f)

        for i, item in enumerate(uses_data):
            species = item.get("scientific_name", "Desconocida")
            for j, use in enumerate(item.get("traditional_uses", [])):
                text_content = (
                    f"Especie: {species}\n"
                    f"Parte: {use.get('part', '')}\n"
                    f"Propósito: {use.get('specific_purpose', '')}\n"
                    f"Preparación: {use.get('preparation_method', '')}\n"
                    f"Descripción: {use.get('description', '')}\n"
                    f"Comunidad: {use.get('community', '')}"
                )

                docs.append(text_content)
                metadatas.append({"species": species, "type": "traditional_use"})
                ids.append(f"use_{i}_{j}")
    else:
        print(f"[WARN] No se encontró {TRADITIONAL_USES_FILE}")

    # Cargar Potencial Económico
    if ECONOMIC_POTENTIAL_FILE.exists():
        print(f"Cargando {ECONOMIC_POTENTIAL_FILE}...")
        with open(ECONOMIC_POTENTIAL_FILE, "r", encoding="utf-8") as f:
            pot_data = json.load(f)

        for i, item in enumerate(pot_data):
            species = item.get("scientific_name", "Desconocida")
            for j, pot in enumerate(item.get("economic_potential", [])):
                products = ", ".join(pot.get("products", []))
                active_props = ", ".join(pot.get("active_properties", []))
                text_content = (
                    f"Especie: {species}\n"
                    f"Sector Económico: {pot.get('sector', '')}\n"
                    f"Productos: {products}\n"
                    f"Propiedades Activas: {active_props}\n"
                    f"Descripción: {pot.get('description', '')}"
                )

                docs.append(text_content)
                metadatas.append({"species": species, "type": "economic_potential"})
                ids.append(f"pot_{i}_{j}")
    else:
        print(f"[WARN] No se encontró {ECONOMIC_POTENTIAL_FILE}")

    total_docs = len(docs)
    print(f"Total de documentos a ingestar: {total_docs}")

    if total_docs == 0:
        print("No hay datos para ingestar.")
        sys.exit(0)

    # Ingestar en Lotes de 100 para mayor velocidad (ajustado según solicitud)
    batch_size = 100

    # Obtener IDs existentes para saltar duplicados y no gastar cuota
    print("Verificando documentos ya existentes en ChromaDB...")
    existing_ids = set(collection.get(include=[])["ids"])
    print(f"Detectados {len(existing_ids)} documentos ya cargados.")

    for i in range(0, total_docs, batch_size):
        batch_docs_all = docs[i : i + batch_size]
        batch_metadatas_all = metadatas[i : i + batch_size]
        batch_ids_all = ids[i : i + batch_size]

        # Filtrar solo los que NO existen
        batch_docs = []
        batch_metadatas = []
        batch_ids = []

        for idx in range(len(batch_ids_all)):
            if batch_ids_all[idx] not in existing_ids:
                batch_docs.append(batch_docs_all[idx])
                batch_metadatas.append(batch_metadatas_all[idx])
                batch_ids.append(batch_ids_all[idx])

        if not batch_ids:
            print(
                f"Lote {i // batch_size + 1} ya está completo en ChromaDB. Saltando..."
            )
            continue

        print(
            f"Generando embeddings e ingestado lote {i // batch_size + 1}/{(total_docs // batch_size) + 1} ({len(batch_ids)} nuevos documentos)..."
        )

        try:
            batch_embeddings = get_embeddings_batch(batch_docs, gemini_api_key)

            if not batch_embeddings:
                print(
                    f"[WARN] No se obtuvieron embeddings para el lote {i // batch_size + 1}"
                )
                continue

            collection.upsert(
                documents=batch_docs,
                embeddings=batch_embeddings,
                metadatas=batch_metadatas,
                ids=batch_ids,
            )
        except Exception as e:
            print(f"[ERROR] Lote falló: {e}")

        # Espera de 8 segundos entre lotes para no saturar la cuota
        time.sleep(8)

    print("¡Ingesta completada exitosamente!")


if __name__ == "__main__":
    main()
