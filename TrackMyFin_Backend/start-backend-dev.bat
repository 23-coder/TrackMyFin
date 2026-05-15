@echo off
echo === Finance Tracker Backend Startup (Development Mode) ===
echo.

REM Normalize JAVA_HOME if it incorrectly points to ...\bin
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\java.exe" (
        for %%I in ("%JAVA_HOME%") do set "JAVA_HOME=%%~dpI"
        set "JAVA_HOME=%JAVA_HOME:~0,-1%"
    )
)

REM Resolve JAVA_HOME if missing/invalid (supports jdk-21.x folder names)
if not exist "%JAVA_HOME%\bin\java.exe" (
    for /f "delims=" %%D in ('dir /b /ad "C:\Program Files\Java\jdk*" 2^>nul') do (
        if exist "C:\Program Files\Java\%%D\bin\java.exe" (
            set "JAVA_HOME=C:\Program Files\Java\%%D"
        )
    )
)
if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "C:\Program Files\Java\jdk-21\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
)
if not exist "%JAVA_HOME%\bin\java.exe" (
    if exist "C:\Program Files\Java\jdk-17\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)

:java_found
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo Java installation not found. Please install Java JDK 17 or higher.
    pause
    exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Using JAVA_HOME: %JAVA_HOME%

REM Choose Maven command (wrapper first, fallback to installed mvn)
set "MVN_CMD="
if exist ".\mvnw.cmd" (
    set "MVN_CMD=.\mvnw.cmd"
) else (
    where mvn >nul 2>nul
    if %errorlevel%==0 (
        set "MVN_CMD=mvn"
    ) else (
        echo Maven wrapper not found and 'mvn' is not available on PATH.
        pause
        exit /b 1
    )
)

REM Set development profile to use H2 database
set SPRING_PROFILES_ACTIVE=dev
if "%SERVER_PORT%"=="" set SERVER_PORT=8095

netstat -ano | findstr /r /c:":%SERVER_PORT% .*LISTENING" >nul
if %errorlevel%==0 (
    echo Port %SERVER_PORT% is already in use. Stop that process or set SERVER_PORT to a free port.
    pause
    exit /b 1
)

echo.
echo Starting Finance Tracker Backend with H2 Database...
echo - API will be available at: http://localhost:%SERVER_PORT%
echo - H2 Database Console: http://localhost:%SERVER_PORT%/h2-console
echo - Database URL: jdbc:h2:mem:financeTrackerDB
echo - Username: sa (no password)
echo.

REM Start the application
%MVN_CMD% spring-boot:run

pause