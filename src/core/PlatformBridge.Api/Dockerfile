FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY PlatformBridge.sln Directory.Build.props ./
COPY src/core/PlatformBridge.Domain/ src/core/PlatformBridge.Domain/
COPY src/core/PlatformBridge.Application/ src/core/PlatformBridge.Application/
COPY src/core/PlatformBridge.Infrastructure/ src/core/PlatformBridge.Infrastructure/
COPY src/core/PlatformBridge.Api/ src/core/PlatformBridge.Api/
RUN dotnet restore src/core/PlatformBridge.Api/PlatformBridge.Api.csproj
RUN dotnet publish src/core/PlatformBridge.Api/PlatformBridge.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app .
COPY contracts/ contracts/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "PlatformBridge.Api.dll"]
