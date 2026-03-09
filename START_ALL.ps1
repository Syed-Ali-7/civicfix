# CivicFix Complete Startup Script
# This script starts all services: Backend, Mobile, and Admin Dashboard

Write-Host "🚀 CivicFix Startup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Define paths
$rootPath = "d:\CivicFix (With AI)"
$backendPath = "$rootPath\backend"
$mobilePath = "$rootPath\mobile"
$adminPath = "$rootPath\admin"

Write-Host "📁 Project Root: $rootPath" -ForegroundColor Yellow
Write-Host ""

# Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

$missingDeps = @()

if (-not (Test-Path "$backendPath\node_modules")) {
    $missingDeps += "Backend"
}
if (-not (Test-Path "$mobilePath\node_modules")) {
    $missingDeps += "Mobile"
}
if (-not (Test-Path "$adminPath\node_modules")) {
    $missingDeps += "Admin"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "⚠️  Missing node_modules for: $($missingDeps -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Installing dependencies..." -ForegroundColor Yellow
    
    foreach ($dep in $missingDeps) {
        switch ($dep) {
            "Backend" {
                Write-Host "  Installing Backend..." -ForegroundColor Gray
                Push-Location $backendPath
                npm install
                Pop-Location
            }
            "Mobile" {
                Write-Host "  Installing Mobile..." -ForegroundColor Gray
                Push-Location $mobilePath
                npm install
                Pop-Location
            }
            "Admin" {
                Write-Host "  Installing Admin..." -ForegroundColor Gray
                Push-Location $adminPath
                npm install
                Pop-Location
            }
        }
    }
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    Write-Host ""
}

# Prepare terminals
Write-Host "🎯 Starting services..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Service Startup Plan:" -ForegroundColor Yellow
Write-Host "  1️⃣  Backend API    (Terminal 1): http://10.177.194.179:5000" -ForegroundColor Gray
Write-Host "  2️⃣  Mobile App     (Terminal 2): Expo on LAN" -ForegroundColor Gray
Write-Host "  3️⃣  Admin UI       (Terminal 3): http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Function to open terminal with command
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$TerminalNumber
    )
    
    Write-Host "Opening Terminal $TerminalNumber for $Name..." -ForegroundColor Cyan
    
    $command = "cd '$Path'; $Command"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Write-Host "✅ Terminal $TerminalNumber started" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

# Start all services
Start-Service -Name "Backend API" -Path $backendPath -Command "npm run dev" -TerminalNumber 1
Start-Service -Name "Mobile App" -Path $mobilePath -Command "npx expo start --lan" -TerminalNumber 2
Start-Service -Name "Admin Dashboard" -Path $adminPath -Command "npm run dev" -TerminalNumber 3

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Yellow
Write-Host "   Backend API:        http://10.177.194.179:5000" -ForegroundColor Cyan
Write-Host "   Admin Dashboard:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Mobile App:         Scan QR from Expo terminal" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Keep all 3 terminals open while developing" -ForegroundColor Gray
Write-Host "   • Backend restarts automatically on code changes (nodemon)" -ForegroundColor Gray
Write-Host "   • Mobile refreshes automatically on code changes" -ForegroundColor Gray
Write-Host "   • Admin refreshes automatically on code changes (Vite)" -ForegroundColor Gray
Write-Host ""
Write-Host "🧠 To train AI model:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   node train-model.js --data-dir ../data/potholes" -ForegroundColor Cyan
Write-Host ""
Write-Host "❓ For help, see: COMPLETE_SETUP_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
