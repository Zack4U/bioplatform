import os
import pymssql
from dotenv import load_dotenv

load_dotenv("../../../.env")

# Configuración manual basada en appsettings.Development.json
server = "localhost"
port = "1433"
user = "sa"
password = "DevPassword123!"
database = "BioCommerce_Transactional"

try:
    conn = pymssql.connect(server=server, port=port, user=user, password=password, database=database)
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
    print([row[0] for row in cursor.fetchall()])
    conn.close()
except Exception as e:
    print(f"Error conectando a SQL Server: {e}")
