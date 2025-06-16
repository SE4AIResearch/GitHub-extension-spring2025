@echo off
setlocal enabledelayedexpansion

set BACKEND_DIR=chromeext_backend
set JAR_FILE=%BACKEND_DIR%\target\app.jar
set DB_HOST=localhost
set DB_PORT=3307

echo [1/6] Starting Docker containers (mysql + metrics)...

REM Check if .env file exists, if not create an empty one
IF NOT EXIST "chromeext_metrics\.env" (
    echo .env file not found in chromeext_metrics. Creating an empty one...
    type nul > "chromeext_metrics\.env"
) ELSE (
    echo Found chromeext_metrics\.env.
)

REM Look for OPENAI_API_KEY in .env (and ensure it’s not blank)
set "KEY_VALUE="
set "KEY_FOUND=0"
for /f "usebackq tokens=1* delims==" %%A in ("chromeext_metrics\.env") do (
    if /i "%%A"=="OPENAI_API_KEY" (
        set "KEY_VALUE=%%B"
        set "KEY_FOUND=1"
    )
)

if "%KEY_FOUND%"=="0" (
    echo OPENAI_API_KEY not found in .env
    goto prompt_key
) else (
    if "%KEY_VALUE%"=="" (
        echo OPENAI_API_KEY is blank in .env
        goto prompt_key
    ) else (
        echo OPENAI_API_KEY already set in .env
        goto extract_resources
    )
)


REM Prompt the user for OPENAI_API_KEY
:prompt_key
set /p USER_KEY=Please enter your OpenAI API Key: 
if "%USER_KEY%"=="" (
    echo Enter a non-empty API key.
    goto prompt_key
)

REM Validate the key using curl
echo Validating OpenAI API key...
curl --silent --fail -H "Authorization: Bearer %USER_KEY%" https://api.openai.com/v1/models >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Invalid OpenAI API key. Please try again.
    goto prompt_key
)

REM If OPENAI_API_KEY exists (even as blank), replace it; otherwise append it
powershell -NoProfile -Command ^
  "$path = 'chromeext_metrics\.env';" ^
  "$content = Get-Content $path;" ^
  "if ($content -match '^OPENAI_API_KEY=') {" ^
  "  $content = $content -replace '^OPENAI_API_KEY=.*$', 'OPENAI_API_KEY=%USER_KEY%'" ^
  "} else {" ^
  "  $content += 'OPENAI_API_KEY=%USER_KEY%'" ^
  "}" ^
  "Set-Content $path $content"

echo OPENAI_API_KEY saved to chromeext_metrics\.env.
goto extract_resources


REM Check if resources folder already exists
:extract_resources
    IF EXIST "%BACKEND_DIR%\src\main\resources" (
        echo Resources folder found.
        goto run_compose
    )
    echo Resources folder not found. Attempting OS detection and extraction...

    REM Detect If on Windows
    ver | findstr /I "Windows" >nul
    IF %ERRORLEVEL%==0 (
        echo Detected Windows. Extracting resources_win.zip...
        powershell -NoProfile -Command "Expand-Archive -Path '%BACKEND_DIR%\src\main\resources_win.zip' -DestinationPath '%BACKEND_DIR%\src\main\' -Force"
        goto run_compose
    )

    REM Detect if on macOS (via uname)
    for /f %%i in ('uname') do set "UNAME=%%i"
    IF /I "!UNAME!"=="Darwin" (
        echo Detected macOS. Extracting resources_mac.zip...
        powershell -NoProfile -Command "Expand-Archive -Path '%BACKEND_DIR%/src/main/resources_mac.zip' -DestinationPath '%BACKEND_DIR%/src/main/' -Force"
        goto run_compose
    )

    REM If neither Windows nor macOS
    echo ❌ Unsupported operating system. Only Windows and macOS are supported.
    pause
    exit /b 1

:run_compose
REM Start Docker containers
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

echo [4/6] Waiting 5 seconds before starting Spring Boot app...
call :delay

echo Starting Spring Boot app...
java -jar "%JAR_FILE%"
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start Spring Boot app.
    pause
    exit /b 1
)

echo [5/6] Done.
pause
endlocal
exit /b

:delay
timeout /T 30 >nul
exit /b