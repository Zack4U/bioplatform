import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("../../../.env")

pg_host = os.getenv("PG_HOST", "localhost")
pg_port = os.getenv("PG_PORT", "5433")
pg_user = os.getenv("PG_USER", "postgres")
pg_password = os.getenv("PG_PASSWORD", "DevPassword123!")
pg_database = os.getenv("PG_DATABASE", "BioCommerce_Scientific")

dsn = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
engine = create_engine(dsn)

with engine.connect() as conn:
    res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    print([row[0] for row in res])
