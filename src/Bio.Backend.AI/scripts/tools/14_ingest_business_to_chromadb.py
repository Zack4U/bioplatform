import os
import time
from pathlib import Path

import chromadb
import pymssql
import requests
from dotenv import load_dotenv

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


def get_chroma_client():
    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", 8000))
    return chromadb.HttpClient(host=host, port=port)


def get_embeddings_batch(texts: list[str], api_key: str) -> list[list[float]]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key={api_key}"
    requests_data = [
        {"model": "models/gemini-embedding-001", "content": {"parts": [{"text": t}]}}
        for t in texts
    ]
    payload = {"requests": requests_data}

    for _ in range(3):
        try:
            response = requests.post(url, json=payload, timeout=60)
            if response.status_code == 200:
                return [emb["values"] for emb in response.json().get("embeddings", [])]
            if response.status_code == 429:
                time.sleep(60)
                continue
        except Exception as e:
            print(f"Error embedding: {e}")
            time.sleep(5)
    return []


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY no encontrada.")
        return

    # 1. Obtener Datos de SQL Server
    print("Extrayendo datos de SQL Server...")
    try:
        conn = pymssql.connect(
            server="localhost",
            port="1433",
            user="sa",
            password="DevPassword123!",
            database="BioCommerce_Transactional",
        )
        cursor = conn.cursor(as_dict=True)

        # Productos
        cursor.execute(
            "SELECT Name, Description, Composition, BasePrice FROM Products WHERE IsActive = 1"
        )
        products = cursor.fetchall()

        # Permisos ABS
        cursor.execute(
            "SELECT ResolutionNumber, Status, LegalFramework FROM AbsPermits"
        )
        permits = cursor.fetchall()

        conn.close()
    except Exception as e:
        print(f"Error BD: {e}")
        return

    # 2. Preparar Documentos
    docs = []
    metadatas = []
    ids = []

    for p in products:
        text = f"Producto: {p['Name']}\nDescripción: {p['Description']}\nComposición: {p['Composition']}\nPrecio: {p['BasePrice']}"
        docs.append(text)
        metadatas.append({"type": "product", "name": p["Name"]})
        ids.append(f"prod_{hash(p['Name'])}")

    for p in permits:
        text = f"Permiso ABS: {p['ResolutionNumber']}\nEstado: {p['Status']}\nMarco Legal: {p['LegalFramework']}"
        docs.append(text)
        metadatas.append({"type": "abs_permit", "resolution": p["ResolutionNumber"]})
        ids.append(f"abs_{hash(p['ResolutionNumber'])}")

    # 3. Ingestar en Chroma
    print(f"Ingestando {len(docs)} documentos comerciales...")
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=os.getenv("CHROMA_COLLECTION_NAME", "bioplatform_species_dev")
    )

    # Lotes de 50 para seguridad
    batch_size = 50
    for i in range(0, len(docs), batch_size):
        b_docs = docs[i : i + batch_size]
        b_meta = metadatas[i : i + batch_size]
        b_ids = ids[i : i + batch_size]

        embeddings = get_embeddings_batch(b_docs, api_key)
        if embeddings:
            collection.upsert(
                ids=b_ids, documents=b_docs, metadatas=b_meta, embeddings=embeddings
            )
            print(f"Lote {i // batch_size + 1} completado.")
        time.sleep(5)

    print("¡Memoria Semántica de Negocios actualizada!")


if __name__ == "__main__":
    main()
