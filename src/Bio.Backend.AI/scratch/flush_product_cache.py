"""
Limpia las claves de cache de productos de Redis para forzar una recarga fresca.
"""

import redis

try:
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)
    r.ping()

    # Borrar todas las keys relacionadas con productos
    patterns = ["products:*", "product:*"]
    total_deleted = 0
    for pattern in patterns:
        keys = r.keys(pattern)
        if keys:
            deleted = r.delete(*keys)
            total_deleted += deleted
            for k in keys:
                print(f"  Borrada: {k}")

    print(f"\nTotal claves eliminadas: {total_deleted}")
    print("Cache de productos limpiada. El backend hara una consulta fresca a la BD.")
except Exception as e:
    print(f"Error conectando a Redis: {e}")
