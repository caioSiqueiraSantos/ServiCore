# ==============================================================================
# ServiCore Backend - Production Dockerfile (Multi-stage build)
# ==============================================================================

# Estágio 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia os arquivos de projeto primeiro para cache eficiente de camadas de restore
COPY ["src/ServiCore.Domain/ServiCore.Domain.csproj", "src/ServiCore.Domain/"]
COPY ["src/ServiCore.Application/ServiCore.Application.csproj", "src/ServiCore.Application/"]
COPY ["src/ServiCore.Infrastructure/ServiCore.Infrastructure.csproj", "src/ServiCore.Infrastructure/"]
COPY ["src/ServiCore.Api/ServiCore.Api.csproj", "src/ServiCore.Api/"]

RUN dotnet restore "src/ServiCore.Api/ServiCore.Api.csproj"

# Copia todo o código-fonte restante
COPY . .

# Compila e publica em modo Release otimizado
WORKDIR "/app/src/ServiCore.Api"
RUN dotnet publish "ServiCore.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 2: Imagem Final de Execução (Runtime Enxuto)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Define timezone e cultura para padrão pt-BR
ENV TZ=America/Sao_Paulo
ENV LC_ALL=pt_BR.UTF-8
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /app/publish .

# Executa com usuário não-root por segurança (padrão em contêineres .NET 8)
USER app

ENTRYPOINT ["dotnet", "ServiCore.Api.dll"]
