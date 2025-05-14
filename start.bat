@echo off
setlocal

REM === CONFIG ===
set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar

echo [1/4] Starting Docker containers (mysql + metrics)...
docker-compose up -d mysql metrics

REM === Check if JAR exists ===
echo [2/4] Checking for existing app.jar...
IF NOT EXIST "%JAR_FILE%" (
    echo ⚙️ JAR not found. Building...
    cd %BACKEND_DIR%
    mvn clean package spring-boot:repackage -DskipTests
    cd ..
) ELSE (
    echo ✅ JAR already built.
)

REM === Optional wait time for containers to initialize ===
echo [3/4] Waiting 3 seconds for DB to initialize...
timeout /T 3 > NUL

REM === Run the Spring Boot app ===
echo [4/4] Running Spring Boot application...
java -jar %JAR_FILE%

endlocal
