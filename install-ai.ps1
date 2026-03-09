# AI Pothole Detection - Installation Script
# Run this script to set up AI features

Write-Host "🤖 CivicFix AI Pothole Detection - Installation Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "backend") -or -not (Test-Path "admin")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Expected folders: backend/, admin/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1: Installing Backend Dependencies..." -ForegroundColor Yellow
Write-Host "-" * 60

Set-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing all backend packages (this may take a few minutes)..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "📦 Updating backend packages..." -ForegroundColor Cyan
    npm install
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Running Database Migration..." -ForegroundColor Yellow
Write-Host "-" * 60

Write-Host "📊 Adding AI verification columns to database..." -ForegroundColor Cyan
node scripts/add-ai-columns.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    Write-Host "   Make sure PostgreSQL is running and .env is configured" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Database migration completed!" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Installing Admin Dashboard Dependencies..." -ForegroundColor Yellow
Write-Host "-" * 60

Set-Location ../admin

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing admin packages..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "📦 Admin packages already installed" -ForegroundColor Cyan
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Admin installation had issues, but continuing..." -ForegroundColor Yellow
}

Write-Host "✅ Admin dependencies ready!" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 Installation Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend Server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Admin Dashboard (in new terminal):" -ForegroundColor White
Write-Host "   cd admin" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test AI Verification:" -ForegroundColor White
Write-Host "   - Upload an issue via mobile app" -ForegroundColor Gray
Write-Host "   - Check admin dashboard for AI status" -ForegroundColor Gray
Write-Host "   - Click 'Run AI Verification' to manually verify" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Quick Start:  AI_QUICKSTART.md" -ForegroundColor Gray
Write-Host "   - Full Guide:   AI_DETECTION_GUIDE.md" -ForegroundColor Gray
Write-Host "   - Summary:      IMPLEMENTATION_SUMMARY.md" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Performance Notes:" -ForegroundColor Yellow
Write-Host "   - First AI verification takes 5-10 seconds (model loading)" -ForegroundColor Gray
Write-Host "   - Subsequent verifications take 1-3 seconds" -ForegroundColor Gray
Write-Host "   - Model is cached in memory after first load" -ForegroundColor Gray
Write-Host ""
Write-Host "🐛 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   - Check backend console for detailed AI logs" -ForegroundColor Gray
Write-Host "   - Ensure PostgreSQL is running" -ForegroundColor Gray
Write-Host "   - Verify .env file is configured" -ForegroundColor Gray
Write-Host "   - See AI_DETECTION_GUIDE.md for more help" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy pothole detecting! 🛣️🤖" -ForegroundColor Green
Write-Host ""
