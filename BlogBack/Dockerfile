# Alpine-only images (project requirement). Multi-stage, non-root runtime.
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

COPY Blog/Blog.csproj Blog/
COPY BusinessLogicLayer/BusinessLogicLayer.csproj BusinessLogicLayer/
COPY DataAccessLayer/DataAccessLayer.csproj DataAccessLayer/
COPY SharedLayer/SharedLayer.csproj SharedLayer/
RUN dotnet restore Blog/Blog.csproj

COPY Blog/ Blog/
COPY BusinessLogicLayer/ BusinessLogicLayer/
COPY DataAccessLayer/ DataAccessLayer/
COPY SharedLayer/ SharedLayer/
RUN dotnet publish Blog/Blog.csproj -c Release -o /app/publish --nologo

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
COPY --from=build /app/publish .

# curl is only installed for the container health probe (see docker-compose.yml).
RUN apk add --no-cache curl

# PORT is the platform-assigned listen port (Railway/Render/Fly inject it).
ENV PORT=8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# The runtime runs as the non-root "app" user shipped in the .NET 8 images.
USER app

ENTRYPOINT ["/bin/sh", "-c", "export ASPNETCORE_URLS=\"http://0.0.0.0:${PORT:-8080}\" && exec dotnet Blog.dll"]
