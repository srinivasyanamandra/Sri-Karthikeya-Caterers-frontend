@echo off
REM Deployment Script for Srikarthikeya Caterers
REM Run this script to build and prepare for deployment

echo ========================================
echo Srikarthikeya Caterers - Build Script
echo ========================================
echo.

echo [1/2] Building React application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [2/2] Build completed successfully!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Go to AWS S3 Console
echo 2. Open bucket: srikarthikeyacaterers.in
echo 3. Upload all files from the 'build' folder
echo 4. Go to CloudFront Console
echo 5. Create invalidation with path: /*
echo 6. Wait 2-5 minutes for changes to appear
echo ========================================
echo.
echo Build folder location: %CD%\build
echo.

pause
