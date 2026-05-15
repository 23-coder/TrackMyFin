# PowerShell script to start the Finance Tracker Backend Server with H2 Database
# This solves database connection issues by using an embedded database

Write-Host "=== Finance Tracker Backend Startup (Development Mode) ===" -ForegroundColor Green
Write-Host ""

function Test-ValidJavaHome([string]$home) {
    return -not [string]::IsNullOrWhiteSpace($home) -and (Test-Path (Join-Path $home "bin\java.exe"))
}

# Normalize JAVA_HOME if it points to a bin folder
if ($env:JAVA_HOME -and (Split-Path -Leaf $env:JAVA_HOME).ToLower() -eq "bin") {
    $env:JAVA_HOME = Split-Path -Parent $env:JAVA_HOME
}

if (-not (Test-ValidJavaHome $env:JAVA_HOME)) {
    Write-Host "JAVA_HOME missing/invalid. Attempting to locate Java installation..." -ForegroundColor Yellow

    $javaCandidates = @(
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Java\jdk-11"
    )

    $installedJdks = Get-ChildItem "C:\Program Files\Java\" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk*" } |
        Sort-Object Name -Descending |
        Select-Object -ExpandProperty FullName

    foreach ($candidate in ($javaCandidates + $installedJdks)) {
        if (Test-ValidJavaHome $candidate) {
            $env:JAVA_HOME = $candidate
            Write-Host "Found Java at: $env:JAVA_HOME" -ForegroundColor Green
            break
        }
    }

    if (-not (Test-ValidJavaHome $env:JAVA_HOME)) {
        Write-Host "Java installation not found. Please install Java JDK 17 or higher." -ForegroundColor Red
        Write-Host "Download from: https://adoptium.net/" -ForegroundColor Cyan
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Check if we're in the right directory
if (-not (Test-Path "pom.xml")) {
    Write-Host "Error: pom.xml not found. Please run this script from the backend directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not $env:SERVER_PORT) {
    $env:SERVER_PORT = "8095"
}

$listener = Get-NetTCPConnection -LocalPort ([int]$env:SERVER_PORT) -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "Port $($env:SERVER_PORT) is already in use. Stop the running process or set SERVER_PORT to another value." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting Finance Tracker Backend with H2 Database..." -ForegroundColor Cyan
Write-Host "- API will be available at: http://localhost:$($env:SERVER_PORT)" -ForegroundColor Yellow
Write-Host "- H2 Database Console: http://localhost:$($env:SERVER_PORT)/h2-console" -ForegroundColor Yellow
Write-Host "- Database URL: jdbc:h2:mem:financeTrackerDB" -ForegroundColor Yellow
Write-Host "- Username: sa (no password)" -ForegroundColor Yellow
Write-Host ""

# Start the application with dev profile
try {
    $env:SPRING_PROFILES_ACTIVE = "dev"
    if (Test-Path ".\mvnw.cmd") {
        .\mvnw.cmd spring-boot:run
    } elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
        mvn spring-boot:run
    } else {
        throw "Maven wrapper not found and 'mvn' is not available on PATH."
    }
} catch {
    Write-Host "Error starting the application: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"