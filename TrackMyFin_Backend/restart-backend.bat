@echo off
echo Restarting Finance Tracker Backend...
echo.

REM Kill any existing Java processes for the backend
taskkill /F /IM java.exe >nul 2>&1

REM Wait a moment
timeout /t 2 >nul

REM Resolve JAVA_HOME dynamically (supports jdk-21.x folder names)
if defined JAVA_HOME (
	if exist "%JAVA_HOME%\java.exe" (
		for %%I in ("%JAVA_HOME%") do set "JAVA_HOME=%%~dpI"
		set "JAVA_HOME=%JAVA_HOME:~0,-1%"
	)
)

if not exist "%JAVA_HOME%\bin\java.exe" (
	for /f "delims=" %%D in ('dir /b /ad "C:\Program Files\Java\jdk*" 2^>nul') do (
		if exist "C:\Program Files\Java\%%D\bin\java.exe" (
			set "JAVA_HOME=C:\Program Files\Java\%%D"
		)
	)
)

if not exist "%JAVA_HOME%\bin\java.exe" (
	echo Java installation not found. Please install Java JDK 21.
	pause
	exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
set SPRING_PROFILES_ACTIVE=dev
if "%SERVER_PORT%"=="" set SERVER_PORT=8095

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

echo Environment:
echo JAVA_HOME: %JAVA_HOME%
echo SPRING_PROFILES_ACTIVE: %SPRING_PROFILES_ACTIVE%
echo.

echo Starting backend in dev profile on port %SERVER_PORT%...
%MVN_CMD% spring-boot:run

pause