@echo off
setlocal enabledelayedexpansion

set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar
set DB_HOST=localhost
set DB_PORT=3307

echo [1/6] Starting Docker containers (mysql + metrics)...
docker compose up -d mysql metrics
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Docker containers.
    pause
    exit /b 1
)

echo [2/6] Waiting for MySQL to become available on port %DB_PORT%...
:wait_for_mysql
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = %DB_PORT%; $tcp = New-Object Net.Sockets.TcpClient; try { $tcp.Connect('%DB_HOST%', $port); $tcp.Close(); exit 0 } catch { exit 1 }"
IF %ERRORLEVEL% NEQ 0 (
    echo Still waiting...
    timeout /T 2 >nul
    goto wait_for_mysql
)
echo ✅ MySQL is up!

echo [3/6] Checking if JAR exists...
IF NOT EXIST "%JAR_FILE%" (
    echo ⚙️ JAR not found. Building...
    pushd %BACKEND_DIR%
    mvn clean package spring-boot:repackage -DskipTests
    popd
) ELSE (
    echo ✅ Found %JAR_FILE%.
)

echo [4/6] Starting Spring Boot app...
java -jar "%JAR_FILE%"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Spring Boot app.
    pause
    exit /b 1
)

echo [5/6] Done.
pause
endlocal
