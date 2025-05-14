@echo off
setlocal enabledelayedexpansion

set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar
set DB_HOST=localhost
set DB_PORT=3307

echo 🔁 Restarting services...

docker compose down

echo [1/6] Building Spring Boot project...
pushd %BACKEND_DIR%
mvn clean package spring-boot:repackage -DskipTests
popd

echo [2/6] Starting Docker containers...
docker compose up -d mysql metrics

echo [3/6] Waiting for MySQL to be available on port %DB_PORT%...
:wait_for_mysql
(
    echo >nul 2>nul < \\%DB_HOST%:%DB_PORT%
) || (
    timeout /T 2 >nul
    goto wait_for_mysql
)
echo ✅ MySQL is up!

echo [4/6] Launching Spring Boot app...
java -jar "%JAR_FILE%"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Spring Boot app failed to start.
    pause
    exit /b 1
)

echo ✅ App is running.
pause
endlocal
