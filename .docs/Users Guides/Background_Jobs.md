# Species Bulk Import (Hangfire Job)

## Descripción

El trabajo en segundo plano `SpeciesImportJob` permite la ingesta masiva del catálogo biológico base a la base de datos PostgreSQL (`BioCommerce_Scientific`). Utiliza **Hangfire** apoyado por **Redis** para descargar la carga computacional de los hilos de la API, procesando el archivo CSV de forma asíncrona.

Este proceso está diseñado para poblar la Taxonomía y los Datos Base de las Especies **(No incluye datos geográficos de avistamientos iterativos, los cuales deben reportarse por separado)**.

## Arquitectura y Componentes

1. **API Endpoint (`POST /api/species/import`)**: Recibe el archivo `.csv`, lo guarda temporalmente en el servidor, y despacha un comando MediatR.
2. **MediatR Command (`ImportSpeciesCsvCommand`)**: Invocado por el controlador. Utiliza un adaptador (`IJobEnqueuer`) para encolar el trabajo en Hangfire sin romper la _Clean Architecture_.
3. **Hangfire Worker (`SpeciesImportJob`)**:
    - Instanciado en segundo plano.
    - Lee el CSV en streaming (bajo consumo de memoria) usando `CsvHelper`.
    - Transforma las filas al DTO `SpeciesCsvRecord`.
    - Procesa e inserta en PostgreSQL en bloques transaccionales (chunks de 500 registros) usando el `ISpeciesRepository`.
4. **Almacenamiento (Redis)**: Hangfire utiliza el contenedor de Redis existente (`localhost:6379`) para persistir la cola de trabajos, reintentos y estados.

## Formato del Archivo CSV Requerido

El archivo debe tener extensión `.csv` y contener la siguiente cabecera exacta (en inglés, coincidiendo con el DTO estructurado):

```csv
Kingdom,Phylum,Class,Order,Family,Genus,ScientificName,CommonName,Description,ConservationStatus,TraditionalUses,IsSensitive,ThumbnailUrl
```

### Ejemplo de Fila Válida

```csv
Plantae,Tracheophyta,Magnoliopsida,Asterales,Asteraceae,Espeletia,Espeletia hartwegiana,Frailejon,Planta paramuna vital para la captación de agua,Vulnerable,Medicina y regulación hídrica,true,https://cdn.example.com/frailejon.jpg
```

## Guía de Uso Rápido (Desarrollo)

1. Enciende tu infraestructura Docker: `docker-compose up -d redis postgres sqlserver`.
2. Ejecuta el Backend Core: `dotnet run --project src/Bio.Backend.Core/Bio.API`.
3. Navega a Swagger (`http://localhost:5070/swagger`) y utiliza el endpoint `/api/Species/import` seleccionando tu archivo CSV.
4. El endpoint devolverá un `202 Accepted` con el `JobId`.
5. Monitorea el progreso del trabajo navegando al Dashboard de Hangfire en `http://localhost:5070/hangfire`.

## Consideraciones Legales (Decreto 3016 & Bio-Safety)

- **`IsSensitive`**: Si el biólogo marca esta columna como `true` o `1` en el CSV, el sistema reconocerá a la especie como amenazada o de alto valor estratégico. Todas las futuras entregas de datos geográficos para esta especie **deberán ser enmascaradas** automáticamente por la API ante el público general.
