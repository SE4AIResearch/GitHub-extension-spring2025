@echo off
setlocal enabledelayedexpansion

REM === CONFIG ===
set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar

echo [1/5] Starting Docker containers (mysql + metrics)...
docker-compose up -d mysql metrics
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Docker containers. Ensure Docker is running and docker-compose is installed.
    pause
    exit /b 1
)

REM === Check for JAR ===
echo [2/5] Checking if %JAR_FILE% exists...
IF NOT EXIST "%JAR_FILE%" (
    echo ⚙️ JAR not found. Building with Maven...
    pushd %BACKEND_DIR%
    mvn clean package spring-boot:repackage -DskipTests
    IF %ERRORLEVEL% NEQ 0 (
        echo ❌ Maven build failed.
        pause
        popd
        exit /b 1
    )
    popd
) ELSE (
    echo ✅ Found %JAR_FILE%.
)

REM === Wait for DB to start ===
echo [3/5] Waiting 5 seconds for Docker containers to warm up...
timeout /T 5 > NUL

REM === Run Spring Boot App ===
echo [4/5] Starting Spring Boot app...
java -jar "%JAR_FILE%"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to run Spring Boot app. Check if Java is installed and app is built properly.
    pause
    exit /b 1
)

REM === Finish ===
echo [5/5] Spring Boot app terminated.
pause
endlocal
