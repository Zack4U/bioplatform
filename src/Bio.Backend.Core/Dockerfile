# ============================================================================
# BioPlatform Backend Core (.NET 8) — multi-stage Dockerfile
# Build context: ./src/Bio.Backend.Core
# Targets:
#   build       — restore + publish (intermediate)
#   runtime     — slim ASP.NET image for production  (compose: target: runtime)
#   development — SDK image with hot reload (dotnet watch)
# ============================================================================

# ── Build ───────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore Bio.API/Bio.API.csproj \
    && dotnet publish Bio.API/Bio.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# ── Runtime (production) ─────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5000
COPY --from=build /app/publish .
EXPOSE 5000
ENTRYPOINT ["dotnet", "Bio.API.dll"]

# ── Development (hot reload) ─────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development
WORKDIR /src
COPY . .
RUN dotnet restore Bio.API/Bio.API.csproj
EXPOSE 5000
CMD ["dotnet", "watch", "run", "--project", "Bio.API/Bio.API.csproj", "--urls", "http://+:5000"]
