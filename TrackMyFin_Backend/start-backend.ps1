# PowerShell script to start the Finance Tracker Backend Server
# Run this script from the backend directory

Write-Host "=== Finance Tracker Backend Startup ===" -ForegroundColor Green
Write-Host ""

function Test-ValidJavaHome([string]$home) {
    return -not [string]::IsNullOrWhiteSpace($home) -and (Test-Path (Join-Path $home "bin\java.exe"))
}

# Normalize and resolve JAVA_HOME
if ($env:JAVA_HOME -and (Split-Path -Leaf $env:JAVA_HOME).ToLower() -eq "bin") {
    $env:JAVA_HOME = Split-Path -Parent $env:JAVA_HOME
}

if (-not (Test-ValidJavaHome $env:JAVA_HOME)) {
    Write-Host "JAVA_HOME missing/invalid. Attempting to locate Java installation..." -ForegroundColor Yellow

    $preferred = @(
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Java\jdk-11"
    )

    $installed = Get-ChildItem "C:\Program Files\Java\" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "jdk*" } |
        Sort-Object Name -Descending |
        Select-Object -ExpandProperty FullName

    foreach ($path in ($preferred + $installed)) {
        if (Test-ValidJavaHome $path) {
            $env:JAVA_HOME = $path
            break
        }
    }
}

if (-not (Test-ValidJavaHome $env:JAVA_HOME)) {
    Write-Host "Java installation not found. Please install Java JDK 21." -ForegroundColor Red
    Write-Host "Download from: https://adoptium.net/" -ForegroundColor Cyan
    exit 1
}

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Check current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "pom.xml")) {
    Write-Host "Error: pom.xml not found in current directory" -ForegroundColor Red
    Write-Host "Please navigate to the backend directory:" -ForegroundColor Yellow
    Write-Host "cd 'C:\Users\Sameer\Desktop\Finance Tracker UI\Finance\finance-tracker'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Current files in directory:" -ForegroundColor Yellow
    Get-ChildItem | Format-Table Name, Length, LastWriteTime
    exit 1
}

Write-Host "✅ Found pom.xml - in correct backend directory" -ForegroundColor Green

# Choose Maven command (wrapper first, fallback to installed mvn)
$mavenCommand = $null
if (Test-Path ".\mvnw.cmd") {
    $mavenCommand = ".\mvnw.cmd"
    Write-Host "Found Maven wrapper" -ForegroundColor Green
} elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
    $mavenCommand = "mvn"
    Write-Host "Using Maven from PATH" -ForegroundColor Green
} else {
    Write-Host "Maven wrapper not found and 'mvn' is not available on PATH." -ForegroundColor Red
    exit 1
}

# Check if MySQL is running (optional check)
Write-Host ""
Write-Host "🔍 Checking MySQL connection..." -ForegroundColor Yellow
try {
    # Simple test to see if port 3306 is open
    $connection = Test-NetConnection -ComputerName "localhost" -Port 3306 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ MySQL appears to be running on localhost:3306" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MySQL may not be running on localhost:3306" -ForegroundColor Yellow
        Write-Host "   Make sure MySQL is started and database 'financeTrackerDB' exists" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check MySQL status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting Spring Boot application..." -ForegroundColor Green
Write-Host "   Backend will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Start the Spring Boot application
try {
    & $mavenCommand spring-boot:run
} catch {
    Write-Host ""
    Write-Host "❌ Failed to start backend server" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure MySQL is running" -ForegroundColor White
    Write-Host "2. Verify database 'financeTrackerDB' exists" -ForegroundColor White
    Write-Host "3. Check application.properties for correct DB credentials" -ForegroundColor White
    Write-Host "4. Ensure Java 21 is installed" -ForegroundColor White
    exit 1
}