@echo off
REM Set JAVA_HOME to common Java installation paths
if exist "C:\Program Files\Java\jdk-21" (
    set JAVA_HOME=C:\Program Files\Java\jdk-21
) else if exist "C:\Program Files\Java\jdk-17" (
    set JAVA_HOME=C:\Program Files\Java\jdk-17
) else if exist "C:\Program Files\Java\jdk-11" (
    set JAVA_HOME=C:\Program Files\Java\jdk-11
) else if exist "C:\Program Files\Java\jdk1.8.0_*" (
    for /d %%i in ("C:\Program Files\Java\jdk1.8.0_*") do set JAVA_HOME=%%i
) else (
    echo Java installation not found in standard locations
    echo Please install Java or set JAVA_HOME manually
    pause
    exit /b 1
)

echo Using JAVA_HOME: %JAVA_HOME%
echo Starting Finance Tracker Backend...

REM Start the Spring Boot application
.\mvnw.cmd spring-boot:run

pause