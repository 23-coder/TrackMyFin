# PowerShell script to start the Finance Tracker development server
# Run this script from the finance-tracker directory

Write-Host "Starting Finance Tracker Development Server..." -ForegroundColor Green
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "Found package.json - starting React development server..." -ForegroundColor Green
    npm start
} else {
    Write-Host "Error: package.json not found in current directory" -ForegroundColor Red
    Write-Host "Please navigate to the finance-tracker directory and run this script" -ForegroundColor Yellow
    Write-Host "Current files:" -ForegroundColor Yellow
    Get-ChildItem | Format-Table Name, Length, LastWriteTime
}