@echo off
setlocal enabledelayedexpansion

REM === CONFIG ===
set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar

echo [1/6] Shutting down Docker containers...
docker-compose down
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to shut down Docker containers.
    pause
    exit /b 1
)

echo [2/6] Cleaning and rebuilding Spring Boot project...
pushd %BACKEND_DIR%
mvn clean package spring-boot:repackage -DskipTests
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Maven build failed.
    pause
    popd
    exit /b 1
)
popd

echo [3/6] Starting Docker containers (mysql + metrics)...
docker-compose up -d mysql metrics
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Docker containers.
    pause
    exit /b 1
)

echo [4/6] Waiting for services to warm up...
timeout /T 5 > NUL

echo [5/6] Checking built JAR: %JAR_FILE%
IF NOT EXIST "%JAR_FILE%" (
    echo ❌ JAR file not found: %JAR_FILE%
    pause
    exit /b 1
)

echo [6/6] Running Spring Boot application...
java -jar "%JAR_FILE%"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Spring Boot app.
    pause
    exit /b 1
)

echo ✅ Restart complete. Spring Boot app terminated normally.
pause
endlocal
