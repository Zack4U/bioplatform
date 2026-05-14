import os
import logging
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import chromadb
from google import genai
from google.genai import types

from app.core.config import get_settings

router = APIRouter(prefix="/api/v1/assistant", tags=["Assistant"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str # 'user' or 'model' (GenAI uses 'model' instead of 'assistant')
    content: str

class AskRequest(BaseModel):
    question: str
    history: list[ChatMessage] = []

class AskResponse(BaseModel):
    answer: str

def get_chroma_client():
    settings = get_settings()
    return chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)

def execute_sql_query(query: str) -> str:
    """
    Ejecuta una consulta SQL de solo lectura en la base de datos de BioPlatform.
    Usa esta herramienta para conteos, estadísticas y listados generales.
    """
    try:
        from sqlalchemy import create_engine, text
        from app.core.config import get_settings
        settings = get_settings()
        # Convertimos el DSN de asyncpg a psycopg2 o similar si es necesario, 
        # pero para SQL Server/Postgres podemos usar el DSN directamente con el driver adecuado.
        # Simplificación: Usar el DSN de sincronización definido en config.py
        sync_dsn = settings.pg_dsn_sync
        engine = create_engine(sync_dsn)
        
        with engine.connect() as conn:
            # Forzamos que sea solo lectura (SELECT)
            if not query.strip().lower().startswith("select"):
                return "Error: Solo se permiten consultas de lectura (SELECT)."
            
            result = conn.execute(text(query))
            rows = result.all()
            if not rows:
                return "No se encontraron resultados."
            
            return str([dict(row._mapping) for row in rows])
    except Exception as e:
        error_msg = f"Error ejecutando SQL: {str(e)}"
        logger.error(error_msg)
        return error_msg

def get_table_schema(table_name: str) -> str:
    """
    Devuelve los nombres de las columnas y tipos de datos de una tabla.
    Usa esta herramienta para conocer la estructura antes de hacer una consulta SQL.
    """
    try:
        from sqlalchemy import create_engine, text
        from app.core.config import get_settings
        settings = get_settings()
        engine = create_engine(settings.pg_dsn_sync)
        
        with engine.connect() as conn:
            query = f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position;
            """
            result = conn.execute(text(query))
            rows = result.all()
            if not rows:
                return f"No se encontró información para la tabla '{table_name}'."
            
            return str([dict(row._mapping) for row in rows])
    except Exception as e:
        return f"Error obteniendo esquema: {str(e)}"

def list_database_tables() -> str:
    """
    Devuelve una lista de todas las tablas disponibles en la base de datos.
    Usa esta herramienta si no sabes por dónde empezar a buscar.
    """
    try:
        from sqlalchemy import create_engine, text
        from app.core.config import get_settings
        settings = get_settings()
        engine = create_engine(settings.pg_dsn_sync)
        
        with engine.connect() as conn:
            query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
            result = conn.execute(text(query))
            rows = result.all()
            return str([row[0] for row in rows])
    except Exception as e:
        return f"Error listando tablas: {str(e)}"

@router.post("/ask", response_model=AskResponse)
async def ask_assistant(request: AskRequest):
    if not request.question:
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")

    settings = get_settings()
    gemini_api_key = settings.google_ai_api_key or os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY no está configurada.")
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no está configurada.")

    try:
        # Inicializar clientes
        genai_client = genai.Client(api_key=gemini_api_key)
        
        # 1. Recuperación de contexto profunda (RAG)
        chroma_client = get_chroma_client()
        collection_name = settings.chroma_collection_name
        context_text = ""
        try:
            collection = chroma_client.get_collection(name=collection_name)
            embed_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={gemini_api_key}"
            embed_payload = {"model": "models/gemini-embedding-001", "content": {"parts": [{"text": request.question}]}}
            emb_res = requests.post(embed_url, json=embed_payload)
            if emb_res.status_code == 200:
                query_embedding = emb_res.json()["embedding"]["values"]
                # Mantenemos los 50 resultados para máxima "inteligencia"
                search_results = collection.query(query_embeddings=[query_embedding], n_results=50)
                documents = search_results["documents"][0] if search_results["documents"] else []
                context_text = "\n\n".join([f"- {doc}" for doc in documents])
        except Exception as ce:
            logger.warning(f"ChromaDB no disponible: {ce}")

        # 2. Configuración del Agente Autónomo
        system_prompt = (
            "Eres el Asesor Experto de BioPlatform, una IA avanzada para la gestión de biodiversidad en Caldas.\n\n"
            "REGLA DE ORO: Para preguntas cuantitativas (cuántos, totales, promedios, listados de más de 5 especies), DEBES usar SQL.\n"
            "El contexto de VECTORES es útil para descripciones y detalles, pero SQL es la fuente de verdad para estadísticas.\n\n"
            "TUS HERRAMIENTAS:\n"
            "1. `list_database_tables`: Úsala primero si no conoces las tablas.\n"
            "2. `get_table_schema`: Úsala para conocer las columnas de una tabla (ej. 'species').\n"
            "3. `execute_sql_query`: Úsala para obtener datos reales. SIEMPRE verifica el esquema antes.\n\n"
            "INSTRUCCIONES DE RESPUESTA:\n"
            "- Si el usuario pregunta '¿cuántas especies hay?', NO uses el contexto de vectores; consulta la tabla `species` con SQL.\n"
            "- Si el usuario pregunta por 'plantas' o 'animales', busca la columna de 'kingdom' o similar en la tabla `species`.\n"
            "- Combina la precisión de SQL con la riqueza descriptiva de los VECTORES.\n"
            "- Si no encuentras una tabla, lístalas todas.\n\n"
            f"CONTEXTO INICIAL DE VECTORES (limitado a top-k):\n{context_text}"
        )

        # 3. Chat Híbrido con Herramientas e Historial
        # Convertimos el historial al formato del SDK (Content)
        genai_history = []
        for msg in request.history:
            genai_history.append(types.Content(
                role=msg.role,
                parts=[types.Part(text=msg.content)]
            ))

        chat = genai_client.chats.create(
            model=settings.google_model_name,
            history=genai_history,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=[execute_sql_query, get_table_schema, list_database_tables],
                temperature=0.2
            )
        )

        response = chat.send_message(request.question)
        
        # Extraer texto de la respuesta final
        answer_text = response.text
        
        if not answer_text:
            logger.warning("La IA devolvió una respuesta de texto vacía. Revisando partes...")
            # Intentar reconstruir si hay partes de texto
            parts = []
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if part.text:
                        parts.append(part.text)
            answer_text = "\n".join(parts) if parts else "La IA procesó la información pero no generó un resumen textual. Por favor, intenta reformular la pregunta."

        return AskResponse(answer=answer_text)

    except Exception as e:
        logger.error(f"Error en la generación de respuesta: {e}")
        raise HTTPException(status_code=500, detail=str(e))
