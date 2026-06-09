import pymssql

# Configuración manual basada en appsettings.Development.json
server = "localhost"
port = "1433"
user = "sa"
password = "DevPassword123!"
database = "BioCommerce_Transactional"

def check_schema(table):
    print(f"\n--- Esquema de {table} ---")
    try:
        conn = pymssql.connect(server=server, port=port, user=user, password=password, database=database)
        cursor = conn.cursor()
        cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
        for row in cursor.fetchall():
            print(f"{row[0]} ({row[1]})")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_schema("Products")
check_schema("AbsPermits")
