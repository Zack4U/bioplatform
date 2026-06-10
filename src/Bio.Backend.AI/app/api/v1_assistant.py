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

def execute_transactional_sql_query(query: str) -> str:
    """
    Ejecuta una consulta SQL en la base de datos TRANSACCIONAL (SQL Server).
    Usa esta herramienta para consultar productos, permisos ABS, usuarios y pedidos.
    """
    try:
        import pymssql
        from app.core.config import get_settings
        settings = get_settings()
        
        conn = pymssql.connect(
            server=settings.mssql_host,
            port=str(settings.mssql_port),
            user=settings.mssql_user,
            password=settings.mssql_password,
            database=settings.mssql_database
        )
        cursor = conn.cursor(as_dict=True)
        
        if not query.strip().lower().startswith("select"):
            return "Error: Solo se permiten consultas de lectura (SELECT)."
            
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return "No se encontraron resultados en la base de datos transaccional."
            
        return str(rows)
    except Exception as e:
        return f"Error en SQL Transaccional: {str(e)}"

def list_transactional_tables() -> str:
    """
    Devuelve las tablas de la base de datos TRANSACCIONAL (Productos, Permisos, etc).
    """
    return execute_transactional_sql_query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")

def get_transactional_table_schema(table_name: str) -> str:
    """
    Devuelve las columnas y tipos de datos de una tabla en la base de datos TRANSACCIONAL (SQL Server).
    Usa esta herramienta ANTES de consultar AbsPermits, Products, Orders, Certifications, etc.
    """
    return execute_transactional_sql_query(
        f"SELECT column_name, data_type FROM information_schema.columns "
        f"WHERE table_name = '{table_name}' ORDER BY ordinal_position"
    )

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
            "Eres el Asesor Experto de BioPlatform, una IA avanzada que conecta la ciencia con el biocomercio en Caldas.\n\n"
            "REGLAS DE ORO:\n"
            "1. Para datos CIENTÍFICOS (especies, taxonomía, usos tradicionales): Usa SQL en la base de datos científica (Postgres).\n"
            "2. Para datos COMERCIALES/LEGALES (productos, permisos ABS, certificaciones): Usa `execute_transactional_sql_query` (SQL Server).\n"
            "3. Para descripciones ricas y contexto: Usa el contexto de VECTORES.\n"
            "4. FORMATO OBLIGATORIO: NO uses formato Markdown en ningún momento (nada de asteriscos ***, **, numerales #, ni viñetas con *). Escribe siempre texto natural, plano y fluido, usando párrafos normales, mayúsculas y saltos de línea para estructurar la información.\n\n"
            "EXPERTO EN NEGOCIOS Y MERCADOS:\n"
            "- Cuando se te solicite generar un 'plan de negocios' o un 'análisis de mercado' (ej: para aceite de cacay, extractos, etc.), actúa como un Consultor Experto en Biocomercio enfocado específicamente en la región de Caldas, Colombia.\n"
            "- Para planes de negocio, usa una estructura profesional: Resumen Ejecutivo, Análisis de Mercado local/internacional, Modelo de Negocio, Estrategia Legal (Permisos ABS), Sostenibilidad y Proyecciones.\n"
            "- Para análisis de mercado, profundiza en: Demanda local (Caldas/Colombia) e internacional, Competencia, Canales de Distribución y Tendencias de consumo sostenible.\n"
            "- Usa tu conocimiento general para complementar la información si las tablas SQL no tienen datos suficientes sobre el producto, pero siempre manteniendo el enfoque principal y local en Caldas.\n\n"
            "ESTRUCTURA DE DATOS:\n"
            "- Base Científica (Postgres): Tablas como `species`, `taxonomy`, `species_economic_potentials`, `species_traditional_uses`.\n"
            "- Base Transaccional (SQL Server): Tablas como `Products`, `AbsPermits`, `Certifications`, `Orders`.\n\n"
            "INSTRUCCIONES:\n"
            "- NUNCA adivines nombres de columnas. Si no estás seguro de los campos, usa `get_table_schema`.\n"
            "- Para tablas de SQL Server (AbsPermits, Products, Orders, Certifications), usa `get_transactional_table_schema` para ver sus columnas ANTES de consultar.\n"
            "- Para tablas de Postgres (species, taxonomy), usa `get_table_schema`.\n"
            "- **RAZONAMIENTO HÍBRIDO**: Las preguntas no siempre son literales. Si el usuario pregunta por 'hábitat', 'clima' o 'colores', usa el contexto de VECTORES y tu propia inteligencia para clasificar las especies encontradas en SQL.\n"
            "- **FLUJO RECOMENDADO**: 1. Obtén una lista general de especies con SQL. 2. Contrasta esa lista con el contexto de VECTORES y tu conocimiento.\n"
            "- Si el usuario pregunta por 'permisos ABS', busca en `AbsPermits`.\n"
            "- Si pregunta por 'productos', busca en `Products`.\n"
            "- Siempre conecta la información: ej. qué productos se derivan de una especie científica.\n\n"
            "**PAGINACIÓN INTELIGENTE (OBLIGATORIA)**:\n"
            "- Cuando el usuario pida 'lista' o 'listado' de cualquier entidad, NUNCA traigas todos los registros de golpe.\n"
            "- Flujo obligatorio para listados:\n"
            "  1. Primero haz un SELECT COUNT(*) para saber el total.\n"
            "  2. Luego haz SELECT TOP 10 (SQL Server) o SELECT ... LIMIT 10 (Postgres) para los primeros registros.\n"
            "  3. En tu respuesta, muestra los 10 resultados Y menciona: 'Mostrando 10 de X registros. Puedes pedirme más o filtrar por criterio específico.'\n"
            "- Esto aplica para AbsPermits, Products, species, orders, etc.\n\n"
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
                tools=[
                    execute_sql_query, 
                    get_table_schema, 
                    list_database_tables,
                    execute_transactional_sql_query,
                    list_transactional_tables,
                    get_transactional_table_schema
                ],
                temperature=0.2
            )
        )

        # Enviar mensaje con reintentos automáticos para errores transitorios (503, 429)
        import time as _time
        response = None
        last_error = None
        for attempt in range(3):
            try:
                response = chat.send_message(request.question)
                break  # Éxito, salir del loop
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "503" in err_str or "429" in err_str or "UNAVAILABLE" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    wait_secs = (attempt + 1) * 10  # 10s, 20s, 30s
                    logger.warning(f"Error transitorio en intento {attempt + 1}: {e}. Reintentando en {wait_secs}s...")
                    _time.sleep(wait_secs)
                else:
                    raise  # Error no transitorio, relanzar inmediatamente
        
        if response is None:
            raise last_error
        
        # Extraer texto de la respuesta final con manejo robusto de NoneType
        answer_text = None
        try:
            answer_text = response.text
        except Exception:
            pass
        
        if not answer_text:
            logger.warning("La IA devolvió una respuesta de texto vacía. Intentando recuperar partes...")
            parts = []
            candidates = getattr(response, "candidates", None)
            if candidates:
                for candidate in candidates:
                    content = getattr(candidate, "content", None)
                    if content:
                        for part in (getattr(content, "parts", None) or []):
                            text = getattr(part, "text", None)
                            if text:
                                parts.append(text)
            
            if parts:
                answer_text = "\n".join(parts)
            else:
                # Segundo intento: forzar resumen
                logger.warning("No se encontraron partes. Forzando resumen a la IA...")
                followup = chat.send_message(
                    "Ya tienes la información necesaria de las herramientas. "
                    "Por favor, escribe ahora un resumen claro y completo en español para el usuario."
                )
                try:
                    answer_text = followup.text
                except Exception:
                    pass
                answer_text = answer_text or "La consulta fue procesada pero no pudo generarse una respuesta de texto. Por favor, intenta reformular la pregunta."

        return AskResponse(answer=answer_text)

    except Exception as e:
        logger.error(f"Error en la generación de respuesta: {e}")
        raise HTTPException(status_code=500, detail=str(e))
