@echo off
REM CivicFix Python Model Setup Script

echo.
echo ===================================================
echo   CivicFix - Python Pothole Detection Model Setup
echo ===================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo [OK] Python is installed
echo.

REM Install requirements
echo [INFO] Installing Python packages...
echo.
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install requirements
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Setup complete!
echo.
echo Next steps:
echo 1. Prepare your dataset in 'dataset/' folder:
echo    - dataset/pothole/         (put pothole images here)
echo    - dataset/not_pothole/     (put normal road images here)
echo.
echo 2. Train the model:
echo    python pothole_model.py --train --data-dir ./dataset
echo.
echo 3. Test the model:
echo    python pothole_model.py --predict ./test_image.jpg
echo.
echo For more info, see: PYTHON_MODEL_SETUP.md
echo.

pause
