# Download and organize Pothole Detection Dataset from Kaggle

Write-Host "=== Starting Pothole Dataset Download ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if kaggle CLI is installed
Write-Host "Checking Kaggle CLI..." -ForegroundColor Yellow
try {
    $kaggleVersion = kaggle --version 2>&1
    Write-Host "OK: Kaggle CLI found: $kaggleVersion" -ForegroundColor Green
} catch {
    Write-Host "Installing Kaggle CLI..." -ForegroundColor Red
    pip install kaggle
    Write-Host "OK: Kaggle CLI installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check if kaggle.json exists
Write-Host "Checking Kaggle API credentials..." -ForegroundColor Yellow
$kaggleJsonPath = "$env:USERPROFILE\.kaggle\kaggle.json"
if (-not (Test-Path $kaggleJsonPath)) {
    Write-Host "ERROR: kaggle.json not found!" -ForegroundColor Red
    Write-Host "To fix this:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://www.kaggle.com/settings/account" -ForegroundColor Cyan
    Write-Host "   2. Click 'Create New API Token'" -ForegroundColor Cyan
    Write-Host "   3. Extract the zip file" -ForegroundColor Cyan
    Write-Host "   4. Place kaggle.json in: $kaggleJsonPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "OK: Kaggle credentials found" -ForegroundColor Green
}

Write-Host ""

# Step 3: Create dataset directory
Write-Host "Creating dataset directory..." -ForegroundColor Yellow
$datasetDir = "dataset"
if (-not (Test-Path $datasetDir)) {
    New-Item -ItemType Directory -Path $datasetDir | Out-Null
    Write-Host "OK: Created $datasetDir" -ForegroundColor Green
} else {
    Write-Host "OK: Directory already exists: $datasetDir" -ForegroundColor Green
}

Write-Host ""

# Step 4: Download dataset
Write-Host "Downloading dataset from Kaggle..." -ForegroundColor Yellow
Write-Host "   Dataset: atulyakumar98/pothole-detection-dataset" -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

try {
    # Change to dataset directory
    Push-Location $datasetDir
    
    # Download the dataset
    kaggle datasets download -d atulyakumar98/pothole-detection-dataset -q
    
    # Check if download was successful
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Download failed. Check your Kaggle credentials." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "OK: Dataset downloaded successfully" -ForegroundColor Green
    Write-Host ""
    
    # Step 5: Extract zip file
    Write-Host "Extracting dataset..." -ForegroundColor Yellow
    
    # Find the zip file
    $zipFile = Get-ChildItem -Filter "*.zip" -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($zipFile) {
        Write-Host "   Found: $($zipFile.Name)" -ForegroundColor Cyan
        Expand-Archive -Path $zipFile.FullName -Force
        Write-Host "OK: Extraction complete" -ForegroundColor Green
        Write-Host ""
        
        # Remove zip file
        Remove-Item -Path $zipFile.FullName -Force
        Write-Host "Cleaned up zip file" -ForegroundColor Gray
    }
    
    Pop-Location
    
} catch {
    Write-Host "ERROR: Error during download: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""

# Step 6: Verify dataset structure
Write-Host "Verifying dataset structure..." -ForegroundColor Yellow
Write-Host ""

$datasetPath = Join-Path (Get-Location) $datasetDir

# Check what's in the dataset directory
$contents = Get-ChildItem -Path $datasetPath -Force | Where-Object { $_.Name -ne ".DS_Store" }

Write-Host "Dataset contents:" -ForegroundColor Cyan
foreach ($item in $contents) {
    if ($item.PSIsContainer) {
        $fileCount = (Get-ChildItem -Path $item.FullName -Recurse -File).Count
        Write-Host "   DIR: $($item.Name) ($fileCount files)" -ForegroundColor White
    } else {
        Write-Host "   FILE: $($item.Name)" -ForegroundColor White
    }
}

Write-Host ""

# Step 7: Organize into pothole/not_pothole if needed
Write-Host "Checking if reorganization is needed..." -ForegroundColor Yellow

$potholeDir = Join-Path $datasetPath "pothole"
$notPotholeDir = Join-Path $datasetPath "not_pothole"

if ((Test-Path $potholeDir) -and (Test-Path $notPotholeDir)) {
    Write-Host "OK: Dataset already organized in pothole/not_pothole folders" -ForegroundColor Green
    
    $potholeCount = (Get-ChildItem -Path $potholeDir -File).Count
    $notPotholeCount = (Get-ChildItem -Path $notPotholeDir -File).Count
    
    Write-Host "   Pothole images: $potholeCount" -ForegroundColor Cyan
    Write-Host "   Non-pothole images: $notPotholeCount" -ForegroundColor Cyan
} else {
    Write-Host "INFO: Manual organization may be needed" -ForegroundColor Yellow
    Write-Host "   Expected structure:" -ForegroundColor Gray
    Write-Host "   dataset/" -ForegroundColor Gray
    Write-Host "   +-- pothole/ (all pothole images)" -ForegroundColor Gray
    Write-Host "   +-- not_pothole/ (all road/non-pothole images)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== SUCCESS: Dataset ready ===" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEP: Train the model" -ForegroundColor Cyan
Write-Host "   Run: python pothole_model.py --train --data-dir ./dataset --epochs 25" -ForegroundColor Gray
Write-Host ""
