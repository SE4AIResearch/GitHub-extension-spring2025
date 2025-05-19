@echo off
setlocal enabledelayedexpansion

set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar
set DB_HOST=localhost
set DB_PORT=3307

echo 🔁 Restarting backend services...

REM Step 1: Stop Docker containers
echo [1/5] Stopping old containers...
docker compose down

REM Step 2: Build Spring Boot project
echo [2/5] Building Spring Boot project...
pushd %BACKEND_DIR%
mvn clean package spring-boot:repackage -DskipTests || (
    echo ❌ Maven build failed.
    pause
    popd
    exit /b 1
)
popd

REM Step 3: Start containers
echo [3/5] Starting Docker containers...
docker compose up -d mysql metrics

REM Step 4: Wait for MySQL to be available
echo [4/5] Waiting for MySQL to be available on port %DB_PORT%...
:waitloop
powershell -Command "$tcp = New-Object Net.Sockets.TcpClient('%DB_HOST%', %DB_PORT%); if ($tcp.Connected) { $tcp.Close(); exit 0 } else { exit 1 }"
IF %ERRORLEVEL% NEQ 0 (
    timeout /T 2 >nul
    goto waitloop
)
echo ✅ MySQL is up!

REM Step 5: Launch Spring Boot
echo [5/5] Starting Spring Boot app...
start "" java -jar "%JAR_FILE%"
echo ✅ Backend launched in new window.

endlocal